import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  X,
  Loader2,
  Trash2,
  Plus,
  Sparkles,
  Bot,
  Square,
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { isGuestMode } from "@/lib/guest/store";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

interface FloatingChatWidgetProps {
  language?: Language;
  /** Active dashboard tab, used to offer suggestions about what the user is looking at. */
  context?: string;
}

/** Other components can open the assistant with a ready-made question:
 *  window.dispatchEvent(new CustomEvent("budget-buddy:ask", { detail: { prompt } })) */
export const BUDDY_ASK_EVENT = "budget-buddy:ask";

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000, "Message must be less than 2000 characters"),
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const LAST_CONVERSATION_KEY = "buddy:lastConversationId";

type Lang = "en" | "es" | "pt";
const asLang = (language: Language): Lang => (["en", "es", "pt"].includes(language) ? (language as Lang) : "en");

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "Budget Buddy",
    subtitle: "Answers from your active profile",
    open: "Open Budget Buddy",
    close: "Close",
    back: "Back to chat",
    history: "Conversations",
    newChat: "New chat",
    deleted: "Chat deleted",
    started: "Started a new conversation",
    placeholder: "Ask about your budget…",
    emptyTitle: "Ask me about your finances",
    emptyHint: "I read your active profile: income, expenses, debts and goals.",
    signInTitle: "Sign in to chat",
    signInBody: "You need an account so I can read your budget and answer with your real numbers.",
    signIn: "Go to sign in",
    guestTitle: "Available with an account",
    guestBody: "You are exploring with demo data. Create an account to migrate it and chat about your real budget.",
    tooLong: "Message too long",
    tooLongBody: "Maximum 2000 characters",
    stop: "Stop",
    copy: "Copy answer",
    copied: "Copied",
    retry: "Regenerate answer",
    sessionExpired: "Session expired. Please sign in again.",
    rateLimit: "Too many requests. Please try again in a moment.",
    credits: "AI credits depleted. Please add credits in Settings.",
    failed: "Failed to get an answer. Please try again.",
    noHistory: "No conversations yet",
    disclaimer: "Informational only — not financial advice.",
  },
  es: {
    title: "Budget Buddy",
    subtitle: "Respuestas con tu perfil activo",
    open: "Abrir Budget Buddy",
    close: "Cerrar",
    back: "Volver al chat",
    history: "Conversaciones",
    newChat: "Nuevo chat",
    deleted: "Chat eliminado",
    started: "Se inició una nueva conversación",
    placeholder: "Pregunta sobre tu presupuesto…",
    emptyTitle: "Pregúntame sobre tus finanzas",
    emptyHint: "Leo tu perfil activo: ingresos, gastos, deudas y metas.",
    signInTitle: "Inicia sesión para chatear",
    signInBody: "Necesitas una cuenta para que pueda leer tu presupuesto y responder con tus cifras reales.",
    signIn: "Ir a iniciar sesión",
    guestTitle: "Disponible con una cuenta",
    guestBody: "Estás explorando con datos de demo. Crea una cuenta para migrarlos y conversar sobre tu presupuesto real.",
    tooLong: "Mensaje muy largo",
    tooLongBody: "Máximo 2000 caracteres",
    stop: "Detener",
    copy: "Copiar respuesta",
    copied: "Copiado",
    retry: "Regenerar respuesta",
    sessionExpired: "Sesión expirada. Inicia sesión de nuevo.",
    rateLimit: "Demasiadas solicitudes. Intenta en un momento.",
    credits: "Créditos de IA agotados. Añade créditos en Configuración.",
    failed: "Error al obtener respuesta. Intenta de nuevo.",
    noHistory: "Aún no hay conversaciones",
    disclaimer: "Solo informativo — no es asesoramiento financiero.",
  },
  pt: {
    title: "Budget Buddy",
    subtitle: "Respostas do seu perfil ativo",
    open: "Abrir Budget Buddy",
    close: "Fechar",
    back: "Voltar ao chat",
    history: "Conversas",
    newChat: "Nova conversa",
    deleted: "Conversa eliminada",
    started: "Nova conversa iniciada",
    placeholder: "Pergunte sobre o seu orçamento…",
    emptyTitle: "Pergunte-me sobre as suas finanças",
    emptyHint: "Leio o seu perfil ativo: rendimentos, despesas, dívidas e metas.",
    signInTitle: "Inicie sessão para conversar",
    signInBody: "Precisa de uma conta para que eu possa ler o seu orçamento e responder com os seus números reais.",
    signIn: "Ir para login",
    guestTitle: "Disponível com uma conta",
    guestBody: "Está a explorar com dados de demonstração. Crie uma conta para os migrar e conversar sobre o seu orçamento real.",
    tooLong: "Mensagem muito longa",
    tooLongBody: "Máximo de 2000 caracteres",
    stop: "Parar",
    copy: "Copiar resposta",
    copied: "Copiado",
    retry: "Gerar resposta novamente",
    sessionExpired: "Sessão expirada. Inicie sessão novamente.",
    rateLimit: "Demasiados pedidos. Tente num momento.",
    credits: "Créditos de IA esgotados. Adicione créditos nas Configurações.",
    failed: "Erro ao obter resposta. Tente novamente.",
    noHistory: "Ainda não há conversas",
    disclaimer: "Apenas informativo — não é aconselhamento financeiro.",
  },
};

