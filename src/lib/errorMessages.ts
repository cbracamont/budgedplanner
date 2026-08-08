import { ZodError } from "zod";
import type { Language } from "@/lib/i18n";

// The mutation hooks that surface errors are not inside a language provider,
// so Index sets the active language here once and error toasts stay localized.
let currentLanguage: Language = "en";

export const setErrorLanguage = (lang: Language) => {
  currentLanguage = lang;
};

const FIELD_LABELS: Record<string, Record<Language, string>> = {
  name: { en: "Name", es: "Nombre", pt: "Nome" },
  goal_name: { en: "Goal name", es: "Nombre de la meta", pt: "Nome da meta" },
  goal_description: { en: "Description", es: "Descripción", pt: "Descrição" },
  amount: { en: "Amount", es: "Monto", pt: "Valor" },
  balance: { en: "Balance", es: "Saldo", pt: "Saldo" },
  apr: { en: "Interest rate (APR)", es: "Tasa de interés (TAE)", pt: "Taxa de juros (APR)" },
  minimum_payment: { en: "Minimum payment", es: "Pago mínimo", pt: "Pagamento mínimo" },
  payment_day: { en: "Payment day", es: "Día de pago", pt: "Dia do pagamento" },
  payment_date: { en: "Payment date", es: "Fecha de pago", pt: "Data do pagamento" },
  bank: { en: "Bank", es: "Banco", pt: "Banco" },
  target_amount: { en: "Target amount", es: "Monto objetivo", pt: "Valor alvo" },
  current_amount: { en: "Current amount", es: "Monto actual", pt: "Valor atual" },
  monthly_contribution: { en: "Monthly contribution", es: "Aporte mensual", pt: "Contribuição mensal" },
  target_date: { en: "Target date", es: "Fecha objetivo", pt: "Data alvo" },
  category_id: { en: "Category", es: "Categoría", pt: "Categoria" },
  debt_id: { en: "Debt", es: "Deuda", pt: "Dívida" },
  notes: { en: "Notes", es: "Notas", pt: "Notas" },
  date: { en: "Date", es: "Fecha", pt: "Data" },
  frequency: { en: "Frequency", es: "Frecuencia", pt: "Frequência" },
  limit_amount: { en: "Limit", es: "Límite", pt: "Limite" },
};

const T = {
  required: {
    en: (f: string) => `${f} is required`,
    es: (f: string) => `${f} es obligatorio`,
    pt: (f: string) => `${f} é obrigatório`,
  },
  positive: {
    en: (f: string) => `${f} must be 0 or higher`,
    es: (f: string) => `${f} debe ser 0 o mayor`,
    pt: (f: string) => `${f} deve ser 0 ou maior`,
  },
  min: {
    en: (f: string, n: number) => `${f} must be at least ${n}`,
    es: (f: string, n: number) => `${f} debe ser al menos ${n}`,
    pt: (f: string, n: number) => `${f} deve ser no mínimo ${n}`,
  },
  max: {
    en: (f: string, n: number) => `${f} must be ${n} or less`,
    es: (f: string, n: number) => `${f} debe ser ${n} o menos`,
    pt: (f: string, n: number) => `${f} deve ser ${n} ou menos`,
  },
  tooLong: {
    en: (f: string, n: number) => `${f} is too long (max. ${n} characters)`,
    es: (f: string, n: number) => `${f} es demasiado largo (máx. ${n} caracteres)`,
    pt: (f: string, n: number) => `${f} é muito longo (máx. ${n} caracteres)`,
  },
  invalid: {
    en: (f: string) => `${f} is not valid`,
    es: (f: string) => `${f} no es válido`,
    pt: (f: string) => `${f} não é válido`,
  },
  intro: {
    en: "Please review these fields:",
    es: "Revisa estos campos:",
    pt: "Revise estes campos:",
  },
  network: {
    en: "Connection problem. Check your internet and try again.",
    es: "Problema de conexión. Revisa tu internet e inténtalo de nuevo.",
    pt: "Problema de conexão. Verifique sua internet e tente novamente.",
  },
  permission: {
    en: "You don't have permission to do this.",
    es: "No tienes permiso para hacer esto.",
    pt: "Você não tem permissão para fazer isso.",
  },
  duplicate: {
    en: "That record already exists.",
    es: "Ese registro ya existe.",
    pt: "Esse registro já existe.",
  },
  generic: {
    en: "Something went wrong. Please try again.",
    es: "Algo salió mal. Inténtalo de nuevo.",
    pt: "Algo deu errado. Tente novamente.",
  },
};

const labelFor = (path: (string | number)[], lang: Language): string => {
  const key = path.find((p) => typeof p === "string") as string | undefined;
  if (!key) return lang === "en" ? "Value" : lang === "es" ? "Valor" : "Valor";
  const label = FIELD_LABELS[key];
  if (label) return label[lang];
  return key.replace(/_/g, " ");
};

const zodIssueMessage = (issue: any, lang: Language): string => {
  const field = labelFor(issue.path ?? [], lang);

  switch (issue.code) {
    case "invalid_type":
      return T.required[lang](field);
    case "too_small":
      if (issue.type === "string") return T.required[lang](field);
      if (issue.minimum === 0) return T.positive[lang](field);
      return T.min[lang](field, Number(issue.minimum));
    case "too_big":
      if (issue.type === "string") return T.tooLong[lang](field, Number(issue.maximum));
      return T.max[lang](field, Number(issue.maximum));
    default:
      return T.invalid[lang](field);
  }
};

/** Turns Zod validation errors and backend errors into plain, localized text. */
export const friendlyError = (error: unknown, lang: Language = currentLanguage): string => {
  if (error instanceof ZodError) {
    const messages = Array.from(new Set(error.issues.map((i) => zodIssueMessage(i, lang))));
    return `${T.intro[lang]}\n• ${messages.join("\n• ")}`;
  }

  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";

  // Some layers stringify the ZodError issues before they reach the toast.
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const issues = Array.isArray(parsed) ? parsed : parsed.issues;
      if (Array.isArray(issues) && issues.length) {
        const messages = Array.from(new Set(issues.map((i: any) => zodIssueMessage(i, lang))));
        return `${T.intro[lang]}\n• ${messages.join("\n• ")}`;
      }
    } catch {
      // fall through to the generic handling below
    }
  }

  const lower = raw.toLowerCase();
  if (!raw) return T.generic[lang];
  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("timeout")) {
    return T.network[lang];
  }
  if (lower.includes("row-level security") || lower.includes("permission") || lower.includes("not authorized") || lower.includes("jwt")) {
    return T.permission[lang];
  }
  if (lower.includes("duplicate key") || lower.includes("already exists") || lower.includes("unique constraint")) {
    return T.duplicate[lang];
  }
  if (lower.includes("violates") || lower.includes("constraint") || lower.includes("syntax")) {
    return T.generic[lang];
  }

  return raw;
};
