// Dicionário base (pt-BR) — a forma deste objeto é a referência de tipos
// para os demais idiomas.
const ptBR = {
  lang: {
    label: "Idioma",
    ptBR: "Português",
    en: "English",
    es: "Español",
  },
  planets: {
    sun: "Sol",
    moon: "Lua",
    mercury: "Mercúrio",
    venus: "Vênus",
    mars: "Marte",
    jupiter: "Júpiter",
    saturn: "Saturno",
    uranus: "Urano",
    neptune: "Netuno",
    pluto: "Plutão",
    northNode: "Nodo Norte",
    southNode: "Nodo Sul",
    rahu: "Rahu",
    ketu: "Ketu",
  },
  signs: {
    aries: "Áries",
    taurus: "Touro",
    gemini: "Gêmeos",
    cancer: "Câncer",
    leo: "Leão",
    virgo: "Virgem",
    libra: "Libra",
    scorpio: "Escorpião",
    sagittarius: "Sagitário",
    capricorn: "Capricórnio",
    aquarius: "Aquário",
    pisces: "Peixes",
  },
  aspects: {
    conjunction: "Conjunção",
    square: "Quadratura",
    opposition: "Oposição",
    trine: "Trígono",
    sextile: "Sextil",
  },
  dignities: {
    domicile: "Domicílio",
    exaltation: "Exaltação",
    detriment: "Queda/Detrimento",
    fall: "Exílio/Queda",
    peregrine: "Peregrino/Neutro",
    inSign: "{{label}} em {{sign}}",
  },
  houseClasses: {
    sustentacao: "Sustentação",
    fluxo: "Fluxo",
    desafios: "Desafios",
    crescimento: "Crescimento",
    trocas: "Trocas",
    neutro: "Neutro",
  },
  houseTypes: {
    kendra: "Kendra (ângulo de manifestação)",
    trikona: "Trikona (casa de propósito e fruição)",
    dusthana: "Dusthana (casa de cura e transformação)",
    upachaya: "Upachaya (casa de crescimento gradual)",
    maraka: "Maraka (casa de entregas e trocas)",
    neutra: "Neutra (casa sucedente/cadente)",
  },
  nature: {
    favorable: {
      label: "Terreno Favorável",
      sentence:
        "As circunstâncias externas oferecem apoio e fluidez para este movimento. Há espaço para expandir, acertar e deixar o processo se desdobrar com menos resistência.",
    },
    restrictive: {
      label: "Terreno Restritivo",
      sentence:
        "As circunstâncias externas exigem que você assuma o comando. Não haverá facilidades automáticas; cada passo deste ciclo pede maturidade, paciência e responsabilidade própria.",
    },
    neutral: {
      label: "Terreno Neutro",
      sentence:
        "O ambiente externo não puxa nem empurra: o resultado deste ciclo depende principalmente da sua escolha consciente e da consistência com que conduzir o processo.",
    },
  },
  houseThemes: {
    h1: "Identidade e Presença Física",
    h2: "Valores e Recursos Naturais",
    h3: "Comunicação, Aprendizado e Cotidiano",
    h4: "Lar, Raízes e Base Emocional",
    h5: "Criatividade, Prazer e Autenticidade",
    h6: "Rotina, Corpo e Serviço",
    h7: "Relacionamentos, Parcerias e o Espelho do Outro",
    h8: "Transformações, Heranças e as Profundezas da Troca",
    h9: "Visão de Mundo, Crenças e Sentido da Jornada",
    h10: "Realização, Direção e Legado",
    h11: "Grupos, Causas e Visão de Futuro",
    h12: "Interioridade, Inconsciente e Espiritualidade",
  },
  houseThemesShort: {
    h1: "identidade e presença",
    h2: "valores e recursos",
    h3: "mente e comunicação",
    h4: "lar e fundamentos emocionais",
    h5: "criatividade e autoexpressão",
    h6: "rotina, corpo e serviço",
    h7: "relacionamentos e o outro",
    h8: "transformações e entregas profundas",
    h9: "visão de mundo e expansão",
    h10: "realização e legado",
    h11: "coletivo e futuro",
    h12: "inconsciente e espiritualidade",
  },
  cycles: {
    title: "Portais de Ativação",
    subtitle: "Próximos 30 dias — clique para abrir",
    refresh: "↺ Atualizar",
    refreshing: "Carregando...",
    close: "Fechar",
    tabs: {
      dashas: "A tríade do tempo cósmico",
      portal: "Portal do ano",
      portalAge: "Portal dos {{age}}",
      transits: "Ciclos planetários",
    },
    loaders: {
      dashas: "Sincronizando tríade do tempo cósmico...",
      portal: "Sincronizando portal do ano...",
      transits: "Sincronizando leitura dos próximos 30 dias...",
      breath:
        "Aproveite para regular sua respiração enquanto sincronizamos seus dados — este processo pode levar entre 1 e 2 minutos. Ou aproveite para fazer outras leituras enquanto sua sincronização é carregada.",
    },
    empty: "Nenhuma leitura disponível.",
    noPortals: "Nenhum portal ativo no orbe de 4° no momento.",
    portalsHint: "Portais ativos nos próximos 30 dias — clique para expandir",
    house: "Casa {{house}}",
    sphereFallback: "Esfera {{house}}",
    status: {
      active: "ATIVO AGORA",
      upcomingDays: "ATIVAÇÃO FUTURA EM {{days}} DIAS",
      upcoming: "ATIVAÇÃO FUTURA",
    },
    data: {
      title: "🏛 Dados do Ciclo",
      orbEntry: "Entrada no orbe:",
      exactTrigger: "Gatilho exato:",
      peakPassed: "pico recém-passado; trânsito ainda dentro do orbe",
      orbExit: "Saída do orbe:",
      nature: "Natureza do evento:",
    },
    preparing: "Preparando desafio e integração...",
    detailError:
      "A interpretação aprofundada demorou mais que o esperado. Os dados astrológicos acima continuam disponíveis.",
    retry: "Tentar novamente",
    challenge: "⚡ O Desafio Estrutural & Interno",
    integration: "🌿 A Integração & Prática Contemplativa",
    aspectWithNatal: "{{aspect}} com {{planet}} Natal",
    seals: {
      psych:
        "⚡ Psicológico (Tropical): {{planet}} em {{sign}} {{glyph}} {{natal}} Natal • Casa {{house}}",
      structural:
        "🏛 Estrutural ({{layer}}): {{planet}} em {{sign}} [{{dignity}}] • Casa {{house}}",
      layerWholeSign: "WS houses",
      layerSideral: "Sideral",
    },
    insight: {
      label: "Sinta, volte e anote",
      placeholder: "Sinta, volte e anote o que acessou...",
      saved: "✓ Insight salvo",
      save: "Salvar Insight",
    },
    phases: {
      title: "Fases Reestruturantes",
      none: "Você não está em uma fase crítica de reestruturação profunda.",
      activeNow: "Ativos agora",
      upcoming: "Próximos ciclos",
      vedic: "Védico",
      tropical: "Tropical",
      orb: "orbe {{orb}}°",
      startsIn: "começa em {{year}}",
      approaching: "se aproxima",
      themeFallback: "tema de vida",
      houseArea: "Casa {{house}} ({{theme}})",
      traditionVedic: "camada védica",
      traditionTropical: "camada tropical",
      concurrent:
        "Ao mesmo tempo, {{list}} atuam sobre o mesmo tema, intensificando a pressão de mudança.",
      defaultTemplate:
        "O ciclo {{name}} atua sobre a {{house}} na {{tradition}}. É um período de reestruturação que pede consciência e paciência. {{concurrent}}",
      defaultUpcoming: "período de reestruturação e maturação.",
      names: {
        saturnReturn: "Retorno de Saturno",
        saturnSquare: "Quadratura de Saturno",
        saturnOpposition: "Oposição de Saturno",
        uranusSquare: "Quadratura de Urano",
        uranusOpposition: "Oposição de Urano",
        uranusReturn: "Retorno de Urano",
        neptuneSquare: "Quadratura de Netuno",
        plutoSquare: "Quadratura de Plutão",
        nodalReturn: "Retorno Nodal",
        nodalOpposition: "Oposição Nodal",
        sadeSatiRising: "Shani Sade Sati — Fase Ascendente",
        sadeSatiPeak: "Shani Sade Sati — Fase de Pico",
        sadeSatiDescent: "Shani Sade Sati — Fase de Descida",
        ardhaAshtamaMoon: "Ardha-Ashtama Shani / Kantaka Shani da Lua",
        ashtamaMoon: "Ashtama Shani da Lua",
        kantakaAscendant: "Kantaka Shani do Ascendente",
        ashtamaAscendant: "Ashtama Shani do Ascendente",
      },
      upcomingText: {
        saturnReturn: "período de revisão de estruturas, responsabilidades e legado pessoal.",
        saturnSquare: "período de teste de limites, ajuste de rota e consolidação de maturidade.",
        saturnOpposition: "período de revisão no meio do ciclo: o que foi construído pede avaliação.",
        uranusSquare: "período de impulso para ruptura, independência e mudança de direção.",
        uranusOpposition: "período de crise de meia-idade: liberdade, renovação e autenticidade.",
        uranusReturn: "período de fechamento de um grande ciclo de mudança e autonomia.",
        neptuneSquare: "período de dissolução de certezas e redifinição de visão de mundo.",
        plutoSquare: "período de transformação profunda, crise de poder e reconstrução.",
        nodalReturn: "período de redefinição de direção, escolhas e prioridades de vida.",
        nodalOpposition: "período de revisão e realinhamento entre o passado e o futuro.",
        sadeSatiRising: "início de uma fase de reestruturação emocional e responsabilização.",
        sadeSatiPeak: "ponto de maior pressão para maturidade emocional e reorganização interna.",
        sadeSatiDescent: "finalização de um ciclo profundo de aprendizado emocional.",
        ardhaAshtamaMoon: "ajuste na base emocional, lar e questões de segurança.",
        ashtamaMoon: "profunda transformação emocional, pedindo paciência e reconstrução gradual.",
        kantakaAscendant: "reajuste na base externa de vida, carreira e estruturas cotidianas.",
        ashtamaAscendant: "período de reorganização de vitalidade, saúde e processos práticos.",
      },
      templates: {
        saturnReturn:
          "Você vive um Retorno de Saturno que ressoa na {{house}}. É um tempo de auditoria de estruturas, responsabilidades e legado. O que foi construído sem alma pede reorganização; o que foi feito com compromisso, solidificação. {{concurrent}}",
        saturnSquare:
          "A Quadratura de Saturno ativa a {{house}}, trazendo testes de limites e ajustes de rota. A fricção pede paciência e realismo, não autopunição. {{concurrent}}",
        saturnOpposition:
          "A Oposição de Saturno ilumina a {{house}} como ponto de revisão no meio do ciclo. É hora de avaliar o que serve e o que precisa ser reorganizado com consciência. {{concurrent}}",
        uranusSquare:
          "A Quadratura de Urano desperta a {{house}} com um impulso de liberdade e ruptura. Estruturas antigas podem ceder para dar lugar à autenticidade. {{concurrent}}",
        uranusOpposition:
          "A Oposição de Urano ressoa na {{house}}, acionando a necessidade de viver de acordo com quem você realmente é. A crise é de sentido, não de culpa. {{concurrent}}",
        uranusReturn:
          "O Retorno de Urano completa um ciclo de cerca de 84 anos na {{house}}. É uma conclusão de trajetória sobre autonomia e originalidade. {{concurrent}}",
        neptuneSquare:
          "A Quadratura de Netuno dissolve certezas na {{house}}. Idealizações deixam de funcionar e uma nova visão de mundo emerge. {{concurrent}}",
        plutoSquare:
          "A Quadratura de Plutão escava a {{house}}. É um período de transformação profunda, poder e destruição criativa do que já não sustenta. {{concurrent}}",
        nodalReturn:
          "O Retorno Nodal ativa a {{house}}, convidando a uma redefinição de direção, escolhas e prioridades de vida. {{concurrent}}",
        nodalOpposition:
          "A Oposição Nodal ilumina a {{house}} como ponto de revisão: você equilibra o que herdou e o que escolhe construir daqui em diante. {{concurrent}}",
        sadeSatiRising:
          "Você está na fase ascendente do Shani Sade Sati, quando Saturno se aproxima da Lua pela {{house}}. É um tempo de preparação, desapego gradual e reorganização emocional. {{concurrent}}",
        sadeSatiPeak:
          "Você vive o pico do Shani Sade Sati, com Saturno diretamente sobre a Lua ({{house}}). A maturidade emocional é exigida de forma intensa e concreta. {{concurrent}}",
        sadeSatiDescent:
          "Você está na fase de descida do Shani Sade Sati, com Saturno se afastando da Lua pela {{house}}. O ciclo pede integração do que foi trabalhado. {{concurrent}}",
        ardhaAshtamaMoon:
          "O Ardha-Ashtama Shani atinge a {{house}}, pedindo ajustes na base emocional, lar e questões de segurança. {{concurrent}}",
        ashtamaMoon:
          "O Ashtama Shani da Lua ressoa na {{house}}, marcando um período de profunda transformação emocional. A pressão pede reconstrução gradual, não fuga. {{concurrent}}",
        kantakaAscendant:
          "O Kantaka Shani do Ascendente atinge a {{house}}, pedindo reajuste na base externa de vida, carreira e estruturas cotidianas. {{concurrent}}",
        ashtamaAscendant:
          "O Ashtama Shani do Ascendente atinge a {{house}}, convidando a uma reorganização de vitalidade, saúde e processos práticos. {{concurrent}}",
      },
    },
  },
  senhor: {
    profection: "✦ Profecção — {{age}} anos",
    title: "O Regente do Ano: {{lord}}",
    houseTag: "(Casa {{house}})",
    houseIn: "Casa {{house}} em {{sign}}",
    coLords: "Co-regentes: {{lords}}",
    collapse: "Recolher leitura",
    expand: "Ler a leitura do ano",
    loading: "Sincronizando com o ciclo anual...",
    source: {
      natal: "a partir do mapa natal",
      solarReturn: "a partir da Revolução Solar",
      ruler: "a partir da regência tradicional",
    },
  },
  ativacoes: {
    title: "Ativações Rápidas",
    loading: "Mapeando janelas de ignição...",
    none: "Nenhuma ativação rápida ativa no momento. O céu ainda aquece o palco do ano.",
    house: "Casa {{house}}",
    types: {
      invasao: "Entrada no território",
      "toque-no-regente": "Toque no regente",
      "senhor-em-movimento": "Regente em movimento",
    },
  },
  dasha: {
    sections: {
      intro: "Introdução",
      phase: "Sua fase atual",
      ocean: "O Grande Oceano",
      current: "A Correnteza",
      wave: "A Onda",
      challenge: "O Desafio",
      synthesis: "A Síntese",
    },
  },
  chat: {
    welcome:
      "Olá. Sou a Aquar.IA. Estou aqui para refletir com você o que seu mapa astral revela neste momento. Pergunte o seu mapa.",
    tabs: {
      tropical: "Tropical",
      sidereal: "Sideral",
      ciclos: "Ciclos",
    },
    remaining_one: "{{count}} pergunta restante este mês",
    remaining_other: "{{count}} perguntas restantes este mês",
    loadingLimit: "Carregando limite...",
    savePdf: "Salvar conversa em PDF",
    pdfError: "Não foi possível salvar o PDF agora. Tente novamente.",
    closeChat: "Fechar chat",
    events: {
      next30: "Próximos 30 dias",
      sheetTitle: "Céu do momento — Próximos 30 dias",
      calculating: "Calculando ciclos...",
      none: "Nenhum evento encontrado.",
      skyNow: "Céu do momento:",
      pickEvent: "Escolher evento do céu do momento",
      selected: "Evento selecionado",
      clear: "Limpar evento",
      types: {
        ingress: "{{planet}} entra em {{sign}}",
        current: "{{planet}} em {{sign}}",
        new_moon: "Lua Nova em {{sign}}",
        full_moon: "Lua Cheia em {{sign}}",
        solar_eclipse: "Eclipse Solar em {{sign}}",
        lunar_eclipse: "Eclipse Lunar em {{sign}}",
      },
    },
    suggestion:
      "Quero entender outro trânsito: Trânsito de [planeta] - [x] graus de [signo] - ",
    placeholder: "Pergunte o seu mapa astral",
    pdfNote:
      "A conversa não é salva no banco. Você pode exportar para PDF quando quiser. Clique no ícone no topo do chat.",
    error:
      "Perdão, houve uma interferência em nossa conexão cósmica. Poderia tentar novamente?",
    source: "Fonte",
    keys: "Chaves",
  },
};

export type Dictionary = typeof ptBR;
export default ptBR;
