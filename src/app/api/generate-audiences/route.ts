import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProductBrief, AudiencePersona } from "@/types";
import { generateAudiences as generateLocal } from "@/lib/generateAudiences";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(brief: ProductBrief): string {
  return `Eres un estratega de marketing senior especializado en Jobs To Be Done y segmentación de audiencias. Tu tarea es generar 4 perfiles de audiencia para este producto siguiendo un pipeline de 3 pasos.

PRODUCTO:
- Nombre: ${brief.productName}
- Descripción: ${brief.productDescription}
- Categoría: ${brief.category}
- Problema que resuelve: ${brief.targetProblem}
- Propuesta de valor: ${brief.uniqueValue}
- Precio: ${brief.priceRange}

PIPELINE:

PASO 1 — DETECTA la relación comprador/usuario:
Analiza el producto y determina si: (a) la misma persona compra y usa, (b) quien paga es diferente a quien usa (ej: manager compra para su equipo), o (c) alguien compra para otro (ej: padre para hijo, cuidador para familiar). Esta relación define qué perfiles generas.

PASO 2 — APLICA Jobs To Be Done:
Cada perfil debe estar definido por su motivación real de compra, NO por su demografía. El JTBD sigue el formato: "Cuando [situación concreta que activa la búsqueda], busco ${brief.productName} para [resultado esperado], sin [obstáculo principal que quiero evitar]."

PASO 3 — VALIDA coherencia:
Antes de incluir un perfil, verifica que: su disposición a pagar sea coherente con el precio (${brief.priceRange}), el problema que sufre sea coherente con "${brief.targetProblem}", y los canales donde lo encontrarías sean reales para ese perfil.

REGLAS ESTRICTAS:
- Los nombres de perfil son descriptivos del arquetipo, NUNCA incluyen estadísticas o porcentajes
- El contenido de los perfiles NO copia literalmente texto del brief — transforma y contextualiza
- Cada perfil debe sentirse como una persona real, con situación de vida concreta y edad
- El vocabulario clave son las palabras EXACTAS que esa persona escribiría en Google

Responde SOLO con un array JSON válido, sin markdown, sin explicación:

[
  {
    "id": "a1b2c3d4",
    "name": "Nombre descriptivo del arquetipo (sin estadísticas)",
    "age": "rango de edad ej: 28-40",
    "role": "Rol en la decisión de compra y relación con el problema",
    "companyProfile": "Situación de vida concreta — contexto actual, no demografía genérica",
    "jtbd": "Cuando [situación concreta], busco ${brief.productName} para [resultado], sin [obstáculo].",
    "topPains": ["dolor específico 1", "dolor específico 2", "dolor específico 3", "dolor específico 4"],
    "triggerEvents": ["trigger real 1", "trigger real 2", "trigger real 3", "trigger real 4"],
    "desiredOutcomes": ["outcome concreto 1", "outcome concreto 2", "outcome concreto 3"],
    "keyVocabulary": ["búsqueda exacta 1", "búsqueda exacta 2", "búsqueda 3", "búsqueda 4", "búsqueda 5", "búsqueda 6"],
    "channels": ["canal real 1", "canal real 2", "canal real 3", "canal real 4"],
    "objections": ["objeción concreta 1", "objeción concreta 2", "objeción concreta 3"]
  }
]`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const brief = body.brief as ProductBrief;

  if (!brief?.productName || !brief?.targetProblem) {
    return NextResponse.json({ error: "Datos insuficientes del producto" }, { status: 400 });
  }

  // Try Claude first
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(brief) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      const personas: AudiencePersona[] = JSON.parse(match[0]);
      const withIds = personas.map((p) => ({
        ...p,
        id: p.id || Math.random().toString(36).slice(2, 10),
      }));
      return NextResponse.json({ personas: withIds });
    }
  } catch (err) {
    console.error("Claude failed, using local generator:", err);
  }

  // Fallback: local generator
  const personas = generateLocal(brief);
  return NextResponse.json({ personas });
}
