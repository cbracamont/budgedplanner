"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, add, sub } from "date-fns";
import {
  TrendingUp,
  Download,
  LogOut,
  Bot,
  Calendar,
  DollarSign,
  PiggyBank,
  Home,
  Edit2,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Zap,
  Snowflake,
} from "lucide-react";
import {
  useIncomeSources,
  useDebts,
  useFixedExpenses,
  useVariableExpenses,
  useSavingsGoals,
  useSavings,
} from "@/hooks/useFinancialData";
import { useFinancialProfiles } from "@/hooks/useFinancialProfiles";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Language = "en" | "es" | "pl";
type DebtMethod = "avalanche" | "snowball" | "hybrid";

type Event = {
  id: string;
  date: string;
  type: "income" | "debt" | "fixed" | "variable";
  name: string;
  amount: number;
  recurring?: boolean;
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
    strategy