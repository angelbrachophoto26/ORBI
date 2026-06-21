"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AudiencePersona, ModuleSlug } from "@/types";
import { setActiveProject } from "@/lib/store";
import { updateProjectProgress, saveAudiences } from "@/lib/supabase/projects";
import { useActiveProject } from "@/lib/useActiveProject";
import Button from "@/components/ui/Button";
import {
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Users,
  Target,
  Zap,
  MessageSquare,
  Radio,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

function PersonaCard({
  persona,
  selected,
  onToggle,
  onDiscard,
}: {
  persona: AudiencePersona;
  selected: boolean;
  onToggle: () => void;
  onDiscard: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        selected
          ? "border-orbi-accent bg-emerald-950/20 shadow-emerald-900/30 shadow-lg"
          : "border-orbi-border bg-orbi-surface/60 hover:border-orbi-border-light"
      }`}
    >
      {/* Card header */}
      <div
        className="p-4 cursor-pointer"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div
            className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              selected
                ? "border-orbi-accent bg-orbi-primary"
                : "border-slate-600 bg-transparent"
            }`}
          >
            {selected && <Check className="w-3 h-3 text-foreground" strokeWidth={3} />}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={`font-semibold text-sm leading-tight ${selected ? "text-orbi-accent" : "text-white"}`}>
                  {persona.name}
                </h3>
                <p className="text-xs text-orbi-muted mt-0.5">{persona.role}</p>
                {persona.age && (
                  <p className="text-[10px] text-orbi-secondary mt-0.5">{persona.age} años</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onDiscard(); }}
                  className="p-1 rounded text-orbi-secondary hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                  title="Descartar y generar otra"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                  className="text-orbi-muted hover:text-foreground/80 transition-colors"
                  aria-label={expanded ? "Colapsar" : "Ver detalles"}
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Company profile */}
            <p className="text-xs text-orbi-muted mt-2 leading-relaxed">{persona.companyProfile}</p>

            {/* JTBD preview */}
            <div className="mt-3 p-2.5 rounded-lg bg-orbi-card">
              <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3 italic">
                &ldquo;{persona.jtbd}&rdquo;
              </p>
            </div>

            {/* Top pains preview */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {persona.topPains.slice(0, 2).map((pain, i) => (
                <span
                  key={i}
                  className="text-[10px] text-orbi-muted bg-orbi-card rounded-full px-2 py-0.5 leading-none"
                >
                  {pain.length > 40 ? pain.slice(0, 40) + "…" : pain}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-orbi-border px-4 pb-4 space-y-4 mt-0">
          {/* Triggers */}
          <Section icon={<Zap className="w-3.5 h-3.5 text-yellow-500" />} title="Trigger events">
            <ul className="space-y-1">
              {persona.triggerEvents.map((t, i) => (
                <li key={i} className="text-xs text-orbi-muted flex gap-1.5 leading-relaxed">
                  <span className="text-yellow-600 shrink-0 mt-0.5">→</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Desired outcomes */}
          <Section icon={<Target className="w-3.5 h-3.5 text-orbi-accent" />} title="Lo que quiere lograr">
            <ul className="space-y-1">
              {persona.desiredOutcomes.map((o, i) => (
                <li key={i} className="text-xs text-orbi-muted flex gap-1.5 leading-relaxed">
                  <Check className="w-3 h-3 text-orbi-accent-dim shrink-0 mt-0.5" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Vocabulary */}
          <Section icon={<MessageSquare className="w-3.5 h-3.5 text-blue-400" />} title="Vocabulario clave">
            <div className="flex flex-wrap gap-1.5">
              {persona.keyVocabulary.map((word, i) => (
                <span
                  key={i}
                  className="text-[10px] text-blue-300 bg-blue-950/40 border border-blue-900/40 rounded px-1.5 py-0.5"
                >
                  {word}
                </span>
              ))}
            </div>
          </Section>

          {/* Channels */}
          <Section icon={<Radio className="w-3.5 h-3.5 text-purple-400" />} title="Dónde encontrarlos">
            <div className="flex flex-wrap gap-1.5">
              {persona.channels.map((ch, i) => (
                <span
                  key={i}
                  className="text-[10px] text-purple-300 bg-purple-950/40 border border-purple-900/40 rounded px-1.5 py-0.5"
                >
                  {ch}
                </span>
              ))}
            </div>
          </Section>

          {/* Objections */}
          <Section icon={<AlertCircle className="w-3.5 h-3.5 text-rose-400" />} title="Objeciones frecuentes">
            <ul className="space-y-1">
              {persona.objections.map((o, i) => (
                <li key={i} className="text-xs text-orbi-muted flex gap-1.5 leading-relaxed">
                  <span className="text-rose-600 shrink-0">?</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-3">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-widest text-orbi-muted">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function AudienceDiscoveryForm() {
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError } = useActiveProject();
  const [personas, setPersonas] = useState<AudiencePersona[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectLoading || !project) return;

    if (!project.productBrief) {
      setError("Completa el Product Brief primero para generar audiencias.");
      return;
    }

    // Restore previously saved audiences if any
    if (project.audiences && project.audiences.length > 0) {
      setPersonas(project.audiences);
      setSelectedIds(new Set(project.selectedAudienceIds ?? []));
      return;
    }

    setGenerating(true);
    fetch("/api/generate-audiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: project.productBrief }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.personas) {
          setPersonas(data.personas);
          setActiveProject({ ...project, audiences: data.personas });
        } else {
          setError(data.error ?? "No se pudieron generar las audiencias.");
        }
      })
      .catch(() => setError("Error de red al generar audiencias."))
      .finally(() => setGenerating(false));

    return () => {};
  }, [project, projectLoading]);

  async function discardAndRegenerate(id: string) {
    if (!project?.productBrief) return;
    setRegeneratingId(id);
    try {
      const res = await fetch("/api/generate-audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: project.productBrief }),
      });
      const data = await res.json();
      if (data.personas && data.personas.length > 0) {
        const newPersona = data.personas[Math.floor(Math.random() * data.personas.length)];
        newPersona.id = Math.random().toString(36).slice(2, 10);
        setPersonas((prev) => prev.map((p) => p.id === id ? newPersona : p));
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }
    } catch {
      // silently fail — keep existing persona
    } finally {
      setRegeneratingId(null);
    }
  }

  function togglePersona(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 3) return prev; // max 3
        next.add(id);
      }
      return next;
    });
  }

  async function handleContinue() {
    if (selectedIds.size === 0 || !project) return;
    setSaving(true);
    try {
      const selectedAudienceIds = Array.from(selectedIds);
      const updated = {
        ...project,
        audiences: personas,
        selectedAudienceIds,
        completedModules: (project.completedModules.includes("audience-discovery")
          ? project.completedModules
          : [...project.completedModules, "audience-discovery"]) as ModuleSlug[],
        lastModule: "keyword-intelligence" as const,
        updatedAt: new Date().toISOString(),
      };
      setActiveProject(updated);
      try {
        await saveAudiences(updated.id, personas, selectedAudienceIds);
        await updateProjectProgress(updated.id, updated.completedModules, "keyword-intelligence");
      } catch (syncErr) {
        console.error("Supabase sync failed (continuing):", syncErr);
      }
      router.push(`/module/keyword-intelligence?pid=${updated.id}`);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  const loading = projectLoading || generating;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <Users className="w-10 h-10 text-slate-700" />
          <div className="absolute -top-1 -right-1">
            <Loader2 className="w-5 h-5 text-orbi-accent animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-foreground/80 font-medium text-sm">Gemini está analizando tu producto...</p>
          <p className="text-orbi-muted text-xs mt-1">Identificando quién compra y quién usa — 10–20 seg</p>
        </div>
        {/* Skeleton cards */}
        <div className="w-full space-y-3 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-orbi-border bg-orbi-surface/40 animate-pulse" />
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
        <Button onClick={() => router.push("/dashboard")} size="sm">
          Volver al dashboard
        </Button>
      </div>
    );
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-orbi-accent" />
            <span className="text-xs font-semibold text-orbi-accent uppercase tracking-widest">
              {personas.length} audiencias generadas
            </span>
          </div>
          <p className="text-sm text-orbi-muted leading-relaxed">
            Selecciona hasta <strong className="text-white">3 audiencias</strong> que mejor representen
            a tus clientes ideales. Estas guiarán todo el contenido siguiente.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-2xl font-bold text-foreground">{selectedCount}</span>
          <span className="text-orbi-muted text-sm">/3</span>
          <p className="text-[10px] text-orbi-secondary mt-0.5">seleccionadas</p>
        </div>
      </div>

      {/* Selection progress */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < selectedCount ? "bg-orbi-primary" : "bg-orbi-card"
            }`}
          />
        ))}
      </div>

      {/* Persona cards */}
      <div className="space-y-3">
        {personas.map((persona) => (
          <div key={persona.id} className="relative">
            {regeneratingId === persona.id && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-orbi-surface/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-orbi-accent animate-spin" />
                  <span className="text-sm text-foreground/80">Generando nueva audiencia...</span>
                </div>
              </div>
            )}
            <PersonaCard
              persona={persona}
              selected={selectedIds.has(persona.id)}
              onToggle={() => togglePersona(persona.id)}
              onDiscard={() => discardAndRegenerate(persona.id)}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-orbi-border">
        <div className="text-sm text-orbi-muted">
          {selectedCount === 0 && "Selecciona al menos una audiencia para continuar"}
          {selectedCount === 1 && "1 audiencia seleccionada — puedes elegir hasta 2 más"}
          {selectedCount === 2 && "2 audiencias — puedes agregar 1 más o continuar"}
          {selectedCount === 3 && "Perfecto — 3 audiencias seleccionadas"}
        </div>
        <Button
          size="lg"
          disabled={selectedCount === 0 || saving}
          onClick={handleContinue}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Continuar a Keywords
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
