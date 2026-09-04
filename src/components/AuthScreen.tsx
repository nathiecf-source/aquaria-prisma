import React, { useState } from "react";
import { motion } from "motion/react";
import { Star, Eye, EyeOff, Sparkles, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { Footer } from "./Footer";
import GlobalBanner from "./GlobalBanner";

interface AuthScreenProps {
  onAuthSuccess: (session: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validações básicas
    if (!email || !password) {
      setError("Por favor, preencha o e-mail e a senha.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    if (isSignUp) {
      if (!fullName) {
        setError("Por favor, preencha o seu nome completo.");
        return;
      }
      if (!whatsappNumber) {
        setError("O número do WhatsApp é obrigatório para ativar o seu perfil astrológico.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up com metadados do usuário (serão colhidos pelo Trigger SQL ou pelo nosso fallback offline)
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              whatsapp_number: whatsappNumber,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Se for o Supabase real, também inserimos na tabela pública 'profiles' por segurança,
        // caso a trigger Postgres não esteja instalada no banco deles ainda!
        if (isSupabaseConfigured && data?.user) {
          try {
            const { error: profileError } = await supabase
              .from("profiles")
              .upsert({
                id: data.user.id,
                full_name: fullName,
                whatsapp_number: whatsappNumber,
                subscription_tier: "FREE",
                has_access: false,
                access_expires_at: null,
                updated_at: new Date().toISOString()
              });
            if (profileError) console.warn("Erro ao registrar perfil adicional:", profileError);
          } catch (profileErr) {
            console.warn("Fallback de trigger manual falhou:", profileErr);
          }
        }

        setSuccessMessage("Cadastro realizado com sucesso! Verifique seu e-mail se necessário ou faça login para começar.");
        setIsSignUp(false); // Alterna para login
      } else {
        // Sign In
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        
        if (data?.session) {
          onAuthSuccess(data.session);
        }
      }
    } catch (err: any) {
      console.error("Erro na autenticação:", err);
      const errMsg = err?.message || "";
      if (isSignUp && (
        errMsg.toLowerCase().includes("already") || 
        errMsg.toLowerCase().includes("registered") || 
        errMsg.toLowerCase().includes("existe") ||
        errMsg.toLowerCase().includes("cadastrado")
      )) {
        setError(
          "Este e-mail já está registrado na base de autenticação do Supabase. Se você removeu este usuário apenas da tabela pública 'profiles', o login de autenticação ainda continua ativo. Para recadastrá-lo com o mesmo e-mail, você deve ir no painel do Supabase, clicar na aba 'Authentication' (ícone de chave), depois em 'Users' e deletar o e-mail de lá antes de tentar criar a conta novamente."
        );
      } else {
        setError(errMsg || "Ocorreu um erro ao processar a autenticação. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1eb] flex flex-col items-center justify-center p-4 text-[#3c352d] font-sans selection:bg-[#5c4d66]/15 selection:text-[#5c4d66]">
      <GlobalBanner />
      
      {/* Dynamic Environment Indicator */}
      <div className="mb-6 flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e6e2d8] rounded-full text-[10px] tracking-wider uppercase font-mono text-[#8c7f70] shadow-sm">
        <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
        <span>{isSupabaseConfigured ? 'Supabase Conectado' : 'Simulador Offline Ativo'}</span>
      </div>

      <div className="max-w-md w-full bg-[#fbf9f5] rounded-2xl border border-[#e6e2d8] p-8 shadow-md relative overflow-hidden">
        {/* Subtle decorative stars */}
        <Star className="absolute top-6 right-6 w-4 h-4 text-[#a37c5c]/10 animate-spin" style={{ animationDuration: '20s' }} />
        <Star className="absolute bottom-6 left-6 w-3 h-3 text-[#a37c5c]/10" />

        <div className="text-center mb-8">
          <motion.img
            src="/logo.png"
            alt="AQUAR.IA"
            className="w-20 h-20 object-contain mx-auto mb-3"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="text-2xl font-serif tracking-[0.2em] uppercase text-[#3c352d]">AQUAR.IA</h1>
          <p className="text-[#8c7f70] text-xs font-mono tracking-widest uppercase mt-1">Prisma Astrológico</p>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[#e6e2d8] mb-6">
          <button
            onClick={() => { setIsSignUp(false); setError(null); setSuccessMessage(null); }}
            className={`flex-1 pb-3 text-xs uppercase tracking-widest font-bold transition-all duration-300 ${!isSignUp ? "text-[#5c4d66] border-b-2 border-[#5c4d66]" : "text-[#8c7f70] hover:text-[#3c352d]"}`}
          >
            Acessar Conta
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(null); setSuccessMessage(null); }}
            className={`flex-1 pb-3 text-xs uppercase tracking-widest font-bold transition-all duration-300 ${isSignUp ? "text-[#5c4d66] border-b-2 border-[#5c4d66]" : "text-[#8c7f70] hover:text-[#3c352d]"}`}
          >
            Nova Conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isSignUp && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-[#e6e2d8] rounded-lg px-4 py-3 text-xs text-[#3c352d] placeholder-[#8c7f70]/40 focus:outline-none focus:border-[#5c4d66] transition-colors font-sans"
                  placeholder="Nome e Sobrenome"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#5c4d66]" />
                  WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-white border border-[#e6e2d8] rounded-lg px-4 py-3 text-xs text-[#3c352d] placeholder-[#8c7f70]/40 focus:outline-none focus:border-[#5c4d66] transition-colors font-mono"
                  placeholder="(11) 99999-9999"
                />
                <span className="text-[9px] text-[#8c7f70] mt-1 block leading-relaxed font-light">
                  Para receber seu manual astrológico da Aquar.IA.
                </span>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold mb-1.5">
              Endereço de E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#e6e2d8] rounded-lg px-4 py-3 text-xs text-[#3c352d] placeholder-[#8c7f70]/40 focus:outline-none focus:border-[#5c4d66] transition-colors font-sans"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#e6e2d8] rounded-lg pl-4 pr-10 py-3 text-xs text-[#3c352d] placeholder-[#8c7f70]/40 focus:outline-none focus:border-[#5c4d66] transition-colors font-mono"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8c7f70] hover:text-[#3c352d] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-700 text-xs bg-red-50 p-3 rounded-lg border border-red-200 font-light flex items-start gap-2 animate-shake">
              <Star className="w-4 h-4 shrink-0 text-red-500 mt-0.5 animate-pulse" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="text-emerald-700 text-xs bg-emerald-50 p-3 rounded-lg border border-emerald-200 font-light flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-[#2B3C5C] hover:bg-[#22304a] disabled:bg-[#2B3C5C]/40 text-white py-3.5 rounded-lg font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? "Criar Minha Conta" : "Entrar no Portal"}</span>
              </>
            )}
          </button>
        </form>

        <Footer />
      </div>
    </div>
  );
};
