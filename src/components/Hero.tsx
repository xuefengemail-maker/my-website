import { siteContent } from '../content/site.ts'
import { HeroBackground } from './HeroBackground.tsx'

export function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,var(--hero-bg-from),var(--hero-bg-via),var(--hero-bg-to))] px-6 py-24 text-center"
    >
      <HeroBackground />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,var(--hero-scrim),transparent_70%)]"
      />
      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--hero-text-muted)]">
          {siteContent.role}
        </p>
        <h1
          id="hero-title"
          className="text-balance text-4xl font-bold tracking-tight sm:text-6xl"
        >
          {siteContent.name}
        </h1>
        <p className="text-pretty text-base text-[var(--hero-text-muted)] sm:text-lg">
          {siteContent.tagline}
        </p>
        <a
          href={siteContent.ctaHref}
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--hero-cta-bg)] px-6 py-3 font-semibold text-[var(--hero-cta-text)] hover:bg-[var(--hero-cta-bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)]"
        >
          {siteContent.ctaLabel}
        </a>
      </div>
    </section>
  )
}
