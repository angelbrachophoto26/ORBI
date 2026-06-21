"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SocialPost, PostPlatform, PostFormat, ModuleSlug } from "@/types";
import { setActiveProject } from "@/lib/store";
import { updateProjectProgress, savePosts } from "@/lib/supabase/projects";
import { useActiveProject } from "@/lib/useActiveProject";
import Button from "@/components/ui/Button";
import {
  ArrowRight, Loader2, Copy, Check, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";

const PLATFORM_META: Record<PostPlatform, { label: string; color: string; bg: string; border: string; badge: string; icon: React.ReactNode }> = {
  instagram: {
    label: "Instagram", color: "text-pink-400", bg: "bg-pink-950/30",
    border: "border-pink-900/40", badge: "bg-pink-500/10 text-pink-400",
    icon: <span className="text-sm">📸</span>,
  },
  facebook: {
    label: "Facebook", color: "text-blue-400", bg: "bg-blue-950/30",
    border: "border-blue-900/40", badge: "bg-blue-500/10 text-blue-400",
    icon: <span className="text-[13px] font-bold leading-none">f</span>,
  },
  linkedin: {
    label: "LinkedIn", color: "text-sky-400", bg: "bg-sky-950/30",
    border: "border-sky-900/40", badge: "bg-sky-500/10 text-sky-400",
    icon: <span className="text-sm">💼</span>,
  },
};

const FORMAT_META: Record<PostFormat, { label: string; icon: string }> = {
  feed: { label: "Feed", icon: "🖼️" },
  carousel: { label: "Carousel", icon: "🎠" },
  reel: { label: "Reel / Video", icon: "🎬" },
};

const PILLAR_ICONS: Record<string, string> = {
  educational: "📚",
  pain: "🔥",
  outcome: "🎯",
  behind_scenes: "🔍",
  promotional: "⚡",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={handleCopy} className="p-1 rounded text-orbi-secondary hover:text-foreground/80 hover:bg-orbi-primary transition-colors" title="Copiar">
      {copied ? <Check className="w-3.5 h-3.5 text-orbi-accent" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function PostCard({ post, platform, onToggle, onRegenerate, regenerating }: {
  post: SocialPost;
  platform: PostPlatform;
  onToggle: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const pm = PLATFORM_META[platform];
  const fmt = FORMAT_META[post.format];
  const selectedColor = { instagram: "border-pink-600 bg-pink-950/10", facebook: "border-blue-600 bg-blue-950/10", linkedin: "border-sky-600 bg-sky-950/10" }[platform];
  const checkColor = { instagram: "border-pink-500 bg-pink-500", facebook: "border-blue-500 bg-blue-500", linkedin: "border-sky-500 bg-sky-500" }[platform];
  const textColor = { instagram: "text-pink-300", facebook: "text-blue-300", linkedin: "text-sky-300" }[platform];

  const fullText = [post.hook, "", post.body, "", post.cta, "", post.hashtags.map(h => `#${h}`).join(" ")].join("\n").trim();

  return (
    <div className={`rounded-xl border transition-all ${post.selected ? `${selectedColor}` : "border-orbi-border bg-orbi-surface/60"} ${regenerating ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
        <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${post.selected ? checkColor : "border-slate-600"}`}>
          {post.selected && <Check className="w-3 h-3 text-foreground" strokeWidth={3} />}
        </div>
        <span className="text-lg">{PILLAR_ICONS[post.pillar]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${post.selected ? textColor : "text-white"}`}>{post.pillarLabel}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${pm.badge}`}>{fmt.icon} {fmt.label}</span>
          </div>
          <p className="text-xs text-orbi-muted truncate mt-0.5">{post.hook}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {regenerating && <Loader2 className="w-3.5 h-3.5 animate-spin text-orbi-muted" />}
          <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="p-1 rounded text-orbi-secondary hover:text-orbi-accent hover:bg-orbi-primary/10 transition-colors" title="Regenerar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <CopyButton text={fullText} />
          <button onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }} className="text-orbi-muted hover:text-foreground/80 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-orbi-border/60 pt-3">
          {/* Hook */}
          <div>
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-1.5">Hook — para el scroll</p>
            <div className="flex items-start gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
              <p className="flex-1 text-sm text-foreground font-medium leading-relaxed">{post.hook}</p>
              <CopyButton text={post.hook} />
            </div>
          </div>

          {/* Body */}
          <div>
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-1.5">Cuerpo</p>
            <div className="flex items-start gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
              <p className="flex-1 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.body}</p>
              <CopyButton text={post.body} />
            </div>
          </div>

          {/* CTA */}
          <div>
            <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-1.5">CTA</p>
            <div className="flex items-center gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
              <p className="flex-1 text-sm text-orbi-accent">{post.cta}</p>
              <CopyButton text={post.cta} />
            </div>
          </div>

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-1.5">Hashtags</p>
              <div className="flex items-start gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {post.hashtags.map((h, i) => (
                    <span key={i} className="text-[11px] text-blue-400 bg-blue-950/30 border border-blue-900/30 rounded px-1.5 py-0.5">#{h}</span>
                  ))}
                </div>
                <CopyButton text={post.hashtags.map(h => `#${h}`).join(" ")} />
              </div>
            </div>
          )}

          {/* Carousel slides */}
          {post.format === "carousel" && post.carouselSlides && (
            <div>
              <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-1.5">🎠 Slides del Carousel</p>
              <div className="space-y-1.5">
                {post.carouselSlides.map((slide, i) => (
                  <div key={i} className="flex items-center gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
                    <span className="text-[10px] text-orbi-secondary w-5 shrink-0 font-mono">{i + 1}</span>
                    <span className="flex-1 text-xs text-foreground/80">{slide}</span>
                    <CopyButton text={slide} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reel script */}
          {post.format === "reel" && post.reelScript && (
            <div>
              <p className="text-[10px] font-semibold text-orbi-muted uppercase tracking-widest mb-1.5">🎬 Script del Reel</p>
              <div className="flex items-start gap-2 bg-orbi-card/40 rounded-lg px-3 py-2">
                <p className="flex-1 text-xs text-orbi-muted leading-relaxed whitespace-pre-wrap font-mono">{post.reelScript}</p>
                <CopyButton text={post.reelScript} />
              </div>
            </div>
          )}

          {/* Copy all */}
          <button
            onClick={() => navigator.clipboard.writeText(fullText)}
            className="w-full text-xs text-orbi-muted hover:text-foreground/80 border border-orbi-border hover:border-orbi-border-light rounded-lg py-2 transition-colors flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar post completo
          </button>
        </div>
      )}
    </div>
  );
}

