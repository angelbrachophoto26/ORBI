"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdVariant, AdPlatform, ModuleSlug } from "@/types";
import { setActiveProject } from "@/lib/store";
import { updateProjectProgress, saveAds } from "@/lib/supabase/projects";
import { useActiveProject } from "@/lib/useActiveProject";
import Button from "@/components/ui/Button";
import {
  ArrowRight,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Megaphone,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const PLATFORM_META = {
  google: {
    label: "Google Ads",
    color: "text-blue-400",
    bg: "bg-blue-950/30",
    border: "border-blue-900/40",
    pill: "bg-blue-950/50 text-blue-300 border border-blue-900/50",
    badge: "bg-blue-500/10 text-blue-400",
  },
  meta: {
    label: "Meta Ads",
    color: "text-purple-400",
    bg: "bg-purple-950/30",
    border: "border-purple-900/40",
    pill: "bg-purple-950/50 text-purple-300 border border-purple-900/50",
    badge: "bg-purple-500/10 text-purple-400",
  },
} as const;

const ANGLE_ICONS: Record<string, string> = {
  pain: "🔥",
  outcome: "🎯",
  social_proof: "⭐",
  curiosity: "💡",
  urgency: "⚡",
};

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
      className="p-1 rounded text-orbi-secondary hover:text-foreground/80 hover:bg-orbi-primary transition-colors"
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
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${over ? "bg-rose-950/60 text-rose-400" : "bg-orbi-card text-orbi-muted"}`}>
      {len}/{limit}
    </span>
  );
}

function GoogleAdCard({ ad, onToggle, onRegenerate, regenerating }: {
  ad: AdVariant;
  onToggle: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = PLATFORM_META.google;

  return (
    <div className={`rounded-xl border transition-all ${ad.selected ? "border-blue-600 bg-blue-950/10" : "border-orbi-border bg-orbi-surface/60"} ${regenerating ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
        <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${ad.selected ? "border-blue-500 bg-blue-500" : "border-slate-600"}`}>
          {ad.selected && <Check className="w-3 h-3 text-foreground" strokeWidth={3} />}
        </div>
        <span className="text-lg">{ANGLE_ICONS[ad.angle]}</span>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${ad.selected ? "text-blue-300" : "text-white"}`}>{ad.angleLabel}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${meta.badge}`}>{meta.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {regenerating && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
          <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="p-1 rounded text-orbi-secondary hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="Regenerar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }} className="text-orbi-muted hover:text-foreground/80 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-orbi-border/60 pt-3">
          {/* Headlines */}
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
          {/* Descriptions */}
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

function MetaAdCard({ ad, onToggle, onRegenerate, regenerating }: {
  ad: AdVariant;
  onToggle: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = PLATFORM_META.meta;

  return (
    <div className={`rounded-xl border transition-all ${ad.selected ? "border-purple-600 bg-purple-950/10" : "border-orbi-border bg-orbi-surface/60"} ${regenerating ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
        <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${ad.selected ? "border-purple-500 bg-purple-500" : "border-slate-600"}`}>
          {ad.selected && <Check className="w-3 h-3 text-foreground" strokeWidth={3} />}
        </div>
        <span className="text-lg">{ANGLE_ICONS[ad.angle]}</span>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${ad.selected ? "text-purple-300" : "text-white"}`}>{ad.angleLabel}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${meta.badge}`}>{meta.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {regenerating && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
          <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="p-1 rounded text-orbi-secondary hover:text-purple-400 hover:bg-purple-400/10 transition-colors" title="Regenerar">
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
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-2">Primary Text (máx. 125 car.)</p>
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
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-2">Headline (máx. 40 car.)</p>
            <div className="flex items-center gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm text-foreground/70 font-medium">{ad.headline}</span>
              <CharBadge text={ad.headline ?? ""} limit={40} />
              <CopyButton text={ad.headline ?? ""} />
            </div>
          </div>
          {/* Description */}
          <div>
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-2">Description (máx. 30 car.)</p>
            <div className="flex items-center gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm text-foreground/80">{ad.description}</span>
              <CharBadge text={ad.description ?? ""} limit={30} />
              <CopyButton text={ad.description ?? ""} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdGeneratorForm() {
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError } = useActiveProject();
  const [platform, setPlatform] = useState<AdPlatform>("google");
  const [ads, setAds] = useState<AdVariant[]>([]);
  const [generating, setGenerating] = useState(false);
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

    // Restore saved ads for this platform
    const saved = (project.ads ?? []).filter((a) => a.platform === platform);
    if (saved.length > 0) { setAds(saved); return; }

    generate(platform);
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
      if (data.ads) setAds(data.ads);
      else setError(data.error ?? "No se pudieron generar los anuncios.");
    } catch {
      setError("Error de red al generar anuncios.");
    } finally {
      setGenerating(false);
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
    // Reset ads — useEffect will restore saved or regenerate
    setAds([]);
  }

  const selectedCount = ads.filter((a) => a.selected).length;

  async function handleContinue() {
    if (!project) return;
    setSaving(true);
    try {
      // Merge ads: keep existing from other platform + current platform ads
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
          <p className="text-foreground/80 font-medium text-sm">Generando copies para {platform === "google" ? "Google Ads" : "Meta Ads"}…</p>
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
    <div className="flex flex-col gap-5">
      {/* Platform switcher */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-orbi-muted shrink-0">Plataforma:</p>
        <div className="flex gap-2">
          {(["google", "meta"] as AdPlatform[]).map((p) => {
            const m = PLATFORM_META[p];
            const active = platform === p;
            return (
              <button
                key={p}
                onClick={() => switchPlatform(p)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  active
                    ? `${m.bg} ${m.border} ${m.color}`
                    : "border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground/80"
                }`}
              >
                {m.label}
              </button>
            );
          })}
          <button
            onClick={() => generate(platform)}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground/80 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerar todo
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-orbi-muted leading-relaxed">
          Selecciona los anuncios que quieres guardar. Cada ícono representa un <strong className="text-white">ángulo de persuasión</strong> distinto.
          Puedes copiar cualquier elemento individualmente.
        </p>
        <div className="shrink-0 text-right">
          <span className="text-2xl font-bold text-foreground">{selectedCount}</span>
          <p className="text-[10px] text-orbi-secondary mt-0.5">seleccionados</p>
        </div>
      </div>

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

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-orbi-border">
        <p className="text-sm text-orbi-muted">
          {selectedCount === 0 ? "Selecciona al menos un anuncio para continuar" : `${selectedCount} anuncio${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}`}
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
