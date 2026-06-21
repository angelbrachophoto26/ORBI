"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Info, CheckCircle2, ArrowRight, Lightbulb, ChevronRight, X } from "lucide-react";

const STORAGE_KEY = "orbi_panel_open";

interface ModulePanelProps {
  what: string;
  how: string;
  next: string;
  extra?: React.ReactNode;
  className?: string;
}

function PanelContent({ what, how, next, extra }: Omit<ModulePanelProps, "className">) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-1 rounded-md bg-orbi-primary/10">
            <Info className="w-3.5 h-3.5 text-orbi-accent" />
          </div>
          <span className="text-xs font-semibold text-orbi-accent uppercase tracking-wider">
            ¿Qué hago aquí?
          </span>
        </div>
        <p className="text-sm text-orbi-muted leading-relaxed">{what}</p>
      </div>

      <div className="h-px bg-orbi-border" />

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-1 rounded-md bg-yellow-500/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" />
          </div>
          <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">
            ¿Cómo lo completo?
          </span>
        </div>
        <p className="text-sm text-orbi-muted leading-relaxed">{how}</p>
      </div>

      <div className="h-px bg-orbi-border" />

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-1 rounded-md bg-orbi-primary/10">
            <ArrowRight className="w-3.5 h-3.5 text-orbi-primary" />
          </div>
          <span className="text-xs font-semibold text-orbi-primary uppercase tracking-wider">
            ¿Qué sigue?
          </span>
        </div>
        <p className="text-sm text-orbi-muted leading-relaxed">{next}</p>
      </div>

      {extra && (
        <>
          <div className="h-px bg-orbi-border" />
          {extra}
        </>
      )}
    </div>
  );
}

/* ── Mobile: floating ? button + dropdown ── */
function MobilePanel({ what, how, next, extra }: Omit<ModulePanelProps, "className">) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="fixed top-[66px] right-3 z-30 md:hidden">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all",
          open
            ? "bg-orbi-primary text-white"
            : "bg-orbi-accent text-orbi-primary hover:scale-105"
        )}
        aria-label="Guía del módulo"
      >
        {open ? <X className="w-4 h-4" /> : "?"}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-10 right-0 w-72 max-h-[70vh] overflow-y-auto bg-white border border-orbi-border rounded-xl shadow-xl p-4">
          <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-3">
            Guía del módulo
          </p>
          <PanelContent what={what} how={how} next={next} extra={extra} />
        </div>
      )}
    </div>
  );
}

/* ── Desktop: collapsible sidebar panel ── */
function DesktopPanel({ what, how, next, extra, className }: ModulePanelProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) setOpen(saved === "true");
  }, []);

  function toggle() {
    setOpen((v) => {
      localStorage.setItem(STORAGE_KEY, String(!v));
      return !v;
    });
  }

  return (
    <div
      className={cn(
        "hidden md:block shrink-0 bg-orbi-surface border border-orbi-border rounded-xl transition-all duration-200",
        open ? "p-5" : "p-3",
        className
      )}
    >
      <div className={cn("flex items-center", open ? "justify-between mb-4" : "justify-center")}>
        {open && (
          <span className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest">
            Guía del módulo
          </span>
        )}
        <button
          onClick={toggle}
          className="p-1.5 rounded-md text-orbi-muted hover:text-foreground hover:bg-orbi-card transition-colors"
          title={open ? "Colapsar" : "Expandir"}
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {!open && (
        <div className="flex flex-col items-center gap-3 py-1">
          <Info className="w-4 h-4 text-orbi-accent" />
          <CheckCircle2 className="w-4 h-4 text-yellow-500" />
          <ArrowRight className="w-4 h-4 text-orbi-muted" />
        </div>
      )}

      {open && <PanelContent what={what} how={how} next={next} extra={extra} />}
    </div>
  );
}

export default function ModulePanel(props: ModulePanelProps) {
  return (
    <>
      <MobilePanel {...props} />
      <DesktopPanel {...props} />
    </>
  );
}

export function KeywordTip() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="p-1 rounded-md bg-amber-100">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
          ¿Qué es un keyword hoy?
        </span>
      </div>
      <p className="text-xs text-orbi-muted leading-relaxed">
        Los keywords modernos no son palabras sueltas sino{" "}
        <strong className="text-foreground">frases completas</strong> que la gente escribe en Google.
      </p>
      <div className="mt-2.5 rounded-md bg-white border border-orbi-border px-3 py-2">
        <p className="text-[11px] text-orbi-muted mb-1">En vez de:</p>
        <p className="text-xs text-orbi-muted line-through">mayores</p>
        <p className="text-[11px] text-orbi-muted mt-1.5 mb-1">Usa:</p>
        <p className="text-xs text-orbi-accent italic leading-snug">
          &ldquo;qué hacer cuando tu madre vive sola y olvida la medicación&rdquo;
        </p>
      </div>
      <p className="text-xs text-orbi-muted leading-relaxed mt-2.5">
        A estas frases se les llama{" "}
        <strong className="text-foreground">long-tail keywords</strong> — tienen menos competencia
        y más intención de compra.
      </p>
      <p className="text-xs text-orbi-muted leading-relaxed mt-2">
        Valídalos en{" "}
        <a
          href="https://ads.google.com/home/tools/keyword-planner/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 underline underline-offset-2 hover:text-amber-700 transition-colors"
        >
          Google Keyword Planner
        </a>{" "}
        antes de invertir.
      </p>
    </div>
  );
}
