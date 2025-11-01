// src/pages/Index.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Globe,
  Users,
  User,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Language = "en" | "es" | "pl" | "pt";

type Event = {
  id: string;
  date: string;
  type: "income" | "debt" | "fixed" | "variable" | "annual";
  name: string;
  amount: number;
  recurring?: "monthly" | "annually";
};

const translations = {
  en: {
    title: "Family Budget Planner UK",
    welcome: "Hi, {name}!",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    cashFlow: "Cash Flow",
    totalSavings: "Total Savings",
    addEvent: "Add Event",
    editEvent: "Edit Event",
    deleteEvent: "Delete Event?",
    name: "Name",
    amount: "Amount (£)",
    type: "Type",
    income: "Income",
    debt: "Debt",
    fixed: "Fixed",
    variable: "Variable",
    annual: "Annual",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    aiPlaceholder: "Ask AI about savings, debt, budget...",
    send: "Send",
    export: "Export Data",
    print: "Print",
    logout: "Logout",
    overview: "Overview",
    incomeTab: "Income",
    expenses: "Expenses",
    debts: "Debts",
    profiles: "Profiles",
    variableIncome: "Variable Income",
    add: "Add",
    description: "Description",
    noVariableIncome: "No variable income yet",
    healthy: "Healthy",
    review: "Review",
    disclaimer: "This app is for educational use only. Not financial advice. Consult an FCA adviser.",
    copyright: "© 2025 Family Budget Planner UK",
    // Nuevas
    fixedIncome: "Fixed Income",
    variableExpenses: "Variable Expenses",
    fixedExpenses: "Fixed Expenses",
    savingsGoals: "Savings Goals",
    emergencyFund: "Emergency Fund",
    profileName: "Profile Name",
    makeActive: "Make Active",
    addProfile: "Add Profile",
    noProfiles: "No profiles yet",
  },
  es: {
    /* ... mismo formato ... */
  },
  pl: {
    /* ... */
  },
  pt: {
    /* ... */
  },
};

const useVariableIncome = () => {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("variable_income");
    if (saved) setData(JSON.parse(saved));
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
  return { data, addIncome, deleteIncome };
};

