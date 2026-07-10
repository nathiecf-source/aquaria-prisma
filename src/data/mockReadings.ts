export interface ReadingData {
  id: string;
  title: string;
  energySubtitle: string;
  anchorPhrase: string;
  evolutionaryTension: string;
  integration: string;
  trap: string;
  gift: string;
  astrologicalSource: string;
  fonte_astrologica?: string;
  isHouseReading?: boolean;
  isVetorReading?: boolean;
  vetorTitle?: string;
  vetorAnalysis?: string;
  vetorScore?: number;
  vetorCategory?: string;
  vetorType?: "domínio" | "desenvolvimento";
  isMoonReading?: boolean;
  moonBirthPhase?: string;
  moonBirthTitle?: string;
  moonBirthAnalysis?: string;
  moonGlossary?: Array<{ phase: string; description: string }>;
  tropical?: {
    resumo_basico: string;
    leitura_psicologica: string;
  };
  vedic?: {
    leitura_karmica: string;
    qualidades_e_drishtis: string;
  };
  sintese?: {
    pedido_integracao: string;
    tensao_evolucionaria: string;
    integracao: string;
    armadilha: string;
    dom: string;
  };
}

export const mockReadings: Record<string, ReadingData> = {
  "caminho-assimilacao": {
    id: "caminho-assimilacao",
    title: "Caminho da Assimilação",
    energySubtitle: "Pedido de integração: A Portadora da Chama ⚡ A Artesã da Argila",
    anchorPhrase: "A RECEPÇÃO CONSCIENTE DAS CORRENTES CÓSMICAS E INFLUXOS DA ALMA",
    evolutionaryTension: "A resistência interna ao novo e a sobrecarga mental de conceitos abstratos não digeridos pela experiência viva.",
    integration: "Alquimia entre a mente abstrata superior e a estabilidade da presença terrena, ancorando visões em estruturas concretas.",
    trap: "O acúmulo infinito de conhecimento teórico como mecanismo de defesa contra o sentir e o agir no plano real.",
    gift: "Transmissão límpida de sabedoria oculta através de insights práticos e transformadores para o coletivo.",
    astrologicalSource: "Vértice de Assimilação • Triângulo Primordial de Integração Terrestre"
  },
  "caminho-transformacao": {
    id: "caminho-transformacao",
    title: "Caminho da Transformação",
    energySubtitle: "Dinâmica de Transmutação: O Guardião do Abismo 🔥 A Fênix Solar",
    anchorPhrase: "A DISSOLUÇÃO DO VELHO E A RECONSTRUÇÃO DA ESSÊNCIA EM ALTA FREQUÊNCIA",
    evolutionaryTension: "O apego às identidades ultrapassadas e o medo visceral de perder o controle diante das crises inevitáveis da alma.",
    integration: "A entrega consciente à morte simbólica de padrões de escassez, permitindo o nascimento de uma soberania espiritual.",
    trap: "Criar crises artificiais ou drama emocional para se sentir vivo, evitando o silêncio e o vazio fértil da real cura.",
    gift: "Capacidade inabalável de regeneração pessoal e facilitação de processos profundos de cura na vida de outras pessoas.",
    astrologicalSource: "Vértice de Transformação • Diretriz de Transmutação e Renascimento"
  },
  "caminho-manifestacao": {
    id: "caminho-manifestacao",
    title: "Caminho da Manifestação",
    energySubtitle: "Foco de Ancoragem: A Arquiteta dos Sonhos 🛠️ O Canal Material",
    anchorPhrase: "A MATERIALIZAÇÃO DAS INTENÇÕES ESPIRITUAIS ATRAVÉS DA AÇÃO ALINHADA",
    evolutionaryTension: "A frustração em tentar manifestar através da força do ego, gerando cansaço, escassez ou dispersão de energia.",
    integration: "Sincronização entre a intenção sutil e a paciência com o tempo da matéria, agindo como um canal puro de cocriação.",
    trap: "A pressa ansiosa que destrói a semente antes do broto, ou a inércia fantasiada de 'espera pelo momento ideal'.",
    gift: "Habilidade de traduzir conceitos abstratos em projetos reais, prósperos e duradouros que servem ao bem comum.",
    astrologicalSource: "Vértice de Manifestação • Eixo de Realização e Coesão Material"
  },
  "eixo-mc": {
    id: "eixo-mc",
    title: "Meio do Céu (MC)",
    energySubtitle: "Diretriz de Propósito: A Estrela Guia 🏛️ A Soberania Pública",
    anchorPhrase: "A EXPRESSÃO MÁXIMA DA SUA AUTORIDADE ESPIRITUAL E REALIZAÇÃO NO MUNDO",
    evolutionaryTension: "A síndrome do impostor combinada com a busca incessante por aprovação externa e status social vazio.",
    integration: "Assumir a liderança natural e a responsabilidade social sem se corromper pelo orgulho ou pelo medo do julgamento público.",
    trap: "Confundir prestígio exterior com valor de alma, sacrificando a verdade íntima no altar da validação alheia.",
    gift: "Uma presença magnética que inspira os outros a trilharem seus próprios caminhos de excelência e contribuição social.",
    astrologicalSource: "Zênite Celestial • Cúspide da Casa 10 • Eixo da Realização Concreta"
  },
  "eixo-ic": {
    id: "eixo-ic",
    title: "Fundo do Céu (IC)",
    energySubtitle: "Raízes de Sustentação: O Santuário Interno 🌊 As Águas Ancestrais",
    anchorPhrase: "A SEGURANÇA INTERNA QUE FLUI DA SUA CONEXÃO COM O SAGRADO E AS ORIGENS",
    evolutionaryTension: "Feridas familiares profundas não curadas que geram uma sensação contínua de desamparo ou isolamento emocional.",
    integration: "A construção de um lar interno inabalável, honrando a ancestralidade e curando o passado para nutrir o futuro.",
    trap: "Esconder-se no casulo emocional, utilizando o recolhimento como fuga dos desafios de manifestação externa.",
    gift: "Uma imensa sabedoria intuitiva e capacidade de acolhimento, servindo de base emocional segura para si e para os outros.",
    astrologicalSource: "Nadir Celestial • Cúspide da Casa 4 • Fundamentos da Alma"
  },
  "eixo-asc": {
    id: "eixo-asc",
    title: "Ascendente (ASC)",
    energySubtitle: "O Portal do Eu: O Guerreiro da Presença 👁️ O Amanhecer da Essência",
    anchorPhrase: "A LENTE ATRAVÉS DA QUAL VOCÊ SE AFIRMA E INICIA SUA JORNADA DE EVOLUÇÃO",
    evolutionaryTension: "A distorção da própria identidade para caber nas expectativas alheias, resultando em perda de vitalidade e autossabotagem.",
    integration: "A coragem de habitar a própria pele com absoluta autenticidade, expressando o propósito único com espontaneidade.",
    trap: "O egoísmo defensivo ou a pressa em agir antes de se centrar na verdade intrínseca do coração.",
    gift: "Uma força vital magnética e pioneira que abre caminhos inexplorados e desperta a coragem ao seu redor.",
    astrologicalSource: "Horizonte Oriental • Cúspide da Casa 1 • Estilo de Expressão Individual"
  },
  "eixo-dsc": {
    id: "eixo-dsc",
    title: "Descendente (DSC)",
    energySubtitle: "O Espelho do Outro: A Dança Sagrada 🤝 A Alquimia das Relações",
    anchorPhrase: "A RECONEXÃO COM PARTES OCULTAS DE SI MESMO ATRAVÉS DO ENCONTRO VERDADEIRO",
    evolutionaryTension: "A projeção de suas próprias sombras e poderes não assumidos nos parceiros, gerando dinâmicas de dependência ou conflito.",
    integration: "A arte de se relacionar em parceria sagrada, onde o 'eu' e o 'outro' se unem sem perder a respectiva individualidade.",
    trap: "Tolerar dinâmicas abusivas ou anular-se pelo medo do abandono, buscando no outro a completude que só existe dentro.",
    gift: "Habilidade de criar harmonia profunda, mediação pacífica e conexões de alma baseadas na verdade e no crescimento mútuo.",
    astrologicalSource: "Horizonte Ocidental • Cúspide da Casa 7 • Alquimia Relacional"
  },
  "casa-1": {
    id: "casa-1",
    title: "Casa 1 • Identidade",
    energySubtitle: "Diretriz de Autoafirmação: A Centelha da Consciência",
    anchorPhrase: "EU SOU: A DESCOBERTA E EXPRESSÃO DA INDIVIDUALIDADE PURA",
    evolutionaryTension: "A hesitação em brilhar por medo de desagradar, ou a agressividade reativa de um ego desintegrado.",
    integration: "Expressão espontânea do self que convida os outros a também assumirem seu espaço soberano.",
    trap: "A armadilha da vaidade intelectual ou da identificação excessiva com a persona externa.",
    gift: "Originalidade inabalável e impulso criador que dá início a grandes ciclos evolutivos.",
    astrologicalSource: "Setor 1 • Fogo • O Impulso de Ser"
  },
  "casa-2": {
    id: "casa-2",
    title: "Casa 2 • Recursos",
    energySubtitle: "Diretriz de Sustentação: O Pomar da Alma",
    anchorPhrase: "EU TENHO: A CONSTRUÇÃO DE VALOR REAL E ESTABILIDADE INTERNA",
    evolutionaryTension: "Ansiedade material sistemática baseada em uma ferida profunda de não merecimento espiritual.",
    integration: "Reconhecimento de que a abundância exterior é um reflexo direto da autoestima e dos talentos interiores partilhados.",
    trap: "O acúmulo compulsivo de posses ou ideias para tentar preencher um vazio existencial abstrato.",
    gift: "A sabedoria de manifestar recursos abundantes e de ensinar a arte da simplicidade e da estabilidade orgânica.",
    astrologicalSource: "Setor 2 • Terra • Consolidação de Valores"
  },
  "casa-3": {
    id: "casa-3",
    title: "Casa 3 • Comunicação",
    energySubtitle: "Diretriz de Conexão: O Tecedor de Redes",
    anchorPhrase: "EU PENSO: A TRADUÇÃO DA MENTE SUPERIOR EM PALAVRAS CONCRETAS",
    evolutionaryTension: "Dispersão mental, fofocas intelectuais ou uso da palavra para manipular e criar distorções na realidade.",
    integration: "Comunicação compassiva e clara que serve como ponte de luz para integrar ideias distantes.",
    trap: "A tagarelice mental acelerada que impede a escuta ativa do silêncio interior.",
    gift: "Uma inteligência viva e articulada, capaz de traduzir verdades complexas de maneira acessível e inspiradora.",
    astrologicalSource: "Setor 3 • Ar • O Intercâmbio Mental"
  },
  "casa-4": {
    id: "casa-4",
    title: "Casa 4 • Origem",
    energySubtitle: "Diretriz de Acolhimento: O Útero Cósmico",
    anchorPhrase: "EU SINTO: O RETORNO AO LAR INTERNO E À CONEXÃO ANCESTRAL",
    evolutionaryTension: "Vulnerabilidade desprotegida ou couraças rígidas erguidas contra as dores emocionais do passado.",
    integration: "Acolhimento de todas as suas águas e sentimentos, tornando-se o seu próprio pai e mãe espiritual.",
    trap: "Utilizar o sentimentalismo ou os laços de dependência familiar para evitar o crescimento no mundo.",
    gift: "Uma nutrição emocional profunda e intuição pura que oferece segurança para as almas ao redor.",
    astrologicalSource: "Setor 4 • Água • Raízes do Ser"
  },
  "casa-5": {
    id: "casa-5",
    title: "Casa 5 • Expressão",
    energySubtitle: "Diretriz de Criação: O Brilho do Coração",
    anchorPhrase: "EU CRIO: O JOGO DIVINO DA MANIFESTAÇÃO INDIVIDUAL",
    evolutionaryTension: "O medo do palco ou a necessidade infantil de aplausos constantes para sustentar um ego frágil.",
    integration: "Criar pelo puro prazer de manifestar a beleza divina, agindo como um canal livre de arte e amor.",
    trap: "A dramatização excessiva da vida pessoal para capturar a atenção alheia a qualquer custo.",
    gift: "Um magnetismo solar contagiante, generosidade artística e a capacidade de despertar o riso e a leveza.",
    astrologicalSource: "Setor 5 • Fogo • O Brilho Criativo"
  },
  "casa-6": {
    id: "casa-6",
    title: "Casa 6 • Alinhamento",
    energySubtitle: "Diretriz de Aprimoramento: O Templo do Cotidiano",
    anchorPhrase: "EU SIRVO: A CONSAGRAÇÃO DO TRABALHO E DA SAÚDE INTEGRAL",
    evolutionaryTension: "O perfeccionismo autopunitivo e a somatização no corpo físico decorrente de ansiedades não resolvidas.",
    integration: "A sintonização diária das rotinas corporais e mentais com o propósito de servir com humildade e excelência.",
    trap: "Ocupar-se com minúcias e rotinas estéreis para evitar olhar para as grandes transformações necessárias.",
    gift: "Discernimento cirúrgico, maestria na cura do corpo e da mente, e dedicação amorosa ao bem-estar prático.",
    astrologicalSource: "Setor 6 • Terra • Ecologia Pessoal"
  },
  "casa-7": {
    id: "casa-7",
    title: "Casa 7 • Parceria",
    energySubtitle: "Diretriz de Alteridade: O Espelho Sagrado",
    anchorPhrase: "EU ME RELACIONO: O RECONHECIMENTO DE SI NO REFLEXO DO OUTRO",
    evolutionaryTension: "Codependência emocional profunda ou evitação sistemática do compromisso relacional real.",
    integration: "A arte do encontro igualitário, onde dois indivíduos inteiros criam uma terceira força evolutiva de amor.",
    trap: "Mudar a própria verdade para agradar o parceiro, gerando ressentimentos mudos a longo prazo.",
    gift: "Grande diplomacia, beleza estética nas relações e a sabedoria para guiar outros na harmonia de convivência.",
    astrologicalSource: "Setor 7 • Ar • O Encontro de Almas"
  },
  "casa-8": {
    id: "casa-8",
    title: "Casa 8 • Alquimia",
    energySubtitle: "Diretriz de Transmutação: O Caldeirão Oculto",
    anchorPhrase: "EU TRANSMUTO: A UNIÃO PROFUNDA E A DISSOLUÇÃO DAS ILUSÕES",
    evolutionaryTension: "Lutas de poder ocultas, repressão da energia vital e segredos destrutivos guardados por orgulho.",
    integration: "Entrega total aos processos de morte simbólica e ressurreição, dominando os mistérios do invisível.",
    trap: "A obsessão pelo controle psicológico e financeiro sobre as outras pessoas ou situações.",
    gift: "Uma coragem extrema para encarar as sombras e uma habilidade inata de guiar transições dolorosas em paz.",
    astrologicalSource: "Setor 8 • Água • Crises e Renascimentos"
  },
  "casa-9": {
    id: "casa-9",
    title: "Casa 9 • Expansão",
    energySubtitle: "Diretriz de Sabedoria: O Peregrino das Estrelas",
    anchorPhrase: "EU COMPREENDO: A BUSCA POR SIGNIFICADO E SÍNTESE DA VIDA",
    evolutionaryTension: "O dogmatismo intelectual ou espiritual, julgando os outros a partir de uma suposta superioridade moral.",
    integration: "Acolhimento da verdade contida em todos os caminhos, vivendo a vida como uma perpétua aventura de aprendizado.",
    trap: "Fugir da realidade prática cotidiana através de ilusões místicas ou otimismo infundado.",
    gift: "Uma visão ampla, espírito livre de aventuras intelectuais e capacidade de professar ensinamentos sublimes com alegria.",
    astrologicalSource: "Setor 9 • Fogo • A Grande Jornada"
  },
  "casa-10": {
    id: "casa-10",
    title: "Casa 10 • Realização",
    energySubtitle: "Diretriz de Estrutura: A Montanha Soberana",
    anchorPhrase: "EU REALIZO: A ANCORAGEM DA SUA MISSÃO DE ALMA NO MUNDO",
    evolutionaryTension: "Viver sob a tirania do dever e da cobrança social, esquecendo a doçura e as reais aspirações do coração.",
    integration: "Erguer estruturas duradouras que servem ao coletivo, exercendo a autoridade com compaixão e sabedoria cósmica.",
    trap: "Usar a dedicação profissional obsessiva como fuga de vazios e dores emocionais íntimas.",
    gift: "Uma integridade inabalável, resiliência granítica e liderança visionária que edifica novas realidades.",
    astrologicalSource: "Setor 10 • Terra • Destino Público"
  },
  "casa-11": {
    id: "casa-11",
    title: "Casa 11 • Coletivo",
    energySubtitle: "Diretriz de Redes: A Colmeia do Futuro",
    anchorPhrase: "EU COOPERO: A SINTONIZAÇÃO COM A FRATERNIDADE E A UTOPIA",
    evolutionaryTension: "O medo de ser rejeitado pelo grupo, gerando conformismo social, ou a rebeldia sem causa e destrutiva.",
    integration: "União com mentes afins para manifestar inovações tecnológicas e sociais que libertem e elevem a humanidade.",
    trap: "Perder-se em idealismos utópicos abstratos enquanto ignora a bondade nas relações cotidianas simples.",
    gift: "Inovação social revolucionária, amor fraternal universal e intuição genial para prever as tendências do amanhã.",
    astrologicalSource: "Setor 11 • Ar • Ideais Humanitários"
  },
  "casa-12": {
    id: "casa-12",
    title: "Casa 12 • Transcendência",
    energySubtitle: "Diretriz de Integração: O Oceano de Retorno",
    anchorPhrase: "EU ME RENDO: A REUNIÃO DA GOTA COM O TODO INFINITO",
    evolutionaryTension: "Sensação contínua de desajuste com o mundo material, recorrendo a escapismos ou vitimismo existencial.",
    integration: "Rendição mística do ego ao plano divino, experimentando o amor incondicional e a unidade com toda a vida.",
    trap: "A autossabotagem inconsciente e a idealização mística como desculpa para não lidar com as dores da realidade.",
    gift: "Uma compaixão cósmica ilimitada, dotes artísticos sublimes e acesso direto aos arquivos do inconsciente coletivo.",
    astrologicalSource: "Setor 12 • Água • Mistérios e Síntese"
  },
  "lua-crescente": {
    id: "lua-crescente",
    title: "Lua Quarto Crescente",
    energySubtitle: "Energia Dinâmica: O Impulso de Superação 🌱 O Desafio de Manifestar",
    anchorPhrase: "A TENSÃO SAGRADA QUE GERA O CRESCIMENTO E A RUPTURA COM O PASSADO",
    evolutionaryTension: "A inércia que puxa de volta para a zona de conforto conhecida e o medo de ousar novos rumos.",
    integration: "Canalizar a raiva criativa e o desconforto como combustível nobre para agir com determinação e foco.",
    trap: "O conflito estéril e discussões vazias decorrentes da impaciência com o ritmo natural de desenvolvimento.",
    gift: "Coragem heroica para romper obstáculos e força inquebrantável para iniciar e consolidar projetos desafiadores.",
    astrologicalSource: "Quadrante 4 • Fase de Ação e Luta Evolucionária"
  },
  "lua-cheia": {
    id: "lua-cheia",
    title: "Lua Cheia",
    energySubtitle: "Clímax da Consciência: O Espelho Radiante 🌕 A Revelação Total",
    anchorPhrase: "A LUZ DA MENTE SUPERIOR REVELANDO TODAS AS SOMBRAS E POTENCIAIS OCULTOS",
    evolutionaryTension: "A polarização extrema entre polos opostos (razão/emoção, eu/outro), gerando instabilidade ou histeria mental.",
    integration: "A síntese harmoniosa das polaridades, mantendo o coração centrado no observador calmo que abraça os opostos.",
    trap: "A busca dramática de emoções fortes e projeções excessivas sobre o ambiente e os outros.",
    gift: "Uma clareza mental luminosa, percepção aguçada de verdades sutis e magnetismo social inspirador.",
    astrologicalSource: "Oposição Sol-Lua • Fase de Iluminação e Colheita Psíquica"
  },
  "lua-minguante": {
    id: "lua-minguante",
    title: "Lua Quarto Minguante",
    energySubtitle: "Revisão e Sabedoria: A Anciã do Tempo 🍂 A Desconstrução Sagrada",
    anchorPhrase: "A LIBERAÇÃO CONSCIENTE DOS PADRÕES OBSOLETOS PARA A RECONSTRUÇÃO INTERNA",
    evolutionaryTension: "O apego mental a dogmas, arrependimentos antigos e estruturas de pensamento que já morreram.",
    integration: "O desapego elegante de culpas e expectativas, retirando a energia do palco externo para voltar-se ao templo íntimo.",
    trap: "A amargura, o cinismo ou a crítica excessiva em relação aos erros do mundo e de si mesmo.",
    gift: "Profunda sabedoria de síntese histórica, habilidade para aconselhar e uma clareza excepcional para finalizar ciclos.",
    astrologicalSource: "Fase de Reavaliação • O Retorno ao Centro Silencioso"
  },
  "lua-nova": {
    id: "lua-nova",
    title: "Lua Nova",
    energySubtitle: "Semente do Mistério: O Ventre do Escuro 🌑 O Início Sem Nome",
    anchorPhrase: "O VAZIO FÉRTIL REPLETO DE TODAS AS POSSIBILIDADES NÃO MANIFESTADAS",
    evolutionaryTension: "A desorientação ou a angústia diante da falta de respostas imediatas e caminhos claros.",
    integration: "Aprender a repousar no mistério sem pressa, escutando a intuição sutil que guia os primeiros passos no escuro.",
    trap: "A pressa ansiosa que faz agir impulsivamente por incapacidade de suportar a quietude do desconhecido.",
    gift: "Um poder extraordinário de renovação pura, frescor de espírito e originalidade selvagem sem amarras do passado.",
    astrologicalSource: "Conjunção Sol-Lua • Fase de Semeadura Psíquica e Intuição"
  },
  "petala-mutavel": {
    id: "petala-mutavel",
    title: "Qualidade Mutável",
    energySubtitle: "Diretriz de Adaptação: O Vento do Espírito 🌀 A Fluidez Evolutiva",
    anchorPhrase: "A CAPACIDADE DE ADAPTAÇÃO, SÍNTESE E TRANSMUTAÇÃO DAS CORRENTES DA VIDA",
    evolutionaryTension: "A dispersão extrema de forças, inconsistência de propósitos e a indecisão constante que paralisa a ação.",
    integration: "Unir a flexibilidade mental ao centramento ético e prático, permitindo mudar a rota sem perder a destinação.",
    trap: "A superficialidade camaleônica, adaptando-se tanto às situações a ponto de perder a própria identidade.",
    gift: "Uma inteligência dinâmica, empatia relacional imediata e facilidade natural de reconciliar opostos rígidos.",
    astrologicalSource: "Modalidade Mutável • Integração das Casas 3, 6, 9 e 12"
  },
  "petala-cardeal": {
    id: "petala-cardeal",
    title: "Qualidade Cardeal",
    energySubtitle: "Diretriz de Iniciativa: A Flecha do Pioneiro 🏹 O Impulso de Ignição",
    anchorPhrase: "A FORÇA DE IGNIÇÃO QUE ABRE CAMINHOS E EXECUTA NOVAS REALIDADES",
    evolutionaryTension: "A pressa destrutiva, autoritarismo impaciente e a tendência de começar muitos projetos e não terminar nenhum.",
    integration: "Harmonizar o ímpeto iniciador com o respeito ao tempo de maturação da realidade e à cooperação alheia.",
    trap: "A ilusão de que tudo depende do esforço muscular do ego, gerando estresse e exaustão espiritual.",
    gift: "Liderança nata, coragem de pioneiro para desbravar o desconhecido e grande vigor para erguer novos paradigmas.",
    astrologicalSource: "Modalidade Cardeal • Integração das Casas 1, 4, 7 e 10"
  },
  "petala-fixo": {
    id: "petala-fixo",
    title: "Qualidade Fixa",
    energySubtitle: "Diretriz de Consolidação: O Alicerce de Pedra 🏔️ A Estabilidade Cósmica",
    anchorPhrase: "A RESISTÊNCIA DE ANCORAGEM QUE CONSERVA, PROFUNDIZA E PROTEGE OS RECURSOS",
    evolutionaryTension: "Teimosia cega, apego excessivo ao controle e resistência rígida a qualquer tipo de mudança evolutiva.",
    integration: "Usar a formidável capacidade de foco para estruturar projetos sem cair na armadilha da estagnação orgânica.",
    trap: "O medo visceral de perdas materiais ou de identidade que faz reter padrões e sentimentos estagnados.",
    gift: "Fidelidade inquebrantável a propósitos de vida, paciência monumental e capacidade de gerar frutos perenes.",
    astrologicalSource: "Modalidade Fixa • Integração das Casas 2, 5, 8 e 11"
  },
  "petal-fire": {
    id: "petal-fire",
    title: "Pétala do Elemento Fogo",
    energySubtitle: "Espírito Divino: O Fogo da Inspiração 🔥 A Centelha Criadora",
    anchorPhrase: "A IGNIÇÃO CRIADORA, O ENTUSIASMO VITAL E A PAIXÃO ESPIRITUAL",
    evolutionaryTension: "Impulsividade cega, raiva destrutiva ou cansaço decorrente de um brilho ansioso que consome a si próprio.",
    integration: "Cultivar um entusiasmo sereno, agindo como um farol constante que aquece sem queimar nem cegar ninguém.",
    trap: "O orgulho egoico que busca sobressair e governar ao invés de servir de canal para a inspiração coletiva.",
    gift: "Uma alegria transbordante, carisma magnético irresistível e visão criativa para incendiar propósitos adormecidos.",
    astrologicalSource: "Elemento Fogo • Núcleo Central de Atividade e Vitalidade"
  },
  "petal-earth": {
    id: "petal-earth",
    title: "Pétala do Elemento Terra",
    energySubtitle: "Matéria Sagrada: A Catedral de Silício 🌍 O Toque Real",
    anchorPhrase: "O ANCORAMENTO PRÁTICO, A EXCELÊNCIA TÉCNICA E A MANIFESTAÇÃO DURADOURA",
    evolutionaryTension: "Materialismo cético, excesso de rigidez burocrática ou lentidão decorrente do medo de errar.",
    integration: "Reconhecer que toda a matéria é espírito densificado, agindo com sabedoria prática para espiritualizar a Terra.",
    trap: "O apego obsessivo a resultados mensuráveis e a segurança fictícia das rotinas sem alma.",
    gift: "Sensatez refinada, habilidade de organização impecável e capacidade incomparável de materializar visões elevadas.",
    astrologicalSource: "Elemento Terra • Núcleo Central de Sustentação e Realismo"
  },
  "petal-water": {
    id: "petal-water",
    title: "Pétala do Elemento Água",
    energySubtitle: "Fluxo Emocional: O Rio da Intuição 🌊 O Oceano Sagrado",
    anchorPhrase: "A COMPAIXÃO PURA, A LEITURA INTUITIVA DA REALIDADE E O SENTIR PROFUNDO",
    evolutionaryTension: "Hipersensibilidade defensiva, vitimismo de codependência ou tempestades emocionais silenciosas e recorrentes.",
    integration: "Tornar-se o recipiente sagrado e estável capaz de acolher os fluxos da alma sem se afogar na dor do mundo.",
    trap: "Manipulação emocional oculta através do silêncio ou da chantagem afetiva refinada.",
    gift: "Grande empatia mística, intuição brilhante para ler o invisível e uma imensa capacidade de cura pelo afeto puro.",
    astrologicalSource: "Elemento Água • Núcleo Central de Sentimento e Conexão Sutil"
  },
  "petal-air": {
    id: "petal-air",
    title: "Pétala do Elemento Ar",
    energySubtitle: "Mente Clara: A Brisa da Razão 💨 A Geometria do Pensamento",
    anchorPhrase: "A INTELIGÊNCIA VISIONÁRIA, O INTERCÂMBIO SOCIAL E A COMPREENSÃO DE PADRÕES",
    evolutionaryTension: "Frieza intelectual e distanciamento das necessidades emocionais básicas, vivendo apenas na cabeça.",
    integration: "Conectar o intelecto brilhante à sabedoria do coração, comunicando verdades que clareiam e libertam as mentes.",
    trap: "A tagarelice mental infinita e a racionalização excessiva usada para escapar de sentir dores reais.",
    gift: "Uma percepção genial de conexões e sistemas complexos, diplomacia natural e ideias revolucionárias para o futuro.",
    astrologicalSource: "Elemento Ar • Núcleo Central de Reflexão e Transmissão de Ideias"
  },
  "petal-core": {
    id: "petal-core",
    title: "O Núcleo Central",
    energySubtitle: "O Portal da Consciência Divina: O Ponto Zero 🌀 O Centro da Mandala",
    anchorPhrase: "O ESPAÇO DE SILÊNCIO E PLENITUDE ONDE TODAS AS FORÇAS SE EQUILIBRAM",
    evolutionaryTension: "A ilusão de separação cósmica que gera a sensação desesperadora de estar perdido no redemoinho da vida.",
    integration: "Descansar no silêncio do coração, testemunhando todas as dinâmicas astrológicas externas com serenidade divina.",
    trap: "Tentar controlar os ventos do destino através da força bruta do ego, gerando estagnação espiritual.",
    gift: "Uma paz interior inabalável, conexão direta com a fonte da criação e claridade de propósito existencial.",
    astrologicalSource: "Ponto Zero • Centro Geométrico Sagrado da Mandala"
  }
};

export function getReadingForId(id: string): ReadingData {
  if (mockReadings[id]) {
    return mockReadings[id];
  }
  
  // Default robust fallback so the application NEVER crashes
  return {
    id,
    title: id.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
    energySubtitle: "Conexão e Fluxo: Integração de Polaridades Ativas",
    anchorPhrase: "A DESCOBERTA DA GEOMETRIA INTERNA DA SUA JORNADA EVOLUTIVA",
    evolutionaryTension: "A desarmonia momentânea entre os polos da manifestação e a resistência a integrar novos conhecimentos práticos.",
    integration: "A síntese consciente de opostos sob a perspectiva da unidade primordial do ser.",
    trap: "A identificação parcial com apenas uma das facetas da sua energia cósmica.",
    gift: "A expressão autêntica e alinhada do potencial latente contido no centro do seu mapa de vida.",
    astrologicalSource: `Diretriz Técnica • Identificador de Sistema: ${id.toUpperCase()}`
  };
}
