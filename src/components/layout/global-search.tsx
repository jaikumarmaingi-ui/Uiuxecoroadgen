"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, FileText, CornerDownLeft } from "lucide-react";
import { runGlobalSearch, type SearchResult } from "@/lib/search";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const results = runGlobalSearch(query);

  function closeSearch() {
    setOpen(false);
    setQuery("");
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") closeSearch();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  function go(r: SearchResult) {
    router.push(r.href);
    closeSearch();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full min-w-0 max-w-md items-center gap-2.5 rounded-lg border border-hairline-strong bg-white/[0.03] px-3 py-2 text-left text-sm text-text-tertiary transition-colors hover:border-cyan/30 hover:text-text-secondary"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Search roads, segments, KM, reports…</span>
        <kbd className="hidden shrink-0 rounded border border-hairline-strong bg-white/[0.04] px-1.5 py-0.5 font-mono-tech text-[10px] text-text-tertiary sm:block">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 px-4 pt-[12vh]" onClick={closeSearch}>
          <div
            className="glass-panel w-full max-w-xl rounded-xl border border-hairline-strong shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-hairline px-4 py-3.5">
              <Search className="h-4 w-4 text-cyan" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "Srinagar Leh KM 220" or "sustainability report"'
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
              />
              <kbd className="rounded border border-hairline-strong bg-white/[0.04] px-1.5 py-0.5 font-mono-tech text-[10px] text-text-tertiary">
                ESC
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {query.trim() === "" && (
                <div className="px-3 py-6 text-center text-xs text-text-tertiary">
                  Search across road segments, KM markers, regions and report types.
                </div>
              )}
              {query.trim() !== "" && results.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-text-tertiary">No results for &ldquo;{query}&rdquo;.</div>
              )}
              {results.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => go(r)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/[0.05]",
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-cyan">
                    {r.type === "Road Segment" ? <MapPin className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-primary">{r.title}</span>
                    <span className="block truncate text-xs text-text-tertiary">{r.subtitle}</span>
                  </span>
                  <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
