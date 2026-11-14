import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ChatMessage } from '../../lib/chatApi.ts'
import { MessageBubble } from './MessageBubble.tsx'
import { ScrollToBottomButton } from './ScrollToBottomButton.tsx'

type ChatMessageListProps = {
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  emptyState: ReactNode
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function ChatMessageList({
  messages,
  isLoading,
  isStreaming,
  emptyState,
}: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const scrollToBottom = useCallback((behavior?: ScrollBehavior) => {
    const list = listRef.current
    if (list === null) {
      return
    }

    list.scrollTo({
      top: list.scrollHeight,
      behavior: behavior ?? (prefersReducedMotion() ? 'auto' : 'smooth'),
    })
    nearBottomRef.current = true
    setShowScrollButton(false)
  }, [])

  const updateScrollState = useCallback(() => {
    const list = listRef.current
    if (list === null) {
      return
    }

    const distance = list.scrollHeight - list.scrollTop - list.clientHeight
    const nearBottom = distance < 96
    nearBottomRef.current = nearBottom
    setShowScrollButton(!nearBottom && messages.length > 0)
  }, [messages.length])

  useEffect(() => {
    if (nearBottomRef.current) {
      const frame = window.requestAnimationFrame(() =>
        scrollToBottom(isStreaming ? 'auto' : undefined),
      )
      return () => window.cancelAnimationFrame(frame)
    }
    return undefined
  }, [messages, isStreaming, scrollToBottom])

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] shadow-[var(--dashboard-shadow)]">
      <div
        ref={listRef}
        onScroll={updateScrollState}
        role="log"
        aria-label="聊天消息"
        aria-busy={isLoading || isStreaming}
        className="h-full overflow-y-auto px-3 py-4 sm:px-5 sm:py-5"
      >
        {isLoading ? (
          <div className="flex h-full min-h-40 items-center justify-center text-sm text-[var(--dashboard-muted)]">
            正在加载对话…
          </div>
        ) : messages.length === 0 ? (
          emptyState
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
      {showScrollButton ? <ScrollToBottomButton onClick={() => scrollToBottom()} /> : null}
    </div>
  )
}
