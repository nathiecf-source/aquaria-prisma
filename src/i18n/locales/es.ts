import type { Dictionary } from "./pt-BR";

const es: Dictionary = {
  lang: {
    label: "Idioma",
    ptBR: "Português",
    en: "English",
    es: "Español",
  },
  planets: {
    sun: "Sol",
    moon: "Luna",
    mercury: "Mercurio",
    venus: "Venus",
    mars: "Marte",
    jupiter: "Júpiter",
    saturn: "Saturno",
    uranus: "Urano",
    neptune: "Neptuno",
    pluto: "Plutón",
    northNode: "Nodo Norte",
    southNode: "Nodo Sur",
    rahu: "Rahu",
    ketu: "Ketu",
  },
  signs: {
    aries: "Aries",
    taurus: "Tauro",
    gemini: "Géminis",
    cancer: "Cáncer",
    leo: "Leo",
    virgo: "Virgo",
    libra: "Libra",
    scorpio: "Escorpio",
    sagittarius: "Sagitario",
    capricorn: "Capricornio",
    aquarius: "Acuario",
    pisces: "Piscis",
  },
  aspects: {
    conjunction: "Conjunción",
    square: "Cuadratura",
    opposition: "Oposición",
    trine: "Trígono",
    sextile: "Sextil",
  },
  dignities: {
    domicile: "Domicilio",
    exaltation: "Exaltación",
    detriment: "Caída/Detrimento",
    fall: "Exilio/Caída",
    peregrine: "Peregrino/Neutro",
    inSign: "{{label}} en {{sign}}",
  },
  houseClasses: {
    sustentacao: "Sustentación",
    fluxo: "Flujo",
    desafios: "Desafíos",
    crescimento: "Crecimiento",
    trocas: "Intercambios",
    neutro: "Neutro",
  },
  houseTypes: {
    kendra: "Kendra (ángulo de manifestación)",
    trikona: "Trikona (casa de propósito y fruición)",
    dusthana: "Dusthana (casa de sanación y transformación)",
    upachaya: "Upachaya (casa de crecimiento gradual)",
    maraka: "Maraka (casa de entregas e intercambios)",
    neutra: "Neutra (casa sucedente/cadente)",
  },
  nature: {
    favorable: {
      label: "Terreno Favorable",
      sentence:
        "Las circunstancias externas ofrecen apoyo y fluidez para este movimiento. Hay espacio para expandir, ajustar y dejar que el proceso se despliegue con menos resistencia.",
    },
    restrictive: {
      label: "Terreno Restrictivo",
      sentence:
        "Las circunstancias externas exigen que tomes el mando. No habrá facilidades automáticas; cada paso de este ciclo pide madurez, paciencia y responsabilidad propia.",
    },
    neutral: {
      label: "Terreno Neutro",
      sentence:
        "El entorno externo ni empuja ni frena: el resultado de este ciclo depende principalmente de tu elección consciente y de la constancia con que conduzcas el proceso.",
    },
  },
  houseThemes: {
    h1: "Identidad y Presencia Física",
    h2: "Valores y Recursos Naturales",
    h3: "Comunicación, Aprendizaje y Cotidiano",
    h4: "Hogar, Raíces y Base Emocional",
    h5: "Creatividad, Placer y Autenticidad",
    h6: "Rutina, Cuerpo y Servicio",
    h7: "Relaciones, Parejas y el Espejo del Otro",
    h8: "Transformaciones, Herencias y las Profundidades del Intercambio",
    h9: "Visión de Mundo, Creencias y Sentido del Viaje",
    h10: "Realización, Dirección y Legado",
    h11: "Grupos, Causas y Visión de Futuro",
    h12: "Interioridad, Inconsciente y Espiritualidad",
  },
  houseThemesShort: {
    h1: "identidad y presencia",
    h2: "valores y recursos",
    h3: "mente y comunicación",
    h4: "hogar y fundamentos emocionales",
    h5: "creatividad y autoexpresión",
    h6: "rutina, cuerpo y servicio",
    h7: "relaciones y el otro",
    h8: "transformaciones y entregas profundas",
    h9: "visión de mundo y expansión",
    h10: "realización y legado",
    h11: "colectivo y futuro",
    h12: "inconsciente y espiritualidad",
  },
  cycles: {
    title: "Portales de Activación",
    subtitle: "Próximos 30 días — toca para abrir",
    refresh: "↺ Actualizar",
    refreshing: "Cargando...",
    close: "Cerrar",
    tabs: {
      dashas: "La tríada del tiempo cósmico",
      portal: "Portal del año",
      portalAge: "Portal de los {{age}}",
      transits: "Ciclos planetarios",
    },
    loaders: {
      dashas: "Sincronizando la tríada del tiempo cósmico...",
      portal: "Sincronizando el portal del año...",
      transits: "Sincronizando la lectura de los próximos 30 días...",
      breath:
        "Aprovecha para regular tu respiración mientras sincronizamos tus datos — este proceso puede tardar entre 1 y 2 minutos. También puedes hacer otras lecturas mientras se carga.",
    },
    empty: "No hay lectura disponible.",
    noPortals: "Ningún portal activo en el orbe de 4° en este momento.",
    portalsHint: "Portales activos en los próximos 30 días — toca para expandir",
    house: "Casa {{house}}",
    sphereFallback: "Esfera {{house}}",
    status: {
      active: "ACTIVO AHORA",
      upcomingDays: "ACTIVACIÓN FUTURA EN {{days}} DÍAS",
      upcoming: "ACTIVACIÓN FUTURA",
    },
    data: {
      title: "🏛 Datos del Ciclo",
      orbEntry: "Entrada al orbe:",
      exactTrigger: "Disparador exacto:",
      peakPassed: "pico recién pasado; el tránsito aún está dentro del orbe",
      orbExit: "Salida del orbe:",
      nature: "Naturaleza del evento:",
    },
    preparing: "Preparando desafío e integración...",
    detailError:
      "La interpretación profunda tardó más de lo esperado. Los datos astrológicos de arriba siguen disponibles.",
    retry: "Intentar de nuevo",
    challenge: "⚡ El Desafío Estructural & Interno",
    integration: "🌿 La Integración & Práctica Contemplativa",
    aspectWithNatal: "{{aspect}} con {{planet}} natal",
    seals: {
      psych:
        "⚡ Psicológico (Tropical): {{planet}} en {{sign}} {{glyph}} {{natal}} natal • Casa {{house}}",
      structural:
        "🏛 Estructural ({{layer}}): {{planet}} en {{sign}} [{{dignity}}] • Casa {{house}}",
      layerWholeSign: "WS houses",
      layerSideral: "Sideral",
    },
    insight: {
      label: "Siéntelo, vuelve y anótalo",
      placeholder: "Siéntelo, vuelve y anota lo que surgió...",
      saved: "✓ Insight guardado",
      save: "Guardar Insight",
    },
    phases: {
      title: "Fases Reestructurantes",
      none: "No estás en una fase crítica de reestructuración profunda.",
      activeNow: "Activos ahora",
      upcoming: "Próximos ciclos",
      vedic: "Védico",
      tropical: "Tropical",
      orb: "orbe {{orb}}°",
      startsIn: "comienza en {{year}}",
      approaching: "se acerca",
      themeFallback: "área de vida",
      houseArea: "Casa {{house}} ({{theme}})",
      traditionVedic: "capa védica",
      traditionTropical: "capa tropical",
      concurrent:
        "Al mismo tiempo, {{list}} actúan sobre el mismo tema, intensificando la presión del cambio.",
      defaultTemplate:
        "El ciclo {{name}} actúa sobre {{house}} en la {{tradition}}. Es un período de reestructuración que pide conciencia y paciencia. {{concurrent}}",
      defaultUpcoming: "período de reestructuración y maduración.",
      names: {
        saturnReturn: "Retorno de Saturno",
        saturnSquare: "Cuadratura de Saturno",
        saturnOpposition: "Oposición de Saturno",
        uranusSquare: "Cuadratura de Urano",
        uranusOpposition: "Oposición de Urano",
        uranusReturn: "Retorno de Urano",
        neptuneSquare: "Cuadratura de Neptuno",
        plutoSquare: "Cuadratura de Plutón",
        nodalReturn: "Retorno Nodal",
        nodalOpposition: "Oposición Nodal",
        sadeSatiRising: "Shani Sade Sati — Fase Ascendente",
        sadeSatiPeak: "Shani Sade Sati — Fase de Pico",
        sadeSatiDescent: "Shani Sade Sati — Fase de Descenso",
        ardhaAshtamaMoon: "Ardha-Ashtama Shani / Kantaka Shani de la Luna",
        ashtamaMoon: "Ashtama Shani de la Luna",
        kantakaAscendant: "Kantaka Shani del Ascendente",
        ashtamaAscendant: "Ashtama Shani del Ascendente",
      },
      upcomingText: {
        saturnReturn: "período de revisión de estructuras, responsabilidades y legado personal.",
        saturnSquare: "período de prueba de límites, ajuste de rumbo y consolidación de la madurez.",
        saturnOpposition: "período de revisión a mitad del ciclo: lo construido pide evaluación.",
        uranusSquare: "período de impulso hacia la ruptura, la independencia y el cambio de rumbo.",
        uranusOpposition: "período de crisis de mediana edad: libertad, renovación y autenticidad.",
        uranusReturn: "período de cierre de un gran ciclo de cambio y autonomía.",
        neptuneSquare: "período de disolución de certezas y redefinición de la visión de mundo.",
        plutoSquare: "período de transformación profunda, crisis de poder y reconstrucción.",
        nodalReturn: "período de redefinición de rumbo, elecciones y prioridades de vida.",
        nodalOpposition: "período de revisión y realineación entre el pasado y el futuro.",
        sadeSatiRising: "inicio de una fase de reestructuración emocional y responsabilización.",
        sadeSatiPeak: "punto de mayor presión para la madurez emocional y la reorganización interna.",
        sadeSatiDescent: "cierre de un ciclo profundo de aprendizaje emocional.",
        ardhaAshtamaMoon: "ajuste en la base emocional, el hogar y las cuestiones de seguridad.",
        ashtamaMoon: "profunda transformación emocional, pidiendo paciencia y reconstrucción gradual.",
        kantakaAscendant: "reajuste en la base externa de la vida, la carrera y las estructuras cotidianas.",
        ashtamaAscendant: "período de reorganización de la vitalidad, la salud y los procesos prácticos.",
      },
      templates: {
        saturnReturn:
          "Vives un Retorno de Saturno que resuena en {{house}}. Es un tiempo de auditoría de estructuras, responsabilidades y legado. Lo que se construyó sin alma pide reorganización; lo hecho con compromiso, consolidación. {{concurrent}}",
        saturnSquare:
          "La Cuadratura de Saturno activa {{house}}, trayendo pruebas de límites y ajustes de rumbo. La fricción pide paciencia y realismo, no autocastigo. {{concurrent}}",
        saturnOpposition:
          "La Oposición de Saturno ilumina {{house}} como punto de revisión a mitad del ciclo. Es hora de evaluar qué sirve y qué necesita reorganizarse con conciencia. {{concurrent}}",
        uranusSquare:
          "La Cuadratura de Urano despierta {{house}} con un impulso de libertad y ruptura. Las estructuras antiguas pueden ceder para dar lugar a la autenticidad. {{concurrent}}",
        uranusOpposition:
          "La Oposición de Urano resuena en {{house}}, activando la necesidad de vivir de acuerdo con quien realmente eres. La crisis es de sentido, no de culpa. {{concurrent}}",
        uranusReturn:
          "El Retorno de Urano completa un ciclo de unos 84 años en {{house}}. Es una conclusión de trayectoria sobre autonomía y originalidad. {{concurrent}}",
        neptuneSquare:
          "La Cuadratura de Neptuno disuelve certezas en {{house}}. Las idealizaciones dejan de funcionar y emerge una nueva visión de mundo. {{concurrent}}",
        plutoSquare:
          "La Cuadratura de Plutón excava {{house}}. Es un período de transformación profunda, poder y destrucción creativa de lo que ya no sostiene. {{concurrent}}",
        nodalReturn:
          "El Retorno Nodal activa {{house}}, invitando a una redefinición de rumbo, elecciones y prioridades de vida. {{concurrent}}",
        nodalOpposition:
          "La Oposición Nodal ilumina {{house}} como punto de revisión: equilibras lo que heredaste y lo que eliges construir de aquí en adelante. {{concurrent}}",
        sadeSatiRising:
          "Estás en la fase ascendente del Shani Sade Sati, cuando Saturno se acerca a la Luna por {{house}}. Es un tiempo de preparación, desapego gradual y reorganización emocional. {{concurrent}}",
        sadeSatiPeak:
          "Vives el pico del Shani Sade Sati, con Saturno directamente sobre la Luna ({{house}}). La madurez emocional se exige de forma intensa y concreta. {{concurrent}}",
        sadeSatiDescent:
          "Estás en la fase de descenso del Shani Sade Sati, con Saturno alejándose de la Luna por {{house}}. El ciclo pide integración de lo trabajado. {{concurrent}}",
        ardhaAshtamaMoon:
          "El Ardha-Ashtama Shani alcanza {{house}}, pidiendo ajustes en la base emocional, el hogar y las cuestiones de seguridad. {{concurrent}}",
        ashtamaMoon:
          "El Ashtama Shani de la Luna resuena en {{house}}, marcando un período de profunda transformación emocional. La presión pide reconstrucción gradual, no huida. {{concurrent}}",
        kantakaAscendant:
          "El Kantaka Shani del Ascendente alcanza {{house}}, pidiendo reajuste en la base externa de la vida, la carrera y las estructuras cotidianas. {{concurrent}}",
        ashtamaAscendant:
          "El Ashtama Shani del Ascendente alcanza {{house}}, invitando a una reorganización de la vitalidad, la salud y los procesos prácticos. {{concurrent}}",
      },
    },
  },
  senhor: {
    profection: "✦ Profección — {{age}} años",
    title: "El Regente del Año: {{lord}}",
    houseTag: "(Casa {{house}})",
    houseIn: "Casa {{house}} en {{sign}}",
    coLords: "Corregentes: {{lords}}",
    collapse: "Contraer lectura",
    expand: "Leer la lectura del año",
    loading: "Sincronizando con el ciclo anual...",
    source: {
      natal: "a partir de la carta natal",
      solarReturn: "a partir de la Revolución Solar",
      ruler: "a partir de la regencia tradicional",
    },
  },
  ativacoes: {
    title: "Activaciones Rápidas",
    loading: "Mapeando ventanas de ignición...",
    none: "Ninguna activación rápida activa en este momento. El cielo aún calienta el escenario del año.",
    house: "Casa {{house}}",
    types: {
      invasao: "Entrada al territorio",
      "toque-no-regente": "Toque al regente",
      "senhor-em-movimento": "Regente en movimiento",
    },
  },
  dasha: {
    sections: {
      intro: "Introducción",
      phase: "Tu fase actual",
      ocean: "El Gran Océano",
      current: "La Corriente",
      wave: "La Ola",
      challenge: "El Desafío",
      synthesis: "La Síntesis",
    },
  },
  chat: {
    welcome:
      "Hola. Soy Aquar.IA. Estoy aquí para reflexionar contigo sobre lo que tu carta natal revela en este momento. Pregúntale a tu carta.",
    tabs: {
      tropical: "Tropical",
      sidereal: "Sideral",
      ciclos: "Ciclos",
    },
    remaining_one: "Te queda {{count}} pregunta este mes",
    remaining_other: "Te quedan {{count}} preguntas este mes",
    loadingLimit: "Cargando límite...",
    savePdf: "Guardar conversación en PDF",
    pdfError: "No se pudo guardar el PDF ahora. Inténtalo de nuevo.",
    closeChat: "Cerrar chat",
    events: {
      next30: "Próximos 30 días",
      sheetTitle: "Cielo del momento — Próximos 30 días",
      calculating: "Calculando ciclos...",
      none: "No se encontraron eventos.",
      skyNow: "Cielo del momento:",
      pickEvent: "Elegir un evento del cielo del momento",
      selected: "Evento seleccionado",
      clear: "Limpiar evento",
      types: {
        ingress: "{{planet}} entra en {{sign}}",
        current: "{{planet}} en {{sign}}",
        new_moon: "Luna Nueva en {{sign}}",
        full_moon: "Luna Llena en {{sign}}",
        solar_eclipse: "Eclipse Solar en {{sign}}",
        lunar_eclipse: "Eclipse Lunar en {{sign}}",
      },
    },
    suggestion:
      "Quiero entender otro tránsito: Tránsito de [planeta] - [x] grados de [signo] - ",
    placeholder: "Pregúntale a tu carta astral",
    pdfNote:
      "La conversación no se guarda en la base de datos. Puedes exportarla a PDF cuando quieras. Toca el ícono en la parte superior del chat.",
    error:
      "Perdón, hubo una interferencia en nuestra conexión cósmica. ¿Puedes intentarlo de nuevo?",
    source: "Fuente",
    keys: "Claves",
  },
};

export default es;
