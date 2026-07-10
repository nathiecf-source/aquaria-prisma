import React, { useState, useEffect } from "react";
import BirthForm from "./components/BirthForm";
import LoadingScreen from "./components/LoadingScreen";
import AstrologyMandala from "./components/AstrologyMandala";
import { parseGeminiAnalysis } from "./utils/astrologyParser";
import { ReadingData } from "./data/mockReadings";
import { AlertCircle, RefreshCw, Star, LogOut } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { AuthScreen } from "./components/AuthScreen";

type FlowStep = "form" | "loading" | "mandala";

export default function App() {
  const [step, setStep] = useState<FlowStep>("form");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [aiReadings, setAiReadings] = useState<Record<string, Partial<ReadingData>>>({});
  const [profile, setProfile] = useState<any>(null);
  const [visualState, setVisualState] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchUserProfile = async (userId: string, currentSession: any) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        setUserProfile({
          ...data,
          email: currentSession?.user?.email || ""
        });
      } else {
        // Fallback: trigger table insertion if profile is not present yet
        const meta = currentSession?.user?.user_metadata || {};
        const fallbackProfile = {
          id: userId,
          full_name: meta.full_name || "Usuário Astrológico",
          whatsapp_number: meta.whatsapp_number || "+55 11 99999-9999",
          subscription_tier: "FREE"
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
        email: currentSession?.user?.email || ""
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id, currentSession);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id, currentSession);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setStep("form");
    setProfile(null);
    setVisualState(null);
    setAiReadings({});
  };

  const handleFormSubmit = async (formData: {
    name: string;
    gender: "masculino" | "feminino";
    birthDate: string;
    birthTime: string;
    birthPlace: {
      name: string;
      latitude: number;
      longitude: number;
      timezone: string;
    };
  }) => {
    setStep("loading");
    setError(null);
    setUserName(formData.name);
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
          name: formData.name,
          gender: formData.gender,
          birthDate: formData.birthDate,
          birthTime: formData.birthTime,
          birthPlace: {
            latitude: formData.birthPlace.latitude,
            longitude: formData.birthPlace.longitude,
            timezone: formData.birthPlace.timezone,
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

      // Parse markdown to map custom readings per key
      if (data.analysis) {
        const parsed = parseGeminiAnalysis(data.analysis);
        setAiReadings(parsed);
      }

      setStep("mandala");
    } catch (err: any) {
      console.error("Erro ao integrar com o backend:", err);
      setError(
        err?.message ||
          "Não foi possível conectar ao servidor da plataforma AQUAR.IA. Tente novamente."
      );
      setStep("form");
    }
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

  if (!session) {
    return <AuthScreen onAuthSuccess={(s) => setSession(s)} />;
  }

  return (
    <main className="min-h-screen w-full bg-[#f4f1eb] text-[#3c352d] flex flex-col justify-between py-8 sm:py-12 px-4 selection:bg-[#5c4d66]/15 selection:text-[#5c4d66] transition-all duration-500">
      {session && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {/* User Tier Badge & Sign Out */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm border border-[#e6e2d8] text-[10px] tracking-wider font-mono">
            <span className={`w-2 h-2 rounded-full ${userProfile?.subscription_tier === 'PLUS' ? 'bg-[#d4af37] shadow-[0_0_8px_#d4af37]' : 'bg-gray-400'}`} />
            <span className="text-[#3c352d] font-semibold">{userProfile?.full_name || 'Usuário'}</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold ${userProfile?.subscription_tier === 'PLUS' ? 'bg-[#d4af37]/20 text-[#8c6239] border border-[#d4af37]/40 animate-pulse' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
              {userProfile?.subscription_tier || 'FREE'}
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
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-[0.2em] uppercase text-[#4a3f35] mb-2">
            AQUAR.IA PRISMA
          </h1>
          <p className="font-sans text-[11px] sm:text-xs font-medium tracking-[0.25em] uppercase text-[#8c7f70]">
            A ARQUITETURA OCULTA DO SEU DESTINO
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
            <BirthForm onSubmit={handleFormSubmit} isLoading={false} />
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
                onUpgradeSuccess={() => setUserProfile((prev: any) => ({ ...prev, subscription_tier: "PLUS" }))}
              />
            </div>
          )}
        </div>
      </section>

      {/* Bottom Architectural/Metadata Footer */}
      {step !== "mandala" && (
        <footer className="max-w-3xl mx-auto text-center mt-4 sm:mt-8">
          <p className="font-sans text-[9px] sm:text-[11px] font-medium tracking-[0.2em] uppercase text-[#8c7f70]">
            MC: Realização • IC: Integração • ASC: Autenticidade • DSC: Reconexão
          </p>
        </footer>
      )}
    </main>
  );
}
