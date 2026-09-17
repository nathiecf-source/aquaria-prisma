// Fichamento de Astrologia Alquímica da Alma — base de conhecimento determinístico
// para geração das leituras tropicais da Régua de Glifos / Engrenagens Celestes.
//
// ESTE ARQUIVO É ESTRITAMENTE TROPICAL: sem nakshatras, sem termos védicos e sem
// referências siderais. As dignidades listadas servem apenas para calibração interna
// do tom do modelo; elas NÃO devem ser expostas ao usuário na interface.
//
// Tom: próximo ao das leituras de Casa — fluido, poético, direto e psicologicamente
// refinado. Evitar jargão astrológico e estruturas rebuscadas.

export interface PlanetFichamentoEntry {
  id: string;
  canonicalName: string;
  /** Função geral + psicológica fundidas em um único texto. */
  functionText: string;
  /** Oitava de Aprendizado / sombra / trabalho evolutivo do ponto. */
  shadowText: string;
  /** Dignidades para calibração interna de tom (NÃO exibir ao usuário). */
  dignities?: {
    domicile?: string[];
    exaltation?: string[];
    detriment?: string[];
    fall?: string[];
  };
}

export const PLANET_FICHAMENTO: Record<string, PlanetFichamentoEntry> = {
  sol: {
    id: "sol",
    canonicalName: "Sol",
    functionText:
      "O Sol fala do lugar onde você aprende a dizer 'eu sou' sem pedir licença. É o seu centro irradiante, a coragem de ocupar a própria história e o calor que mantém o propósito acordado. Quando ele está aceso, você não precisa barganhar reconhecimento: a sua presença organiza o ambiente sem forçar.",
    shadowText:
      "O aprendizado do Sol aparece quando o brilho vira performance e a liderança esquece a humildade. A sombra é acreditar que só existe quando aplaudido. O caminho é deixar o ego descansar e descobrir que ser testemunha de si mesmo também é uma forma de luz.",
    dignities: {
      domicile: ["Leão"],
      exaltation: ["Áries"],
      detriment: ["Aquário"],
      fall: ["Libra"],
    },
  },

  lua: {
    id: "lua",
    canonicalName: "Lua",
    functionText:
      "A Lua fala do seu mundo emocional, da memória que o corpo guarda e dos ritmos nos quais você se sente seguro. Ela revela como você acolhe, como precisa ser acolhido e como regula o humor ao longo do dia. É a parte de você que aprendeu a cuidar antes de pedir cuidado, e que precisa de um abrigo íntimo para poder abrir.",
    shadowText:
      "O aprendizado da Lua acontece quando a fome de pertencimento se confunde com apego. A sombra é fazer do outro a fonte de oxigênio emocional. O caminho é construir o abrigo interior primeiro, para que a companhia seja um encontro, e não uma sobrevivência.",
    dignities: {
      domicile: ["Câncer"],
      exaltation: ["Touro"],
      detriment: ["Capricórnio"],
      fall: ["Escorpião"],
    },
  },

  mercurio: {
    id: "mercurio",
    canonicalName: "Mercúrio",
    functionText:
      "Mercúrio é o movimento da sua mente: a curiosidade que liga uma ideia à outra, a fala que traduz o que você sente e o raciocínio que organiza o mundo. Ele mostra como você nomeia suas verdades e como constrói o diálogo consigo mesmo. É a inteligência em ação, sempre buscando entender, conectar e comunicar.",
    shadowText:
      "O aprendizado de Mercúrio aparece quando a mente acelera demais e vira labirinto de justificações. A sombra é falar para não sentir. O caminho é aprender a ouvir antes de nomear, e deixar que a intuição também tenha vez.",
    dignities: {
      domicile: ["Gêmeos", "Virgem"],
      exaltation: ["Aquário"],
      detriment: ["Sagitário", "Peixes"],
      fall: ["Leão"],
    },
  },

  venus: {
    id: "venus",
    canonicalName: "Vênus",
    functionText:
      "Vênus fala do prazer, do encontro e do que você considera belo. É a parte de você que une o que estava separado: corpos, valores e sensibilidades. Ela revela como você ama, como troca afeto e como aprende a seduzir sem barganhar. É o coração aberto ao mundo, buscando harmonia e conexão.",
    shadowText:
      "O aprendizado de Vênus aparece quando o prazer vira anestesia e a autoestima fica presa no desejo do outro. A sombra é tratar a relação como mercado. O caminho é cultivar o gozo próprio, para que o encontro seja templo, e não troca.",
    dignities: {
      domicile: ["Touro", "Libra"],
      exaltation: ["Peixes"],
      detriment: ["Escorpião", "Áries"],
      fall: ["Virgem"],
    },
  },

  marte: {
    id: "marte",
    canonicalName: "Marte",
    functionText:
      "Marte fala da sua energia de ação, do impulso que te faz começar e da coragem de defender o que é seu. Ele mostra como você lida com raiva, desejo e competição. É o fogo que move a vontade e que precisa de um direcionamento claro para não queimar o que está ao redor.",
    shadowText:
      "O aprendizado de Marte aparece quando a força vira agressão ou quando a raiva fica sem direção. A sombra é querer vencer a qualquer custo. O caminho é aprender a usar a energia de Marte para construir, não para destruir — afirmar o que você precisa sem ferir quem não merece.",
    dignities: {
      domicile: ["Áries", "Escorpião"],
      exaltation: ["Capricórnio"],
      detriment: ["Libra", "Touro"],
      fall: ["Câncer"],
    },
  },

  jupiter: {
    id: "jupiter",
    canonicalName: "Júpiter",
    functionText:
      "Júpiter fala da expansão, da fé e da busca por sentido. É a parte de você que quer crescer, confiar na vida e ver além do que está ali na frente. Ele mostra onde você se sente chamado a entender melhor o mundo e a si mesmo, e onde a esperança encontra um terreno fértil.",
    shadowText:
      "O aprendizado de Júpiter aparece quando a vontade de crescer vira excesso, arrogância ou fuga. A sombra é acreditar que mais é sempre melhor. O caminho é expandir com discernimento, para que a fé seja âncora, e não escapismo.",
    dignities: {
      domicile: ["Sagitário", "Peixes"],
      exaltation: ["Câncer"],
      detriment: ["Gêmeos", "Virgem"],
      fall: ["Capricórnio"],
    },
  },

  saturno: {
    id: "saturno",
    canonicalName: "Saturno",
    functionText:
      "Saturno fala de tempo, responsabilidade e das lições que só se aprendem com persistência. Ele mostra onde você precisa construir estrutura, onde sente medo e onde a vida pede maturidade. É o professor lento e exigente que, quando você aprende a ouvir, revela a sua própria autoridade.",
    shadowText:
      "O aprendizado de Saturno aparece quando o rigor vira prisão e o dever vira culpa. A sombra é acreditar que só vale a pena quando é doloroso. O caminho é transformar o medo em paciência e estruturar a vida com cuidado, não com castigo.",
    dignities: {
      domicile: ["Capricórnio", "Aquário"],
      exaltation: ["Libra"],
      detriment: ["Câncer", "Leão"],
      fall: ["Áries"],
    },
  },

  urano: {
    id: "urano",
    canonicalName: "Urano",
    functionText:
      "Urano fala da sua necessidade de liberdade, de originalidade e de romper com o que já não faz sentido. Ele traz insights de repente e mostra onde você precisa ser fiel a si mesmo, mesmo que isso desafie o convencional. É a voz que diz que é possível viver de outro jeito.",
    shadowText:
      "O aprendizado de Urano aparece quando a diferença vira rebeldia por rebeldia. A sombra é quebrar tudo só para provar que pode. O caminho é inovar sem destruir o que ainda sustenta você, e honrar a liberdade dos outros enquanto conquista a sua.",
    dignities: {
      domicile: ["Aquário"],
      exaltation: ["Escorpião"],
      detriment: ["Leão"],
      fall: ["Touro"],
    },
  },

  netuno: {
    id: "netuno",
    canonicalName: "Netuno",
    functionText:
      "Netuno fala da sensibilidade, da imaginação e da conexão com o que não se vê. Ele amplifica a compaixão e abre espaço para o sagrado. É a parte de você que sente o mundo por inteiro, que sonha e que precisa aprender a distinguir intuição de ilusão.",
    shadowText:
      "O aprendizado de Netuno aparece quando a sensibilidade vira fuga ou quando o sonho substitui a realidade. A sombra é confundir compaixão com resgate. O caminho é ancorar o sagrado no dia a dia, sem perder o contato com o chão.",
    dignities: {
      domicile: ["Peixes"],
      exaltation: ["Leão"],
      detriment: ["Virgem"],
      fall: ["Aquário"],
    },
  },

  plutao: {
    id: "plutao",
    canonicalName: "Plutão",
    functionText:
      "Plutão fala de transformação, de tudo o que está escondido e da coragem de olhar para a própria sombra. Ele governa os ciclos de morte e renascimento da psique, mostrando onde você precisa soltar o velho para nascer de novo. É o fogo que purifica, doloroso, mas necessário.",
    shadowText:
      "O aprendizado de Plutão aparece quando a intensidade vira controle ou obsessão. A sombra é usar o poder sobre o outro como se fosse segurança. O caminho é deixar o velho morrer sem resistir, e usar a profundidade como ferramenta de cura, e não como arma.",
    dignities: {
      domicile: ["Escorpião"],
      exaltation: ["Áries"],
      detriment: ["Touro"],
      fall: ["Libra"],
    },
  },

  "nodo-norte": {
    id: "nodo-norte",
    canonicalName: "Nodo Norte",
    functionText:
      "O Nodo Norte aponta para onde você está crescendo. É a direção que foge da zona de conforto e que pede coragem para ser vivida. Ele mostra o que a sua alma veio aprender nesta vida, os talentos que ainda estão amadurecendo e o terreno desconhecido que você precisa cultivar.",
    shadowText:
      "O aprendizado do Nodo Norte aparece quando o medo do desconhecido faz você voltar para o velho. A sombra é achar que já sabe demais. O caminho é abrir mão das certezas do passado e permitir que o novo se ensine, aos poucos.",
  },

  "nodo-sul": {
    id: "nodo-sul",
    canonicalName: "Nodo Sul",
    functionText:
      "O Nodo Sul fala do que você já trouxe consigo: talentos naturais, hábitos antigos e a zona de conforto. É a memória da alma, os dons que você já domina e que podem ser oferecidos ao mundo. Ele mostra o que já é seu, mas que não pode virar prisão.",
    shadowText:
      "O aprendizado do Nodo Sul aparece quando o dom natural vira repetição e o passado vira desculpa. A sombra é confundir familiaridade com destino. O caminho é usar o que você já sabe como ponto de partida, não como lugar para ficar.",
  },

  quiron: {
    id: "quiron",
    canonicalName: "Quíron",
    functionText:
      "Quíron fala da ferida que, quando reconhecida, vira medicina. É a parte de você que carrega uma vulnerabilidade antiga e que, por ter passado por ela, sabe cuidar de quem também sofre. Ele mostra onde a dor se transforma em oferenda e onde a cura começa com a própria testemunha.",
    shadowText:
      "O aprendizado de Quíron aparece quando a ferida vira identidade ou quando a dor é escondida. A sombra é usar o sofrimento como moeda. O caminho é ver a ferida sem dramatizar, deixando que ela seja fonte de compaixão, e não de exaustão.",
  },

  lilith: {
    id: "lilith",
    canonicalName: "Lilith",
    functionText:
      "Lilith fala da autonomia que não negocia a alma. É o desejo selvagem, a recusa à submissão e a parte de você que foi exilada por ser demais. Ela mostra onde você precisa reclamar a própria voz sem pedir licença e onde a liberdade é mais importante do que a aprovação.",
    shadowText:
      "O aprendizado de Lilith aparece quando a recusa vira destruição e a liberdade vira isolamento. A sombra é ferir para provar que é livre. O caminho é usar a fúria sã para desenhar limites claros: ser livre sem machucar quem não tem culpa.",
  },

  "roda-da-fortuna": {
    id: "roda-da-fortuna",
    canonicalName: "Roda da Fortuna",
    functionText:
      "A Roda da Fortuna fala do lugar onde a vida flui com mais facilidade. É o ponto onde oportunidade, destino e confiança se encontram. Ela mostra onde você floresce com menos esforço e onde as portas parecem se abrir quando você está alinhado com o que é seu.",
    shadowText:
      "O aprendizado da Roda da Fortuna aparece quando a facilidade vira complacência. A sombra é achar que o privilégio é só seu. O caminho é usar a sorte como responsabilidade, transformando o que veio fácil em serviço ao que importa.",
  },

  asc: {
    id: "asc",
    canonicalName: "Ascendente",
    functionText:
      "O Ascendente fala da sua presença, da primeira impressão que você deixa e do jeito como o mundo te lê antes de você abrir a boca. É o seu corpo no mundo, o estilo como você chega. Ele mostra como você nasce no aqui-e-agora e como se apresenta para a vida.",
    shadowText:
      "O aprendizado do Ascendente aparece quando a persona vira prisão. A sombra é acreditar que precisa ser sempre a mesma máscara. O caminho é deixar o eu social respirar, para que ele sirva de ponte, e não de muralha.",
  },

  mc: {
    id: "mc",
    canonicalName: "Meio do Céu",
    functionText:
      "O Meio do Céu fala da sua vocação, da reputação e do legado que você constrói no mundo. É o papel social que a sua alma veio desempenhar e a montanha que você veio escalar. Ele mostra onde o sucesso só faz sentido quando está alinhado com a sua verdade interior.",
    shadowText:
      "O aprendizado do Meio do Céu aparece quando o prestígio vira fuga e a carreira vira personagem. A sombra é buscar sucesso só para ser visto. O caminho é entregar-se à missão sem se perder no papel, construindo algo que seja seu de verdade.",
  },
};

export function getPlanetFichamento(id: string): PlanetFichamentoEntry | undefined {
  return PLANET_FICHAMENTO[id];
}
