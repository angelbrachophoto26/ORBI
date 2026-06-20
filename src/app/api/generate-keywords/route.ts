import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProductBrief, AudiencePersona } from "@/types";
import { generateKeywords as generateLocal } from "@/lib/generateKeywords";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(brief: ProductBrief, audiences: AudiencePersona[]): string {
  const audienceVocab = audiences
    .flatMap((a) => a.keyVocabulary ?? [])
    .filter(Boolean)
    .slice(0, 20)
    .join(", ");

  const audienceRoles = audiences
    .map((a) => a.role?.split("—")[0]?.trim())
    .filter(Boolean)
    .join(" / ");

  return `Eres un experto en SEO y keyword research. Genera keywords de búsqueda REALES y ESPECÍFICAS para este producto.

PRODUCTO:
- Nombre: ${brief.productName}
- Problema que resuelve: ${brief.targetProblem}
- Propuesta de valor: ${brief.uniqueValue}
- Categoría: ${brief.category}
- Precio: ${brief.priceRange}

AUDIENCIAS OBJETIVO: ${audienceRoles}
VOCABULARIO QUE USA EL CLIENTE: ${audienceVocab}

INSTRUCCIONES CRÍTICAS:
1. Las keywords deben ser frases REALES que esa persona escribiría en Google — no genéricas
2. Usa el vocabulario exacto del cliente cuando sea relevante
3. NO uses placeholders como "[competidor]" o "[industria]" — usa nombres reales del sector o "alternativas"
4. Genera EXACTAMENTE 6 clusters con 15-20 keywords cada uno (total: ~100 keywords)
5. Los clusters deben cubrir ángulos distintos del mismo problema, no repetir frases
6. MEZCLA DE VOLUMEN OBLIGATORIA por cluster: ~30% volumen alto, ~40% medio, ~30% bajo
   - Alto: términos genéricos de categoría que miles buscan aunque tengan mucha competencia
   - Medio: frases más específicas con competencia moderada
   - Bajo: long-tail muy específicas, fáciles de rankear
7. NO generes solo long-tail — el usuario necesita ver el panorama completo: keywords de alto volumen aunque sean difíciles
8. Dificultad realista: categoría genérica = alta, comparativas = media, long-tail = baja, marca propia = baja

CLUSTERS REQUERIDOS (adapta los nombres al sector específico del producto):
- informacional_problema: dudas y problemas que busca resolver el cliente
- informacional_educacion: cómo hacer, guías, tutoriales del sector
- comercial_comparacion: comparativas, alternativas, "mejor X para Y"
- comercial_evaluacion: reviews, casos de éxito, precios, características
- transaccional_compra: ready-to-buy, descargar, contratar, probar gratis
- transaccional_marca: búsquedas de marca + modificadores de intención de compra

Responde SOLO con JSON válido, sin markdown ni texto extra:

{
  "informacional_problema": {
    "name": "nombre descriptivo del cluster",
    "intent": "informacional",
    "keywords": [
      {"phrase": "frase exacta de búsqueda", "volume": "alta|media|baja", "difficulty": "alta|media|baja"}
    ]
  },
  "informacional_educacion": {
    "name": "nombre descriptivo del cluster",
    "intent": "informacional",
    "keywords": []
  },
  "comercial_comparacion": {
    "name": "nombre descriptivo del cluster",
    "intent": "comercial",
    "keywords": []
  },
  "comercial_evaluacion": {
    "name": "nombre descriptivo del cluster",
    "intent": "comercial",
    "keywords": []
  },
  "transaccional_compra": {
    "name": "nombre descriptivo del cluster",
    "intent": "transaccional",
    "keywords": []
  },
  "transaccional_marca": {
    "name": "nombre descriptivo del cluster",
    "intent": "transaccional",
    "keywords": []
  }
}`;
}

type KwRaw = { phrase: string; volume: string; difficulty: string };
type ClusterRaw = { name: string; intent: string; keywords: KwRaw[] };

function uid() { return Math.random().toString(36).slice(2, 10); }

function parseCluster(c: ClusterRaw, intent: "informacional" | "comercial" | "transaccional") {
  return {
    name: c.name,
    intent,
    keywords: (c.keywords ?? []).map((k) => ({
      id: uid(),
      phrase: k.phrase,
      intent,
      cluster: c.name,
      estimatedVolume: (k.volume ?? "media") as "alta" | "media" | "baja",
      difficulty: (k.difficulty ?? "media") as "alta" | "media" | "baja",
      selected: false,
    })),
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const brief = body.brief as ProductBrief;
  const audiences = (body.audiences ?? []) as AudiencePersona[];

  if (!brief?.productName || !brief?.targetProblem) {
    return NextResponse.json({ error: "Datos insuficientes" }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      messages: [{ role: "user", content: buildPrompt(brief, audiences) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");

    const data = JSON.parse(match[0]) as Record<string, ClusterRaw>;

    const ORDER: [string, "informacional" | "comercial" | "transaccional"][] = [
      ["informacional_problema", "informacional"],
      ["informacional_educacion", "informacional"],
      ["comercial_comparacion", "comercial"],
      ["comercial_evaluacion", "comercial"],
      ["transaccional_compra", "transaccional"],
      ["transaccional_marca", "transaccional"],
    ];

    const clusters = ORDER
      .filter(([key]) => data[key]?.keywords?.length)
      .map(([key, intent]) => parseCluster(data[key], intent));

    return NextResponse.json({ clusters });
  } catch (err) {
    console.error("generate-keywords error, using local fallback:", err);
    const clusters = generateLocal(brief, audiences);
    return NextResponse.json({ clusters });
  }
}
