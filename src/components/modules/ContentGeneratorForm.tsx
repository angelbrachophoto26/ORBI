"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlogArticle, BlogSection, ModuleSlug } from "@/types";
import { setActiveProject } from "@/lib/store";
import { updateProjectProgress, saveArticle } from "@/lib/supabase/projects";
import { useActiveProject } from "@/lib/useActiveProject";
import Button from "@/components/ui/Button";
import {
  ArrowRight, Loader2, Copy, Check, AlertCircle,
  RefreshCw, FileText, Clock, Hash, ChevronDown, ChevronUp,
} from "lucide-react";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span>{copied ? "Copiado" : label}</span>}
    </button>
  );
}

function CharBadge({ text, limit, label }: { text: string; limit: number; label: string }) {
  const len = text.length;
  const over = len > limit;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${over ? "bg-rose-950/60 text-rose-400" : "bg-slate-800 text-slate-500"}`}>
      {label}: {len}/{limit}
    </span>
  );
}

function SectionCard({ section, index, onRegenerate, regenerating }: {
  section: BlogSection;
  index: number;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const isH3 = section.level === 3;

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/60 ${regenerating ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isH3 ? "bg-slate-800 text-slate-400" : "bg-emerald-950/50 text-emerald-400"}`}>
          H{section.level}
        </span>
        <p className="flex-1 text-sm font-semibold text-white truncate">{section.heading}</p>
        <div className="flex items-center gap-1 shrink-0">
          {regenerating && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          <CopyButton text={`## ${section.heading}\n\n${section.content}`} />
          <button onClick={onRegenerate} className="p-1 rounded text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors" title="Regenerar sección">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800/60 pt-3">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{section.content}</p>
        </div>
      )}
    </div>
  );
}

function buildMarkdown(article: BlogArticle): string {
  const lines: string[] = [
    `# ${article.title}`,
    "",
    article.intro,
    "",
    ...article.sections.flatMap((s) => [
      `${"#".repeat(s.level)} ${s.heading}`,
      "",
      s.content,
      "",
    ]),
    article.conclusion,
    "",
    `---`,
    `*${article.ctaText}*`,
  ];
  return lines.join("\n");
}

