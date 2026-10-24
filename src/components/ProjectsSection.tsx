import { siteContent } from '../content/site.ts'

export function ProjectsSection() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="bg-[var(--hero-bg-from)] px-6 py-24 text-[var(--hero-text)]"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2
            id="projects-title"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {siteContent.projects.title}
          </h2>
          <p className="text-pretty text-base text-[var(--hero-text-muted)] sm:text-lg">
            {siteContent.projects.description}
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {siteContent.projects.items.map((project) => (
            <li key={project.name} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-[var(--card-border-hover)] hover:shadow-[var(--card-shadow-hover)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <div className="aspect-[16/10] overflow-hidden bg-[var(--card-image-bg)]">
                  <img
                    src={`${import.meta.env.BASE_URL}${project.screenshot}`}
                    alt={`${project.name}的项目截图`}
                    width={1200}
                    height={750}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {project.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--hero-text-muted)]">
                    {project.description}
                  </p>
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`打开 ${project.name} 的 GitHub 仓库（新标签页）`}
                    className="mt-auto inline-flex min-h-11 items-center gap-1 self-start rounded-md text-sm font-medium text-[var(--card-link)] hover:text-[var(--card-link-hover)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hero-focus-ring)]"
                  >
                    GitHub 仓库
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
