"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Keyword, KeywordCluster } from "@/lib/generateKeywords";
import { ModuleSlug } from "@/types";
import { setActiveProject } from "@/lib/store";
import { updateProjectProgress, saveKeywords } from "@/lib/supabase/projects";
import { useActiveProject } from "@/lib/useActiveProject";
import Button from "@/components/ui/Button";
import {
  ArrowRight,
  Loader2,
  Search,
  TrendingUp,
  ShoppingCart,
  BookOpen,
  Check,
  AlertCircle,
  BarChart2,
} from "lucide-react";

const INTENT_META = {
  informacional: {
    label: "Informacional",
    desc: "El usuario aprende o investiga. Ideal para blog, guías y contenido SEO.",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-950/30",
    border: "border-blue-900/40",
    pill: "bg-blue-950/50 text-blue-300 border border-blue-900/50",
  },
  comercial: {
    label: "Comercial",
    desc: "El usuario compara opciones. Ideal para landing pages y casos de éxito.",
    icon: TrendingUp,
    color: "text-yellow-400",
    bg: "bg-yellow-950/20",
    border: "border-yellow-900/30",
    pill: "bg-yellow-950/40 text-yellow-300 border border-yellow-900/40",
  },
  transaccional: {
    label: "Transaccional",
    desc: "El usuario está listo para actuar. Ideal para ads, precios y CTAs directos.",
    icon: ShoppingCart,
    color: "text-emerald-400",
    bg: "bg-emerald-950/20",
    border: "border-emerald-900/30",
    pill: "bg-emerald-950/40 text-emerald-300 border border-emerald-900/40",
  },
};

const VOLUME_COLORS = {
  alta: "text-emerald-400",
  media: "text-yellow-400",
  baja: "text-slate-500",
};

const DIFFICULTY_COLORS = {
  baja: "text-emerald-400",
  media: "text-yellow-400",
  alta: "text-rose-400",
};

function KeywordRow({
  kw,
  onToggle,
}: {
  kw: Keyword;
  onToggle: () => void;
}) {
  const intentMeta = INTENT_META[kw.intent];
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
        kw.selected
          ? "bg-slate-800 border border-slate-600"
          : "hover:bg-slate-800/50 border border-transparent"
      }`}
    >
      {/* Checkbox */}
      <div
        className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${
          kw.selected ? "border-emerald-500 bg-emerald-500" : "border-slate-600"
        }`}
      >
        {kw.selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>

      {/* Keyword phrase */}
      <span className={`flex-1 text-sm ${kw.selected ? "text-white" : "text-slate-300"}`}>
        {kw.phrase}
      </span>

      {/* Volume */}
      <div className="hidden sm:flex items-center gap-1 w-16 justify-end">
        <BarChart2 className={`w-3 h-3 ${VOLUME_COLORS[kw.estimatedVolume]}`} />
        <span className={`text-[11px] ${VOLUME_COLORS[kw.estimatedVolume]}`}>
          {kw.estimatedVolume}
        </span>
      </div>

      {/* Difficulty */}
      <div className={`hidden sm:block w-12 text-right text-[11px] ${DIFFICULTY_COLORS[kw.difficulty]}`}>
        {kw.difficulty}
      </div>
    </div>
  );
}

