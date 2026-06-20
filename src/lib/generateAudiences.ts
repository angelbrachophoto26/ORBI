import { ProductBrief, AudiencePersona } from "@/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Paso 1: detectar relación comprador / usuario ─────────────────────────────
type BuyerUserRelation = "same" | "different" | "buys_for_others";

function detectBuyerUserRelation(brief: ProductBrief): BuyerUserRelation {
  const text = `${brief.targetProblem} ${brief.productDescription} ${brief.uniqueValue}`.toLowerCase();
  const category = brief.category;

  // B2B típico: el manager compra para su equipo
  if (["saas", "tecnologia", "servicios"].includes(category)) {
    if (/equipo|emplead|team|staff|colabor|organiz|empresa|negocio|agencia/i.test(text)) {
      return "different";
    }
  }

  // Alguien compra para otro (cuidado, familia, regalo)
  if (
    /famil|hijo|hija|padre|madre|abuelo|abuela|ancian|cuidad|bebe|niño|mascot|pet|regalo|gift/i.test(text) ||
    category === "salud" && /famil|cuidad|hijo|madre|padre/i.test(text)
  ) {
    return "buys_for_others";
  }

  // B2B donde quien aprueba ≠ quien usa
  if (
    /jefe|gerente|director|ceo|cto|responsable|aprueba|presupuesto|budget/i.test(text)
  ) {
    return "different";
  }

  return "same";
}

// ── Paso 2: inferir contexto de precio ───────────────────────────────────────
type PriceTier = "low" | "mid" | "high";

function priceTier(priceRange: string): PriceTier {
  if (["2000+", "500-2000"].includes(priceRange)) return "high";
  if (["200-500", "50-200"].includes(priceRange)) return "mid";
  return "low";
}

