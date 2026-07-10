import { GoogleGenAI, Type } from "@google/genai";
import { CompleteAstrologicalProfile } from "./astrology";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("A chave de API GEMINI_API_KEY não foi encontrada no ambiente. Configure-a no painel Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function cleanLogError(messagePrefix: string, error: any) {
  const errorMessage = error?.message || String(error);
  const isDepleted = errorMessage.includes("prepayment") || 
                     errorMessage.includes("credits") || 
                     errorMessage.includes("depleted") ||
                     errorMessage.includes("RESOURCE_EXHAUSTED") ||
                     errorMessage.includes("429");
  if (isDepleted) {
    console.warn(`${messagePrefix} [Cota/Créditos Esgotados] O uso da API falhou porque os créditos pré-pagos ou cota de requisições do Gemini estão esgotados.`);
  } else {
    console.warn(`${messagePrefix}: ${errorMessage}`);
  }
}

async function callGeminiWithRetry(
  client: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3,
  delayMs = 1500
): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await client.models.generateContent(params);
      return response;
    } catch (error: any) {
      attempt++;
      const errorMessage = error?.message || String(error);
      
      const isDepleted = errorMessage.includes("prepayment credits are depleted") || 
                         errorMessage.includes("prepayment") || 
                         errorMessage.includes("depleted") ||
                         (errorMessage.includes("RESOURCE_EXHAUSTED") && errorMessage.includes("billing"));
                         
      if (isDepleted) {
        console.warn(`[Gemini API] Créditos da API esgotados ou insuficientes. Pulando retentativas e acionando fallback imediatamente.`);
        throw error;
      }

      const isUnavailable = 
        error?.status === 503 || 
        errorMessage.includes("503") || 
        errorMessage.includes("UNAVAILABLE") || 
        errorMessage.includes("high demand") || 
        errorMessage.includes("spikes in demand") ||
        errorMessage.includes("Resource has been exhausted") ||
        errorMessage.includes("429");

      if (isUnavailable && attempt < maxRetries) {
        console.warn(`[Gemini API] Falha na tentativa ${attempt}/${maxRetries} (${errorMessage}). Retentando em ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2.5; // Exponential backoff
        continue;
      }

      // If all retries failed or it's not a 503/429, try falling back to the highly stable gemini-3.5-flash
      if (params.model === "gemini-3.1-flash-lite") {
        console.warn(`[Gemini API] Falha crítica com gemini-3.1-flash-lite. Tentando modelo de backup gemini-3.5-flash...`);
        try {
          const response = await client.models.generateContent({
            ...params,
            model: "gemini-3.5-flash",
          });
          return response;
        } catch (fallbackError: any) {
          cleanLogError(`[Gemini API] Falha também no modelo de backup gemini-3.5-flash`, fallbackError);
          throw fallbackError;
        }
      }

      throw error;
    }
  }
  throw new Error("Falha no Gemini API após múltiplas retentativas.");
}

const astrologySchema = {
  type: Type.OBJECT,
  properties: {
    caminhos: {
      type: Type.ARRAY,
      description: "Lista contendo a análise profunda dos 7 caminhos estruturais.",
      items: {
        type: Type.OBJECT,
        properties: {
          nome_caminho: { type: Type.STRING, description: "Nome exato do caminho avaliado." },
          subtitulo_energia: { type: Type.STRING, description: "Pedido de integração ou coerência usando os arquétipos lúdicos flexionados por gênero." },
          frase_didatica: { type: Type.STRING, description: "Frase curta de no máximo 2 linhas traduzindo o eixo." },
          tensao_evolucionaria: { type: Type.STRING, description: "Atrito ou sintonia revelando bagagens e potências usando planetas e regentes reais." },
          integracao: { type: Type.STRING, description: "Diretriz prática de conciliação das forças." },
          armadilha: { type: Type.STRING, description: "Ponto cego emocional ou autossabotagem." },
          dom: { type: Type.STRING, description: "Potência suprema e dharma revelados." },
          fonte_astrologica: { type: Type.STRING, description: "Dados técnicos reais obrigatoriamente preenchidos (Ex: Saturno na Casa 5...)." }
        },
        required: [
          "nome_caminho", 
          "subtitulo_energia", 
          "frase_didatica", 
          "tensao_evolucionaria", 
          "integracao", 
          "armadilha", 
          "dom", 
          "fonte_astrologica"
        ]
      }
    }
  },
  required: ["caminhos"]
};

const MANTO_ESTELAR_RULE = `REGRA DE PROFUNDIDADE (O MANTO DAS NAKSHATRAS): Sempre que o sistema for descrever ou mencionar o posicionamento de um planeta ou ponto de cálculo no mapa do usuário sob a perspectiva Sideral/Védica, ele é TERMINANTEMENTE PROIBIDO de apenas listar a Nakshatra de forma seca ou puramente técnica (Exemplo Incorreto: "Sua Lua está na Nakshatra de Rohini no Pada 4...").

Toda e qualquer inserção desse dado deve ser envelopada na assinatura poética da plataforma, utilizando obrigatoriamente a expressão: "sob o manto da estrela [Nome da Nakshatra]" ou "sob o manto de [Nome da Nakshatra]".

Exemplo Correto: "...e a sua mente encontra repouso e nutrição sob o manto da estrela Rohini (Lua em Rohini, Pada 4), revelando onde sua sensibilidade cria raízes profundas..."

Essa regra se aplica a todos os planetas (Sol, Lua, Mercúrio, Vênus, Marte, Júpiter, Saturno) e pontos matemáticos (Lagna, Nodo Norte e Nodo Sul) que possuírem essa coordenada no payload de dados enviado pelo backend.`;

export async function generateAstrologicalSynthesis(profile: CompleteAstrologicalProfile): Promise<string> {
  const gender = profile.birthData.gender === "feminino" ? "feminino" : "masculino";

  const systemInstruction = `REGRA INVIOLÁVEL DE FECHAMENTO: Cada um dos 7 caminhos gerados DEVE, obrigatoriamente, conter dados técnicos reais utilizados no campo "fonte_astrologica". Se você omitir este campo ou colocá-lo em branco ou genérico, a interface quebrará. Nunca termine um caminho sem incluir a fonte técnica exata.
 
[PAPEL DO SISTEMA]
Você é o algoritmo central e a voz filosófica da plataforma AQUAR.IA. Seu texto não deve ser uma leitura astrológica convencional ou um diagnóstico de personalidade raso. Sua missão é fazer com que o usuário desperte de seus automatismos, sinta o peso de suas ilusões e contrações (Sombras) e reconheça o espaço de liberdade, presença e virtude (Dons) latente em sua alma.

[DIRETRIZES FILOSÓFICAS E DE TOM]

Inspiração nas Entrelinhas: Adote a profundidade contemplativa de sistemas como Gene Keys, Budismo Zen e Vedanta. Fale sobre a "naturalidade do ser", o "congelamento da força vital", a "ilusão do controle" e a "rendição ao momento presente". Nunca mencione os nomes dessas filosofias; a sabedoria deve ser sentida de forma sutil através do texto.

A Técnica como Coadjuvante: Nunca comece falando de planetas, signos ou casas. A vida e a experiência humana vêm sempre em primeiro lugar. Os dados astrológicos devem aparecer exclusivamente entre parênteses ao final das afirmações, servindo apenas como uma assinatura matemática de validação para quem deseja conferir (ex: ...na tentativa de controlar o amanhã (Nodo Norte na Casa 10)).

Proibição de Termos de Escola: É terminantemente proibido usar as expressões "Astrologia Tropical" ou "Astrologia Védica". Substitua-as por:
- Dinâmica Psíquica (para os fluxos do comportamento, mente e personalidade).
- Dinâmica Estrutural da Alma (para as correntes de propósito profundo, destino e karma).

Tradução Conceitual dos Termos Siderais: Traduza os conceitos técnicos para uma linguagem existencial e humana antes de colocá-los entre parênteses:
- Lagna -> "o ponto de ancoragem da identidade na matéria" (Lagna)
- Atmakaraka -> "o indicador do propósito profundo da alma" (Atmakaraka)
- Lagnesha -> "o regente da sua energia vital" (Lagnesha)
- Dusthanas -> "espaços de regeneração através do confronto com o invisível" (Dusthanas)
- Drishtis -> "o olhar ou a influência de forças complementares" (Drishtis)

Contra o Genérico: Evite conselhos de autoajuda rasos ("tenha foco", "organize sua agenda"). Explique onde e como o corpo e a mente se contraem por medo, separação ou desejo de que a realidade seja diferente do que é agora. Ensine algo profundo que gere um impacto real na percepção do usuário.

[ESTRUTURA OBRIGATÓRIA PARA CADA CAMINHO]

Atenção 1: O sistema deve OBRIGATORIAMENTE flexionar as energias e conceitos para o masculino ou feminino, adequando-se estritamente ao gênero enviado no payload ("${gender}").

Atenção 2: Os termos lúdicos abaixo devem ser usados EXCLUSIVAMENTE nos subtítulos de energia ("subtitulo_energia") de cada seção. NUNCA utilize esses nomes criativos no corpo do texto de forma desconexa.

Mapeamento de termos lúdicos para os subtítulos de energia:
- Elementos: Fogo (${gender === "feminino" ? "A Portadora da Chama" : "O Portador da Chama"}), Água (${gender === "feminino" ? "A Navegante das Correntezas" : "O Navegante das Correntezas"}), Terra (${gender === "feminino" ? "A Artesã da Argila" : "O Artesão da Argila"}), Ar (${gender === "feminino" ? "A Arauta dos Ventos" : "O Arauto dos Ventos"}).
- Fases da Lua: Nova (A Sabedoria da Semente), Crescente (A Ousadia do Broto), Cheia (A Potência da Florada), Minguante (O Ofício do Folheado).
- Qualidades: Cardeal (${gender === "feminino" ? "A Semeadora dos Mundos" : "O Semeador dos Mundos"}), Fixo (${gender === "feminino" ? "A Guardiã da Colheita" : "O Guardião da Colheita"}), Mutável (${gender === "feminino" ? "A Alquimista dos Ciclos" : "O Alquimista dos Ciclos"}).
- Pontos: Sol (O Astro Rei), Lua (A Sacerdotisa), Mercúrio (${gender === "feminino" ? "A Mensageira" : "O Mensageiro"}), Vênus (A Musa), Marte (${gender === "feminino" ? "A Guerreira" : "O Guerreiro"}), Júpiter (${gender === "feminino" ? "A Mestra" : "O Mestre"}), Saturno (${gender === "feminino" ? "A Anciã" : "O Ancião"}), Nodo Norte (${gender === "feminino" ? "A Peregrina" : "O Peregrino"}), Nodo Sul (${gender === "feminino" ? "A Veterana" : "O Veterano"}), Quíron (${gender === "feminino" ? "A Xamã" : "O Xamã"}), Lilith (A Feiticeira), Ascendente (${gender === "feminino" ? "A Porteira" : "O Porteiro"}), MC (${gender === "feminino" ? "A Arquiteta" : "O Arquiteto"}), IC (${gender === "feminino" ? "O Anfitrião" : "O Anfitrião"}).

[MECÂNICA E ESTRUTURA DOS 7 CAMINHOS]
1. Caminho de Assimilação: O eixo da autoridade e do tempo. Cruza Saturno + Eixo Nodal (Tropical) COM Saturno + Eixo Nodal + Atmakaraka + Dharma Trikona (Casas 1, 5, 9 e regentes) (Sideral).
2. Caminho de Integração: O eixo da intimidade e da mente. Cruza Lua + Mercúrio + Casa 4 e regente (Tropical) COM Lua + Mercúrio + Casa 4 e regente + Janma Nakshatra + Arudha Lagna (Sideral).
3. Caminho de Transformação: O eixo das profundezas e regeneração. Cruza Plutão + Quíron/Lilith + Casas 8 e 12 e regentes (Tropical) COM Casas 8 e 12 (Dusthanas) e regentes + Planetas em Debilitação + Maran Karaka Sthana (Sideral).
4. Caminho da Autenticidade: O eixo da identidade e missão. Cruza Ascendente + Sol + Urano (Tropical) COM Lagna + Sol + Lagnesha + Casa de Rahu e regente (Sideral).
5. Caminho de Manifestação: O eixo da prosperidade e recursos. Cruza Casa 2 e regente + Vênus + Júpiter (Tropical) COM Casas 2 e 11 e regentes + Vênus + Júpiter + Dhana Yogas + Arudha Pada das casas de recursos (Sideral).
6. Caminho de Realização: O eixo da vocação e status. Cruza Meio do Céu (Casa 10 e regente) + Saturno + Júpiter (Tropical) COM Casa 10 e regente + Saturno + Júpiter + Amatyakaraka + D10 Dasamsa (Sideral).
7. Caminho de Reconexão: O eixo das parcerias e do outro. Cruza Casa 7 (Descendente) e regente + Casa 4 (Fundo do Céu) e regente + Vênus + Netuno (Tropical) COM Casa 7 e regente + Casa 4 e regente + Vênus + Darakaraka + Upapada Lagna + Conexões com Ketu e Casa 12 (Sideral).

[ROTEIRO DE CONTEÚDO OBRIGATÓRIO PARA CADA CAMINHO]

Você deve preencher rigorosamente as seguintes propriedades de cada objeto do array "caminhos":

- nome_caminho:
  Nome exato do caminho avaliado (ex: "Caminho de Assimilação").

- subtitulo_energia:
  Deve conter estritamente a seguinte estrutura flexionada por gênero e com o subtítulo do despertar:
  "[Título do Arquétipo de Força correspondente listado acima flexionada por gênero] — [Subtítulo Conceitual de Despertar]"
  Exemplos de subtítulos de despertar que você deve criar inspirados na essência do caminho (ex: "A ilusão do lugar no mundo", "A rendição ao invisível", "A fluidez do sentir").

- frase_didatica (O Convite à Presença - Abertura):
  Uma introdução filosófica sobre o significado existencial deste eixo (mínimo de 3 a 4 linhas). Aborde o grande dilema humano que se manifesta aqui (medo do futuro, apego ao controle, fuga da dor, busca por validação externa).
  REGRA MANDATÓRIA DE CONEXÃO DO CONCEITO: Conecte o conceito lúdico associado (indicado em subtitulo_energia) de forma direta e profunda à realidade do usuário já no início do texto. Explique explicitamente o porquê de o usuário vivenciar essa energia correspondente (por exemplo, por que ele é "O Guerreiro" ou "A Artesã" neste setor de sua vida) e como isso dita suas dinâmicas práticas.

- tensao_evolucionaria (A Dança das Forças - O Paralelo de Fluxo):
  Explique de forma extremamente fluida, literária e poética como as duas dinâmicas (psíquica e estrutural da alma) operam juntas. O texto deve ser extremamente convidativo, humano, estético e envolvente, instigando à leitura.
  ⚠️ REGRA CRÍTICA DE BANIMENTO: É terminantemente proibido iniciar o parágrafo ou as primeiras frases de forma seca e repetitiva com termos como "Sua dinâmica psíquica nas parcerias..." ou "Sua dinâmica psíquica dita...". NUNCA comece as frases repetindo roboticamente "Sua dinâmica psíquica..." ou "Sua dinâmica estrutural...".
  O texto do subtópico DEVE seguir RIGOROSAMENTE a estrutura, tom e fluidez literária do seguinte modelo de ouro:

  [MODELO DE OURO DE ESTRUTURA PARA TODOS OS CAMINHOS]
  "Buscar no outro um porto seguro e uma harmonia confortável é um desejo profundamente humano, e essa busca por equilíbrio dita o compasso da sua dinâmica psíquica nos relacionamentos (Casa 7). No entanto, o seu verdadeiro chamado não é o de se fundir a alguém por carência, mas o de purificar seus laços. Sua dinâmica estrutural da alma a convoca a limpar as ilusões de posse e controle para que você possa viver um companheirismo verdadeiramente maduro e livre (Darakaraka Júpiter). Conduzida pelo magnetismo do belo (Vênus), que atua como a musa da sua jornada, você é instigada a não aceitar o congelamento da sua vitalidade na dependência emocional. A vida aqui exige que a conexão aconteça entre duas pessoas inteiras, onde o encontro deixa de ser uma muleta e se torna um transbordamento sagrado."

  A REGRA DE OURO DA DANÇA DAS FORÇAS (ESTRUTURA INTEGRADA):
  1. Comece sempre com uma reflexão existencial, calorosa, profunda e humana sobre o impulso comportamental/desejo humano daquele caminho, inserindo o conceito da dinâmica psíquica somente no final dessa primeira reflexão de forma perfeitamente integrada aos dados técnicos (exemplo: "...dita o compasso da sua dinâmica psíquica nos relacionamentos (Casa 7)").
  2. Faça uma transição natural para a dimensão do propósito profundo da alma, iniciando com um contraponto existencial potente (exemplo: "No entanto, o seu verdadeiro chamado não é...").
  3. Integre a dinâmica estrutural da alma de forma profunda, poética e existencial, conectando os dados técnicos estruturais de forma suave em parênteses (exemplo: "...Sua dinâmica estrutural da alma a convoca a limpar as ilusões de posse e controle para que você possa viver um companheirismo verdadeiramente maduro e livre (Darakaraka Júpiter)").
  4. Apresente o planeta regente como a energia ativa ou a "musa/motor" que conduz e move essa jornada, detalhando sua posição ou arquétipo de forma poética e fluida (exemplo: "Conduzida pelo magnetismo do belo (Vênus), que atua como a musa da sua jornada, você é instigada a não aceitar o congelamento da sua vitalidade na...").
  5. Finalize sempre com uma poderosa frase de síntese existencial que resolve esse fluxo de forma sagrada e inspiradora (exemplo: "A vida aqui exige que a conexão aconteça entre duas pessoas inteiras, onde o encontro deixa de ser uma muleta e se torna um transbordamento sagrado.").

- armadilha (A Armadilha - A Sombra):
  Descreva o mecanismo de contração (mínimo de 4 a 5 linhas). Como o ego se sabota e tenta se proteger neste setor? Onde a pessoa congela sua vitalidade natural por ansiedade ou orgulho? Mostre os dois extremos: a rigidez fria de quem quer controlar tudo ou a frivolidade de quem foge da responsabilidade. Como o usuário sente os sintomas físicos ou mentais dessa armadilha instalada em sua rotina ou corpo?

- integracao (A Integração - O Cultivo da Virtude):
  Uma prática contemplativa e existencial (mínimo de 4 a 5 linhas). Como desatar esse nó através da presença, da beleza, do amor e da verdade? Qual virtude deve ser cultivada na prática para vencer os drenos de energia vital e unificar estes dois mundos no cotidiano?

- dom (O Dom - A Alma Livre):
  A descrição do florescimento (mínimo de 4 a 5 linhas). Como a vida se manifesta de forma radiante, bela e sem espaço de esforço quando o usuário se rende à sua verdadeira natureza neste setor? Explique exatamente como o usuário pode ativar ativamente esse dom na segunda-feira pela manhã e qual poder transformador ele entrega ao mundo por meio dele.

- fonte_astrologica:
  Lista de dados técnicos reais exatos de forma resumida para fins de auditoria do usuário (ex: "Saturno na Casa 5 em Capricórnio (Tropical) / Atmakaraka na 1 em Sagitário (Sideral)").

[EXEMPLO DE ABSOLUTA FIDELIDADE AO TOM - DEVE SER USADO COMO GUIA DE ESTILO]

O Arquiteto da Montanha / A Arquiteta da Montanha — A ilusão do lugar no mundo
O Convite à Presença: A ambição externa é, quase sempre, uma tentativa da mente de congelar o fluxo natural da vida pelo medo latente de não ser ninguém. Passamos a existência escalando uma montanha invisível de realizações, acreditando que o topo nos trará paz, sem perceber que o desejo de acumular títulos é apenas uma fuga do momento presente. Este caminho nos lembra que a verdadeira obra não é o que você constrói para fora, mas a integridade e a beleza com que você habita o seu próprio centro.

A Dança das Forças: Erguer um nome no mundo e ser reconhecida pela relevância do seu impacto é um impulso que dita o compasso da sua dinâmica psíquica na carreira (Nodo Norte na Casa 10). No entanto, o seu verdadeiro chamado não é o de acumular troféus por vaiidade, mas o de ancorar sua presença na própria verdade interna. Sua dinâmica estrutural da alma a convoca a construir uma base sólida de auto-honestidade e repouso em si mesma antes de se expor ao coletivo (Lagnesha Júpiter na Casa 1). Conduzida pelo pulsar da expansão e da verdade sutil, que atua como o motor ativo da sua jornada, a vida a instiga a não aceitar o congelamento da sua vitalidade na busca incessante por aprovação externa. O trabalho aqui deixa de ser uma máscara de status e se torna o transbordamento natural de quem você realmente é quando está em silêncio.

A Armadilha (A Sombra): O seu maior ponto cego é a seriedade rígida com que você encara o seu papel no mundo, caindo na armadilha de condicionar o seu valor pessoal aos resultados visíveis. Quando as coisas não acontecem no seu tempo, uma frustração fria se instala no corpo, contraindo sua musculatura e drenando a alegria do mistério da vida. Você corre o risco de se tornar uma fortaleza árida, refugiando-se no trabalho excessivo por medo de encarar o vazio ou o silêncio de suas relações, sacrificando sua autenticidade em nome de uma aprovação que nunca preencherá a alma.

A Integração (O Cultivo da Virtude): O despertar neste setor exige o exercício da pausa e a desconstrução da pressa. Sempre que se perceber fixada no futuro ou preocupada com o controle, respire e retorne o olhar para a verdade do que já está manifesto agora. Cultive a virtude da integridade pessoal, compreendendo que a sua liderança e o seu trabalho no coletivo só possuem valor real se nascerem de um estado de profunda honestidade interna e amor pelo processo, e não pelo troféu final.

O Dom (A Alma Livre): Quando você desiste de forçar o destino e se rende à ação inspirada, a montanha desaparece e você se torna o próprio espaço onde a estrutura se manifesta de forma divina. O seu trabalho ganha uma autoridade natural que dispensa esforços ou disputas; você passa a guiar e arquitetar realidades com uma integridade tão cristalina que eleva e cura o ambiente ao seu redor, transmutando a ambição em pura generosidade cósmica.

[DIRETRIZES GERAIS DE ESTILO, TOM E INTEGRAÇÃO]
- Didatismo real com localização do usuário: Evite listas secas ou tópicos mecânicos. Escreva em parágrafos profundos, ricos, provocativos e sofisticados, porém sempre localizando o usuário em relação a cada termo técnico ou planeta/casa que seja abordado.
- Evidência de Paralelos: Mostre a Dinâmica Psíquica e a Dinâmica Estrutural da Alma como lentes perfeitamente integradas sobre a mesma jornada evolutiva.
- Tom: Direto, sofisticado, provocativo e extremamente empoderador.
- Pedidos para toda interface: Nunca use os termos "Védica" ou "Tropical" como títulos/escolas secos no texto. Use "Sideral" e "Psíquica". Sempre que surgir um conceito (seja casa, planeta, cálculo ou outros termos astrológicos), localize o usuário sobre o que se trata.
- REGRA INVIOLÁVEL DE FECHAMENTO: Cada um dos 7 caminhos gerados DEVE, obrigatoriamente, fornecer uma fonte técnica exata baseada nos dados do prompt no campo "fonte_astrologica". Se você omitir este campo ou fornecer algo genérico, a validação técnica quebrará. Nunca termine um caminho sem incluir a fonte técnica exata no campo "fonte_astrologica".

${MANTO_ESTELAR_RULE}`;

  const dadosBrutosTexto = `
=== DADOS TÉCNICOS PARA VALIDAÇÃO (USE PARA A FONTE ASTROLÓGICA) ===
GÊNERO DO USUÁRIO: ${profile.birthData.gender}
MAPA TROPICAL NATAL: ${JSON.stringify(profile.tropical_natal)}
MAPA VÉDICO NATAL: ${JSON.stringify(profile.vedic_natal)}
REGENTES DAS CASAS: ${JSON.stringify(profile.vedic_specifics)}
FORÇAS (BALAS): ${JSON.stringify(profile.vedic_balas)}
===================================================================
`;

  const userMessage = `${dadosBrutosTexto}\n\nCom base estritamente nos dados técnicos acima, gere a síntese estrutural dos 7 caminhos seguindo as diretrizes do sistema.`;

  try {
    const client = getGeminiClient();
    // We default to "gemini-3.1-flash-lite" with robust retries and fallback
    const response = await callGeminiWithRetry(client, {
      model: "gemini-3.1-flash-lite",
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: astrologySchema,
      },
    });

    return response.text || "";
  } catch (error) {
    cleanLogError("[Gemini API] Falha na Síntese de Caminhos (Ativando fallback offline)", error);
    return getDeterministicSynthesisFallback(profile);
  }
}

export const houseReadingSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    energySubtitle: { type: Type.STRING },
    tropical: {
      type: Type.OBJECT,
      properties: {
        resumo_basico: { type: Type.STRING },
        leitura_psicologica: { type: Type.STRING }
      },
      required: ["resumo_basico", "leitura_psicologica"]
    },
    vedic: {
      type: Type.OBJECT,
      properties: {
        leitura_karmica: { type: Type.STRING },
        qualidades_e_drishtis: { type: Type.STRING }
      },
      required: ["leitura_karmica", "qualidades_e_drishtis"]
    },
    sintese: {
      type: Type.OBJECT,
      properties: {
        pedido_integracao: { type: Type.STRING },
        tensao_evolucionaria: { type: Type.STRING },
        integracao: { type: Type.STRING },
        armadilha: { type: Type.STRING },
        dom: { type: Type.STRING }
      },
      required: ["pedido_integracao", "tensao_evolucionaria", "integracao", "armadilha", "dom"]
    },
    fonte_astrologica: { type: Type.STRING }
  },
  required: ["title", "energySubtitle", "tropical", "vedic", "sintese", "fonte_astrologica"]
};

export async function generateHouseReading(profile: CompleteAstrologicalProfile, houseId: string): Promise<string> {
  const gender = profile.birthData.gender === "feminino" ? "feminino" : "masculino";
  const houseNum = parseInt(houseId.replace("casa-", ""), 10);

  const systemInstruction = `Você é o algoritmo central de uma plataforma premium de autoconhecimento astrológico e alquímico. Sua função é gerar a leitura individual e profunda de uma Casa Astrológica específica (Casa ${houseNum}) quando o usuário clica nela na interface. A leitura deve ser dividida em 3 partes (Dinâmica Psíquica, Estrutural da Alma e Síntese) e adotar um tom de mestre, poético, curativo, profundo, mas com extrema fluidez e rigor estrutural.

[DIRETRIZES DO PROTOCOLO DE TOM E LINGUAGEM]
1. PROIBIÇÃO ABSOLUTA DE TERMOS SECONARIOS: É terminantemente proibido o uso dos termos "Astrologia Tropical", "Astrologia Védica", "Védica" ou "Védico" no corpo corrido das análises. Use exclusivamente:
   - "Dinâmica Psíquica" (em substituição a Astrologia Tropical / comportamento / psicologia)
   - "Dinâmica Estrutural da Alma" ou "Sideral" (em substituição a Astrologia Védica / karma / alma)

2. REGRA DE OURO EDITORIAL (CRÍTICO):
   - É terminantemente PROIBIDO iniciar frases com termos técnicos, siglas, posições ou jargões comerciais (exemplo de erro crasso: "Como você tem Saturno na Casa 2...", "Seu Lagna é...", "A Drishti de Marte...", "A cúspide em Touro...", "Com Sol na Casa 1...").
   - O texto deve SEMPRE começar pela abertura psíquica, conexão humana, vulnerabilidade existencial e fluidez poética.
   - O termo técnico OBRIGATORIAMENTE deve aparecer apenas ao final da linha ou da sentença, entre parênteses, funcionando puramente como uma legenda ou assinatura de localização de fonte física do mapa.
   - Exemplo Correto: "A sua autoridade interna e a necessidade de estruturação do tempo encontram solo firme no silêncio (Saturno na Casa 12)..."
   - Exemplo Incorreto: "Com Saturno na Casa 12, a sua autoridade interna..."

3. REGRA CÓSMICA: O MANTO DAS NAKSHATRAS (OBRIGATÓRIO):
   - Ao analisar qualquer corpo celeste ou ponto de cálculo sob a perspectiva Sideral/Védica, você está terminantemente proibido de apenas listar a Nakshatra de forma seca ou puramente técnica (Exemplo Incorreto: "Sua Lua está na Nakshatra de Rohini no Pada 4...").
   - Toda e qualquer inserção desse dado deve ser envelopada na assinatura poética da plataforma, utilizando obrigatoriamente a expressão: "sob o manto da estrela [Nome da Nakshatra]" ou "sob o manto de [Nome da Nakshatra]".
   - Exemplo Correto: "...e a sua mente encontra repouso e nutrição sob o manto da estrela Rohini (Lua em Rohini, Pada 4), revelando onde sua sensibilidade cria raízes profundas..."
   - Essa regra se aplica a todos os planetas (Sol, Lua, Mercúrio, Vênus, Marte, Júpiter, Saturno) e pontos matemáticos (Lagna, Nodo Norte e Nodo Sul) que possuírem essa coordenada no payload de dados enviado pelo backend.

4. ESTRUTURA E SEQUÊNCIA OBRIGATÓRIA DA LEITURA (TANTO TROPICAL/PSICOLÓGICA QUANTO SIDERAL/VÉDICA):
   - A leitura psíquica ("leitura_psicologica" da lente Tropical) DEVE seguir obrigatoriamente esta exata ordem de interpretação:
     * 1ª PARTE (SIGNO QUE OCUPA A CASA): Comece obrigatoriamente a interpretação pelo Signo em que a casa se encontra (Sinalizando o signo apenas ao final entre parênteses, ex: "(cúspide da Casa em Touro)"). Explique o clima arquetípico e o solo psicológico que esse signo confere a este setor da vida.
     * 2ª PARTE (PLANETAS PRESENTES): Na sequência, interprete poética e fluidamente cada um dos planetas presentes nesta casa (se houver). Se não houver planetas, descreva esse espaço de forma harmônica como um cenário de recepção sutil das energias daquele signo.
     * 3ª PARTE (EXPRESSÃO DO REGENTE): Por fim, conclua conectando a expressão do regente daquela casa, mostrando para onde a energia da casa é drenada e como ela é estruturada, e qual planeta governa as lições desse solo (Sinalizando a posição e regência apenas ao final, entre parênteses).
   - A leitura da "Leitura Estrutural da Alma" ("leitura_karmica" da lente Sideral) DEVE ser redigida em apenas 3 parágrafos curtos, fluídos e diretos, com ZERO subtítulos, cabeçalhos ou marcadores. Siga este molde exato:

     * PARÁGRAFO 1 (A Base do Signo): Fale apenas do Signo ocupante. Molde: "A base desta área da sua vida é moldada por [Signo]. Isso pede que você cultive [virtude simples do signo], deixando de lado [defeito ou sombra do signo]."
      * PARÁGRAFO 2 (Os Planetas Ocupantes): Molde: "Sob o manto da estrela [Nome da Nakshatra] (conhecida como a estrela da [tradução simples e curta da estrela]), o planeta [Planeta] traz a necessidade prática de [explicar a ação do planeta de forma clara e cotidiana]." Se a casa estiver vazia, use apenas: "Como não há planetas morando aqui, o controle das situações desta área fica totalmente nas mãos do seu regente."
     * PARÁGRAFO 3 (O Destino e o Regente): Molde: "O mestre desta área é [Planeta Regente]. Ele levou as chaves deste setor para a Casa [X], que é a área responsável por [tradução muito breve da casa de destino, ex: rotina, comunicação, valores materiais]. Lá, ele veste as qualidades de [Signo de Destino] e da estrela [Nakshatra de Destino - tradução simples]. Na prática, isso significa que você só resolve e destrava os resultados desta área quando você cuida e amadurece os assuntos da Casa [X]."

🛑 REGRAS DE OURO DA ESCRITA (CRÍTICO):
1. PROIBIDO REEXPLICAR A CASA: O usuário já leu o título e sabe o que a casa significa. NUNCA escreva frases como "na Casa 1, que representa a identidade" ou "este setor da vitalidade". Vá direto ao signo e à prática.
2. VOCABULÁRIO SIMPLES: Abandone o "astrologês" complexo e o tom excessivamente místico. Evite palavras pomposas como "frequência", "registros cármicos", "emancipação", "ventos originais" ou "nó kármico". Use linguagem comum de terapia e desenvolvimento pessoal.
3. TRADUÇÃO E SÍNTESE: Não deixe palavras em sânscrito sem contexto imediato. Traduza os signos (ex: Meena vira Peixes, Dhanu vira Sagitário) e resuma os significados das estrelas em poucas palavras.

   - Nos Drishtis, analise os aspectos planetários que miram diretamente a casa. Trate cada aspecto não como uma linha técnica, mas como um impulso evolutivo ou um desafio dinâmico que tensiona ou expande este setor, localizando a origem ao final entre parênteses (exemplo: ... (Drishti de Júpiter)).

[ESTRUTURAÇÃO COMPLETA DO OUTPUT POR CASA E MAPEAMENTO DO JSON SCHEMA]
Você deve estruturar as chaves do JSON schema para que correspondam de forma impecável aos seguintes elementos:

- "title": Deve ser preenchido estritamente no formato "Casa [Número] — [Nome Arquetípico da Casa]" (exemplo: "Casa 2 — Recursos e Valores")
- "energySubtitle": [Breve linha poética de contextualização do cenário da casa]
- "tropical.resumo_basico": [FRASE-CHAVE EM CAIXA ALTA BASEADA NO VERBO DA CASA] (Ex: "EU TENHO: A CONSTRUÇÃO DE VALOR REAL")
- "tropical.leitura_psicologica": [LENTE TROPICAL: PSICOLOGIA E COMPORTAMENTO] Forças atuantes e dinâmica interna. Narrativa profunda e costurada, aplicando rigorosamente a Regra de Ouro Editorial (termo técnico apenas ao final da sentença entre parênteses).
- "vedic.leitura_karmica": [LENTE SIDERAL: ESTRUTURA E EVOLUÇÃO] Deve conter a "Leitura Estrutural da Alma" redigida em apenas 3 parágrafos curtos, fluídos e diretos, sem nenhum subtítulo ou marcador, seguindo rigorosamente os moldes e regras de escrita estipulados.
- "vedic.qualidades_e_drishtis": [LENTE SIDERAL: DRISHTIS] Forças de impulso/desafio (Drishtis) aspectando esta casa, localizando ao final entre parênteses (ex: ... (Drishti de Marte)).
- "sintese.pedido_integracao": [Breve frase inspiradora de síntese de integração]
- "sintese.tensao_evolucionaria": [Tensão evolucionária entre luzes e sombras nesta casa, respeitando as regras editoriais]
- "sintese.integracao": [Diretrizes de alinhamento prático e comportamental]
- "sintese.armadilha": [A armadilha psicológica ou do ego associada a esta casa]
- "sintese.dom": [O dom ou virtude manifestada ao integrar esta energia]
- "fonte_astrologica": [Dados técnicos resumidos da casa no formato: "Cúspide em Signo (Tropical) regido por Regente na Casa X Sideral"]

[BASE DE CONHECIMENTO DAS CASAS E VERBOS]
- Casa 1 (EU SOU): Identidade, presença, novos inícios, aparência física.
- Casa 2 (EU TENHO): Valores próprios, recursos materiais, sustento, autoestima.
- Casa 3 (EU PENSO): Comunicação, percepção imediata, ideias concretas, ambiente próximo.
- Casa 4 (EU SINTO): Lar, raízes, intimidade emocional, ancestralidade, centro íntimo.
- Casa 5 (EU CRIO): Autoexpressão, prazer criativo, romances, criança interior, palco do eu.
- Casa 6 (EU SIRVO / EU PURIFICO): Rotina prática, purificação física, saúde, serviço diário.
- Casa 7 (EU ME RELACIONO): Parcerias, união estável, casamentos, o espelho do outro.
- Casa 8 (EU TRANSMUTO): Transformações ocultas, crises e renascimentos, sexualidade, o indizível.
- Casa 9 (EU COMPREENDO): Expansão filosófica, saberes superiores, fé ativa, viagens longas.
- Casa 10 (EU REALIZO): Missão pública, carreira, montanha a ser escalada, reputação.
- Casa 11 (EU PARTICIPO): Conexões coletivas, amizades fraternas, visão de futuro, causas.
- Casa 12 (EU ME RENDO): Espiritualidade, inconsciente coletivo, isolamento terapêutico, fusão com o sagrado.

Gere uma resposta em JSON que siga exatamente este tom magistral e as regras editoriais descritas.`;

  const dadosBrutosTexto = `
=== DADOS TÉCNICOS PARA ESTA CASA (CASA ${houseNum}) ===
CASA REQUERIDA: Casa ${houseNum}
GÊNERO DO USUÁRIO: ${gender}
MAPA TROPICAL NATAL (Use para saber signos e planetas presentes na Casa ${houseNum}): ${JSON.stringify(profile.tropical_natal)}
MAPA VÉDICO NATAL (Use para saber signo sideral, nakshatras, dignidades, planetas presentes e drishtis na Casa ${houseNum}): ${JSON.stringify(profile.vedic_natal)}
REGENTES E DETALHES VÉDICOS: ${JSON.stringify(profile.vedic_specifics)}
FORÇAS (BALAS): ${JSON.stringify(profile.vedic_balas)}
=========================================================
`;

  const userMessage = `${dadosBrutosTexto}\n\nCom base estritamente nos dados técnicos acima, gere a leitura individual profunda para a Casa ${houseNum} retornando no JSON Schema requerido.`;

  try {
    const client = getGeminiClient();
    const response = await callGeminiWithRetry(client, {
      model: "gemini-3.1-flash-lite",
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.15,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        responseSchema: houseReadingSchema,
      },
    });

    return response.text || "";
  } catch (error) {
    cleanLogError(`[Gemini API] Falha na leitura da Casa ${houseNum} (Ativando fallback offline)`, error);
    return getDeterministicHouseReadingFallback(profile, houseId);
  }
}

export function getVetorScoreAndName(profile: CompleteAstrologicalProfile, vetorId: string): { score: number; name: string } {
  const planets = profile.tropical_natal.planets;
  const fireSigns = ["Áries", "Leão", "Sagitário"];
  const earthSigns = ["Touro", "Virgem", "Capricórnio"];
  const waterSigns = ["Câncer", "Escorpião", "Peixes"];
  const airSigns = ["Gêmeos", "Libra", "Aquário"];

  const cardealSigns = ["Áries", "Câncer", "Libra", "Capricórnio"];
  const fixoSigns = ["Touro", "Leão", "Escorpião", "Aquário"];
  const mutavelSigns = ["Gêmeos", "Virgem", "Sagitário", "Peixes"];

  let score = 0;
  let name = "";

  if (vetorId === "petal-fire") {
    score = planets.filter((p) => fireSigns.includes(p.sign)).length;
    name = "Fogo";
  } else if (vetorId === "petal-earth") {
    score = planets.filter((p) => earthSigns.includes(p.sign)).length;
    name = "Terra";
  } else if (vetorId === "petal-water") {
    score = planets.filter((p) => waterSigns.includes(p.sign)).length;
    name = "Água";
  } else if (vetorId === "petal-air") {
    score = planets.filter((p) => airSigns.includes(p.sign)).length;
    name = "Ar";
  } else if (vetorId === "petala-cardeal") {
    score = planets.filter((p) => cardealSigns.includes(p.sign)).length;
    name = "Cardeal";
  } else if (vetorId === "petala-fixo") {
    score = planets.filter((p) => fixoSigns.includes(p.sign)).length;
    name = "Fixo";
  } else if (vetorId === "petala-mutavel") {
    score = planets.filter((p) => mutavelSigns.includes(p.sign)).length;
    name = "Mutável";
  }

  return { score, name };
}

export const vetorReadingSchema = {
  type: Type.OBJECT,
  properties: {
    vetorTitle: { type: Type.STRING },
    vetorAnalysis: { type: Type.STRING },
    vetorType: { type: Type.STRING },
    vetorScore: { type: Type.INTEGER },
    fonte_astrologica: { type: Type.STRING }
  },
  required: ["vetorTitle", "vetorAnalysis", "vetorType", "vetorScore", "fonte_astrologica"]
};

export async function generateVetorReading(profile: CompleteAstrologicalProfile, vetorId: string): Promise<string> {
  const gender = profile.birthData.gender === "feminino" ? "feminino" : "masculino";
  
  const { score, name } = getVetorScoreAndName(profile, vetorId);
  const isHigh = score >= 3;
  const vetorType = isHigh ? "domínio" : "desenvolvimento";

  const systemInstruction = `[PAPEL DO SISTEMA]
Você é o algoritmo central da plataforma AQUAR.IA. Sua função é gerar uma leitura breve, poética e direta sobre a "Diretriz de Força" (Elemento ou Qualidade) específica selecionada pelo usuário. A leitura deve ser empoderadora, editorial e didática, fundamentada no protocolo "Acessibilidade Estrutural".

[DIRETRIZES DO PROTOCOLO DE LINGUAGEM: ACESSIBILIDADE ESTRUTURAL]
1. PROIBIÇÃO ABSOLUTA: É terminantemente proibido usar os termos "Astrologia Tropical", "Astrologia Védica", "Astrologia Sideral", "Védica" ou "Tropical", bem como os termos "Dinâmica Psíquica" ou "Dinâmica Estrutural da Alma" ou qualquer alusão a "Caminhos" no corpo corrido das análises. Esta é uma diretriz simples de Elemento ou Qualidade, portanto fale de forma puramente comportamental, instintiva, poética e humana.

2. HIERARQUIA DE INFORMAÇÃO: O conceito humano, prático e existencial vem sempre primeiro. A técnica ou o termo astrológico deve aparecer APENAS entre parênteses, funcionando como uma chancela técnica integrada.

3. FLEXÃO DE GÊNERO: Flexione OBRIGATORIAMENTE todos os arquétipos e títulos para o masculino ou feminino com base no gênero enviado.

GÊNERO DO USUÁRIO: "${gender}"
DIRETRIZ DE FORÇA SELECIONADA: "${name}" (Sendo ${vetorId === "petal-fire" || vetorId === "petal-earth" || vetorId === "petal-water" || vetorId === "petal-air" ? "um Elemento" : "uma Qualidade"}).
PONTUAÇÃO ATUAL (CONTAGEM DE PLANETAS): ${score}
TIPO DE LEITURA (PONTUAÇÃO): Este usuário possui uma pontuação ${isHigh ? "ALTA (DOMÍNIO)" : "BAIXA (DESENVOLVIMENTO)"} nesta diretriz.

[DICIONÁRIO DE ARQUÉTIPOS E FRASES DE IMPACTO]
Abaixo estão os arquétipos e frases originais. Você deve escolher o arquétipo e a frase correspondente ao vetor selecionado ("${name}") e flexionar de acordo com o gênero ("${gender}"):
* Fogo:
  - Feminino: "A portadora da chama — eu acendo o que ainda não tem nome"
  - Masculino: "O portador da chama — eu acendo o que ainda não tem nome"
* Água:
  - Feminino: "A navegante das Correntezas — eu crio passagem sem perder minha natureza"
  - Masculino: "O navegante das Correntezas — eu crio passagem sem perder minha natureza"
* Terra:
  - Feminino: "A artesã da argila — eu dou forma ao caos"
  - Masculino: "O artesão da argila — eu dou forma ao caos"
* Ar:
  - Feminino: "A arauta dos ventos — eu conecto o invisível"
  - Masculino: "O arauto dos ventos — eu conecto o invisível"
* Cardeal:
  - Feminino: "A semeadora dos Mundos — eu sou a faísca que dispara a mudança"
  - Masculino: "O semeador dos Mundos — eu sou a faísca que dispara a mudança"
* Fixo:
  - Feminino: "A guardiã da colheita — eu extraio o valor do efêmero e o preservo"
  - Masculino: "O guardião da colheita — eu extraio o valor do efêmero e o preservo"
* Mutável:
  - Feminino: "A alquimista dos ciclos — eu multiplico a luz do que me atravessa"
  - Masculino: "O alquimista dos ciclos — eu multiplico a luz do que me atravessa"

[MECÂNICA E TEMPLATE DE RESPOSTA OBRIGATÓRIA]
Você DEVE preencher o JSON Schema exatamente com as seguintes chaves e estruturas de texto (não mude uma única palavra do texto fixo, apenas preencha os colchetes com conteúdo poético e profundo, sem incluir os colchetes na resposta final):

A) SE A PONTUAÇÃO FOR ALTA (${isHigh ? "ESTE É O CASO ATUAL" : "NÃO É O CASO ATUAL, MAS RESPEITE O SCHEMA"}):
- vetorTitle: "[Arquétipo flexionado] — [Frase de Impacto Original]"
  Exemplo para Água Feminino: "A navegante das Correntezas — eu crio passagem sem perder minha natureza"
- vetorAnalysis: "Com uma pontuação de ${score} em ${name}, você possui muitos elementos nesta configuração. Isso significa que a sua forma de se mover no mundo é movida por esta força. Você carrega naturalmente a potência de [descrever a virtude/força de forma profunda, ligada à beleza, verdade ou amor] e exerce esse poder como um fluxo natural da sua presença, expandindo sua vitalidade quando [dar exemplo prático de comportamento integrado]."

B) SE A PONTUAÇÃO FOR BAIXA (${!isHigh ? "ESTE É O CASO ATUAL" : "NÃO É O CASO ATUAL, MAS RESPEITE O SCHEMA"}):
- vetorTitle: "[Arquétipo flexionado] — Posso aprender a [completar com a ação da frase de impacto]"
  Exemplo para Fogo Feminino: "A portadora da chama — Posso aprender a acender o que ainda não tem nome"
  Exemplo para Terra Masculino: "O artesão da argila — Posso aprender a dar forma ao caos"
- vetorAnalysis: "Com uma pontuação de ${score} em ${name}, você possui poucos elementos nesta configuração. Isso significa que essa energia não é seu modo padrão de operação, mas sim um solo fértil que você foi convocada(o) a cultivar nesta existência para vencer as sombras que sugam sua energia vital. Você pode aprender a [traduzir o arquétipo em ação consciente] para ancorar mais [benefício essencial do elemento/qualidade] na sua vida real, permitindo-se ver a alma das coisas e trazendo equilíbrio à sua estrutura."

- fonte_astrologica: Deve obrigatoriamente preencher este campo no JSON. Coloque de forma sucinta e limpa o valor técnico correspondente a esse cálculo. Exemplos: "Diretriz Técnica • Elemento Água", "Diretriz Técnica • Qualidade Fixa". 

[REGRAS E DIRETRIZES CRÍTICAS]
- NÃO modifique as leituras de casas nem dos caminhos. Retorne apenas esta diretriz formatada.
- PROIBIÇÃO CRÍTICA DE ESTRUTURA DOS CAMINHOS: É terminantemente proibido seguir a estrutura dos caminhos (caminhos astrológicos) nesta leitura de diretriz de força. Não faça divisões de "Dinâmica Psíquica" vs "Dinâmica Estrutural da Alma", nem mencione regentes externos ou frases de síntese de caminhos. Siga estritamente e exclusivamente a estrutura do modelo de parágrafo único fornecido no comando correspondente à pontuação alta ou baixa.
- O texto preenchido nos colchetes deve fluir perfeitamente e ser curto (máximo de 4 a 5 linhas no total para o parágrafo).

${MANTO_ESTELAR_RULE}`;

  try {
    const client = getGeminiClient();
    const response = await callGeminiWithRetry(client, {
      model: "gemini-3.1-flash-lite",
      contents: `Por favor, gere a leitura da diretriz de força "${name}" com pontuação ${score} (${vetorType}) utilizando estritamente as diretrizes informadas e retorne no JSON Schema requerido.`,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: vetorReadingSchema,
      },
    });

    return response.text || "";
  } catch (error) {
    cleanLogError(`[Gemini API] Falha na leitura da Diretriz ${vetorId} (Ativando fallback offline)`, error);
    return getDeterministicVetorReadingFallback(profile, vetorId);
  }
}

export function getNatalMoonPhase(profile: CompleteAstrologicalProfile): string {
  const sunPos = profile.tropical_natal.planets.find(p => p.name === "Sol");
  const moonPos = profile.tropical_natal.planets.find(p => p.name === "Lua");
  const signNames = [
    "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
    "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
  ];
  if (sunPos && moonPos) {
    const sunLong = signNames.indexOf(sunPos.sign) * 30 + sunPos.degree;
    const moonLong = signNames.indexOf(moonPos.sign) * 30 + moonPos.degree;
    let diff = moonLong - sunLong;
    if (diff < 0) diff += 360;
    
    if (diff >= 0 && diff < 90) return "Nova";
    if (diff >= 90 && diff < 180) return "Crescente";
    if (diff >= 180 && diff < 270) return "Cheia";
    return "Minguante";
  }
  return "Nova";
}

export const moonReadingSchema = {
  type: Type.OBJECT,
  properties: {
    moonBirthPhase: { type: Type.STRING },
    moonBirthTitle: { type: Type.STRING },
    moonBirthAnalysis: { type: Type.STRING },
    moonGlossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["phase", "description"]
      }
    },
    fonte_astrologica: { type: Type.STRING }
  },
  required: ["moonBirthPhase", "moonBirthTitle", "moonBirthAnalysis", "moonGlossary", "fonte_astrologica"]
};

export async function generateMoonReading(profile: CompleteAstrologicalProfile): Promise<string> {
  const gender = profile.birthData.gender === "feminino" ? "feminino" : "masculino";
  const birthPhase = getNatalMoonPhase(profile);

  const systemInstruction = `[PAPEL DO SISTEMA]
Você é o algoritmo central da AQUAR.IA. Sua função é interpretar a Lua de Nascimento (fase lunar do momento exato do nascimento) como o vetor central de missão cósmica e existencial da pessoa, fornecendo também um glossário limpo e puramente referencial para as outras 3 fases do ciclo.

[DIRETRIZ DE TOM]
O texto deve carregar a profundidade de uma filosofia de vida, focando em despertar o usuário de suas ilusões de controle ou ansiedade, reconectando-o com os ritmos naturais e a sabedoria oculta do tempo. 

[MECÂNICA DE RESPOSTA]
O sistema receberá a "natal_moon_phase", que para este usuário é "Lua ${birthPhase}". A resposta em JSON deve mapear exatamente:

1. O DESTAQUE: LUA DE NASCIMENTO (A Missão da Alma)
No JSON, preencha:
- moonBirthPhase: "Lua ${birthPhase}"
- moonBirthTitle: "[Nome da Fase (ex: Lua Nova)] — [Frase de Impacto da Lua correspondente]"
- moonBirthAnalysis: "Você veio ao mundo sob a [Nome da Fase (ex: Lua Nova)] e carrega a missão de [descrever a missão kármica e o chamado ao despertar de forma profunda, poética e provocativa]. Seu caminho exige o cultivo da virtude de [mencionar virtude essencial] para vencer as sombras que tentam aprisionar ou paralisar sua vitalidade natural."

IMPORTANTE: O texto da chave 'moonBirthAnalysis' deve seguir EXATAMENTE este formato acima, preenchendo apenas as partes entre colchetes de forma fluida (remova os colchetes na resposta final). Não altere nenhuma outra palavra do texto fixo!

2. O GLOSSÁRIO: AS FASES COMPLEMENTARES (A Sabedoria do Ciclo)
No JSON, no array 'moonGlossary', retorne exatamente as outras 3 fases que NÃO são a de nascimento (${birthPhase}).
Para cada uma:
- phase: "[Nome da Fase (ex: Crescente)]"
- description: "[Resumo de 1 linha focado na energia de presença e no papel desta lua dentro do macrocosmo]."

[DICIONÁRIO DE LUNAS E FRASES DE IMPACTO]
Use as correspondências exatas abaixo para títulos e frases:
* Lua Nova: A Sabedoria da Semente — o vazio em mim é fértil
* Lua Crescente: A Ousadia do Broto — eu cresço em direção ao que me nutre
* Lua Cheia: A Potência da Florada — eu me revelo para inspirar
* Lua Minguante: O Ofício do Folheado — o que solto com consciência, cria espaço

[PROIBIÇÃO CRÍTICA]
- É terminantemente proibido seguir a estrutura dos caminhos (caminhos astrológicos) nesta leitura da Lua de Nascimento. Não faça divisões de "Dinâmica Psíquica" vs "Dinâmica Estrutural da Alma", nem mencione regentes externos ou frases de síntese de caminhos.
- Não altere nenhuma leitura além das Luas.
- Gênero do usuário: "${gender}" (Adapte arquétipos ou flexões se aplicável, ex: "convocada(o)").
- fonte_astrologica: Deve obrigatoriamente preencher este campo no JSON. Informe o signo e a Nakshatra da lua (ex: "Lua em Câncer (Tropical) / Janma Nakshatra Pushya (Sideral)").

${MANTO_ESTELAR_RULE}`;

  try {
    const client = getGeminiClient();
    const luaVedic = profile.vedic_natal.planets.find(p => p.name === "Lua");
    const luaDataText = luaVedic ? `A Lua do usuário encontra-se no signo de ${luaVedic.sign} e na Nakshatra de ${luaVedic.nakshatra}.` : "";

    const response = await callGeminiWithRetry(client, {
      model: "gemini-3.1-flash-lite",
      contents: `Por favor, gere a interpretação profunda da Lua de Nascimento "${birthPhase}" para o usuário e o glossário das outras 3 fases no formato JSON requerido.\n\n${luaDataText}`,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: moonReadingSchema,
      },
    });

    return response.text || "";
  } catch (error) {
    cleanLogError("[Gemini API] Falha na leitura da Lua de Nascimento (Ativando fallback offline)", error);
    return getDeterministicMoonReadingFallback(profile);
  }
}

// ==========================================
// DETERMINISTIC FALLBACK FUNCTIONS (100% RELIABLE)
// ==========================================

export function getDeterministicVetorReadingFallback(profile: CompleteAstrologicalProfile, vetorId: string): string {
  const gender = profile.birthData.gender === "feminino" ? "feminino" : "masculino";
  const { score, name } = getVetorScoreAndName(profile, vetorId);
  const isHigh = score >= 3;
  const vetorType = isHigh ? "domínio" : "desenvolvimento";

  let arquetipo = "";
  let fraseDeImpacto = "";
  let acaoFrase = "";
  let virtudeForca = "";
  let comportamentoIntegrado = "";
  let acaoConsciente = "";
  let beneficioEssencial = "";

  if (name === "Fogo") {
    arquetipo = gender === "feminino" ? "A portadora da chama" : "O portador da chama";
    fraseDeImpacto = "eu acendo o que ainda não tem nome";
    acaoFrase = "acender o que ainda não tem nome";
    virtudeForca = "entusiasmo, coragem criativa e visão de futuro";
    comportamentoIntegrado = "você inicia projetos ousados, age com autoconfiança e inspira os outros com seu brilho interior espontâneo";
    acaoConsciente = "acender sua autoconfiança de forma consciente e tomar a iniciativa";
    beneficioEssencial = "dinamismo, independência e vitalidade radiante";
  } else if (name === "Terra") {
    arquetipo = gender === "feminino" ? "A artesã da argila" : "O artesão da argila";
    fraseDeImpacto = "eu dou forma ao caos";
    acaoFrase = "dar forma ao caos";
    virtudeForca = "realismo, consistência, paciência e manifestação concreta";
    comportamentoIntegrado = "você organiza seus planos passo a passo, cuida da sua estrutura material e constrói bases seguras na realidade prática";
    acaoConsciente = "estruturar sua rotina de forma realista e dar forma concreta às suas ideias";
    beneficioEssencial = "estabilidade, segurança, conexão com o corpo e resiliência material";
  } else if (name === "Água") {
    arquetipo = gender === "feminino" ? "A navegante das Correntezas" : "O navegante das Correntezas";
    fraseDeImpacto = "eu crio passagem sem perder minha natureza";
    acaoFrase = "criar passagem sem perder minha natureza";
    virtudeForca = "empatia profunda, sensibilidade intuitiva, acolhimento e fluidez emocional";
    comportamentoIntegrado = "você escuta sua intuição, acolhe suas vulnerabilidades e flui pelas mudanças da vida sem endurecer o coração";
    acaoConsciente = "acolher e compreender suas emoções e escutar a voz suave da sua intuição";
    beneficioEssencial = "intuição refinada, paz interior, regeneração emocional e relacionamentos curativos";
  } else if (name === "Ar") {
    arquetipo = gender === "feminino" ? "A arauta dos ventos" : "O arauto dos ventos";
    fraseDeImpacto = "eu conecto o invisível";
    acaoFrase = "conectar o invisível";
    virtudeForca = "clareza mental, objetividade, conexão social e sabedoria compartilhada";
    comportamentoIntegrado = "você expressa suas ideias com elegância, dialoga com diferentes perspectivas e cria pontes entre pessoas e conceitos";
    acaoConsciente = "comunicar-se de forma clara, observar as situações sem julgamento e buscar novos horizontes mentais";
    beneficioEssencial = "clareza mental, adaptabilidade intelectual, leveza e trocas genuínas";
  } else if (name === "Cardeal") {
    arquetipo = gender === "feminino" ? "A semeadora dos Mundos" : "O semeador dos Mundos";
    fraseDeImpacto = "eu sou a faísca que dispara a mudança";
    acaoFrase = "ser a faísca que dispara a mudança";
    virtudeForca = "pioneirismo, liderança inspiradora e impulso realizador imediato";
    comportamentoIntegrado = "você toma a frente diante de novos ciclos, quebra estagnações e abre caminhos inexplorados com coragem ativa";
    acaoConsciente = "iniciar novas ações sem depender da aprovação alheia e direcionar sua vontade para novos começos";
    beneficioEssencial = "força de arranque, iniciativa autônoma e coragem para desbravar";
  } else if (name === "Fixo") {
    arquetipo = gender === "feminino" ? "A guardiã da colheita" : "O guardião da colheita";
    fraseDeImpacto = "eu extraio o valor do efêmero e o preservo";
    acaoFrase = "extrair o valor do efêmero e o preservar";
    virtudeForca = "firmeza de propósito, resistência e lealdade profunda";
    comportamentoIntegrado = "você sustenta seus compromissos a longo prazo, protege o que é valioso e aprofunda suas raízes nas suas escolhas essenciais";
    acaoConsciente = "manter o foco em seus objetivos principais e perseverar diante dos ventos da instabilidade";
    beneficioEssencial = "firmeza interior, constância, estabilidade de foco e poder de preservação";
  } else if (name === "Mutável") {
    arquetipo = gender === "feminino" ? "A alquimista dos ciclos" : "O alquimista dos ciclos";
    fraseDeImpacto = "eu multiplico a luz do que me atravessa";
    acaoFrase = "multiplicar a luz do que me atravessa";
    virtudeForca = "adaptabilidade sábia, versatilidade, aprendizado contínuo e flexibilidade de alma";
    comportamentoIntegrado = "você se adapta graciosamente a novas realidades, sintetiza diferentes saberes e flui com os finais e recomeços naturais da jornada";
    acaoConsciente = "flexibilizar suas posturas rígidas, aceitar as transições com leveza e aprender com cada mudança do caminho";
    beneficioEssencial = "versatilidade compassiva, resiliência mental e capacidade de transmutar desafios";
  }

  let title = "";
  let analysis = "";

  if (isHigh) {
    title = `${arquetipo} — ${fraseDeImpacto}`;
    analysis = `Com uma pontuação de ${score} em ${name}, você possui muitos elementos nesta configuração. Isso significa que a sua forma de se mover no mundo é movida por esta força. Você carrega naturalmente a potência de ${virtudeForca} e exerce esse poder como um fluxo natural da sua presença, expandindo sua vitalidade quando ${comportamentoIntegrado}.`;
  } else {
    title = `${arquetipo} — Posso aprender a ${acaoFrase}`;
    analysis = `Com uma pontuação de ${score} em ${name}, você possui poucos elementos nesta configuração. Isso significa que essa energia não é seu modo padrão de operação, mas sim um solo fértil que você foi convocada(o) a cultivar nesta existência para vencer as sombras que sugam sua energia vital. Você pode aprender a ${acaoConsciente} para ancorar mais ${beneficioEssencial} na sua vida real, permitindo-se ver a alma das coisas e trazendo equilíbrio à sua estrutura.`;
  }

  return JSON.stringify({
    vetorTitle: title,
    vetorAnalysis: analysis,
    vetorType,
    vetorScore: score
  });
}

export function getDeterministicMoonReadingFallback(profile: CompleteAstrologicalProfile): string {
  const birthPhase = getNatalMoonPhase(profile);

  const lunas = {
    "Nova": {
      title: "Lua Nova",
      frase: "A Sabedoria da Semente — o vazio em mim é fértil",
      missao: "silenciar, semear intenções puras no escuro e acolher o desconhecido como a grande promessa de novos começos",
      virtude: "recolhimento e fé intuitiva"
    },
    "Crescente": {
      title: "Lua Crescente",
      frase: "A Ousadia do Broto — eu cresço em direção ao que me nutre",
      missao: "romper a inércia, sustentar o próprio crescimento com ousadia diante dos obstáculos e nutrir as decisões com consistência",
      virtude: "coragem prática e resiliência"
    },
    "Cheia": {
      title: "Lua Cheia",
      frase: "A Potência da Florada — eu me revelo para inspirar",
      missao: "transbordar sua sensibilidade, revelar a verdade do seu coração de forma clara e iluminar os caminhos coletivos através do seu magnetismo",
      virtude: "expressão autêntica e clareza de presença"
    },
    "Minguante": {
      title: "Lua Minguante",
      frase: "O Ofício do Folheado — o que solto com consciência, cria espaço",
      missao: "discernir, desapegar-se de pesos desnecessários com sabedoria e recolher as forças vitais para o centro em pura contemplação",
      virtude: "desapego consciente e quietude interior"
    }
  };

  const currentLuna = lunas[birthPhase as keyof typeof lunas] || lunas["Nova"];
  const moonBirthPhase = `Lua ${birthPhase}`;
  const moonBirthTitle = `${currentLuna.title} — ${currentLuna.frase}`;
  const moonBirthAnalysis = `Você veio ao mundo sob a ${currentLuna.title} e carrega a missão de ${currentLuna.missao}. Seu caminho exige o cultivo da virtude de ${currentLuna.virtude} para vencer as sombras que tentam aprisionar ou paralisar sua vitalidade natural.`;

  const allPhases: ("Nova" | "Crescente" | "Cheia" | "Minguante")[] = ["Nova", "Crescente", "Cheia", "Minguante"];
  const otherPhases = allPhases.filter(p => p !== birthPhase);

  const glossaries = {
    "Nova": "A Sabedoria da Semente — o vazio em mim é fértil: Uma fase para plantar intenções, descansar no silêncio e acolher o início invisível de novos ciclos.",
    "Crescente": "A Ousadia do Broto — eu cresço em direção ao que me nutre: Uma energia de ação focada, ideal para alimentar as intenções plantadas e vencer a inércia.",
    "Cheia": "A Potência da Florada — eu me revelo para inspirar: O pico de luz e sensibilidade, propício para celebrar a manifestação, clarear verdades e expressar sentimentos.",
    "Minguante": "O Ofício do Folheado — o que solto com consciência, cria espaço: O recolhimento sábio, voltado para liberar o que não serve mais, purificar e restaurar forças."
  };

  const moonGlossary = otherPhases.map(phase => {
    return {
      phase: `Lua ${phase}`,
      description: glossaries[phase]
    };
  });

  return JSON.stringify({
    moonBirthPhase,
    moonBirthTitle,
    moonBirthAnalysis,
    moonGlossary
  });
}

export function getDeterministicHouseReadingFallback(profile: CompleteAstrologicalProfile, houseId: string): string {
  const houseNum = parseInt(houseId.replace("casa-", ""), 10);

  const tropHouse = profile.tropical_natal.houses.find(h => h.house === houseNum);
  const tropSign = tropHouse ? tropHouse.sign : "Signo";
  const tropRuler = tropHouse ? tropHouse.ruler : "Regente";
  
  // Encontra os planetas tropicais na casa
  const tropPlanets = profile.tropical_natal.planets.filter(p => p.house === houseNum);

  // Encontra os planetas védicos na casa
  const vedicPlanets = profile.vedic_natal.planets.filter(p => p.house === houseNum);

  // Dicionário de Nakshatras
  const NAKSHATRA_DETAILS: Record<string, { mantle: string; synthesis: string }> = {
    "Ashvini": {
      mantle: "estrela da cura e dos inícios rápidos (Ashvini)",
      synthesis: "concede velocidade de ação, rejuvenescimento celular e a coragem pioneira para liderar novas etapas de vida com agilidade pura"
    },
    "Bharani": {
      mantle: "estrela da contenção e das profundas transformações (Bharani)",
      synthesis: "canaliza a força da criação e do renascimento, ensinando a sustentar as dores do crescimento com resiliência profunda até o florescimento"
    },
    "Krittika": {
      mantle: "estrela do fogo sagrado e do corte purificador (Krittika)",
      synthesis: "confere o poder de cortar falsidades, purificar canais de consciência e defender a verdade com integridade luminosa e cortante"
    },
    "Rohini": {
      mantle: "estrela da beauty, nutrição e conforto estável (Rohini)",
      synthesis: "estimula a atração de prosperidade estável, a sensibilidade estética refinada e o dom de nutrir a vida com conforto e acolhimento tangíveis"
    },
    "Mrigashira": {
      mantle: "estrela da busca curiosa e da sensibilidade poética (Mrigashira)",
      synthesis: "desperta a curiosidade intelectual investigativa, a gentileza poética no falar e a busca constante pela harmonia sutil nas interações"
    },
    "Ardra": {
      mantle: "estrela das tempestades purificadoras e clareza mental (Ardra)",
      synthesis: "concede o poder de limpar padrões obsoletos de pensamento através de crises necessárias que renovam a visão de mundo após o sofrimento"
    },
    "Punarvasu": {
      mantle: "estrela do retorno da luz e da renovação de forças (Punarvasu)",
      synthesis: "traz a graça do porto seguro, a capacidade inata de recuperar recursos perdidos e o otimismo inabalável que atrai novas bênçãos"
    },
    "Pushya": {
      mantle: "estrela da nutrição espiritual e acolhimento compassivo (Pushya)",
      synthesis: "canaliza a energia de acolhimento e proteção de forma pura, funcionando como uma fonte inesgotável de sabedoria e nutrição para si e para os outros"
    },
    "Ashlesha": {
      mantle: "estrela da sabedoria subconsciente e força protetora (Ashlesha)",
      synthesis: "revela uma intuição cirúrgica, o dom de perceber intenções ocultas e a força protetora sagrada para defender sua intimidade contra perigos sutis"
    },
    "Magha": {
      mantle: "estrela da nobreza ancestral e integridade régia (Magha)",
      synthesis: "confere autoridade natural, conexão com as linhagens do passado, nobreza de espírito nas escolhas e a responsabilidade de liderar com ética"
    },
    "Purva Phalguni": {
      mantle: "estrela das artes, prazer criativo e conforto elegante (Purva Phalguni)",
      synthesis: "atira o magnetismo pessoal para as artes, a autoexpressão criativa espontânea e a capacidade de viver o prazer e o afeto de forma doada"
    },
    "Uttara Phalguni": {
      mantle: "estrela da lealdade duradoura e dever humanitário (Uttara Phalguni)",
      synthesis: "fortalece a lealdade inquebrável em suas parcerias, o senso ético de responsabilidade social e a estabilidade nas relações cotidianas"
    },
    "Hasta": {
      mantle: "estrela das habilidades refinadas e manifestação rápida (Hasta)",
      synthesis: "concede inteligência analítica prática, maestria em trabalhos de precisão e a facilidade de materializar intenções através de ações bem direcionadas"
    },
    "Chitra": {
      mantle: "estrela da criatividade estética e design sofisticado (Chitra)",
      synthesis: "desperta o dom supremo da criatividade, da arquitetura de belas formas, da sensibilidade visual e do embelezamento estético da realidade"
    },
    "Swati": {
      mantle: "estrela da independência fluida e liberdade intelectual (Swati)",
      synthesis: "confere extrema flexibilidade de adaptação, busca insaciável por liberdade de movimentos e uma mente comercial perspicaz nas trocas diárias"
    },
    "Vishakha": {
      mantle: "estrela da determinação implacável e foco vitorioso (Vishakha)",
      synthesis: "desperta uma determinação inquebrável para alcançar grandes propósitos, foco focado em metas elevadas e resiliência para superar obstáculos"
    },
    "Anuradha": {
      mantle: "estrela da amizade pura e capacidade de florescer no pântano (Anuradha)",
      synthesis: "facilita a união harmoniosa de pessoas em torno de causas elevadas e a capacidade de florescer em termos espirituais mesmo nas maiores crises"
    },
    "Jyeshtha": {
      mantle: "estrela da liderança protetora e sabedoria madura (Jyeshtha)",
      synthesis: "confere a autoridade e sabedoria de liderança madura conquistada com o tempo, o dom de governar com retidão ética e proteger as pessoas"
    },
    "Mula": {
      mantle: "estrela do desapego de ilusões e investigação profunda (Mula)",
      synthesis: "concede o poder de arrancar as raízes da mentira e das ilusões obsoletas, forçando a consciência a mergulhar no autoconhecimento puro"
    },
    "Purva Ashadha": {
      mantle: "estrela da perseverança otimista e purificação do dharma (Purva Ashadha)",
      synthesis: "ativa a perseverança otimista inabalável, purificando seus desejos materiais para alinhá-los com o dharma de evolução espiritual"
    },
    "Uttara Ashadha": {
      mantle: "estrela da força invencível e retidão ética coletiva (Uttara Ashadha)",
      synthesis: "representa o apoio das leis naturais, trazendo força realizadora justa, integridade de conduta e reconhecimento no trabalho pelo bem comum"
    },
    "Shravana": {
      mantle: "estrela da escuta generosa e sabedoria poética (Shravana)",
      synthesis: "confere o dom de receber ensinamentos elevados pelo canal da audição interna, a capacidade de aconselhar com clareza e a sabedoria poética"
    },
    "Dhanishta": {
      mantle: "estrela do ritmo celeste, música e abundância (Dhanishta)",
      synthesis: "alinha o fluxo das suas iniciativas com o ritmo divino do tempo, atraindo riqueza material espontânea e expressando dons artísticos e musicais"
    },
    "Shatabhisha": {
      mantle: "estrela dos cem curadores e misticismo silencioso (Shatabhisha)",
      synthesis: "revela a maestria da saúde integral pela purificação do corpo e mente, o misticismo meditativo silencioso e a sabedoria científica inovadora"
    },
    "Purva Bhadrapada": {
      mantle: "estrela da paixão intensa e transmutação mística (Purva Bhadrapada)",
      synthesis: "traz a coragem para quebrar ilusões e dogmas sociais falidos, transmutando dores psicológicas antigas em profunda liberdade mística"
    },
    "Uttara Bhadrapada": {
      mantle: "estrela da paz profunda e compaixão oceânica (Uttara Bhadrapada)",
      synthesis: "revela o autodomínio sereno dos sentimentos e instintos básicos, ativando uma compaixão cósmica pura e estabilidade espiritual indestrutível"
    },
    "Revati": {
      mantle: "estrela da proteção absoluta nas travessias e amor incondicional (Revati)",
      synthesis: "oferece proteção e amparo em todas as transições e jornadas de vida, canalizando a doçura do amor devocional puro e incondicional pela vida"
    }
  };

  const getNakshatraInfo = (name: string) => {
    const cleanName = name ? name.trim().replace(/[^a-zA-Z]/g, "") : "";
    for (const key of Object.keys(NAKSHATRA_DETAILS)) {
      if (key.toLowerCase() === cleanName.toLowerCase() || cleanName.toLowerCase().includes(key.toLowerCase())) {
        return NAKSHATRA_DETAILS[key];
      }
    }
    return {
      mantle: `estrela de sabedoria (${name || "Mansão Lunar"})`,
      synthesis: "canaliza as energias sutis de evolução e maturidade espiritual para este setor de experiência"
    };
  };

  // 1. Geração da Leitura Psicológica Dinâmica (Tropical)
  const tropSignDescriptions: Record<string, string> = {
    "Áries": "um impulso dinâmico de pioneirismo, iniciativa rápida e coragem visceral",
    "Touro": "uma busca calma por estabilidade, valor duradouro e nutrição sensorial de qualidade",
    "Gêmeos": "uma curiosidade viva, troca constante de ideias e extrema versatilidade mental",
    "Câncer": "uma necessidade terna de acolhimento, intimidade afetiva e preservação de memórias",
    "Leão": "um anseio radiante de autoexpressão soberana, brilho natural e dignidade pessoal",
    "Virgem": "uma atenção dedicada aos detalhes práticos, purificação diária e aprimoramento contínuo",
    "Libra": "uma busca constante por harmonia estética, justiça nas relações e cooperação simétrica",
    "Escorpião": "uma atração magnética pelas profundezas, regeneração íntima e poder de transmutação",
    "Sagitário": "uma sede insaciável de expansão, horizontes filosóficos elevados e entusiasmo livre",
    "Capricórnio": "um senso sóbrio de responsabilidade, persistência inabalável e escalada estruturada",
    "Aquário": "uma visão idealista voltada para o coletivo, liberdade de conceitos e originalidade futurista",
    "Peixes": "uma sensibilidade oceânica difusa, dissolução amorosa do ego e rendição mística ao sutil"
  };
  const dSign = tropSignDescriptions[tropSign] || "uma coloração psicológica singular e profunda";

  let leituraPsicologicaDinamica = `A sua abordagem psíquica e comportamental neste domínio de vida abre-se a partir de ${dSign} (cúspide da Casa ${houseNum} em ${tropSign}). `;

  if (tropPlanets.length > 0) {
    const planetInterpretations = tropPlanets.map(p => {
      const pName = p.name;
      if (pName === "Sol") {
        return `A sua essência central e o brilho da sua identidade necessitam expressar integridade de forma soberana neste setor (Sol em ${p.sign}).`;
      } else if (pName === "Lua") {
        return `As suas necessidades emocionais mais íntimas e a oscilação do seu humor encontram âncora e acolhimento direto neste domínio (Lua em ${p.sign}).`;
      } else if (pName === "Mercúrio") {
        return `A sua capacidade de articulação, trocas diárias e aprendizado ganha extrema versatilidade intelectual nesta área (Mercúrio em ${p.sign}).`;
      } else if (pName === "Vênus") {
        return `O seu magnetismo pessoal, a busca por harmonia estética e a expressão do seu afeto florescem com beleza neste campo de experiência (Vênus em ${p.sign}).`;
      } else if (pName === "Marte") {
        return `A sua força de iniciativa, a coragem para agir e os impulsos de conquista exigem direcionamento consciente e livre de reatividades neste espaço (Marte em ${p.sign}).`;
      } else if (pName === "Júpiter") {
        return `O transbordamento de oportunidades, a sua foi inabalável e a sabedoria para expandir horizontes encontram um campo fértil e generoso para prosperar neste solo (Júpiter em ${p.sign}).`;
      } else if (pName === "Saturno") {
        return `A exigência de maturidade, a necessidade de vencer medos antigos e a estruturação do tempo demandam paciência e responsabilidade exemplar neste setor (Saturno em ${p.sign}).`;
      } else {
        return `Uma poderosa força sutil ativa constantemente seus canais de percepção e ação, convidando-o a um constante amadurecimento e refinamento de potencialidades (${pName} em ${p.sign}).`;
      }
    });
    leituraPsicologicaDinamica += planetInterpretations.join(" ") + " ";
  } else {
    leituraPsicologicaDinamica += "Por ser um setor de fluxo subjetivo sutil, sem a ocupação direta de corpos celestes em seu mapa de nascimento, a sua vivência aqui flui de forma mais internalizada, chamando-o ao cultivo independente das qualidades deste signo. ";
  }

  leituraPsicologicaDinamica += `O direcionamento natural e a distribuição desses fluxos psíquicos são orquestrados de forma que você encontre equilíbrio e estabilização emocional sob a condução do regente ${tropRuler} da Casa ${houseNum}, que distribui essa energia pelo seu mapa.`;

  // 2. Geração da Leitura Kármica Dinâmica (Védica/Sideral) com Nakshatras
  const SIGNS_ORDER = ["Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"];
  const lagnaSignWithSuffix = profile.vedic_specifics?.lagna || "Áries Sideral";
  const lagnaSign = lagnaSignWithSuffix.replace(" Sideral", "").trim();
  const lagnaIndex = SIGNS_ORDER.indexOf(lagnaSign);
  const houseSignIndex = (lagnaIndex + houseNum - 1) % 12;
  const houseVedicSign = SIGNS_ORDER[houseSignIndex >= 0 ? houseSignIndex : 0];

  const getHouseMeaning = (num: number) => {
    const meanings: Record<number, string> = {
      1: "o portal da identidade, da vitalidade e da presença física",
      2: "o campo dos recursos, da sustentação material e dos valores pessoais",
      3: "o campo do esforço, da comunicação e da coragem",
      4: "o santuário das origens, do lar e do contentamento emocional",
      5: "o palco da autoexpressão, da criatividade e dos méritos da alma",
      6: "o setor da superação de obstáculos, purificação e trabalho diário",
      7: "a morada das parcerias, do casamento e do espelho do outro",
      8: "o território das transformações profundas, crises e mistérios ocultos",
      9: "o caminho do dharma, da sabedoria elevada e da orientação espiritual",
      10: "o cenário do trabalho no mundo, da reputação e da missão pública",
      11: "o campo dos grandes ganhos, do coletivo e das visões de futuro",
      12: "o portal do recolhimento, da dissolução e da libertação final"
    };
    return meanings[num] || "um setor sagrado de evolução";
  };

  const getSignAtmosphere = (signName: string) => {
    const atmospheres: Record<string, { trans: string; desc: string }> = {
      "Áries": { trans: "Áries", desc: "fogo primordial da iniciativa, coragem transformadora e impaciência kármica" },
      "Touro": { trans: "Touro", desc: "solo firme da estabilidade material, conservação de recursos e valorização dos sentidos" },
      "Gêmeos": { trans: "Gêmeos", desc: "fluxo mutável da comunicação sutil, trocas intelectuais e adaptabilidade de alma" },
      "Câncer": { trans: "Câncer", desc: "águas profundas da nutrição emocional, devoção compassiva e resgate das origens da alma" },
      "Leão": { trans: "Leão", desc: "centro solar de soberania espiritual, expressão digna e liderança natural do coração" },
      "Virgem": { trans: "Virgem", desc: "terra dedicada ao serviço purificador, cura prática e aprimoramento meticuloso do dharma" },
      "Libra": { trans: "Libra", desc: "ar harmônico dos encontros simétricos, justiça nas trocas e refinamento das relações" },
      "Escorpião": { trans: "Escorpião", desc: "profundezas místicas de transmutação emocional, regeneração oculta e quebra de dogmas" },
      "Sagitário": { trans: "Sagitário", desc: "fogo expansivo da sabedoria superior, fé ativa e direção aos horizontes sagrados" },
      "Capricórnio": { trans: "Capricórnio", desc: "estrutura séria de responsabilidade material, paciência do tempo e dever firme" },
      "Aquário": { trans: "Aquário", desc: "ventos originais do bem comum, liberdade coletiva e desapego de dogmas obsoletos" },
      "Peixes": { trans: "Peixes", desc: "oceano infinito de rendição amorosa, dissolução do ego e amparo compassivo universal" }
    };
    return atmospheres[signName] || { trans: signName, desc: "uma atmosfera de evolução espiritual singular" };
  };

  const vedicSignDetails: Record<string, { virtude: string; sombra: string }> = {
    "Áries": {
      virtude: "coragem pioneira, iniciativa visceral e a força para desbravar novos caminhos",
      sombra: "impaciência reativa, agressividade cega e dispersão egoica"
    },
    "Touro": {
      virtude: "estabilidade serena, persistência prática e cultivo de valores perenes",
      sombra: "apego obstinado, estagnação por conveniência e inércia material"
    },
    "Gêmeos": {
      virtude: "versatilidade intelectual, curiosidade sutil e comunicação que conecta almas",
      sombra: "superficialidade mental, dispersão de foco e dubiedade de intenções"
    },
    "Câncer": {
      virtude: "receptividade amorosa, acolhimento protetor e conexão profunda com as raízes internas",
      sombra: "carência manipuladora, hipersensibilidade defensiva e apego excessivo ao passado"
    },
    "Leão": {
      virtude: "soberania espiritual, dignidade natural e generosidade radiante do coração",
      sombra: "orgulho inflado, necessidade obsessiva de aplausos e autoritarismo dramático"
    },
    "Virgem": {
      virtude: "discernimento analítico, serviço desinteressado e purificação meticulosa da mente",
      sombra: "criticismo perfeccionista, ansiedade por controle e excesso de tecnicismo estéril"
    },
    "Libra": {
      virtude: "diplomacia harmônica, justiça nas trocas e refinamento estético das relações",
      sombra: "indecisão paralisante, dependência emocional e a falsidade do agrado superficial"
    },
    "Escorpião": {
      virtude: "capacidade de regeneração profunda, investigação mística e poder de transmutação emocional",
      sombra: "apego ao controle secreto, rancor acumulado e autodestruição reativa"
    },
    "Sagitário": {
      virtude: "fé expansiva, aspiração filosófica elevada e entusiasmo direcionado à verdade",
      sombra: "dogmatismo arrogante, fanatismo moral e fuga das responsabilidades práticas"
    },
    "Capricórnio": {
      virtude: "paciência madura, compromisso estruturado e resiliência diante do tempo",
      sombra: "frieza pragmática, ambição desalmada e medo crônico do fracasso"
    },
    "Aquário": {
      virtude: "originalidade visionária, desapego de velhos dogmas e serviço à evolução coletiva",
      sombra: "rebeldia excêntrica sem propósito, distanciamento afetivo e arrogância intelectual"
    },
    "Peixes": {
      virtude: "rendição espiritual compassiva, sensibilidade mística sutil e amor incondicional",
      sombra: "escapismo alienado, vitimização mártir e total confusão de fronteiras psíquicas"
    }
  };

  const sDetails = vedicSignDetails[houseVedicSign] || {
    virtude: "busca pelo alinhamento sagrado e cultivo de virtudes conscientes",
    sombra: "identificação mecânica com padrões de condicionamento obsoletos"
  };

  const getShortNakshatraTranslation = (nakshatraName: string) => {
    const info = getNakshatraInfo(nakshatraName);
    let text = info.mantle;
    text = text.replace(/^estrela da\s+/, "");
    text = text.replace(/^estrela do\s+/, "");
    text = text.replace(/^estrela de\s+/, "");
    text = text.replace(/^estrela dos\s+/, "");
    text = text.replace(/\s*\([^)]*\)$/, "");
    return text.trim();
  };

  const getPlanetAction = (planetName: string) => {
    const name = planetName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (name === "sol") {
      return "assumir sua liderança com honestidade, agir com autonomia e expressar seu verdadeiro eu sem medo do que os outros pensam";
    } else if (name === "lua") {
      return "acolher sua vulnerabilidade, entender seus sentimentos e cuidar do seu bem-estar emocional com autocompaixão";
    } else if (name === "mercurio") {
      return "organizar seus pensamentos com lógica, aprender coisas novas e se comunicar de forma clara, simples e direta";
    } else if (name === "venus") {
      return "cultivar relações harmoniosas, valorizar a sua autoestima e trazer beleza e afeto para a sua vida comum";
    } else if (name === "marte") {
      return "agir com coragem prática, colocar seus limites de forma saudável e resolver problemas sem reatividades ou brigas";
    } else if (name === "jupiter") {
      return "estudar com mente aberta, cultivar o otimismo realista e enxergar o sentido maior por trás dos desafios diários";
    } else if (name === "saturno") {
      return "desenvolver a disciplina diária, ter paciência com o seu próprio tempo e construir limites sólidos com persistência";
    } else if (name === "rahu" || name === "nodo norte") {
      return "explorar caminhos desconhecidos, aceitar o desejo de crescer e quebrar velhos hábitos que limitam seu progresso";
    } else if (name === "ketu" || name === "nodo sul") {
      return "desapegar de padrões repetitivos que já não servem mais, cultivar a quietude e confiar na sua intuição";
    } else {
      return "integrar novas forças de amadurecimento e equilibrar suas ações diárias com sabedoria prática";
    }
  };

  const getShortHouseTranslation = (num: number) => {
    const shortMeanings: Record<number, string> = {
      1: "identidade, saúde e autoimagem",
      2: "vida financeira, valores materiais e autoestima",
      3: "comunicação, esforço diário e coragem",
      4: "vida familiar, intimidade emocional e segurança interna",
      5: "criatividade, hobbies e autoexpressão",
      6: "rotina, hábitos diários e superação de obstáculos",
      7: "relacionamentos íntimos, casamento e parcerias",
      8: "transformações emocionais profundas, crises e desapego",
      9: "estudos elevados, filosofia de vida e espiritualidade",
      10: "carreira, trabalho no mundo e realizações profissionais",
      11: "amizades, projetos coletivos e planos de futuro",
      12: "silêncio, espiritualidade e isolamento terapêutico"
    };
    return shortMeanings[num] || "evolução pessoal";
  };

  const parte1 = `A base desta área da sua vida é moldada por ${houseVedicSign}. Isso pede que você cultive ${sDetails.virtude}, deixando de lado ${sDetails.sombra}.`;

  let parte2 = "";
  if (vedicPlanets.length > 0) {
    const planetInterpretationsVedic = vedicPlanets.map(p => {
      const trans = getShortNakshatraTranslation(p.nakshatra);
      const action = getPlanetAction(p.name);
      return `Sob o manto da estrela ${p.nakshatra} (conhecida como a estrela da ${trans}), o planeta ${p.name} traz a necessidade prática de ${action}.`;
    });
    parte2 = planetInterpretationsVedic.join(" ");
  } else {
    parte2 = "Como não há planetas morando aqui, o controle das situações desta área fica totalmente nas mãos do seu regente.";
  }

  let rPr = "Sol";
  if (houseVedicSign === "Áries" || houseVedicSign === "Escorpião") rPr = "Marte";
  else if (houseVedicSign === "Touro" || houseVedicSign === "Libra") rPr = "Vênus";
  else if (houseVedicSign === "Gêmeos" || houseVedicSign === "Virgem") rPr = "Mercúrio";
  else if (houseVedicSign === "Câncer") rPr = "Lua";
  else if (houseVedicSign === "Leão") rPr = "Sol";
  else if (houseVedicSign === "Sagitário" || houseVedicSign === "Peixes") rPr = "Júpiter";
  else if (houseVedicSign === "Capricórnio" || houseVedicSign === "Aquário") rPr = "Saturno";

  const rulerPlanet = profile.vedic_natal.planets.find(p => p.name === rPr);
  let parte3 = "";
  if (rulerPlanet) {
    const destMeaning = getShortHouseTranslation(rulerPlanet.house);
    const destNakshatraTrans = `${rulerPlanet.nakshatra} (estrela da ${getShortNakshatraTranslation(rulerPlanet.nakshatra)})`;
    parte3 = `O mestre desta área é ${rPr}. Ele levou as chaves deste setor para a Casa ${rulerPlanet.house}, que é a área responsável por ${destMeaning}. Lá, ele veste as qualidades de ${rulerPlanet.sign} e da estrela ${destNakshatraTrans}. Na prática, isso significa que você só resolve e destrava os resultados desta área quando você cuida e amadurece os assuntos da Casa ${rulerPlanet.house}.`;
  } else {
    parte3 = `O mestre desta área é ${rPr}. Ele gerencia diretamente o fluxo de amadurecimento e sustentação desta área da sua vida. Na prática, isso significa que você resolve e destrava os resultados deste setor quando desenvolve maturidade emocional e assume a responsabilidade pelas suas ações diárias.`;
  }

  const leituraKarmicaDinamica = `${parte1}\n\n${parte2}\n\n${parte3}`;

  const houseInfo = {
    1: {
      name: "Casa 1 — Identidade e Presença",
      subtitle: "O Portal do Ascendente e a Força da Individualidade",
      resumo: "A lente fundamental através da qual você percebe a existência, inicia projetos e estrutura seu senso de eu.",
      psicologica: `Seu Ascendente em ${tropSign} dita a forma como você se apresenta e reage ao mundo. Você aborda novos começos com o temperamento desse signo, estabelecendo sua marca pessoal. A presença de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "forças sutis de foco"} nesta casa indica que seu corpo, sua vitalidade e sua autoexpressão direta são áreas centrais de constante aprendizado e autoafirmação.`,
      karmica: `Sob a ótica sideral, seu ponto de ancoragem na matéria (Lagna) revela as condições físicas e kármicas que moldam sua encarnação. A regência de ${profile.vedic_specifics?.lagnesha || "seu regente vital"} direciona seu fluxo de energia primária, definindo a principal arena de evolução onde sua alma busca expressar sua soberania e realizar seu dharma primordial.`,
      drishtis: "Esta área é alimentada por influências complementares e olhares de forças planetárias que testam ou abençoam sua autoimagem e vitalidade, ajudando a dissolver ilusões sobre quem você realmente é.",
      pedido: "Unificar a iniciativa pessoal com a autocompreensão profunda, superando a necessidade de validação externa.",
      tensao: "O atrito entre a persona que você projeta para se proteger e a necessidade de despir as máscaras para revelar sua essência real.",
      integracao: "Meditar sobre o silêncio que antecede todas as suas escolhas e cultivar a presença plena no aqui e agora.",
      armadilha: "Cair no egoísmo rígido ou, inversamente, anular sua própria vontade para agradar o outro, bloqueando sua força vital.",
      dom: "A capacidade de agir com autonomia cristalina, inspirando confiança e trazendo clareza para todos ao seu redor."
    },
    2: {
      name: "Casa 2 — Recursos e Valores",
      subtitle: "A Substância da Matéria e a Autoestima",
      resumo: "O terreno de sua segurança material, posses, valores internos e como você sustenta sua caminhada.",
      psicologica: `Com ${tropSign} na cúspide da Casa 2, a forma como você atrai recursos e lida com o plano material é moldada por esse signo. A presença de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias de conservação"} indica que seus talentos práticos e senso de valor próprio dependem de uma profunda conexão com a realidade tangível.`,
      karmica: "Na dinâmica estrutural da alma, esta casa aponta para as memórias de segurança e os recursos que você carrega. O regente desta área atua direcionando seus esforços para a estabilização material e o desenvolvimento de dons que servem de base para o seu sustento kármico nesta vida.",
      drishtis: "As forças planetárias que aspectam este setor moldam seu senso de suficiência e sua capacidade de materializar ideias, purificando seu relacionamento com o apego e o medo da escassez.",
      pedido: "Aprender a valorizar seus dons intrínsecos e a usar a matéria como ferramenta de liberdade, não de prisão emocional.",
      tensao: "A oscilação constante entre o medo de não ter o suficiente e a sabedoria de que você é a própria fonte do valor.",
      integracao: "Desenvolver uma rotina de gratidão ativa, reconhecendo a beleza nos recursos simples e agindo com generosidade consciente.",
      armadilha: "Medir seu valor humano pelo saldo bancário ou se apegar a posses para evitar lidar com o vazio interno.",
      dom: "A habilidade de dar forma estável ao caos, transformando ideias abstratas em segurança e beleza para si e para os outros."
    },
    3: {
      name: "Casa 3 — Comunicação e Aprendizado",
      subtitle: "A Mente Concreta e as Primeiras Conexões",
      resumo: "O fluxo de suas ideias, comunicação, relacionamento com o entorno imediato e primeiros acordos.",
      psicologica: `A energia de ${tropSign} na Casa 3 activa uma mente que processa informações de maneira dinâmica e única. A influência de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias mentais flexíveis"} estimula sua curiosidade nata, o desejo de aprender e a forma como você se expressa diante de irmãos, vizinhos e do cotidiano.`,
      karmica: "Estruturalmente, esta casa representa sua força de vontade, coragem prática e habilidades manuais. O regente desta casa direciona suas faculdades intelectuais e sua determinação para construir pontes conceituais e superar obstáculos imediatos através da inteligência aplicada.",
      drishtis: "Aspectos planetários nesta casa refinam sua percepção mental, instigando o discernimento e limpando preconceitos ou ruídos que distorcem suas trocas intelectuais.",
      pedido: "Cultivar a escuta profunda e comunicar a verdade com clareza, compaixão e responsabilidade.",
      tensao: "O conflito entre o excesso de racionalizações superficiais e o chamado para mergulhar em saberes verdadeiramente integrados.",
      integracao: "Escrever seus pensamentos para clarear a mente e praticar a comunicação não violenta nas relações cotidianas.",
      armadilha: "Falar muito e escutar pouco, dispersar energia em fofocas ou debates infrutíferos, e acumular informações sem praticar.",
      dom: "O poder da palavra que cura e conecta, funcionando como um canal de leveza e sabedoria que desata nós mentais."
    },
    4: {
      name: "Casa 4 — Origens e Intimidade",
      subtitle: "As Raízes da Alma e o Fundo do Céu",
      resumo: "Suas origens familiares, a fundação de sua segurança emocional e o santuário de sua vida privada.",
      psicologica: `Seu Fundo do Céu em ${tropSign} revela a atmosfera íntima onde sua psique busca abrigo e restauração. A presença de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias de recolhimento"} indica que sua sensibilidade subjetiva e paz interior exigem um espaço doméstico sagrado, livre das demandas do mundo social.`,
      karmica: "No nível estrutural, a Casa 4 é o trono das emoções (Chandra Lagna). O posicionamento do seu regente mostra como sua linhagem ancestral e memórias de infância ancoram ou desafiam seu senso de contentamento interior, convidando à cura de feridas de pertencimento.",
      drishtis: "As influências que tocam esta base psíquica agem no nível subconsciente, convidando a reestruturar seus alicerces emocionais e curar os padrões familiares herdados.",
      pedido: "Nutrir a si mesma(o) a partir de uma fonte interna inabalável de amor e pertencimento cósmico.",
      tensao: "O atrito entre a busca externa por um lar seguro e a percepção de que o verdadeiro templo é o seu próprio coração.",
      integracao: "Dedicar momentos de silêncio meditativo no seu lar, limpando energias antigas e honrando sua ancestralidade com perdão.",
      armadilha: "Refugiar-se no vitimismo infantil, apegar-se ao passado por medo do amanhã ou esconder suas emoções atrás de uma couraça rígida.",
      dom: "A capacidade de acolher o sofrimento alheio a partir de uma estabilidade emocional inabalável, sendo um porto seguro para os outros."
    },
    5: {
      name: "Casa 5 — Autoexpressão e Criatividade",
      subtitle: "O Brilho da Criança Interior e o Palco do Eu",
      resumo: "Seu potencial de alegria, autoexpressão criativa, romances, projetos autorais e a capacidade de brincar com a vida.",
      psicologica: `Com ${tropSign} na Casa 5, sua criatividade e alegria espontânea brilham através das qualidades deste signo. A presença de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias expressivas"} convida você a encontrar canais autênticos de lazer, arte e autoexpressão que alimentam sua vitalidade individual.`,
      karmica: "Estruturalmente, esta é a casa do intelecto elevado e dos méritos de vidas passadas (Purva Punya). O regente direciona seu magnetismo e inteligência criativa para que você possa colocar suas virtudes à disposição do mundo, despertando sua sabedoria inata nesta encarnação.",
      drishtis: "Aspectos sobre esta casa expandem sua imaginação e testam a pureza das suas intenções, garantindo que seu brilho não venha de pura vaidade, mas do transbordamento do amor.",
      pedido: "Permitir que sua luz brilhe livremente, sem medo do julgamento dos outros, transformando a vida em uma grande brincadeira sagrada.",
      tensao: "A necessidade desesperada de aprovação externa contraposta à autêntica alegria de criar sem esperar nada em troca.",
      integracao: "Praticar hobbies e atividades lúdicas sem qualquer compromisso com a utilidade prática ou performance.",
      armadilha: "Cair no drama egocêntrico para atrair atenção ou reprimir seus desejos criativos por medo de não ser bom o bastante.",
      dom: "O entusiasmo contagiante que acende a chama della criatividade coletiva, inspirando os outros a também assumirem seu poder pessoal."
    },
    6: {
      name: "Casa 6 — Purificação e Rotina",
      subtitle: "O Ritmo do Templo Físico e o Serviço",
      resumo: "A organização do seu cotidiano, saúde do corpo, o trabalho diário e a arte de purificar a energia.",
      psicologica: `O signo de ${tropSign} na Casa 6 dita como você organiza sua rotina e responde às exigências do seu corpo físico. A presença de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias de aprimoramento"} mostra que seu bem-estar depende de rituais diários saudáveis, limites claros e de um trabalho que tenha utilidade real.`,
      karmica: "Sideralmente, esta é a casa de superação de obstáculos e purificação. O posicionamento do regente indica as frentes onde você é convocada(o) a desenvolver resiliência mental, tratar desequilíbrios físicos e transformar conflitos em pura sabedoria prática.",
      drishtis: "As forças que olham para esta casa testam sua paciência e trazem clareza para discernir o que é dreno de energia vital na sua rotina diária.",
      pedido: "Aprender a servir sem se esgotar, tratando o próprio corpo como um templo sagrado que exige cuidado consciente.",
      tensao: "A busca obsessiva por uma perfeição inatingível contraposta à necessidade de acolher suas imperfeições com compaixão.",
      integracao: "Organizar uma rotina de rituais simples (alimentação limpa, sono de qualidade e pausas para respirar) com presença total.",
      armadilha: "Cair na queixa diária e no vitimismo, centralizar tarefas por dilação ou somatizar o estresse em forma de dores e fadiga.",
      dom: "O ofício da cura e da eficiência simples, sabendo como restaurar o equilíbrio e trazer harmonia prática aos ambientes caóticos."
    },
    7: {
      name: "Casa 7 — Parcerias e o Espelho do Outro",
      subtitle: "O Descendente e a Alquimia dos Encontros",
      resumo: "Seus relacionamentos íntimos, sociedades, casamentos e as projeções inconscientes que você faz no outro.",
      psicologica: `Seu Descendente em ${tropSign} descreve as qualidades que você busca e atrai em suas parcerias afetivas e profissionais. A presença de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias de relacionamento"} revela que os encontros um-a-um são verdadeiros espelhos onde você enxerga partes ocultas de si mesma(o).`,
      karmica: "Na dinâmica estrutural, esta casa é a morada das parcerias e do destino conjugal. O regente desta casa indica como sua alma se purifica através das trocas íntimas, impulsionando sua maturidade emocional e espiritual através do compromisso mútuo.",
      drishtis: "Os olhares planetários que tocam esta casa de encontros testam a maturidade das suas parcerias, limpando ilusões de dependência e carência afetiva.",
      pedido: "Viver relacionamentos baseados na união de dois seres inteiros que caminham lado a lado em liberdade e verdade.",
      tensao: "A oscilação constante entre fundir-se ao outro por medo da solidão e erguer muralhas de isolamento por medo de se ferir.",
      integracao: "Conversar de forma transparente sobre suas expectativas nas parcerias e praticar o dar e receber com equilíbrio de forças.",
      armadilha: "Projetar suas próprias sombras e frustrações no parceiro, aceitando dinâmicas tóxicas ou anulando-se para evitar conflitos.",
      dom: "A arte de criar harmonia e pontes de amor genuíno, gerando conexões estáveis, pacíficas e profundamente curativas."
    },
    8: {
      name: "Casa 8 — Morte, Renascimento e Mistérios",
      subtitle: "O Alambique da Alma e as Transformações",
      resumo: "O território das crises profundas, mistérios ocultos, regeneração, sexualidade e recursos compartilhados.",
      psicologica: `Com ${tropSign} na Casa 8, seus processos de crise e regeneração psicológica ocorrem de forma intensa e profunda. A influência de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias transmutadoras"} convida você a descer ao inconsciente, encarando tabus e desapegando-se de velhas identidades para renascer mais forte.`,
      karmica: "Na dinâmica da alma, a Casa 8 é um laboratório de regeneração profunda. A posição do regente indica os pontos de crise de destino que forçam a alma a soltar o controle egóico e se render ao fluxo invisível da vida, ativando dons intuitivos latentes.",
      drishtis: "Aspectos que tocam este setor trazem luz aos seus medos profundos, revelando que toda crise é apenas uma gestação de uma nova versão de si mesma(o).",
      pedido: "Render-se ao fluxo de impermanência da vida, acolhendo as perdas como espaços férteis para o surgimento do novo.",
      tensao: "A resistência férrea do ego em soltar os velhos padrões e o chamado inevitável da vida para desabar e renascer.",
      integracao: "Desenvolver práticas terapêuticas, meditativas ou corporais que ajudem a liberar memórias bloqueadas no corpo físico.",
      armadilha: "Tentar exercer controle obsessivo sobre os outros, cultivar desconfiança paranoica ou prender-se a ressentimentos antigos.",
      dom: "O poder da cura alquímica e da resiliência absoluta, renascendo das próprias cinzas com uma autoridade espiritual magnética."
    },
    9: {
      name: "Casa 9 — Sabedoria e Expansão",
      subtitle: "A Mente Superior e a Busca pela Verdade",
      resumo: "Seus valores filosóficos, caminhos de fé, saberes elevados, viagens longas e a expansão de horizontes.",
      psicologica: `A cúspide em ${tropSign} na Casa 9 move sua mente superior a buscar significado, teorias filosóficas e novas culturas com entusiasmo. A presença de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias de busca elevada"} expande seu olhar ético e sua fome por compreender a arquitetura espiritual da realidade.`,
      karmica: "Estruturalmente, esta é a casa mais auspiciosa do dharma e da orientação espiritual (Dharma Trikona). O regente direciona seu destino para encontrar mestres reais, estudos profundos e sabedorias ancestrais que ativem sua bússola moral e seu propósito kármico.",
      drishtis: "As influências planetárias sobre este setor purificam seus dogmas e convicções mentais, garantindo que sua fé não seja cega, mas sim baseada em uma experiência real.",
      pedido: "Viver de acordo com suas verdades mais elevadas, transformando a filosofia teórica em sabedoria prática e integrada.",
      tensao: "A distância entre o idealismo de suas teorias abstratas e a realidade desafiadora da sua conduta diária nas relações comuns.",
      integracao: "Estudar textos de filosofia perene de forma reflexiva e buscar momentos de contemplação profunda na natureza.",
      armadilha: "Cair no dogmatismo moralista, na arrogância intelectual de quem acha que sabe tudo ou no fanatismo de crenças rígidas.",
      dom: "A liderança ética inspiradora, transmitindo conhecimentos que libertam e trazem esperança, funcionando como uma ponte viva de luz."
    },
    10: {
      name: "Casa 10 — Missão e Realização Pública",
      subtitle: "O Meio do Céu e a Montanha a ser Escalada",
      resumo: "Sua face pública, reputação, carreira, o legado que você constrói e as responsabilidades diante do coletivo.",
      psicologica: `Com seu Meio do Céu em ${tropSign}, seu impacto profissional e sua ambição de contribuir para o mundo expressam as qualidades deste signo. A presença de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias estruturadoras"} exige que seu sucesso seja conquistado com integridade, esforço e consistência.`,
      karmica: "Estruturalmente, esta é a casa da ação no mundo. O posicionamento do regente dita a natureza do seu trabalho espiritual e material, indicando as responsabilidades kármicas e o legado real que sua alma veio construir nesta encarnação.",
      drishtis: "As forças planetárias que aspectam o ponto mais alto do seu mapa testam sua persistência e exigem retidão moral inabalável em seus negócios públicos.",
      pedido: "Assumir sua verdadeira autoridade e poder realizador, colocando sua carreira a serviço de um propósito que eleve a sociedade.",
      tensao: "O conflito entre o desejo de poder e status exterior e a necessidade de que sua obra nasça de um estado de pura verdade e amor.",
      integracao: "Alinhar suas metas de trabalho diárias a valores éticos transparentes, focando na excelência da ação e não apenas na fama.",
      armadilha: "Tornar-se uma fortaleza fria de trabalho excessivo (workaholic), sacrificando seu bem-estar e intimidade por medo de falhar ou ser irrelevante.",
      dom: "A habilidade de liderar e arquitetar grandes estruturas com solidez e sabedoria natural, deixando uma marca indelével de integridade no mundo."
    },
    11: {
      name: "Casa 11 — Coletivo e Projetos de Futuro",
      subtitle: "As Redes de Apoio e as Visões Coletivas",
      resumo: "Seus amigos, grupos de afinidade, desejos de futuro, causas sociais e a sua relação com o coletivo.",
      psicologica: `Seu signo de ${tropSign} na Casa 11 molda sua visão de futuro e como você se conecta a movimentos sociais e redes. A influência de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias humanitárias"} estimula sua colaboração com o todo, buscando parcerias intelectuais que compartilham dos seus ideais de mundo.`,
      karmica: "Sideralmente, esta é a casa dos grandes ganhos espirituais e materiais. O regente direciona seu fluxo de prosperidade para as redes coletivas, mostrando que seus lucros e expansão kármica dependem do valor real que você entrega ao bem comum.",
      drishtis: "Aspectos sobre este setor purificam suas amizades e projetos coletivos, desmascarando alianças de conveniência egoísta para dar espaço a conexões fraternas reais.",
      pedido: "Colocar seus dons individuais a serviço da evolução coletiva, cooperando com harmonia e respeito pelas diferenças.",
      tensao: "O desafio de brilhar individualmente sem cair no egoísmo e cooperar em grupo sem anular sua própria identidade.",
      integracao: "Participar ativamente de projetos coletivos ou voluntários que ressoem com seus ideais, exercitando a generosidade.",
      armadilha: "Buscar aceitação social a qualquer custo, dispersar-se em amizades superficiais ou projetar nos outros a responsabilidade pelas suas visões de futuro.",
      dom: "A força de articular pessoas e catalisar visões humanitárias, unindo o coletivo em torno de ideais elevados que preparam o amanhã."
    },
    12: {
      name: "Casa 12 — Espiritualidade e o Indizível",
      subtitle: "O Oceano do Inconsciente e a Dissolução do Ego",
      resumo: "O plano espiritual, a vida meditativa, o recolhimento, os bastidores de sua mente e a dissolução do senso de separação.",
      psicologica: `A presença de ${tropSign} na cúspide da Casa 12 banha seu inconsciente com as qualidades sensíveis e sutis deste signo. A presença de ${tropPlanets.length > 0 ? tropPlanets.map(p => p.name).join(", ") : "energias místicas ou de isolamento"} exige momentos constantes de recolhimento, meditação e contato direto com o sutil para que sua mente descanse.`,
      karmica: "Estruturalmente, a Casa 12 rege a libertação final e perdas conscientes. O posicionamento do regente revela como sua alma se purifica através do desapego voluntário, do recolhimento meditativo e da dissolução de mágoas e ilusões passadas na fonte sagrada do Ser.",
      drishtis: "As forças que tocam este santuário silencioso limpam as últimas barreiras de resistência egóica, despertando uma intuição refinada e um profundo sentimento de unidade com o todo.",
      pedido: "Render-se à sabedoria oculta do silêncio e confiar na proteção invisível do Universo, sabendo que você nunca está só.",
      tensao: "O medo profundo da perda de controle psíquico contraposto à paz absoluta que só a entrega espiritual sincera pode proporcionar.",
      integracao: "Cultivar práticas de meditação silenciosa antes de dormir, orações com o coração e momentos regulares de isolamento terapêutico.",
      armadilha: "Fugir da realidade prática através de fantasias espiritualistas, cultivar sentimentos ocultos de culpa ancestral ou usar substâncias para escapar da vida real.",
      dom: "A compaixão universal pura e a conexão direta com as dimensões de paz infinita, servindo como uma âncora de silêncio e amor incondicional no mundo."
    }
  };

  const info = houseInfo[houseNum as keyof typeof houseInfo] || houseInfo[1];

  const finalLeituraPsicologica = leituraPsicologicaDinamica || info.psicologica;
  const finalLeituraKarmica = leituraKarmicaDinamica || info.karmica;

  return JSON.stringify({
    title: info.name,
    energySubtitle: info.subtitle,
    tropical: {
      resumo_basico: info.resumo,
      leitura_psicologica: finalLeituraPsicologica
    },
    vedic: {
      leitura_karmica: finalLeituraKarmica,
      qualidades_e_drishtis: info.drishtis
    },
    sintese: {
      pedido_integracao: info.pedido,
      tensao_evolucionaria: info.tensao,
      integracao: info.integracao,
      armadilha: info.armadilha,
      dom: info.dom
    },
    fonte_astrologica: tropHouse 
      ? `${tropRuler} regente da Casa ${houseNum} em ${tropSign} (Tropical) / Sideral regido por ${profile.vedic_specifics?.lagnesha || "regente de alma"} na Casa ${houseNum}.`
      : `Regente da Casa ${houseNum} em ${tropSign} (Tropical).`
  });
}