export default function ContentGeneratorForm() {
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError } = useActiveProject();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [generating, setGenerating] = useState(false);
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAudiences = (project?.audiences ?? []).filter(a => project?.selectedAudienceIds?.includes(a.id));
  const selectedKeywords = (project?.keywords ?? []).flatMap(c => c.keywords.filter(k => k.selected).map(k => k.phrase));

  useEffect(() => {
    if (projectLoading || !project) return;
    if (!project.productBrief) { setError("Completa el Product Brief primero."); return; }
    if (project.article) { setArticle(project.article); return; }
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, projectLoading]);

  async function generate() {
    if (!project?.productBrief) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: project.productBrief,
          audiences: selectedAudiences,
          keywords: selectedKeywords,
        }),
      });
      const data = await res.json();
      if (data.article) setArticle(data.article);
      else setError(data.error ?? "No se pudo generar el artículo.");
    } catch { setError("Error de red."); }
    finally { setGenerating(false); }
  }

  async function regenerateSection(id: string) {
    if (!article || !project?.productBrief) return;
    setRegeneratingSectionId(id);
    try {
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: project.productBrief, audiences: selectedAudiences, keywords: selectedKeywords }),
      });
      const data = await res.json();
      if (data.article?.sections?.length) {
        const newSection = data.article.sections[Math.floor(Math.random() * data.article.sections.length)];
        newSection.id = Math.random().toString(36).slice(2, 10);
        setArticle(prev => prev ? { ...prev, sections: prev.sections.map(s => s.id === id ? newSection : s) } : prev);
      }
    } catch { /* keep existing */ }
    finally { setRegeneratingSectionId(null); }
  }

  async function handleContinue() {
    if (!article || !project) return;
    setSaving(true);
    try {
      const updated = {
        ...project,
        article,
        completedModules: (project.completedModules.includes("content-generator")
          ? project.completedModules
          : [...project.completedModules, "content-generator"]) as ModuleSlug[],
        lastModule: "team-briefing" as const,
        updatedAt: new Date().toISOString(),
      };
      setActiveProject(updated);
      try {
        await saveArticle(updated.id, article);
        await updateProjectProgress(updated.id, updated.completedModules, "team-briefing");
      } catch (e) { console.error("Supabase sync failed:", e); }
      router.push(`/module/team-briefing?pid=${updated.id}`);
    } catch (e) { console.error(e); setSaving(false); }
  }

  if (projectLoading || generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <FileText className="w-10 h-10 text-slate-700" />
          <div className="absolute -top-1 -right-1">
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-slate-300 font-medium text-sm">Redactando artículo SEO…</p>
          <p className="text-slate-500 text-xs mt-1">900-1200 palabras con estructura H1/H2/H3 — 15–20 seg</p>
        </div>
        <div className="w-full space-y-3 mt-2">
          {[1, 2, 3, 4].map(i => <div key={i} className={`rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse ${i === 1 ? "h-16" : "h-32"}`} />)}
        </div>
      </div>
    );
  }

  if (projectError || error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-slate-300 text-sm">{projectError || error}</p>
        <Button onClick={() => router.push("/dashboard")} size="sm">Volver al dashboard</Button>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* SEO Meta panel */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">SEO Metadata</span>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">{article.readingTime} min de lectura</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded">H1</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Título</span>
            <CharBadge text={article.title} limit={65} label="chars" />
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2">
            <p className="flex-1 text-sm font-semibold text-white">{article.title}</p>
            <CopyButton text={article.title} />
          </div>
        </div>

        {/* Meta description */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Meta description</span>
            <CharBadge text={article.metaDescription} limit={155} label="chars" />
          </div>
          <div className="flex items-start gap-2 bg-slate-900/60 rounded-lg px-3 py-2">
            <p className="flex-1 text-xs text-slate-300 leading-relaxed">{article.metaDescription}</p>
            <CopyButton text={article.metaDescription} />
          </div>
        </div>

        {/* Slug + Keyword */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">URL Slug</p>
            <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2">
              <Hash className="w-3 h-3 text-slate-600 shrink-0" />
              <p className="flex-1 text-xs text-blue-300 font-mono truncate">{article.slug}</p>
              <CopyButton text={article.slug} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Keyword Principal</p>
            <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2">
              <p className="flex-1 text-xs text-yellow-300 truncate">{article.targetKeyword}</p>
              <CopyButton text={article.targetKeyword} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-400">{article.sections.length} secciones · Haz clic en <RefreshCw className="w-3 h-3 inline" /> para regenerar cualquier sección</p>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(buildMarkdown(article))}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar Markdown
          </button>
          <button
            onClick={generate}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Regenerar todo
          </button>
        </div>
      </div>

      {/* Intro */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Introducción</span>
          <CopyButton text={article.intro} label="Copiar" />
        </div>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{article.intro}</p>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {article.sections.map((section, i) => (
          <SectionCard
            key={section.id}
            section={section}
            index={i}
            onRegenerate={() => regenerateSection(section.id)}
            regenerating={regeneratingSectionId === section.id}
          />
        ))}
      </div>

      {/* Conclusion */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Conclusión</span>
          <CopyButton text={article.conclusion} label="Copiar" />
        </div>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{article.conclusion}</p>
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">CTA Final</span>
          <CopyButton text={article.ctaText} label="Copiar" />
        </div>
        <p className="text-sm text-emerald-300 leading-relaxed">{article.ctaText}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <p className="text-sm text-slate-500">Artículo listo — guárdalo y continúa al resumen final</p>
        <Button size="lg" disabled={saving} onClick={handleContinue}>
          {saving
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
            : <>Continuar al Team Briefing<ArrowRight className="ml-2 w-4 h-4" /></>}
        </Button>
      </div>
    </div>
  );
}
