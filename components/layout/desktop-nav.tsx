import Link from 'next/link';
import type { NavGroup, NavLink } from './nav-links';

/** Mỗi nhóm category là một mục menu, hover ra danh sách con. */
export function DesktopNav({
  groups,
  staticLinks,
}: {
  groups: NavGroup[];
  staticLinks: NavLink[];
}) {
  return (
    <nav aria-label="Menu chính" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {staticLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken"
            >
              {link.label}
            </Link>
          </li>
        ))}

        {groups.map((group) => (
          <li key={group.group} className="group relative">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-ink transition-colors group-hover:bg-surface-sunken"
              aria-haspopup="true"
            >
              {group.label}
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" strokeLinecap="round" />
              </svg>
            </button>

            <div className="invisible absolute left-0 z-40 pt-1 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <ul className="flex min-w-52 flex-col gap-0.5 rounded-xl border border-border bg-surface p-2 shadow-card">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
