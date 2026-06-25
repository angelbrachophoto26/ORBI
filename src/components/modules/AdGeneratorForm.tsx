"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdVariant, AdPlatform, MetaAdsConfig, ModuleSlug } from "@/types";
import { setActiveProject } from "@/lib/store";
import { updateProjectProgress, saveAds } from "@/lib/supabase/projects";
import { useActiveProject } from "@/lib/useActiveProject";
import Button from "@/components/ui/Button";
import {
  ArrowRight, Loader2, Copy, Check, AlertCircle, Megaphone,
  RefreshCw, ChevronDown, ChevronUp, Sparkles, Settings2,
} from "lucide-react";

/* ─── Helpers ─── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded text-orbi-secondary hover:text-foreground/80 hover:bg-orbi-primary/20 transition-colors shrink-0"
      title="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-orbi-accent" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CharBadge({ text, limit }: { text: string; limit: number }) {
  const len = text.length;
  const over = len > limit;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${over ? "bg-rose-950/60 text-rose-400" : "bg-orbi-card text-orbi-muted"}`}>
      {len}/{limit}
    </span>
  );
}

const ANGLE_ICONS: Record<string, string> = {
  pain: "🔥", outcome: "🎯", social_proof: "⭐", curiosity: "💡", urgency: "⚡",
};

const PLATFORM_META = {
  google: {
    label: "Google Ads",
    color: "text-blue-400",
    bg: "bg-blue-950/30",
    border: "border-blue-900/40",
    badge: "bg-blue-500/10 text-blue-400",
    activeBorder: "border-blue-600 bg-blue-950/10",
  },
  meta: {
    label: "Meta Ads",
    color: "text-purple-400",
    bg: "bg-purple-950/30",
    border: "border-purple-900/40",
    badge: "bg-purple-500/10 text-purple-400",
    activeBorder: "border-purple-600 bg-purple-950/10",
  },
} as const;

/* ─── Google Ad Card ─── */
function GoogleAdCard({ ad, onToggle, onRegenerate, regenerating }: {
  ad: AdVariant; onToggle: () => void; onRegenerate: () => void; regenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const m = PLATFORM_META.google;
  return (
    <div className={`rounded-xl border transition-all ${ad.selected ? m.activeBorder : "border-orbi-border bg-orbi-surface/60"} ${regenerating ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
        <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${ad.selected ? "border-blue-500 bg-blue-500" : "border-slate-600"}`}>
          {ad.selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
        <span className="text-lg">{ANGLE_ICONS[ad.angle]}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${ad.selected ? "text-blue-300" : "text-foreground"}`}>{ad.angleLabel}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.badge}`}>{m.label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {regenerating && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
          <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="p-1 rounded text-orbi-secondary hover:text-blue-400 transition-colors" title="Regenerar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }} className="text-orbi-muted hover:text-foreground/80 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-orbi-border/60 pt-3">
          <div>
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-2">Headlines (máx. 30 car.)</p>
            <div className="space-y-2">
              {(ad.headlines ?? []).map((h, i) => (
                <div key={i} className="flex items-center gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
                  <span className="text-[10px] text-orbi-secondary w-4 shrink-0">{i + 1}</span>
                  <span className="flex-1 text-sm text-foreground/70">{h}</span>
                  <CharBadge text={h} limit={30} />
                  <CopyButton text={h} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-2">Descriptions (máx. 90 car.)</p>
            <div className="space-y-2">
              {(ad.descriptions ?? []).map((d, i) => (
                <div key={i} className="flex items-start gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
                  <span className="text-[10px] text-orbi-secondary w-4 shrink-0 mt-0.5">{i + 1}</span>
                  <span className="flex-1 text-sm text-foreground/80 leading-relaxed">{d}</span>
                  <div className="flex items-start gap-1 shrink-0 mt-0.5">
                    <CharBadge text={d} limit={90} />
                    <CopyButton text={d} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Meta Ad Card ─── */
function MetaAdCard({ ad, onToggle, onRegenerate, regenerating }: {
  ad: AdVariant; onToggle: () => void; onRegenerate: () => void; regenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const m = PLATFORM_META.meta;
  return (
    <div className={`rounded-xl border transition-all ${ad.selected ? m.activeBorder : "border-orbi-border bg-orbi-surface/60"} ${regenerating ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
        <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${ad.selected ? "border-purple-500 bg-purple-500" : "border-slate-600"}`}>
          {ad.selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
        <span className="text-lg">{ANGLE_ICONS[ad.angle]}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${ad.selected ? "text-purple-300" : "text-foreground"}`}>{ad.angleLabel}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.badge}`}>{m.label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {regenerating && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
          <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="p-1 rounded text-orbi-secondary hover:text-purple-400 transition-colors" title="Regenerar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }} className="text-orbi-muted hover:text-foreground/80 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-orbi-border/60 pt-3">
          {/* Primary text */}
          <div>
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-1.5">Texto principal (máx. 125 car.)</p>
            <div className="flex items-start gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm text-foreground/70 leading-relaxed">{ad.primaryText}</span>
              <div className="flex items-start gap-1 shrink-0">
                <CharBadge text={ad.primaryText ?? ""} limit={125} />
                <CopyButton text={ad.primaryText ?? ""} />
              </div>
            </div>
          </div>
          {/* Headline */}
          <div>
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-1.5">Headline (máx. 40 car.)</p>
            <div className="flex items-center gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm text-foreground/70 font-medium">{ad.headline}</span>
              <CharBadge text={ad.headline ?? ""} limit={40} />
              <CopyButton text={ad.headline ?? ""} />
            </div>
          </div>
          {/* Description */}
          <div>
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-1.5">Descripción (máx. 30 car.)</p>
            <div className="flex items-center gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm text-foreground/80">{ad.description}</span>
              <CharBadge text={ad.description ?? ""} limit={30} />
              <CopyButton text={ad.description ?? ""} />
            </div>
          </div>
          {/* CTA */}
          {ad.cta && (
            <div>
              <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-1.5">CTA recomendado</p>
              <div className="flex items-center gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
                <span className="flex-1 text-sm text-orbi-accent font-semibold">{ad.cta}</span>
                <CopyButton text={ad.cta} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Config field row ─── */
function ConfigField({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-orbi-border/40 last:border-0">
      <span className="text-[10px] font-semibold text-orbi-muted uppercase tracking-wide">{label}</span>
      <div className="flex items-start gap-2 mt-0.5">
        <span className="flex-1 text-sm text-foreground leading-relaxed">{value}</span>
        <CopyButton text={value} />
      </div>
      {note && (
        <span className="text-[11px] text-orbi-muted/70 leading-snug mt-0.5">{note}</span>
      )}
    </div>
  );
}

function ConfigBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-orbi-border bg-orbi-surface/60 overflow-hidden">
      <div className="px-4 py-2.5 bg-orbi-card/60 border-b border-orbi-border">
        <p className="text-[11px] font-bold text-orbi-secondary uppercase tracking-widest">{title}</p>
      </div>
      <div className="px-4 pb-1">
        {children}
      </div>
    </div>
  );
}

/* ─── Section B — Meta Ads Config ─── */
function MetaAdsConfigSection({
  config,
  generating,
  onGenerate,
}: {
  config: MetaAdsConfig | null;
  generating: boolean;
  onGenerate: () => void;
}) {
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="relative">
          <Settings2 className="w-8 h-8 text-slate-700" />
          <div className="absolute -top-1 -right-1">
            <Loader2 className="w-4 h-4 text-orbi-accent animate-spin" />
          </div>
        </div>
        <p className="text-sm text-foreground/70 font-medium text-center">Generando configuración de Meta Ads…</p>
        <p className="text-xs text-orbi-muted text-center">Analizando audiencias y generando valores exactos para el Ads Manager</p>
        <div className="w-full space-y-2 mt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl border border-orbi-border bg-orbi-surface/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 border border-dashed border-orbi-border rounded-xl">
        <Settings2 className="w-8 h-8 text-orbi-muted" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/80">Guía de configuración Meta Ads Manager</p>
          <p className="text-xs text-orbi-muted mt-1 max-w-xs">
            Genera valores exactos para cada campo del Ads Manager: campaña, conjunto de anuncios y anuncio.
          </p>
        </div>
        <Button onClick={onGenerate} variant="primary">
          <Sparkles className="w-4 h-4 mr-2" />
          Generar configuración
        </Button>
      </div>
    );
  }

  const c = config;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-orbi-muted">Valores listos para copiar directamente en Meta Ads Manager</p>
        <button
          onClick={onGenerate}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground/80 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerar
        </button>
      </div>

      {/* Bloque 1 — Campaña */}
      <ConfigBlock title="Bloque 1 — Campaña">
        <ConfigField label="Nombre de la campaña" value={c.campaign.campaignName.value} note={c.campaign.campaignName.note} />
        <ConfigField label="Objetivo" value={c.campaign.objective.value} note={c.campaign.objective.note} />
        <ConfigField label="Categorías especiales" value={c.campaign.specialCategories.value} note={c.campaign.specialCategories.note} />
      </ConfigBlock>

      {/* Bloque 2 — Conjunto de anuncios */}
      <ConfigBlock title="Bloque 2 — Conjunto de anuncios">
        <ConfigField label="Destino de mensajes" value={c.adSet.messageDestination.value} note={c.adSet.messageDestination.note} />
        <ConfigField label="País y ciudad (radio en km)" value={c.adSet.location.value} note={c.adSet.location.note} />
        <ConfigField label="Edad recomendada" value={c.adSet.ageRange.value} note={c.adSet.ageRange.note} />
        <ConfigField label="Sexo recomendado" value={c.adSet.gender.value} note={c.adSet.gender.note} />
        <ConfigField label="Segmentación detallada" value={c.adSet.detailedTargeting.value} note={c.adSet.detailedTargeting.note} />
        <ConfigField label="Idiomas" value={c.adSet.languages.value} note={c.adSet.languages.note} />
        <ConfigField label="Presupuesto diario" value={c.adSet.dailyBudget.value} note={c.adSet.dailyBudget.note} />
        <ConfigField label="Duración recomendada" value={c.adSet.duration.value} note={c.adSet.duration.note} />
        <ConfigField label="Ubicaciones" value={c.adSet.placements.value} note={c.adSet.placements.note} />
      </ConfigBlock>

      {/* Bloque 3 — Anuncio */}
      <ConfigBlock title="Bloque 3 — Anuncio">
        <ConfigField label="Formato recomendado" value={c.ad.format.value} note={c.ad.format.note} />
        <ConfigField label="Nombre del anunciante" value={c.ad.advertiserName.value} note={c.ad.advertiserName.note} />
        <ConfigField label="Tipo de creative recomendado" value={c.ad.creativeDescription.value} note={c.ad.creativeDescription.note} />
      </ConfigBlock>
    </div>
  );
}

/* ─── Main form ─── */
export default function AdGeneratorForm() {
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError } = useActiveProject();
  const [platform, setPlatform] = useState<AdPlatform>("meta");
  const [ads, setAds] = useState<AdVariant[]>([]);
  const [metaConfig, setMetaConfig] = useState<MetaAdsConfig | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingConfig, setGeneratingConfig] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAudiences = (project?.audiences ?? []).filter(
    (a) => project?.selectedAudienceIds?.includes(a.id)
  );
  const selectedKeywords = (project?.keywords ?? [])
    .flatMap((c) => c.keywords.filter((k) => k.selected).map((k) => k.phrase))
    .slice(0, 10);

  useEffect(() => {
    if (projectLoading || !project) return;
    if (!project.productBrief) { setError("Completa el Product Brief primero."); return; }

    const saved = (project.ads ?? []).filter((a) => a.platform === platform);
    if (saved.length > 0) {
      setAds(saved);
    } else {
      generate(platform);
    }

    // Restore cached Meta config
    if (platform === "meta" && project.metaAdsConfig) {
      setMetaConfig(project.metaAdsConfig);
    } else if (platform !== "meta") {
      setMetaConfig(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, projectLoading, platform]);

  async function generate(p: AdPlatform) {
    if (!project?.productBrief) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: project.productBrief,
          audiences: selectedAudiences,
          keywords: selectedKeywords,
          platform: p,
        }),
      });
      const data = await res.json();
      if (data.ads) {
        setAds(data.ads);
        const merged = [...(project.ads ?? []).filter(a => a.platform !== p), ...data.ads];
        setActiveProject({ ...project, ads: merged });
      } else {
        setError(data.error ?? "No se pudieron generar los anuncios.");
      }
    } catch {
      setError("Error de red al generar anuncios.");
    } finally {
      setGenerating(false);
    }
  }

  async function generateConfig() {
    if (!project?.productBrief) return;
    setGeneratingConfig(true);
    try {
      const res = await fetch("/api/generate-meta-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: project.productBrief,
          audiences: selectedAudiences,
          keywords: selectedKeywords,
        }),
      });
      const data = await res.json();
      if (data.config) {
        setMetaConfig(data.config);
        setActiveProject({ ...project, metaAdsConfig: data.config });
      } else {
        setError(data.error ?? "No se pudo generar la configuración.");
      }
    } catch {
      setError("Error de red al generar la configuración.");
    } finally {
      setGeneratingConfig(false);
    }
  }

  async function regenerateOne(id: string) {
    if (!project?.productBrief) return;
    setRegeneratingId(id);
    try {
      const res = await fetch("/api/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: project.productBrief,
          audiences: selectedAudiences,
          keywords: selectedKeywords,
          platform,
        }),
      });
      const data = await res.json();
      if (data.ads?.length) {
        const replacement = data.ads[Math.floor(Math.random() * data.ads.length)];
        replacement.id = Math.random().toString(36).slice(2, 10);
        setAds((prev) => prev.map((a) => a.id === id ? replacement : a));
      }
    } catch { /* silently keep existing */ }
    finally { setRegeneratingId(null); }
  }

  function toggleAd(id: string) {
    setAds((prev) => prev.map((a) => a.id === id ? { ...a, selected: !a.selected } : a));
  }

  function switchPlatform(p: AdPlatform) {
    setPlatform(p);
    setAds([]);
    if (p !== "meta") setMetaConfig(null);
  }

  const selectedCount = ads.filter((a) => a.selected).length;

  async function handleContinue() {
    if (!project) return;
    setSaving(true);
    try {
      const otherPlatformAds = (project.ads ?? []).filter((a) => a.platform !== platform);
      const allAds = [...otherPlatformAds, ...ads];
      const updated = {
        ...project,
        ads: allAds,
        completedModules: (project.completedModules.includes("ad-generator")
          ? project.completedModules
          : [...project.completedModules, "ad-generator"]) as ModuleSlug[],
        lastModule: "post-generator" as const,
        updatedAt: new Date().toISOString(),
      };
      setActiveProject(updated);
      try {
        await saveAds(updated.id, allAds);
        await updateProjectProgress(updated.id, updated.completedModules, "post-generator");
      } catch (e) { console.error("Supabase sync failed:", e); }
      router.push(`/module/post-generator?pid=${updated.id}`);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  /* ── Loading state ── */
  if (projectLoading || generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <Megaphone className="w-10 h-10 text-slate-700" />
          <div className="absolute -top-1 -right-1">
            <Loader2 className="w-5 h-5 text-orbi-accent animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-foreground/80 font-medium text-sm">
            Generando copies para {platform === "google" ? "Google Ads" : "Meta Ads"}…
          </p>
          <p className="text-orbi-muted text-xs mt-1">5 ángulos × plataforma — 10–15 seg</p>
        </div>
        <div className="w-full space-y-3 mt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-orbi-border bg-orbi-surface/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const displayError = projectError || error;
  if (displayError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-foreground/80 text-sm">{displayError}</p>
        <Button onClick={() => router.push("/dashboard")} size="sm">Volver al dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Platform switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-orbi-muted shrink-0">Plataforma:</p>
        <div className="flex gap-2 flex-wrap">
          {(["meta", "google"] as AdPlatform[]).map((p) => {
            const m = PLATFORM_META[p];
            const active = platform === p;
            return (
              <button
                key={p}
                onClick={() => switchPlatform(p)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  active ? `${m.bg} ${m.border} ${m.color}` : "border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground/80"
                }`}
              >
                {m.label}
              </button>
            );
          })}
          <button
            onClick={() => generate(platform)}
            className="text-xs px-3 py-1.5 rounded-lg border border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground/80 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerar todo
          </button>
        </div>
        <div className="ml-auto shrink-0 text-right">
          <span className="text-2xl font-bold text-foreground">{selectedCount}</span>
          <p className="text-[10px] text-orbi-secondary mt-0.5">seleccionados</p>
        </div>
      </div>

      {/* ──────────────────── SECCIÓN A — Copy ──────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-orbi-accent uppercase tracking-widest">Sección A</span>
            <span className="text-xs text-orbi-muted">— Copy del anuncio</span>
          </div>
          <div className="flex-1 h-px bg-orbi-border" />
        </div>

        <p className="text-sm text-orbi-muted leading-relaxed -mt-1">
          Selecciona los anuncios que quieres guardar. Cada ícono representa un{" "}
          <strong className="text-foreground">ángulo de persuasión</strong> distinto.
        </p>

        {/* Angle legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(ANGLE_ICONS).map(([key, icon]) => (
            <span key={key} className="text-[11px] px-2 py-1 rounded-full bg-orbi-card text-orbi-muted border border-orbi-border-light">
              {icon} {key === "pain" ? "Dolor" : key === "outcome" ? "Resultado" : key === "social_proof" ? "Prueba social" : key === "curiosity" ? "Curiosidad" : "Urgencia"}
            </span>
          ))}
        </div>

        {/* Ad cards */}
        <div className="space-y-3">
          {ads.map((ad) =>
            ad.platform === "google" ? (
              <GoogleAdCard
                key={ad.id}
                ad={ad}
                onToggle={() => toggleAd(ad.id)}
                onRegenerate={() => regenerateOne(ad.id)}
                regenerating={regeneratingId === ad.id}
              />
            ) : (
              <MetaAdCard
                key={ad.id}
                ad={ad}
                onToggle={() => toggleAd(ad.id)}
                onRegenerate={() => regenerateOne(ad.id)}
                regenerating={regeneratingId === ad.id}
              />
            )
          )}
        </div>
      </div>

      {/* ──────────────────── SECCIÓN B — Meta Config (solo Meta) ──────────────────── */}
      {platform === "meta" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orbi-accent uppercase tracking-widest">Sección B</span>
              <span className="text-xs text-orbi-muted">— Configuración Meta Ads Manager</span>
            </div>
            <div className="flex-1 h-px bg-orbi-border" />
          </div>

          <MetaAdsConfigSection
            config={metaConfig}
            generating={generatingConfig}
            onGenerate={generateConfig}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-orbi-border">
        <p className="text-sm text-orbi-muted">
          {selectedCount === 0
            ? "Selecciona al menos un anuncio para continuar"
            : `${selectedCount} anuncio${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}`}
        </p>
        <Button size="lg" disabled={saving} onClick={handleContinue}>
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
          ) : (
            <>Continuar a Posts<ArrowRight className="ml-2 w-4 h-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
