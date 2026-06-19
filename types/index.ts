export interface AppUser {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: 'admin' | 'member'
  createdAt: Date
}

export interface Message {
  id: string
  channelId: string
  content: string
  type: 'text' | 'file' | 'image'
  authorId: string
  authorName: string
  authorPhoto?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  r2Key?: string
  createdAt: Date
  reactions: Record<string, string[]>
}

export interface Channel {
  id: string
  name: string
  description?: string
  createdBy: string
  createdAt: Date
  lastMessage?: {
    content: string
    authorName: string
    createdAt: Date
  }
}

export interface FileItem {
  id: string
  name: string
  size: number
  type: string
  r2Key: string
  uploadedBy: string
  uploaderName: string
  uploadedAt: Date
  tags: string[]
}

export interface Note {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  sharedWith: 'all' | string[]
  projectId?: string
  createdAt: Date
  updatedAt: Date
}

export interface QuickLink {
  id: string
  title: string
  url: string
  description?: string
  tags: string[]
  addedBy: string
  addedByName: string
  createdAt: Date
}

export interface Invite {
  email: string
  invitedBy: string
  invitedAt: Date
  status: 'pending' | 'accepted'
}

// ── Projects ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'archived'
  channelId?: string
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectTask {
  id: string
  projectId: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'
  assigneeId?: string
  assigneeName?: string
  order: number
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

// ── Knowledge Base ────────────────────────────────────────────────────────────

export interface KbTopic {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  tags: string[]
  pinned: boolean
  commentCount: number
  createdAt: Date
  updatedAt: Date
}

export interface KbComment {
  id: string
  topicId: string
  parentId: string | null
  content: string
  authorId: string
  authorName: string
  createdAt: Date
  updatedAt: Date
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export type FeedbackType = 'bug' | 'feature' | 'general'

export interface Feedback {
  id: string
  type: FeedbackType
  title: string
  description: string
  authorId: string
  authorName: string
  createdAt: Date
  status: 'open' | 'in-progress' | 'done'
}

// ── LLM ──────────────────────────────────────────────────────────────────────

export type LLMProvider = 'ollama' | 'lmstudio' | 'openai-compat'

export interface LLMModel {
  id: string
  name: string
  provider: LLMProvider
}

export interface LLMSession {
  id: string
  title: string
  model: string
  endpoint: string
  provider: LLMProvider
  authorId: string
  authorName: string
  createdAt: Date
  updatedAt: Date
}

export interface LLMMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model: string
  createdAt: Date
}
