import type { ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

function safeHref(href: string | undefined): string | undefined {
  if (href === undefined || href.trim() === '' || href.startsWith('#') || href.startsWith('//')) {
    return undefined
  }

  try {
    const parsed = new URL(href, window.location.origin)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined
    }
    return href
  } catch {
    return undefined
  }
}

function SafeLink({
  href,
  children,
}: ComponentPropsWithoutRef<'a'> & { node?: unknown }) {
  const target = safeHref(href)
  if (target === undefined) {
    return <span>{children}</span>
  }

  const external = target.startsWith('http://') || target.startsWith('https://')
  return (
    <a
      href={target}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="font-medium text-[var(--dashboard-accent-strong)] underline decoration-1 underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  )
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mt-4 text-xl font-bold text-[var(--dashboard-text)]">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-3 text-lg font-bold text-[var(--dashboard-text)]">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 text-base font-semibold text-[var(--dashboard-text)]">{children}</h3>,
  p: ({ children }) => <p className="my-2 leading-relaxed text-[var(--dashboard-text)]">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 text-[var(--dashboard-text)]">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-[var(--dashboard-text)]">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)] px-3 py-2 text-[var(--dashboard-muted)]">
      {children}
    </blockquote>
  ),
  a: SafeLink,
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-') === true
    return (
      <code
        className={
          isBlock
            ? `${className ?? ''} font-mono text-slate-100`
            : 'rounded bg-[var(--dashboard-surface)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--dashboard-accent-strong)]'
        }
      >
        {children}
      </code>
    )
  },
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-[var(--dashboard-border)]">
      <table className="min-w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-[var(--dashboard-border)] px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-[var(--dashboard-border)] px-3 py-2 align-top">{children}</td>,
  hr: () => <hr className="my-4 border-[var(--dashboard-border)]" />,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
}

type MarkdownContentProps = {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="min-w-0 text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