const Index = () => {
  useTheme();

  // === 1. HOOKS ===
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [recurringManualEvents, setRecurringManualEvents] = useState<Event[]>([]);
  const [annualEvents, setAnnualEvents] = useState<Event[]>([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<{ name: string; amount: number; type: Event["type"] }>({
    name: "",
    amount: 0,
    type: "income",
  });

  const { data: profiles = [], addProfile, updateProfile, deleteProfile } = useFinancialProfiles();
  const activeProfile = useMemo(() => profiles.find((p) => p.is_active) || { name: "Family" }, [profiles]);

  const { data: incomeData = [] } = useIncomeSources();
  const { data: debtData = [] } = useDebts();
  const { data: fixedExpensesData = [] } = useFixedExpenses();
  const { data: variableExpensesData = [] } = useVariableExpenses();
  const { data: savingsGoalsData = [] } = useSavingsGoals();
  const { data: savings } = useSavings();
  const { data: variableIncome = [], addIncome, deleteIncome } = useVariableIncome();

  useEffect(() => {
    const loadEvents = () => {
      const manual = localStorage.getItem("recurring_manual_events");
      const annual = localStorage.getItem("annual_events");
      if (manual) setRecurringManualEvents(JSON.parse(manual));
      if (annual) setAnnualEvents(JSON.parse(annual));
    };
    loadEvents();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
  }, []);

  // === CÁLCULOS ===
  const {
    totalIncome,
    totalFixed,
    totalVariable,
    totalDebtPayment,
    totalExpenses,
    cashFlow,
    savingsTotal,
    monthsToDebtFree,
    calendarEvents,
  } = useMemo(() => {
    const totalIncome = incomeData.reduce((s, i) => s + i.amount, 0) + variableIncome.reduce((s, i) => s + i.amount, 0);
    const totalFixed = fixedExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalVariable = variableExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalDebtPayment = debtData.reduce((s, d) => s + d.minimum_payment, 0);
    const totalExpenses = totalFixed + totalVariable + totalDebtPayment;
    const cashFlow = totalIncome - totalExpenses;
    const savingsTotal =
      (savings?.emergency_fund || 0) + savingsGoalsData.reduce((s, g) => s + (g.current_amount || 0), 0);

    let remaining = debtData.reduce((s, d) => s + d.balance, 0);
    let months = 0;
    const extra = Math.max(0, cashFlow * 0.3);
    const monthlyPay = totalDebtPayment + extra;
    while (remaining > 0 && months < 120) {
      const interest = debtData.reduce((s, d) => s + d.balance * (d.apr / 100 / 12), 0);
      remaining = Math.max(0, remaining + interest - monthlyPay);
      months++;
    }

    const allEvents: Event[] = [];
    const startYear = currentMonth.getFullYear() - 1;
    const endYear = currentMonth.getFullYear() + 1;

    // ... (mismo código de eventos que antes) ...

    return {
      totalIncome,
      totalFixed,
      totalVariable,
      totalDebtPayment,
      totalExpenses,
      cashFlow,
      savingsTotal,
      monthsToDebtFree: months,
      calendarEvents: allEvents,
    };
  }, [
    incomeData,
    variableIncome,
    fixedExpensesData,
    variableExpensesData,
    debtData,
    savings,
    savingsGoalsData,
    currentMonth,
    recurringManualEvents,
    annualEvents,
  ]);

  const t = translations[language];
  const formatCurrency = useCallback((n: number) => `£${n.toFixed(0)}`, []);

  // === HANDLERS ===
  const handleAddProfile = useCallback(() => {
    const name = prompt(t.profileName);
    if (name) addProfile(name);
  }, [addProfile, t.profileName]);

  const handleMakeActive = useCallback(
    (id: string) => {
      updateProfile(id, { is_active: true });
      profiles.forEach((p) => p.id !== id && updateProfile(p.id, { is_active: false }));
    },
    [profiles, updateProfile],
  );

  const handleDeleteProfile = useCallback(
    (id: string) => {
      if (confirm("Delete profile?")) deleteProfile(id);
    },
    [deleteProfile],
  );

  // === EARLY RETURNS ===
  if (authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  if (!user) return <Auth />;

  // === RENDER ===
  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* HEADER */}
          <div className="no-print flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <Home className="h-12 w-12" />
                {t.title}
              </h1>
              <p className="text-muted-foreground">{t.welcome.replace("{name}", activeProfile.name)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <Globe className="inline h-4 w-4 mr-2" />
                    English
                  </SelectItem>
                  <SelectItem value="es">
                    <Globe className="inline h-4 w-4 mr-2" />
                    Español
                  </SelectItem>
                  <SelectItem value="pl">
                    <Globe className="inline h-4 w-4 mr-2" />
                    Polski
                  </SelectItem>
                  <SelectItem value="pt">
                    <Globe className="inline h-4 w-4 mr-2" />
                    Português
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => window.print()}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowAI(true)}>
                <Bot className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => supabase.auth.signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* RESUMEN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600">{t.totalIncome}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600">{t.totalExpenses}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
              </CardContent>
            </Card>
            <Card className={`${cashFlow >= 0 ? "border-emerald-200" : "border-orange-200"}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm ${cashFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                  {t.cashFlow}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${cashFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                  {formatCurrency(cashFlow)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-purple-600 flex items-center gap-1">
                  <PiggyBank className="h-4 w-4" /> {t.totalSavings}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{formatCurrency(savingsTotal)}</div>
              </CardContent>
            </Card>
          </div>

          {/* TABS CON TODAS LAS SECCIONES */}
          <Tabs defaultValue="overview" className="no-print">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview">{t.overview}</TabsTrigger>
              <TabsTrigger value="income">{t.incomeTab}</TabsTrigger>
              <TabsTrigger value="expenses">{t.expenses}</TabsTrigger>
              <TabsTrigger value="debts">{t.debts}</TabsTrigger>
              <TabsTrigger value="profiles">{t.profiles}</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>{t.overview}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-bold text-center text-blue-600">
                    {cashFlow > 0 ? t.healthy : t.review}
                  </div>
                  <Progress value={cashFlow > 0 ? 80 : 40} className="mt-4" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* INGRESOS */}
            <TabsContent value="income">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {t.fixedIncome}
                      <Button size="sm" onClick={() => alert("Add fixed income form")}>
                        <Plus className="h-4 w-4 mr-1" /> {t.add}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {incomeData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">{t.noVariableIncome}</p>
                    ) : (
                      <div className="space-y-2">
                        {incomeData.map((inc) => (
                          <div key={inc.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">{inc.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-600">{formatCurrency(inc.amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {t.variableIncome}
                      <Button
                        size="sm"
                        onClick={() => {
                          const desc = prompt(t.description);
                          const amount = parseFloat(prompt(t.amount) || "0");
                          if (desc && amount > 0) addIncome(amount, desc);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> {t.add}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {variableIncome.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">{t.noVariableIncome}</p>
                    ) : (
                      <div className="space-y-2">
                        {variableIncome.map((inc) => (
                          <div key={inc.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">{inc.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(inc.date), "d MMM yyyy")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-600">{formatCurrency(inc.amount)}</span>
                              <Button size="sm" variant="ghost" onClick={() => deleteIncome(inc.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* GASTOS */}
            <TabsContent value="expenses">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.fixedExpenses}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fixedExpensesData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">No fixed expenses</p>
                    ) : (
                      <div className="space-y-2">
                        {fixedExpensesData.map((exp) => (
                          <div key={exp.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">{exp.name}</p>
                            </div>
                            <span className="font-bold text-red-600">{formatCurrency(exp.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t.variableExpenses}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {variableExpensesData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">No variable expenses</p>
                    ) : (
                      <div className="space-y-2">
                        {variableExpensesData.map((exp) => (
                          <div key={exp.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">{exp.name}</p>
                            </div>
                            <span className="font-bold text-orange-600">{formatCurrency(exp.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* DEUDAS */}
            <TabsContent value="debts">
              <Card>
                <CardHeader>
                  <CardTitle>{t.debts}</CardTitle>
                </CardHeader>
                <CardContent>
                  {debtData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">No debts</p>
                  ) : (
                    <div className="space-y-3">
                      {debtData.map((debt) => (
                        <div key={debt.id} className="p-4 bg-muted rounded-lg">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{debt.name}</p>
                            <span className="text-sm text-muted-foreground">APR {debt.apr}%</span>
                          </div>
                          <div className="flex justify-between mt-2">
                            <span>Balance: {formatCurrency(debt.balance)}</span>
                            <span>Min: {formatCurrency(debt.minimum_payment)}</span>
                          </div>
                          <Progress
                            value={(debt.balance / (debt.balance + debt.minimum_payment)) * 100}
                            className="mt-2"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PERFILES */}
            <TabsContent value="profiles">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {t.profiles}
                    <Button size="sm" onClick={handleAddProfile}>
                      <Plus className="h-4 w-4 mr-1" /> {t.addProfile}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profiles.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">{t.noProfiles}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profiles.map((profile) => (
                        <div
                          key={profile.id}
                          className={`p-4 rounded-lg border ${profile.is_active ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              <p className="font-medium">{profile.name}</p>
                              {profile.is_active && (
                                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Active</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {!profile.is_active && (
                                <Button size="sm" onClick={() => handleMakeActive(profile.id)}>
                                  {t.makeActive}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteProfile(profile.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CALENDARIO (opcional, puedes mantenerlo) */}
          {/* ... */}

          <footer className="no-print py-8 text-center text-xs text-muted-foreground border-t mt-12">
            <p className="font-semibold mb-2">Legal Disclaimer (UK)</p>
            <p>{t.disclaimer}</p>
            <p className="mt-2">{t.copyright}</p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Index;
