import { useRef } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

const MAX_MESSAGE_LENGTH = 4000

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  isStreaming: boolean
  disabled: boolean
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
}: ChatComposerProps) {
  const composingRef = useRef(false)
  const canSend = value.trim().length > 0 && !disabled && !isStreaming

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canSend) {
      onSend()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !composingRef.current &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      if (canSend) {
        onSend()
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-3 shadow-[var(--dashboard-shadow)]"
    >
      <label htmlFor="chat-message" className="sr-only">
        输入学习问题
      </label>
      <textarea
        id="chat-message"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => {
          composingRef.current = true
        }}
        onCompositionEnd={() => {
          composingRef.current = false
        }}
        maxLength={MAX_MESSAGE_LENGTH}
        rows={1}
        disabled={disabled || isStreaming}
        placeholder="问一个学习问题，Enter 发送，Shift+Enter 换行"
        className="max-h-40 min-h-12 w-full resize-none overflow-y-auto bg-transparent px-1 py-2 text-sm leading-relaxed text-[var(--dashboard-text)] outline-none placeholder:text-[var(--dashboard-muted)] disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-3 border-t border-[var(--dashboard-border)] pt-2">
        <p className="text-[11px] text-[var(--dashboard-muted)]">
          {value.length > 3600 ? `${value.length}/${MAX_MESSAGE_LENGTH}` : 'AI 建议仅供参考'}
        </p>
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--dashboard-border-strong)] px-4 text-sm font-semibold text-[var(--dashboard-text)] transition-colors hover:bg-[var(--dashboard-surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] motion-reduce:transition-none"
          >
            停止生成
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--dashboard-accent)] px-4 text-sm font-semibold text-[var(--dashboard-accent-contrast)] transition-colors hover:bg-[var(--dashboard-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            发送
          </button>
        )}
      </div>
    </form>
  )
}
