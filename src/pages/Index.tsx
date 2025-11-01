"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, add, sub } from "date-fns";
import { formatCurrency } from "@/lib/i18n";
import {
  TrendingUp, Download, LogOut, Bot, Calendar, DollarSign, PiggyBank, Home,
  Edit2, Trash2, Plus, ChevronLeft, ChevronRight, Send, X, Zap, Snowflake
} from "lucide-react";
import {
  useIncomeSources, useDebts, useFixedExpenses, useVariableExpenses,
  useSavingsGoals, useSavings
} from "@/hooks/useFinancialData";
import { useFinancialProfiles } from "@/hooks/useFinancialProfiles";
import { Auth } from "@/components/Auth";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Lazy load
const IncomeManager = React.lazy(() => import("@/components/IncomeManager"));
const DebtsManager = React.lazy(() => import("@/components/DebtsManager"));
const FixedExpensesManager = React.lazy(() => import("@/components/FixedExpensesManager"));
const VariableExpensesManager = React.lazy(() => import("@/components/VariableExpensesManager"));

type Language = "en" | "es" | "pl";
type DebtMethod = "avalanche" | "snowball" | "hybrid";
type Event = {
  id: string;
  date: string;
  type: "income" | "debt" | "fixed" | "variable";
  name: string;
  amount: number;
  recurring: boolean;
};

const translations = {
  en: {
    overview: "Overview",
    income: "Income",
    expenses: "Expenses",
    debts: "Debts",
    debtPlanner: "Debt Planner",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    cashFlow: "Cash Flow",
    totalSavings: "Total Savings",
    healthy: "Healthy",
    review: "Review",
    fixedIncome: "Fixed Income",
    variableIncome: "Variable Income",
    fixedExpenses: "Fixed Expenses",
    variableExpenses: "Variable Expenses",
    noData: "No data yet",
    add: "Add",
    description: "Description",
    strategy: "Debt Payoff Strategy",
    avalanche: "Avalanche (High APR First)",
    snowball: "Snowball (Smallest Balance First)",
    hybrid: "Hybrid (APR + Balance)",
    recommended: "Recommended",
    months: "months",
    totalInterest: "Total Interest Saved",
    priority: "Debt Priority Order",
    payFirst: "Pay First",
    minPayment: "Min Payment",
    monthlySavings: "Monthly Savings for Emergency Fund",
    emergencyFund: "Emergency Fund Estimate",
    cashFlowAfterSavings: "Cash Flow After Savings",
    debtPayment: "Available for Debt Payment",
    monthsToEmergency: "Months to Emergency Fund Goal",
    monthlyDebtAllocation: "Monthly Debt Allocation",
  },
  es: {
    overview: "Resumen",
    income: "Ingresos",
    expenses: "Gastos",
    debts: "Deudas",
    debtPlanner: "Planificador de Deudas",
    totalIncome: "Ingresos Totales",
    totalExpenses: "Gastos Totales",
    cashFlow: "Flujo de Caja",
    totalSavings: "Ahorros Totales",
    healthy: "Saludable",
    review: "Revisar",
    fixedIncome: "Ingresos Fijos",
    variableIncome: "Ingresos Variables",
    fixedExpenses: "Gastos Fijos",
    variableExpenses: "Gastos Variables",
    noData: "No hay datos",
    add: "Añadir",
    description: "Descripción",
    strategy: "Estrategia de Pago de Deudas",
    avalanche: "Avalancha (APR Alto Primero)",
    snowball: "Bola de Nieve (Saldo Pequeño Primero)",
    hybrid: "Híbrido (APR + Saldo)",
    recommended: "Recomendado",
    months: "meses",
    totalInterest: "Interés Total Ahorrado",
    priority: "Orden de Prioridad de Deudas",
    payFirst: "Pagar Primero",
    minPayment: "Pago Mínimo",
    monthlySavings: "Ahorros Mensuales para Fondo de Emergencia",
    emergencyFund: "Estimación de Fondo de Emergencia",
    cashFlowAfterSavings: "Flujo de Caja Después de Ahorros",
    debtPayment: "Disponible para Pago de Deuda",
    monthsToEmergency: "Meses para Meta de Fondo de Emergencia",
    monthlyDebtAllocation: "Asignación Mensual de Deuda",
  },
  pl: {
    overview: "Przegląd",
    income: "Dochody",
    expenses: "Wydatki",
    debts: "Długi",
    debtPlanner: "Plan Spłaty Długów",
    totalIncome: "Całkowity Dochód",
    totalExpenses: "Całkowite Wydatki",
    cashFlow: "Przepływ Gotówki",
    totalSavings: "Całkowite Oszczędności",
    healthy: "Zdrowy",
    review: "Przejrzyj",
    fixedIncome: "Stałe Dochody",
    variableIncome: "Zmienne Dochody",
    fixedExpenses: "Stałe Wydatki",
    variableExpenses: "Zmienne Wydatki",
    noData: "Brak danych",
    add: "Dodaj",
    description: "Opis",
    strategy: "Strategia Spłaty Długów",
    avalanche: "Lawina (Najwyższe Oprocentowanie Najpierw)",
    snowball: "Kula Śnieżna (Najmniejszy Saldo Najpierw)",
    hybrid: "Hybrydowa (Oprocentowanie + Saldo)",
    recommended: "Zalecane",
    months: "miesiące",
    totalInterest: "Całkowite Oszczędności Oprocentowania",
    priority: "Kolejność Priorytetu Długów",
    payFirst: "Spłać Najpierw",
    minPayment: "Minimalna Płatność",
    monthlySavings: "Miesięczne Oszczędności na Fundusz Awaryjny",
    emergencyFund: "Szacowany Fundusz Awaryjny",
    cashFlowAfterSavings: "Przepływ Gotówki Po Oszczędnościach",
    debtPayment: "Dostępne na Płatność Długu",
    monthsToEmergency: "Miesiące do Celu Funduszu Awaryjnego",
    monthlyDebtAllocation: "Miesięczna Alokacja Długu",
  },
};

const useVariableIncome = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("variable_income");
    if (saved) setData(JSON.parse(saved));
    setLoading(false);
  }, []);

  const addIncome = useCallback((amount: number, description: string) => {
    const newEntry = {
      id: Date.now().toString(),
      amount,
      description: description || "Extra income",
      date: new Date().toISOString(),
    };
    setData((prev) => {
      const updated = [newEntry, ...prev];
      localStorage.setItem("variable_income", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setData((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      localStorage.setItem("variable_income", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { data, loading, addIncome, deleteIncome };
};

const Index = () => {
  useTheme();
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAI, setShowAI]