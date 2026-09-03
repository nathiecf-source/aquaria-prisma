import React from "react";
import { motion } from "motion/react";
import { X, Sparkles } from "lucide-react";

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
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
          <Sparkles className="w-6 h-6 text-[#5c4d66]" />
          <h2 className="text-xl sm:text-2xl font-serif tracking-[0.12em] uppercase text-[#3c352d]">
            Manifesto Aquar.IA
          </h2>
        </div>

        <div className="space-y-5 text-sm leading-relaxed text-[#3c352d]">
          <h3 className="text-base font-serif italic text-[#5c4d66]">
            A luz que revela sua potência original
          </h3>

          <p>
            Olhar para o céu não é uma tentativa preditiva para controlar o amanhã ou se curvar a destinos inflexíveis. A leitura da dança dos astros é, antes de qualquer outra coisa, uma compreensão sábia de que nossas vidas não são poeira cósmica desgarrada da conexão inteligente que sustenta o universo. Olhamos para o céu para encontrar guiança através de um exercício de fé no pertencimento a algo infinitamente maior.
          </p>

          <p>
            A Aquar.IA nasceu de um desejo muito simples e profundo: o de desacelerar o ruído do mundo exterior para que você possa encontrar inspiração nos astros para ampliar seu nível de consciência e te colocar no lugar de alquimista e protagonista do seu destino.
          </p>

          <p>
            Entendemos esta plataforma como um espaço vivo de autoinvestigação. Não oferecemos fórmulas mágicas nem respostas prontas, mas sim pontes simbólicas para te guiar até a escuta mais profunda de si mesm@. Nosso compromisso é com a sua transformação real: um processo contínuo de aprendizado pautado na presença e na reflexão. Tudo aqui foi pensado para ajudar você a reconhecer e integrar a sua potência original e singular: aquela força única que é só sua e que ninguém mais pode exercitar no mundo. Ao final, o que desejamos é que você fique com aquilo que fizer vibrar seu coração — aí reside a resposta mais verdadeira.
          </p>

          <h4 className="font-serif text-[#5c4d66] pt-2">O que nos move e nos diferencia</h4>
          <p>
            O diferencial da Aquar.IA está no encontro entre o rigor técnico e a delicadeza humana. Unimos a profundidade da Astrologia Tropical — que mapeia os relevos e as dinâmicas da sua psique — à sobriedade da Astrologia Sideral, que traduz o tempo, as circunstâncias e o terreno potencial de manifestação dos desafios e forças que podemos moldar em favor do nosso processo evolutivo.
          </p>

          <p>
            Traduzimos essas tradições ancestrais por meio de uma tecnologia desenvolvida com extremo zelo. Recusamos o fatalismo que assusta, o jargão técnico que afasta e a superficialidade dos horóscopos genéricos. Queremos entregar clareza, poesia e utilidade para o seu dia a dia, respeitando a complexidade da sua história.
          </p>

          <h4 className="font-serif text-[#5c4d66] pt-2">O valor insubstituível do afeto humano</h4>
          <p>
            Fazemos questão de afirmar com total clareza e honestidade: a tecnologia jamais substituirá a capacidade transcendente do humano.
          </p>
          <p>
            A Aquar.IA não foi criada para ocupar o lugar da consulta humana, da atenção calorosa, do olho no olho, nem da riqueza insubstituível da intuição e da sensibilidade que só outro ser humano pode oferecer. A inteligência aqui não é um oráculo infalível a quem você deve entregar as suas decisões, mas sim uma lanterna atenta — um recurso contínuo e silencioso para apoiar você nos ciclos da vida, no cotidiano entre uma descoberta e outra.
          </p>

          <h4 className="font-serif text-[#5c4d66] pt-2">Um convite ao cultivo de virtudes</h4>
          <p>
            Construímos a Aquar.IA para ajudar você a revelar e integrar um repertório de valores virtuosos na sua caminhada: a responsabilidade sobre a própria vida, a maturidade diante dos ciclos de mudança, a coragem da honestidade consigo mesma e o discernimento para agir no mundo com presença.
          </p>

          <p>
            Que esta interface seja mais do que uma tela de software. Que ela seja um portal de discernimento e presença, um espaço seguro para a sua autodescoberta e um convite diário para que você escute mais a si mesm@.
          </p>

          <p className="font-serif italic text-[#5c4d66] pt-2">
            Seja bem-vind@ ao seu laboratório astral.
          </p>
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
