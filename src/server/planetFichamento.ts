// Fichamento de Astrologia Alquímica da Alma — base de conhecimento determinístico
// para geração das leituras tropicais da Régua de Glifos / Engrenagens Celestes.
//
// ESTE ARQUIVO É ESTRITAMENTE TROPICAL: sem nakshatras, sem termos védicos e sem
// referências siderais. As dignidades listadas servem apenas para calibração interna
// do tom do modelo; elas NÃO devem ser expostas ao usuário na interface.

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
      "O Sol é o núcleo de coerência identitária: ele síntese o que a alma veio irradiar nesta encarnação. Em seu melhor funcionamento, oferece autonomia, calor vital e a capacidade de dizer 'eu sou' sem barganhar reconhecimento. Psicologicamente, ele regula a autoestima, o propósito consciente e a coragem de ocupar o centro da própria história. Quando tocado, revela o lugar onde o ego aprende a brilhar sem queimar.",
    shadowText:
      "A oitava de aprendizado do Sol ensina que liderança sem humildade vira performance vazia e que o brilho verdadeiro não precisa eclipsar o outro. O trabalho sombra é trocar a sede de aplauso pela responsabilidade silenciosa de ser testemunha de si mesmo.",
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
      "A Lua governa o campo emocional, a memória corporal e os ritmos de acolhimento. Ela é a mãe interna que nutre, protege e, quando ferida, retrai. Psicologicamente, indica como a pessoa sente em segurança, como recebe carinho e como regula o humor. Sua posição tropical aponta o território emocional onde a alma precisa ser cuidada para, só então, cuidar.",
    shadowText:
      "A oitava de aprendizado da Lua ensina que apegos e dependências emocionais mascaram a fome de pertencimento. O trabalho sombra é criar o abrigo interior — para que o outro seja companheiro, e não fonte de oxigênio.",
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
      "Mercúrio é o mensageiro: articula percepções, traduz experiências e tece redes de significado. Ele governa a curiosidade, a fala, o raciocínio e a capacidade de aprender. Psicologicamente, revela como a mente filtra o mundo, como a pessoa nomeia suas verdades e como constrói diálogos internos. É o planetário da cognição em movimento.",
    shadowText:
      "A oitava de aprendizado de Mercúrio ensina que a mente acelerada, quando desancorada, vira labirinto de justificações. O trabalho sombra é aprender a calar o raciocínio para que a intuição fale — e falar só depois de ouvir.",
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
      "Vênus é a sacerdotisa do prazer, da beleza e do encontro. Ela une o que está separado: corpos, valores, sensibilidades estéticas. Psicologicamente, revela como a pessoa ama, o que considera belo e como troca afeto. Sua posição tropical indica o território onde o coração aprende a seduzir sem barganhar e a valorizar sem possuir.",
    shadowText:
      "A oitava de aprendizado de Vênus ensina que o prazer usado como anestesia gera dependência afetiva e autoestima colada no desejo do outro. O trabalho sombra é cultivar o gozo próprio, para que a relação seja templo, e não mercado.",
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
      "Marte é o fogo da ação, o impulso de conquista e a capacidade de defender fronteiras. Ele governa a libido de existir, a coragem de iniciar e a ferocidade protetora. Psicologicamente, mostra como a pessoa lida com raiva, desejo e competição. Sua posição tropical indica o campo onde a vontade aprende a ser afirmada sem destruir.",
    shadowText:
      "A oitava de aprendizado de Marte ensina que a força sem direção vira agressão ou autossabotagem. O trabalho sombra é converter a combatividade em assertividade — usar a espada para construir, não apenas para cortar.",
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
      "Júpiter é o arquétipo da expansão, da fé e do sentido maior. Ele abre horizontes, oferece otimismo e conecta a pessoa a leis, filosofias e crenças. Psicologicamente, regula a capacidade de confiar na vida, de crescer e de ensinar. Sua posição tropical indica o território onde a alma busca compreender e abundar.",
    shadowText:
      "A oitava de aprendizado de Júpiter ensina que a expansão sem discernimento vira arrogância, excesso ou fuga na espiritualidade. O trabalho sombra é aprender a grandiosidade responsável: mais não é sempre melhor, e a sabedoria precisa de limites.",
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
      "Saturno é o grande escultor: delimita tempo, maturidade e responsabilidade. Ele governa estruturas, deveres e as lições que só se aprendem pela persistência. Psicologicamente, indica onde a pessoa sente medo, onde precisa construir disciplina e onde encontra a própria autoridade. Sua posição tropical aponta o campo da maturação forçada pela vida.",
    shadowText:
      "A oitava de aprendizado de Saturno ensina que o rigor excessivo vira prisão e que a culpa mascarada de dever gera amargura. O trabalho sombra é transformar o mestre severo em mestre paciente — estruturar com amor, não com medo.",
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
      "Urano é o disruptor e o inventor: traz insights súbitos, originalidade e a necessidade de romper padrões obsoletos. Ele governa a liberdade, a tecnologia e a consciência coletiva. Psicologicamente, revela onde a pessoa precisa desautorizar o convencional para ser fiel a si mesma. Sua posição tropical indica o campo da revolução interior.",
    shadowText:
      "A oitava de aprendizado de Urano ensina que a rebeldia sem causa vira mero contrarianismo e que a liberdade alheia também precisa ser honrada. O trabalho sombra é integrar o diferente sem quebrar tudo: inovar com responsabilidade.",
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
      "Netuno é o oceano da alma: dissolve fronteiras, amplifica a sensibilidade e abre canais de inspiração e compaixão. Ele governa o sonho, a espiritualidade e a capacidade de transcendência. Psicologicamente, indica onde a pessoa sente o invisível e onde pode confundir ilusão com intuição. Sua posição tropical aponta o território da entrega e da permeabilidade.",
    shadowText:
      "A oitava de aprendizado de Netuno ensina que a dissolução sem centro vira fuga, vício ou martírio. O trabalho sombra é discernir entre compaixão e resgate, entre sonho e evasão — e ancorar o sagrado no cotidiano.",
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
      "Plutão é o alquimista das profundezas: governa transformação, poder e tudo o que está enterrado. Ele destrói para reconstruir, expondo sombras e verdades ocultas. Psicologicamente, revela os mecanismos de controle, obsessão e regeneração da pessoa. Sua posição tropical indica o campo onde a alma passa pelo fogo para renascer.",
    shadowText:
      "A oitava de aprendizado de Plutão ensina que o poder sobre o outro é ilusão de segurança e que a regeneração exige entrega. O trabalho sombra é usar a intensidade como ferramenta de cura, não como arma de dominação.",
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
      "O Nodo Norte é a bússola evolutiva: indica a direção de crescimento, os talentos a desenvolver e o terreno desconhecido a ser cultivado. Ele não é um corpo, mas um ponto de encontro entre caminhos lunares. Psicologicamente, aponta o que a alma veio aprender nesta vida — geralmente aquilo que foge da zona de conforto. Sua posição tropical mostra o destino a ser tecido com coragem.",
    shadowText:
      "A oitava de aprendizado do Nodo Norte ensina que o futuro pede desapego do passado e que crescer exige desconforto. O trabalho sombra é deixar de lado as certezas kármicas para abraçar a vulnerabilidade do aprendizado.",
  },

  "nodo-sul": {
    id: "nodo-sul",
    canonicalName: "Nodo Sul",
    functionText:
      "O Nodo Sul é o arquivo da memória: traz dons, hábitos e padrões já dominados em outras estações da alma. Ele representa a zona de conforto e as tendências automáticas. Psicologicamente, revela os talentos naturais, mas também as armadilhas da repetição. Sua posição tropical indica o que está pronto para ser oferecido, não apegado.",
    shadowText:
      "A oitava de aprendizado do Nodo Sul ensina que o dom natural, quando estagnado, vira preguiça espiritual. O trabalho sombra é usar o passado como recurso sem confundir familiaridade com destino.",
  },

  quiron: {
    id: "quiron",
    canonicalName: "Quíron",
    functionText:
      "Quíron é o ferido curandeiro: uma ferida primordial que, quando reconhecida, se torna medicina para o mundo. Ele governa a vulnerabilidade iniciática e o dom de curar através da própria dor. Psicologicamente, indica o lugar da alma que nunca cicatriza totalmente — e que, por isso, ensina. Sua posição tropical aponta a ferida-sabedoria a ser honrada.",
    shadowText:
      "A oitava de aprendizado de Quíron ensina que a ferida só cura quando é testemunhada, não escondida nem usada como identidade. O trabalho sombra é transformar o sofrimento em oferenda sem glorificar a dor.",
  },

  lilith: {
    id: "lilith",
    canonicalName: "Lilith",
    functionText:
      "Lilith é a sombra da autonomia: o desejo selvagem, a recusa à submissão e a sexualidade não domesticada. Ela representa o instinto que não negocia a alma. Psicologicamente, revela onde a pessoa foi exilada por ser demais, e onde precisa reclamar sua voz sem pedir licença. Sua posição tropical indica o território da revolta santa.",
    shadowText:
      "A oitava de aprendizado de Lilith ensina que o poder da recusa, quando cego, vira destruição e isolamento. O trabalho sombra é canalizar a fúria sã em limites claros — ser livre sem ferir gratuitamente.",
  },

  "roda-da-fortuna": {
    id: "roda-da-fortuna",
    canonicalName: "Roda da Fortuna",
    functionText:
      "A Roda da Fortuna é o ponto de encontro entre destino e oportunidade: indica onde a vida oferece fluidez, sorte e sincronia quando o eu está alinhado. Ela não é um corpo celeste, mas um cálculo que sinaliza o campo da abundância. Psicologicamente, revela onde a pessoa floresce com menos esforço e onde a confiança abre portas. Sua posição tropical aponta o terreno da graça.",
    shadowText:
      "A oitava de aprendizado da Roda da Fortuna ensina que a facilidade, quando não é compartilhada, gera complacência. O trabalho sombra é usar a sorte como responsabilidade — transformar o privilégio em serviço.",
  },

  asc: {
    id: "asc",
    canonicalName: "Ascendente",
    functionText:
      "O Ascendente é a máscara transparente: o estilo de presença, o corpo como interface e a primeira impressão que o mundo recebe. Ele governa a maneira como a pessoa nasce no aqui-e-agora. Psicologicamente, revela o arquétipo de personalidade que conduz a alma ao encontro com o outro. Sua posição tropical indica a coragem de existir em carne e osso.",
    shadowText:
      "A oitava de aprendizado do Ascendente ensina que a persona, quando rígida, vira prisão. O trabalho sombra é permitir que a máscara respire — ser um eu social sem trair o eu essencial.",
  },

  mc: {
    id: "mc",
    canonicalName: "Meio do Céu",
    functionText:
      "O Meio do Céu é o ponto de realização pública: a vocação, a reputação e o legado que a pessoa constrói no mundo. Ele governa a ambição de sentido e o papel social que a alma veio desempenhar. Psicologicamente, indica onde o sucesso só floresce quando alinhado à verdade interior. Sua posição tropical aponta a montanha que a alma veio escalar.",
    shadowText:
      "A oitava de aprendizado do MC ensina que o prestígio vazio consome e que a carreira sem propósito vira fuga. O trabalho sombra é entregar-se à missão sem se perder no personagem do sucesso.",
  },
};

export function getPlanetFichamento(id: string): PlanetFichamentoEntry | undefined {
  return PLANET_FICHAMENTO[id];
}
