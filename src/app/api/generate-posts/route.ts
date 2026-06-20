import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProductBrief, AudiencePersona, SocialPost, PostPlatform, PostPillar, PostFormat } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function uid() { return Math.random().toString(36).slice(2, 10); }

function buildPrompt(brief: ProductBrief, audiences: AudiencePersona[], keywords: string[], platform: PostPlatform): string {
  const audienceSummary = audiences.map((a) => `${a.name}: ${a.jtbd}`).join("\n");
  const pains = audiences.flatMap((a) => a.topPains).slice(0, 5).join(", ");
  const vocab = audiences.flatMap((a) => a.keyVocabulary).slice(0, 12).join(", ");
  const topKw = keywords.slice(0, 8).join(", ");

  const platformRules = {
    instagram: `Instagram Feed Post:
- Hook: primera línea que para el scroll (máx 125 chars visibles antes del "más")
- Body: 150-300 chars, párrafos cortos, emojis estratégicos
- CTA: llamada a acción clara
- Hashtags: 5-10 relevantes (mezcla nicho + categoría)
- Para carousel: 5-7 slides con título de cada slide
- Para reel: gancho visual en primeros 3 segundos + script de 30-45 seg`,

    facebook: `Facebook Post:
- Hook: primera oración que genera curiosidad o empatía
- Body: 150-400 chars, storytelling, pregunta al final para generar comentarios
- CTA: claro y directo
- Hashtags: 2-3 máximo
- Para carousel: 4-6 slides
- Para reel/video: descripción atractiva del video`,

    linkedin: `LinkedIn Post:
- Hook: primera línea audaz, sin contexto previo (max 200 chars antes del "ver más")
- Body: 300-600 chars, estructura con líneas cortas y espacios, tono profesional-humano
- CTA: invitar a comentar, compartir experiencia o conectar
- Hashtags: 3-5 relevantes al sector
- Para carousel: 6-8 slides con insights accionables
- Para reel: formato "lección aprendida" o "detrás de escena"`,
  };

  return `Eres un experto en social media marketing. Genera posts de alto rendimiento para ${platform === "instagram" ? "Instagram" : platform === "facebook" ? "Facebook" : "LinkedIn"}.

PRODUCTO:
- Nombre: ${brief.productName}
- Problema que resuelve: ${brief.targetProblem}
- Propuesta de valor: ${brief.uniqueValue}
- Precio: ${brief.priceRange}
- Categoría: ${brief.category}

AUDIENCIAS:
${audienceSummary}

DOLORES: ${pains}
VOCABULARIO DEL CLIENTE: ${vocab}
KEYWORDS: ${topKw}

REGLAS DE PLATAFORMA:
${platformRules[platform]}

INSTRUCCIONES:
- Genera 5 posts, uno por cada pilar de contenido
- Pilares: educational, pain, outcome, behind_scenes, promotional
- Usa el vocabulario REAL del cliente, no términos genéricos
- El hook debe parar el scroll — no empieces con el nombre del producto
- Cada post debe funcionar SOLO, sin contexto previo
- Varía los formatos: mínimo 2 feed, 2 carousel, 1 reel

Responde SOLO con JSON válido:

{
  "posts": [
    {
      "pillar": "educational",
      "pillarLabel": "Educativo",
      "format": "carousel",
      "hook": "primera línea que para el scroll",
      "body": "cuerpo del post",
      "cta": "llamada a la acción",
      "hashtags": ["hashtag1", "hashtag2"],
      "carouselSlides": ["Slide 1: título", "Slide 2: título", "Slide 3: título", "Slide 4: título", "Slide 5: título"]
    },
    {
      "pillar": "pain",
      "pillarLabel": "Problema",
      "format": "feed",
      "hook": "...",
      "body": "...",
      "cta": "...",
      "hashtags": []
    },
    {
      "pillar": "outcome",
      "pillarLabel": "Resultado",
      "format": "reel",
      "hook": "...",
      "body": "...",
      "cta": "...",
      "hashtags": [],
      "reelScript": "Script del reel:\n[0-3s] gancho visual\n[3-15s] desarrollo\n[15-30s] conclusión + CTA"
    },
    {
      "pillar": "behind_scenes",
      "pillarLabel": "Detrás de escena",
      "format": "feed",
      "hook": "...",
      "body": "...",
      "cta": "...",
      "hashtags": []
    },
    {
      "pillar": "promotional",
      "pillarLabel": "Promocional",
      "format": "carousel",
      "hook": "...",
      "body": "...",
      "cta": "...",
      "hashtags": [],
      "carouselSlides": ["Slide 1", "Slide 2", "Slide 3", "Slide 4"]
    }
  ]
}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const brief = body.brief as ProductBrief;
  const audiences = (body.audiences ?? []) as AudiencePersona[];
  const keywords = (body.keywords ?? []) as string[];
  const platform = (body.platform ?? "instagram") as PostPlatform;

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

    const data = JSON.parse(match[0]) as { posts: Array<{
      pillar: PostPillar; pillarLabel: string; format: PostFormat;
      hook: string; body: string; cta: string; hashtags: string[];
      carouselSlides?: string[]; reelScript?: string;
    }> };

    const posts: SocialPost[] = data.posts.map((p) => ({
      id: uid(),
      platform,
      format: p.format,
      pillar: p.pillar,
      pillarLabel: p.pillarLabel,
      hook: p.hook,
      body: p.body,
      cta: p.cta,
      hashtags: p.hashtags ?? [],
      carouselSlides: p.carouselSlides,
      reelScript: p.reelScript,
      selected: false,
    }));

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("generate-posts error:", err);
    return NextResponse.json({ error: "Error generando posts" }, { status: 500 });
  }
}
