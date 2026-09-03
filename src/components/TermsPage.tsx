import React from "react";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#3c352d] font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-md p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-[#5c4d66]" />
          <h1 className="text-2xl font-serif tracking-[0.15em] uppercase text-[#3c352d]">
            Termos de Uso
          </h1>
        </div>

        <div className="space-y-5 text-sm leading-relaxed text-[#3c352d]">
          <p>
            <strong>1. Aceitação dos Termos</strong><br />
            Ao acessar e utilizar o aplicativo Aquar.IA, o(a) usuário(a) declara ter lido, compreendido e concordado integralmente com os presentes Termos de Uso. Caso não concorde com qualquer disposição, o uso do aplicativo deverá ser imediatamente interrompido.
          </p>

          <p>
            <strong>2. Descrição do Aplicativo</strong><br />
            A Aquar.IA é uma plataforma interativa baseada em inteligência artificial voltada à astrologia tropical e sideral, que oferece respostas e análises personalizadas a partir do mapa astral da usuária, promovendo reflexões e orientações simbólicas.
          </p>

          <p>
            <strong>3. Registro e Acesso</strong><br />
            Para utilizar as funcionalidades do aplicativo, a usuária deverá criar uma conta mediante o fornecimento de dados verídicos. A segurança do login e senha é de responsabilidade exclusiva da usuária.
          </p>

          <p>
            <strong>4. Sigilo e Privacidade dos Dados</strong><br />
            O Aquar.IA adota rigorosos padrões de segurança e confidencialidade. Todos os dados fornecidos — incluindo informações pessoais, de login e dados astrológicos — são tratados como estritamente sigilosos, armazenados de forma segura e nunca compartilhados com terceiros, exceto quando houver exigência legal expressa. O tratamento de dados segue as normas da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>

          <p>
            <strong>5. Propriedade Intelectual e Registro no INPI</strong><br />
            O aplicativo Aquar.IA e todos os seus componentes (marca, interface, banco de dados, algoritmos, textos, imagens, logotipo e funcionalidades) são protegidos por direitos autorais e estão registrados no Instituto Nacional da Propriedade Industrial (INPI). É vedada a reprodução, cópia, modificação, engenharia reversa ou redistribuição de qualquer parte do aplicativo sem autorização expressa de seus titulares.
          </p>

          <p>
            <strong>6. Uso Responsável e Limitações</strong><br />
            As informações e respostas fornecidas pelo aplicativo possuem caráter simbólico, reflexivo e informativo, não substituindo aconselhamentos médicos, psicológicos, financeiros ou jurídicos. A usuária compromete-se a utilizar o aplicativo de forma ética, sem fins ilícitos, comerciais indevidos ou tentativas de acesso não autorizado.
          </p>

          <p>
            <strong>7. Atualizações e Modificações</strong><br />
            O Aquar.IA poderá realizar atualizações e ajustes periódicos em suas funcionalidades e termos de uso, visando aprimorar a experiência da usuária. A continuidade de uso implica concordância com as modificações implementadas.
          </p>

          <p>
            <strong>8. Responsabilidade e Garantias</strong><br />
            O Aquar.IA não se responsabiliza por decisões tomadas exclusivamente com base nas respostas fornecidas pelo sistema. A plataforma é disponibilizada "como está", sem garantias de funcionamento ininterrupto ou livre de falhas técnicas.
          </p>

          <p>
            <strong>9. Encerramento da Conta</strong><br />
            A usuária poderá, a qualquer momento, solicitar o encerramento de sua conta e a exclusão definitiva de seus dados pessoais, conforme previsto na legislação vigente.
          </p>

          <p>
            <strong>10. Foro e Disposições Gerais</strong><br />
            Os presentes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de Aparecida de Goiânia – GO para dirimir quaisquer dúvidas ou controvérsias oriundas deste instrumento.
          </p>
        </div>

        <a
          href="#"
          className="inline-flex items-center gap-2 mt-8 text-xs uppercase tracking-widest text-[#5c4d66] hover:text-[#3c352d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao aplicativo
        </a>
      </div>
    </div>
  );
}
