import React, { useState, useEffect } from "react";
import BirthForm from "./components/BirthForm";
import LoadingScreen from "./components/LoadingScreen";
import ConfirmData from "./components/ConfirmData";
import AstrologyMandala from "./components/AstrologyMandala";
import { ReadingData } from "./lib/mockReadings";
import { AlertCircle, RefreshCw, Star, LogOut } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { AuthScreen } from "./components/AuthScreen";
import TermsPage from "./components/TermsPage";
import { Footer } from "./components/Footer";
import OnboardingTour, { TourStep } from "./components/OnboardingTour";
import { FloatingChatButton } from "./components/FloatingChatButton";
import { ChatModal } from "./components/ChatModal";
import { PaywallBarrier } from "./components/PaywallBarrier";
import PlanosPage from "./components/PlanosPage";
import SuccessPage from "./components/SuccessPage";
import AdminPage from "./components/AdminPage";
import GlobalBanner from "./components/GlobalBanner";
import { CommunityPopup } from "./components/CommunityPopup";

import { hasPlusAccess, hasChamadoFeature } from "./lib/access";

type FlowStep = "form" | "confirm" | "loading" | "mandala";

interface PendingFormData {
  name: string;
  gender: "masculino" | "feminino";
  gender_preference: "feminino" | "masculino" | "neutro";
  birthDate: string;
  birthTime: string;
  birthPlace: {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

export default function App() {
  const [step, setStep] = useState<FlowStep>("form");
  const [pendingFormData, setPendingFormData] = useState<PendingFormData | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [aiReadings, setAiReadings] = useState<Record<string, Partial<ReadingData>>>({});
  const [profile, setProfile] = useState<any>(null);
  const [visualState, setVisualState] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showChatPaywall, setShowChatPaywall] = useState(false);
  const [chatActive, setChatActive] = useState(true);
  const [chamado, setChamado] = useState<{ active: boolean; expiresAt: string | null; features: string[]; bannerText: string }>({
    active: false,
    expiresAt: null,
    features: [],
    bannerText: "",
  });
  const chamadoRef = React.useRef<{ active: boolean; expiresAt: string | null; features: string[]; bannerText: string }>(chamado);
  const chartLoadedRef = React.useRef(false);
  const isLoadingChartRef = React.useRef(false);
  const lastUserIdRef = React.useRef<string | null>(null);

  // Roteamento leve para a página de termos via hash
  const [hash, setHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Roteamento por pathname para /planos e /sucesso (SPA sem React Router)
  const [pathname, setPathname] = useState(() => (typeof window !== "undefined" ? window.location.pathname : "/"));
  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    chamadoRef.current = chamado;
  }, [chamado]);

