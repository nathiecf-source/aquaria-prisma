/**
 * Simbologia profunda das 27 Nakshatras.
 * Cada entrada detalha o que o símbolo sagrado representa fisicamente,
 * psicologicamente e esotericamente — como ele atua como metáfora exata
 * para o funcionamento da mente e da alma.
 * Chaves seguem os nomes canônicos usados em dailySkyEngine.ts.
 * Registro: linguagem simples e direta, uma ideia por frase.
 */

export interface NakshatraSymbolMeaning {
  symbolTitle: string;
  physicalMeaning: string;
  deepMeaning: string;
}

export const NAKSHATRA_SYMBOL_MEANINGS: Record<string, NakshatraSymbolMeaning> = {
  Ashwini: {
    symbolTitle: "A Cabeça de Cavalo",
    physicalMeaning: "O cavalo representa a força vital, a velocidade e a energia que nasce pronta para se mover. A cabeça concentra o impulso inicial e a direção da mente.",
    deepMeaning: "Simboliza o momento em que a alma desperta e usa sua energia para começar uma jornada. O desafio é domar os impulsos do corpo para que a força sirva a um propósito.",
  },
  Bharani: {
    symbolTitle: "A Yoni e o Portal Tríplice",
    physicalMeaning: "A Yoni é o vaso da criação, o espaço onde a vida é gestada antes de nascer. O portal representa as três etapas da existência: nascer, viver e morrer.",
    deepMeaning: "Simboliza a capacidade de guardar e amadurecer algo no silêncio até que esteja pronto para vir ao mundo. Exige paciência e disciplina para atravessar transformações sem fugir da realidade.",
  },
  Krittika: {
    symbolTitle: "A Navalha e a Lança Flamejante",
    physicalMeaning: "Instrumentos de corte preciso combinados ao fogo. Não servem para destruir por destruir, mas para intervenções exatas.",
    deepMeaning: "Simboliza o poder do discernimento: cortar o que não é verdadeiro, separar o essencial do supérfluo e queimar no fogo da purificação aquilo que já cumpriu seu papel.",
  },
  Rohini: {
    symbolTitle: "A Carruagem",
    physicalMeaning: "A carruagem é o veículo que transporta com conforto, beleza e status pelo mundo material.",
    deepMeaning: "Simboliza o corpo e a mente como veículos da alma: permitem conduzir a vida com graça e prosperidade. O alerta é não se apaixonar pelo veículo e esquecer quem viaja dentro dele.",
  },
  Mrigashira: {
    symbolTitle: "A Cabeça de Veado",
    physicalMeaning: "O veado é vigilante, sensível e inquieto. Seus grandes olhos e ouvidos atentos representam uma percepção fina do ambiente.",
    deepMeaning: "Simboliza a mente que busca sem parar, sempre atraída por algo belo e difícil de alcançar. É a passagem da curiosidade inocente para a pesquisa consciente por respostas mais profundas.",
  },
  Ardra: {
    symbolTitle: "A Lágrima e a Joia",
    physicalMeaning: "A lágrima representa a tempestade emocional que purifica. A joia escondida é o que permanece quando a tempestade passa.",
    deepMeaning: "Simboliza o sofrimento que limpa a visão e desfaz o orgulho. A tempestade derruba as estruturas superficiais para revelar uma sabedoria mais verdadeira e a compaixão.",
  },
  Punarvasu: {
    symbolTitle: "O Arco e a Aljava cheia de Flechas",
    physicalMeaning: "O arco conecta o arqueiro ao alvo. A aljava cheia de flechas representa recursos que nunca se esgotam.",
    deepMeaning: "Punar significa 'de novo'. Simboliza a capacidade da alma de se renovar, recuperar o equilíbrio e recomeçar após cada perda, disparando suas intenções com esperança renovada.",
  },
  Pushya: {
    symbolTitle: "A Flor, a Flecha e o Círculo",
    physicalMeaning: "A flor é o desabrochar dos talentos. A flecha representa a meta. O círculo simboliza a completude do ciclo da vida.",
    deepMeaning: "Simboliza a nutrição que leva ao amadurecimento completo. É a alma dando frutos quando equilibra a expansão da sabedoria com o respeito aos próprios limites.",
  },
  Ashlesha: {
    symbolTitle: "A Serpente Enrolada",
    physicalMeaning: "A serpente enrolada guarda a energia vital adormecida e representa o abraço que envolve e penetra.",
    deepMeaning: "Ashlesha significa 'abraço'. Simboliza o envolvimento profundo com os assuntos da vida. Como a serpente troca de pele, representa o desapego radical: morrer para a forma antiga e renascer mais sábio.",
  },
  Magha: {
    symbolTitle: "O Trono Real",
    physicalMeaning: "O trono é o assento da autoridade e da herança — o lugar de quem é sustentado por uma linhagem.",
    deepMeaning: "Simboliza o peso e o privilégio do poder recebido dos ancestrais. É a fase em que a alma assume a liderança carregando a responsabilidade moral de tudo que veio antes.",
  },
  "Purva Phalguni": {
    symbolTitle: "A Lareira e a Parte Frontal da Cama",
    physicalMeaning: "A cama e a lareira são os espaços do descanso, da intimidade e do calor do encontro.",
    deepMeaning: "Simboliza a pausa merecida para colher os frutos do que foi construído. É a energia do prazer, do romance, da criatividade e do conforto de estar em casa consigo e com os outros.",
  },
  "Uttara Phalguni": {
    symbolTitle: "Os Quatro Pés da Cama",
    physicalMeaning: "Os quatro pés são a estrutura que sustenta o descanso — os pilares que mantêm a vida de pé.",
    deepMeaning: "Simboliza a estabilidade que vem do compromisso. Enquanto a mansão anterior descansa, aqui a alma sustenta alianças, deveres e responsabilidades de longo prazo.",
  },
  Hasta: {
    symbolTitle: "A Palma da Mão Aberta",
    physicalMeaning: "A palma da mão é um pequeno universo: nela cabem o destino, os sentidos e a capacidade de criar.",
    deepMeaning: "Simboliza a destreza e o esforço pessoal. A mão é a ferramenta que pega o conhecimento abstrato e o transforma em algo concreto, útil e real.",
  },
  Chitra: {
    symbolTitle: "A Pérola Brilhante",
    physicalMeaning: "A pérola é uma joia que nasce da irritação de um grão de areia dentro da ostra, lapidada pelo tempo.",
    deepMeaning: "Simboliza a capacidade de transformar fricção e incômodo em beleza. A psique lapida suas camadas mais duras até revelar um brilho que só a pressão podia criar.",
  },
  Swati: {
    symbolTitle: "O Broto ao Vento e o Coral",
    physicalMeaning: "O broto jovem se curva com o vento sem quebrar. O coral cresce no oceano moldando-se às correntes sem perder sua natureza.",
    deepMeaning: "Simboliza a flexibilidade independente: a capacidade de se adaptar às mudanças do mundo sem romper com a própria raiz.",
  },
  Vishakha: {
    symbolTitle: "O Arco Decorado e a Roda do Oleiro",
    physicalMeaning: "O Arco Decorado representa o limiar de uma nova etapa de vida. Simboliza a alma posicionada na entrada do templo, transicionando do foco no mundo exterior para a busca no santuário interior.",
    deepMeaning: "A Roda do Oleiro simboliza a imersão inicial nas ilusões do mundo material (tamas), enquanto a argila girada representa a vida sendo moldada pelas mãos do destino para promover o amadurecimento.",
  },
  Anuradha: {
    symbolTitle: "A Flor de Lótus",
    physicalMeaning: "O lótus nasce na lama e na água escura, mas abre suas pétalas limpas em direção ao sol.",
    deepMeaning: "Simboliza a capacidade de manter a pureza interior e a lealdade mesmo em ambientes difíceis. É a prova de que a luz não depende do lugar onde se está plantado.",
  },
  Jyeshtha: {
    symbolTitle: "O Brinco, o Talismã e o Guarda-chuva",
    physicalMeaning: "O brinco e o talismã são insígnias de senioridade e poder conquistado. O guarda-chuva protege das intempéries.",
    deepMeaning: "Simboliza a maturidade de quem já atravessou as forças ocultas da psique. O guarda-chuva é o abrigo interior: a mente que aprendeu a se proteger do que a desestabiliza.",
  },
  Mula: {
    symbolTitle: "As Raízes Amarradas e o Aguilhão",
    physicalMeaning: "As raízes amarradas vão ao fundo da terra, onde tudo começa. O aguilhão é o instrumento que guia o elefante por estímulo e dor.",
    deepMeaning: "Simboliza a necessidade de ir à causa fundamental e arrancar ilusões pela raiz. O aguilhão representa os choques do destino que, embora doam, direcionam a mente para a verdade.",
  },
  "Purva Ashadha": {
    symbolTitle: "A Presa de Elefante e a Peneira",
    physicalMeaning: "A presa é o instrumento de força e escavação do animal mais imponente. A peneira separa o que presta do que não presta.",
    deepMeaning: "Simboliza a força interior que não pode ser subjugada e o trabalho de filtragem: separar o essencial das impressões até revelar a essência moral.",
  },
  "Uttara Ashadha": {
    symbolTitle: "As Pranchas de uma Cama",
    physicalMeaning: "As pranchas de uma cama simples, sem colchão nem adornos, feitas apenas do essencial.",
    deepMeaning: "Simboliza o descanso austero e o desapego do luxo. É a vitória da simplicidade: focar na estabilidade e na responsabilidade com o que é duradouro, não no que é confortável.",
  },
  Shravana: {
    symbolTitle: "A Orelha e as Três Pegadas",
    physicalMeaning: "A orelha é o órgão da escuta. As três pegadas representam os passos que atravessam os três planos da existência.",
    deepMeaning: "Simboliza a sabedoria que entra pela escuta atenta e pelo silêncio. Ouvir de verdade é a forma mais simples de aprender — e de submeter o ego a algo maior.",
  },
  Dhanishta: {
    symbolTitle: "O Tambor e a Flauta",
    physicalMeaning: "O tambor e a flauta são instrumentos ocos por dentro: só produzem música porque têm espaço vazio para o som vibrar.",
    deepMeaning: "Simboliza a necessidade de esvaziar a mente do ruído do ego. Quando há espaço interno, o ritmo universal atravessa a pessoa e gera harmonia e abundância.",
  },
  Shatabhisha: {
    symbolTitle: "As Cem Estrelas e o Círculo",
    physicalMeaning: "As cem estrelas são os olhos do céu que tudo observam. O círculo delimita um espaço protegido.",
    deepMeaning: "Simboliza a reclusão necessária à cura. O círculo é o espaço sagrado onde a consciência se recolhe para se restaurar, longe da exposição.",
  },
  "Purva Bhadrapada": {
    symbolTitle: "A Espada",
    physicalMeaning: "A espada é o instrumento de corte duplo, usado para atacar e para defender.",
    deepMeaning: "Simboliza o discernimento que corta nós antigos, apegos e padrões que se repetem. É a coragem de travar a batalha interior em nome de uma causa maior que o ego.",
  },
  "Uttara Bhadrapada": {
    symbolTitle: "Os Gêmeos e a Serpente das Profundezas",
    physicalMeaning: "Os gêmeos representam o par que se complementa. A serpente do fundo do mar guarda a sabedoria das águas profundas.",
    deepMeaning: "Simboliza a pacificação dos opostos — razão e intuição, luz e sombra. A serpente profunda é a sabedoria do subconsciente: ela ensina paciência e a dissolução tranquila do ego.",
  },
  Revati: {
    symbolTitle: "O Peixe na Água",
    physicalMeaning: "O peixe nada livre e totalmente imerso no oceano — não há separação entre ele e a água.",
    deepMeaning: "Simboliza a alma que se dissolve com naturalidade na consciência universal. É a compaixão sem limites e a nutrição final da jornada: nadar em liberdade até o oceano levar de volta à fonte.",
  },
};

export function getNakshatraSymbolMeaning(name: string): NakshatraSymbolMeaning | null {
  return NAKSHATRA_SYMBOL_MEANINGS[name] ?? null;
}
