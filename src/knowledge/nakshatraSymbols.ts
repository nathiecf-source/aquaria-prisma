/**
 * Simbologia profunda das 27 Nakshatras.
 * Cada entrada detalha o que o símbolo sagrado representa fisicamente,
 * psicologicamente e esotericamente — como ele atua como metáfora exata
 * para o funcionamento da mente e da alma.
 * Chaves seguem os nomes canônicos usados em dailySkyEngine.ts.
 */

export interface NakshatraSymbolMeaning {
  symbolTitle: string;
  physicalMeaning: string;
  deepMeaning: string;
}

export const NAKSHATRA_SYMBOL_MEANINGS: Record<string, NakshatraSymbolMeaning> = {
  Ashwini: {
    symbolTitle: "A Cabeça de Cavalo",
    physicalMeaning: "O cavalo é o símbolo védico do movimento desimpedido, da força vital (Prana), da velocidade e dos sentidos corporais impetuosos. A cabeça do cavalo concentra a força mental, a visão direcionada e o impulso inicial de vida.",
    deepMeaning: "A figura do cavaleiro/domador representa a mente (Manas) aprendendo a controlar a força selvagem dos impulsos corporais. Simboliza o limiar entre a escuridão e o amanhecer, onde a alma usa sua vitalidade concentrada para iniciar a jornada espiritual e buscar a libertação (Moksha).",
  },
  Bharani: {
    symbolTitle: "A Yoni e o Portal Tríplice",
    physicalMeaning: "A Yoni é o vaso primordial da criação, o espaço sagrado de incubação e o canal através do qual a vida transita entre o mundo não manifesto e o físico. O Portal Tríplice representa as três etapas da existência (nascimento, vida e morte) e os deveres do dharma.",
    deepMeaning: "Simboliza a capacidade da psique de reter, nutrir, suportar a dor da gestação e dar à luz novas ideias e estados de consciência. Exige restrição e disciplina kármica para suportar os processos de transformação profunda sem fugir da realidade.",
  },
  Krittika: {
    symbolTitle: "A Navalha, a Tesoura e a Lança Flamejante",
    physicalMeaning: "Instrumentos de corte afiados combinados ao fogo de Agni. A navalha e a lança não são para destruição cega, mas para intervenção precisa.",
    deepMeaning: "Representam o poder do intelecto analítico de realizar cirurgias psíquicas: cortar os apegos do ego, separar o verdadeiro do falso e incinerar a ignorância e os dejetos kármicos no fogo da purificação. O ato de cortar simboliza o discernimento rigoroso que elimina a negatividade.",
  },
  Rohini: {
    symbolTitle: "A Carruagem (Ratha)",
    physicalMeaning: "A carruagem é o veículo físico de transporte, luxo, status e conforto que carrega a nobreza no mundo material.",
    deepMeaning: "Como o corpo e o intelecto servem de veículo para a mente, a carruagem simboliza a capacidade de conduzir a vida material com graça, atração estética e prosperidade. Alerta para o risco psicológico de a pessoa se apaixonar pela beleza do veículo (o corpo/bens) e esquecer o passageiro interno (a alma).",
  },
  Mrigashira: {
    symbolTitle: "A Cabeça de Veado",
    physicalMeaning: "O veado é o símbolo da vigilância constante, da hipersensibilidade, da timidez e da inquietação. Seus grandes olhos e ouvidos atilados representam uma percepção aguçada do ambiente.",
    deepMeaning: "A cabeça do veado simboliza a mente investigativa que nunca se satisfaz com o óbvio e busca constantemente algo belo e evasivo (o veado dourado das ilusões). Representa a transição da inocência para a pesquisa intelectual e a busca por respostas espirituais.",
  },
  Ardra: {
    symbolTitle: "A Gota de Lágrima, a Joia e a Cabeça Cortada",
    physicalMeaning: "A lágrima representa o sofrimento purificador e a tempestade emocional; a cabeça cortada simboliza a destruição do orgulho intelectivo (Ahamkara); e a joia oculta representa o resultado radiante dessa transformação.",
    deepMeaning: "As lágrimas lavam a visão turva da mente e dissolvem a arrogância do ego. A tempestade destrói as estruturas superficiais da psique para revelar a joia da sabedoria espiritual e da compaixão.",
  },
  Punarvasu: {
    symbolTitle: "O Arco e a Aljava cheia de Flechas",
    physicalMeaning: "O arco é a ferramenta que conecta o arqueiro à sua meta; a aljava cheia de flechas representa recursos inagotáveis para tentar novamente.",
    deepMeaning: "Punar significa 'de novo' e Vasu significa 'luz/brilho'. O símbolo representa a capacidade contínua da alma de se renovar, recuperar o equilíbrio perdido e retornar à orientação divina após momentos de provação, disparando suas intenções com esperança renovada.",
  },
  Pushya: {
    symbolTitle: "A Flor, a Flecha e o Círculo Completo",
    physicalMeaning: "A flor representa o desabrochar dos talentos latentes; a flecha simboliza a meta focada; e o círculo representa a totalidade e a integridade do ciclo da vida.",
    deepMeaning: "Representa a nutrição e o amadurecimento completo da alma. É a capacidade de dar frutos espirituais através do equilíbrio entre a expansão da sabedoria e o respeito aos limites e restrições kármicas da encarnação atual.",
  },
  Ashlesha: {
    symbolTitle: "A Serpente Enrolada",
    physicalMeaning: "A serpente enrolada representa a força da Kundalini adormecida, o abraço apertado, o veneno que mata e a toxina que cura quando usada como antídoto.",
    deepMeaning: "Ashlesha significa 'abraço'. Representa o envolvimento da alma com a matéria para cumprir débitos kármicos inevitáveis. A capacidade da serpente de trocar de pele simboliza o desapego radical, a morte psicológica e o renascimento espiritual através do domínio dos segredos e da intuição.",
  },
  Magha: {
    symbolTitle: "O Trono e o Palanquim Real",
    physicalMeaning: "O trono e o palanquim são assentos de soberania, autoridade e herança onde a pessoa é carregada por outros.",
    deepMeaning: "Representam o peso e o privilégio do poder, assim como a transmissão do karma e da sabedoria ancestral (Pitris). Simbolizam a fase em que a alma assume posições de liderança e responsabilidade moral respaldada pelos méritos do passado.",
  },
  "Purva Phalguni": {
    symbolTitle: "A Lareira e a Parte Frontal da Cama",
    physicalMeaning: "A cama e a lareira são espaços de descanso, intimidade, calor social e relaxamento. A parte frontal marca o início do repouso.",
    deepMeaning: "Simboliza a pausa na jornada da alma para colher e desfrutar dos frutos das boas ações passadas (Karma Phal). Representa a celebração dos desejos sensoriais, a expressão artística, o romance e o conforto familiar.",
  },
  "Uttara Phalguni": {
    symbolTitle: "Os Quatro Pés da Cama",
    physicalMeaning: "Os quatro pés da cama representam a estrutura física de sustentação: os quatro pilares da vida (Dharma, Artha, Kama, Moksha), os quatro Vedas e as quatro direções.",
    deepMeaning: "Enquanto a mansão anterior focava no descanso, os quatro pés simbolizam a estabilidade, a firmeza nos compromissos, o dever social e a liderança voltada ao serviço e à proteção de longo prazo.",
  },
  Hasta: {
    symbolTitle: "A Palma da Mão Aberta",
    physicalMeaning: "A palma da mão é um microcosmo do universo: suas linhas e articulações refletem os signos, os elementos, os sentidos e os caminhos do destino.",
    deepMeaning: "A mão simboliza a destreza técnica, o esforço pessoal e a capacidade da mente de pegar, moldar e controlar a matéria com inteligência analítica, transformando o conhecimento abstrato em realizações práticas.",
  },
  Chitra: {
    symbolTitle: "A Pérola e a Joia Brilhante",
    physicalMeaning: "A pérola é uma joia radiante criada a partir da irritação e da dor dentro da ostra ao longo do tempo.",
    deepMeaning: "Simboliza a capacidade da psique de transformar fricções, conflitos e sofrimentos internos em maestria estética e beleza sutil, lapidando as camadas do ego para revelar a essência divina.",
  },
  Swati: {
    symbolTitle: "O Broto de Planta ao Vento e o Coral",
    physicalMeaning: "O broto jovem que se curva com o vento sem quebrar; e o coral, que cresce no oceano influenciando e sendo influenciado pelo ambiente.",
    deepMeaning: "Simboliza a flexibilidade, a independência e a agilidade mental. Representa a capacidade de se adaptar às mudanças do mundo sem perder a própria raiz ou a integridade interna.",
  },
  Vishakha: {
    symbolTitle: "O Arco/Pórtico Decorado e a Roda do Oleiro",
    physicalMeaning: "O pórtico marca a entrada de um limiar; a roda do oleiro representa a argila sendo girada e moldada pela fricção.",
    deepMeaning: "O pórtico indica que a alma está na transição de olhar do mundo externo para o interior. A roda do oleiro simboliza a vida sendo trabalhada pelas mãos do destino, refinando a matéria bruta até que a consciência esteja pronta.",
  },
  Anuradha: {
    symbolTitle: "A Flor de Lótus",
    physicalMeaning: "O lótus germina na lama e nas águas escuras/estagnadas, mas eleva suas pétalas em direção ao Sol mantendo-se imaculado.",
    deepMeaning: "Simboliza a habilidade da alma de cultivar a devoção, a luz interior, a amizade pura e a lealdade espiritual mesmo quando imersa em ambientes difíceis, densos ou conturbados.",
  },
  Jyeshtha: {
    symbolTitle: "O Brinco Circular, o Talismã e o Guarda-chuva",
    physicalMeaning: "O brinco em espiral e o talismã são insígnias de iniciação e poder oculto; o guarda-chuva/parasol representa proteção contra intempéries.",
    deepMeaning: "Simboliza a maturidade, a senioridade e a autoridade alcançadas após dominar as forças ocultas da psique. O guarda-chuva representa o abrigo interior da mente contra influências externas nocivas.",
  },
  Mula: {
    symbolTitle: "As Raízes Amarradas e o Aguilhão de Elefante",
    physicalMeaning: "As raízes amarradas apontam para a profundeza da terra; o aguilhão de metal é o instrumento usado para cutucar e guiar o elefante.",
    deepMeaning: "As raízes simbolizam a necessidade imperiosa de ir à causa fundamental e destruir ilusões de superfície. O aguilhão representa os choques e dores providos pelo destino para direcionar a mente no caminho da verdade.",
  },
  "Purva Ashadha": {
    symbolTitle: "A Presa de Elefante e a Peneira",
    physicalMeaning: "A presa do elefante é o instrumento de defesa e escavação do animal mais imponente; a peneira separa o joio do trigo.",
    deepMeaning: "Representa o desvelamento dos talentos e forças internas valiosas que não podem ser subjugados. A peneira e a água purificadora simbolizam a filtragem das impressões para revelar a essência moral.",
  },
  "Uttara Ashadha": {
    symbolTitle: "As Pranchas de uma Cama",
    physicalMeaning: "As pranchas de uma cama austera e simples, desprovida de adornos ou colchões macios.",
    deepMeaning: "Simboliza o repouso consciente, o desapego do luxo material e o recolhimento solitário. Representa a vitória sobre os desejos inferiores e o foco na estabilidade e na responsabilidade com as leis universais.",
  },
  Shravana: {
    symbolTitle: "A Orelha e as Três Pegadas",
    physicalMeaning: "A orelha é o órgão da audição; as três pegadas simbolizam a conquista dos três planos da existência.",
    deepMeaning: "A orelha simboliza a recepção do conhecimento sagrado através da escuta atenta (Shravanam), do silêncio e da sabedoria oral. As três pegadas representam a submissão do ego à ordem divina através da humildade.",
  },
  Dhanishta: {
    symbolTitle: "O Tambor (Damaru) e a Flauta",
    physicalMeaning: "O tambor e a flauta são instrumentos ocos por dentro que necessitam de ar/impacto para produzir som.",
    deepMeaning: "O vazio interno simboliza a necessidade de esvaziar a mente do orgulho e do ego para que a ressonância da música e dos ritmos universais flua através do indivíduo, gerando abundância e harmonia coletiva.",
  },
  Shatabhisha: {
    symbolTitle: "As Cem Estrelas e a Flor de Mil Pétalas",
    physicalMeaning: "As cem estrelas são os olhos observadores do cosmos; a flor de mil pétalas é o chakra da coroa; o círculo é o espaço delimitado.",
    deepMeaning: "As estrelas simbolizam os curadores silenciosos que observam o karma humano. O círculo delimita o espaço sagrado de reclusão e proteção necessário para a cura e o florescimento da consciência superior.",
  },
  "Purva Bhadrapada": {
    symbolTitle: "A Espada",
    physicalMeaning: "A espada é o instrumento de corte duplo e afiado, usado tanto para ataque quanto para defesa.",
    deepMeaning: "Simboliza o discernimento radical que corta os nós do passado, as restrições kármicas e os apegos ao ego. Representa a coragem de travar a batalha interior e lutar por causas universais.",
  },
  "Uttara Bhadrapada": {
    symbolTitle: "Os Gêmeos e a Serpente das Profundezas",
    physicalMeaning: "Os gêmeos representam o par complementar; a serpente do fundo do mar simboliza a sabedoria guardada nas águas profundas.",
    deepMeaning: "Os gêmeos simbolizam a pacificação das polaridades (mente/espírito, luz/sombra). A serpente das profundezas representa a sabedoria oculta guardada no subconsciente, trazendo paciência e dissolução do ego.",
  },
  Revati: {
    symbolTitle: "O Peixe Nadando na Água",
    physicalMeaning: "O peixe totalmente submerso e em livre movimento no oceano.",
    deepMeaning: "O peixe imerso na água simboliza a alma que se funde harmoniosamente no mar da consciência universal no final do zodíaco. Representa a nutrição espiritual, a compaixão sem limites e a capacidade de nadar livremente entre dimensões até alcançar a libertação (Moksha).",
  },
};

export function getNakshatraSymbolMeaning(name: string): NakshatraSymbolMeaning | null {
  return NAKSHATRA_SYMBOL_MEANINGS[name] ?? null;
}
