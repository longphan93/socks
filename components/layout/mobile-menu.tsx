'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { NavGroup, NavLink } from './nav-links';

export function MobileMenu({
  groups,
  staticLinks,
}: {
  groups: NavGroup[];
  staticLinks: NavLink[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mở menu"
        aria-expanded={open}
        className="inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-sunken lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />

          <nav
            aria-label="Menu chính"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col gap-6 overflow-y-auto bg-surface p-6 shadow-pop"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Danh mục</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng menu"
                className="-m-1 rounded-full p-1 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <ul className="flex flex-col gap-1">
              {staticLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-2 font-medium text-ink transition-colors hover:bg-surface-sunken"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {groups.map((group) => (
              <div key={group.group} className="flex flex-col gap-1">
                <p className="px-2 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                  {group.label}
                </p>
                <ul className="flex flex-col gap-1">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-2 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
