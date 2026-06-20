import { MODULES } from "@/lib/modules";
import ModulePanel, { KeywordTip } from "@/components/layout/ModulePanel";
import ProductBriefForm from "@/components/modules/ProductBriefForm";
import AudienceDiscoveryForm from "@/components/modules/AudienceDiscoveryForm";
import KeywordIntelligenceForm from "@/components/modules/KeywordIntelligenceForm";
import AdGeneratorForm from "@/components/modules/AdGeneratorForm";
import PostGeneratorForm from "@/components/modules/PostGeneratorForm";
import ContentGeneratorForm from "@/components/modules/ContentGeneratorForm";
import TeamBriefingForm from "@/components/modules/TeamBriefingForm";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";

const MODULE_META: Record<
  string,
  { what: string; how: string; next: string }
> = {
  "product-brief": {
    what: "Aquí defines la base de toda tu estrategia. Orbi necesita entender tu producto para generar contenido relevante y personalizado en cada módulo.",
    how: "Completa todos los campos con información real y específica. Cuanto más detalle des, mejores serán los resultados en los siguientes pasos.",
    next: "Con esta información, Orbi identificará automáticamente las audiencias ideales para tu producto en el módulo de Audience Discovery.",
  },
  "audience-discovery": {
    what: "Orbi analiza tu product brief para sugerirte segmentos de audiencia con alta probabilidad de conversión.",
    how: "Revisa las audiencias sugeridas y selecciona las que más se alinean con tu visión. Puedes editar o agregar audiencias personalizadas.",
    next: "Las audiencias seleccionadas guiarán la generación de keywords y el tono del contenido en los módulos siguientes.",
  },
  "keyword-intelligence": {
    what: "Genera un mapa de keywords organizado por intención de búsqueda: informacional, comercial y transaccional.",
    how: "Revisa las keywords sugeridas por Orbi basadas en tu producto y audiencias. Selecciona las más relevantes.",
    next: "Las keywords seleccionadas se usarán para optimizar los anuncios, posts y el artículo de blog.",
  },
  "ad-generator": {
    what: "Orbi crea copies de anuncios listos para usar en Google Ads, Meta Ads y otras plataformas.",
    how: "Selecciona el formato y plataforma deseada. Orbi generará múltiples variantes que puedes editar.",
    next: "Los copies aprobados se pueden usar directamente o servirán de base para los posts de redes sociales.",
  },
  "post-generator": {
    what: "Genera posts optimizados para Facebook e Instagram, con caption, hashtags y llamada a la acción.",
    how: "Selecciona el objetivo del post (engagement, conversión, branding) y el tono. Orbi crea varias versiones.",
    next: "Los posts se integrarán en el artículo de blog como contenido complementario.",
  },
  "content-generator": {
    what: "Crea un artículo de blog SEO-optimizado basado en tu producto, audiencias y keywords seleccionadas.",
    how: "Orbi genera el artículo completo con estructura H1/H2/H3, intro, cuerpo y conclusión. Puedes editar cada sección.",
    next: "El artículo y todo el contenido generado se incluirán en el Team Briefing final.",
  },
  "team-briefing": {
    what: "Genera un documento visual y profesional que resume toda la estrategia de marketing para compartir con tu equipo.",
    how: "Revisa el resumen generado por Orbi. Puedes exportarlo como PDF o compartir el enlace directamente.",
    next: "¡Tu estrategia de marketing está lista! Usa el Team Briefing como punto de partida para ejecutar tus campañas.",
  },
};

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const module = MODULES.find((m) => m.slug === slug);
  if (!module) notFound();

  const meta = MODULE_META[slug];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-6 md:gap-8 p-4 md:p-8 min-h-screen">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">
              Módulo {module.order} de 7
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">{module.title}</h1>
          <p className="text-slate-400 text-sm">{module.description}</p>
        </div>

        {/* Module content */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-6">
          {slug === "product-brief" && <ProductBriefForm />}
          {slug === "audience-discovery" && <AudienceDiscoveryForm />}
          {slug === "keyword-intelligence" && <KeywordIntelligenceForm />}
          {slug === "ad-generator" && <AdGeneratorForm />}
          {slug === "post-generator" && <PostGeneratorForm />}
          {slug === "content-generator" && <ContentGeneratorForm />}
          {slug === "team-briefing" && <TeamBriefingForm />}

          {!["product-brief","audience-discovery","keyword-intelligence","ad-generator","post-generator","content-generator","team-briefing"].includes(slug) && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-2xl bg-slate-800/60 mb-4">
                <Package className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">
                Módulo en construcción
              </h3>
              <p className="text-slate-500 text-sm max-w-xs">
                Este módulo estará disponible próximamente. Completa primero el Product Brief.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Side panel — top on mobile, right on desktop */}
      {meta && (
        <ModulePanel
          what={meta.what}
          how={meta.how}
          next={meta.next}
          extra={slug === "keyword-intelligence" ? <KeywordTip /> : undefined}
          className="md:self-start md:sticky md:top-8 md:w-72 w-full"
        />
      )}
    </div>
  );
}
