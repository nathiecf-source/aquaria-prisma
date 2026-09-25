import React, { useEffect, useRef, useState } from "react";
import GlobalBanner from "./GlobalBanner";
import { StoryCard } from "./StoryCard";
import { DailySkyStoryCard } from "./DailySkyStoryCard";
import { DailySkySummaryCard } from "./DailySkySummaryCard";
import { DailySkyNakshatraCard } from "./DailySkyNakshatraCard";
import { DailySkyPillarsCard } from "./DailySkyPillarsCard";
import { Calendar, Mail, Send, Bell, Rocket, Copy, Download, Sparkles } from "lucide-react";
import { MONTHLY_SUBSCRIPTION_URL } from "../lib/plans";
import { downloadImage, generatePngFromElement } from "./share/shareUtils";

interface AdminPageProps {
  userProfile?: any;
}

interface Metrics {
  totalUsers: number;
  activePlusUsers: number;
}

interface Funnel {
  viewPaywall: number;
  viewPlans: number;
  checkoutInitiated: number;
  checkoutCompleted: number;
}

interface SystemSettings {
  chat_active: boolean;
  checkout_active: boolean;
  banner_active: boolean;
  banner_text: string;
  chamado_active: boolean;
  chamado_expires_at: string | null;
  chamado_features: string[];
  chamado_banner_text: string;
  chamado_chat_free_quota: number;
}

interface FoundUser {
  id: string;
  email: string;
  profile: any;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "cupons", label: "Cupons e Parcerias" },
  { id: "chamado", label: "O Chamado" },
  { id: "feedbacks", label: "Feedbacks" },
  { id: "push", label: "Push" },
  { id: "ceu-do-dia", label: "Céu do Dia" },
  { id: "avisos", label: "Avisos Globais" },
  { id: "suporte", label: "Suporte Técnico" },
];

const BASE_URL = typeof window !== "undefined" ? (import.meta.env.VITE_APP_URL || window.location.origin) : "";

const EVENT_LABELS: Record<string, { label: string; icon: string }> = {
  view_paywall: { label: "Visualizou o cadeado/paywall", icon: "👁️" },
  view_plans: { label: "Abriu a tela de planos", icon: "💰" },
  checkout_initiated: { label: "Foi para a InfinitePay", icon: "💳" },
};

const EMAIL_TEMPLATES: Record<string, { id: string; label: string; subject: string; body: string }> = {
  "lembrete-vencimento": {
    id: "lembrete-vencimento",
    label: "Lembrete de Vencimento",
    subject: "Seu ciclo na Aquar.IA está se encerrando",
    body: `Olá!\n\nSeu acesso PLUS na Aquar.IA está próximo do vencimento.\nPara não perder a continuidade das suas leituras, trânsitos e meditações, renove sua assinatura mensal.\n\nAcesse: ${MONTHLY_SUBSCRIPTION_URL}\n\nCom carinho,\nEquipe Aquar.IA`,
  },
  "boas-vindas-manual": {
    id: "boas-vindas-manual",
    label: "Boas-vindas Manuais",
    subject: "Seu acesso completo foi liberado!",
    body: `Olá!\n\nSeu acesso PLUS na Aquar.IA foi liberado. Agora você pode explorar todas as casas, caminhos, trânsitos, meditações e o chat astrológico.\n\nAproveite o seu mapa com profundidade.\n\nBem-vinda,\nEquipe Aquar.IA`,
  },
  "aviso-suporte": {
    id: "aviso-suporte",
    label: "Aviso de Suporte",
    subject: "Atualizamos o seu mapa astral",
    body: `Olá!\n\nSeu mapa astral na Aquar.IA foi atualizado com ajustes técnicos. Recomendamos que acesse novamente para conferir as leituras sincronizadas.\n\nSe precisar de ajuda, estamos por aqui.\n\nAtenciosamente,\nEquipe Aquar.IA`,
  },
};

function formatEventLabel(eventName: string): { label: string; icon: string } {
  return EVENT_LABELS[eventName] || { label: eventName.replace(/_/g, " "), icon: "●" };
}

interface DailySkyResult {
  date: string;
  timezone: string;
  referenceTime: string;
  payload: any;
  content: {
    theme: string;
    stories: Array<{ screen: number; title: string; text: string }>;
    aspectCoverage: Array<{ aspectId: string; usedIn: string[]; interpretation: string; role: string }>;
    nakshatraCardTitle: string;
    nakshatraCardText: string;
    nakshatraDeepText: string;
    pillarGuidance: { vara: string; tithi: string; yoga: string; karana: string };
    feedParagraphs: string[];
    closing: string;
    cardSummary: string;
  };
}

