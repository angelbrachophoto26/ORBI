import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProductBrief, AudiencePersona, AdVariant, AdPlatform, AdAngle } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function uid() { return Math.random().toString(36).slice(2, 10); }

function buildPrompt(
  brief: ProductBrief,
  audiences: AudiencePersona[],
  keywords: string[],
  platform: AdPlatform
): string {
  const audienceSummary = audiences
    .map((a) => `${a.name} (${a.role}): ${a.jtbd}`)
    .join("\n");
  const pains = audiences.flatMap((a) => a.topPains).slice(0, 6).join(", ");
  const vocab = audiences.flatMap((a) => a.keyVocabulary).slice(0, 15).join(", ");
  const topKeywords = keywords.slice(0, 10).join(", ");

  if (platform === "google") {
    return `Eres un experto en Google Ads RSA (Responsive Search Ads). Genera copies de alto rendimiento para este producto.

PRODUCTO:
- Nombre: ${brief.productName}
- Problema que resuelve: ${brief.targetProblem}
- Propuesta de valor única: ${brief.uniqueValue}
- Precio: ${brief.priceRange}
- Categoría: ${brief.category}

AUDIENCIAS:
${audienceSummary}

DOLORES PRINCIPALES: ${pains}
VOCABULARIO DEL CLIENTE: ${vocab}
KEYWORDS OBJETIVO: ${topKeywords}

INSTRUCCIONES CRÍTICAS RSA:
- Cada headline: MÁXIMO 30 caracteres (cuenta espacios y puntuación)
- Cada description: MÁXIMO 90 caracteres
- Los headlines deben funcionar INDEPENDIENTEMENTE en cualquier combinación
- Genera 5 ángulos distintos, cada uno con 3 headlines y 2 descriptions
- Ángulos: pain (dolor), outcome (resultado), social_proof (prueba social), curiosity (curiosidad), urgency (urgencia)
- Usa el vocabulario real del cliente, no términos genéricos
- Incluye números cuando puedas ("3x más rápido", "en 5 min")

Responde SOLO con JSON válido:

{
  "angles": [
    {
      "angle": "pain",
      "angleLabel": "Problema que resuelven",
      "headlines": ["headline 1", "headline 2", "headline 3"],
      "descriptions": ["description 1 max 90 chars", "description 2 max 90 chars"]
    },
    {
      "angle": "outcome",
      "angleLabel": "Resultado que obtienen",
      "headlines": ["headline 1", "headline 2", "headline 3"],
      "descriptions": ["description 1", "description 2"]
    },
    {
      "angle": "social_proof",
      "angleLabel": "Prueba social",
      "headlines": ["headline 1", "headline 2", "headline 3"],
      "descriptions": ["description 1", "description 2"]
    },
    {
      "angle": "curiosity",
      "angleLabel": "Curiosidad",
      "headlines": ["headline 1", "headline 2", "headline 3"],
      "descriptions": ["description 1", "description 2"]
    },
    {
      "angle": "urgency",
      "angleLabel": "Urgencia / Oferta",
      "headlines": ["headline 1", "headline 2", "headline 3"],
      "descriptions": ["description 1", "description 2"]
    }
  ]
}`;
  }

  // Meta
  return `Eres un experto en Meta Ads (Facebook e Instagram). Genera copies de alto rendimiento para este producto.

PRODUCTO:
- Nombre: ${brief.productName}
- Problema que resuelve: ${brief.targetProblem}
- Propuesta de valor única: ${brief.uniqueValue}
- Precio: ${brief.priceRange}
- Categoría: ${brief.category}

AUDIENCIAS:
${audienceSummary}

DOLORES PRINCIPALES: ${pains}
VOCABULARIO DEL CLIENTE: ${vocab}

INSTRUCCIONES CRÍTICAS META ADS:
- primaryText: máximo 125 caracteres (lo que se ve antes del "ver más") — gancho fuerte en la primera línea
- headline: máximo 40 caracteres — va debajo de la imagen
- description: máximo 30 caracteres — subtítulo del headline
- Genera 5 ángulos distintos
- El primaryText debe empezar con un gancho emocional o pregunta que pare el scroll
- Habla directamente al lector ("tú", "tu", "¿ya tienes...")
- Usa el vocabulario real del cliente
- Para el CTA elige el más apropiado según el objetivo del ángulo:
  opciones exactas: "Enviar mensaje", "Más información", "Contactar", "Comprar ahora", "Registrarse", "Suscribirse", "Ver más"

Responde SOLO con JSON válido:

{
  "angles": [
    {
      "angle": "pain",
      "angleLabel": "Problema que resuelven",
      "primaryText": "gancho + copy max 125 chars",
      "headline": "headline max 40 chars",
      "description": "descripción max 30 chars",
      "cta": "Enviar mensaje"
    },
    {
      "angle": "outcome",
      "angleLabel": "Resultado que obtienen",
      "primaryText": "...",
      "headline": "...",
      "description": "...",
      "cta": "Más información"
    },
    {
      "angle": "social_proof",
      "angleLabel": "Prueba social",
      "primaryText": "...",
      "headline": "...",
      "description": "...",
      "cta": "Contactar"
    },
    {
      "angle": "curiosity",
      "angleLabel": "Curiosidad",
      "primaryText": "...",
      "headline": "...",
      "description": "...",
      "cta": "Más información"
    },
    {
      "angle": "urgency",
      "angleLabel": "Urgencia / Oferta",
      "primaryText": "...",
      "headline": "...",
      "description": "...",
      "cta": "Comprar ahora"
    }
  ]
}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const brief = body.brief as ProductBrief;
  const audiences = (body.audiences ?? []) as AudiencePersona[];
  const keywords = (body.keywords ?? []) as string[];
  const platform = (body.platform ?? "google") as AdPlatform;

  if (!brief?.productName) {
    return NextResponse.json({ error: "Datos insuficientes" }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(brief, audiences, keywords, platform) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");

    const data = JSON.parse(match[0]) as {
      angles: Array<{
        angle: AdAngle;
        angleLabel: string;
        headlines?: string[];
        descriptions?: string[];
        primaryText?: string;
        headline?: string;
        description?: string;
        cta?: string;
      }>;
    };

    const ads: AdVariant[] = data.angles.map((a) => ({
      id: uid(),
      platform,
      angle: a.angle,
      angleLabel: a.angleLabel,
      headlines: a.headlines,
      descriptions: a.descriptions,
      primaryText: a.primaryText,
      headline: a.headline,
      description: a.description,
      cta: a.cta,
      selected: false,
    }));

    return NextResponse.json({ ads });
  } catch (err) {
    console.error("generate-ads error:", err);
    return NextResponse.json({ error: "Error generando anuncios" }, { status: 500 });
  }
}
