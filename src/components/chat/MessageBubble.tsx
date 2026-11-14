import type { ChatMessage } from '../../lib/chatApi.ts'
import { MarkdownContent } from './MarkdownContent.tsx'
import { StreamingIndicator } from './StreamingIndicator.tsx'

type MessageBubbleProps = {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isStreaming = message.status === 'streaming'

  return (
    <article className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={isUser ? 'max-w-[88%] sm:max-w-[75%]' : 'w-full max-w-[92%] sm:max-w-[80%]'}>
        <p
          className={
            isUser
              ? 'mb-1 text-right text-[11px] font-semibold text-[var(--dashboard-muted)]'
              : 'mb-1 text-left text-[11px] font-semibold text-[var(--dashboard-muted)]'
          }
        >
          {isUser ? '你' : 'StudyPal'}
        </p>
        <div
          aria-live={isUser ? undefined : 'polite'}
          className={
            isUser
              ? 'rounded-3xl rounded-br-md bg-[var(--dashboard-accent)] px-4 py-3 text-sm text-[var(--dashboard-accent-contrast)] shadow-sm'
              : 'rounded-3xl rounded-bl-md border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-4 py-3 text-sm text-[var(--dashboard-text)] shadow-sm'
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
          {!isUser && isStreaming ? <StreamingIndicator /> : null}
          {!isUser && message.status === 'failed' ? (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">回复中断，可重试</p>
          ) : null}
        </div>
      </div>
    </article>
  )
}