function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function AdminPage({ userProfile }: AdminPageProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [metrics, setMetrics] = useState<Metrics>({ totalUsers: 0, activePlusUsers: 0 });
  const [funnel, setFunnel] = useState<Funnel>({ viewPaywall: 0, viewPlans: 0, checkoutInitiated: 0, checkoutCompleted: 0 });
  const [settings, setSettings] = useState<SystemSettings>({
    chat_active: true,
    checkout_active: true,
    banner_active: false,
    banner_text: "",
    chamado_active: false,
    chamado_expires_at: null,
    chamado_features: [],
    chamado_banner_text: "",
    chamado_chat_free_quota: 3,
  });
  const [searchEmail, setSearchEmail] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<FoundUser | null>(null);
  const [grantPlanId, setGrantPlanId] = useState("annual-launch");
  const [grantDate, setGrantDate] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    maxUses: "",
    expiresAt: "",
  });
  const [couponLoading, setCouponLoading] = useState(false);
  const [bannerText, setBannerText] = useState("");
  const [chamadoActive, setChamadoActive] = useState(false);
  const [chamadoExpiresAt, setChamadoExpiresAt] = useState("");
  const [chamadoFeatures, setChamadoFeatures] = useState<string[]>([]);
  const [chamadoBannerText, setChamadoBannerText] = useState("");
  const [chamadoChatFreeQuota, setChamadoChatFreeQuota] = useState(3);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [previewStory, setPreviewStory] = useState<{ content: string; id: string } | null>(null);

  const [pushTestTitle, setPushTestTitle] = useState("Aquar.IA — Teste de notificação");
  const [pushTestMessage, setPushTestMessage] = useState("Se você recebeu esta mensagem, o push está funcionando.");
  const [pushLoading, setPushLoading] = useState(false);
  const [dailySkyDate, setDailySkyDate] = useState(todayInSaoPaulo);
  const [dailySkyLoading, setDailySkyLoading] = useState(false);
  const [dailySkyResult, setDailySkyResult] = useState<DailySkyResult | null>(null);
  const [dailySkyError, setDailySkyError] = useState<string | null>(null);
  const [dailySkyTechnicalOpen, setDailySkyTechnicalOpen] = useState(false);
  const storyCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const nakshatraCardRef = useRef<HTMLDivElement | null>(null);
  const pillarsCardRef = useRef<HTMLDivElement | null>(null);
  const summaryCardRef = useRef<HTMLDivElement | null>(null);

  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [emailModal, setEmailModal] = useState<{
    open: boolean;
    templateId: string;
    label: string;
    subject: string;
    body: string;
  } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    if (!userProfile.is_admin) {
      window.location.href = "/";
      return;
    }
    loadMetrics();
    loadSettings().then(() => setLoading(false));
    loadFunnel();
    loadCoupons();
    loadFeedbacks();
  }, [userProfile]);

  useEffect(() => {
    if (!searchEmail.trim()) {
      setFoundUsers([]);
      setSelectedUser(null);
      return;
    }
    const timeout = setTimeout(() => doSearch(), 300);
    return () => clearTimeout(timeout);
  }, [searchEmail]);

  useEffect(() => {
    if (selectedUser?.id) {
      loadUserEvents(selectedUser.id);
    } else {
      setUserEvents([]);
    }
  }, [selectedUser?.id]);

  async function getToken(): Promise<string | null> {
    const { data } = await (await import("../lib/supabaseClient")).supabase.auth.getSession();
    return data?.session?.access_token || null;
  }

  async function handleSendTestPush() {
    setPushLoading(true);
    setMessage(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/test-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ title: pushTestTitle, message: pushTestMessage }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: `Notificação de teste enviada. ID: ${data.notificationId || "—"}` });
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao enviar notificação de teste." });
      }
    } catch (err) {
      console.error("[Admin] Erro ao enviar teste push:", err);
      setMessage({ type: "error", text: "Erro ao enviar notificação de teste." });
    } finally {
      setPushLoading(false);
    }
  }

  async function handleTriggerDailyPush() {
    setPushLoading(true);
    setMessage(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/trigger-daily-transit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: `Trânsito do dia enviado: ${data.summary?.title || "—"}` });
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao disparar trânsito do dia." });
      }
    } catch (err) {
      console.error("[Admin] Erro ao disparar trânsito do dia:", err);
      setMessage({ type: "error", text: "Erro ao disparar trânsito do dia." });
    } finally {
      setPushLoading(false);
    }
  }

  async function handleGenerateDailySky() {
    setDailySkyLoading(true);
    setDailySkyError(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/daily-sky-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ date: dailySkyDate }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o Céu do Dia.");
      setDailySkyResult(data);
    } catch (error: any) {
      setDailySkyError(error?.message || "Não foi possível gerar o Céu do Dia.");
    } finally {
      setDailySkyLoading(false);
    }
  }

  async function copyDailySkyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: "success", text: "Conteúdo copiado." });
    } catch {
      setMessage({ type: "error", text: "Não foi possível copiar o conteúdo." });
    }
  }

  async function downloadDailySkyCard(element: HTMLDivElement | null, filename: string) {
    if (!element) return;
    const dataUrl = await generatePngFromElement(element, { pixelRatio: 2 });
    downloadImage(dataUrl, filename);
  }

  async function downloadAllDailySkyCards() {
    if (!dailySkyResult) return;
    await downloadDailySkyCard(storyCardRefs.current[0], `aquaria-ceu-${dailySkyDate}-ceu-de-hoje.png`);
    await downloadDailySkyCard(nakshatraCardRef.current, `aquaria-ceu-${dailySkyDate}-nakshatra.png`);
    await downloadDailySkyCard(pillarsCardRef.current, `aquaria-ceu-${dailySkyDate}-pilares-do-dia.png`);
    await downloadDailySkyCard(summaryCardRef.current, `aquaria-ceu-${dailySkyDate}-resumo.png`);
  }

  async function loadMetrics() {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/metrics", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMetrics(data);
    } catch (err) {
      console.error("[Admin] Erro ao carregar métricas:", err);
    }
  }

  async function loadFunnel() {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/funnel", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setFunnel(data);
    } catch (err) {
      console.error("[Admin] Erro ao carregar funil:", err);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSettings(data);
        setBannerText(typeof data.banner_text === "string" ? data.banner_text : "");
        setChamadoActive(data.chamado_active === true);
        setChamadoExpiresAt(data.chamado_expires_at ? data.chamado_expires_at.slice(0, 16) : "");
        setChamadoFeatures(Array.isArray(data.chamado_features) ? data.chamado_features : []);
        setChamadoBannerText(typeof data.chamado_banner_text === "string" ? data.chamado_banner_text : "");
        setChamadoChatFreeQuota(typeof data.chamado_chat_free_quota === "number" ? data.chamado_chat_free_quota : 3);
      }
    } catch (err) {
      console.error("[Admin] Erro ao carregar settings:", err);
    }
  }

  async function loadFeedbacks() {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/feedbacks", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setFeedbacks(data.feedbacks || []);
    } catch (err) {
      console.error("[Admin] Erro ao carregar feedbacks:", err);
    }
  }

  async function toggleFeatureFeedback(id: string, featured: boolean) {
    const current = feedbacks.find((f) => f.id === id);
    if (!current) return;

    const nextFeatured = !featured;
    // Feedback publico precisa ter nota >= 4
    if (nextFeatured && current.rating < 4) {
      setMessage({ type: "error", text: "Apenas depoimentos com nota 4 ou 5 podem ser destacados." });
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/feedbacks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ is_featured: nextFeatured }),
      });

      if (res.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, is_featured: nextFeatured } : f))
        );
        setMessage({ type: "success", text: `Depoimento ${nextFeatured ? "destacado" : "removido dos destaques"}.` });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error || "Erro ao atualizar destaque." });
      }
    } catch (err) {
      console.error("[Admin] Erro ao destacar feedback:", err);
      setMessage({ type: "error", text: "Erro ao atualizar destaque." });
    }
  }

  async function handleDeleteFeedback(id: string) {
    if (!window.confirm("Tem certeza que deseja apagar este depoimento? Ele será removido do carrossel público.")) return;

    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/feedbacks/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (res.ok) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        setMessage({ type: "success", text: "Depoimento apagado." });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error || "Erro ao apagar depoimento." });
      }
    } catch (err) {
      console.error("[Admin] Erro ao deletar feedback:", err);
      setMessage({ type: "error", text: "Erro ao apagar depoimento." });
    }
  }

  async function loadCoupons() {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/coupons", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setCoupons(data.coupons || []);
    } catch (err) {
      console.error("[Admin] Erro ao carregar cupons:", err);
    }
  }

  async function updateSetting(key: keyof SystemSettings, value: any) {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setMessage({ type: "success", text: `Configuração ${key} atualizada.` });
      } else {
        setMessage({ type: "error", text: "Erro ao atualizar configuração." });
      }
    } catch (err) {
      console.error("[Admin] Erro ao atualizar setting:", err);
      setMessage({ type: "error", text: "Erro ao atualizar configuração." });
    }
  }

  async function doSearch() {
    if (!searchEmail.trim()) return;
    setSearchLoading(true);
    setMessage(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/users/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ email: searchEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.users) {
        setFoundUsers(data.users);
        if (data.users.length === 1) setSelectedUser(data.users[0]);
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao buscar usuárias." });
      }
    } catch (err) {
      console.error("[Admin] Erro na busca:", err);
      setMessage({ type: "error", text: "Erro ao buscar usuária." });
    } finally {
      setSearchLoading(false);
    }
  }

  async function callAction(endpoint: string, body: any, label: string) {
    setActionLoading(label);
    setMessage(null);
    try {
      const token = await getToken();
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: `Ação "${label}" concluída com sucesso.` });
        loadMetrics();
        loadFunnel();
        doSearch();
      } else {
        setMessage({ type: "error", text: data.error || `Erro na ação "${label}".` });
      }
    } catch (err) {
      console.error("[Admin] Erro na ação:", err);
      setMessage({ type: "error", text: `Erro na ação "${label}".` });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleGrace() {
    if (!selectedUser) return;
    await callAction("/api/admin/users/grace", { userId: selectedUser.id }, "+7 Dias de Cortesia");
  }

  async function handleGrant() {
    if (!selectedUser || !grantDate) return;
    await callAction(
      "/api/admin/users/grant",
      { userId: selectedUser.id, planId: grantPlanId, expiresAt: grantDate },
      "Liberar Acesso PLUS"
    );
  }

  async function handleResetChart() {
    if (!selectedUser) return;
    await callAction("/api/admin/users/reset-chart", { userId: selectedUser.id }, "Resetar Mapa/Sessão");
  }

  async function loadUserEvents(userId: string) {
    setEventsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/user-events?userId=${encodeURIComponent(userId)}`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.events)) {
        setUserEvents(data.events);
      } else {
        setUserEvents([]);
      }
    } catch (err) {
      console.error("[Admin] Erro ao carregar eventos:", err);
      setUserEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }

  async function handleSendEmail() {
    if (!emailModal || !selectedUser) return;
    setEmailLoading(true);
    setMessage(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          template_id: emailModal.templateId,
          user_email: selectedUser.email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const mode = data.simulated === false ? "enviado" : "simulado";
        setMessage({ type: "success", text: `E-mail "${emailModal.label}" ${mode} para ${selectedUser.email}.` });
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao disparar e-mail." });
      }
    } catch (err) {
      console.error("[Admin] Erro ao enviar e-mail:", err);
      setMessage({ type: "error", text: "Erro ao disparar e-mail." });
    } finally {
      setEmailLoading(false);
      setEmailModal(null);
    }
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue) return;

    setCouponLoading(true);
    setMessage(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          code: couponForm.code,
          discount_type: couponForm.discountType,
          discount_value: Number(couponForm.discountValue),
          max_uses: couponForm.maxUses,
          expires_at: couponForm.expiresAt,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: `Cupom ${data.coupon?.code} criado.` });
        setCouponForm({ code: "", discountType: "percentage", discountValue: "", maxUses: "", expiresAt: "" });
        loadCoupons();
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao criar cupom." });
      }
    } catch (err) {
      console.error("[Admin] Erro ao criar cupom:", err);
      setMessage({ type: "error", text: "Erro ao criar cupom." });
    } finally {
      setCouponLoading(false);
    }
  }

  async function copyCouponLink(code: string) {
    const url = `${BASE_URL}/planos?cupom=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage({ type: "success", text: "Link copiado para a área de transferência." });
    } catch {
      setMessage({ type: "error", text: "Não foi possível copiar o link." });
    }
  }

  async function handleSaveBanner() {
    await updateSetting("banner_text", bannerText.trim());
  }

  async function handleSaveChamado() {
    const features: string[] = [...chamadoFeatures];

    let expiresValue: any = null;
    if (chamadoActive && chamadoExpiresAt) {
      expiresValue = new Date(chamadoExpiresAt).toISOString();
    }

    const freeQuota = Math.max(1, Math.min(5, Math.floor(Number(chamadoChatFreeQuota) || 3)));
    await updateSetting("chamado_active", chamadoActive);
    await updateSetting("chamado_expires_at", expiresValue);
    await updateSetting("chamado_features", features);
    await updateSetting("chamado_banner_text", chamadoBannerText.trim());
    await updateSetting("chamado_chat_free_quota", freeQuota);

    setSettings((prev) => ({
      ...prev,
      chamado_active: chamadoActive,
      chamado_expires_at: expiresValue,
      chamado_features: features,
      chamado_banner_text: chamadoBannerText.trim(),
      chamado_chat_free_quota: freeQuota,
    }));
  }

  async function handleDeleteCoupon(id: string) {
    if (!window.confirm("Tem certeza que deseja deletar este cupom?")) return;

    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Cupom deletado." });
        loadCoupons();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error || "Erro ao deletar cupom." });
      }
    } catch (err) {
      console.error("[Admin] Erro ao deletar cupom:", err);
      setMessage({ type: "error", text: "Erro ao deletar cupom." });
    }
  }

  function handlePreviewStory(content: string, id: string) {
    setPreviewStory({ content, id });
  }

  function toggleChamadoFeature(key: string) {
    setChamadoFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  }

  if (!userProfile?.is_admin) {
    return (
      <div className="min-h-screen bg-[#f4f1eb] flex items-center justify-center">
        <p className="text-[#8c7f70] text-xs uppercase tracking-widest">Redirecionando...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1eb] flex items-center justify-center">
        <p className="text-[#8c7f70] text-xs uppercase tracking-widest animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  const isPlus = selectedUser?.profile?.has_access === true &&
    (!selectedUser?.profile?.access_expires_at || new Date(selectedUser.profile.access_expires_at) > new Date());

  const funnelMax = Math.max(funnel.viewPaywall, 1);
  const funnelSteps = [
    { label: "Visualizou Barreira", value: funnel.viewPaywall, color: "bg-[#8c7f70]" },
    { label: "Viu Planos", value: funnel.viewPlans, color: "bg-[#8c6239]" },
    { label: "Iniciou Checkout", value: funnel.checkoutInitiated, color: "bg-[#6b452b]" },
    { label: "Pagou", value: funnel.checkoutCompleted, color: "bg-emerald-600" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#3c352d]">
      <GlobalBanner />
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <header className="mb-6 text-center">
          <h1 className="font-serif text-2xl md:text-3xl tracking-[0.15em] uppercase text-[#3c352d] mb-2">
            Painel Administrativo
          </h1>
          <p className="text-sm text-[#6e6356]">Gestão interna da AQUAR.IA</p>
        </header>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm text-center ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-100 text-emerald-800"
                : "bg-red-50 border border-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab.id
                  ? "bg-[#3c352d] text-[#fbf9f5]"
                  : "bg-white border border-[#e6e2d8] text-[#6e6356] hover:border-[#8c6239]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && (
          <section className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm">
                <h2 className="text-xs uppercase tracking-widest text-[#6e6356] mb-4">Métricas Rápidas</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-[#e6e2d8] rounded-xl p-4 text-center">
                    <p className="font-serif text-3xl font-bold text-[#8c6239]">{metrics.totalUsers}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#6e6356] mt-1">Total de Usuárias</p>
                  </div>
                  <div className="bg-white border border-[#e6e2d8] rounded-xl p-4 text-center">
                    <p className="font-serif text-3xl font-bold text-[#8c6239]">{metrics.activePlusUsers}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#6e6356] mt-1">Contas PLUS Ativas</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm">
                <h2 className="text-xs uppercase tracking-widest text-[#6e6356] mb-4">Kill Switch</h2>
                <div className="space-y-4">
                  {[
                    { key: "chat_active", label: "Oráculo/Chat" },
                    { key: "checkout_active", label: "Checkout /planos" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-[#3c352d]">{item.label}</p>
                        <p className="text-xs text-[#6e6356]">{settings[item.key as keyof SystemSettings] ? "Ativo" : "Pausado"}</p>
                      </div>
                      <button
                        onClick={() => updateSetting(item.key as keyof SystemSettings, !settings[item.key as keyof SystemSettings])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings[item.key as keyof SystemSettings] ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings[item.key as keyof SystemSettings] ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm">
              <h2 className="text-xs uppercase tracking-widest text-[#6e6356] mb-4">Funil de Vendas</h2>
              <div className="space-y-4">
                {funnelSteps.map((step, index) => {
                  const pct = Math.round((step.value / funnelMax) * 100);
                  return (
                    <div key={step.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-[#3c352d]">{index + 1}. {step.label}</span>
                        <span className="text-[#6e6356]">{step.value} ({pct}%)</span>
                      </div>
                      <div className="h-3 w-full bg-white border border-[#e6e2d8] rounded-full overflow-hidden">
                        <div className={`h-full ${step.color} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === "cupons" && (
          <section className="space-y-6">
            <div className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm">
              <h2 className="text-xs uppercase tracking-widest text-[#6e6356] mb-4">Criar Cupom</h2>
              <form onSubmit={handleCreateCoupon} className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="Código"
                  className="px-4 py-2.5 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] placeholder-[#8c7f70] focus:outline-none focus:border-[#8c6239]"
                />
                <select
                  value={couponForm.discountType}
                  onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                  className="px-4 py-2.5 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] focus:outline-none focus:border-[#8c6239]"
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
                <input
                  type="number"
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                  placeholder={couponForm.discountType === "percentage" ? "Desconto %" : "Desconto em centavos"}
                  className="px-4 py-2.5 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] placeholder-[#8c7f70] focus:outline-none focus:border-[#8c6239]"
                />
                <input
                  type="number"
                  value={couponForm.maxUses}
                  onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                  placeholder="Limite de usos (opcional)"
                  className="px-4 py-2.5 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] placeholder-[#8c7f70] focus:outline-none focus:border-[#8c6239]"
                />
                <input
                  type="date"
                  value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                  className="px-4 py-2.5 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] focus:outline-none focus:border-[#8c6239]"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponForm.code || !couponForm.discountValue}
                  className="px-5 py-2.5 bg-[#3c352d] text-[#fbf9f5] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#2a251f] disabled:opacity-60"
                >
                  {couponLoading ? "Criando..." : "Criar Cupom"}
                </button>
              </form>
            </div>

            <div className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm overflow-x-auto">
              <h2 className="text-xs uppercase tracking-widest text-[#6e6356] mb-4">Cupons Ativos</h2>
              {coupons.length === 0 ? (
                <p className="text-sm text-[#6e6356]">Nenhum cupom cadastrado.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase tracking-widest text-[#6e6356] border-b border-[#e6e2d8]">
                    <tr>
                      <th className="pb-2 pr-4">Código</th>
                      <th className="pb-2 pr-4">Desconto</th>
                      <th className="pb-2 pr-4">Usos</th>
                      <th className="pb-2 pr-4">Expira</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b border-[#e6e2d8]/50 last:border-0">
                        <td className="py-3 pr-4 font-medium">{coupon.code}</td>
                        <td className="py-3 pr-4 text-[#6e6356]">
                          {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `R$ ${(coupon.discount_value / 100).toFixed(2)}`}
                        </td>
                        <td className="py-3 pr-4 text-[#6e6356]">
                          {coupon.current_uses || 0}
                          {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                        </td>
                        <td className="py-3 pr-4 text-[#6e6356]">
                          {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="py-3 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyCouponLink(coupon.code)}
                            className="px-3 py-1.5 bg-[#8c6239] text-[#fbf9f5] text-[10px] font-bold uppercase tracking-wider rounded hover:bg-[#6b452b]"
                          >
                            Copiar Link
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="px-3 py-1.5 bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-red-800"
                          >
                            Deletar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activeTab === "chamado" && (
          <section className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs uppercase tracking-widest text-[#6e6356] mb-4">O Chamado (Acesso Global)</h2>

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-semibold text-sm text-[#3c352d]">Ativar Chamado</p>
                <p className="text-xs text-[#6e6356]">{chamadoActive ? "Ativo" : "Inativo"}</p>
              </div>
              <button
                onClick={() => setChamadoActive((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  chamadoActive ? "bg-emerald-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    chamadoActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] uppercase tracking-widest text-[#6e6356] mb-2">Expira em</label>
              <input
                type="datetime-local"
                value={chamadoExpiresAt}
                onChange={(e) => setChamadoExpiresAt(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] focus:outline-none focus:border-[#8c6239]"
              />
            </div>

            {chamadoActive && (
              <div className="space-y-6 mb-6">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#6e6356]">Texto do Banner do Chamado</p>
                  <input
                    type="text"
                    value={chamadoBannerText}
                    onChange={(e) => setChamadoBannerText(e.target.value)}
                    placeholder="ex: Portal Aberto: Leitura da Casa 8 liberada"
                    className="w-full px-4 py-2.5 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] focus:outline-none focus:border-[#8c6239]"
                  />
                  <p className="text-xs text-[#6e6356]">Se deixar em branco, o painel exibe "Portal Aberto" + contador.</p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#6e6356]">Módulos Liberados</p>

                  {[
                    { key: "chat", label: "Chat Astrológico" },
                    { key: "ciclos", label: "Aba Ciclos Ativos (toda)" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 bg-white border border-[#e6e2d8] rounded-lg p-3 cursor-pointer hover:border-[#8c6239]">
                      <input
                        type="checkbox"
                        checked={chamadoFeatures.includes(item.key)}
                        onChange={() => toggleChamadoFeature(item.key)}
                        className="w-4 h-4 accent-[#8c6239]"
                      />
                      <span className="text-sm text-[#3c352d]">{item.label}</span>
                    </label>
                  ))}

                  {chamadoFeatures.includes("chat") && (
                    <div className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-lg p-4">
                      <label className="block text-[10px] uppercase tracking-widest text-[#6e6356] mb-2">
                        Perguntas gratuitas de chat (por usuário free)
                      </label>
                      <select
                        value={chamadoChatFreeQuota}
                        onChange={(e) => setChamadoChatFreeQuota(Number(e.target.value))}
                        className="px-3 py-2 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] focus:outline-none focus:border-[#8c6239]"
                      >
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} pergunta{n !== 1 ? "s" : ""}</option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-[#6e6356]">
                        Cada usuário FREE ganha esse número de perguntas enquanto o Chamado estiver ativo.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#e6e2d8] rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#6e6356] mb-2">Casas da Mandala (selecione várias)</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const key = `casa_${i + 1}`;
                      return (
                        <label key={key} className="flex items-center gap-1.5 text-sm text-[#3c352d] cursor-pointer hover:text-[#8c6239]">
                          <input
                            type="checkbox"
                            checked={chamadoFeatures.includes(key)}
                            onChange={() => toggleChamadoFeature(key)}
                            className="w-4 h-4 accent-[#8c6239]"
                          />
                          {i + 1}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-[#e6e2d8] rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#6e6356] mb-2">Caminhos (selecione vários)</p>
                  <div className="space-y-2">
                    {[
                      { key: "eixo-ic", label: "Eixo IC (Consciência)" },
                      { key: "eixo-dsc", label: "Eixo DSC (Reconexão)" },
                      { key: "eixo-mc", label: "Eixo MC (Realização)" },
                      { key: "caminho-assimilacao", label: "Caminho de Integração" },
                      { key: "caminho-manifestacao", label: "Caminho de Manifestação" },
                      { key: "caminho-transformacao", label: "Caminho da Transformação" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 text-sm text-[#3c352d] cursor-pointer hover:text-[#8c6239]">
                        <input
                          type="checkbox"
                          checked={chamadoFeatures.includes(item.key)}
                          onChange={() => toggleChamadoFeature(item.key)}
                          className="w-4 h-4 accent-[#8c6239]"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSaveChamado}
              className="px-5 py-2.5 bg-[#3c352d] text-[#fbf9f5] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#2a251f]"
            >
              Salvar Chamado
            </button>
          </section>
        )}

        {activeTab === "feedbacks" && (
          <section className="space-y-6">
            <div className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs uppercase tracking-widest text-[#6e6356]">Mural de Prova Social</h2>
                <p className="text-[10px] text-[#8c7f70]">
                  Só os depoimentos com <strong>Destaque</strong> aparecem no carrossel da avaliação.
                </p>
              </div>
              {feedbacks.length === 0 ? (
                <p className="text-sm text-[#6e6356]">Nenhum depoimento cadastrado.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase tracking-widest text-[#6e6356] border-b border-[#e6e2d8]">
                    <tr>
                      <th className="pb-2 pr-4">Destaque</th>
                      <th className="pb-2 pr-4">Autor</th>
                      <th className="pb-2 pr-4">Nota</th>
                      <th className="pb-2 pr-4">Depoimento</th>
                      <th className="pb-2 pr-4">Data</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks
                      .filter((feedback) => !feedback.is_deleted)
                      .map((feedback) => (
                      <tr key={feedback.id} className="border-b border-[#e6e2d8]/50 last:border-0">
                        <td className="py-3 pr-4">
                          <input
                            type="checkbox"
                            checked={feedback.is_featured === true}
                            onChange={() => toggleFeatureFeedback(feedback.id, feedback.is_featured === true)}
                            disabled={feedback.rating < 4 && !feedback.is_featured}
                            className="w-4 h-4 accent-[#8c6239]"
                            title={feedback.rating < 4 ? "Apenas notas 4 ou 5 podem ser destacadas" : "Aparece no carrossel"}
                          />
                        </td>
                        <td className="py-3 pr-4 font-medium">Anônimo</td>
                        <td className="py-3 pr-4 text-[#6e6356]">{feedback.rating} ⭐</td>
                        <td className="py-3 pr-4 text-[#6e6356] max-w-md truncate">{feedback.content}</td>
                        <td className="py-3 pr-4 text-[#6e6356]">
                          {new Date(feedback.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handlePreviewStory(feedback.content, feedback.id)}
                              className="px-3 py-1.5 bg-[#3c352d] text-[#fbf9f5] text-[10px] font-bold uppercase tracking-wider rounded hover:bg-[#2a251f]"
                            >
                              Card
                            </button>
                            <button
                              onClick={() => handleDeleteFeedback(feedback.id)}
                              className="px-3 py-1.5 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-red-50 transition-colors"
                            >
                              Apagar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {previewStory && (
              <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#3c352d]/80 p-4 overflow-y-auto">
                <div className="relative w-full max-w-[540px] flex flex-col items-center py-4">
                  <button
                    onClick={() => setPreviewStory(null)}
                    className="mb-3 px-4 py-2 bg-[#fbf9f5] text-[#3c352d] text-xs font-bold uppercase tracking-widest rounded hover:bg-[#e6e2d8] transition-colors"
                  >
                    Fechar Preview
                  </button>
                  <p className="text-[#f4f1eb] text-[10px] mb-3 opacity-80 text-center max-w-md">
                    O card está no formato 9:16 (Stories). Em desktop, o print fica em 540x960. No celular, ele se ajusta à tela.
                  </p>
                  <div className="w-full border-4 border-[#d4af37]/30 shadow-2xl">
                    <StoryCard content={previewStory.content} id={previewStory.id} />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "push" && (
          <section className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-xs uppercase tracking-widest text-[#6e6356] mb-4">Notificações Push</h2>

            <div className="p-4 bg-[#f4f1eb] border border-[#e6e2d8] rounded-2xl">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Teste Manual
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={pushTestTitle}
                  onChange={(e) => setPushTestTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#e6e2d8] rounded-lg text-sm text-[#3c352d]"
                  placeholder="Título da notificação"
                />
                <textarea
                  value={pushTestMessage}
                  onChange={(e) => setPushTestMessage(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#e6e2d8] rounded-lg text-sm text-[#3c352d] min-h-[80px]"
                  placeholder="Mensagem da notificação"
                />
                <button
                  onClick={handleSendTestPush}
                  disabled={pushLoading}
                  className="px-4 py-2 bg-[#3c352d] text-[#fbf9f5] text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#5c4d66] transition-colors disabled:opacity-50"
                >
                  {pushLoading ? "Enviando..." : "Enviar notificação de teste"}
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#f4f1eb] border border-[#e6e2d8] rounded-2xl">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold mb-3 flex items-center gap-2">
                <Rocket className="w-4 h-4" /> Trânsito do Dia
              </h3>
              <p className="text-xs text-[#6e6356] mb-3">
                Dispara a notificação diária com o trânsito astral principal. O Cloud Scheduler também pode chamar o endpoint cron às 08h BRT.
              </p>
              <button
                onClick={handleTriggerDailyPush}
                disabled={pushLoading}
                className="px-4 py-2 bg-[#8c6239] text-[#fbf9f5] text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#6b452b] transition-colors disabled:opacity-50"
              >
                {pushLoading ? "Disparando..." : "Disparar trânsito do dia"}
              </button>
            </div>
          </section>
        )}

        {activeTab === "ceu-do-dia" && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6e6356]"><Sparkles className="h-4 w-4" /> Céu do Dia</h2>
                  <p className="mt-2 text-xs text-[#8c7f70]">Conteúdo privado para redes sociais · referência às 08:00 em Brasília</p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-[10px] uppercase tracking-widest text-[#6e6356]">Data
                    <input type="date" value={dailySkyDate} onChange={(event) => setDailySkyDate(event.target.value)} className="mt-1 block rounded-lg border border-[#e6e2d8] bg-white px-3 py-2 text-sm text-[#3c352d]" />
                  </label>
                  <button onClick={handleGenerateDailySky} disabled={dailySkyLoading || !dailySkyDate} className="rounded-lg bg-[#2b3c5c] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#22304a] disabled:opacity-50">
                    {dailySkyLoading ? "Calculando e escrevendo..." : "Gerar conteúdo"}
                  </button>
                </div>
              </div>
              {dailySkyError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{dailySkyError}</p>}
            </div>

            {dailySkyResult && (
              <>
                <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[10px] uppercase tracking-widest text-[#8c6239]">Tema do Dia</p><h3 className="mt-2 font-serif text-xl text-[#3c352d]">{dailySkyResult.content.theme}</h3></div>
                    <button onClick={() => copyDailySkyText(dailySkyResult.content.theme)} className="rounded-lg border border-[#e6e2d8] p-2 text-[#6e6356] hover:bg-[#f4f1eb]" title="Copiar tema"><Copy className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {dailySkyResult.content.stories.map((story, index) => (
                    <React.Fragment key={story.screen}>
                      <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-4 shadow-sm">
                        <DailySkyStoryCard ref={(node) => { storyCardRefs.current[index] = node; }} title={story.title} text={story.text} date={dailySkyResult.date} />
                        <div className="mt-3 flex gap-2"><button onClick={() => copyDailySkyText(`${story.title}\n\n${story.text}`)} className="flex items-center gap-1 rounded-lg border border-[#e6e2d8] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#6e6356]"><Copy className="h-3.5 w-3.5" /> Copiar</button><button onClick={() => downloadDailySkyCard(storyCardRefs.current[index], `aquaria-ceu-${dailySkyDate}-${story.title.toLowerCase().replace(/\s+/g, "-")}.png`)} className="flex items-center gap-1 rounded-lg bg-[#3c352d] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white"><Download className="h-3.5 w-3.5" /> PNG</button></div>
                      </div>
                      {index === 0 && <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-4 shadow-sm"><DailySkyNakshatraCard ref={nakshatraCardRef} date={dailySkyResult.date} title={dailySkyResult.content.nakshatraCardTitle} pada={dailySkyResult.payload.vedic.nakshatra.pada} padaElement={dailySkyResult.payload.vedic.nakshatra.padaElement} activeUntil={dailySkyResult.payload.vedic.nakshatra.activeUntil} next={dailySkyResult.payload.vedic.nakshatra.next} text={dailySkyResult.content.nakshatraCardText} /><button onClick={() => downloadDailySkyCard(nakshatraCardRef.current, `aquaria-ceu-${dailySkyDate}-nakshatra.png`)} className="mt-3 flex items-center gap-1 rounded-lg bg-[#3c352d] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white"><Download className="h-3.5 w-3.5" /> PNG</button></div>}
                    </React.Fragment>
                  ))}
                  <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-4 shadow-sm"><DailySkyPillarsCard ref={pillarsCardRef} date={dailySkyResult.date} vedic={dailySkyResult.payload.vedic} guidance={dailySkyResult.content.pillarGuidance} /><button onClick={() => downloadDailySkyCard(pillarsCardRef.current, `aquaria-ceu-${dailySkyDate}-pilares-do-dia.png`)} className="mt-3 flex items-center gap-1 rounded-lg bg-[#3c352d] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white"><Download className="h-3.5 w-3.5" /> PNG</button></div>
                  <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-4 shadow-sm">
                    <DailySkySummaryCard ref={summaryCardRef} theme={dailySkyResult.content.theme} summary={dailySkyResult.content.cardSummary} date={dailySkyResult.date} />
                    <button onClick={() => downloadDailySkyCard(summaryCardRef.current, `aquaria-ceu-${dailySkyDate}-resumo.png`)} className="mt-3 flex items-center gap-1 rounded-lg bg-[#3c352d] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white"><Download className="h-3.5 w-3.5" /> Baixar resumo PNG</button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between"><h3 className="text-xs uppercase tracking-widest text-[#6e6356]">Legenda para o Feed</h3><button onClick={() => copyDailySkyText([...dailySkyResult.content.feedParagraphs, dailySkyResult.content.closing].join("\n\n"))} className="flex items-center gap-1 rounded-lg border border-[#e6e2d8] px-3 py-2 text-[10px] font-bold uppercase tracking-wider"><Copy className="h-3.5 w-3.5" /> Copiar</button></div>
                  <div className="space-y-3 text-sm leading-relaxed text-[#5c544d]">{dailySkyResult.content.feedParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<p className="font-medium text-[#3c352d]">{dailySkyResult.content.closing}</p></div>
                </div>

                <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between"><h3 className="text-xs uppercase tracking-widest text-[#6e6356]">Nakshatra do Dia — Símbolo &amp; Deidade</h3><button onClick={() => copyDailySkyText(dailySkyResult.content.nakshatraDeepText)} className="flex items-center gap-1 rounded-lg border border-[#e6e2d8] px-3 py-2 text-[10px] font-bold uppercase tracking-wider"><Copy className="h-3.5 w-3.5" /> Copiar</button></div>
                  <p className="text-sm leading-relaxed text-[#5c544d]">{dailySkyResult.content.nakshatraDeepText}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => copyDailySkyText(`TEMA DO DIA\n${dailySkyResult.content.theme}\n\n${dailySkyResult.content.stories.map((story) => `TELA ${story.screen}: ${story.title}\n${story.text}`).join("\n\n")}\n\nNAKSHATRA DO DIA\n${dailySkyResult.content.nakshatraDeepText}\n\nLEGENDA\n${[...dailySkyResult.content.feedParagraphs, dailySkyResult.content.closing].join("\n\n")}`)} className="flex items-center gap-2 rounded-lg border border-[#3c352d] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#3c352d]"><Copy className="h-4 w-4" /> Copiar roteiro completo</button>
                  <button onClick={downloadAllDailySkyCards} className="flex items-center gap-2 rounded-lg bg-[#8c6239] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white"><Download className="h-4 w-4" /> Baixar todos os PNGs</button>
                </div>

                <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
                  <h3 className="mb-4 text-xs uppercase tracking-widest text-[#6e6356]">Auditoria dos Dados Usados</h3>
                  <div className="mb-5 grid gap-3 text-xs sm:grid-cols-2"><p><strong>Origem:</strong> efemérides locais / astronomia</p><p><strong>Referência:</strong> {dailySkyResult.date} às {dailySkyResult.referenceTime} BRT</p><p><strong>Lua tropical:</strong> {dailySkyResult.payload.tropical.moon.phase} em {dailySkyResult.payload.tropical.moon.sign} {dailySkyResult.payload.tropical.moon.degree}°</p><p><strong>Nakshatra:</strong> {dailySkyResult.payload.vedic.nakshatra.name}, Pada {dailySkyResult.payload.vedic.nakshatra.pada}, até {dailySkyResult.payload.vedic.nakshatra.activeUntil}</p></div>
                  <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-[#e6e2d8] text-[10px] uppercase tracking-wider text-[#8c7f70]"><tr><th className="p-2">Aspecto exato</th><th className="p-2">Hora/orb</th><th className="p-2">Peso</th><th className="p-2">Uso editorial</th></tr></thead><tbody>{dailySkyResult.payload.tropical.exactMoonAspects.map((aspect: any) => { const coverage = dailySkyResult.content.aspectCoverage.find((item) => item.aspectId === aspect.id); return <tr key={aspect.id} className="border-b border-[#e6e2d8]/60"><td className="p-2 font-medium">{aspect.body1} {aspect.aspect} {aspect.body2}</td><td className="p-2">{aspect.exactTime} · {aspect.orb}°</td><td className="p-2">{aspect.role === "tension" ? "Tensão principal" : aspect.role === "support" ? "Apoio" : "Conjunção"}</td><td className="p-2">{coverage ? `${coverage.usedIn.join(", ")} — ${coverage.interpretation}` : "Não coberto"}</td></tr>; })}</tbody></table></div>
                  <div className="mt-5 grid gap-2 text-xs sm:grid-cols-2"><p><strong>Regente do dia:</strong> {dailySkyResult.payload.vedic.vara.name} · {dailySkyResult.payload.vedic.vara.ruler}</p><p><strong>Dia lunar:</strong> {dailySkyResult.payload.vedic.tithi.name}</p><p><strong>Atmosfera:</strong> {dailySkyResult.payload.vedic.yoga.name} · {dailySkyResult.payload.vedic.yoga.nature}</p><p><strong>Ação prática:</strong> {dailySkyResult.payload.vedic.karana.name}</p></div>
                </div>

                <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-4">
                  <button onClick={() => setDailySkyTechnicalOpen((open) => !open)} className="w-full text-left text-[10px] font-bold uppercase tracking-widest text-[#6e6356]">{dailySkyTechnicalOpen ? "Ocultar dados técnicos" : "Ver dados técnicos usados"}</button>
                  {dailySkyTechnicalOpen && <pre className="mt-4 max-h-[500px] overflow-auto rounded-lg bg-[#2b3c5c] p-4 text-[11px] text-[#f4f1eb]">{JSON.stringify(dailySkyResult.payload, null, 2)}</pre>}
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "avisos" && (
          <section className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs uppercase tracking-widest text-[#6e6356] mb-4">Avisos Globais</h2>
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-widest text-[#6e6356] mb-2">Mensagem do Banner</label>
              <input
                type="text"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                placeholder="Digite o aviso global"
                className="w-full px-4 py-2.5 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] placeholder-[#8c7f70] focus:outline-none focus:border-[#8c6239]"
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-semibold text-sm text-[#3c352d]">Banner Ativo</p>
                <p className="text-xs text-[#6e6356]">{settings.banner_active ? "Visível" : "Oculto"}</p>
              </div>
              <button
                onClick={() => updateSetting("banner_active", !settings.banner_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.banner_active ? "bg-emerald-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.banner_active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <button
              onClick={handleSaveBanner}
              className="px-5 py-2.5 bg-[#3c352d] text-[#fbf9f5] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#2a251f]"
            >
              Salvar Aviso
            </button>
          </section>
        )}

        {activeTab === "suporte" && (
          <section className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs uppercase tracking-widest text-[#6e6356] mb-4">Suporte Técnico</h2>

            <div className="flex gap-2 mb-6">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Buscar por e-mail"
                className="flex-1 px-4 py-2.5 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] placeholder-[#8c7f70] focus:outline-none focus:border-[#8c6239]"
              />
              {searchLoading && (
                <span className="px-3 py-2.5 text-[10px] text-[#6e6356] uppercase tracking-widest">Buscando...</span>
              )}
            </div>

            {!searchLoading && searchEmail.trim() && foundUsers.length === 0 && (
              <p className="text-sm text-[#6e6356] mb-4">Nenhuma usuária encontrada.</p>
            )}

            {foundUsers.length > 0 && (
              <div className="mb-6 space-y-2">
                {foundUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                      selectedUser?.id === u.id
                        ? "bg-[#8c6239] text-white border-[#8c6239]"
                        : "bg-white border-[#e6e2d8] hover:border-[#8c6239]"
                    }`}
                  >
                    {u.email}
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <>
              <div className="bg-white border border-[#e6e2d8] rounded-xl p-5">
                <div className="mb-4 pb-4 border-b border-[#e6e2d8]">
                  <p className="font-semibold text-[#3c352d]">{selectedUser.email}</p>
                  <p className="text-xs text-[#6e6356] mt-1">ID: {selectedUser.id}</p>
                  <div className="flex gap-3 mt-3 text-xs">
                    <span
                      className={`px-2 py-1 rounded border ${
                        isPlus
                          ? "bg-[#d4af37]/10 text-[#8c6239] border-[#d4af37]/40"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {isPlus ? "PLUS" : "FREE"}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded">
                      Plano: {selectedUser.profile?.current_plan_id || "—"}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded">
                      Expira: {selectedUser.profile?.access_expires_at
                        ? new Date(selectedUser.profile.access_expires_at).toLocaleDateString("pt-BR")
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#6e6356] mb-2">Plano</label>
                    <select
                      value={grantPlanId}
                      onChange={(e) => setGrantPlanId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] focus:outline-none focus:border-[#8c6239]"
                    >
                      <option value="annual-launch">Anual — Lançamento</option>
                      <option value="annual-official">Anual — Oficial</option>
                      <option value="semester">Semestral</option>
                      <option value="monthly">Mensal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#6e6356] mb-2">Expira em</label>
                    <input
                      type="date"
                      value={grantDate}
                      onChange={(e) => setGrantDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#d6d2c8] rounded-lg text-sm text-[#3c352d] focus:outline-none focus:border-[#8c6239]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-8">
                  <button
                    onClick={handleGrace}
                    disabled={actionLoading !== null}
                    className="px-4 py-2.5 bg-[#8c6239] text-[#fbf9f5] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#6b452b] disabled:opacity-60"
                  >
                    {actionLoading === "+7 Dias de Cortesia" ? "Aplicando..." : "+7 Dias de Cortesia"}
                  </button>
                  <button
                    onClick={handleGrant}
                    disabled={actionLoading !== null || !grantDate}
                    className="px-4 py-2.5 bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {actionLoading === "Liberar Acesso PLUS" ? "Liberando..." : "Liberar Acesso PLUS"}
                  </button>
                  <button
                    onClick={handleResetChart}
                    disabled={actionLoading !== null}
                    className="px-4 py-2.5 bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-800 disabled:opacity-60"
                  >
                    {actionLoading === "Resetar Mapa/Sessão" ? "Resetando..." : "Resetar Mapa/Sessão"}
                  </button>
                </div>

                {/* Linha do Tempo */}
                <div className="mb-8">
                  <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#6e6356] mb-3">
                    <Calendar className="w-4 h-4" />
                    Linha do Tempo
                  </h3>
                  {eventsLoading ? (
                    <p className="text-xs text-[#6e6356]">Carregando histórico...</p>
                  ) : userEvents.length === 0 ? (
                    <p className="text-sm text-[#6e6356]">Nenhum evento registrado.</p>
                  ) : (
                    <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {userEvents.map((evt) => {
                        const mapped = formatEventLabel(evt.event_name);
                        return (
                          <li
                            key={evt.id}
                            className="flex items-start gap-3 text-sm bg-[#fbf9f5] border border-[#e6e2d8] rounded-lg p-3"
                          >
                            <span className="text-lg" title={evt.event_name}>{mapped.icon}</span>
                            <div className="flex-1">
                              <p className="text-[#3c352d]">{mapped.label}</p>
                              <p className="text-[10px] text-[#8c7f70] font-mono mt-0.5">
                                {new Date(evt.created_at).toLocaleString("pt-BR")}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Comunicação Rápida */}
                <div>
                  <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#6e6356] mb-3">
                    <Mail className="w-4 h-4" />
                    Comunicação Rápida
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {Object.values(EMAIL_TEMPLATES).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setEmailModal({ open: true, templateId: template.id, label: template.label, subject: template.subject, body: template.body })}
                        className="text-left px-4 py-3 bg-white border border-[#e6e2d8] rounded-lg hover:border-[#8c6239] transition-colors"
                      >
                        <p className="text-xs font-semibold text-[#3c352d]">{template.label}</p>
                        <p className="text-[10px] text-[#6e6356] truncate">{template.subject}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {emailModal?.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="w-full max-w-lg bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-semibold text-[#3c352d] mb-2 flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#8c6239]" />
                      Confirmar envio: {emailModal.label}
                    </h3>
                    <p className="text-xs text-[#6e6356] mb-4">
                      Destinatário: <span className="font-medium text-[#3c352d]">{selectedUser.email}</span>
                    </p>
                    <div className="bg-white border border-[#e6e2d8] rounded-lg p-4 mb-4 text-sm text-[#3c352d] space-y-2">
                      <p><strong>Assunto:</strong> {emailModal.subject}</p>
                      <div className="text-[#6e6356] text-xs whitespace-pre-wrap font-mono bg-[#f4f1eb] p-3 rounded">
                        {emailModal.body}
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setEmailModal(null)}
                        disabled={emailLoading}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#6e6356] hover:text-[#3c352d] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSendEmail}
                        disabled={emailLoading}
                        className="px-5 py-2.5 bg-[#8c6239] text-[#fbf9f5] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#6b452b] disabled:opacity-60"
                      >
                        {emailLoading ? "Enviando..." : "Confirmar Envio"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