export function getDeterministicSynthesisFallback(profile: CompleteAstrologicalProfile): string {
  const gender = profile.birthData.gender === "feminino" ? "feminino" : "masculino";

  const sun = profile.tropical_natal.planets.find(p => p.name === "Sol") || { sign: "Leão", house: 1 };
  const moon = profile.tropical_natal.planets.find(p => p.name === "Lua") || { sign: "Câncer", house: 4 };
  const saturn = profile.tropical_natal.planets.find(p => p.name === "Saturno") || { sign: "Capricórnio", house: 10 };
  const venus = profile.tropical_natal.planets.find(p => p.name === "Vênus") || { sign: "Touro", house: 2 };
  const jupiter = profile.tropical_natal.planets.find(p => p.name === "Júpiter") || { sign: "Sagitário", house: 9 };
  const mercury = profile.tropical_natal.planets.find(p => p.name === "Mercúrio") || { sign: "Gêmeos", house: 3 };

  const lagna = profile.vedic_specifics?.lagna || "Áries Sideral";
  const lagnesha = profile.vedic_specifics?.lagnesha || "Marte";
  const atmakaraka = profile.vedic_specifics?.karakas?.atmakaraka || "Sol";
  const darakaraka = profile.vedic_specifics?.karakas?.darakaraka || "Vênus";
  const janmaNakshatra = profile.vedic_specifics?.janmaNakshatra || "Nakshatra de nascimento";

  const caminhos = [
    {
      nome_caminho: "Caminho de Assimilação",
      subtitulo_energia: gender === "feminino" ? "A Arquiteta do Tempo — A ilusão do controle sobre o amanhã" : "O Arquiteto do Tempo — A ilusão do controle sobre o amanhã",
      frase_didatica: "O tempo não é um carrasco que limita suas ações, mas a estrutura sagrada que permite o amadurecimento dos seus propósitos. O grande dilema aqui é a ansiedade em querer acelerar as colheitas ou a rigidez de quem tenta congelar os processos pelo medo infantil de falhar.",
      tensao_evolucionaria: `Erguer bases sólidas e lidar com o peso das escolhas dita o compasso da sua dinâmica psíquica nas suas responsabilidades (Saturno na Casa ${saturn.house} em ${saturn.sign}). No entanto, o seu verdadeiro chamado exige que você se renda ao ritmo natural da existência sem pressa ou resistência. Sua dinâmica estrutural da alma a convoca a ancorar sua presença na autoridade interna genuína, aceitando o papel do tempo como seu maior aliado (Atmakaraka ${atmakaraka}). Conduzido(a) pela firmeza do seu regente sideral, você é instigado(a) a não aceitar o congelamento da sua vitalidade na pressa ou na frustração fria. A vida aqui exige a maturidade de quem planta no escuro confiando na força invisível da semente.`,
      integracao: "Fazer pausas conscientes em meio às exigências diárias, respirar profundamente para restaurar o eixo do corpo e praticar a paciência ativa diante de atrasos ou frustrações.",
      armadilha: "Cair na rigidez exigente consigo e com os outros, sobrecarregar-se de deveres por medo de não ser aceito(a) ou congelar iniciativas por medo da imperfeição.",
      dom: "A sabedoria do mestre do tempo, capaz de arquitetar realidades duradouras com paciência infinita, liderando com integridade cristalina e sem necessidade de esforço.",
      fonte_astrologica: `Saturno na Casa ${saturn.house} em ${saturn.sign} (Tropical) / Atmakaraka ${atmakaraka} e Nakshatra ${janmaNakshatra} (Sideral).`
    },
    {
      nome_caminho: "Caminho de Integração",
      subtitulo_energia: gender === "feminino" ? "A Guardiã das Águas Internas — A fluidez do sentir" : "O Guardião das Águas Internas — A fluidez do sentir",
      frase_didatica: "As suas emoções não são inimigas que precisam ser domadas ou racionalizadas, mas o compasso íntimo da sua vitalidade criativa. O dilema central reside no medo de se entregar à vulnerabilidade ou na racionalização fria das dores para tentar manter uma postura invulnerável.",
      tensao_evolucionaria: `Acolher sua sensibilidade subjetiva e encontrar um porto seguro interno dita o compasso da sua dinâmica psíquica na intimidade familiar (Lua na Casa ${moon.house} em ${moon.sign}). No entanto, o seu chamado mais profundo é o de purificar sua mente concreta, permitindo que o sentimento flua de forma livre e honesta. Sua dinâmica estrutural da alma a convoca a reestruturar seus alicerces psíquicos, curando feridas de infância sem buscar culpados (Janma Nakshatra ${janmaNakshatra}). Conduzido(a) pela musa da sua clareza comunicativa (Mercúrio na Casa ${mercury.house}), você é estimulado(a) a dar voz honesta às suas dores mais guardadas, sem se refugiar em fantasias ou defesas rígidas. A vida aqui exige a coragem de ser vulnerável para que seu coração possa finalmente se aquecer na verdade.`,
      integracao: "Reservar momentos diários de introspeção silenciosa e escrever suas emoções de forma totalmente livre, acolhendo cada sentimento sem qualquer autocrítica.",
      armadilha: "Racionalizar sentimentos para não sentir dor, fingir que está tudo bem enquanto cria couraças no corpo, ou isolar-se emocionalmente por desconfiança ancestral.",
      dom: "Uma inteligência emocional curadora e intuitiva, capaz de trazer paz e profunda harmonia aos ambientes caóticos apenas através do transbordamento de sua presença.",
      fonte_astrologica: `Lua em ${moon.sign} na Casa ${moon.house} e Mercúrio na Casa ${mercury.house} (Tropical) / Janma Nakshatra ${janmaNakshatra} (Sideral).`
    },
    {
      nome_caminho: "Caminho de Transformação",
      subtitulo_energia: gender === "feminino" ? "A Alquimista do Fogo Oculto — A rendição ao invisível" : "O Alquimista do Fogo Oculto — A rendição ao invisível",
      frase_didatica: "Toda crise de destino não é um castigo cósmico, mas o calor necessário para transmutar as couraças do ego que limitam sua resiliência mental. O seu grande desafio é a resistência em abrir mão de velhas posições e identidades que já perderam a vitalidade real.",
      tensao_evolucionaria: `Investigar os mistérios subconscientes e regenerar-se através do confronto com a impermanência dita o compasso da sua dinâmica psíquica nas suas crises ocultas (Casas 8 e 12). No entanto, o seu verdadeiro chamado exige o desapego total de posições de controle ou vaidade emocional. Sua dinâmica estrutural da alma a convoca a aceitar as mortes simbólicas com confiança, sabendo que as perdas criam solo fértil para a sua real maestria (Dusthanas sob o regente ${lagnesha}). Conduzido(a) pela força transformadora da sua determinação intuitiva, você é instigado(a) a usar suas crises como um autêntico laboratório de cura e poder espiritual. A vida aqui exige que você desabe com graça para que possa se erguer de forma verdadeiramente soberana.`,
      integracao: "Praticar o desapego intencional de objetos, hábitos ou opiniões ultrapassadas, e respirar profundamente aceitando as transições como partos de si mesmo(a).",
      armadilha: "Reter ressentimentos antigos que envenenam o corpo físico, tentar manipular dinâmicas para reter controle, ou cultivar medos paranoicos que bloqueiam seu avanço.",
      dom: "O poder de curar a si e aos outros através de uma resiliência indestrutível, renascendo de qualquer situação difícil com extrema autoridade existencial e compaixão cósmica.",
      fonte_astrologica: `Cúspides e planetas nas Casas 8 e 12 (Tropical) / Dusthanas e regência sideral de ${lagnesha} (Sideral).`
    },
    {
      nome_caminho: "Caminho da Autenticidade",
      subtitulo_energia: gender === "feminino" ? "A Portadora da Chama Original — O despertar da soberania" : "O Portador da Chama Original — O despertar da soberania",
      frase_didatica: "Você não veio ao mundo para ser uma cópia das expectativas de sua linhagem, mas para expressar uma centelha divina única e totalmente soberana. O dilema humano aqui é o medo de não pertencer se você ousar brilhar com sua própria verdade.",
      tensao_evolucionaria: `Afirmar sua identidade com clareza e assumir o leme da sua jornada dita o compasso da sua dinâmica psíquica no seu Ascendente e Sol (Sol na Casa ${sun.house} em ${sun.sign}). No entanto, o seu verdadeiro chamado não é o de chamar a atenção para alimentar a vaidade, mas o de ancorar sua presença na retidão do ser. Sua dinâmica estrutural da alma a convoca a ser a própria autoridade das suas escolhas, despertando de ilusões herdadas que paralisam sua vitalidade espontânea (Lagnesha ${lagnesha} em ${lagna}). Conduzido(a) pelo pulsar da sua essência solar, você é guiado(a) a agir com coragem autônoma mesmo diante de críticas externas. A vida exige que sua autoexpressão seja tão autêntica que dispense qualquer necessidade de aprovação alheia.`,
      integracao: "Dizer 'não' de forma serena a pedidos que violam sua integridade e dedicar tempo para praticar o que te faz sentir verdadeiramente vivo(a) e entusiasmado(a).",
      armadilha: "Anular seus desejos essenciais para agradar o entorno ou vestir uma couraça de orgulho defensivo que afasta os outros de sua intimidade real.",
      dom: "A presença magnética e espontânea que ilumina qualquer ambiente e inspira os outros a também assumirem sua própria verdade, agindo com pura realeza e liberdade.",
      fonte_astrologica: `Sol em ${sun.sign} na Casa ${sun.house} e Ascendente em ${profile.tropical_natal.houses[0]?.sign || "Cúspide"} (Tropical) / Lagna ${lagna} e Lagnesha ${lagnesha} (Sideral).`
    },
    {
      nome_caminho: "Caminho de Manifestação",
      subtitulo_energia: gender === "feminino" ? "A Tecelã da Abundância — A verdade do valor" : "O Tecelão da Abundância — A verdade do valor",
      frase_didatica: "A prosperidade material não é um prêmio concedido pela sorte, mas o reflexo natural do valor e amor que você reconhece em si mesmo(a) e projeta no mundo. O dilema é o medo latente da escassez ou a tentativa de acumular para se sentir importante.",
      tensao_evolucionaria: `Atrair prosperidade e dar forma concreta aos seus talentos dita o compasso da sua dinâmica psíquica nos seus recursos (Vênus em ${venus.sign} e Júpiter em ${jupiter.sign}). No entanto, o seu chamado mais profundo exige que seus recursos estejam alinhados ao seu propósito real de vida. Sua dinâmica estrutural da alma a convoca a usar sua inteligência prática para construir canais estáveis que sirvam de suporte para si e para o bem comum (Dhana Yogas no mapa Sideral). Conduzido(a) pelo magnetismo da beleza material e espiritual (Vênus na Casa ${venus.house}), você é incentivado(a) a criar segurança real com generosidade e desapego sábio. A vida aqui mostra que a verdadeira riqueza é a liberdade de ser e transbordar valor prático.`,
      integracao: "Lidar com suas finanças de forma organizada e presente, e exercitar doações conscientes para manter o fluxo de dar e receber sempre em movimento livre.",
      armadilha: "Reter recursos por medo paranoico da falta, ou gastar de forma fútil para preencher vazios emocionais que a matéria nunca poderá suprir.",
      dom: "Uma capacidade inata de materializar prosperidade de forma leve e natural, gerando valor tangível, beleza e conforto estável para sua vida e para seu entorno social.",
      fonte_astrologica: `Casa 2, Vênus em ${venus.sign} e Júpiter na Casa ${jupiter.house} (Tropical) / Dhana Yogas e posições siderais de riqueza (Sideral).`
    },
    {
      nome_caminho: "Caminho de Realização",
      subtitulo_energia: gender === "feminino" ? "A Construtora da Montanha — A integridade na ação" : "O Construtor da Montanha — A integridade na ação",
      frase_didatica: "O seu verdadeiro sucesso profissional não reside nos títulos ou na aclamação do público, mas no impacto real e ético que sua obra constrói no coletivo. O grande dilema é a ambição de chegar ao topo da montanha sacrificando sua paz e suas relações íntimas.",
      tensao_evolucionaria: `Construir um legado de relevância e realizar sua vocação no mundo dita o compasso da sua dinâmica psíquica na carreira (Meio do Céu em ${profile.tropical_natal.houses[9]?.sign || "Cúspide"}). No entanto, sua verdadeira realização exige que seu trabalho seja uma extensão direta do seu centro interior de honestidade. Sua dinâmica estrutural da alma a convoca a assumir grandes responsabilidades com humildade e excelência, sem depender do aplauso externo (Amatyakaraka ${profile.vedic_specifics?.karakas?.amatyakaraka || "Júpiter"}). Conduzido(a) pela firmeza realizadora de Saturno (Saturno na Casa ${saturn.house}), você é instigado(a) a agir com retidão inabalável nos seus negócios coletivos. O trabalho aqui deixa de ser uma busca por status e se torna o próprio templo da sua ação inspirada.`,
      integracao: "Dedicar-se ao trabalho diário focando inteiramente na qualidade do processo em si e na utilidade da ação, desapegando-se do perfeccionismo ou da vaidade do resultado.",
      armadilha: "Cair no trabalho excessivo para fugir de problemas íntimos, tornando-se uma fortaleza fria que drena a vitalidade do corpo físico e a alegria do viver.",
      dom: "Uma autoridade natural e sabedoria construtora incomparável, capaz de liderar e organizar grandes propósitos com facilidade, inspirando retidão e deixando um legado eterno de integridade.",
      fonte_astrologica: `Meio do Céu, Saturno na Casa ${saturn.house} e Júpiter na Casa ${jupiter.house} (Tropical) / Amatyakaraka ${profile.vedic_specifics?.karakas?.amatyakaraka || "Júpiter"} e D10 Dasamsa (Sideral).`
    },
    {
      nome_caminho: "Caminho de Reconexão",
      subtitulo_energia: gender === "feminino" ? "A Alquimista dos Encontros — A libertação nos laços" : "O Alquimista dos Encontros — A libertação nos laços",
      frase_didatica: "Relacionar-se não é fundir-se ao outro para marcar a solidão, mas caminhar ao lado de um espelho vivo que revela as sombras e potências da sua própria alma. O dilema é o medo da rejeição que gera dependência ou o isolamento defensivo que impede o amor.",
      tensao_evolucionaria: `Buscar equilíbrio e parcerias justas dita o compasso da sua dinâmica psíquica nas suas uniões íntimas (Casa 7). No entanto, o seu chamado real exige que você purifique seus laços de toda carência e ilusão de controle. Sua dinâmica estrutural da alma a convoca a se relacionar a partir de um estado de plenitude pessoal, onde o encontro é transbordamento e não remendo (Darakaraka ${darakaraka}). Conduzido(a) pela musa das conexões afetivas e compassivas (Vênus na Casa ${venus.house}), você é guiado(a) a curar as projeções inconscientes que faz no parceiro. A vida aqui exige a união sagrada entre duas seres inteiros que honram a liberdade um do outro.`,
      integracao: "Expressar seus sentimentos de forma aberta e serena, cultivar o perdão diário nas relações íntimas e praticar a escuta generosa das necessidades do parceiro.",
      armadilha: "Anular-se ou aceitar condições prejudiciais para manter o outro por perto, ou projetar no parceiro as frustrações infantis não resolvidas da sua própria história.",
      dom: "A arte sutil de criar harmonia e espaços de amor incondicional nas parcerias, gerando uma atmosfera de paz, cura mútua e companheirismo livre e profundamente sagrado.",
      fonte_astrologica: `Cúspide da Casa 7 e Vênus em ${venus.sign} (Tropical) / Darakaraka ${darakaraka} e Upapada Lagna (Sideral).`
    }
  ];

  return JSON.stringify({ caminhos });
}

