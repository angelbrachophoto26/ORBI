"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrbiProject, ModuleSlug } from "@/types";
import { setActiveProject } from "@/lib/store";
import { updateProjectProgress } from "@/lib/supabase/projects";
import { useActiveProject } from "@/lib/useActiveProject";
import Button from "@/components/ui/Button";
import {
  Loader2, Copy, Check, AlertCircle, FileText,
  Users, Search, Megaphone, BookOpen, Target,
  ChevronDown, ChevronUp, Download,
} from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={handleCopy} className="p-1 rounded text-orbi-muted hover:text-slate-300 hover:bg-orbi-primary transition-colors" title="Copiar">
      {copied ? <Check className="w-3.5 h-3.5 text-orbi-accent" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Section({ icon, title, color, children }: {
  icon: React.ReactNode; title: string; color: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-orbi-border bg-orbi-surface/60 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-orbi-card/30 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-orbi-muted" /> : <ChevronDown className="w-4 h-4 text-orbi-muted" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-orbi-border/60 pt-4">{children}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-orbi-border/50 last:border-0">
      <span className="text-xs text-orbi-muted w-32 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 flex items-start gap-2">
        <span className="text-sm text-slate-300 leading-relaxed flex-1">{value}</span>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

function buildMarkdown(project: OrbiProject): string {
  const b = project.productBrief;
  const audiences = (project.audiences ?? []).filter(a => project.selectedAudienceIds?.includes(a.id));
  const keywords = (project.keywords ?? []).flatMap(c => c.keywords.filter(k => k.selected).map(k => k.phrase));
  const selectedAds = (project.ads ?? []).filter(a => a.selected);
  const selectedPosts = (project.posts ?? []).filter(p => p.selected);
  const article = project.article;

  const lines: string[] = [
    `# Team Briefing — ${b?.productName ?? "Proyecto"}`,
    `*Generado con Orbi · ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}*`,
    "",
    `## 1. Producto`,
    `- **Nombre:** ${b?.productName}`,
    `- **Categoría:** ${b?.category}`,
    `- **Problema que resuelve:** ${b?.targetProblem}`,
    `- **Propuesta de valor:** ${b?.uniqueValue}`,
    `- **Precio:** ${b?.priceRange}`,
    b?.website ? `- **Web:** ${b.website}` : "",
    "",
    `## 2. Audiencias Objetivo`,
    ...audiences.flatMap(a => [
      `### ${a.name}`,
      `**Rol:** ${a.role}`,
      `**Job to be done:** ${a.jtbd}`,
      `**Dolores principales:** ${a.topPains.join(", ")}`,
      `**Canales:** ${a.channels.join(", ")}`,
      "",
    ]),
    `## 3. Keywords Seleccionadas`,
    keywords.map(k => `- ${k}`).join("\n"),
    "",
    selectedAds.length > 0 ? [
      `## 4. Anuncios`,
      ...selectedAds.map(ad => [
        `### ${ad.angleLabel} (${ad.platform === "google" ? "Google Ads" : "Meta Ads"})`,
        ad.headlines ? `**Headlines:**\n${ad.headlines.map(h => `- ${h}`).join("\n")}` : "",
        ad.descriptions ? `**Descriptions:**\n${ad.descriptions.map(d => `- ${d}`).join("\n")}` : "",
        ad.primaryText ? `**Primary Text:** ${ad.primaryText}` : "",
        ad.headline ? `**Headline:** ${ad.headline}` : "",
        ad.description ? `**Description:** ${ad.description}` : "",
        "",
      ].filter(Boolean).join("\n")),
      "",
    ].join("\n") : "",
    selectedPosts.length > 0 ? [
      `## 5. Posts de Redes Sociales`,
      ...selectedPosts.map(post => [
        `### ${post.pillarLabel} — ${post.platform} (${post.format})`,
        `**Hook:** ${post.hook}`,
        `**Cuerpo:** ${post.body}`,
        `**CTA:** ${post.cta}`,
        post.hashtags.length > 0 ? `**Hashtags:** ${post.hashtags.map(h => `#${h}`).join(" ")}` : "",
        "",
      ].filter(Boolean).join("\n")),
      "",
    ].join("\n") : "",
    article ? [
      `## 6. Artículo de Blog`,
      `**Título:** ${article.title}`,
      `**Meta description:** ${article.metaDescription}`,
      `**URL:** /${article.slug}`,
      `**Keyword principal:** ${article.targetKeyword}`,
      "",
    ].join("\n") : "",
  ];

  return lines.filter(l => l !== undefined).join("\n").replace(/\n{3,}/g, "\n\n");
}

export default function TeamBriefingForm() {
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError } = useActiveProject();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const b = project?.productBrief;
  const audiences = (project?.audiences ?? []).filter(a => project?.selectedAudienceIds?.includes(a.id));
  const keywords = (project?.keywords ?? []).flatMap(c => c.keywords.filter(k => k.selected).map(k => k.phrase));
  const selectedAds = (project?.ads ?? []).filter(a => a.selected);
  const selectedPosts = (project?.posts ?? []).filter(p => p.selected);
  const article = project?.article;

  useEffect(() => {
    if (!projectLoading && project && project.completedModules.includes("team-briefing")) {
      setDone(true);
    }
  }, [project, projectLoading]);

  async function handleFinish() {
    if (!project) return;
    setSaving(true);
    try {
      const updated = {
        ...project,
        completedModules: (project.completedModules.includes("team-briefing")
          ? project.completedModules
          : [...project.completedModules, "team-briefing"]) as ModuleSlug[],
        lastModule: "team-briefing" as const,
        updatedAt: new Date().toISOString(),
      };
      setActiveProject(updated);
      await updateProjectProgress(updated.id, updated.completedModules, "team-briefing");
      setDone(true);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  if (projectLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-orbi-accent animate-spin" />
        <p className="text-orbi-muted text-sm">Cargando estrategia…</p>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-slate-300 text-sm">{projectError ?? "Proyecto no encontrado"}</p>
        <Button onClick={() => router.push("/dashboard")} size="sm">Volver al dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-orbi-muted leading-relaxed">
            Resumen completo de tu estrategia de marketing. Compártelo con tu equipo o socio copiando el documento en Markdown.
          </p>
        </div>
        <button
          onClick={() => project && navigator.clipboard.writeText(buildMarkdown(project))}
          className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-orbi-border-light text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Copiar Markdown
        </button>
      </div>

      {/* 1. Producto */}
      {b && (
        <Section icon={<Target className="w-4 h-4 text-orbi-accent" />} title="Producto" color="bg-emerald-950/40">
          <Row label="Nombre" value={b.productName} />
          <Row label="Categoría" value={b.category} />
          <Row label="Problema" value={b.targetProblem} />
          <Row label="Propuesta única" value={b.uniqueValue} />
          <Row label="Precio" value={b.priceRange} />
          {b.website && <Row label="Web" value={b.website} />}
        </Section>
      )}

      {/* 2. Audiencias */}
      {audiences.length > 0 && (
        <Section icon={<Users className="w-4 h-4 text-blue-400" />} title={`Audiencias (${audiences.length})`} color="bg-blue-950/40">
          <div className="space-y-5">
            {audiences.map((a, i) => (
              <div key={a.id} className={i > 0 ? "pt-5 border-t border-orbi-border" : ""}>
                <p className="text-sm font-semibold text-white mb-2">{a.name}</p>
                <Row label="Rol" value={a.role} />
                <Row label="JTBD" value={a.jtbd} />
                <Row label="Dolores" value={a.topPains.join(" · ")} />
                <Row label="Canales" value={a.channels.join(", ")} />
                <Row label="Vocabulario" value={a.keyVocabulary.join(", ")} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 3. Keywords */}
      {keywords.length > 0 && (
        <Section icon={<Search className="w-4 h-4 text-yellow-400" />} title={`Keywords (${keywords.length})`} color="bg-yellow-950/40">
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw, i) => (
              <span key={i} className="text-xs bg-orbi-card text-slate-300 border border-orbi-border-light rounded-full px-2.5 py-1">
                {kw}
              </span>
            ))}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(keywords.join("\n"))}
            className="mt-3 flex items-center gap-1.5 text-xs text-orbi-muted hover:text-slate-300 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar todas
          </button>
        </Section>
      )}

      {/* 4. Anuncios */}
      {selectedAds.length > 0 && (
        <Section icon={<Megaphone className="w-4 h-4 text-purple-400" />} title={`Anuncios seleccionados (${selectedAds.length})`} color="bg-purple-950/40">
          <div className="space-y-4">
            {selectedAds.map(ad => (
              <div key={ad.id} className="rounded-lg border border-orbi-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{ad.angleLabel}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orbi-card text-orbi-muted">{ad.platform === "google" ? "Google Ads" : "Meta Ads"}</span>
                </div>
                {ad.headlines && (
                  <div>
                    <p className="text-[10px] text-orbi-secondary mb-1">Headlines</p>
                    {ad.headlines.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <span className="text-xs text-orbi-muted flex-1">{h}</span>
                        <CopyButton text={h} />
                      </div>
                    ))}
                  </div>
                )}
                {ad.primaryText && (
                  <div>
                    <p className="text-[10px] text-orbi-secondary mb-1">Primary Text</p>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-orbi-muted flex-1 leading-relaxed">{ad.primaryText}</span>
                      <CopyButton text={ad.primaryText} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 5. Posts */}
      {selectedPosts.length > 0 && (
        <Section icon={<FileText className="w-4 h-4 text-pink-400" />} title={`Posts seleccionados (${selectedPosts.length})`} color="bg-pink-950/40">
          <div className="space-y-4">
            {selectedPosts.map(post => (
              <div key={post.id} className="rounded-lg border border-orbi-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{post.pillarLabel}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orbi-card text-orbi-muted capitalize">{post.platform} · {post.format}</span>
                </div>
                <div className="flex items-start gap-2">
                  <p className="text-xs text-slate-300 flex-1 leading-relaxed"><strong className="text-orbi-muted">Hook:</strong> {post.hook}</p>
                  <CopyButton text={`${post.hook}\n\n${post.body}\n\n${post.cta}`} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 6. Artículo */}
      {article && (
        <Section icon={<BookOpen className="w-4 h-4 text-amber-400" />} title="Artículo de Blog" color="bg-amber-950/40">
          <Row label="Título" value={article.title} />
          <Row label="Meta description" value={article.metaDescription} />
          <Row label="URL" value={`/${article.slug}`} />
          <Row label="Keyword" value={article.targetKeyword} />
          <Row label="Lectura" value={`${article.readingTime} min`} />
          <div className="mt-3 pt-3 border-t border-orbi-border">
            <p className="text-[10px] text-orbi-muted mb-2 uppercase tracking-wider">Secciones</p>
            <div className="flex flex-wrap gap-2">
              {article.sections.map(s => (
                <span key={s.id} className="text-[11px] bg-orbi-card text-orbi-muted border border-orbi-border-light rounded px-2 py-0.5">
                  H{s.level} {s.heading}
                </span>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Completion banner */}
      {done && (
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-5 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-orbi-accent font-semibold text-sm">¡Estrategia completa!</p>
          <p className="text-orbi-muted text-xs mt-1">Has completado los 7 módulos de Orbi. Tu estrategia de marketing está lista.</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-orbi-border">
        <p className="text-sm text-orbi-muted">
          {done ? "Estrategia guardada ✓" : "Revisa el resumen y finaliza tu estrategia"}
        </p>
        {!done ? (
          <Button size="lg" disabled={saving} onClick={handleFinish}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : "Finalizar estrategia 🎉"}
          </Button>
        ) : (
          <Button size="lg" variant="secondary" onClick={() => router.push("/dashboard")}>
            Volver al dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
