import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth.ts'
import { ApiError } from '../../lib/apiClient.ts'
import {
  createConversation,
  getChatProfile,
  getConversationHistory,
  listConversations,
  streamChat,
  type ChatConversation,
  type ChatMessage,
  type ChatProfile,
} from '../../lib/chatApi.ts'
import { buildLearningContext } from '../../lib/learningContext.ts'
import { DashboardIcon } from '../dashboard/DashboardIcon.tsx'
import { ChatComposer } from './ChatComposer.tsx'
import { ChatErrorBanner } from './ChatErrorBanner.tsx'
import { ChatHeader } from './ChatHeader.tsx'
import { ChatMessageList } from './ChatMessageList.tsx'

function chatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return '登录已过期，请重新登录'
    }
    if (error.status === 404) {
      return '会话不存在，请刷新页面后重试'
    }
    if (error.status === 409) {
      return '上一条回复仍在生成，请稍后再试'
    }
    if (error.status === 422) {
      return '消息格式不正确，请检查后重试'
    }
    if (error.status === 503) {
      return 'AI 服务尚未配置，请联系管理员'
    }
    return error.message
  }
  return '网络连接失败，请稍后重试'
}

const starterPrompts = [
  '根据我的学习进度，今天应该先做什么？',
  '帮我制定一个 30 分钟的复习计划',
  '分析我本周的学习节奏并给出建议',
] as const

function EmptyChatState({ onUsePrompt }: { onUsePrompt: (prompt: string) => void }) {
  return (
    <div className="flex h-full min-h-56 flex-col items-center justify-center px-2 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]">
        <DashboardIcon name="chat" className="size-7" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-[var(--dashboard-text)]">开始你的第一段学习对话</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--dashboard-muted)]">
        助手会结合 Profile 与 Dashboard 学习摘要给出建议。摘要可能来自示例 mock 数据，不代表已验证的学习记录。
      </p>
      <div className="mt-5 flex w-full max-w-lg flex-col gap-2">
        {starterPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onUsePrompt(prompt)}
            className="min-h-11 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] px-3 text-left text-sm text-[var(--dashboard-text)] transition-colors hover:border-[var(--dashboard-border-strong)] hover:bg-[var(--dashboard-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] motion-reduce:transition-none"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChatWorkspace() {
  const { authorizedFetch, signOut } = useAuth()
  const [conversation, setConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [profile, setProfile] = useState<ChatProfile | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [lastFailedContent, setLastFailedContent] = useState<string | null>(null)
  const loadRequestRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const loadWorkspace = useCallback(async () => {
    const requestId = ++loadRequestRef.current

    try {
      const [conversations, profileData] = await Promise.all([
        listConversations(authorizedFetch),
        getChatProfile(authorizedFetch),
      ])
      if (requestId !== loadRequestRef.current) {
        return
      }

      setProfile(profileData)
      if (conversations.length === 0) {
        setConversation(null)
        setMessages([])
        return
      }

      const history = await getConversationHistory(authorizedFetch, conversations[0].id)
      if (requestId !== loadRequestRef.current) {
        return
      }
      setConversation(history.conversation)
      setMessages(history.items)
    } catch (error) {
      if (requestId !== loadRequestRef.current) {
        return
      }
      if (error instanceof ApiError && error.status === 401) {
        signOut()
        return
      }
      setHistoryError(chatErrorMessage(error))
    } finally {
      if (requestId === loadRequestRef.current) {
        setIsLoading(false)
      }
    }
  }, [authorizedFetch, signOut])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadWorkspace()
    }, 0)

    return () => {
      window.clearTimeout(timeout)
      loadRequestRef.current += 1
      abortRef.current?.abort()
    }
  }, [loadWorkspace])

  const sendMessage = useCallback(
    async (rawContent: string) => {
      const content = rawContent.trim()
      if (content === '' || isStreaming) {
        return
      }

      setStreamError(null)
      setLastFailedContent(null)
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller
      let activeConversation = conversation
      let started = false
      let assistantMessageId: number | null = null

      try {
        if (activeConversation === null) {
          activeConversation = await createConversation(authorizedFetch)
          setConversation(activeConversation)
        }

        await streamChat(
          authorizedFetch,
          activeConversation.id,
          content,
          buildLearningContext(),
          controller.signal,
          (event) => {
            if (event.type === 'meta') {
              started = true
              assistantMessageId = event.assistantMessageId
              const createdAt = new Date().toISOString()
              setMessages((current) => [
                ...current,
                {
                  id: event.userMessageId,
                  role: 'user',
                  content,
                  status: 'completed',
                  created_at: createdAt,
                },
                {
                  id: event.assistantMessageId,
                  role: 'assistant',
                  content: '',
                  status: 'streaming',
                  created_at: createdAt,
                },
              ])
              setInput('')
              return
            }

            if (event.type === 'delta') {
              if (assistantMessageId === null) {
                return
              }
              const targetId = assistantMessageId
              setMessages((current) =>
                current.map((message) =>
                  message.id === targetId
                    ? { ...message, content: message.content + event.content }
                    : message,
                ),
              )
              return
            }

            if (event.type === 'done') {
              if (assistantMessageId === null) {
                return
              }
              const targetId = assistantMessageId
              setMessages((current) =>
                current.map((message) =>
                  message.id === targetId ? { ...message, status: 'completed' } : message,
                ),
              )
              return
            }

            if (event.type === 'error') {
              setStreamError(event.message)
              setLastFailedContent(content)
              if (assistantMessageId !== null) {
                const targetId = assistantMessageId
                setMessages((current) =>
                  current.map((message) =>
                    message.id === targetId ? { ...message, status: 'failed' } : message,
                  ),
                )
              }
            }
          },
        )

        if (!started) {
          setStreamError('未能开始回复，请稍后重试')
          setLastFailedContent(content)
        }
      } catch (error) {
        if (controller.signal.aborted) {
          setMessages((current) =>
            current.map((message) =>
              message.status === 'streaming' ? { ...message, status: 'failed' } : message,
            ),
          )
          setStreamError('已停止生成')
          setLastFailedContent(content)
          return
        }

        if (error instanceof ApiError && error.status === 401) {
          signOut()
          return
        }

        setStreamError(chatErrorMessage(error))
        setLastFailedContent(content)
        setMessages((current) =>
          current.map((message) =>
            message.status === 'streaming' ? { ...message, status: 'failed' } : message,
          ),
        )
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [authorizedFetch, conversation, isStreaming, signOut],
  )

  const handleSignOut = () => {
    abortRef.current?.abort()
    signOut()
  }

  const retryStream = () => {
    if (lastFailedContent !== null) {
      void sendMessage(lastFailedContent)
    }
  }

  const retryLoadWorkspace = () => {
    setIsLoading(true)
    setHistoryError(null)
    void loadWorkspace()
  }

  const activeError = streamError ?? historyError

  return (
    <section className="mx-auto flex h-full w-full max-w-5xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-5">
      <ChatHeader profile={profile} onSignOut={handleSignOut} />
      <ChatErrorBanner
        message={activeError}
        onRetry={streamError !== null ? retryStream : retryLoadWorkspace}
      />
      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        emptyState={<EmptyChatState onUsePrompt={setInput} />}
      />
      <ChatComposer
        value={input}
        onChange={setInput}
        onSend={() => void sendMessage(input)}
        onStop={() => abortRef.current?.abort()}
        isStreaming={isStreaming}
        disabled={isLoading || historyError !== null}
      />
    </section>
  )
}

export function ChatPage() {
  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--dashboard-bg)] text-[var(--dashboard-text)]">
      <ChatWorkspace />
    </main>
  )
}
