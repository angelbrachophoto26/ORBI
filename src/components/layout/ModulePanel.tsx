"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Info, CheckCircle2, ArrowRight, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";

const STORAGE_KEY = "orbi_panel_open";

interface ModulePanelProps {
  what: string;
  how: string;
  next: string;
  extra?: React.ReactNode;
  className?: string;
}

export default function ModulePanel({ what, how, next, extra, className }: ModulePanelProps) {
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
        "shrink-0 bg-orbi-surface/60 border border-orbi-border rounded-xl backdrop-blur-sm transition-all duration-200",
        open ? "p-5" : "p-3",
        className
      )}
    >
      {/* Toggle header */}
      <div className={cn("flex items-center", open ? "justify-between mb-4" : "justify-center")}>
        {open && (
          <span className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest">
            Guía del módulo
          </span>
        )}
        <button
          onClick={toggle}
          className="p-1.5 rounded-md text-orbi-muted hover:text-slate-300 hover:bg-orbi-card transition-colors"
          title={open ? "Colapsar panel" : "Expandir panel"}
        >
          {open ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Collapsed state — icon hints */}
      {!open && (
        <div className="flex flex-col items-center gap-3 py-1">
          <Info className="w-4 h-4 text-orbi-accent" />
          <CheckCircle2 className="w-4 h-4 text-yellow-500" />
          <ArrowRight className="w-4 h-4 text-orbi-muted" />
        </div>
      )}

      {/* Expanded content */}
      {open && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-md bg-orbi-primary/10">
                <Info className="w-3.5 h-3.5 text-orbi-accent" />
              </div>
              <span className="text-xs font-semibold text-orbi-accent uppercase tracking-wider">
                ¿Qué hago aquí?
              </span>
            </div>
            <p className="text-sm text-orbi-muted leading-relaxed">{what}</p>
          </div>

          <div className="h-px bg-orbi-card" />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-md bg-yellow-500/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" />
              </div>
              <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                ¿Cómo lo completo?
              </span>
            </div>
            <p className="text-sm text-orbi-muted leading-relaxed">{how}</p>
          </div>

          <div className="h-px bg-orbi-card" />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-md bg-orbi-primary">
                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                ¿Qué sigue?
              </span>
            </div>
            <p className="text-sm text-orbi-muted leading-relaxed">{next}</p>
          </div>

          {extra && (
            <>
              <div className="h-px bg-orbi-card" />
              {extra}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function KeywordTip() {
  return (
    <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="p-1 rounded-md bg-amber-500/15">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          ¿Qué es un keyword hoy?
        </span>
      </div>
      <p className="text-xs text-orbi-muted leading-relaxed">
        Los keywords modernos no son palabras sueltas sino{" "}
        <strong className="text-slate-300">frases completas</strong> que la gente escribe en Google.
      </p>
      <div className="mt-2.5 rounded-md bg-orbi-card/60 border border-orbi-border-light/50 px-3 py-2">
        <p className="text-[11px] text-orbi-muted mb-1">En vez de:</p>
        <p className="text-xs text-orbi-muted line-through">mayores</p>
        <p className="text-[11px] text-orbi-muted mt-1.5 mb-1">Usa:</p>
        <p className="text-xs text-orbi-accent italic leading-snug">
          &ldquo;qué hacer cuando tu madre vive sola y olvida la medicación&rdquo;
        </p>
      </div>
      <p className="text-xs text-orbi-muted leading-relaxed mt-2.5">
        A estas frases se les llama{" "}
        <strong className="text-slate-300">long-tail keywords</strong> — tienen menos competencia
        y más intención de compra, perfectas para marcas nuevas.
      </p>
      <p className="text-xs text-orbi-muted leading-relaxed mt-2">
        Los valores de volumen y dificultad son estimaciones orientativas. Valídalos en{" "}
        <a
          href="https://ads.google.com/home/tools/keyword-planner/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors"
        >
          Google Keyword Planner
        </a>{" "}
        antes de invertir.
      </p>
    </div>
  );
}
