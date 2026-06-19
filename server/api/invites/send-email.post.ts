import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const { email, inviterName } = await readBody<{ email: string; inviterName: string }>(event)
  const config = useRuntimeConfig()

  const apiKey = config.resendApiKey as string
  if (!apiKey) throw createError({ statusCode: 503, message: 'Email not configured (missing NUXT_RESEND_API_KEY)' })
  if (!email) throw createError({ statusCode: 400, message: 'email required' })

  const appUrl = ((config.public as any).appUrl as string | undefined)?.replace(/\/$/, '') || ''
  const inviteLink = `${appUrl}/login?register=1&email=${encodeURIComponent(email)}`

  const resend = new Resend(apiKey)
  const from = (config.resendFrom as string | undefined) || 'comms <noreply@example.com>'

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `${inviterName} invited you to comms`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px 20px;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#1e293b;border-radius:12px;padding:32px;border:1px solid #334155">
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fff">You're invited to comms</h1>
    <p style="margin:0 0 24px;color:#94a3b8">${inviterName} has invited you to join.</p>
    <a href="${inviteLink}"
       style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px">
      Create your account
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#64748b">
      Or copy this link:<br>
      <a href="${inviteLink}" style="color:#818cf8;word-break:break-all">${inviteLink}</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#475569">
      Sign up using exactly <strong style="color:#94a3b8">${email}</strong> — your access is tied to this address.
    </p>
  </div>
</body>
</html>`,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
