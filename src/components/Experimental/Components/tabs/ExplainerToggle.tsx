'use client';

import { ReactNode } from 'react';

/** Collapsible "how does it work" section shared by all variable tabs */
export default function ExplainerToggle({ children }: { children: ReactNode }) {
  return (
    <details className="group">
      <summary className="cursor-pointer text-[10px] text-purple-400/70 hover:text-purple-300 transition-colors flex items-center gap-1.5 py-1 select-none">
        <span className="transition-transform group-open:rotate-90">▸</span>
        Comment ça marche ? — l&apos;algorithme pas à pas
      </summary>
      <div className="mt-3 pl-3 border-l-2 border-purple-500/20">{children}</div>
    </details>
  );
}
