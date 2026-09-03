/**
 * Glossário Cósmico fixo — definições curadas por termo astrológico.
 *
 * Cada definição segue o tom editorial da AQUAR.IA: arquétipo puro e isolado,
 * apontando brevemente a sombra e a virtude do princípio.
 *
 * O mapeamento usa os termos exibidos no ReadingPanel (ASTRO_TERMS). A busca
 * é normalizada (minúsculas, sem acentos) para tolerar pequenas variações.
 */

const GLOSSARY: Record<string, string> = {
  // Planetas
  "Sol":
    "O princípio da consciência central, identidade e vitalidade. Sua sombra é a egolatria e a necessidade de aplauso; sua virtude é a autenticidade luminosa e a liderança inspirada.",
  "Lua":
    "O princípio do sentir, da memória e da nutrição. Sua sombra é a dependência emocional e a reatividade; sua virtude é a receptividade madura e o cuidado genuíno.",
  "Mercúrio":
    "O princípio da mente, da comunicação e da percepção. Sua sombra é a inquietação, a dispersão e a manipulação verbal; sua virtude é o discernimento, a escuta e a expressão verdadeira.",
  "Vênus":
    "O princípio do prazer, da beleza e do relacionamento. Sua sombra é o apego, a validação externa e a indulgência; sua virtude é a harmonia, o amor incondicional e a estética elevada.",
  "Marte":
    "O princípio da ação, do desejo e da coragem. Sua sombra é a impulsividade, a agressão e a competição; sua virtude é a determinação, a proteção e a iniciativa consciente.",
  "Júpiter":
    "O princípio da expansão, da sabedoria e do significado. Sua sombra é o fanatismo, o exagero e a complacência; sua virtude é a generosidade, a fé e a visão integradora.",
  "Saturno":
    "O princípio estruturador da realidade e do tempo. Sua sombra é o medo, a rigidez e a sensação de escassez punitiva; sua virtude é a maestria, a disciplina e a autoridade interna firme.",
  "Urano":
    "O princípio da ruptura, da inovação e da liberdade. Sua sombra é a rebeldia dispersiva e a instabilidade; sua virtude é a originalidade, o despertar e a autonomia verdadeira.",
  "Netuno":
    "O princípio da dissolução, da imaginação e da transcendência. Sua sombra é a ilusão, a fuga e a confusão; sua virtude é a inspiração, a compaixão e a sensibilidade espiritual.",
  "Plutão":
    "O princípio da transformação, do poder e da regeneração. Sua sombra é a obsessão, o controle e a destruição; sua virtude é o empoderamento, a cura profunda e a renovação.",
  "Nodo Norte":
    "Ponto de evolução e direção de crescimento da alma. Sua sombra é a fuga do conforto conhecido; sua virtude é a coragem para integrar novas qualidades e expandir a consciência.",
  "Nodo Sul":
    "Ponto de familiaridade kármica e padrões automáticos. Sua sombra é a acomodação e a repetição do passado; sua virtude é oferecer os domínios naturais com consciência e generosidade.",
  "Rahu":
    "Sinônimo védico do Nodo Norte. Sua sombra é a insatisfação e a ambição desmedida; sua virtude é o despertar através do novo e da transcendência dos limites.",
  "Ketu":
    "Sinônimo védico do Nodo Sul. Sua sombra é o desapego excessivo e o isolamento; sua virtude é a entrega, a sabedoria interior e a liberação kármica.",

  // Signos
  "Áries":
    "A energia do impulso inicial, da ação e da autoafirmação. Sua sombra é a impaciência, o egocentrismo e a agressividade; sua virtude é a coragem, o pioneirismo e a liderança consciente.",
  "Touro":
    "A energia da sustentação, do prazer sensorial e da estabilidade. Sua sombra é a possessividade, a inércia e a teimosia; sua virtude é a paciência, a fidelidade e a geração de abundância.",
  "Gêmeos":
    "A energia da curiosidade, da comunicação e da dualidade. Sua sombra é a inconstância, a superficialidade e a ansiedade mental; sua virtude é a versatilidade, o aprendizado e a conexão.",
  "Câncer":
    "A energia do pertencimento, da proteção e da memória emocional. Sua sombra é a retração, a dependência e a posse afetiva; sua virtude é a nutrição, a sensibilidade e o cuidado genuíno.",
  "Leão":
    "A energia da expressão, da criatividade e do reconhecimento. Sua sombra é a vaidade, a dramatização e a necessidade de aplauso; sua virtude é a generosidade, a criatividade e a liderança inspiradora.",
  "Virgem":
    "A energia da análise, do serviço e do aperfeiçoamento. Sua sombra é a crítica excessiva, a ansiedade e o perfeccionismo; sua virtude é o discernimento, a utilidade e a humildade.",
  "Libra":
    "A energia do equilíbrio, do relacionamento e da estética. Sua sombra é a indecisão, o agradar e a evitação de conflitos; sua virtude é a justiça, a harmonia e a parceria consciente.",
  "Escorpião":
    "A energia da profundidade, da transformação e da intensidade. Sua sombra é o ciúme, o controle e a obsessão; sua virtude é a coragem para renascer, a intimidade e o poder curativo.",
  "Sagitário":
    "A energia da expansão, da busca de sentido e da liberdade. Sua sombra é o dogmatismo, a inquietação e o exagero; sua virtude é o otimismo, a sabedoria e a visão ampla.",
  "Capricórnio":
    "A energia da escalada, da responsabilidade e da realização. Sua sombra é a rigidez, a ambição fria e o pessimismo; sua virtude é a integridade, a disciplina e a maestria no mundo.",
  "Aquário":
    "A energia da inovação, da coletividade e da originalidade. Sua sombra é o distanciamento, o radicalismo e a frieza; sua virtude é o humanitarismo, a autenticidade e a visão futurista.",
  "Peixes":
    "A energia da dissolução, da compaixão e da transcendência. Sua sombra é a fuga, a confusão e o autossacrifício; sua virtude é a inspiração, a empatia e a fé na vida.",

  // Casas
  "Casa 1":
    "O portal da encarnação e a máscara do ego, também chamado de Lagna ou Ascendente. Sua sombra é a vaidade e a identificação cega com a própria imagem; sua virtude é a coragem de assumir a própria autenticidade.",
  "Casa 2":
    "O território de recursos, valores e autoestima. Sua sombra é o materialismo, a posse e a segurança cega; sua virtude é a autovalorização e a geração sustentável.",
  "Casa 3":
    "O campo da comunicação, da mente local e dos irmãos. Sua sombra é a dispersão, a fofoca e a competição mental; sua virtude é a curiosidade direcionada e o diálogo verdadeiro.",
  "Casa 4":
    "O domínio do lar, das raízes, da emoção e do pertencimento. Sua sombra é a acomodação, a nostalgia doentia e a dependência; sua virtude é a construção de um interior seguro.",
  "Casa 5":
    "O espaço da criatividade, do prazer, dos filhos e da autoexpressão. Sua sombra é a egolatria, a dramatização e a busca de validação; sua virtude é a expressão genuína e a alegria criativa.",
  "Casa 6":
    "A esfera da saúde, da rotina, do trabalho e do serviço. Sua sombra é a vitimização, a ansiedade e o controle do corpo; sua virtude é a disciplina, a cura e o serviço consciente.",
  "Casa 7":
    "O campo dos relacionamentos, das parcerias e do outro como espelho. Sua sombra é a projeção, a codependência e a perda de si; sua virtude é a parceria como caminho de integração.",
  "Casa 8":
    "O território da transformação, das crises e do poder compartilhado. Sua sombra é a obsessão, os segredos e o medo da morte; sua virtude é a regeneração, a intimidade e a alquimia interior.",
  "Casa 9":
    "A esfera do sentido, da expansão, das crenças e do destino. Sua sombra é o dogmatismo, a arrogância e a fuga pela filosofia; sua virtude é a sabedoria, a fé e a visão inspiradora.",
  "Casa 10":
    "O campo da carreira, da missão pública e da realização no mundo. Sua sombra é a ambição desmedida, o status e a negligência do interior; sua virtude é a responsabilidade, o propósito e a liderança.",
  "Casa 11":
    "A esfera da comunidade, das amizades e dos projetos futuros. Sua sombra é o conformismo, a idealização e a dispersão social; sua virtude é a colaboração, a visão coletiva e a irmandade.",
  "Casa 12":
    "O domínio do inconsciente, da espiritualidade e da renúncia. Sua sombra é a fuga, o isolamento e a autossabotagem; sua virtude é a entrega, a compaixão e a conexão com o sagrado.",

  // Pontos e eixos
  "Ascendente":
    "Ponto leste do nascimento; representa a máscara, o corpo e a abordagem à vida. Sua sombra é a identificação com a persona; sua virtude é a autenticidade na presença.",
  "Meio do Céu":
    "Ponto mais alto do mapa; indica carreira, legado e posição social. Sua sombra é a busca de status; sua virtude é a realização do propósito no mundo.",
  "Fundo do Céu":
    "Ponto mais baixo do mapa; simboliza raízes, lar e fundação emocional. Sua sombra é o aprisionamento ao passado; sua virtude é nutrir as origens com consciência.",
  "Descendente":
    "Ponto oeste do horizonte; indica relacionamentos e o outro como espelho. Sua sombra é a projeção e a dependência; sua virtude é o relacionamento como caminho de integração.",
  "Dusthanas":
    "As casas 6, 8 e 12, ligadas a desafios, cura e dissolução. Sua sombra é a vitimização e o medo; sua virtude é a transformação através da adversidade.",

  // Termos védicos
  "Atmakaraka":
    "O planeta que indica o desejo raiz desta vida. Sua sombra é ser arrastado pelas repetições cármicas deste planeta; sua virtude é transformá-lo no mestre que guia a libertação.",
  "Amatyakaraka":
    "O planeta da carreira e da autoridade social. Sua sombra é a ambição sem propósito; sua virtude é a liderança e a realização alinhadas ao dharma.",
  "Darakaraka":
    "O planeta do parceiro e do relacionamento. Sua sombra é a projeção no outro; sua virtude é o amor como caminho de autoconhecimento.",
  "Janma Nakshatra":
    "A constelação natal da Lua; marca a mente e os padrões emocionais. Sua sombra é o apego às impressões; sua virtude é a consciência dos impulsos kármicos.",
  "Nakshatra":
    "Constelação lunar védica que refina o temperamento e a mente. Sua sombra é a repetição de padrões; sua virtude é a integração das qualidades lunares.",
  "Upapada Lagna":
    "Ponto védico dos relacionamentos e da parceria. Sua sombra é as ilusões afetivas; sua virtude é a clareza sobre o outro e o compromisso maduro.",
  "Dhana Yogas":
    "Combinações astrológicas de riqueza e prosperidade. Sua sombra é a ganância; sua virtude é a abundância compartilhada e sustentável.",
  "D10 Dasamsa":
    "Mapa divisional védico da carreira e da missão social. Sua sombra é o sucesso vazio; sua virtude é o propósito expresso no mundo.",
  "Lagna":
    "O Ascendente védico; ponto de nascimento e da personalidade manifestada. Sua sombra é a identificação com o corpo; sua virtude é a consciência do verdadeiro Self.",
  "Lagnesha":
    "O regente do Ascendente (Lagna). Sua sombra são as defesas do ego; sua virtude é o direcionamento consciente da vontade pessoal.",

  // Nakshatras
  "Ashvini":
    "A constelação do impulso curativo e da velocidade. Sua sombra é a impaciência e a precipitação; sua virtude é a iniciação, a cura e o movimento consciente.",
  "Bharani":
    "A constelação do útero cósmico e da transformação. Sua sombra é a posse, o drama e a intensidade excessiva; sua virtude é a sustentação, a criatividade e a aceitação dos ciclos.",
  "Krittika":
    "A constelação do fogo purificador e do discernimento. Sua sombra é o julgamento, a raiva e a severidade; sua virtude é a clareza, a coragem e a transformação pela verdade.",
  "Rohini":
    "A constelação da fertilidade, da beleza e do crescimento. Sua sombra é o apego, a possessividade e a indulgência; sua virtude é a criação, a nutrição e o magnetismo elevado.",
  "Mrigashira":
    "A constelação da busca, da curiosidade e da inquietação. Sua sombra é a dispersão, a indecisão e a fuga; sua virtude é a exploração consciente, a comunicação e a sutileza.",
  "Ardra":
    "A constelação da tempestade, da intensidade e da renovação. Sua sombra é a agitação, a crise e o sofrimento mental; sua virtude é a resiliência, a cura profunda e a transformação.",
  "Punarvasu":
    "A constelação do retorno à luz, da renovação e da esperança. Sua sombra é a repetição de erros e a nostalgia; sua virtude é a restauração, a generosidade e a fé.",
  "Pushya":
    "A constelação do cuidado, da nutrição e da expansão. Sua sombra é o controle mascarado de bondade e a dependência; sua virtude é a proteção, a sabedoria e a generosidade.",
  "Ashlesha":
    "A constelação da serpente, do mistério e da penetração. Sua sombra é a manipulação, o ciúme e o veneno; sua virtude é a sabedoria oculta, a cura e o poder de transformação.",
  "Magha":
    "A constelação da realeza, da ancestralidade e do poder. Sua sombra é o orgulho, o apego ao passado e o autoritarismo; sua virtude é a honra, a lealdade e a conexão com a linhagem.",
  "Purva Phalguni":
    "A constelação do prazer, do romance e da criatividade. Sua sombra é a indulgência, a vaidade e a evasão; sua virtude é o amor generoso, a arte e a fertilidade.",
  "Uttara Phalguni":
    "A constelação do amor maduro, da estabilidade e do dharma. Sua sombra é a rigidez moral e a complacência; sua virtude é o compromisso, a generosidade e a verdade social.",
  "Hasta":
    "A constelação da habilidade manual, da expressão e da sutileza. Sua sombra é a manipulação, o perfeccionismo e a ansiedade; sua virtude é a destreza, a comunicação e a manifestação consciente.",
  "Chitra":
    "A constelação do artesão, da beleza e do brilho. Sua sombra é a superficialidade, a sedução e a ilusão; sua virtude é a criatividade estruturada, a elegância e a visão.",
  "Swati":
    "A constelação do vento, da independência e da adaptação. Sua sombra é a inconstância, o isolamento e a teimosia; sua virtude é a autonomia, a resiliência e o sopro renovador.",
  "Vishakha":
    "A constelação do propósito, da ambição e do foco. Sua sombra é a obsessão, a competição e a impaciência; sua virtude é a determinação, a liderança e a conquista ética.",
  "Anuradha":
    "A constelação da devoção, da amizade e da cooperação. Sua sombra é a dependência emocional e a submissão; sua virtude é a lealdade, a empatia e a realização através do outro.",
  "Jyeshtha":
    "A constelação da maturidade, da autoridade e da proteção. Sua sombra é o controle, a arrogância e o medo da perda; sua virtude é a sabedoria, a responsabilidade e a liderança protetora.",
  "Mula":
    "A constelação da raiz, da destruição e do renascimento. Sua sombra é o caos, a autodestruição e o fanatismo; sua virtude é a coragem para desenterrar a verdade e reconstruir.",
  "Purva Ashadha":
    "A constelação do poder invicto, do charme e da persuasão. Sua sombra é a arrogância, a manipulação e a fuga; sua virtude é a determinação, a retórica e a conquista consciente.",
  "Uttara Ashadha":
    "A constelação da vitória final, da perseverança e do dharma. Sua sombra é a rigidez e a autossuficiência; sua virtude é a paciência, a honra e a realização duradoura.",
  "Shravana":
    "A constelação da audição, do aprendizado e da transmissão. Sua sombra é a passividade, a credulidade e a obsessão por detalhes; sua virtude é a escuta ativa, a sabedoria e a comunicação sagrada.",
  "Dhanishta":
    "A constelação da abundância, do ritmo e da fama. Sua sombra é a competição, o materialismo e o isolamento; sua virtude é a generosidade, a música e a prosperidade compartilhada.",
  "Shatabhisha":
    "A constelação da cura, do mistério e da verdade oculta. Sua sombra é a frieza, os segredos e o distanciamento; sua virtude é a cura coletiva, a intuição e a revelação.",
  "Purva Bhadrapada":
    "A constelação do fogo penitente, do idealismo e da transformação. Sua sombra é o fanatismo, o autossacrifício e a rigidez; sua virtude é a dedicação espiritual, a coragem e a renúncia.",
  "Uttara Bhadrapada":
    "A constelação da sabedoria final, da estabilidade e da compaixão. Sua sombra é a passividade, a acomodação e a complacência; sua virtude é a paciência, a entrega e a proteção universal.",
  "Revati":
    "A constelação da proteção, do cuidado e da jornada segura. Sua sombra é a dependência, a evasão e o apego ao conforto; sua virtude é a compaixão, a nutrição e a guia amorosa.",
};

function normalizeTerm(term: string): string {
  return term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const NORMALIZED_GLOSSARY: Record<string, string> = Object.entries(GLOSSARY).reduce(
  (acc, [term, definition]) => {
    acc[normalizeTerm(term)] = definition;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Retorna a definição fixa de um termo astrológico, ou null se o termo
 * não estiver catalogado. A busca ignora acentos e capitalização.
 */
export function getGlossaryDefinition(term: string): string | null {
  return NORMALIZED_GLOSSARY[normalizeTerm(term)] ?? null;
}