/** Suggestions follow the section the user is currently looking at. */
const SUGGESTIONS: Record<Lang, Record<string, string[]>> = {
  en: {
    default: [
      "How is my cash flow this month?",
      "Where can I cut expenses without hurting my routine?",
      "Summarise my financial health in 5 bullets",
    ],
    debts: [
      "Which debt should I pay off first and why?",
      "Compare avalanche vs snowball with my debts",
      "If I add £50 a month, how much interest do I save?",
    ],
    savings: [
      "Can I reach my savings goals on time?",
      "How much should I contribute monthly to each goal?",
      "Is my emergency fund big enough?",
    ],
    expenses: [
      "Which expense categories are over budget?",
      "What are my three biggest expenses?",
      "How much do my fixed expenses take from my income?",
    ],
    income: [
      "Is my income enough for my commitments?",
      "How stable is my income this month?",
      "What percentage of my income is variable?",
    ],
    payments: [
      "What payments are due in the next 7 days?",
      "Am I on track with this month's payments?",
      "What happens if I miss a minimum payment?",
    ],
  },
  es: {
    default: [
      "¿Cómo va mi flujo de caja este mes?",
      "¿Dónde puedo recortar gastos sin afectar mi rutina?",
      "Resume mi salud financiera en 5 puntos",
    ],
    debts: [
      "¿Qué deuda debería pagar primero y por qué?",
      "Compara avalancha vs bola de nieve con mis deudas",
      "Si añado 50 al mes, ¿cuánto interés ahorro?",
    ],
    savings: [
      "¿Puedo cumplir mis metas de ahorro a tiempo?",
      "¿Cuánto debo aportar cada mes a cada meta?",
      "¿Mi fondo de emergencia es suficiente?",
    ],
    expenses: [
      "¿Qué categorías se pasan del presupuesto?",
      "¿Cuáles son mis tres mayores gastos?",
      "¿Cuánto se llevan mis gastos fijos de mis ingresos?",
    ],
    income: [
      "¿Mis ingresos alcanzan para mis compromisos?",
      "¿Qué tan estables son mis ingresos este mes?",
      "¿Qué porcentaje de mis ingresos es variable?",
    ],
    payments: [
      "¿Qué pagos vencen en los próximos 7 días?",
      "¿Voy al día con los pagos de este mes?",
      "¿Qué pasa si no pago un mínimo?",
    ],
  },
  pt: {
    default: [
      "Como está o meu fluxo de caixa este mês?",
      "Onde posso cortar despesas sem afetar a minha rotina?",
      "Resuma a minha saúde financeira em 5 pontos",
    ],
    debts: [
      "Qual dívida devo pagar primeiro e porquê?",
      "Compare avalanche vs bola de neve com as minhas dívidas",
      "Se acrescentar 50 por mês, quanto juro poupo?",
    ],
    savings: [
      "Consigo cumprir as minhas metas de poupança a tempo?",
      "Quanto devo contribuir por mês para cada meta?",
      "O meu fundo de emergência é suficiente?",
    ],
    expenses: [
      "Que categorias estão acima do orçamento?",
      "Quais são as minhas três maiores despesas?",
      "Quanto as despesas fixas levam do meu rendimento?",
    ],
    income: [
      "O meu rendimento é suficiente para os compromissos?",
      "Quão estável é o meu rendimento este mês?",
      "Que percentagem do meu rendimento é variável?",
    ],
    payments: [
      "Que pagamentos vencem nos próximos 7 dias?",
      "Estou em dia com os pagamentos deste mês?",
      "O que acontece se não pagar um mínimo?",
    ],
  },
};

