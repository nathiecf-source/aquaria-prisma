import type { Dictionary } from "./pt-BR";

const en: Dictionary = {
  lang: {
    label: "Language",
    ptBR: "Português",
    en: "English",
    es: "Español",
  },
  planets: {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
    northNode: "North Node",
    southNode: "South Node",
    rahu: "Rahu",
    ketu: "Ketu",
  },
  signs: {
    aries: "Aries",
    taurus: "Taurus",
    gemini: "Gemini",
    cancer: "Cancer",
    leo: "Leo",
    virgo: "Virgo",
    libra: "Libra",
    scorpio: "Scorpio",
    sagittarius: "Sagittarius",
    capricorn: "Capricorn",
    aquarius: "Aquarius",
    pisces: "Pisces",
  },
  aspects: {
    conjunction: "Conjunction",
    square: "Square",
    opposition: "Opposition",
    trine: "Trine",
    sextile: "Sextile",
  },
  dignities: {
    domicile: "Domicile",
    exaltation: "Exaltation",
    detriment: "Detriment",
    fall: "Fall",
    peregrine: "Peregrine/Neutral",
    inSign: "{{label}} in {{sign}}",
  },
  houseClasses: {
    sustentacao: "Sustenance",
    fluxo: "Flow",
    desafios: "Challenges",
    crescimento: "Growth",
    trocas: "Exchanges",
    neutro: "Neutral",
  },
  houseTypes: {
    kendra: "Kendra (angle of manifestation)",
    trikona: "Trikona (house of purpose and fruition)",
    dusthana: "Dusthana (house of healing and transformation)",
    upachaya: "Upachaya (house of gradual growth)",
    maraka: "Maraka (house of exchanges and shared resources)",
    neutra: "Neutral (succeedent/cadent house)",
  },
  nature: {
    favorable: {
      label: "Favorable Terrain",
      sentence:
        "External circumstances offer support and fluidity for this movement. There is room to expand, adjust, and let the process unfold with less resistance.",
    },
    restrictive: {
      label: "Restrictive Terrain",
      sentence:
        "External circumstances demand that you take the lead. There will be no automatic ease; each step of this cycle asks for maturity, patience, and personal responsibility.",
    },
    neutral: {
      label: "Neutral Terrain",
      sentence:
        "The external environment neither pushes nor pulls: the outcome of this cycle depends mainly on your conscious choice and the consistency with which you lead the process.",
    },
  },
  houseThemes: {
    h1: "Identity and Physical Presence",
    h2: "Values and Natural Resources",
    h3: "Communication, Learning and Daily Life",
    h4: "Home, Roots and Emotional Base",
    h5: "Creativity, Pleasure and Authenticity",
    h6: "Routine, Body and Service",
    h7: "Relationships, Partnerships and the Mirror of the Other",
    h8: "Transformations, Inheritances and the Depths of Exchange",
    h9: "Worldview, Beliefs and the Meaning of the Journey",
    h10: "Achievement, Direction and Legacy",
    h11: "Groups, Causes and Vision of the Future",
    h12: "Interiority, the Unconscious and Spirituality",
  },
  houseThemesShort: {
    h1: "identity and presence",
    h2: "values and resources",
    h3: "mind and communication",
    h4: "home and emotional foundations",
    h5: "creativity and self-expression",
    h6: "routine, body and service",
    h7: "relationships and the other",
    h8: "transformations and deep exchanges",
    h9: "worldview and expansion",
    h10: "achievement and legacy",
    h11: "collective and future",
    h12: "unconscious and spirituality",
  },
  cycles: {
    title: "Activation Portals",
    subtitle: "Next 30 days — click to open",
    refresh: "↺ Refresh",
    refreshing: "Loading...",
    close: "Close",
    tabs: {
      dashas: "The triad of cosmic time",
      portal: "Portal of the year",
      portalAge: "Portal of {{age}}",
      transits: "Planetary cycles",
    },
    loaders: {
      dashas: "Syncing the triad of cosmic time...",
      portal: "Syncing the portal of the year...",
      transits: "Syncing the reading of the next 30 days...",
      breath:
        "Take a moment to regulate your breathing while we sync your data — this process can take between 1 and 2 minutes. You can also do other readings while it loads.",
    },
    empty: "No reading available.",
    noPortals: "No active portals within a 4° orb at the moment.",
    portalsHint: "Active portals in the next 30 days — click to expand",
    house: "House {{house}}",
    sphereFallback: "Sphere {{house}}",
    status: {
      active: "ACTIVE NOW",
      upcomingDays: "FUTURE ACTIVATION IN {{days}} DAYS",
      upcoming: "FUTURE ACTIVATION",
    },
    data: {
      title: "🏛 Cycle Data",
      orbEntry: "Orb entry:",
      exactTrigger: "Exact trigger:",
      peakPassed: "peak recently passed; transit still within orb",
      orbExit: "Orb exit:",
      nature: "Nature of the event:",
    },
    preparing: "Preparing challenge and integration...",
    detailError:
      "The in-depth interpretation took longer than expected. The astrological data above remains available.",
    retry: "Try again",
    challenge: "⚡ The Structural & Inner Challenge",
    integration: "🌿 The Integration & Contemplative Practice",
    aspectWithNatal: "{{aspect}} with natal {{planet}}",
    seals: {
      psych:
        "⚡ Psychological (Tropical): {{planet}} in {{sign}} {{glyph}} natal {{natal}} • House {{house}}",
      structural:
        "🏛 Structural ({{layer}}): {{planet}} in {{sign}} [{{dignity}}] • House {{house}}",
      layerWholeSign: "WS houses",
      layerSideral: "Sidereal",
    },
    insight: {
      label: "Feel it, come back, and write it down",
      placeholder: "Feel it, come back, and write down what surfaced...",
      saved: "✓ Insight saved",
      save: "Save Insight",
    },
    phases: {
      title: "Restructuring Phases",
      none: "You are not in a critical phase of deep restructuring.",
      activeNow: "Active now",
      upcoming: "Upcoming cycles",
      vedic: "Vedic",
      tropical: "Tropical",
      orb: "orb {{orb}}°",
      startsIn: "starts in {{year}}",
      approaching: "approaching",
      themeFallback: "area of life",
      houseArea: "House {{house}} ({{theme}})",
      traditionVedic: "vedic layer",
      traditionTropical: "tropical layer",
      concurrent:
        "At the same time, {{list}} act on the same theme, intensifying the pressure for change.",
      defaultTemplate:
        "The cycle {{name}} acts on {{house}} in the {{tradition}}. It is a period of restructuring that asks for awareness and patience. {{concurrent}}",
      defaultUpcoming: "period of restructuring and maturation.",
      names: {
        saturnReturn: "Saturn Return",
        saturnSquare: "Saturn Square",
        saturnOpposition: "Saturn Opposition",
        uranusSquare: "Uranus Square",
        uranusOpposition: "Uranus Opposition",
        uranusReturn: "Uranus Return",
        neptuneSquare: "Neptune Square",
        plutoSquare: "Pluto Square",
        nodalReturn: "Nodal Return",
        nodalOpposition: "Nodal Opposition",
        sadeSatiRising: "Shani Sade Sati — Rising Phase",
        sadeSatiPeak: "Shani Sade Sati — Peak Phase",
        sadeSatiDescent: "Shani Sade Sati — Descent Phase",
        ardhaAshtamaMoon: "Ardha-Ashtama Shani / Kantaka Shani of the Moon",
        ashtamaMoon: "Ashtama Shani of the Moon",
        kantakaAscendant: "Kantaka Shani of the Ascendant",
        ashtamaAscendant: "Ashtama Shani of the Ascendant",
      },
      upcomingText: {
        saturnReturn: "a period of reviewing structures, responsibilities, and personal legacy.",
        saturnSquare: "a period of testing limits, course correction, and consolidating maturity.",
        saturnOpposition: "a mid-cycle review: what was built asks for evaluation.",
        uranusSquare: "a period of impulse toward rupture, independence, and change of direction.",
        uranusOpposition: "a mid-life crisis period: freedom, renewal, and authenticity.",
        uranusReturn: "a period of closing a great cycle of change and autonomy.",
        neptuneSquare: "a period of dissolving certainties and redefining one's worldview.",
        plutoSquare: "a period of deep transformation, crisis of power, and rebuilding.",
        nodalReturn: "a period of redefining direction, choices, and life priorities.",
        nodalOpposition: "a period of review and realignment between past and future.",
        sadeSatiRising: "the beginning of a phase of emotional restructuring and accountability.",
        sadeSatiPeak: "the point of greatest pressure for emotional maturity and inner reorganization.",
        sadeSatiDescent: "the completion of a deep cycle of emotional learning.",
        ardhaAshtamaMoon: "adjustments to the emotional base, home, and security matters.",
        ashtamaMoon: "deep emotional transformation, asking for patience and gradual rebuilding.",
        kantakaAscendant: "readjustment of the outer base of life, career, and daily structures.",
        ashtamaAscendant: "a period of reorganizing vitality, health, and practical processes.",
      },
      templates: {
        saturnReturn:
          "You are living a Saturn Return resonating in {{house}}. It is a time to audit structures, responsibilities, and legacy. What was built without soul asks for reorganization; what was built with commitment asks for consolidation. {{concurrent}}",
        saturnSquare:
          "The Saturn Square activates {{house}}, bringing tests of limits and course corrections. The friction asks for patience and realism, not self-punishment. {{concurrent}}",
        saturnOpposition:
          "The Saturn Opposition illuminates {{house}} as a mid-cycle review point. It is time to evaluate what serves and what needs to be consciously reorganized. {{concurrent}}",
        uranusSquare:
          "The Uranus Square awakens {{house}} with an impulse for freedom and rupture. Old structures may give way to authenticity. {{concurrent}}",
        uranusOpposition:
          "The Uranus Opposition resonates in {{house}}, activating the need to live according to who you really are. The crisis is one of meaning, not guilt. {{concurrent}}",
        uranusReturn:
          "The Uranus Return completes a cycle of about 84 years in {{house}}. It is a conclusion of a trajectory around autonomy and originality. {{concurrent}}",
        neptuneSquare:
          "The Neptune Square dissolves certainties in {{house}}. Idealizations stop working and a new worldview emerges. {{concurrent}}",
        plutoSquare:
          "The Pluto Square excavates {{house}}. It is a period of deep transformation, power, and creative destruction of what no longer sustains you. {{concurrent}}",
        nodalReturn:
          "The Nodal Return activates {{house}}, inviting a redefinition of direction, choices, and life priorities. {{concurrent}}",
        nodalOpposition:
          "The Nodal Opposition illuminates {{house}} as a review point: you balance what you inherited and what you choose to build from now on. {{concurrent}}",
        sadeSatiRising:
          "You are in the rising phase of Shani Sade Sati, when Saturn approaches the Moon through {{house}}. It is a time of preparation, gradual detachment, and emotional reorganization. {{concurrent}}",
        sadeSatiPeak:
          "You are living the peak of Shani Sade Sati, with Saturn directly over the Moon ({{house}}). Emotional maturity is demanded intensely and concretely. {{concurrent}}",
        sadeSatiDescent:
          "You are in the descent phase of Shani Sade Sati, with Saturn moving away from the Moon through {{house}}. The cycle asks for integration of what has been worked through. {{concurrent}}",
        ardhaAshtamaMoon:
          "Ardha-Ashtama Shani reaches {{house}}, asking for adjustments in the emotional base, home, and security matters. {{concurrent}}",
        ashtamaMoon:
          "Ashtama Shani of the Moon resonates in {{house}}, marking a period of deep emotional transformation. The pressure asks for gradual rebuilding, not escape. {{concurrent}}",
        kantakaAscendant:
          "Kantaka Shani of the Ascendant reaches {{house}}, asking for readjustment of the outer base of life, career, and daily structures. {{concurrent}}",
        ashtamaAscendant:
          "Ashtama Shani of the Ascendant reaches {{house}}, inviting a reorganization of vitality, health, and practical processes. {{concurrent}}",
      },
    },
  },
  senhor: {
    profection: "✦ Profection — {{age}} years old",
    title: "The Lord of the Year: {{lord}}",
    houseTag: "(House {{house}})",
    houseIn: "House {{house}} in {{sign}}",
    coLords: "Co-rulers: {{lords}}",
    collapse: "Collapse reading",
    expand: "Read the year's reading",
    loading: "Syncing with the annual cycle...",
    source: {
      natal: "from the natal chart",
      solarReturn: "from the Solar Return",
      ruler: "from traditional rulership",
    },
  },
  ativacoes: {
    title: "Rapid Activations",
    loading: "Mapping ignition windows...",
    none: "No rapid activations active at the moment. The sky is still warming the stage of the year.",
    house: "House {{house}}",
    types: {
      invasao: "Territory entry",
      "toque-no-regente": "Touch on the ruler",
      "senhor-em-movimento": "Ruler in motion",
    },
  },
  dasha: {
    sections: {
      intro: "Introduction",
      phase: "Your current phase",
      ocean: "The Great Ocean",
      current: "The Current",
      wave: "The Wave",
      challenge: "The Challenge",
      synthesis: "The Synthesis",
    },
  },
  chat: {
    welcome:
      "Hello. I am Aquar.IA. I am here to reflect with you on what your birth chart reveals at this moment. Ask your chart.",
    tabs: {
      tropical: "Tropical",
      sidereal: "Sidereal",
      ciclos: "Cycles",
    },
    remaining_one: "{{count}} question left this month",
    remaining_other: "{{count}} questions left this month",
    loadingLimit: "Loading limit...",
    savePdf: "Save conversation as PDF",
    pdfError: "Could not save the PDF right now. Please try again.",
    closeChat: "Close chat",
    events: {
      next30: "Next 30 days",
      sheetTitle: "Current sky — Next 30 days",
      calculating: "Calculating cycles...",
      none: "No events found.",
      skyNow: "Current sky:",
      pickEvent: "Choose an event from the current sky",
      selected: "Selected event",
      clear: "Clear event",
      types: {
        ingress: "{{planet}} enters {{sign}}",
        current: "{{planet}} in {{sign}}",
        new_moon: "New Moon in {{sign}}",
        full_moon: "Full Moon in {{sign}}",
        solar_eclipse: "Solar Eclipse in {{sign}}",
        lunar_eclipse: "Lunar Eclipse in {{sign}}",
      },
    },
    suggestion:
      "I want to understand another transit: Transit of [planet] - [x] degrees of [sign] - ",
    placeholder: "Ask your birth chart",
    pdfNote:
      "The conversation is not saved in the database. You can export it to PDF whenever you like. Click the icon at the top of the chat.",
    error:
      "Sorry, there was an interference in our cosmic connection. Could you try again?",
    source: "Source",
    keys: "Keys",
  },
};

export default en;