  const markTourAsSeen = async () => {
    localStorage.setItem("has_seen_onboarding", "true");
    const userId = session?.user?.id;
    if (userId) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ has_seen_onboarding: true })
          .eq("id", userId);
        if (error) {
          console.warn("[Onboarding] Erro ao salvar flag no Supabase:", error);
        }
      } catch (err) {
        console.warn("[Onboarding] Falha ao atualizar perfil:", err);
      }
    }
  };

  const handleCompleteTour = () => {
    setShowTour(false);
    markTourAsSeen();
  };

  const handleSkipTour = () => {
    setShowTour(false);
    markTourAsSeen();
  };

  const loadChartOnLogin = async (userId: string, currentSession: any) => {
    if (isLoadingChartRef.current || isSpecialRoute(pathname)) return;
    isLoadingChartRef.current = true;
    try {
      console.log("[AUTO-LOAD] Verificando chart para userId:", userId);
      const loadResponse = await fetch("/api/load-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      console.log("[AUTO-LOAD] Resposta load-chart status:", loadResponse.status);
      if (!loadResponse.ok) return;
      const loadData = await loadResponse.json();
      console.log("[AUTO-LOAD] loadData:", loadData);

      if (!loadData.exists) {
        console.log("[AUTO-LOAD] Sem chart salvo para userId:", userId, "— mostrando formulário.");
        setStep("form");
        return;
      }
      // Suporte a ambos os formatos de resposta do servidor
      const birthDate = loadData.birth_date;
      const birthTime = loadData.birth_time;
      const latitude = loadData.latitude;
      const longitude = loadData.longitude;
      const savedBirthData = loadData.birth_data || {};
      console.log("[AUTO-LOAD] Dados extraídos:", { birthDate, birthTime, latitude, longitude, savedBirthData });
      if (!birthDate) {
        console.log("[AUTO-LOAD] birth_date ausente na resposta, mostrando formulário.");
        setStep("form");
        return;
      }

      const autoName = currentSession?.user?.user_metadata?.full_name
        || currentSession?.user?.email?.split("@")[0]
        || "Usuário";
      console.log("[AUTO-LOAD] Chart encontrado no Supabase, regenerando perfil...");
      setStep("loading");
      setUserName(autoName);

      const response = await fetch("/api/generate-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": currentSession?.access_token ? `Bearer ${currentSession.access_token}` : ""
        },
        body: JSON.stringify({
          name: autoName,
          gender: savedBirthData.gender || "feminino",
          gender_preference: savedBirthData.gender_preference,
          birthDate: birthDate,
          birthTime: birthTime,
          birthPlace: {
            latitude: latitude,
            longitude: longitude,
            timezone: savedBirthData.birthPlace?.timezone || "America/Sao_Paulo",
          },
          currentDate: new Date().toISOString().split("T")[0],
          userId,
        }),
      });

      if (!response.ok) {
        setStep("form");
        return;
      }

      const data = await response.json();
      console.log("[AUTO-LOAD] data.profile:", !!data.profile, "| data.visual_state:", !!data.visual_state, "| data.highlights:", data.highlights?.length);
      if (data.profile) setProfile(data.profile);
      if (data.visual_state) setVisualState(data.visual_state);
      if (data.highlights && Array.isArray(data.highlights)) setHighlights(data.highlights);
      // Os 7 Caminhos deixaram de vir pré-carregados aqui — agora são gerados sob demanda
      // ao clicar em cada Caminho na Mandala (ver AstrologyMandala.handleElementClick).

      // Reidrata leituras salvas em user_readings
      if (userId) {
        try {
          const readingsRes = await fetch(`/api/user-readings?userId=${encodeURIComponent(userId)}`);
          if (readingsRes.ok) {
            const readingsData = await readingsRes.json();
            if (readingsData.readings) setAiReadings(readingsData.readings);
          }
        } catch (readingsErr) {
          console.warn("[AUTO-LOAD] Falha ao reidratar leituras:", readingsErr);
        }
      }

      setStep("mandala");
    } catch (err) {
      console.warn("[AUTO-LOAD] Falha ao carregar chart automaticamente:", err);
      setStep("form");
    } finally {
      isLoadingChartRef.current = false;
    }
  };

  const isSpecialRoute = (path: string) => path === "/planos" || path === "/sucesso";

  const fetchUserProfile = async (userId: string, currentSession: any) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const chamadoFields = {
        chamado_active: chamadoRef.current.active,
        chamado_expires_at: chamadoRef.current.expiresAt,
        chamado_features: chamadoRef.current.features,
        chamado_banner_text: chamadoRef.current.bannerText,
      };

      if (data) {
        setUserProfile({
          ...data,
          ...chamadoFields,
          email: currentSession?.user?.email || ""
        });
      } else {
        // Fallback: trigger table insertion if profile is not present yet
        const meta = currentSession?.user?.user_metadata || {};
        const fallbackProfile = {
          id: userId,
          full_name: meta.full_name || "Usuário Astrológico",
          whatsapp_number: meta.whatsapp_number || "+55 11 99999-9999",
          subscription_tier: "FREE",
          has_access: false,
          access_expires_at: null,
          ...chamadoFields,
        };
        await supabase.from("profiles").upsert(fallbackProfile);
        setUserProfile({
          ...fallbackProfile,
          email: currentSession?.user?.email || ""
        });
      }
    } catch (err) {
      console.warn("Erro ao buscar perfil, usando fallback local:", err);
      const meta = currentSession?.user?.user_metadata || {};
      setUserProfile({
        id: userId,
        full_name: meta.full_name || "Usuário Astrológico",
        whatsapp_number: meta.whatsapp_number || "+55 11 99999-9999",
        subscription_tier: "FREE",
        has_access: false,
        access_expires_at: null,
        email: currentSession?.user?.email || ""
      });
    }
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        const active = data.chat_active !== false;
        setChatActive(active);
        if (!active) {
          setIsChatOpen(false);
          setShowChatPaywall(false);
        }

        const nextChamado = {
          active: data.chamado_active === true,
          expiresAt: data.chamado_expires_at || null,
          features: Array.isArray(data.chamado_features) ? data.chamado_features : [],
          bannerText: typeof data.chamado_banner_text === "string" ? data.chamado_banner_text : "",
        };
        setChamado(nextChamado);
      })
      .catch((err) => console.warn("[App] Erro ao carregar settings:", err));
  }, []);

  useEffect(() => {
    // onAuthStateChange é suficiente — dispara INITIAL_SESSION na montagem e SIGNED_IN/OUT depois
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, currentSession: Session | null) => {
      setSession(currentSession);
      setIsLoadingSession(false);
      if (currentSession?.user) {
        const currentUserId = currentSession.user.id;

        // Se o userId mudou, força nova verificação de chart
        if (lastUserIdRef.current !== currentUserId) {
          chartLoadedRef.current = false;
          lastUserIdRef.current = currentUserId;
        }

        fetchUserProfile(currentUserId, currentSession);
        if (!chartLoadedRef.current && !isSpecialRoute(pathname)) {
          chartLoadedRef.current = true;
          loadChartOnLogin(currentUserId, currentSession);
        }
      } else {
        chartLoadedRef.current = false;
        isLoadingChartRef.current = false;
        lastUserIdRef.current = null;
        setUserProfile(null);
        setStep("form");
        setProfile(null);
        setVisualState(null);
        setAiReadings({});
        setHighlights([]);
        setPendingFormData(null);
        setUserName("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mantém userProfile sincronizado com as configurações do Chamado
  useEffect(() => {
    if (!userProfile) return;
    setUserProfile((prev: any) => ({
      ...prev,
      chamado_active: chamado.active,
      chamado_expires_at: chamado.expiresAt,
      chamado_features: chamado.features,
      chamado_banner_text: chamado.bannerText,
    }));
  }, [chamado]);

  // Dispara o onboarding no primeiro acesso à mandala, se ainda não foi visto.
  useEffect(() => {
    if (step !== "mandala" || !userProfile || isLoadingSession) return;
    const alreadySeen =
      userProfile.has_seen_onboarding === true ||
      localStorage.getItem("has_seen_onboarding") === "true";
    if (!alreadySeen) {
      setShowTour(true);
    }
  }, [step, userProfile, isLoadingSession]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    chartLoadedRef.current = false;
    isLoadingChartRef.current = false;
    lastUserIdRef.current = null;
    setStep("form");
    setProfile(null);
    setVisualState(null);
    setAiReadings({});
    setHighlights([]);
    setPendingFormData(null);
    setUserName("");
  };

  const handleFormSubmit = (formData: {
    name: string;
    gender: "masculino" | "feminino";
    gender_preference: "feminino" | "masculino" | "neutro";
    birthDate: string;
    birthTime: string;
    birthPlace: {
      name: string;
      latitude: number;
      longitude: number;
      timezone: string;
    };
  }) => {
    setError(null);
    setPendingFormData(formData);
    setStep("confirm");
  };

  const handleConfirmData = async () => {
    if (!pendingFormData) return;

    setStep("loading");
    setError(null);
    setUserName(pendingFormData.name);
    setAiReadings({}); // Limpa as leituras salvas para forçar a nova geração
    setProfile(null); // Limpa o perfil anterior

    try {
      const response = await fetch("/api/generate-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
        },
        body: JSON.stringify({
          name: pendingFormData.name,
          gender: pendingFormData.gender,
          gender_preference: pendingFormData.gender_preference,
          birthDate: pendingFormData.birthDate,
          birthTime: pendingFormData.birthTime,
          birthPlace: {
            latitude: pendingFormData.birthPlace.latitude,
            longitude: pendingFormData.birthPlace.longitude,
            timezone: pendingFormData.birthPlace.timezone,
          },
          currentDate: new Date().toISOString().split("T")[0],
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Erro no processamento (${response.status}). Certifique-se de que o servidor está pronto.`
        );
      }

      const data = await response.json();

      console.log("[CONFIRM] Perfil gerado. chartSaved:", data.chartSaved, "chartSaveError:", data.chartSaveError);
      if (!data.chartSaved) {
        console.warn("[CONFIRM] O chart não foi salvo no Supabase. Próximos acessos voltarão ao formulário.", data.chartSaveError);
      }

      // Save complete astrological profile
      if (data.profile) {
        setProfile(data.profile);
      }

      // Save visual state for houses/petals highlights
      if (data.visual_state) {
        setVisualState(data.visual_state);
      }

      // Set the dynamic interactive areas highlighted in the Mandala
      if (data.highlights && Array.isArray(data.highlights)) {
        setHighlights(data.highlights);
      }

      // Os 7 Caminhos deixaram de vir pré-carregados aqui — agora são gerados sob demanda
      // ao clicar em cada Caminho na Mandala (ver AstrologyMandala.handleElementClick).
      setStep("mandala");
    } catch (err: any) {
      console.error("Erro ao integrar com o backend:", err);
      setError(
        err?.message ||
          "Não foi possível conectar ao servidor da plataforma AQUAR.IA. Tente novamente."
      );
      setStep("confirm");
    }
  };

  const handleEditData = () => {
    setStep("form");
  };

  const handleUpdateAiReading = (id: string, reading: Partial<ReadingData>) => {
    setAiReadings(prev => ({
      ...prev,
      [id]: reading
    }));
  };

  const handleBackToForm = () => {
    setStep("form");
    setError(null);
  };

  // Determina a fase lunar natal do usuário para personalizar o tour.
  const natalMoonPhaseName = React.useMemo(() => {
    if (!profile?.tropical_natal) return "Lua Nova";
    const signs = [
      "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
      "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes",
    ];
    const sun = profile.tropical_natal.planets?.find((p: any) => p.name === "Sol");
    const moon = profile.tropical_natal.planets?.find((p: any) => p.name === "Lua");
    if (!sun || !moon) return "Lua Nova";
    const sunLong = signs.indexOf(sun.sign) * 30 + sun.degree;
    const moonLong = signs.indexOf(moon.sign) * 30 + moon.degree;
    const diff = (moonLong - sunLong + 360) % 360;
    if (diff < 90) return "Lua Nova";
    if (diff < 180) return "Lua Crescente";
    if (diff < 270) return "Lua Cheia";
    return "Lua Minguante";
  }, [profile]);

  const isPlus = hasPlusAccess(userProfile);
  const canChat = hasChamadoFeature(userProfile, "chat");
  const activeSubscriptionTier: "FREE" | "PLUS" = isPlus ? "PLUS" : "FREE";

  const tourSteps: TourStep[] = React.useMemo(
    () => [
      {
        title: "Bem-vinda ao mapa da sua potência original",
        description:
          "A Aquar.IA é um espelho refratado da sua alma. Como visitante (acesso gratuito), você tem passe livre para explorar a estrutura central da sua psique: os seus Elementos, as Qualidades da sua ação e a Missão da Lua em que você nasceu, e por tempo indeterminado liberamos um bônus para você ler as casas angulares (1, 4, 7 e 10) e o caminho da autenticidade (ASC). Para acessar as demais casas e caminhos de Potência, você poderá desbloquear o Passe de Expansão.",
        finalLabel: "Iniciar Navegação",
      },
      {
        targetId: "tour-btn-visao-geral",
        title: "O Seu Ponto de Partida",
        description:
          "Sugerimos que você comece por aqui. A Visão Geral revela os eixos de maior força do seu destino, os seus desafios centrais e a síntese de como você se move pelo mundo.",
        placement: "bottom",
      },
      {
        targetId: "tour-btn-ciclos-ativos",
        title: "Ciclos Ativos",
        description:
          "Acompanhe os trânsitos planetários que estão atuando no seu mapa agora. Disponível para assinantes do Passe de Expansão.",
        placement: "bottom",
      },
      {
        targetId: "tour-btn-minha-experiencia",
        title: "O Mapa da sua Jornada",
        description:
          "Aqui você acompanha o seu progresso de leitura, as suas conquistas e evolução e guarda as respostas e reflexões do seu Diário Alquímico.",
        placement: "bottom",
      },
      {
        targetId: "tour-btn-dados-mapa",
        title: "Dados do Mapa",
        description:
          "Consulte os dados técnicos do seu mapa tropical e sideral védico, incluindo posições, casas e informações astronômicas de nascimento.",
        placement: "bottom",
      },
      {
        targetId: "petalas-de-qualidade",
        title: "As Qualidades da sua Ação",
        description:
          "As pétalas no centro da mandala traduzem a forma como você navega pelo mundo, revelando quais elementos compõem a força e estrutura da sua alma: fogo, terra, água ou ar; e qualidades cardinal, fixo ou mutável.",
        placement: "right",
      },
      {
        targetId: "tour-lua-natal",
        title: `A Missão da sua ${natalMoonPhaseName}`,
        description:
          "A Lua de nascimento revela a missão emocional da sua alma nesta encarnação e o terreno fértil da sua intuição.",
        placement: "bottom",
      },
      {
        targetId: "casas-interativas-fundo",
        title: "As 12 Casas da Vida",
        description:
          "O anel externo representa as doze áreas da vida — relacionamentos, carreira, família, espiritualidade. Cada setor guarda uma leitura específica do seu mapa.",
        placement: "bottom",
      },
      {
        targetId: "triangulo-externo",
        title: "Os Caminhos de Potência",
        description:
          "Os caminhos são percursos alquímicos desenhados para te ajudar a transmutar padrões de sombra em sua potência original singular. O triângulo externo e os eixos angulares revelam leituras especiais, que costuram pontos diversos no seu mapa relevantes para destravar cada chave. O caminho da Autenticidade está liberado para todos os leitores.",
        placement: "bottom",
      },
      {
        targetId: "tour-planet-glyph-bar",
        title: "Engrenagens Celestes",
        description:
          "A barra inferior exibe os planetas do seu mapa. Alguns glifos estão disponíveis gratuitamente; os demais podem ser desbloqueados com o Passe de Expansão.",
        placement: "top",
      },
      ...(isPlus
        ? [
            {
              targetId: "tour-floating-chat-button",
              title: "Oráculo do Mapa",
              description:
                "Disponível para assinantes PLUS. Toque neste botão para conversar com a Aquar.IA, fazer perguntas sobre o seu mapa e escolher entre as leituras Tropical e Sideral.",
              placement: "top" as const,
            },
          ]
        : []),
      {
        targetId: "tour-btn-visao-geral",
        title: "Tudo Pronto",
        description:
          "Clique abaixo para começar pela Visão Geral e mergulhar nas forças e aprendizados do projeto da sua alma.",
        placement: "bottom",
        finalLabel: "✦ Começar pela Visão Geral",
      },
    ],
    [natalMoonPhaseName, isPlus]
  );

  // Página de Termos de Uso acessível via hash #termos
  if (hash === "#termos") {
    return <TermsPage />;
  }

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#f4f1eb] flex items-center justify-center">
        <div className="text-center text-[#8c7f70] font-mono text-xs tracking-widest animate-pulse uppercase">
          Carregando...
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthSuccess={(s) => { setSession(s); }} />;
  }

  // Páginas do fluxo de pagamento InfinitePay
  if (pathname === "/planos") {
    return <PlanosPage userProfile={userProfile} />;
  }

  if (pathname === "/sucesso") {
    return <SuccessPage onAccessGranted={() => {
      setUserProfile((prev: any) => ({
        ...prev,
        has_access: true,
        subscription_tier: "PLUS",
      }));
    }} />;
  }

  // Painel administrativo
  if (pathname === "/admin") {
    return <AdminPage userProfile={userProfile} />;
  }

  return (
    <main className="min-h-screen w-full bg-[#f4f1eb] text-[#3c352d] flex flex-col justify-between py-8 sm:py-12 px-4 selection:bg-[#5c4d66]/15 selection:text-[#5c4d66] transition-all duration-500">
      <GlobalBanner />
      {session && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {/* User Tier Badge & Sign Out */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm border border-[#e6e2d8] text-[10px] tracking-wider font-mono">
            <span className={`w-2 h-2 rounded-full ${isPlus ? 'bg-[#d4af37] shadow-[0_0_8px_#d4af37]' : 'bg-gray-400'}`} />
            <span className="text-[#3c352d] font-semibold">{userProfile?.full_name || 'Usuário'}</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold ${isPlus ? 'bg-[#d4af37]/20 text-[#8c6239] border border-[#d4af37]/40 animate-pulse' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
              {activeSubscriptionTier}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            title="Sair do Portal"
            className="p-2.5 bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full shadow-sm border border-[#e6e2d8] transition-all hover:scale-105 cursor-pointer flex items-center justify-center"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      {/* Top Header Section */}
      {step !== "mandala" && (
        <header className="max-w-3xl mx-auto text-center mb-6 sm:mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/logo.png"
              alt="AQUAR.IA"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
            />
            <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-[0.2em] uppercase text-[#4a3f35]">
              AQUAR.IA PRISMA
            </h1>
          </div>
          <p className="font-sans text-[11px] sm:text-xs font-medium tracking-[0.25em] uppercase text-[#8c7f70]">
            A LUZ QUE REVELA SUA POTÊNCIA ORIGINAL
          </p>
        </header>
      )}

      {/* Main Container */}
      <section className="flex-grow flex items-center justify-center my-4 sm:my-8">
        <div className="w-full">
          {error && (
            <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 shadow-sm animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider">Falha de Conexão</p>
                <p className="text-xs font-light leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {step === "form" && (
            <BirthForm
              onSubmit={handleFormSubmit}
              isLoading={false}
              initialData={pendingFormData}
            />
          )}

          {step === "confirm" && pendingFormData && (
            <ConfirmData
              name={pendingFormData.name}
              genderPreferenceLabel={
                pendingFormData.gender_preference === "masculino"
                  ? "Ele"
                  : pendingFormData.gender_preference === "neutro"
                  ? "Neutro"
                  : "Ela"
              }
              birthDate={pendingFormData.birthDate}
              birthTime={pendingFormData.birthTime}
              birthPlaceName={pendingFormData.birthPlace.name}
              latitude={pendingFormData.birthPlace.latitude}
              longitude={pendingFormData.birthPlace.longitude}
              timezone={pendingFormData.birthPlace.timezone}
              onConfirm={handleConfirmData}
              onEdit={handleEditData}
              isLoading={false}
            />
          )}

          {step === "loading" && <LoadingScreen />}

          {step === "mandala" && (
            <div className="max-w-6xl mx-auto">
              <AstrologyMandala
                highlights={highlights}
                visualState={visualState}
                aiReadings={aiReadings}
                profile={profile}
                onUpdateAiReading={handleUpdateAiReading}
                onBackToForm={handleBackToForm}
                userName={userName}
                userProfile={userProfile}
                onUpgradeSuccess={() => setUserProfile((prev: any) => ({ ...prev, has_access: true, subscription_tier: "PLUS" }))}
              />
            </div>
          )}
        </div>
      </section>

      {/* Bottom Footer */}
      <Footer userProfile={userProfile} />

      <CommunityPopup isReady={step === "mandala" && !isLoadingSession} />

      {showTour && step === "mandala" && (
        <OnboardingTour
          steps={tourSteps}
          isOpen={showTour}
          onComplete={handleCompleteTour}
          onSkip={handleSkipTour}
        />
      )}

      {step === "mandala" && userProfile && chatActive && (
        <FloatingChatButton
          isLocked={!canChat}
          onClick={() =>
            canChat
              ? setIsChatOpen(true)
              : setShowChatPaywall(true)
          }
        />
      )}

      {showChatPaywall && chatActive && userProfile && (
        <PaywallBarrier
          standalone
          subscriptionTier={activeSubscriptionTier}
          userId={userProfile.id}
          userEmail={userProfile.email || ""}
          fullName={userProfile.full_name || ""}
          onUpgradeSuccess={() => {
            setUserProfile((prev: any) => ({ ...prev, has_access: true, subscription_tier: "PLUS" }));
            setShowChatPaywall(false);
            setIsChatOpen(true);
          }}
          onClose={() => setShowChatPaywall(false)}
          title="Chat Astrológico Bloqueado"
          description="Converse com a Aquar.IA sobre o seu mapa. Este recurso é exclusivo para assinantes PLUS."
        >
          <></>
        </PaywallBarrier>
      )}

      <ChatModal
        isOpen={isChatOpen && chatActive}
        onClose={() => setIsChatOpen(false)}
        userId={userProfile?.id}
        userName={userProfile?.full_name || userProfile?.name || userName}
      />
    </main>
  );
}