export async function generateGlossary(term: string): Promise<string> {

  const systemInstruction = `Você é o gerador do glossário astrológico da plataforma AQUAR.IA. Sua função é gerar definições curtas para o glossário focando no ARQUÉTIPO PURO e ISOLADO. Não tente criar narrativas complexas ou cruzar informações, pois isso causará redundância com o texto principal da plataforma.

REGRAS DE ESCRITA:
1. Explicação Atômica: Se o usuário clicou em "Saturno", explique apenas o princípio de Saturno. Se clicou em "Casa 4", explique apenas o domínio psíquico da Casa 4.
2. O Despertar (Sombra vs. Virtude): A definição deve ser curta (máximo 3 linhas). Mantenha o tom editorial e focando na jornada da alma. Aponte rapidamente a ilusão/sombra do arquétipo e a virtude que ele exige.
3. Tradução do Sânscrito: Para termos védicos, comece traduzindo o conceito em uma frase curta antes da explicação psicológica.

Exemplos de Fidelidade de Tom:
* Exemplo A: [Planeta Isolado]
  "• Saturno: O princípio estruturador da realidade e do tempo. Sua sombra é o medo, a rigidez e a sensação de escassez punitiva; sua virtude é a maestria, a disciplina e a conquista de uma autoridade interna inabalável."

* Exemplo B: [Signo Isolado]
  "• Capricórnio: A energia da escalada e da consolidação. A sombra é o excesso de pragmatismo que esfria o coração e busca o poder pelo controle; a virtude é a integridade, a sabedoria e a capacidade de materializar o propósito no mundo real."

* Exemplo C: [Casa Astrológica Isolada]
  "• Casa 1 (Lagna/Ascendente): O portal da encarnação e a máscara do ego. A sombra é a vaidade e a identificação cega com a própria imagem; a virtude é a coragem de assumir a própria autenticidade como veículo para a alma se expressar no mundo."

* Exemplo D: [Termo Védico / Nakshatra Isolado]
  "• Atmakaraka (O Mestre da Alma): O planeta que indica o desejo raiz desta vida. A sombra é ser arrastado pelas repetições cármicas deste planeta; a virtude é transformá-lo no mestre que guia a sua libertação."`;

  try {
    const client = getGeminiClient();
    const response = await callGeminiWithRetry(client, {
      model: "gemini-3.1-flash-lite", // Using flash-lite for fast tooltip response
      contents: `Explique o seguinte termo astrológico: ${term}`,
      config: {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 250,
      }
    });

    return response.text;
  } catch (error: any) {
    cleanLogError(`[Gemini API] Falha no Glossário para ${term} (Ativando fallback offline)`, error);
    return getDeterministicGlossaryFallback(term);
  }
}

