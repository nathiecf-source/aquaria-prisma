import React from "react";
import { motion } from "motion/react";
import { X, HelpCircle } from "lucide-react";

interface FAQModalProps {
  onClose: () => void;
}

export const FAQModal: React.FC<FAQModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#3c352d]/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="w-6 h-6 text-[#5c4d66]" />
          <h2 className="text-xl sm:text-2xl font-serif tracking-[0.12em] uppercase text-[#3c352d]">
            Dúvidas Frequentes
          </h2>
        </div>

        <div className="space-y-5 text-sm leading-relaxed text-[#3c352d]">
          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">O que está liberado para o usuário free (sem assinatura)?</h3>
            <p>
              Para disseminar o autoconhecimento e também te permitir conhecer a profundidade da nossa ferramenta, liberamos com amor e generosidade para todos os usuários: a assinatura energética que sua alma carrega pela composição dos elementos e qualidades no seu mapa (fogo, água, terra, ar / cardinal, fixo e mutável) — leitura das pétalas centrais; casas angulares (1, 4, 7 e 10) e a missão que você traz a partir da sua lua de nascimento; uma visão geral do seu mapa com uma síntese de sobrevôo pelo seu mapa; a leitura do seu Sol, Lua, Ascendente e Mercúrio tropicais nas engrenagens celestes; acesso ao Caminho da Autenticidade com a meditação liberada.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">O que está liberado para o usuário plus (passe de expansão)?</h3>
            <p>
              Ao assinar a Aquar.IA Prisma você tem acesso a leitura completa de todas as casas, planetas, caminhos e 7 meditações guiadas personalizadas, registro do diário alquímico e acompanhamento da sua evolução; além da leitura dos seus ciclos ativos: a tríade cósmica que rege seu momento (calculada pelas estrelas-guias do sistema védico — Nakshatras/Dasas) e os ciclos planetários pelo cálculo tropical e o regente do seu ano. Você também tem acesso ao chat para tirar dúvidas sobre seu mapa tropical ou sideral, podendo salvar suas conversas em PDF.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">Como funciona o meu período de acesso à Aquar.IA?</h3>
            <p>
              Ao adquirir o Passe de Expansão, você garante 6 ou 12 meses — dependendo do plano que adquiriu — de acesso irrestrito aos seus Ciclos Planetários, à navegação por toda interface e ao Oráculo do Chat. Faltando 15 dias para o término do período, você receberá um convite na interface para manter seu acesso ativo via mensalidade, que pode ser cancelada a qualquer momento.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">Como cancelo a renovação ou altero a forma de pagamento?</h3>
            <p>
              Você tem controle total sobre o seu acesso. Basta clicar em Gerenciamento de Assinatura no rodapé para atualizar seus dados bancários ou encerrar a renovação automática a qualquer momento, sem burocracia ou necessidade de falar com atendentes.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">Caso eu não renove a assinatura, perco acesso às minhas leituras?</h3>
            <p>
              Sim, você retorna para o plano básico com as leituras liberadas para todos os usuários. Caso você queira ter as leituras da interface guardadas para si sem renovar o plano, é liberado que copie e salve ou imprima por sua própria conta. Você poderá baixar as conversas com o chat em PDF e o áudio das 7 meditações.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">O Oráculo no Chat substitui uma consulta terapêutica ou astrológica?</h3>
            <p>
              Não. O Chat da Aquar.IA é uma ferramenta de inteligência projetada para acompanhamento diário, reflexão e ampliação de perspectiva. Ele não substitui sessões de análise, acompanhamento terapêutico ou diagnósticos de saúde física e mental.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">O Oráculo no Chat fica automaticamente salvo?</h3>
            <p>
              Não. Caso não queira perder a conversa que teve, você pode baixá-la em PDF. Fique atent@, pois não temos acesso nos registros ao que você escreve por sigilo, portanto, caso não salve, infelizmente o histórico não pode ser recuperado.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">Posso solicitar reembolso?</h3>
            <p>
              Sim. Conforme o Código de Defesa do Consumidor, você tem até 7 dias corridos após a compra para solicitar o reembolso integral diretamente pelo nosso suporte ou pelo canal de pagamento.
            </p>
          </div>
        </div>

        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#3c352d] text-[#f4f1eb] text-xs uppercase tracking-[0.15em] rounded-lg hover:bg-[#5c4d66] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