const suggestionsFor = (lang: Lang, context?: string) => {
  const set = SUGGESTIONS[lang];
  const key = Object.keys(set).find((k) => k !== "default" && context?.toLowerCase().includes(k));
  return set[key ?? "default"];
};

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: any) => <ul className="my-2 ml-4 list-disc">{children}</ul>,
  ol: ({ children }: any) => <ol className="my-2 ml-4 list-decimal">{children}</ol>,
  li: ({ children }: any) => <li className="my-1">{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  h1: ({ children }: any) => <h1 className="text-base font-bold mb-1">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
};

export const FloatingChatWidget = ({ language = "en" as Language, context }: FloatingChatWidgetProps) => {
  const { toast } = useToast();
  const lang = asLang(language);
  const t = T[lang];

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const guest = isGuestMode();

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ? { id: user.id } : null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingContent]);

  const loadConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("id, title, created_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at");
      if (error) throw error;
      setMessages((data || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      setCurrentConversationId(conversationId);
      localStorage.setItem(LAST_CONVERSATION_KEY, conversationId);
      setShowConversations(false);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  }, []);

  // Reopening the widget restores the last conversation instead of losing the thread.
  useEffect(() => {
    if (!isOpen || !user || guest) return;
    loadConversations();
    inputRef.current?.focus();
    if (!currentConversationId) {
      const last = localStorage.getItem(LAST_CONVERSATION_KEY);
      if (last) loadConversation(last);
    }
  }, [isOpen, user, guest, currentConversationId, loadConversations, loadConversation]);

  // Escape closes the panel (or leaves the history view first).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showConversations) setShowConversations(false);
      else setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, showConversations]);

  const createConversation = async (title?: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert([{
          user_id: (await supabase.auth.getUser()).data.user?.id,
          title: title || `${t.title} ${new Date().toLocaleDateString()}`,
        }])
        .select()
        .single();
      if (error) throw error;
      setCurrentConversationId(data.id);
      localStorage.setItem(LAST_CONVERSATION_KEY, data.id);
      setShowConversations(false);
      loadConversations();
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({ title: "Error", description: t.failed, variant: "destructive" });
      return null;
    }
  };

  const startNewConversation = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingContent("");
    setCurrentConversationId(null);
    localStorage.removeItem(LAST_CONVERSATION_KEY);
    setShowConversations(false);
    setTimeout(() => inputRef.current?.focus(), 0);
    toast({ title: t.newChat, description: t.started });
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase.from("chat_conversations").delete().eq("id", conversationId);
      if (error) throw error;
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
        localStorage.removeItem(LAST_CONVERSATION_KEY);
      }
      loadConversations();
      toast({ title: t.deleted });
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const saveMessage = async (role: "user" | "assistant", content: string, conversationId?: string | null) => {
    const target = conversationId ?? currentConversationId;
    if (!target) return;
    const { error } = await supabase.from("chat_messages").insert([{
      conversation_id: target,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      role,
      content,
    }]);
    if (error) console.error("Error saving message:", error);
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  /** Streams an answer for the given history. `persistUser` is false when regenerating. */
  const runCompletion = async (history: Message[], conversationId: string) => {
    setIsLoading(true);
    setStreamingContent("");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(t.sessionExpired);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/financial-advisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let serverMessage = "";
        try {
          serverMessage = (await response.json())?.error ?? "";
        } catch {
          serverMessage = "";
        }
        if (response.status === 429) throw new Error(t.rateLimit);
        if (response.status === 402) throw new Error(t.credits);
        throw new Error(serverMessage || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) {
              assistantText += delta;
              setStreamingContent(assistantText);
            }
          } catch {
            // Partial JSON chunk — completed on the next read.
          }
        }
      }

      if (assistantText.trim()) {
        setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
        await saveMessage("assistant", assistantText, conversationId);
      }
      setStreamingContent("");
    } catch (error: any) {
      setStreamingContent((partial) => {
        if (partial.trim()) {
          setMessages((prev) => [...prev, { role: "assistant", content: partial }]);
          saveMessage("assistant", partial, conversationId);
        }
        return "";
      });
      if (error?.name !== "AbortError") {
        console.error("Chat error:", error);
        toast({ title: "Error", description: error?.message || t.failed, variant: "destructive" });
      }
    } finally {
      abortRef.current = null;
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const submitMessage = async (messageContent: string) => {
    if (!messageContent || isLoading) return;

    if (!messageSchema.safeParse({ content: messageContent }).success) {
      toast({ title: t.tooLong, description: t.tooLongBody, variant: "destructive" });
      return;
    }

    let conversationId = currentConversationId;
    if (!conversationId) {
      const title = messageContent.length > 40 ? `${messageContent.slice(0, 40)}…` : messageContent;
      conversationId = await createConversation(title);
      if (!conversationId) return;
    }

    const history = [...messages, { role: "user" as const, content: messageContent }];
    setMessages(history);
    setInput("");
    await saveMessage("user", messageContent, conversationId);
    await runCompletion(history, conversationId);
  };

  /** Re-asks the last question, replacing the previous answer. */
  const regenerate = async () => {
    if (isLoading || !currentConversationId) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const cutoff = messages.length - lastUserIdx;
    const history = messages.slice(0, cutoff);
    setMessages(history);
    await runCompletion(history, currentConversationId);
  };

  const copyMessage = async (content: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((v) => (v === idx ? null : v)), 1500);
    } catch {
      toast({ title: "Error", description: t.failed, variant: "destructive" });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(input.trim());
  };

  // Any section of the app can hand the assistant a question.
  useEffect(() => {
    const handler = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      setIsOpen(true);
      setShowConversations(false);
      if (prompt) {
        if (user && !guest) submitMessage(prompt);
        else setInput(prompt);
      }
    };
    window.addEventListener(BUDDY_ASK_EVENT, handler);
    return () => window.removeEventListener(BUDDY_ASK_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, guest, messages, currentConversationId, isLoading]);

  const suggestions = suggestionsFor(lang, context);
  const lastAssistantIdx = messages.reduce((acc, m, i) => (m.role === "assistant" ? i : acc), -1);

  return (
    <>
      {/* Launcher */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          aria-label={t.open}
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label={t.title}
          className="fixed inset-0 z-50 p-4 md:inset-auto md:bottom-4 md:right-4 md:h-[600px] md:max-h-[calc(100vh-2rem)] md:w-[380px] md:p-0"
        >
          <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 p-3">
              <div className="flex min-w-0 items-center gap-2">
                {showConversations ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t.back}
                    className="h-8 w-8"
                    onClick={() => setShowConversations(false)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{showConversations ? t.history : t.title}</h3>
                  <p className="truncate text-xs text-muted-foreground">{showConversations ? "" : t.subtitle}</p>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                {user && !guest && !showConversations && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t.newChat}
                      className="h-8 w-8"
                      onClick={startNewConversation}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t.history}
                      className="h-8 w-8"
                      onClick={() => {
                        loadConversations();
                        setShowConversations(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t.close}
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Guest / signed-out states */}
            {!user || guest ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <Bot className="mb-4 h-14 w-14 text-muted-foreground" />
                <h3 className="mb-2 text-base font-semibold">{guest ? t.guestTitle : t.signInTitle}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{guest ? t.guestBody : t.signInBody}</p>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = "/";
                  }}
                >
                  {t.signIn}
                </Button>
              </div>
            ) : showConversations ? (
              <div className="flex flex-1 flex-col p-3">
                <Button onClick={startNewConversation} className="mb-3 w-full" variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.newChat}
                </Button>
                <ScrollArea className="flex-1">
                  {conversations.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">{t.noHistory}</p>
                  ) : (
                    <div className="space-y-1 pr-2">
                      {conversations.map((conv) => (
                        <div key={conv.id} className="flex items-center gap-1">
                          <Button
                            variant={currentConversationId === conv.id ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 justify-start truncate text-xs"
                            onClick={() => loadConversation(conv.id)}
                          >
                            <span className="truncate">
                              {conv.title || new Date(conv.created_at).toLocaleDateString()}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t.deleted}
                            onClick={() => deleteConversation(conv.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.length === 0 && !isLoading && (
                      <div className="py-6 text-center text-muted-foreground">
                        <div className="mb-3 text-4xl">💡</div>
                        <p className="text-sm font-medium text-foreground">{t.emptyTitle}</p>
                        <p className="mt-1 text-xs">{t.emptyHint}</p>
                        <div className="mt-4 flex flex-col gap-2">
                          {suggestions.map((suggestion) => (
                            <Button
                              key={suggestion}
                              variant="outline"
                              size="sm"
                              className="h-auto whitespace-normal py-2 text-left text-xs"
                              disabled={isLoading}
                              onClick={() => submitMessage(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                          </div>
                        )}
                        <div className="max-w-[78%]">
                          <div
                            className={cn(
                              "rounded-2xl px-3 py-2 text-sm",
                              msg.role === "user"
                                ? "rounded-br-sm bg-primary text-primary-foreground"
                                : "rounded-bl-sm bg-muted text-foreground",
                            )}
                          >
                            <div
                              className={cn(
                                "prose prose-sm max-w-none dark:prose-invert",
                                msg.role === "user" ? "prose-invert" : "",
                              )}
                            >
                              <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                          {msg.role === "assistant" && (
                            <div className="mt-1 flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground"
                                aria-label={copiedIdx === idx ? t.copied : t.copy}
                                onClick={() => copyMessage(msg.content, idx)}
                              >
                                {copiedIdx === idx ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                              {idx === lastAssistantIdx && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground"
                                  aria-label={t.retry}
                                  disabled={isLoading}
                                  onClick={regenerate}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                            {lang === "en" ? "You" : lang === "es" ? "Tú" : "Você"}
                          </div>
                        )}
                      </div>
                    ))}

                    {streamingContent && (
                      <div className="flex justify-start gap-2">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-foreground">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown components={markdownComponents}>{streamingContent}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}

                    {isLoading && !streamingContent && (
                      <div className="flex justify-start gap-2">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Follow-up chips keep the conversation moving. */}
                {messages.length > 0 && !isLoading && (
                  <div className="flex gap-2 overflow-x-auto border-t border-border px-3 pt-2">
                    {suggestions.slice(0, 2).map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="secondary"
                        size="sm"
                        className="h-7 flex-shrink-0 text-xs"
                        onClick={() => submitMessage(suggestion)}
                      >
                        {suggestion.length > 34 ? `${suggestion.slice(0, 34)}…` : suggestion}
                      </Button>
                    ))}
                  </div>
                )}

                <form onSubmit={sendMessage} className="p-3">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={t.placeholder}
                      maxLength={2000}
                      className="flex-1"
                    />
                    {isLoading ? (
                      <Button type="button" onClick={stopStreaming} size="icon" variant="secondary" aria-label={t.stop}>
                        <Square className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit" disabled={!input.trim()} size="icon" aria-label={t.title}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-center text-[10px] leading-tight text-muted-foreground">{t.disclaimer}</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