// ── Paso 3: extraer palabras clave sin copiar literalmente ───────────────────
function keywords(text: string, n = 5): string[] {
  const stop = new Set([
    "de","el","la","los","las","un","una","y","o","en","que","con","por",
    "para","se","no","es","son","al","del","su","sus","más","como","pero",
    "si","le","me","te","nos","ya","hay","esto","eso","esta","todo","cada",
  ]);
  const words = text
    .toLowerCase()
    .replace(/[.,!?;:()"']/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) { seen.add(w); out.push(w); }
    if (out.length === n) break;
  }
  return out;
}

// ── Paso 4: canales por categoría y tipo de búsqueda ─────────────────────────
function channels(category: string, intent: "discovery" | "intent" | "trust" | "authority"): string[] {
  const map: Record<string, Record<string, string[]>> = {
    saas:        { discovery: ["LinkedIn","Product Hunt","Twitter/X"], intent: ["Google Ads","G2","Capterra"], trust: ["comunidades Slack","Reddit","referidos"], authority: ["webinars","podcasts tech","newsletters SaaS"] },
    ecommerce:   { discovery: ["Instagram","TikTok","Pinterest"], intent: ["Google Shopping","Meta Ads"], trust: ["reseñas","grupos de Facebook","boca a boca"], authority: ["YouTube","newsletters ecom"] },
    servicios:   { discovery: ["LinkedIn","Google Mi Negocio"], intent: ["Google Ads locales","directorios"], trust: ["referidos","networking presencial"], authority: ["LinkedIn articles","podcasts del sector"] },
    educacion:   { discovery: ["Instagram","YouTube","TikTok"], intent: ["Google Ads","YouTube Ads"], trust: ["grupos WhatsApp","comunidades educativas"], authority: ["webinars","colaboraciones con influencers"] },
    salud:       { discovery: ["Google","YouTube","Instagram"], intent: ["Google Ads","Meta Ads"], trust: ["grupos de pacientes","recomendación médica"], authority: ["blogs salud","podcasts bienestar"] },
    tecnologia:  { discovery: ["GitHub","Hacker News","Twitter/X"], intent: ["Google Ads","Stack Overflow"], trust: ["comunidades dev","Reddit","Product Hunt"], authority: ["conferencias tech","newsletters técnicas"] },
    restaurante: { discovery: ["Instagram","TikTok","Google Maps"], intent: ["Google Ads locales","Meta Ads"], trust: ["reseñas Google","TripAdvisor","boca a boca"], authority: ["cuentas foodie","medios locales"] },
    moda:        { discovery: ["Instagram","TikTok","Pinterest"], intent: ["Meta Ads","Google Shopping"], trust: ["influencers","recomendación social"], authority: ["editoriales digitales","fashion blogs"] },
    inmobiliaria:{ discovery: ["portales inmobiliarios","Google","Instagram"], intent: ["Google Ads","Facebook Ads"], trust: ["referidos de bancos/abogados","redes de inversores"], authority: ["podcasts inversión","LinkedIn"] },
  };
  const fallback = {
    discovery: ["Google","Instagram","LinkedIn"],
    intent:    ["Google Ads","Meta Ads"],
    trust:     ["referidos","comunidades online","reseñas"],
    authority: ["podcasts","blogs especializados","webinars"],
  };
  return (map[category] ?? fallback)[intent];
}

// ── Paso 5: nombre de perfil sin estadísticas ────────────────────────────────
function profileName(category: string, archetype: "primary" | "buyer" | "urgent" | "strategic" | "skeptic"): string {
  const names: Record<string, Record<string, string>> = {
    saas:        { primary: "La fundadora operando en modo manual", buyer: "El gerente que aprueba el gasto", urgent: "El CEO con demo a inversores la próxima semana", strategic: "El director de operaciones construyendo para escalar", skeptic: "El CTO que ya probó tres herramientas similares" },
    ecommerce:   { primary: "La emprendedora con tienda online estancada", buyer: "El brand manager con presupuesto para crecer", urgent: "El comerciante con temporada alta encima", strategic: "El director de marca pensando a 12 meses", skeptic: "El vendedor online que ya invirtió en herramientas sin retorno" },
    servicios:   { primary: "El profesional independiente sin sistema claro", buyer: "El gerente que busca solución para su equipo", urgent: "El consultor con un cliente nuevo grande que atender ya", strategic: "El director de agencia construyendo procesos", skeptic: "El freelancer que contrató servicios que no cumplieron" },
    educacion:   { primary: "El creator con audiencia pero sin ingresos claros", buyer: "El padre que invierte en el futuro de sus hijos", urgent: "La institución con inscripciones abiertas y cupos vacíos", strategic: "El director académico planificando el año siguiente", skeptic: "El educator que ya lanzó un curso sin resultados" },
    salud:       { primary: "La persona que convive con el problema cada día", buyer: "El familiar que cuida y decide por otro", urgent: "El paciente con diagnóstico reciente que necesita actuar", strategic: "El profesional de salud construyendo su práctica", skeptic: "El que probó varios tratamientos sin resultado sostenido" },
    tecnologia:  { primary: "El developer construyendo sin las herramientas correctas", buyer: "El CTO evaluando soluciones para su equipo", urgent: "La startup con demo técnica inminente", strategic: "El arquitecto de sistemas pensando en escalabilidad", skeptic: "El tech lead que ya descartó soluciones similares antes" },
    restaurante: { primary: "El chef con local lleno de potencial sin clientes", buyer: "El inversor gastronómico buscando eficiencia", urgent: "El dueño con apertura o evento especial en días", strategic: "El grupo gastronómico escalando a más locales", skeptic: "El restaurador que ya probó marketing sin resultados medibles" },
    moda:        { primary: "La compradora que sabe exactamente lo que busca", buyer: "El estilista que compra para sus clientes", urgent: "La persona con evento especial en días", strategic: "La editora de moda construyendo un armario capsule", skeptic: "La consumidora que compró online y no recibió lo prometido" },
    inmobiliaria:{ primary: "El agente activo buscando diferenciarse", buyer: "El inversor evaluando oportunidades del mercado", urgent: "El comprador con crédito aprobado listo para decidir", strategic: "El desarrollador con visión de cartera a largo plazo", skeptic: "El inversor con malas experiencias previas en el sector" },
  };
  const fallback: Record<string, string> = {
    primary: "La persona directamente afectada por el problema",
    buyer: "Quien toma y paga la decisión de compra",
    urgent: "Quien necesita resolver esto esta semana",
    strategic: "Quien evalúa esto como inversión a largo plazo",
    skeptic: "Quien ya intentó resolver esto antes sin éxito",
  };
  return (names[category] ?? {})[archetype] ?? fallback[archetype];
}

function ageRange(archetype: "primary" | "buyer" | "urgent" | "strategic" | "skeptic", category: string): string {
  const map: Record<string, Record<string, string>> = {
    saas:        { primary: "28–40", buyer: "35–50", urgent: "30–45", strategic: "38–55", skeptic: "32–48" },
    ecommerce:   { primary: "25–38", buyer: "30–45", urgent: "28–42", strategic: "33–50", skeptic: "28–40" },
    salud:       { primary: "30–65", buyer: "35–60", urgent: "40–70", strategic: "30–50", skeptic: "35–60" },
    educacion:   { primary: "22–45", buyer: "30–50", urgent: "25–40", strategic: "35–55", skeptic: "28–45" },
    tecnologia:  { primary: "24–38", buyer: "32–48", urgent: "26–40", strategic: "30–45", skeptic: "28–42" },
    moda:        { primary: "20–38", buyer: "25–45", urgent: "22–40", strategic: "28–45", skeptic: "24–40" },
  };
  return (map[category] ?? {})[archetype] ?? "25–45";
}

// ── Generador principal ───────────────────────────────────────────────────────
export function generateAudiences(brief: ProductBrief): AudiencePersona[] {
  const { productName, targetProblem, uniqueValue, category, priceRange } = brief;
  const relation = detectBuyerUserRelation(brief);
  const tier = priceTier(priceRange);
  const kw = keywords(`${targetProblem} ${uniqueValue}`, 5);

  // Vocabulario de búsqueda en Google — derivado del problema, no copiado
  const searchVocab: string[] = [
    ...kw.slice(0, 3),
    `cómo ${kw[0] ?? "resolver"} rápido`,
    `mejor ${productName.split(" ")[0]?.toLowerCase() ?? "solución"}`,
    `${kw[1] ?? "solución"} que funcione`,
    `${productName} opiniones`,
    `alternativas a ${productName.split(" ")[0]?.toLowerCase() ?? "esto"}`,
  ];

  // ── Persona 1: quien vive el problema ────────────────────────────────────
  const p1: AudiencePersona = {
    id: uid(),
    name: profileName(category, "primary"),
    age: ageRange("primary", category),
    role: "Usuario directo — sufre el problema y busca activamente una solución",
    companyProfile: `Lleva tiempo conviviendo con este problema sin encontrar una solución que realmente lo entienda. Ha normalizado el dolor pero en el fondo sabe que tiene un costo real en su día a día.`,
    jtbd: `Cuando el problema ya afecta mi rutina y las soluciones que probé no llegaron a la raíz, busco ${productName} para tener ${uniqueValue} sin tener que cambiar todo lo que ya hago.`,
    topPains: [
      "Ha normalizado el problema como parte de su vida sin darse cuenta del costo acumulado",
      "Las soluciones que probó antes eran genéricas y no entendían su situación específica",
      "Siente que pierde tiempo, dinero o energía cada semana por no tener esto resuelto",
      "Le frustra que el mercado prometa mucho y entregue poco",
    ],
    triggerEvents: [
      "El problema llegó a un punto de quiebre que ya no puede ignorar",
      "Alguien de su entorno le mostró cómo lo resolvió con una solución concreta",
      "Tuvo una pérdida tangible (cliente, tiempo, dinero) directamente atribuible al problema",
      "Empieza un nuevo período y quiere que esta vez sea diferente",
    ],
    desiredOutcomes: [
      `Que ${productName} resuelva el problema de fondo, no solo los síntomas`,
      "Sentir que por fin encontró algo pensado para su situación exacta",
      "Resultados visibles en las primeras 2–4 semanas de uso",
    ],
    keyVocabulary: searchVocab.slice(0, 6),
    channels: channels(category, "discovery"),
    objections: [
      `¿Esto realmente resuelve el problema o es otro producto genérico con buen marketing?`,
      `¿Cuánto tiempo hasta ver resultados concretos?`,
      `Ya probé algo parecido antes — ¿en qué es realmente diferente?`,
    ],
  };

  // ── Persona 2: depende de la relación comprador/usuario ───────────────────
  let p2: AudiencePersona;

  if (relation === "buys_for_others") {
    p2 = {
      id: uid(),
      name: profileName(category, "buyer"),
      age: ageRange("buyer", category),
      role: "Comprador — paga la solución para alguien que no puede o no sabe comprarlo por sí mismo",
      companyProfile: `No es quien vive el problema directamente, pero lo ve de cerca y siente la responsabilidad de resolverlo. Su motivación es proteger o mejorar la situación de alguien que le importa.`,
      jtbd: `Cuando veo que alguien que quiero o de quien soy responsable sigue con este problema sin solución, busco ${productName} para darles ${uniqueValue} sin tener que estar yo gestionándolo todo el tiempo.`,
      topPains: [
        "No sabe qué solución es realmente confiable — hay demasiadas opciones y poca claridad",
        "Le preocupa comprar algo que la persona no adopte o que sea difícil de usar",
        "Ha visto cómo el problema afecta a quien quiere y ya no quiere seguir postergando",
        "Necesita que funcione bien desde el día 1 — no tiene tiempo ni paciencia para problemas de implementación",
      ],
      triggerEvents: [
        "Un incidente reciente le demostró que el problema ya es un riesgo real para esa persona",
        "Alguien de confianza le recomendó específicamente esta solución",
        "Tiene presupuesto disponible ahora y no quiere seguir aplazando la decisión",
        "La persona afectada llegó a un punto donde ya no puede manejarlo sola",
      ],
      desiredOutcomes: [
        "Saber que tomó la mejor decisión posible para quien depende de él/ella",
        "Que la experiencia sea simple para la persona que lo va a usar",
        "Tranquilidad — no quiere tener que estar resolviendo esto constantemente",
      ],
      keyVocabulary: ["confiable", "fácil de usar", "soporte", "garantía", "seguro", "probado", "sin complicaciones", "recomendado"],
      channels: channels(category, "trust"),
      objections: [
        "¿La persona que lo va a usar va a poder adoptarlo sin ayuda?",
        "¿Qué pasa si no funciona — tienen garantía o devolución?",
        "¿Puedo hablar con alguien antes de comprar para asegurarme?",
      ],
    };
  } else if (relation === "different") {
    p2 = {
      id: uid(),
      name: profileName(category, "buyer"),
      age: ageRange("buyer", category),
      role: "Decisor — aprueba la compra pero no es el usuario final del día a día",
      companyProfile: `Evalúa ${productName} desde la perspectiva del impacto en su equipo o negocio. No le importa tanto cómo funciona técnicamente — le importa que resuelva el problema sin generar más problemas.`,
      jtbd: `Cuando necesito que mi equipo supere este cuello de botella sin que yo tenga que gestionar el proceso, apruebo ${productName} para obtener ${uniqueValue} sin resistencia interna ni curva de aprendizaje larga.`,
      topPains: [
        "Le preocupa el tiempo de adopción — no puede permitirse que el equipo pierda productividad durante la transición",
        "Ha aprobado herramientas antes que nadie terminó usando — quiere evitar ese patrón",
        tier === "high" ? "Necesita justificar el ROI ante sus superiores o ante sí mismo" : "Quiere certeza de que la inversión vale antes de comprometerse",
        "El problema afecta los resultados del equipo y ya no puede ignorarlo",
      ],
      triggerEvents: [
        "El problema apareció en una revisión de resultados como un cuello de botella medible",
        "Un referente de la industria o un colega le recomendó buscar una solución así",
        "El equipo se lo pidió explícitamente o lo mencionó en una reunión",
        "Tiene presupuesto disponible en este período y quiere usarlo bien",
      ],
      desiredOutcomes: [
        "Que el equipo adopte la solución rápido y sin fricciones",
        "Resultados medibles en las primeras 4–6 semanas que justifiquen la decisión",
        "No tener que supervisar la implementación — que sea autónoma",
      ],
      keyVocabulary: ["ROI", "adopción", "equipo", "eficiencia", "resultados medibles", "implementación", "escalable", "integración"],
      channels: channels(category, "authority"),
      objections: [
        "¿Cuánto tiempo tarda en estar funcionando para el equipo completo?",
        "¿Tienen casos de éxito con equipos o empresas similares a la nuestra?",
        "¿Se integra con las herramientas que ya usamos?",
      ],
    };
  } else {
    // same person → segundo perfil es el escéptico con experiencias previas
    p2 = {
      id: uid(),
      name: profileName(category, "skeptic"),
      age: ageRange("skeptic", category),
      role: "Comprador informado — ya probó alternativas y ahora investiga mucho antes de decidir",
      companyProfile: `Ha intentado resolver este problema antes con otras soluciones que no cumplieron lo prometido. Ahora desconfía del marketing y necesita prueba real antes de comprometerse.`,
      jtbd: `Cuando vuelvo a buscar una solución después de haberme decepcionado antes, necesito evidencia concreta de que ${productName} es diferente — no promesas, sino prueba real — antes de invertir mi dinero y tiempo otra vez.`,
      topPains: [
        "Ya gastó en soluciones similares que prometieron resultados y no los entregaron",
        "Ahora filtra todo el marketing — busca testimonios reales, no casos de éxito perfectos",
        "Le da rabia que siga sin resolver esto después de haberlo intentado varias veces",
        "El costo de equivocarse de nuevo (dinero y tiempo perdido) le genera parálisis",
      ],
      triggerEvents: [
        "Vio un caso de éxito de alguien con su mismo perfil exacto — no uno genérico",
        "Una prueba gratuita o garantía de devolución eliminó su barrera principal",
        "Un conocido de confianza le dijo que lo usó y funciona de verdad",
        "Comparó opciones en profundidad y esta fue la única con la diferencia que busca",
      ],
      desiredOutcomes: [
        "Resultados concretos en los primeros 7–14 días — no en 3 meses",
        "Sentir que esta vez sí eligió bien y no volver a buscar alternativas",
        "Que la experiencia post-compra sea tan buena como la promesa pre-compra",
      ],
      keyVocabulary: ["garantía devolución", "testimonios reales", "diferencia vs", "prueba gratis", "sin contrato", "funciona de verdad", "reseñas honestas", "casos reales"],
      channels: ["Google (comparativas)", "Reddit", "YouTube reviews", "reseñas verificadas", "recomendación de conocidos"],
      objections: [
        "¿En qué es concretamente diferente a lo que ya probé antes?",
        "¿Tienen garantía de devolución si no veo resultados?",
        "Muéstrame resultados de personas con mi mismo punto de partida",
      ],
    };
  }

  // ── Persona 3: el urgente ────────────────────────────────────────────────
  const p3: AudiencePersona = {
    id: uid(),
    name: profileName(category, "urgent"),
    age: ageRange("urgent", category),
    role: "Comprador por presión — tiene un deadline real y necesita resolver esto esta semana",
    companyProfile: `Llegó a un punto de no retorno: hay un evento, lanzamiento, fecha límite o consecuencia concreta que le exige tener esto resuelto antes de un plazo específico. El precio es secundario.`,
    jtbd: `Cuando el problema se volvió urgente porque tengo [evento/deadline] encima, necesito que ${productName} funcione desde el primer día sin curvas de aprendizaje largas — el tiempo es lo que no puedo perder.`,
    topPains: [
      "Tiene una fecha límite real — no puede permitirse un proceso largo de evaluación",
      "Su solución actual falló en el peor momento posible",
      "No puede comparar 10 opciones — necesita algo que funcione hoy",
      "Le preocupa más la velocidad de implementación que el precio o las funcionalidades extra",
    ],
    triggerEvents: [
      "Tiene un evento, lanzamiento o entrega importante en los próximos 7–14 días",
      "Su solución actual falló justo cuando más la necesitaba",
      "Un cambio externo (competidor, cliente, regulación) lo forzó a actuar ahora",
      "El costo de no resolverlo esta semana ya supera cualquier precio del producto",
    ],
    desiredOutcomes: [
      `Estar operativo con ${productName} en menos de 48 horas`,
      "Resolver el problema a tiempo para el evento o deadline que tiene encima",
      "Soporte disponible si algo falla — no quiere quedar solo en el proceso",
    ],
    keyVocabulary: ["rápido", "hoy mismo", "urgente", "fácil de implementar", "sin setup largo", "soporte inmediato", "funciona desde el día 1", "sin curva de aprendizaje"],
    channels: channels(category, "intent"),
    objections: [
      "¿Cuánto tiempo tarda realmente en estar funcionando?",
      "¿Tienen soporte disponible ahora si tengo problemas durante la configuración?",
      "¿Funciona sin necesitar ayuda técnica o configuración compleja?",
    ],
  };

  // ── Persona 4: el estratégico ────────────────────────────────────────────
  const p4: AudiencePersona = {
    id: uid(),
    name: profileName(category, "strategic"),
    age: ageRange("strategic", category),
    role: tier === "high"
      ? "Evaluador estratégico — analiza el ROI y el fit a largo plazo antes de comprometerse"
      : "Optimizador consciente — ya resolvió el síntoma y ahora busca el sistema definitivo",
    companyProfile: tier === "high"
      ? `Evalúa ${productName} como una inversión, no como un gasto. Compara con alternativas, analiza el retorno esperado y necesita justificar la decisión ante sí mismo o ante otros antes de comprometerse.`
      : `Ya tiene algo funcionando pero sabe que puede ir al siguiente nivel. Busca una solución que sea parte de su sistema a largo plazo — no un parche que tenga que reemplazar en 6 meses.`,
    jtbd: tier === "high"
      ? `Cuando evalúo soluciones a largo plazo para este problema, necesito que ${productName} demuestre ROI claro en los primeros 90 días para justificar la inversión ante mí mismo o ante mi equipo.`
      : `Cuando quiero superar el problema de forma definitiva y construir algo que escale, adopto ${productName} para tener ${uniqueValue} como parte de mi sistema — no como solución temporal.`,
    topPains: [
      tier === "high"
        ? "Le cuesta comprometerse sin métricas previas claras de retorno"
        : "Ha resuelto el síntoma varias veces pero el problema de fondo persiste",
      "No quiere cambiar de solución en 6–12 meses — busca algo que escale con él",
      "Las opciones baratas ya le fallaron — está dispuesto a pagar más por algo que funcione de verdad",
      "Necesita que se integre con lo que ya usa — no quiere islas de información",
    ],
    triggerEvents: [
      "Tiene un objetivo de crecimiento concreto este trimestre que requiere resolver esto",
      "Revisó sus resultados del período anterior y este problema fue un cuello de botella medible",
      "Logró un hito reciente (nuevo cliente, ascenso, ronda) y quiere invertir en el siguiente paso",
      "Un referente de su sector o red le señaló esta solución específicamente",
    ],
    desiredOutcomes: [
      "Una solución que no necesite reemplazar en al menos 12–18 meses",
      "Métricas claras de impacto en las primeras 4 semanas",
      tier === "high" ? "ROI demostrable ante su equipo o ante sí mismo" : "Que resuelva el problema de raíz y libere su atención para lo que importa",
    ],
    keyVocabulary: ["ROI", "escalable", "largo plazo", "resultados medibles", "integración", "sistema", "automatizar", "ventaja competitiva", "inversión", "optimizar"],
    channels: channels(category, "authority"),
    objections: [
      tier === "high"
        ? "¿Pueden mostrarme casos de éxito con situaciones similares a la mía con métricas reales?"
        : "¿Esto va a seguir siendo relevante en 1–2 años o lo reemplazarán algo mejor pronto?",
      `¿Cómo mido concretamente el impacto de ${productName} en mi caso?`,
      "¿Se integra con las herramientas que ya tengo en mi stack?",
    ],
  };

  return [p1, p2, p3, p4];
}
