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
            <h3 className="font-serif text-[#5c4d66] mb-1">Como funciona o meu período de acesso e qual a diferença entre o Passe de Expansão e a Assinatura?</h3>
            <p>
              O Passe de Expansão é a sua porta de entrada na Aquar.IA. Ao adquiri-lo, você garante um período de acesso irrestrito (de 6 ou 12 meses) ao seu Mapa Natal completo, aos seus Ciclos Planetários, às Meditações e ao Oráculo no Chat. A Assinatura Mensal, por sua vez, é um plano opcional de manutenção com valor reduzido que você só ativa após o término do seu Passe de Expansão, para continuar acompanhando seus trânsitos e conversando com o Chat sem precisar comprar um novo mapa. A assinatura não pode ser adquirida isoladamente sem o Passe de Expansão prévio.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">O que está liberado no acesso gratuito (Free)?</h3>
            <p>
              Para que você possa experimentar a profundidade da nossa ferramenta e dar os primeiros passos na sua jornada de autoconhecimento, liberamos gratuitamente para todos os usuários:
            </p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li><strong>Sua Assinatura Energética:</strong> Leitura das pétalas centrais a partir da composição dos elementos e qualidades no seu mapa (fogo, água, terra, ar / cardinal, fixo e mutável).</li>
              <li><strong>Casas Angulares e Missão:</strong> Leitura das Casas 1, 4, 7 e 10, além da missão trazida pela sua Lua de nascimento.</li>
              <li><strong>Síntese do Mapa:</strong> Uma visão geral e um sobrevôo integrativo pela sua estrutura astrológica.</li>
              <li><strong>Engrenagens Celestes:</strong> Leitura do seu Sol, Lua, Ascendente e Mercúrio no sistema tropical.</li>
              <li><strong>Caminho da Autenticidade:</strong> Acesso à primeira meditação guiada liberada.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">O que está liberado no Passe de Expansão (Acesso Completo)?</h3>
            <p>
              Ao adquirir o Passe de Expansão, você desbloqueia a experiência integral e personalizada da plataforma:
            </p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li><strong>Leitura Completa do Mapa:</strong> Todas as casas astrológicas, planetas e caminhos evolutivos.</li>
              <li><strong>Práticas Guiadas:</strong> Acesso às 7 meditações guiadas e personalizadas, além do Diário Alquímico para registrar sua evolução.</li>
              <li><strong>Seus Ciclos Ativos:</strong> A Tríade Cósmica do seu momento presente (calculada pelas estrelas-guias do sistema védico — Nakshatras/Dasas), os ciclos planetários pelo cálculo tropical e o regente do seu ano.</li>
              <li><strong>Oráculo no Chat:</strong> Acesso ilimitado ao chat para tirar dúvidas sobre seu mapa (tropical ou sideral), com opção de baixar suas conversas em PDF.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">O que acontece quando encerra o meu período no Passe de Expansão?</h3>
            <p>
              Faltando 15 dias para o término dos seus 6 ou 12 meses de acesso, você receberá um convite na própria interface para ativar a sua assinatura mensal de manutenção (por um valor menor) e continuar navegando por tudo. Caso opte por não assinar a manutenção, sua conta retornará automaticamente para o plano Gratuito. Para não perder o seu conteúdo, você poderá baixar o histórico de conversas do Chat em PDF, fazer o download dos áudios das 7 meditações para o seu celular ou computador, e copiar os textos das suas leituras da interface sempre que quiser.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">Como cancelo a renovação ou altero a forma de pagamento?</h3>
            <p>
              Você tem autonomia total sobre a sua conta. Basta clicar em Gerenciamento de Assinatura no rodapé da plataforma para atualizar seus dados de pagamento ou desativar a renovação automática a qualquer momento — sem burocracia, taxas extras ou necessidade de falar com atendentes.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">Posso solicitar reembolso?</h3>
            <p>
              Sim. Garantimos o seu direito integral de arrependimento. Conforme o Código de Defesa do Consumidor, você tem até 7 dias corridos após a compra para solicitar o reembolso total de 100% do valor pago, diretamente pelo nosso suporte ou pela plataforma de pagamento.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">Por que vejo signos diferentes no meu Mapa Tropical e no Sideral/Védico?</h3>
            <p>
              Não há nada de errado com os seus dados. A Aquar.IA utiliza dois sistemas astronômicos complementares: o Sistema Tropical (baseado no ritmo das estações do ano e no ciclo solar) e o Sistema Sideral/Védico (baseado na posição real das estrelas e constelações no céu). É perfeitamente normal que o seu Sol, Ascendente ou outros planetas mudem de signo entre um sistema e outro. O Tropical revela a sua jornada psicológica e arquetípica nesta vida, enquanto o Sideral detalha a sua anatomia energética e os ciclos de tempo das Nakshatras.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">O que fazer se o meu horário de nascimento não for exato?</h3>
            <p>
              Recomendamos utilizar a hora mais aproximada informada na sua Certidão de Nascimento. O horário exato é fundamental para calcular a linha do seu Ascendente, a distribuição das Casas Astrológicas e os graus exatos da sua Lua. Caso você tenha dúvidas sobre minutos específicos, o Oráculo no Chat pode te ajudar a refletir sobre os temas das casas para validar a sua percepção.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">Posso gerar a leitura e o mapa para outra pessoa na minha conta?</h3>
            <p>
              Não. O Passe de Expansão e a jornada da Aquar.IA foram desenhados para a jornada individual de um único perfil natal. Como a inteligência do sistema e o Oráculo do Chat são calibrados com base nos seus dados específicos para acompanhar seus ciclos de evolução, não é possível alternar os dados do mapa principal da conta. Para fazer o mapa de um parceiro, amigo ou familiar, é necessário adquirir um novo Passe dedicado.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">Como funciona o acesso e o download das Meditações Guiadas?</h3>
            <p>
              As suas 7 meditações guiadas são geradas de forma personalizada para a sua assinatura energética. Você pode ouvi-las diretamente pela interface a qualquer momento durante o seu período ativo no Passe de Expansão ou fazer o download dos arquivos de áudio para guardá-los para sempre no seu celular ou computador.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">O Oráculo no Chat substitui uma consulta terapêutica ou astrológica?</h3>
            <p>
              Não. O Oráculo no Chat da Aquar.IA é uma ferramenta de inteligência astrológica projetada para acompanhamento diário, auto-observação e ampliação de perspectiva. Ele não substitui sessões formais de análise astrológica, acompanhamento terapêutico ou diagnósticos de saúde física e mental.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-[#5c4d66] mb-1">As minhas conversas no Chat ficam salvas automaticamente na plataforma?</h3>
            <p>
              Não. Em respeito à sua privacidade e por questões de sigilo, não armazenamos o histórico do que você escreve no chat nos nossos servidores. Se você teve uma conversa importante e deseja guardá-la, lembre-se de clicar no botão para baixar em PDF antes de fechar a aba. Se a página for fechada sem salvar, o histórico não poderá ser recuperado.
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