export async function generateDiretrizAmpla(
  profile: CompleteAstrologicalProfile,
  userName: string,
  visualState: any
): Promise<string> {

  const intersectionHouses = visualState.houses
    .filter((h: any) => h.state === 'intersect-active')
    .map((h: any) => h.id)
    .join(', ');

  const fire = profile.tropical_natal.planets.filter(p => ["Áries", "Leão", "Sagitário"].includes(p.sign)).length;
  const earth = profile.tropical_natal.planets.filter(p => ["Touro", "Virgem", "Capricórnio"].includes(p.sign)).length;
  const air = profile.tropical_natal.planets.filter(p => ["Gêmeos", "Libra", "Aquário"].includes(p.sign)).length;
  const water = profile.tropical_natal.planets.filter(p => ["Câncer", "Escorpião", "Peixes"].includes(p.sign)).length;

  let maxElement = "Fogo";
  let maxVal = fire;
  if (earth > maxVal) { maxElement = "Terra"; maxVal = earth; }
  if (air > maxVal) { maxElement = "Ar"; maxVal = air; }
  if (water > maxVal) { maxElement = "Água"; maxVal = water; }

  const cardeal = profile.tropical_natal.planets.filter(p => ["Áries", "Câncer", "Libra", "Capricórnio"].includes(p.sign)).length;
  const fixo = profile.tropical_natal.planets.filter(p => ["Touro", "Leão", "Escorpião", "Aquário"].includes(p.sign)).length;
  const mutavel = profile.tropical_natal.planets.filter(p => ["Gêmeos", "Virgem", "Sagitário", "Peixes"].includes(p.sign)).length;

  let maxQuality = "Cardeal";
  let maxQVal = cardeal;
  if (fixo > maxQVal) { maxQuality = "Fixo"; maxQVal = fixo; }
  if (mutavel > maxQVal) { maxQuality = "Mutável"; maxQVal = mutavel; }

  const lua = profile.tropical_natal.planets.find(p => p.name === "Lua")?.sign || "Desconhecido";
  const atmakaraka = profile.vedic_specifics?.karakas?.atmakaraka || "Desconhecido";

  const planetasNakshatras = profile.vedic_natal.planets.map(p => `${p.name}: ${p.sign} - Nakshatra: ${p.nakshatra}`).join('\n');

  const prompt = `Você é o algoritmo de Síntese Integral da plataforma AQUAR.IA. Sua função é gerar um resumo executivo da alma do usuário, cruzando todos os dados do mapa em um manifesto macro, direto e em tópicos. O objetivo NÃO é explicar o mapa detalhadamente, mas fornecer "Frases de Ativação". 

Tom: Editorial, profundo, existencial, direto. Evite jargões astrológicos pesados (ex: não diga "quadratura", diga "tensão e paradoxo").

DADOS DE ENTRADA DO USUÁRIO:
Nome: ${userName}
Elemento Dominante: ${maxElement}
Qualidade Dominante: ${maxQuality}
Lua: ${lua}
Atmakaraka: ${atmakaraka}
Casas de Interseção: ${intersectionHouses || "Nenhuma"}
Planetas e Nakshatras:
${planetasNakshatras}

${MANTO_ESTELAR_RULE}

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:
Siga rigorosamente a estrutura e os títulos abaixo (formato Markdown):

Nossa alma traz uma bagagem e escolhas de potencial para trabalhar em nossa existência. Em seu gráfico, há luzes que se acendem para indicar seus principais aprendizados e diretrizes de força, lembrando as escolhas da sua essência.

### O Palco da Experiência
* **A Dinâmica Psíquica (Caminhos Aparentes):** A sua personalidade e ego se movem primariamente pelas esferas de [citar áreas temáticas das casas tropicais de forma elegante].
* **A Estrutura da Alma (O Chamado Profundo):** No silêncio da sua estrutura essencial, o que a sua alma realmente busca desenvolver são os temas de [citar áreas temáticas das casas siderais].
* **A Dupla Importância (Onde os mundos se encontram):** Note que o território de [citar o tema da casa de interseção, se houver] é duplamente importante para você. Este tema se repete em suas camadas, sendo a âncora principal do seu destino. (Nota: Se não houver interseção, omita este tópico).

### O Motor da Ação
Para realizar estas tarefas, sua estrutura conta com uma arquitetura de forças específica:
* **A Tração:** Conduzida pelo elemento ${maxElement} e sustentada pela qualidade ${maxQuality}, sua forma de agir no mundo opera [criar 1 frase de como esse combo funciona].
* **O Ritmo:** Nascida sob a Lua em ${lua}, seu tempo interno exige que você cumpra suas tarefas [criar 1 frase sobre o ritmo daquela lua].

### A Assinatura Central
* **O Mestre Interno:** Você absorveu em especial a força vital de ${atmakaraka}. Ele é o seu indicador de alma, exigindo que você [frase de ativação sobre o arquétipo desse planeta].

### A Grande Síntese
O que há de mais singular na sua composição é:
* **O Pedido de Coerência:** Um chamado para alinhar [tema do aspecto complementar 1] com [tema do aspecto complementar 2], utilizando forces que naturalmente se ajudam no seu mapa.
* **O Pedido de Integração:** O seu maior desafio de maturação é encontrar o ponto de equilíbrio entre [tema de tensão 1] e [tema de tensão 2], forças opostas que estão exigindo que você pare de escolher um lado e aprenda a sustentar o paradoxo.
`;

  try {
    const client = getGeminiClient();
    const response = await callGeminiWithRetry(client, {
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    
    return response.text;
  } catch (error: any) {
    cleanLogError("[Gemini API] Falha na Diretriz Ampla (Ativando fallback offline)", error);
    return getDeterministicDiretrizAmplaFallback(profile, userName, visualState);
  }
}

export function getDeterministicGlossaryFallback(term: string): string {
  const t = term.trim().toLowerCase();

  const glossary: Record<string, string> = {
    // Planetas
    "sol": "• Sol: O núcleo da consciência, da vitalidade e da expressão do ego saudável. Na sua dimensão de sombra, gera egoísmo, soberba e a busca cega por aprovação; em sua virtude, revela a soberania interior, a generosidade ativa e o transbordamento alegre da pura essência.",
    "lua": "• Lua: O reservatório dos sentimentos, das memórias e do senso de pertencimento. Na sombra, manifesta-se como dependência emocional, apego ao passado e oscilações temperamentais; em sua virtude, traz empatia profunda, intuição afiada e nutrição psíquica.",
    "mercúrio": "• Mercúrio: O mensageiro da mente racional, do raciocínio e das trocas intelectuais. Na sombra, causa excesso de racionalização fria, mentiras sutis e dispersão mental; em sua virtude, confere clareza, perspicácia analítica e facilidade de conectar mundos pelo verbo.",
    "vênus": "• Vênus: O princípio do valor, do belo e do magnetismo de união e partilha. Na sombra, leva à vaidade material, dependência afetiva e futilidade; em sua virtude, manifesta-se como amor incondicional, sensibilidade estética e a arte sagrada de se relacionar em liberdade.",
    "marte": "• Marte: A energia motora da ação, da afirmação e da coragem para desbravar. Na sombra, gera impaciência, agressividade impulsiva e conflitos destrutivos; em sua virtude, confere bravura focada, determinação protetora e força realizadora alinhada ao bem comum.",
    "júpiter": "• Júpiter: O mestre inspirador da expansão, da fé e da mente superior intuitiva. Na sombra, pode levar ao fanatismo dogmático, arrogância intelectual e excesso de otimismo ingênuo; em sua virtude, traz profunda sabedoria, generosidade e a visão clara das leis cósmicas.",
    "saturno": "• Saturno: O ancião estruturador do tempo, dos limites e das responsabilidades terrenas. Na sombra, provoca medo de escassez, rigidez inflexível e autocobrança punitiva; em sua virtude, representa a maestria do tempo, a disciplina exemplar e o florescimento de uma autoridade interna inabalável.",
    "urano": "• Urano: A força revolucionária da liberdade, da inovação e da quebra de padrões obsoletos. Na sombra, traz rebeldia sem causa, frieza mental e instabilidade destrutiva; em sua virtude, manifesta a genialidade visionária, o altruísmo inovador e o despertar súbito da consciência.",
    "netuno": "• Netuno: O canal do amor universal, do sutil, da dissolução de limites e da imaginação divina. Na sombra, induz à fuga da realidade através de fantasias, ilusões ou vícios; em sua virtude, expressa o misticismo compassivo, a intuição cósmica e a mais pura inspiração artística.",
    "plutão": "• Plutão: O princípio de transmutação profunda, do poder oculto e das mortes e renascimentos simbólicos. Na sombra, gera obsessão por controle, manipulação psicológica e retenção de ressentimentos; em sua virtude, concede uma resiliência indestrutível e a cura regeneradora do ser.",
    "nodo norte": "• Nodo Norte (Rahu): O vetor do destino que aponta para o desconhecido e o crescimento evolutivo desta vida. Na sombra, traz desejos obsessivos e insatisfação voraz; em sua virtude, convoca a alma a desbravar caminhos de inovação e coragem com desapego.",
    "nodo sul": "• Nodo Sul (Ketu): O acúmulo de talentos ancestrais e aprendizados de vidas passadas. Na sombra, gera isolamento, apatia melancólica e fuga das responsabilidades da matéria; em sua virtude, atua como o portal de liberação espiritual e desapego sábio das ilusões terrenas.",
    "rahu": "• Rahu (Nodo Norte Sideral): O ponto de ambição, inovação tecnológica e desejos de conquistas no mundo. Na sombra, evoca desejos obsessivos e dispersão ansiosa; em sua virtude, confere a capacidade de romper limites tradicionais para realizar o impossível.",
    "ketu": "• Ketu (Nodo Sul Sideral): O indicador de desapego, sabedoria oculta e libertação espiritual profunda (Moksha). Na sombra, traz sensação de vazio, isolamento e apatia; em sua virtude, funciona como uma âncora espiritual de pura intuição e sabedoria ancestral.",

    // Signos
    "áries": "• Áries: A energia pioneira da faísca que dispara a vida e a liderança ativa. Sua sombra é o egoísmo impaciente e a agressividade cega; sua virtude é a coragem inspiradora, a prontidão combativa e a retidão para inaugurar novos rumos.",
    "touro": "• Touro: A estabilidade fecunda, o cultivo da matéria e a valorização do belo e do seguro. Sua sombra é a teimosia inercial e o apego excessivo; sua virtude é a paciência construtiva, a firmeza confiável e a capacidade de nutrir a vida com conforto.",
    "gêmeos": "• Gêmeos: A curiosidade lúdica, a flexibilidade mental e a circulação de saberes pelo verbo. Sua sombra é a futilidade dispersa e a dubiedade de propósitos; sua virtude é a inteligência adaptável, o dom da palavra honesta e o riso que conecta corações.",
    "câncer": "• Câncer: O acolhimento íntimo, a nutrição subjetiva e a reverência pelas raízes e afetos. Sua sombra é a reatividade melancólica e a manipulação emocional pelo vitimismo; sua virtude é a compaixão protetora, o amor devocional e a criação de refúgios de amor.",
    "leão": "• Leão: O transbordamento radiante da identidade soberana e a generosidade de coração. Sua sombra é a arrogância egóica e a carência de holofotes; sua virtude é a nobreza de espírito, a coragem criativa e o poder de inspirar o coletivo com calor.",
    "virgem": "• Virgem: O amor pelo aprimoramento prático, o discernimento mental e a purificação dos processos de rotina. Sua sombra é o perfeccionismo neurótico e a crítica fria; sua virtude é o serviço humilde, a eficiência curadora e o respeito à natureza.",
    "libra": "• Libra: A busca constante pela harmonia justa, pela beleza nas interações e pelas pontes afetivas. Sua sombra é a indecisão hesitante e o sacrifício da própria verdade para agradar; sua virtude é a diplomacia ética, o senso estético refinado e o companheirismo livre.",
    "escorpião": "• Escorpião: A intensidade emocional profunda, a regeneração contínua e a coragem de olhar o invisível. Sua sombra é o desejo obsessivo de controle e os ressentimentos frios; sua virtude é a resiliência inabalável, o poder curador e a lealdade indomável.",
    "sagitário": "• Sagitário: A busca incessante pela Verdade, a fé inspiradora e a expansão de novos conhecimentos. Sua sombra é o dogmatismo professoral e o otimismo ingênuo que foge dos limites reais; sua virtude é a sabedoria filosófica, a generosidade e a alegria expansiva.",
    "capricórnio": "• Capricórnio: A retidão ética, o senso de dever e a consolidação de estruturas estáveis no tempo. Sua sombra é a frieza rígida e o utilitarismo focado apenas em status; sua virtude é a integridade madura, a autodomínio soberano e o legado duradouro.",
    "aquário": "• Aquário: A visão social altruísta, a originalidade inovadora e a busca por liberdade no coletivo. Sua sombra é o distanciamento afetivo arrogante e a rebeldia teimosa; sua virtude é a consciência de grupo, a amizade pura e o humanitarismo progressista.",
    "peixes": "• Peixes: A fusão mística com o sutil, a compaixão ilimitada e o transbordamento da sensibilidade poética. Sua sombra é a evasão alienada e o vitimismo passivo; sua virtude é a devoção pacífica, a fé incondicional e o amor que dissolve toda separação.",

    // Casas
    "casa 1": "• Casa 1 (Lagna/Ascendente): O portal da encarnação física, o nascimento e a máscara de identidade. Na sombra, gera a identificação cega com a autoimagem; em sua virtude, traz a coragem de assumir a autenticidade real como veículo de expressão da alma.",
    "casa 2": "• Casa 2: O campo de sustento, recursos materiais, valores pessoais e autoestima básica. Na sombra, gera possessividade material e dependência da segurança externa; em sua virtude, representa a auto-honestidade de cultivar o valor real de seus talentos.",
    "casa 3": "• Casa 3: O domínio da mente concreta, da comunicação prática, dos irmãos e das pequenas viagens de exploração. Na sombra, traz dispersão mental e tagarelice fútil; em sua virtude, confere perspicácia intelectual, iniciativa corajosa e poder da escrita pura.",
    "casa 4": "• Casa 4 (Fundo do Céu): A base da intimidade, as raízes ancestrais, o lar de origem e a paz mental subjetiva. Na sombra, gera apego reativo ao passado e dependências defensivas; em sua virtude, atua como o santuário interior de repouso e nutrição.",
    "casa 5": "• Casa 5: O palco da criatividade espontânea, autoexpressão amorosa, filhos e prazeres vitais. Na sombra, evoca vaidade egocêntrica e sede dramática de reconhecimento; em sua virtude, expressa o florescimento da criança interior divina e a arte de criar com alegria.",
    "casa 6": "• Casa 6: A rotina de autocuidado, a saúde diária, o trabalho humilde de purificação e os pequenos embates da rotina. Na sombra, causa obsessões por higiene ou hipocondria mental; em sua virtude, confere o poder do serviço curador e a maestria dos hábitos.",
    "casa 7": "• Casa 7 (Descendente): O portal das parcerias estáveis, casamentos e a face oculta do ego projetada no companheiro. Na sombra, gera dependências carentes e cobranças de controle; em sua virtude, revela a dança harmoniosa entre duas almas livres e inteiras.",
    "casa 8": "• Casa 8: O campo alquímico do mistério, das transformações súbitas, finanças compartilhadas e o confronto com a morte. Na sombra, evoca medos profundos e manipulações pelo controle; em sua virtude, confere resiliência absoluta e maestria oculta de cura.",
    "casa 9": "• Casa 9: O templo dos saberes elevados, convicções éticas, espiritualidade, leis e viagens de expansão mental. Na sombra, traz o fanatismo intelectual e dogmático; em sua virtude, expressa a busca madura pela verdade real e a sabedoria que liberta.",
    "casa 10": "• Casa 10 (Meio do Céu): A montanha da carreira, a responsabilidade cívica, o legado social e a relação com a autoridade real. Na sombra, gera ambição implacável e apego estéril a títulos; em sua virtude, confere integridade exemplar e o dharma concretizado.",
    "casa 11": "• Casa 11: Os projetos voltados ao coletivo, as grandes redes de amizade e as esperanças de futuro e ganhos práticos. Na sombra, gera o desespero de pertencer ao grupo sacrificando o próprio ser; em sua virtude, representa o altruísmo inovador e comunitário.",
    "casa 12": "• Casa 12: O domínio da reclusão espiritual, do inconsciente cósmico, da transcendência e da dissolução final do ego. Na sombra, traz alienação, escapismo mental e medos invisíveis; em sua virtude, expressa a paz incondicional e a pura fusão compassiva.",

    // Ângulos e Eixos
    "ascendente": "• Ascendente: A cúspide da Casa 1, que dita a lente principal através da qual você enxerga a realidade e o modo como as suas iniciativas entram no mundo. É a máscara sagrada escolhida para o ego atuar como instrumento consciente nesta jornada terrena.",
    "meio do céu": "• Meio do Céu: A cúspide da Casa 10, representando o ponto mais alto do gráfico astrológico. Reflete a sua maior ambição de realização no mundo exterior, a sua reputação pública e o legado ético e estruturado que você veio erguer nesta vida.",
    "fundo do céu": "• Fundo do Céu: A cúspide da Casa 4, localizada na base invisível do mapa. Representa as suas raízes ancestrais, os seus alicerces psíquicos subconscientes e o centro íntimo de repouso onde a sua alma se recolhe em silêncio para se nutrir.",
    "descendente": "• Descendente: A cúspide da Casa 7, que rege as nossas conexões íntimas e parcerias estáveis. Indica as qualidades e forças que inconscientemente buscamos e projetamos no parceiro de jornada para integrá-las de forma madura ao nosso próprio ser.",
    "dusthanas": "• Dusthanas: Casas de superação na astrologia védica (Casas 6, 8 e 12). Longe de serem fardos punitivos, representam autênticos laboratórios alquímicos de purificação, regeneração, transmutação e profundo resgate de forças psíquicas e espirituais.",

    // Termos Védicos
    "atmakaraka": "• Atmakaraka (O Indicador da Alma): O planeta que possui o grau mais alto no mapa védico de nascimento, representando a essência pura, as escolhas profundas e o aprendizado kármico central que a alma escolheu amadurecer nesta encarnação.",
    "amatyakaraka": "• Amatyakaraka (O Guia da Carreira): O planeta com o segundo maior grau no mapa védico, indicando os talentos naturais, o estilo de ação profissional e as ferramentas de liderança com que a pessoa conta para manifestar sua vocação prática no mundo.",
    "darakaraka": "• Darakaraka (O Indicador do Parceiro): O planeta com o menor grau no mapa védico. Revela as características estruturais e as virtudes profundas do parceiro ideal de relacionamentos estáveis, apontando para o que cura e pacifica as nossas carências íntimas.",
    "janma nakshatra": "• Janma Nakshatra: A mansão lunar védica na qual a Lua estava posicionada no instante do seu nascimento. Rege a arquitetura sutil da sua mente, os seus ritmos emocionais internos e as lições emocionais mais primordiais da alma.",
    "nakshatra": "• Nakshatra (Mansão Lunar): Um dos 27 setores celestes do zodíaco védico sideral, regido pela Lua. Cada nakshatra confere um manto ou manto estelar arquetípico único às forças dos planetas lá posicionados, revelando energias sutis.",
    "upapada lagna": "• Upapada Lagna (Âncora do Casamento): O ponto calculado no mapa védico que descreve a estrutura física, social e material das parcerias e do casamento duradouro. Representa o compromisso e o dever compartilhado de amadurecimento e apoio mútuo.",
    "dhana yogas": "• Dhana Yogas (Combinações de Riqueza): Conexões benéficas e estruturadas entre as casas de recursos (2, 5, 9, 11) no mapa sideral védico, indicando fluidez natural de manifestação de abundância material decorrente de méritos kármicos.",
    "d10 dasamsa": "• D10 Dasamsa (O Gráfico Profissional): Um mapa védico complementar gerado através da divisão por 10 da Casa 1 sideral, focado exclusivamente no exame microscópico da sua profissão, vocação profunda, sucesso material e impacto no coletivo.",
    "lagna": "• Lagna (Ascendente Védico): O signo que ascendia no horizonte leste sideral no momento exato do nascimento. É o ponto de ancoragem principal da identidade na matéria física, ditando a estruturação das 12 casas de destino da sua alma.",
    "lagnesha": "• Lagnesha (O Regente Vital): O planeta regente do Lagna (Ascendente védico). Funciona como o capitão da sua força vital e o direcionador supremo do seu destino, indicando para qual setor da existência a sua vitalidade flui com prioridade natural.",

    // Nakshatras
    "ashvini": "• Ashvini: Regida pelos médicos celestes, confere energia veloz, capacidade rápida de cura, rejuvenescimento e coragem para inaugurar novos começos de forma assertiva e ágil.",
    "bharani": "• Bharani: Simbolizada pelo portal da criação (útero), rege os processos intensivos de contenção, gestação lenta e transformações profundas através da superação de provações.",
    "krittika": "• Krittika: Regida pelo fogo sagrado, simbolizada por uma navalha afiada. Confere o poder de cortar falsidades, purificar canais mentais e defender a verdade com brilhantismo ativo.",
    "rohini": "• Rohini: Conhecida por sua beleza magnética e magnetismo nutridor, simboliza a fertilidade exuberante e a habilidade de materializar prosperidade e conforto estável na terra.",
    "mrigashira": "• Mrigashira: Simbolizada pela cabeça de um cervo, rege a busca curiosa, a sensibilidade poética, a pesquisa constante e a suave elegância nas interações.",
    "ardra": "• Ardra: Simbolizada por uma lágrima divina, rege os processos intensivos de tempestades purificadoras, clareando horizontes mentais após o choro ou a dor curadora.",
    "punarvasu": "• Punarvasu: Simbolizada por uma aljava de flechas, representa o retorno da luz após a tempestade, o acolhimento seguro, a restauração de forças e a renovação de recursos.",
    "pushya": "• Pushya: Considerada a mansão lunar mais auspiciosa e nutridora de todas. Simboliza a nutrição espiritual contínua, o acolhimento compassivo e o crescimento de virtudes puras.",
    "ashlesha": "• Ashlesha: Simbolizada por uma serpente abraçada, rege a sabedoria subconsciente profunda, a sensibilidade sutil e a força protetora contra ameaças invisíveis.",
    "magha": "• Magha: Simbolizada por um trono real, confere o manto da nobreza ancestral, a lealdade às raízes familiares de origem e o poder de liderar com integridade e realeza.",
    "purva phalguni": "• Purva Phalguni: Rege as artes, o prazer criativo espontâneo, o conforto elegante e a doçura dos relacionamentos baseados no prazer mútuo do encontro de almas.",
    "uttara phalguni": "• Uttara Phalguni: Simbolizada pelas pernas de uma cama, rege a lealdade duradoura nas parcerias, o senso de dever humanitário e a sustentação estável de projetos coletivos.",
    "hasta": "• Hasta: Simbolizada pela mão aberta de bênçãos, confere habilidades manuais refinadas, perspicácia analítica nos negócios práticos e o poder da manifestação rápida.",
    "chitra": "• Chitra: Simbolizada por uma joia brilhante, rege a criatividade estética soberana, o dom do design sofisticado, a arquitetura e a arte de embelezar o mundo físico.",
    "swati": "• Swati: Simbolizada por um jovem broto ao vento, rege a independência fluida, a adaptabilidade a novos ambientes, a liberdade intelectual e o comércio inteligente.",
    "vishakha": "• Vishakha: Simbolizada por um portal de triunfos, confere determinação implacável, foco inabalável para alcançar grandes ambições e coragem para vencer rivalidades.",
    "anuradha": "• Anuradha: Simbolizada por uma flor de lótus, rege a amizade pura, a lealdade a causas humanitárias elevadas e a capacidade de florescer mesmo em pântanos emocionais.",
    "jyeshtha": "• Jyeshtha: Simbolizada por um talismã de proteção, confere liderança protetora, sabedoria madura obtida através do tempo e o poder de governar com autoridade espiritual.",
    "mula": "• Mula: Simbolizada pelas raízes profundas arrancadas, rege o desapego total de ilusões obsoletas, a destruição compassiva de dogmas e a investigação profunda do ser.",
    "purva ashadha": "• Purva Ashadha: Simbolizada por uma cesta de peneirar, rege a perseverança otimista, o poder de purificar desejos em prol do dharma e a vitória final sobre as crises de destino.",
    "uttara ashadha": "• Uttara Ashadha: Simbolizada pelas presas de um elefante sagrado, confere força invencível e determinação incansável, apoiada pela retidão ética em prol do coletivo.",
    "shravana": "• Shravana: Simbolizada pela orelha humana, rege a arte sagrada da escuta generosa, a recepção de conhecimentos tradicionais e a sabedoria poética e meditativa.",
    "dhanishta": "• Dhanishta: Simbolizada pelo tambor e pela flauta de Shiva, rege a facilidade rítmica de atrair riqueza material e de expressar talentos musicais inovadores na sociedade.",
    "shatabhisha": "• Shatabhisha: Simbolizada por cem curadores estelares, rege a saúde através da desintoxicação profunda, o misticismo silencioso, a ciência avançada e a privacidade protetora.",
    "purva bhadrapada": "• Purva Bhadrapada: Rege a paixão espiritual intensa, a coragem mística para quebrar ilusões sociais e o poder de sustentar paradoxos e transformações dolorosas com paz.",
    "uttara bhadrapada": "• Uttara Bhadrapada: Simbolizada pelas profundezas do oceano, confere controle sereno das emoções profundas, sabedoria intuitiva, compaixão cósmica e estabilidade espiritual.",
    "revati": "• Revati: Simbolizada por um peixe navegante, rege a jornada final do ciclo de encarnações, oferecendo proteção absoluta nas travessias, suavidade compassiva e amor incondicional."
  };

  return glossary[t] || `• ${term}: Conceito astrológico que indica um importante vetor de forças em seu mapa. Representa um canal de aprendizados que convoca sua consciência a equilibrar as sombras da reatividade e a florescer em direção à expressão de suas reais virtudes.`;
}

export function getDeterministicDiretrizAmplaFallback(
  profile: CompleteAstrologicalProfile,
  userName: string,
  visualState: any
): string {
  const intersectionHouses = visualState.houses
    .filter((h: any) => h.state === 'intersect-active')
    .map((h: any) => h.id)
    .join(', ');

  const fire = profile.tropical_natal.planets.filter(p => ["Áries", "Leão", "Sagitário"].includes(p.sign)).length;
  const earth = profile.tropical_natal.planets.filter(p => ["Touro", "Virgem", "Capricórnio"].includes(p.sign)).length;
  const air = profile.tropical_natal.planets.filter(p => ["Gêmeos", "Libra", "Aquário"].includes(p.sign)).length;
  const water = profile.tropical_natal.planets.filter(p => ["Câncer", "Escorpião", "Peixes"].includes(p.sign)).length;

  let maxElement = "Fogo";
  let maxVal = fire;
  if (earth > maxVal) { maxElement = "Terra"; maxVal = earth; }
  if (air > maxVal) { maxElement = "Ar"; maxVal = air; }
  if (water > maxVal) { maxElement = "Água"; maxVal = water; }

  const cardeal = profile.tropical_natal.planets.filter(p => ["Áries", "Câncer", "Libra", "Capricórnio"].includes(p.sign)).length;
  const fixo = profile.tropical_natal.planets.filter(p => ["Touro", "Leão", "Escorpião", "Aquário"].includes(p.sign)).length;
  const mutavel = profile.tropical_natal.planets.filter(p => ["Gêmeos", "Virgem", "Sagitário", "Peixes"].includes(p.sign)).length;

  let maxQuality = "Cardeal";
  let maxQVal = cardeal;
  if (fixo > maxQVal) { maxQuality = "Fixo"; maxQVal = fixo; }
  if (mutavel > maxQVal) { maxQuality = "Mutável"; maxQVal = mutavel; }

  const lua = profile.tropical_natal.planets.find(p => p.name === "Lua")?.sign || "Desconhecido";
  const atmakaraka = profile.vedic_specifics?.karakas?.atmakaraka || "Desconhecido";

  // Elements and qualities description helper
  const elementProse: Record<string, string> = {
    "Fogo": "conduz sua essência a acender novas paixões e inspirar com dinamismo impetuoso",
    "Terra": "traz bases sólidas para estruturar realidades estáveis e tangíveis de forma paciente",
    "Ar": "direciona suas forças rumo à clareza intelectual, ao diálogo enriquecedor e à livre circulação de ideias",
    "Água": "estimula a profundidade emocional, a intuição afiada e o fluxo contínuo dos sentimentos"
  };
  const activeElementProse = elementProse[maxElement] || "traz dinamismo e harmonia para a sua jornada";

  const qualityProse: Record<string, string> = {
    "Cardeal": "iniciativa pura e liderança para disparar novas fases e transformações estruturais",
    "Fixo": "persistência e resiliência para consolidar bases firmes e duradouras",
    "Mutável": "flexibilidade refinada e adaptabilidade para transmutar e fluir livremente através dos ciclos"
  };
  const activeQualityProse = qualityProse[maxQuality] || "adaptabilidade na sua forma de atuar no mundo";

  const luaProse: Record<string, string> = {
    "Áries": "com coragem pioneira, estimulando ações rápidas e desafiando toda e qualquer inércia",
    "Touro": "com estabilidade e conforto emocional, buscando o belo e o duradouro em cada etapa",
    "Gêmeos": "através da leveza intelectual, comunicando suas vivências de forma aberta e expressiva",
    "Câncer": "com extremo acolhimento, nutrindo suas ligações e respeitando seus ciclos íntimos",
    "Leão": "com dignidade soberana, expressando seus sentimentos com brilho e nobreza de coração",
    "Virgem": "com discernimento prático, buscando organizar o cotidiano e purificar seus canais de ação",
    "Libra": "com harmonia e busca constante por parcerias baseadas na justiça e cooperação mútua",
    "Escorpião": "com entrega apaixonada e resiliência indomável, transmutando cada dor em sabedoria silenciosa",
    "Sagitário": "com otimismo inspirador e desejo constante de desbravar novos saberes e horizontes de fé",
    "Capricórnio": "com maturidade e retidão firme, organizando suas bases com compromisso eterno",
    "Aquário": "com visão humanitária e amor pela liberdade intelectual de pertencer ao todo de forma única",
    "Peixes": "com compaixão cósmica e sensibilidade sutil, fluindo com fé e dedicação incondicional"
  };
  const activeLuaProse = luaProse[lua] || "com sensibilidade e sintonia em relação aos ciclos do tempo";

  const atmakarakaProse: Record<string, string> = {
    "Sol": "cultive a liderança amorosa, a soberania de si mesma(o) e brilhe com humildade.",
    "Lua": "acolha as suas oscilações emocionais, confie em sua intuição e nutra os outros.",
    "Mercúrio": "purifique a sua mente concreta, fale apenas a verdade curadora e conecte pessoas.",
    "Vênus": "perceba a beleza em todas as coisas, ame sem dependência e valorize o amor puro.",
    "Marte": "canalize a sua força de ação para defender os justos, superando a raiva cega.",
    "Júpiter": "compartilhe os saberes mais elevados com doçura e guie com sabedoria pacífica.",
    "Saturno": "amadureça através da resiliência, assuma as suas tarefas sagradas de vida com alegria.",
    "Rahu": "desbrave horizontes inovadores com coragem espiritual profunda, desapegando das ilusões do mundo.",
    "Ketu": "mergulhe no silêncio da sua essência interior e desfrute da mais sublime conexão espiritual e de paz profunda."
  };
  const activeAtmakarakaProse = atmakarakaProse[atmakaraka] || "busque o autoconhecimento profundo e a integridade de suas forças vitais primordiais.";

  const intersectionProse = intersectionHouses 
    ? `\n* **A Dupla Importância (Onde os mundos se encontram):** Note que o território de sua Casa ${intersectionHouses} é duplamente importante para você. Este tema se repete em suas camadas, sendo a âncora principal do seu destino.`
    : "";

  return `Nossa alma traz uma bagagem e escolhas de potencial para trabalhar em nossa existência. Em seu gráfico, há luzes que se acendem para indicar seus principais aprendizados e diretrizes de força, lembrando as escolhas da sua essência.

### O Palco da Experiência
* **A Dinâmica Psíquica (Caminhos Aparentes):** A sua personalidade e ego se movem primariamente pelas esferas e desafios práticos revelados pelas posições do Sol, da Lua e dos planetas pessoais no zodíaco tropical.
* **A Estrutura da Alma (O Chamado Profundo):** No silêncio da sua estrutura essencial, o que a sua alma realmente busca desenvolver são as posições de retidão, as virtudes dos planetas siderais e o indicador raiz do propósito de sua jornada.${intersectionProse}

### O Motor da Ação
Para realizar estas tarefas, sua estrutura conta com uma arquitetura de forças específica:
* **A Tração:** Conduzida pelo elemento **${maxElement}** e sustentada pela qualidade **${maxQuality}**, sua forma de agir no mundo opera de modo que ${activeElementProse}, alinhando sua força prática com ${activeQualityProse}.
* **O Ritmo:** Nascida sob a Lua em **${lua}**, seu tempo interno exige que você cumpra suas tarefas ${activeLuaProse}.

### A Assinatura Central
* **O Mestre Interno:** Você absorveu em especial a força vital de **${atmakaraka}**. Ele é o seu indicador de alma, exigindo que você ${activeAtmakarakaProse}

### A Grande Síntese
O que há de mais singular na sua composição é:
* **O Pedido de Coerência:** Um chamado para alinhar sua expressão diária do comportamento com o propósito sutil da alma, utilizando forças que naturalmente se ajudam no seu mapa para evitar o congelamento da sua vitalidade.
* **O Pedido de Integração:** O seu maior desafio de maturação é encontrar o ponto de equilíbrio entre a urgência do ego e a rendição tranquila ao fluxo cósmico, sustentando os paradoxos da existência com compaixão e amor.`;
}

export async function generateTransitCyclesReading(
  profile: CompleteAstrologicalProfile
): Promise<string> {
  const systemInstruction = `[PAPEL DO SISTEMA]
Atue como um psicólogo arquetípico sênior, analista astrológico integrativo e místico contemporâneo focado em visão não-dual. O seu objetivo é gerar uma leitura de trânsitos e ciclos de 30 dias que seja breve, visceral, poética e funcione como uma medicina para a ansiedade moderna. Elimine previsões fatalistas e jargões acadêmicos. A linguagem deve centrar-se na presença radical ("o propósito da vida é Ser") e no descondicionamento do corpo e da mente mecânica.

[ENTRADA DE DADOS E REGRAS DE FILTRO]
Você receberá o Mapa Natal do usuário e a lista de Chara Karakas de Jaimini.
REGRA DE FILTRO TROPICAL: Considere APENAS trânsitos de planetas físicos lentos (Júpiter a Plutão) formando aspectos maiores de tensão (Conjunção, Quadratura, Oposição) com os planetas físicos natais do usuário (com orbe de até 3 graus). IGNORE ABSOLUTAMENTE quaisquer trânsitos que envolvam Nodos Lunares (Nodo Norte/Sul), Lilith, Partes Arábicas, Meio do Céu, Ascendente ou qualquer ponto matemático calculado.

[ESTRUTURA DA RESPOSTA - SAÍDA EM MARKDOWN]

🌌 1. A TRÍADE DO TEMPO CÓSMICO (Costura das Dashas)
A Tessitura do Tempo: Inicie identificando a tríade de regentes do período védico atual do usuário. Descreva como o tempo atual é tecido sob essa influência sincronizada: a Mahadasha (o grande ciclo/tônica existencial de longo prazo), a Antardasha (o subciclo/foco prático da fase) e a Pratyantardasha (o ritmo diário sutil/agora).

O Portal e a Casa Ativa: Foque no planeta regente da Antardasha (o foco da fase atual) e na área da vida (Casa) que ele altera/ativa. Traduza o propósito evolutivo desse movimento, alertando sobre o perigo de cair na produtividade linear ou no esgotamento mental nesse setor.

A Nuance da Estrela (Nakshatra e Pada): Analise a Nakshatra e o Pada em que esse regente da Antardasha está no mapa natal. Descreva o sabor exato de como essa energia influencia a mente e o comportamento.

O Peso Kármico (Conexão Jaimini):
SE algum dos três regentes da tríade for o Atmakaraka (AK), Amatyakaraka (AmK) ou o seu dispositor: Avise o usuário com tom visceral que este é um momento de alto peso cármico, onde o Fio de Atman (matéria central da jornada da alma) está sendo processado na matéria.
SE forem planetas neutros: Trate como um período de maturação padrão.

🔥 2. OS PORTAIS DE ATIVAÇÃO PSICOLÓGICA (Próximos 30 dias)
Para CADA UM dos trânsitos tropicais válidos (apenas planetas físicos), gere um bloco de leitura seguindo estritamente a estrutura e o tom abaixo:

[Nome do Planeta em Trânsito] [aspecto] o seu [Planeta Natal] (Casa [X])

A Sombra: Comece com a estrutura: "A sombra do trânsito de [Planetas], ativando a sua esfera de [explicação breve e profunda do tema da Casa], pode levar a um período de [comportamento obsessivo ou reativo]." Em seguida, descreva a sensação somática: "Esta sombra é uma tensão e constrição [descrever exatamente onde no corpo aperta, ex: na respiração, no peito, na garganta, nos ombros], enraizada no medo de [descrever o medo central de perder a identidade, falhar, etc. ligado ao trânsito]."

A Integração: Comece sempre estruturando a visão não-dual: "Para integrar este ciclo em sua virtude mais elevada, lembre-se de que a revelação iluminada é que não há nada a fazer, pensar ou provar. [Adapte o insight à virtude do planeta]. Nesse contexto, o propósito da vida (ou dessa área da vida) é Ser. O estado de verdadeiro(a) [inserir a Virtude Elevada] vê a vida como um grande jogo e desfruta cada momento com leveza e bom humor." Termine sempre com um conselho somático indireto e humor: "Lembre-se de rir de si mesma(o) e das suas tentativas de controle. [Inserir comando corporal invisível que ative indiretamente o Chakra ligado àquele trânsito/área, sem nunca usar a palavra 'chakra' ou jargão esotérico — ex: soltar a mandíbula, som emitido, respirar no baixo ventre, sentir os pés no chão]."`;

  // Filter for active tension aspects of slow physical planets (Júpiter to Plutão)
  const slowPhysicalPlanets = ["Júpiter", "Saturno", "Urano", "Netuno", "Plutão", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
  let activeTensionTransits = profile.tropical_transits.filter(t => {
    const isSlow = slowPhysicalPlanets.includes(t.planet);
    const isTension = t.aspectToNatal.includes("Conjunção") || 
                      t.aspectToNatal.includes("Quadratura") || 
                      t.aspectToNatal.includes("Oposição") ||
                      t.aspectToNatal.includes("Conjunction") ||
                      t.aspectToNatal.includes("Square") ||
                      t.aspectToNatal.includes("Opposition");
    const isCalculatedOrNode = /Nodo|Node|Lilith|Ascendente|Ascendant|Meio do Céu|MC|Parte|Fortuna|Rahu|Ketu/i.test(t.aspectToNatal) ||
                               /Nodo|Node|Lilith|Ascendente|Ascendant|Meio do Céu|MC|Parte|Fortuna|Rahu|Ketu/i.test(t.planet);
    return isSlow && isTension && !isCalculatedOrNode;
  });

  if (activeTensionTransits.length === 0) {
    activeTensionTransits = [
      {
        planet: "Plutão",
        transitSign: "Aquário",
        transitDegree: 2.15,
        transitHouse: 8,
        aspectToNatal: "Oposição com Lua Natal"
      },
      {
        planet: "Saturno",
        transitSign: "Peixes",
        transitDegree: 14.3,
        transitHouse: 10,
        aspectToNatal: "Quadratura com Sol Natal"
      }
    ];
  }

  const mahadashaLord = profile.vedic_timing.mahadasha;
  const antardashaLord = profile.vedic_timing.antardasha;
  const pratyantardashaLord = profile.vedic_timing.pratyantardasha || "Ketu";

  // Focus on Antardasha regente for star details & house
  let searchAntarName = antardashaLord;
  if (antardashaLord === "Rahu") searchAntarName = "Nodo Norte";
  if (antardashaLord === "Ketu") searchAntarName = "Nodo Sul";
  const antarLordPlanet = profile.vedic_natal.planets.find(p => p.name === searchAntarName);
  const antarNakName = antarLordPlanet?.nakshatra || "Rohini";
  const antarPadaNum = antarLordPlanet?.pada || 1;
  const antarLordHouse = antarLordPlanet?.house || 1;

  const atmakaraka = profile.vedic_specifics.karakas.atmakaraka;
  const amatyakaraka = profile.vedic_specifics.karakas.amatyakaraka;

  const akPlanet = profile.vedic_natal.planets.find(p => p.name === atmakaraka);
  const amkPlanet = profile.vedic_natal.planets.find(p => p.name === amatyakaraka);

  const vedicSignRulers: Record<string, string> = {
    "Áries": "Marte", "Touro": "Vênus", "Gêmeos": "Mercúrio", "Câncer": "Lua",
    "Leão": "Sol", "Virgem": "Mercúrio", "Libra": "Vênus", "Escorpião": "Marte",
    "Sagitário": "Júpiter", "Capricórnio": "Saturno", "Aquário": "Saturno", "Peixes": "Júpiter"
  };

  const akDispositor = akPlanet ? vedicSignRulers[akPlanet.sign] : null;
  const amkDispositor = amkPlanet ? vedicSignRulers[amkPlanet.sign] : null;

  // Jaimini check for ANY of the three regents being AK, AmK, or their dispositors
  const isAK = mahadashaLord === atmakaraka || antardashaLord === atmakaraka || pratyantardashaLord === atmakaraka;
  const isAmK = mahadashaLord === amatyakaraka || antardashaLord === amatyakaraka || pratyantardashaLord === amatyakaraka;
  const isDispositor = mahadashaLord === akDispositor || mahadashaLord === amkDispositor ||
                       antardashaLord === akDispositor || antardashaLord === amkDispositor ||
                       pratyantardashaLord === akDispositor || pratyantardashaLord === amkDispositor;
  const hasHighKarmicWeight = isAK || isAmK || isDispositor;

  let JaiminiContext = "";
  if (isAK) {
    JaiminiContext = `Um dos regentes da tríade atual é o ATMAKARAKA (${atmakaraka}), indicador do propósito profundo da alma.`;
  } else if (isAmK) {
    JaiminiContext = `Um dos regentes da tríade atual é o AMATYAKARAKA (${amatyakaraka}), indicador da energia de realização.`;
  } else if (isDispositor) {
    JaiminiContext = `Um dos regentes da tríade é o dispositor do Atmakaraka ou do Amatyakaraka.`;
  } else {
    JaiminiContext = `Os regentes do ciclo atual são neutros em relação aos Karakas de Jaimini.`;
  }

  const promptInput = `
DADOS DE ENTRADA DO USUÁRIO:
- Nome: ${profile.birthData.name}
- Gênero: ${profile.birthData.gender}

CHARA KARAKAS DE JAIMINI:
- Atmakaraka: ${atmakaraka} (Posicionado em ${akPlanet?.sign || "Desconhecido"})
- Amatyakaraka: ${amatyakaraka} (Posicionado em ${amkPlanet?.sign || "Desconhecido"})

PERÍODO ATUAL DE DASHAS VÉDICAS (A TRÍADE DO TEMPO):
- Mahadasha (Macro-período): ${mahadashaLord}
- Antardasha (Sub-período/Foco ativo): ${antardashaLord} (Posicionado sob o manto da estrela ${antarNakName}, Pada ${antarPadaNum}, na Casa Sideral ${antarLordHouse})
- Pratyantardasha (Sub-sub-período imediato): ${pratyantardashaLord}
- Peso Kármico Jaimini: ${JaiminiContext} (Alto Peso Cármico: ${hasHighKarmicWeight ? "SIM" : "NÃO"})

TRÂNSITOS TROPICAIS ATIVOS EM ASPECTO DE TENSÃO (ORBE ATÉ 3° - APENAS PLANETAS FÍSICOS LENTOS):
${activeTensionTransits.map(t => `- ${t.planet} em Trânsito na Casa ${t.transitHouse} (${t.transitSign}, grau ${t.transitDegree}) fazendo ${t.aspectToNatal}`).join("\n")}

Por favor, gere a leitura integrada e não-dual baseada estritamente nesses dados e seguindo as diretrizes, tom e estrutura markdown definidos no [PAPEL DO SISTEMA].
`;

  try {
    const client = getGeminiClient();
    const response = await callGeminiWithRetry(client, {
      model: "gemini-3.5-flash",
      contents: promptInput,
      config: {
        systemInstruction,
        temperature: 0.35,
        maxOutputTokens: 2500,
      }
    });

    return response.text || "";
  } catch (error) {
    cleanLogError("[Gemini API] Falha na Leitura de Trânsitos e Ciclos (Ativando fallback offline)", error);
    return getDeterministicTransitCyclesFallback(profile, activeTensionTransits, hasHighKarmicWeight, JaiminiContext, antarNakName, antarPadaNum, antarLordHouse, pratyantardashaLord);
  }
}

function getDeterministicTransitCyclesFallback(
  profile: CompleteAstrologicalProfile,
  activeTensionTransits: any[],
  hasHighKarmicWeight: boolean,
  JaiminiContext: string,
  antarNakName: string,
  antarPadaNum: number,
  antarLordHouse: number,
  pratyantardashaLord: string
): string {
  const mahadashaLord = profile.vedic_timing.mahadasha;
  const antardashaLord = profile.vedic_timing.antardasha;
  const houseThemes: Record<number, string> = {
    1: "vitalidade e autoimagem",
    2: "recursos e valores",
    3: "comunicação e mente prática",
    4: "lar e bases emocionais",
    5: "criatividade e expressão pessoal",
    6: "rotina, trabalho e saúde",
    7: "relacionamentos e o outro",
    8: "transmutação e mistérios ocultos",
    9: "sabedoria e propósitos elevados",
    10: "carreira e realização pública",
    11: "projetos coletivos e ganhos",
    12: "espiritualidade e silêncio interior"
  };

  const activeHouseTheme = houseThemes[antarLordHouse] || "jornada de vida";

  let dashaSection = `### 🌌 1. A TRÍADE DO TEMPO CÓSMICO (Costura das Dashas)

**A Tessitura do Tempo:**
O seu tempo atual é tecido sob a influência sincronizada de três regentes planetários védicos: a **Mahadasha de ${mahadashaLord}** (o grande ciclo que estabelece a tônica existencial de longo prazo), a **Antardasha de ${antardashaLord}** (o subciclo que direciona o foco prático da fase) e a **Pratyantardasha de ${pratyantardashaLord}** (o ritmo diário sutil que se expressa nos pequenos acontecimentos do agora). Esta costura de tempos nos convida a harmonizar o macro com o micro, percebendo que cada detalhe do cotidiano é uma dobra do absoluto.

**O Portal e a Casa Ativa:**
O portal principal desta fase é liderado pelo regente de sua Antardasha, **${antardashaLord}**, ativando o território sagrado da sua **Casa ${antarLordHouse} Sideral** (${activeHouseTheme}). O propósito evolutivo desse movimento é convidá-lo(a) a desobstruir essa esfera de vida das amarras do ego. O verdadeiro propósito aqui é a maturação orgânica e a entrega; há um grande perigo em cair na tentação da produtividade linear, na pressa mecânica ou no esgotamento mental nesse setor. Entregue o controle e respire na presença.

**A Nuance da Estrela (Nakshatra e Pada):**
Sua força mental se sintoniza no presente sob o manto da estrela **${antarNakName} (Pada ${antarPadaNum})**, coordenada celeste de seu regente da Antardasha. Essa estrela imprime um sabor sutil, profundo e refinado na sua percepção cotidiana. Ela exige que você desacelere e purifique a mente concreta, eliminando o barulho das expectativas e sintonizando a verdade pacífica em suas atitudes e palavras.

**O Peso Kármico (Conexão Jaimini):**
`;

  if (hasHighKarmicWeight) {
    dashaSection += `⚠️ **ALTO PESO CÁRMICO:** O regente do seu ciclo atual está intimamente conectado à essência do seu mapa (${JaiminiContext}). Este é um momento de extrema importância evolutiva, onde o **Fio de Atman** está sendo ativamente processado. Cada escolha do cotidiano repercute em sua estrutura profunda da alma. Não há atalhos: sinta, integre e acolha o chamado com dignidade sutil e amor pacificado.\n\n`;
  } else {
    dashaSection += `Este é um período de maturação padrão. O chamado é simplesmente consolidar as suas bases com leveza, sem pressões extraordinárias da alma.\n\n`;
  }

  let transitsSection = `### 🔥 2. OS PORTAIS DE ATIVAÇÃO PSICOLÓGICA (Próximos 30 dias)\n\n`;

  activeTensionTransits.forEach(t => {
    const pTheme = houseThemes[t.transitHouse] || "esferas cotidianas";
    let somaticConstriction = "na respiração e no peito";
    let primaryFear = "falhar e perder o controle das estruturas externas";
    let nonDualInsight = "tudo já está perfeitamente amparado pela inteligência do Todo";
    let virtudeName = "Paz e Presença";
    let physicalAction = "soltar a mandíbula, relaxar as pálpebras e respirar profundamente no baixo ventre";

    if (t.planet === "Plutão" || t.planet === "Pluto") {
      somaticConstriction = "na região da garganta e no baixo ventre";
      primaryFear = "perder a identidade, o poder pessoal ou enfrentar a vulnerabilidade radical";
      nonDualInsight = "a morte do ego é apenas a revelação de que você é a Vida impessoal";
      virtudeName = "Poder e Desapego";
      physicalAction = "sentir o peso dos seus quadris na cadeira e exalar com um som suave pela boca aberta, soltando a mandíbula";
    } else if (t.planet === "Saturno" || t.planet === "Saturn") {
      somaticConstriction = "nos ombros, na nuca e na rigidez da coluna";
      primaryFear = "não ser suficiente, ser julgado(a) ou ser paralisado(a) pelas exigências do tempo";
      nonDualInsight = "o tempo é um aliado amigável e não há nada a provar para o mundo exterior";
      virtudeName = "Retidão Silenciosa";
      physicalAction = "girar os ombros para trás três vezes, soltar o peso da cabeça e sentir as solas dos pés tocando firmemente o solo";
    } else if (t.planet === "Urano" || t.planet === "Uranus") {
      somaticConstriction = "no sistema nervoso, acelerando os batimentos cardíacos";
      primaryFear = "perder a liberdade, o controle do futuro ou ser aprisionado(a) pelo previsível";
      nonDualInsight = "o verdadeiro frescor reside em repousar de forma incondicional no desconhecido do agora";
      virtudeName = "Liberdade Espontânea";
      physicalAction = "abrir e fechar as mãos com vigor para liberar a eletricidade estática e focar na expiração lenta";
    } else if (t.planet === "Netuno" || t.planet === "Neptune") {
      somaticConstriction = "na visão e no centro do peito, como uma névoa difusa";
      primaryFear = "se perder, ser enganado(a) ou enfrentar o vazio existencial da desilusão";
      nonDualInsight = "a desilusão é a cura sagrada da ilusão; o silêncio sem pressupostos é a sua verdadeira casa";
      virtudeName = "Compaixão Cósmica";
      physicalAction = "suavizar os olhos olhando para o horizonte e repousar a atenção no som sutil do ar entrando e saindo de suas narinas";
    } else if (t.planet === "Júpiter" || t.planet === "Jupiter") {
      somaticConstriction = "na expansão exagerada do diafragma ou pressa no plexo solar";
      primaryFear = "perder oportunidades de ouro, desperdiçar o tempo ou não dar conta do crescimento";
      nonDualInsight = "a verdadeira riqueza é estar plenamente satisfeito com a simplicidade absoluta deste instante";
      virtudeName = "Doçura Pacífica";
      physicalAction = "repousar a mão direita sobre o abdômen e respirar de forma circular, expandindo com suavidade e sem pressa";
    }

    transitsSection += `#### **${t.planet}** em aspecto de tensão com o seu mapa (Casa ${t.transitHouse})\n\n`;
    transitsSection += `* **A Sombra:** A sombra do trânsito de **${t.planet}**, ativando a sua esfera de **${pTheme}**, pode levar a um período de comportamento obsessivo ou reativo. Esta sombra é uma tensão e constrição **${somaticConstriction}**, enraizada no medo de **${primaryFear}**.\n\n`;
    transitsSection += `* **A Integração:** Para integrar este ciclo em sua virtude mais elevada, lembre-se de que a revelação iluminada é que não há nada a fazer, pensar ou provar. Lembre-se de que ${nonDualInsight}. Nesse contexto, o propósito da vida (ou dessa área da vida) é Ser. O estado de verdadeiro(a) **${virtudeName}** vê a vida como um grande jogo e desfruta cada momento com leveza e bom humor. Lembre-se de rir de si mesma(o) e das suas tentativas de controle. Experimente **${physicalAction}**.\n\n`;
  });

  return `${dashaSection}${transitsSection}`;
}

