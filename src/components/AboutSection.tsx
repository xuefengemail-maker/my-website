import { siteContent } from '../content/site.ts'

export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="bg-[var(--hero-bg-from)] px-6 py-24 text-[var(--hero-text)]"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-16">
          <div className="mx-auto w-full max-w-sm md:max-w-none">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-[var(--about-photo-border)] bg-[var(--about-photo-bg)]">
              <img
                src={`${import.meta.env.BASE_URL}${siteContent.about.photo.src}`}
                alt={siteContent.about.photo.alt}
                width={800}
                height={1000}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2
              id="about-title"
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {siteContent.about.title}
            </h2>
            {siteContent.about.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-pretty text-base leading-relaxed text-[var(--hero-text-muted)] sm:text-lg"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
        <p className="inline-flex w-fit items-center rounded-full border border-[var(--about-badge-border)] bg-[var(--about-badge-bg)] px-4 py-2 text-sm font-medium text-[var(--about-badge-text)]">
          {siteContent.about.brand}
        </p>
      </div>
    </section>
  )
}
