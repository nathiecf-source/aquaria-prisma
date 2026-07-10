import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, MapPin, Calendar, Clock, Sparkles, Loader2, Check } from "lucide-react";
import tzlookup from "tz-lookup";

interface BirthFormProps {
  onSubmit: (data: {
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
  }) => void;
  isLoading: boolean;
}

export default function BirthForm({ onSubmit, isLoading }: BirthFormProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"masculino" | "feminino">("feminino");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  
  // Birth place search state
  const [birthPlaceName, setBirthPlaceName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
  } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [typingError, setTypingError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // OSM Nominatim Geocoding debouncing lookup (400ms)
  useEffect(() => {
    if (!birthPlaceName || birthPlaceName.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // If birthPlaceName exactly matches the selected place, don't re-trigger search
    if (selectedPlace && selectedPlace.name === birthPlaceName) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setTypingError(null);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            birthPlaceName
          )}&limit=5&addressdetails=1&accept-language=pt`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setShowDropdown(data.length > 0);
        } else {
          setTypingError("Erro ao consultar serviço de localização.");
        }
      } catch (err) {
        console.error("Erro ao buscar sugestões de localização:", err);
        setTypingError("Não foi possível conectar ao serviço de mapas.");
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [birthPlaceName, selectedPlace]);

  const handleSelectSuggestion = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    let resolvedTimezone = "America/Sao_Paulo"; // Safe default
    try {
      // Lookup the official timezone from latitude & longitude
      resolvedTimezone = tzlookup(lat, lon);
    } catch (e) {
      console.error("Falha ao resolver fuso horário de coordenadas:", e);
    }

    const placeObj = {
      name: suggestion.display_name,
      latitude: lat,
      longitude: lon,
      timezone: resolvedTimezone
    };

    setSelectedPlace(placeObj);
    setBirthPlaceName(suggestion.display_name);
    setShowDropdown(false);
    setTypingError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthDate || !birthTime || !birthPlaceName) return;

    if (!selectedPlace) {
      setTypingError("Por favor, selecione uma cidade sugerida na lista para validação do fuso horário kármico.");
      return;
    }

    onSubmit({
      name,
      gender,
      birthDate,
      birthTime,
      birthPlace: selectedPlace,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto bg-[#f4f1eb]/95 border border-[#8c7f70]/15 rounded-2xl shadow-[0_20px_50px_rgba(74,63,53,0.12)] p-8 sm:p-10 relative overflow-hidden backdrop-blur-md"
    >
      {/* Decorative stars / geometric detail */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Star className="w-16 h-16 text-[#8c6239] animate-spin" style={{ animationDuration: "100s" }} />
      </div>

      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center p-3 bg-[#ede9de] rounded-full text-[#8c6239] mb-4">
          <Sparkles className="w-6 h-6 stroke-[1.25]" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-[0.1em] text-[#3c352d] uppercase">
          AQUAR.IA
        </h1>
        <p className="mt-2 font-serif italic text-sm text-[#8c7f70]">
          Insira seus dados de nascimento para mapear sua matriz astrológica integral.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* Name Input */}
        <div className="space-y-1">
          <label className="block font-sans text-[10px] tracking-widest uppercase text-[#8c7f70] font-semibold">
            Nome Completo
          </label>
          <div className="relative">
            <input
              type="text"
              required
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full px-4 py-3 bg-[#ede9de]/40 border border-[#8c7f70]/20 rounded-lg text-[#3c352d] placeholder-[#a19688]/70 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] transition-all font-sans text-sm"
            />
          </div>
        </div>

        {/* Gender Selection */}
        <div className="space-y-1">
          <label className="block font-sans text-[10px] tracking-widest uppercase text-[#8c7f70] font-semibold mb-2">
            Gênero
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setGender("feminino")}
              className={`py-3 px-4 rounded-lg border text-xs sm:text-sm font-sans tracking-widest uppercase transition-all duration-300 focus:outline-none ${
                gender === "feminino"
                  ? "bg-[#8c6239] border-[#8c6239] text-[#f4f1eb] shadow-md"
                  : "bg-[#ede9de]/20 border-[#8c7f70]/20 text-[#6e6356] hover:bg-[#ede9de]/40"
              }`}
            >
              Feminino
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setGender("masculino")}
              className={`py-3 px-4 rounded-lg border text-xs sm:text-sm font-sans tracking-widest uppercase transition-all duration-300 focus:outline-none ${
                gender === "masculino"
                  ? "bg-[#8c6239] border-[#8c6239] text-[#f4f1eb] shadow-md"
                  : "bg-[#ede9de]/20 border-[#8c7f70]/20 text-[#6e6356] hover:bg-[#ede9de]/40"
              }`}
            >
              Masculino
            </button>
          </div>
        </div>

        {/* Date & Time Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block font-sans text-[10px] tracking-widest uppercase text-[#8c7f70] font-semibold">
              Data de Nascimento
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7f70]/60" />
              <input
                type="date"
                required
                disabled={isLoading}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#ede9de]/40 border border-[#8c7f70]/20 rounded-lg text-[#3c352d] focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] transition-all font-sans text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-sans text-[10px] tracking-widest uppercase text-[#8c7f70] font-semibold">
              Hora de Nascimento
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7f70]/60" />
              <input
                type="time"
                required
                disabled={isLoading}
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#ede9de]/40 border border-[#8c7f70]/20 rounded-lg text-[#3c352d] focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] transition-all font-sans text-sm"
              />
            </div>
          </div>
        </div>

        {/* Birth Place Auto-Complete */}
        <div className="space-y-1 relative" ref={dropdownRef}>
          <label className="block font-sans text-[10px] tracking-widest uppercase text-[#8c7f70] font-semibold">
            Local de Nascimento
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7f70]/60" />
            <input
              type="text"
              required
              disabled={isLoading}
              value={birthPlaceName}
              onChange={(e) => {
                setBirthPlaceName(e.target.value);
                if (selectedPlace && selectedPlace.name !== e.target.value) {
                  setSelectedPlace(null);
                }
              }}
              placeholder="Digite a sua cidade de nascimento..."
              className="w-full pl-10 pr-10 py-3 bg-[#ede9de]/40 border border-[#8c7f70]/20 rounded-lg text-[#3c352d] placeholder-[#a19688]/70 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] transition-all font-sans text-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c6239] animate-spin" />
            )}
            {!isSearching && selectedPlace && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
            )}
          </div>

          {/* Autocomplete Dropdown suggestions list */}
          <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-[#f4f1eb] border border-[#8c7f70]/20 rounded-lg shadow-xl divide-y divide-[#8c7f70]/10"
              >
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-2.5 text-xs text-[#3c352d] hover:bg-[#ede9de]/60 transition-colors focus:outline-none font-sans leading-relaxed"
                  >
                    {item.display_name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {typingError && (
            <p className="text-[11px] text-red-600 italic mt-1">{typingError}</p>
          )}

          {selectedPlace && (
            <div className="mt-1 flex items-center justify-between text-[10px] text-[#8c7f70] font-mono uppercase tracking-wider bg-[#ede9de]/20 px-2.5 py-1 rounded">
              <span>LAT: {selectedPlace.latitude.toFixed(4)} • LON: {selectedPlace.longitude.toFixed(4)}</span>
              <span>TZ: {selectedPlace.timezone}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !name || !birthDate || !birthTime || !selectedPlace}
          className="w-full py-4 mt-2 bg-[#3c352d] text-[#f4f1eb] font-sans tracking-[0.2em] uppercase rounded-lg hover:bg-[#5c4d66] active:scale-[0.98] transition-all duration-300 shadow-md font-medium text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#3c352d]"
        >
          {isLoading ? "Gerando Matriz..." : "Gerar Síntese Estrutural"}
        </button>
      </form>
    </motion.div>
  );
}