function ClusterSection({
  cluster,
  onToggle,
}: {
  cluster: KeywordCluster;
  onToggle: (kwId: string) => void;
}) {
  const meta = INTENT_META[cluster.intent];
  const Icon = meta.icon;
  const selectedCount = cluster.keywords.filter((k) => k.selected).length;

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${meta.color}`} />
            <span className={`text-sm font-semibold ${meta.color}`}>{cluster.name}</span>
          </div>
          <span className="text-xs text-slate-500">
            {selectedCount}/{cluster.keywords.length} seleccionadas
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{meta.desc}</p>
      </div>

      {/* Column headers */}
      <div className="hidden sm:flex items-center gap-3 px-3 pt-2 pb-1">
        <div className="w-4 shrink-0" />
        <span className="flex-1 text-[10px] text-slate-600 uppercase tracking-widest">Keyword</span>
        <span className="w-16 text-right text-[10px] text-slate-600 uppercase tracking-widest">Volumen</span>
        <span className="w-12 text-right text-[10px] text-slate-600 uppercase tracking-widest">Dificult.</span>
      </div>

      {/* Keywords */}
      <div className="px-1 pb-2">
        {cluster.keywords.map((kw) => (
          <KeywordRow key={kw.id} kw={kw} onToggle={() => onToggle(kw.id)} />
        ))}
      </div>
    </div>
  );
}

export default function KeywordIntelligenceForm() {
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError } = useActiveProject();
  const [clusters, setClusters] = useState<KeywordCluster[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectLoading || !project) return;

    if (!project.productBrief) {
      setError("Completa el Product Brief primero.");
      return;
    }

    if (project.keywords && project.keywords.length > 0) {
      setClusters(project.keywords);
      return;
    }

    const audiences = project.audiences?.filter((a) =>
      project.selectedAudienceIds?.includes(a.id)
    ) ?? [];

    setGenerating(true);
    fetch("/api/generate-keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: project.productBrief, audiences }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clusters) setClusters(data.clusters);
        else setError("No se pudieron generar las keywords.");
      })
      .catch(() => setError("Error de red al generar keywords."))
      .finally(() => setGenerating(false));
  }, [project, projectLoading]);

  function toggleKeyword(kwId: string) {
    setClusters((prev) =>
      prev.map((cluster) => ({
        ...cluster,
        keywords: cluster.keywords.map((kw) =>
          kw.id === kwId ? { ...kw, selected: !kw.selected } : kw
        ),
      }))
    );
  }

  const totalSelected = clusters.reduce(
    (acc, c) => acc + c.keywords.filter((k) => k.selected).length,
    0
  );

  async function handleContinue() {
    if (totalSelected === 0 || !project) return;
    setSaving(true);
    try {
      const updated = {
        ...project,
        keywords: clusters,
        completedModules: (project.completedModules.includes("keyword-intelligence")
          ? project.completedModules
          : [...project.completedModules, "keyword-intelligence"]) as ModuleSlug[],
        lastModule: "ad-generator" as const,
        updatedAt: new Date().toISOString(),
      };
      setActiveProject(updated);
      try {
        await saveKeywords(updated.id, clusters);
        await updateProjectProgress(updated.id, updated.completedModules, "ad-generator");
      } catch (syncErr) {
        console.error("Supabase sync failed (continuing):", syncErr);
      }
      router.push(`/module/ad-generator?pid=${updated.id}`);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  const loading = projectLoading || generating;
  const displayError = projectError || error;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <Search className="w-10 h-10 text-slate-700" />
          <div className="absolute -top-1 -right-1">
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-slate-300 font-medium text-sm">Mapeando tu universo de keywords...</p>
          <p className="text-slate-500 text-xs mt-1">Organizando por intención de búsqueda</p>
        </div>
        <div className="w-full space-y-3 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-slate-300 text-sm">{displayError}</p>
        <Button onClick={() => router.push("/dashboard")} size="sm">
          Volver al dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">
              {clusters.reduce((a, c) => a + c.keywords.length, 0)} keywords generadas
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Selecciona las keywords más relevantes para tu estrategia. Están organizadas
            por <strong className="text-white">intención de búsqueda</strong> para que sepas cuándo y dónde usarlas.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-2xl font-bold text-white">{totalSelected}</span>
          <p className="text-[10px] text-slate-600 mt-0.5">seleccionadas</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(INTENT_META) as [string, typeof INTENT_META[keyof typeof INTENT_META]][]).map(([key, meta]) => (
          <span key={key} className={`text-[11px] px-2 py-1 rounded-full ${meta.pill}`}>
            {meta.label}
          </span>
        ))}
        <span className="text-[11px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          Volumen: alta / media / baja
        </span>
        <span className="text-[11px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          Dificultad: baja / media / alta
        </span>
      </div>

      {/* Clusters */}
      <div className="space-y-4">
        {clusters.map((cluster) => (
          <ClusterSection key={cluster.name} cluster={cluster} onToggle={toggleKeyword} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <p className="text-sm text-slate-500">
          {totalSelected === 0
            ? "Selecciona keywords para continuar"
            : `${totalSelected} keyword${totalSelected !== 1 ? "s" : ""} seleccionada${totalSelected !== 1 ? "s" : ""}`}
        </p>
        <Button size="lg" disabled={totalSelected === 0 || saving} onClick={handleContinue}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Continuar a Anuncios
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
