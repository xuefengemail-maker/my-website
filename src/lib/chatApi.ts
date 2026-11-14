import type { AuthorizedFetch } from './apiClient.ts'
import { ApiError, apiErrorFromResponse } from './apiClient.ts'
import { parseSseStream } from './sse.ts'

export type ChatConversation = {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  content: string
  status: 'streaming' | 'completed' | 'failed'
  created_at: string
}

export type ChatProfile = {
  avatar_url: string | null
  streak_days: number
  level: number
}

export type ChatStreamEvent =
  | {
      type: 'meta'
      conversationId: number
      userMessageId: number
      assistantMessageId: number
    }
  | { type: 'delta'; content: string }
  | { type: 'done'; messageId: number; status: 'completed'; createdAt: string }
  | { type: 'error'; code: string; message: string }

type ConversationListResponse = {
  items: ChatConversation[]
}

type ConversationHistoryResponse = {
  conversation: ChatConversation
  items: ChatMessage[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function listConversations(
  authorizedFetch: AuthorizedFetch,
): Promise<ChatConversation[]> {
  const response = await authorizedFetch('/chat/conversations')
  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
  const payload = (await response.json()) as ConversationListResponse
  return payload.items
}

export async function createConversation(
  authorizedFetch: AuthorizedFetch,
): Promise<ChatConversation> {
  const response = await authorizedFetch('/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
  return (await response.json()) as ChatConversation
}

export async function getConversationHistory(
  authorizedFetch: AuthorizedFetch,
  conversationId: number,
): Promise<ConversationHistoryResponse> {
  const response = await authorizedFetch(`/chat/conversations/${conversationId}/messages`)
  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
  return (await response.json()) as ConversationHistoryResponse
}

export async function getChatProfile(authorizedFetch: AuthorizedFetch): Promise<ChatProfile> {
  const response = await authorizedFetch('/users/me/profile')
  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
  return (await response.json()) as ChatProfile
}

function toStreamEvent(event: string, data: unknown): ChatStreamEvent | null {
  if (!isRecord(data)) {
    return null
  }

  if (
    event === 'meta' &&
    typeof data.conversation_id === 'number' &&
    typeof data.user_message_id === 'number' &&
    typeof data.assistant_message_id === 'number'
  ) {
    return {
      type: 'meta',
      conversationId: data.conversation_id,
      userMessageId: data.user_message_id,
      assistantMessageId: data.assistant_message_id,
    }
  }

  if (event === 'delta' && typeof data.content === 'string') {
    return { type: 'delta', content: data.content }
  }

  if (
    event === 'done' &&
    typeof data.message_id === 'number' &&
    data.status === 'completed' &&
    typeof data.created_at === 'string'
  ) {
    return {
      type: 'done',
      messageId: data.message_id,
      status: 'completed',
      createdAt: data.created_at,
    }
  }

  if (
    event === 'error' &&
    typeof data.code === 'string' &&
    typeof data.message === 'string'
  ) {
    return { type: 'error', code: data.code, message: data.message }
  }

  return null
}

export async function streamChat(
  authorizedFetch: AuthorizedFetch,
  conversationId: number,
  content: string,
  learningContext: Record<string, unknown>,
  signal: AbortSignal,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const response = await authorizedFetch(
    `/chat/conversations/${conversationId}/messages/stream`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, learning_context: learningContext }),
      signal,
    },
  )

  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
  if (response.body === null) {
    throw new ApiError(0, '浏览器不支持流式响应')
  }

  await parseSseStream(response.body, (event) => {
    const mapped = toStreamEvent(event.event, event.data)
    if (mapped !== null) {
      onEvent(mapped)
    }
  })
}
