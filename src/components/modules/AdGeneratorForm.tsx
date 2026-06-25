"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MetaAdsFullConfig, MetaField, ModuleSlug } from "@/types";
import { setActiveProject } from "@/lib/store";
import { updateProjectProgress } from "@/lib/supabase/projects";
import { useActiveProject } from "@/lib/useActiveProject";
import Button from "@/components/ui/Button";
import {
  ArrowRight, Loader2, Copy, Check, AlertCircle,
  Megaphone, RefreshCw, ChevronDown, ChevronUp,
  Target, Settings2, FileText, Sparkles, Pencil,
} from "lucide-react";

/* ─────────────────────────────── helpers ────────────────────────────────── */

const ALL_OBJECTIVES = [
  { id: "mensajes", label: "Mensajes" },
  { id: "reconocimiento", label: "Reconocimiento" },
  { id: "trafico", label: "Tráfico" },
  { id: "interaccion", label: "Interacción" },
  { id: "clientes_potenciales", label: "Clientes potenciales" },
  { id: "ventas", label: "Ventas" },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded text-orbi-muted hover:text-foreground hover:bg-orbi-primary/20 transition-colors shrink-0"
      title="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-orbi-accent" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ─── Inline-editable field row ─── */
function FieldRow({ field, onUpdate }: { field: MetaField; onUpdate: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field.value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function commit() { onUpdate(draft); setEditing(false); }

  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-orbi-border/40 last:border-0">
      <span className="text-[10px] font-semibold text-orbi-muted uppercase tracking-wide">{field.label}</span>
      <div className="flex items-start gap-2 mt-0.5">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(field.value); setEditing(false); } }}
            className="flex-1 bg-transparent text-sm text-foreground border-b border-orbi-accent outline-none py-0.5 leading-relaxed"
          />
        ) : (
          <span
            className="flex-1 text-sm text-foreground leading-relaxed cursor-text hover:text-foreground/80 transition-colors"
            onClick={() => { setDraft(field.value); setEditing(true); }}
            title="Clic para editar"
          >
            {field.value}
          </span>
        )}
        <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
          <button
            onClick={() => { setDraft(field.value); setEditing(v => !v); }}
            className="p-1.5 rounded text-orbi-muted hover:text-foreground hover:bg-orbi-primary/20 transition-colors"
            title="Editar"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <CopyBtn text={field.value} />
        </div>
      </div>
      {field.note && (
        <span className="text-[11px] text-orbi-muted/70 leading-snug">{field.note}</span>
      )}
    </div>
  );
}

