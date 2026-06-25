import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProductBrief, AudiencePersona } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(
  brief: ProductBrief,
  audiences: AudiencePersona[],
  keywords: string[]
): string {
  const audienceSummary = audiences
    .map((a) => `- ${a.name} (${a.age}, ${a.role}): ${a.jtbd}`)
    .join("\n");

  const ageRanges = audiences.map((a) => a.age).join(", ");
  const channels = [...new Set(audiences.flatMap((a) => a.channels))].join(", ");
  const topKeywords = keywords.slice(0, 8).join(", ");
  const pains = audiences.flatMap((a) => a.topPains).slice(0, 5).join(", ");

  return `Eres un experto certificado en Meta Ads Manager con 10 años de experiencia creando campañas de alto ROI.

Basándote en los datos del producto y audiencias, genera una configuración completa y específica para Meta Ads Manager.

PRODUCTO:
- Nombre: ${brief.productName}
- Categoría: ${brief.category}
- Problema que resuelve: ${brief.targetProblem}
- Propuesta de valor única: ${brief.uniqueValue}
- Precio: ${brief.priceRange}

AUDIENCIAS OBJETIVO:
${audienceSummary}

RANGOS DE EDAD: ${ageRanges}
CANALES QUE USAN: ${channels}
DOLORES PRINCIPALES: ${pains}
KEYWORDS OBJETIVO: ${topKeywords}

INSTRUCCIONES:
- Genera valores ESPECÍFICOS para este producto, no genéricos
- Para "detailedTargeting" incluye 6-8 intereses/comportamientos exactos buscables en Meta Ads
- Para "location" incluye país y ciudad con radio en km si aplica
- Para "dailyBudget" sugiere un rango realista en euros
- Para "ageRange" basa el rango en los datos de audiencia
- Para cada campo incluye una "note" breve (max 12 palabras) que explique el porqué
- Para "objective": elige entre Mensajes, Conversiones, Tráfico, Reconocimiento, Clientes potenciales
- Para "messageDestination": elige el canal más adecuado (WhatsApp, Instagram DM, Messenger)
- Para "placements": elige "Advantage+ automático" o "Manual" con justificación específica
- Para "format": elige imagen estática, video corto, o carrusel con justificación

Responde SOLO con JSON válido sin comentarios:

{
  "campaign": {
    "campaignName": {
      "value": "nombre sugerido de la campaña",
      "note": "breve justificación"
    },
    "objective": {
      "value": "objetivo exacto como aparece en Meta",
      "note": "breve justificación"
    },
    "specialCategories": {
      "value": "Ninguna",
      "note": "breve justificación"
    }
  },
  "adSet": {
    "messageDestination": {
      "value": "canal específico",
      "note": "breve justificación"
    },
    "location": {
      "value": "país, ciudad o región específica",
      "note": "breve justificación"
    },
    "ageRange": {
      "value": "XX-XX años",
      "note": "breve justificación"
    },
    "gender": {
      "value": "Todos / Hombres / Mujeres",
      "note": "breve justificación"
    },
    "detailedTargeting": {
      "value": "Interés 1, Interés 2, Comportamiento 1, Cargo 1, Interés 3, Interés 4, Comportamiento 2, Interés 5",
      "note": "breve justificación"
    },
    "languages": {
      "value": "idioma(s) específico(s)",
      "note": "breve justificación"
    },
    "dailyBudget": {
      "value": "XX€ - XX€/día",
      "note": "breve justificación"
    },
    "duration": {
      "value": "XX días",
      "note": "breve justificación"
    },
    "placements": {
      "value": "Advantage+ automático / Manual: Feed Instagram + Stories",
      "note": "breve justificación"
    }
  },
  "ad": {
    "format": {
      "value": "tipo de formato",
      "note": "breve justificación"
    },
    "advertiserName": {
      "value": "nombre del anunciante recomendado",
      "note": "breve justificación"
    },
    "creativeDescription": {
      "value": "descripción del creative ideal: qué mostrar en la imagen/video",
      "note": "breve justificación"
    }
  }
}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const brief = body.brief as ProductBrief;
  const audiences = (body.audiences ?? []) as AudiencePersona[];
  const keywords = (body.keywords ?? []) as string[];

  if (!brief?.productName) {
    return NextResponse.json({ error: "Datos insuficientes" }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: buildPrompt(brief, audiences, keywords) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");

    const config = JSON.parse(match[0]);
    return NextResponse.json({ config });
  } catch (err) {
    console.error("generate-meta-config error:", err);
    return NextResponse.json({ error: "Error generando configuración" }, { status: 500 });
  }
}
