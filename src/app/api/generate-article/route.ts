import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProductBrief, AudiencePersona, BlogArticle, BlogSection } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function uid() { return Math.random().toString(36).slice(2, 10); }

function buildPrompt(brief: ProductBrief, audiences: AudiencePersona[], keywords: string[]): string {
  const audienceSummary = audiences.map((a) => `${a.name}: ${a.jtbd}`).join("\n");
  const pains = audiences.flatMap((a) => a.topPains).slice(0, 6).join(", ");
  const vocab = audiences.flatMap((a) => a.keyVocabulary).slice(0, 15).join(", ");
  const topKw = keywords.slice(0, 8).join(", ");
  const primaryKw = keywords[0] ?? brief.targetProblem;

  return `Eres un redactor SEO experto. Escribe un artículo de blog completo, optimizado para SEO y para el lector humano.

PRODUCTO:
- Nombre: ${brief.productName}
- Problema que resuelve: ${brief.targetProblem}
- Propuesta de valor: ${brief.uniqueValue}
- Precio: ${brief.priceRange}
- Categoría: ${brief.category}
- Web: ${brief.website ?? "no disponible"}

AUDIENCIAS OBJETIVO:
${audienceSummary}

DOLORES PRINCIPALES: ${pains}
VOCABULARIO DEL CLIENTE: ${vocab}
KEYWORDS OBJETIVO: ${topKw}
KEYWORD PRINCIPAL: ${primaryKw}

INSTRUCCIONES PARA EL ARTÍCULO:
- Longitud: 900-1200 palabras en total
- Título H1: atractivo, contiene la keyword principal, max 65 caracteres
- Meta description: max 155 caracteres, incluye keyword, persuasivo
- Slug URL: kebab-case, max 60 chars, basado en keyword principal
- Intro: 2-3 párrafos que enganchen al lector con el problema y prometan solución
- 4-6 secciones H2 con contenido sustancial (150-200 palabras cada una)
- Subsecciones H3 donde ayude a estructurar (opcional)
- Conclusión: resumen + llamada a la acción natural
- Tono: profesional pero cercano, usa "tú"
- Incluye la keyword principal en: título, intro, al menos 2 H2, conclusión
- NO menciones a competidores por nombre
- NO inventes estadísticas — usa frases como "muchas empresas" en vez de "el 87% de..."
- Tiempo de lectura estimado en minutos

Responde SOLO con JSON válido:

{
  "title": "Título H1 del artículo",
  "metaDescription": "Meta description max 155 chars",
  "slug": "url-en-kebab-case",
  "targetKeyword": "${primaryKw}",
  "readingTime": 5,
  "intro": "Párrafo(s) de introducción...",
  "sections": [
    {
      "heading": "Título de la sección H2",
      "level": 2,
      "content": "Contenido de la sección, 150-200 palabras..."
    },
    {
      "heading": "Subtítulo H3 opcional",
      "level": 3,
      "content": "Contenido..."
    }
  ],
  "conclusion": "Párrafo de conclusión con CTA natural...",
  "ctaText": "Texto de llamada a la acción directa (1-2 frases)"
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
      max_tokens: 6000,
      messages: [{ role: "user", content: buildPrompt(brief, audiences, keywords) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");

    const data = JSON.parse(match[0]) as Omit<BlogArticle, "sections"> & {
      sections: Array<{ heading: string; level: 2 | 3; content: string }>;
    };

    const article: BlogArticle = {
      title: data.title,
      metaDescription: data.metaDescription,
      slug: data.slug,
      targetKeyword: data.targetKeyword,
      readingTime: data.readingTime ?? 5,
      intro: data.intro,
      sections: data.sections.map((s) => ({ id: uid(), heading: s.heading, level: s.level, content: s.content })),
      conclusion: data.conclusion,
      ctaText: data.ctaText,
    };

    return NextResponse.json({ article });
  } catch (err) {
    console.error("generate-article error:", err);
    return NextResponse.json({ error: "Error generando el artículo" }, { status: 500 });
  }
}
