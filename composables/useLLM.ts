import type { LLMModel, LLMProvider } from '~/types'

// Detects provider type from endpoint URL
function detectProvider(endpoint: string): LLMProvider {
  if (endpoint.includes('1234')) return 'lmstudio'
  if (endpoint.includes('11434')) return 'ollama'
  return 'openai-compat'
}

export function useLLM() {
  const endpoint = useLocalStorage('llm_endpoint', 'http://localhost:11434')
  const provider = computed(() => detectProvider(endpoint.value))

  async function listModels(): Promise<LLMModel[]> {
    const ep = endpoint.value.replace(/\/$/, '')
    try {
      if (provider.value === 'ollama') {
        const res = await fetch(`${ep}/api/tags`)
        if (!res.ok) throw new Error('Ollama unreachable')
        const data = await res.json() as { models: { name: string }[] }
        return (data.models ?? []).map(m => ({
          id: m.name,
          name: m.name,
          provider: 'ollama',
        }))
      }
      // OpenAI-compat (LM Studio, Jan, etc.)
      const res = await fetch(`${ep}/v1/models`)
      if (!res.ok) throw new Error('Endpoint unreachable')
      const data = await res.json() as { data: { id: string }[] }
      return (data.data ?? []).map(m => ({
        id: m.id,
        name: m.id,
        provider: provider.value,
      }))
    } catch {
      return []
    }
  }

  async function* streamChat(
    model: string,
    messages: { role: string; content: string }[],
  ): AsyncGenerator<string> {
    const ep = endpoint.value.replace(/\/$/, '')
    const url = provider.value === 'ollama'
      ? `${ep}/api/chat`
      : `${ep}/v1/chat/completions`

    const body = provider.value === 'ollama'
      ? { model, messages, stream: true }
      : { model, messages, stream: true }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok || !res.body) throw new Error('LLM stream failed')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        const trimmed = line.replace(/^data: /, '').trim()
        if (!trimmed || trimmed === '[DONE]') continue
        try {
          const json = JSON.parse(trimmed)
          const text: string =
            // Ollama format
            json.message?.content ??
            // OpenAI-compat format
            json.choices?.[0]?.delta?.content ??
            ''
          if (text) yield text
        } catch { /* partial JSON chunk, skip */ }
      }
    }
  }

  return { endpoint, provider, listModels, streamChat }
}
