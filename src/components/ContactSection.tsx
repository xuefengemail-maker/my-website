import { siteContent } from '../content/site.ts'

export function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="flex min-h-svh flex-col items-center justify-center bg-[var(--hero-bg-from)] px-6 py-24 text-center text-[var(--hero-text)]"
    >
      <div className="flex max-w-3xl flex-col items-center gap-4">
        <h2
          id="contact-title"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        >
          {siteContent.contact.title}
        </h2>
        <p className="text-pretty text-base text-[var(--hero-text-muted)] sm:text-lg">
          {siteContent.contact.description}
        </p>
      </div>
    </section>
  )
}
