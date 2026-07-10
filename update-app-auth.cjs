const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add Auth imports
code = code.replace(
  'import { ArrowRight, Loader2, Star, Sparkles, MapPin, Search } from "lucide-react";',
  'import { ArrowRight, Loader2, Star, Sparkles, MapPin, Search, LogIn } from "lucide-react";\nimport { supabase } from "./lib/supabaseClient";'
);

// Add auth state
code = code.replace(
  'const [error, setError] = useState<string | null>(null);',
  `const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (isSignUp: boolean) => {
    setIsAuthLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        alert("Verifique seu email para confirmar o cadastro.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };`
);

// Pass token to backend
code = code.replace(
  'const response = await fetch("/api/generate-profile", {',
  `const response = await fetch("/api/generate-profile", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": session?.access_token ? \`Bearer \${session.access_token}\` : ""
        },`
);

// Inject user id into payload
code = code.replace(
  'birthPlace: formData.birthPlace',
  `birthPlace: formData.birthPlace,
        userId: session?.user?.id`
);


// Replace return view if not authenticated
const authView = `  if (!session) {
    return (
      <div className="min-h-screen bg-[#1c1815] flex flex-col items-center justify-center p-6 text-[#e8e4db] font-sans">
        <div className="max-w-md w-full bg-[#2a241f] rounded-2xl border border-[#8c7f70]/20 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Star className="w-8 h-8 text-[#d4af37] mx-auto mb-3" />
            <h1 className="text-2xl font-serif tracking-widest uppercase text-[#e8e4db]">AQUAR.IA</h1>
            <p className="text-[#8c7f70] text-sm mt-2">Acesso restrito ao motor astrológico</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8c7f70] mb-2">E-mail</label>
              <input 
                type="email" 
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                className="w-full bg-[#1c1815] border border-[#8c7f70]/30 rounded-lg px-4 py-3 text-[#e8e4db] focus:outline-none focus:border-[#d4af37] transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8c7f70] mb-2">Senha</label>
              <input 
                type="password" 
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                className="w-full bg-[#1c1815] border border-[#8c7f70]/30 rounded-lg px-4 py-3 text-[#e8e4db] focus:outline-none focus:border-[#d4af37] transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            {error && (
              <div className="text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}
            
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => handleAuth(false)}
                disabled={isAuthLoading}
                className="flex-1 bg-[#d4af37] hover:bg-[#b08d24] text-[#1c1815] py-3 rounded-lg uppercase tracking-wider text-xs font-bold transition-all disabled:opacity-50"
              >
                {isAuthLoading ? "Entrando..." : "Entrar"}
              </button>
              <button 
                onClick={() => handleAuth(true)}
                disabled={isAuthLoading}
                className="flex-1 bg-transparent border border-[#8c7f70]/40 hover:border-[#8c7f70] text-[#e8e4db] py-3 rounded-lg uppercase tracking-wider text-xs font-bold transition-all disabled:opacity-50"
              >
                Criar Conta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }`;

code = code.replace(
  '  return (\n    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans">',
  authView + '\n  return (\n    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans">'
);

// We need to import useEffect
code = code.replace(
  'import React, { useState, useRef } from "react";',
  'import React, { useState, useRef, useEffect } from "react";'
);

fs.writeFileSync('src/App.tsx', code);
