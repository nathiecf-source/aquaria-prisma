import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#3c352d] font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-md p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-[#5c4d66]" />
          <h1 className="text-2xl font-serif tracking-[0.15em] uppercase text-[#3c352d]">
            Política de Privacidade
          </h1>
        </div>

        <div className="space-y-5 text-sm leading-relaxed text-[#3c352d]">
          <p>
            <strong>1. Quem somos</strong><br />
            A Aquar.IA é uma plataforma de astrologia interativa baseada em inteligência artificial, que gera leituras e análises personalizadas a partir do mapa astral do(a) usuário(a). Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos os seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018).
          </p>

          <p>
            <strong>2. Dados que coletamos</strong><br />
            Para o funcionamento do serviço, coletamos: dados de cadastro (nome e e-mail de acesso à conta); dados de nascimento (data, horário e cidade de nascimento) necessários para o cálculo do mapa astral; dados de uso da plataforma (leituras geradas, diário, preferências e progresso); e dados técnicos do dispositivo necessários à autenticação, notificações e melhoria do serviço.
          </p>

          <p>
            <strong>3. Finalidade e base legal</strong><br />
            Os dados são utilizados exclusivamente para: criar e manter a sua conta; calcular e exibir o seu mapa astral e suas leituras personalizadas; processar pagamentos e gerenciar assinaturas; enviar comunicações e notificações relacionadas ao serviço; e cumprir obrigações legais. O tratamento ocorre com base na execução do contrato de uso, no consentimento do titular e no legítimo interesse, conforme os arts. 7º e 11 da LGPD.
          </p>

          <p>
            <strong>4. Armazenamento e segurança</strong><br />
            Os dados são armazenados de forma segura em infraestrutura de nuvem (Supabase e Google Cloud), com criptografia em repouso e em trânsito, controle de acesso restrito e monitoramento contínuo. O Aquar.IA adota rigorosos padrões de confidencialidade: informações pessoais e dados astrológicos são tratados como estritamente sigilosos.
          </p>

          <p>
            <strong>5. Compartilhamento de dados</strong><br />
            Não vendemos nem compartilhamos dados pessoais com terceiros para fins comerciais. O compartilhamento ocorre apenas com operadores essenciais à prestação do serviço — provedores de nuvem e banco de dados (Supabase, Google Cloud), serviços de inteligência artificial que geram as leituras, processadores de pagamento (InfinitePay, Google Play, App Store/RevenueCat) e provedores de notificação — sempre sob obrigações de confidencialidade e proteção de dados, ou quando houver exigência legal expressa.
          </p>

          <p>
            <strong>6. Cookies e armazenamento local</strong><br />
            Utilizamos armazenamento local do navegador e service worker apenas para manter a sua sessão, preferências e o funcionamento offline do aplicativo. Não utilizamos cookies de rastreamento publicitário.
          </p>

          <p>
            <strong>7. Direitos do titular</strong><br />
            Nos termos da LGPD, você pode, a qualquer momento: confirmar a existência e acessar os seus dados; corrigir dados incompletos ou desatualizados; solicitar a anonimização, bloqueio ou eliminação de dados desnecessários; solicitar a portabilidade; revogar o consentimento; e solicitar a exclusão definitiva da sua conta. A exclusão pode ser feita diretamente no aplicativo, na opção "Excluir minha conta" das configurações, ou mediante solicitação ao nosso suporte.
          </p>

          <p>
            <strong>8. Retenção e exclusão</strong><br />
            Mantemos os dados apenas pelo período necessário à prestação do serviço e ao cumprimento de obrigações legais. Após a exclusão da conta, os dados pessoais e astrológicos são removidos de forma definitiva dos nossos sistemas, ressalvadas as hipóteses de retenção previstas em lei.
          </p>

          <p>
            <strong>9. Transferência internacional</strong><br />
            Parte dos nossos operadores pode processar dados em servidores localizados fora do Brasil. Nesses casos, adotamos salvaguardas contratuais e técnicas adequadas para garantir nível de proteção equivalente ao exigido pela LGPD.
          </p>

          <p>
            <strong>10. Contato e encarregado de dados</strong><br />
            Para exercer os seus direitos ou esclarecer dúvidas sobre esta Política, entre em contato pelo e-mail aquariaprisma@gmail.com ou pelo canal oficial de suporte disponível em https://aquar-ia.app/suporte.
          </p>

          <p>
            <strong>11. Atualizações desta Política</strong><br />
            Esta Política poderá ser atualizada periodicamente para refletir melhorias no serviço ou adequações legais. A versão vigente estará sempre disponível no aplicativo e no site, e a continuidade de uso implica concordância com as atualizações publicadas.
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
