"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";
import {
  Package,
  Users,
  Search,
  Megaphone,
  Image,
  FileText,
  Presentation,
  CheckCircle2,
  Circle,
  Orbit,
  Menu,
  X,
} from "lucide-react";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Package,
  Users,
  Search,
  Megaphone,
  Image,
  FileText,
  Presentation,
};

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto">
      <p className="px-2 mb-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
        Flujo de marketing
      </p>
      <ul className="flex flex-col gap-1">
        {MODULES.map((mod) => {
          const href = `/module/${mod.slug}`;
          const isActive = pathname === href;
          return (
            <li key={mod.id}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                  isActive
                    ? "bg-emerald-600/15 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0 transition-colors",
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
                  )}
                >
                  {mod.order}
                </span>
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium truncate", isActive && "text-emerald-300")}>
                    {mod.title}
                  </p>
                  <p className="text-[11px] text-slate-600 truncate">{mod.description}</p>
                </div>
                {mod.status === "completed" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-auto" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 group">
      <div className="p-1.5 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 transition-colors">
        <Orbit className="w-5 h-5 text-white" />
      </div>
      <div>
        <span className="text-lg font-bold text-white tracking-tight">Orbi</span>
        <span className="block text-[10px] text-slate-500 leading-none -mt-0.5">by Life26</span>
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen flex-col bg-slate-950 border-r border-slate-800">
        <div className="px-5 py-5 border-b border-slate-800">
          <Logo />
        </div>
        <NavItems />
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-600">Life26 · 2026</p>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile drawer backdrop ──────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────────── */}
      <div
        className={cn(
          "md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col bg-slate-950 border-r border-slate-800",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <NavItems onNavigate={() => setOpen(false)} />
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-600">Life26 · 2026</p>
        </div>
      </div>
    </>
  );
}
