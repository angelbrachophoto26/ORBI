import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProductBrief, AudiencePersona } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const OBJECTIVE_LABELS: Record<string, string> = {
  mensajes: "Mensajes",
  reconocimiento: "Reconocimiento",
  trafico: "Tráfico",
  interaccion: "Interacción",
  clientes_potenciales: "Clientes potenciales",
  ventas: "Ventas",
};

function buildPrompt(
  brief: ProductBrief,
  audiences: AudiencePersona[],
  keywords: string[],
  forcedObjective?: string
): string {
  const audienceSummary = audiences
    .map((a) => `- ${a.name} (${a.age}, ${a.role}): ${a.jtbd}`)
    .join("\n");
  const ageRanges = audiences.map((a) => a.age).filter(Boolean).join(", ");
  const channels = [...new Set(audiences.flatMap((a) => a.channels))].slice(0, 5).join(", ");
  const pains = audiences.flatMap((a) => a.topPains).slice(0, 5).join("; ");
  const topKeywords = keywords.slice(0, 8).join(", ");

  const objectiveSection = forcedObjective
    ? `OBJETIVO FORZADO: El usuario ha elegido "${OBJECTIVE_LABELS[forcedObjective] ?? forcedObjective}". Usa este objetivo, no lo cambies.`
    : `OBJETIVO: Analiza el producto y elige el mejor objetivo. Lógica:
- Servicio local o freelance → "mensajes" o "clientes_potenciales"
- Marca nueva que busca visibilidad → "reconocimiento"
- Tiene web con contenido → "trafico"
- Vende productos físicos → "ventas"
- Busca engagement en redes → "interaccion"`;

  return `Eres un experto certificado en Meta Ads Manager con 10+ años de experiencia. Genera una configuración completa y específica para una campaña de Meta Ads.

PRODUCTO:
- Nombre: ${brief.productName}
- Descripción: ${brief.productDescription}
- Categoría: ${brief.category}
- Problema que resuelve: ${brief.targetProblem}
- Propuesta de valor: ${brief.uniqueValue}
- Precio: ${brief.priceRange}
${brief.website ? `- Web: ${brief.website}` : ""}

AUDIENCIAS:
${audienceSummary || "No definidas aún"}

RANGOS DE EDAD: ${ageRanges || "No definidos"}
CANALES QUE USAN: ${channels || "No definidos"}
DOLORES: ${pains || "No definidos"}
KEYWORDS: ${topKeywords || "No definidas"}

${objectiveSection}

INSTRUCCIONES CRÍTICAS:
1. Genera valores MUY ESPECÍFICOS para este producto (no genéricos).
2. Para "segmentación detallada": usa EXACTAMENTE los términos como aparecen en Meta Ads Manager (búscalos mentalmente).
   REGLA CRÍTICA DE SEGMENTACIÓN: incluye ÚNICAMENTE intereses de CLIENTES POTENCIALES (personas que contratan o compran).
   NUNCA incluyas perfiles del mismo sector profesional del usuario ni de su competencia directa.
   Ejemplo correcto — si el producto es fotografía gastronómica: "Restaurantes", "Hostelería", "Gestión de restaurantes", "Dueños de pequeñas empresas", "Food & beverage".
   Ejemplo INCORRECTO (prohibido): "Fotografía", "Fotógrafos profesionales", "Creadores de contenido".
   Regla universal: segmenta siempre hacia quien COMPRA o CONTRATA, nunca hacia quien COMPITE.
3. Para "presupuesto diario": da un rango realista en euros (€) con justificación de fase.
4. Para "alcance estimado": estima un rango realista según localización y segmentación.
5. Las "notas" son cortas (máx 12 palabras) y explican el porqué.
6. Los campos del conjunto de anuncios DEBEN adaptarse al objetivo:
   - mensajes → incluye "Destino de mensajes", "Aplicación de mensajería"
   - trafico → incluye "URL de destino", "Evento de optimización"
   - ventas → incluye "Catálogo Advantage+", "Píxel de Meta"
   - clientes_potenciales → incluye "Tipo de formulario"
   - interaccion → incluye "Tipo de interacción"
   - reconocimiento → incluye "Optimización de reconocimiento"
7. Incluye SIEMPRE estos campos en conjunto de anuncios: Público Advantage+, Lugares, Edad, Sexo, Segmentación detallada, Idiomas, Presupuesto diario, Fecha de inicio, Fecha de fin, Programación, Ubicaciones (Placements), Transparencia UE.
8. Para "Transparencia UE" usa el nombre del producto o negocio.

Responde SOLO con JSON válido (sin comentarios, sin markdown):

{
  "objective": {
    "id": "mensajes",
    "label": "Mensajes",
    "reason": "Frase corta explicando por qué este objetivo es el mejor para este producto (máx 20 palabras)"
  },
  "campaign": [
    { "label": "Nombre de la campaña", "value": "valor específico", "note": "nota corta" },
    { "label": "Tipo de compra", "value": "Subasta", "note": "nota corta" },
    { "label": "Objetivo", "value": "valor", "note": "nota corta" },
    { "label": "Categorías especiales", "value": "Ninguna", "note": "nota corta" },
    { "label": "Anuncio con video en vivo", "value": "Desactivado", "note": "nota corta" },
    { "label": "Prueba A/B", "value": "Desactivada", "note": "nota corta" },
    { "label": "Estrategia de presupuesto", "value": "Presupuesto de la campaña (Advantage+)", "note": "nota corta" }
  ],
  "adSet": [
    ... campos adaptados al objetivo + campos comunes ...
  ],
  "ad": [
    { "label": "Página de Facebook", "value": "nombre de la página", "note": "nota corta" },
    { "label": "Perfil de Instagram", "value": "@handle", "note": "nota corta" },
    { "label": "Configuración", "value": "Crear publicación nueva", "note": "nota corta" },
    { "label": "Formato recomendado", "value": "tipo + justificación breve", "note": "nota corta" },
    { "label": "Texto principal", "value": "copy específico máx 125 caracteres", "note": "nota corta" },
    { "label": "Headline", "value": "headline máx 40 caracteres", "note": "nota corta" },
    { "label": "Descripción", "value": "descripción máx 30 caracteres", "note": "nota corta" },
    { "label": "CTA (botón)", "value": "CTA exacto de Meta", "note": "nota corta" },
    { "label": "Descripción del creative", "value": "qué imagen/video usar y cómo", "note": "nota corta" }
  ],
  "summary": {
    "objective": "Objetivo → Destino (ej: Mensajes → Instagram DM)",
    "audience": "Rango edad, Ciudad + radio (ej: 28-45 años, Valencia +40km)",
    "budget": "€X/día · Y días = €Z total",
    "format": "tipos de formato recomendados",
    "estimatedReach": "NNK - NNK personas"
  }
}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const brief = body.brief as ProductBrief;
  const audiences = (body.audiences ?? []) as AudiencePersona[];
  const keywords = (body.keywords ?? []) as string[];
  const forcedObjective = body.forcedObjective as string | undefined;

  if (!brief?.productName) {
    return NextResponse.json({ error: "Datos insuficientes" }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(brief, audiences, keywords, forcedObjective) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");

    const config = JSON.parse(match[0]);
    return NextResponse.json({ config });
  } catch (err) {
    console.error("generate-meta-config error:", err);
    return NextResponse.json({ error: "Error generando la configuración" }, { status: 500 });
  }
}