export default function PostGeneratorForm() {
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError } = useActiveProject();
  const [platform, setPlatform] = useState<PostPlatform>("instagram");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [generating, setGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAudiences = (project?.audiences ?? []).filter(a => project?.selectedAudienceIds?.includes(a.id));
  const selectedKeywords = (project?.keywords ?? []).flatMap(c => c.keywords.filter(k => k.selected).map(k => k.phrase)).slice(0, 10);

  useEffect(() => {
    if (projectLoading || !project) return;
    if (!project.productBrief) { setError("Completa el Product Brief primero."); return; }

    const saved = (project.posts ?? []).filter(p => p.platform === platform);
    if (saved.length > 0) { setPosts(saved); return; }

    generate(platform);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, projectLoading, platform]);

  async function generate(p: PostPlatform) {
    if (!project?.productBrief) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: project.productBrief, audiences: selectedAudiences, keywords: selectedKeywords, platform: p }),
      });
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
      else setError(data.error ?? "No se pudieron generar los posts.");
    } catch { setError("Error de red."); }
    finally { setGenerating(false); }
  }

  async function regenerateOne(id: string) {
    if (!project?.productBrief) return;
    setRegeneratingId(id);
    try {
      const res = await fetch("/api/generate-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: project.productBrief, audiences: selectedAudiences, keywords: selectedKeywords, platform }),
      });
      const data = await res.json();
      if (data.posts?.length) {
        const replacement = data.posts[Math.floor(Math.random() * data.posts.length)];
        replacement.id = Math.random().toString(36).slice(2, 10);
        setPosts(prev => prev.map(p => p.id === id ? replacement : p));
      }
    } catch { /* keep existing */ }
    finally { setRegeneratingId(null); }
  }

  function togglePost(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  }

  function switchPlatform(p: PostPlatform) {
    setPlatform(p);
    setPosts([]);
  }

  const selectedCount = posts.filter(p => p.selected).length;

  async function handleContinue() {
    if (!project) return;
    setSaving(true);
    try {
      const otherPosts = (project.posts ?? []).filter(p => p.platform !== platform);
      const allPosts = [...otherPosts, ...posts];
      const updated = {
        ...project,
        posts: allPosts,
        completedModules: (project.completedModules.includes("post-generator")
          ? project.completedModules
          : [...project.completedModules, "post-generator"]) as ModuleSlug[],
        lastModule: "content-generator" as const,
        updatedAt: new Date().toISOString(),
      };
      setActiveProject(updated);
      try {
        await savePosts(updated.id, allPosts);
        await updateProjectProgress(updated.id, updated.completedModules, "content-generator");
      } catch (e) { console.error("Supabase sync failed:", e); }
      router.push(`/module/content-generator?pid=${updated.id}`);
    } catch (e) { console.error(e); setSaving(false); }
  }

  if (projectLoading || generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <span className="text-5xl">📸</span>
          <div className="absolute -top-1 -right-1">
            <Loader2 className="w-5 h-5 text-orbi-accent animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-foreground/80 font-medium text-sm">Generando posts para {PLATFORM_META[platform].label}…</p>
          <p className="text-orbi-muted text-xs mt-1">5 pilares de contenido — 10–15 seg</p>
        </div>
        <div className="w-full space-y-3 mt-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 rounded-xl border border-orbi-border bg-orbi-surface/40 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (projectError || error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-foreground/80 text-sm">{projectError || error}</p>
        <Button onClick={() => router.push("/dashboard")} size="sm">Volver al dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Platform switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-orbi-muted shrink-0">Plataforma:</p>
        {(["instagram", "facebook", "linkedin"] as PostPlatform[]).map(p => {
          const m = PLATFORM_META[p];
          const active = platform === p;
          return (
            <button key={p} onClick={() => switchPlatform(p)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${active ? `${m.bg} ${m.border} ${m.color}` : "border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground/80"}`}>
              {m.icon} {m.label}
            </button>
          );
        })}
        <button onClick={() => generate(platform)}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-orbi-border text-orbi-muted hover:border-orbi-border-light hover:text-foreground/80 transition-all flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3" /> Regenerar todo
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-orbi-muted leading-relaxed">
          Cada post cubre un <strong className="text-white">pilar de contenido</strong> distinto. Selecciona los que quieres guardar y copia cualquier elemento individualmente.
        </p>
        <div className="shrink-0 text-right">
          <span className="text-2xl font-bold text-foreground">{selectedCount}</span>
          <p className="text-[10px] text-orbi-secondary mt-0.5">seleccionados</p>
        </div>
      </div>

      {/* Pillar legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PILLAR_ICONS).map(([key, icon]) => (
          <span key={key} className="text-[11px] px-2 py-1 rounded-full bg-orbi-card text-orbi-muted border border-orbi-border-light">
            {icon} {key === "educational" ? "Educativo" : key === "pain" ? "Problema" : key === "outcome" ? "Resultado" : key === "behind_scenes" ? "Detrás de escena" : "Promocional"}
          </span>
        ))}
      </div>

      {/* Post cards */}
      <div className="space-y-3">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            platform={platform}
            onToggle={() => togglePost(post.id)}
            onRegenerate={() => regenerateOne(post.id)}
            regenerating={regeneratingId === post.id}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-orbi-border">
        <p className="text-sm text-orbi-muted">
          {selectedCount === 0 ? "Selecciona posts para continuar" : `${selectedCount} post${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}`}
        </p>
        <Button size="lg" disabled={saving} onClick={handleContinue}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : <>Continuar a Blog<ArrowRight className="ml-2 w-4 h-4" /></>}
        </Button>
      </div>
    </div>
  );
}
