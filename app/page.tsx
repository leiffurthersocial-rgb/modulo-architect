import Link from 'next/link';
import { HeroIllustration } from '@/components/landing/HeroIllustration';
import { LandingActions } from '@/components/landing/LandingActions';
import { RecentProjects } from '@/components/landing/RecentProjects';
import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { Wordmark } from '@/components/ui/Logo';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { TEMPLATE_LIST } from '@/core/templates/meta';

export default function Landing() {
  return (
    <TooltipProvider>
      <div className="min-h-full">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Wordmark />
          <nav className="flex items-center gap-1 text-sm text-fg-muted">
            <a
              href="https://github.com/leiffurthersocial-rgb/modulo-architect"
              className="rounded-md px-2.5 py-1.5 hover:bg-hover hover:text-fg"
            >
              Source
            </a>
            <ThemeToggle />
          </nav>
        </header>

        <main className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-6 md:grid-cols-[1fr_1.15fr] md:pt-14">
          <div className="flex flex-col gap-7">
            <h1 className="text-[clamp(2.1rem,4.6vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
              Sketch a plan.
              <br />
              <span className="text-fg-subtle">Walk through your house.</span>
            </h1>
            <p className="max-w-md text-[17px] leading-relaxed text-fg-muted">
              Draw rooms, raise walls, add a roof, furnish every corner and step inside. A calm, precise house
              planner that runs entirely in your browser.
            </p>
            <LandingActions />
            <RecentProjects />
          </div>
          <div className="relative -mx-4 md:mx-0">
            <HeroIllustration />
          </div>
        </main>

        <section className="mx-auto max-w-6xl px-6 pb-20" aria-labelledby="templates-heading">
          <h2
            id="templates-heading"
            className="mb-4 text-xs font-medium uppercase tracking-[0.08em] text-fg-subtle"
          >
            Start from a template
          </h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {TEMPLATE_LIST.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/editor?template=${t.id}`}
                  data-testid={`template-${t.id}`}
                  className="group flex h-full flex-col gap-3 rounded-[16px] border border-line bg-panel-solid p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-panel"
                >
                  <TemplateGlyph id={t.id} />
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-fg-subtle">{t.description}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 pb-8 text-xs text-fg-subtle">
          <span>No account. Your projects stay in this browser until you export or share them.</span>
          <span>Press ? in the editor for shortcuts.</span>
        </footer>
      </div>
    </TooltipProvider>
  );
}

function TemplateGlyph({ id }: { id: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  return (
    <svg
      viewBox="0 0 80 48"
      className="h-12 w-20 text-fg-muted transition-colors group-hover:text-accent"
      aria-hidden
    >
      {id === 'empty' && <rect x="6" y="6" width="68" height="36" rx="2" {...common} strokeDasharray="3 3" />}
      {id === 'studio' && (
        <>
          <rect x="18" y="8" width="44" height="32" {...common} />
          <path d="M18 30h14v10" {...common} />
        </>
      )}
      {id === 'two-bedroom' && (
        <>
          <rect x="8" y="6" width="64" height="36" {...common} />
          <path d="M34 6v36M34 24h38M52 24v18" {...common} />
        </>
      )}
      {id === 'two-storey' && (
        <>
          <rect x="14" y="16" width="52" height="26" {...common} />
          <path d="M10 18 40 4l30 14" {...common} />
          <path d="M14 29h52M34 29v13" {...common} />
        </>
      )}
    </svg>
  );
}