/* ─── Collapsible config block ─── */
function ConfigBlock({
  title, icon: Icon, fields, onUpdate, onRegenerate, regenerating,
}: {
  title: string;
  icon: React.ElementType;
  fields: MetaField[];
  onUpdate: (i: number, v: string) => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className={`rounded-xl border border-orbi-border bg-orbi-surface/60 overflow-hidden transition-opacity ${regenerating ? "opacity-60 pointer-events-none" : ""}`}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-orbi-card/40 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <Icon className="w-4 h-4 text-orbi-accent shrink-0" />
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        <div className="flex items-center gap-2">
          {regenerating && <Loader2 className="w-3.5 h-3.5 animate-spin text-orbi-accent" />}
          <button
            onClick={e => { e.stopPropagation(); onRegenerate(); }}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground/80 transition-colors"
            title="Regenerar bloque"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            Regenerar
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-orbi-muted" /> : <ChevronDown className="w-4 h-4 text-orbi-muted" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-1 border-t border-orbi-border/60">
          {fields.map((f, i) => (
            <FieldRow key={i} field={f} onUpdate={v => onUpdate(i, v)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Paso 1 — Objective card ─── */
function ObjectiveCard({
  config,
  onConfirm,
  onSwitch,
  switching,
}: {
  config: MetaAdsFullConfig;
  onConfirm: () => void;
  onSwitch: (id: string) => void;
  switching: boolean;
}) {
  const obj = config.objective;
  const others = ALL_OBJECTIVES.filter(o => o.id !== obj.id);

  return (
    <div className="rounded-xl border border-orbi-accent/40 bg-orbi-primary/10 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-orbi-accent" />
        <span className="text-xs font-bold text-orbi-accent uppercase tracking-widest">Objetivo recomendado</span>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orbi-accent/20 border border-orbi-accent/40 shrink-0 mt-0.5">
          <Check className="w-3.5 h-3.5 text-orbi-accent" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground uppercase tracking-wide">{obj.label}</p>
          <p className="text-sm text-orbi-muted mt-0.5 leading-relaxed">{obj.reason}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <Button onClick={onConfirm} disabled={switching}>
          <Check className="w-4 h-4 mr-1.5" />
          Confirmar y ver configuración
        </Button>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-orbi-muted shrink-0">¿Prefieres otro?</span>
          <div className="flex flex-wrap gap-1.5">
            {others.map(o => (
              <button
                key={o.id}
                disabled={switching}
                onClick={() => onSwitch(o.id)}
                className="text-xs px-2.5 py-1 rounded-full border border-orbi-border text-orbi-muted hover:border-orbi-accent/40 hover:text-foreground transition-colors disabled:opacity-50"
              >
                {switching ? <Loader2 className="w-3 h-3 animate-spin inline" /> : o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Paso 3 — Summary card ─── */
function SummaryCard({ config, onExport }: { config: MetaAdsFullConfig; onExport: () => void }) {
  const s = config.summary;

  function copyAll() {
    const lines: string[] = [
      "═══════════════════════════════════",
      "       META ADS — CONFIGURACIÓN",
      "═══════════════════════════════════\n",
      "▶ OBJETIVO",
      `  ${s.objective}\n`,
      "── CAMPAÑA ──────────────────────",
      ...config.campaign.map(f => `  ${f.label}: ${f.value}`),
      "\n── CONJUNTO DE ANUNCIOS ─────────",
      ...config.adSet.map(f => `  ${f.label}: ${f.value}`),
      "\n── ANUNCIO ──────────────────────",
      ...config.ad.map(f => `  ${f.label}: ${f.value}`),
      "\n── RESUMEN ──────────────────────",
      `  Objetivo:  ${s.objective}`,
      `  Público:   ${s.audience}`,
      `  Presupuesto: ${s.budget}`,
      `  Formato:   ${s.format}`,
      `  Alcance estimado: ${s.estimatedReach}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
  }

  const rows = [
    { label: "Objetivo", value: s.objective },
    { label: "Público", value: s.audience },
    { label: "Presupuesto", value: s.budget },
    { label: "Formato", value: s.format },
    { label: "Alcance estimado", value: s.estimatedReach },
  ];

  return (
    <div className="rounded-xl border border-orbi-border bg-orbi-surface/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-orbi-accent" />
        <span className="text-sm font-bold text-foreground">Tu campaña en Meta Ads</span>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-5">
        {rows.map(r => (
          <div key={r.label} className="flex items-start gap-2">
            <span className="text-xs text-orbi-muted w-32 shrink-0 pt-0.5">{r.label}</span>
            <span className="flex-1 text-sm font-medium text-foreground">{r.value}</span>
            <CopyBtn text={r.value} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-orbi-border">
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Copiar todo
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-orbi-accent/30 text-orbi-accent hover:bg-orbi-accent/10 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          Exportar .txt
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────── main form ─────────────────────────────── */

type Phase = "loading" | "objective" | "config";

export default function AdGeneratorForm() {
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError } = useActiveProject();
  const [phase, setPhase] = useState<Phase>("loading");
  const [config, setConfig] = useState<MetaAdsFullConfig | null>(null);
  const [regeneratingBlock, setRegeneratingBlock] = useState<"campaign" | "adSet" | "ad" | null>(null);
  const [switching, setSwitching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAudiences = (project?.audiences ?? []).filter(
    a => project?.selectedAudienceIds?.includes(a.id)
  );
  const selectedKeywords = (project?.keywords ?? [])
    .flatMap(c => c.keywords.filter(k => k.selected).map(k => k.phrase))
    .slice(0, 10);

  useEffect(() => {
    if (projectLoading || !project) return;
    if (!project.productBrief) { setError("Completa el Product Brief primero."); setPhase("config"); return; }

    if (project.metaAdsConfig) {
      setConfig(project.metaAdsConfig);
      setPhase("config");
    } else {
      generateAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, projectLoading]);

  async function generateAll(forcedObjective?: string) {
    if (!project?.productBrief) return;
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/generate-meta-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: project.productBrief,
          audiences: selectedAudiences,
          keywords: selectedKeywords,
          ...(forcedObjective ? { forcedObjective } : {}),
        }),
      });
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setActiveProject({ ...project, metaAdsConfig: data.config });
        setPhase("objective");
      } else {
        setError(data.error ?? "No se pudo generar la configuración.");
        setPhase("config");
      }
    } catch {
      setError("Error de red al generar la configuración.");
      setPhase("config");
    }
  }

  async function switchObjective(id: string) {
    if (!project?.productBrief) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/generate-meta-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: project.productBrief,
          audiences: selectedAudiences,
          keywords: selectedKeywords,
          forcedObjective: id,
        }),
      });
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setActiveProject({ ...project, metaAdsConfig: data.config });
      } else {
        setError(data.error ?? "Error al cambiar objetivo.");
      }
    } catch {
      setError("Error de red.");
    } finally {
      setSwitching(false);
    }
  }

  async function regenerateBlock(block: "campaign" | "adSet" | "ad") {
    if (!project?.productBrief || !config) return;
    setRegeneratingBlock(block);
    try {
      const res = await fetch("/api/generate-meta-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: project.productBrief,
          audiences: selectedAudiences,
          keywords: selectedKeywords,
          forcedObjective: config.objective.id,
        }),
      });
      const data = await res.json();
      if (data.config) {
        const updated: MetaAdsFullConfig = {
          ...config,
          [block]: data.config[block],
          summary: data.config.summary,
        };
        setConfig(updated);
        setActiveProject({ ...project, metaAdsConfig: updated });
      }
    } catch { /* keep existing */ }
    finally { setRegeneratingBlock(null); }
  }

  function updateField(block: "campaign" | "adSet" | "ad", index: number, value: string) {
    if (!config || !project) return;
    const updated: MetaAdsFullConfig = {
      ...config,
      [block]: config[block].map((f, i) => i === index ? { ...f, value } : f),
    };
    setConfig(updated);
    setActiveProject({ ...project, metaAdsConfig: updated });
  }

  function exportTxt() {
    if (!config) return;
    const s = config.summary;
    const lines = [
      "META ADS — CONFIGURACIÓN COMPLETA",
      "==================================\n",
      `OBJETIVO: ${config.objective.label}`,
      `Razón: ${config.objective.reason}\n`,
      "BLOQUE 1 — CAMPAÑA",
      "------------------",
      ...config.campaign.map(f => `${f.label}: ${f.value}\n  → ${f.note}`),
      "\nBLOQUE 2 — CONJUNTO DE ANUNCIOS",
      "--------------------------------",
      ...config.adSet.map(f => `${f.label}: ${f.value}\n  → ${f.note}`),
      "\nBLOQUE 3 — ANUNCIO",
      "------------------",
      ...config.ad.map(f => `${f.label}: ${f.value}\n  → ${f.note}`),
      "\nRESUMEN EJECUTIVO",
      "-----------------",
      `Objetivo:          ${s.objective}`,
      `Público:           ${s.audience}`,
      `Presupuesto:       ${s.budget}`,
      `Formato:           ${s.format}`,
      `Alcance estimado:  ${s.estimatedReach}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meta-ads-${config.objective.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleContinue() {
    if (!project) return;
    setSaving(true);
    try {
      const updated = {
        ...project,
        completedModules: (project.completedModules.includes("ad-generator")
          ? project.completedModules
          : [...project.completedModules, "ad-generator"]) as ModuleSlug[],
        lastModule: "post-generator" as const,
        updatedAt: new Date().toISOString(),
      };
      setActiveProject(updated);
      try {
        await updateProjectProgress(updated.id, updated.completedModules, "post-generator");
      } catch (e) { console.error("Supabase sync failed:", e); }
      router.push(`/module/post-generator?pid=${updated.id}`);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  /* ── Loading ── */
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <Megaphone className="w-10 h-10 text-slate-700" />
          <div className="absolute -top-1 -right-1">
            <Loader2 className="w-5 h-5 text-orbi-accent animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-foreground/80 font-medium text-sm">Analizando tu producto y generando estrategia…</p>
          <p className="text-orbi-muted text-xs mt-1">Objetivo · Campaña · Audiencia · Copy · Resumen — 15–25 seg</p>
        </div>
        <div className="w-full space-y-2 mt-2">
          {["Analizando producto y audiencias…", "Seleccionando objetivo óptimo…", "Configurando bloques del Ads Manager…", "Generando copy y resumen…"].map((t, i) => (
            <div key={i} className="h-10 rounded-lg border border-orbi-border bg-orbi-surface/40 animate-pulse flex items-center px-4">
              <span className="text-xs text-orbi-muted/50">{t}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  const displayError = projectError || error;
  if (displayError && !config) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-foreground/80 text-sm">{displayError}</p>
        <div className="flex gap-2">
          <Button onClick={() => generateAll()} variant="primary">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Reintentar
          </Button>
          <Button onClick={() => router.push("/dashboard")} variant="secondary" size="sm">
            Volver al dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orbi-accent" />
          <span className="text-sm font-semibold text-foreground">Meta Ads — Configuración completa</span>
        </div>
        <button
          onClick={() => generateAll()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground/80 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerar todo
        </button>
      </div>

      {/* Error banner (non-fatal) */}
      {displayError && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          {displayError}
        </div>
      )}

      {/* ── PASO 1 — Objetivo ── */}
      <div className="flex flex-col gap-3">
        <SectionHeader step="1" title="Objetivo de la campaña" />
        {phase === "objective" ? (
          <ObjectiveCard
            config={config}
            onConfirm={() => setPhase("config")}
            onSwitch={switchObjective}
            switching={switching}
          />
        ) : (
          /* Confirmed state — compact chip */
          <div className="flex items-center gap-3 rounded-xl border border-orbi-border bg-orbi-surface/60 px-4 py-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orbi-accent/20 shrink-0">
              <Check className="w-3.5 h-3.5 text-orbi-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-foreground uppercase tracking-wide">{config.objective.label}</span>
              <span className="text-xs text-orbi-muted ml-2">— {config.objective.reason}</span>
            </div>
            <button
              onClick={() => setPhase("objective")}
              className="text-[10px] px-2 py-1 rounded border border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground/80 transition-colors shrink-0"
            >
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* ── PASO 2 — Bloques (only after confirming objective) ── */}
      {phase === "config" && (
        <div className="flex flex-col gap-3">
          <SectionHeader step="2" title="Configuración en Meta Ads Manager" />

          <ConfigBlock
            title="Bloque 1 — Campaña"
            icon={Target}
            fields={config.campaign}
            onUpdate={(i, v) => updateField("campaign", i, v)}
            onRegenerate={() => regenerateBlock("campaign")}
            regenerating={regeneratingBlock === "campaign"}
          />
          <ConfigBlock
            title="Bloque 2 — Conjunto de anuncios"
            icon={Settings2}
            fields={config.adSet}
            onUpdate={(i, v) => updateField("adSet", i, v)}
            onRegenerate={() => regenerateBlock("adSet")}
            regenerating={regeneratingBlock === "adSet"}
          />
          <ConfigBlock
            title="Bloque 3 — Anuncio"
            icon={Megaphone}
            fields={config.ad}
            onUpdate={(i, v) => updateField("ad", i, v)}
            onRegenerate={() => regenerateBlock("ad")}
            regenerating={regeneratingBlock === "ad"}
          />
        </div>
      )}

      {/* ── PASO 3 — Resumen (only after confirming objective) ── */}
      {phase === "config" && (
        <div className="flex flex-col gap-3">
          <SectionHeader step="3" title="Resumen ejecutivo" />
          <SummaryCard config={config} onExport={exportTxt} />
        </div>
      )}

      {/* Footer */}
      {phase === "config" && (
        <div className="flex items-center justify-between pt-2 border-t border-orbi-border">
          <p className="text-sm text-orbi-muted">Configuración lista — continúa al módulo de Posts</p>
          <Button size="lg" disabled={saving} onClick={handleContinue}>
            {saving
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
              : <>Continuar a Posts<ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orbi-primary text-[10px] font-bold text-orbi-accent border border-orbi-accent/30">
          {step}
        </span>
        <span className="text-xs font-bold text-orbi-accent uppercase tracking-widest">Paso {step}</span>
        <span className="text-xs text-orbi-muted">— {title}</span>
      </div>
      <div className="flex-1 h-px bg-orbi-border" />
    </div>
  );
}
