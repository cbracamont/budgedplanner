import { useState } from "react";
import { IncomeForm } from "@/components/IncomeForm";
import { DebtsForm } from "@/components/DebtsForm";
import { FixedExpensesForm } from "@/components/FixedExpensesForm";
import { VariableExpensesForm } from "@/components/VariableExpensesForm";
import { BudgetSummary } from "@/components/BudgetSummary";
import { DebtForecast } from "@/components/DebtForecast";
import { DebtAdvisor } from "@/components/DebtAdvisor";
import { CalendarView } from "@/components/CalendarView";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator } from "lucide-react";
import { Language, getTranslation } from "@/lib/i18n";

const Index = () => {
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: string) => getTranslation(language, key);
  
  const [salary, setSalary] = useState(0);
  const [tips, setTips] = useState(0);
  const [personalLoan, setPersonalLoan] = useState(0);
  const [carFinance, setCarFinance] = useState(0);
  const [creditCards, setCreditCards] = useState(0);
  const [rent, setRent] = useState(0);
  const [utilities, setUtilities] = useState(0);
  const [internet, setInternet] = useState(0);
  const [phone, setPhone] = useState(0);
  const [otherFixed, setOtherFixed] = useState(0);
  const [groceries, setGroceries] = useState(0);
  const [dining, setDining] = useState(0);
  const [transport, setTransport] = useState(0);
  const [shopping, setShopping] = useState(0);
  const [entertainment, setEntertainment] = useState(0);
  const [extraDebtPayment, setExtraDebtPayment] = useState(0);

  const handleIncomeChange = (newSalary: number, newTips: number) => {
    setSalary(newSalary);
    setTips(newTips);
  };

  const handleDebtsChange = (newPersonalLoan: number, newCarFinance: number, newCreditCards: number) => {
    setPersonalLoan(newPersonalLoan);
    setCarFinance(newCarFinance);
    setCreditCards(newCreditCards);
  };

  const handleFixedExpensesChange = (newRent: number, newUtilities: number, newInternet: number, newPhone: number, newOther: number) => {
    setRent(newRent);
    setUtilities(newUtilities);
    setInternet(newInternet);
    setPhone(newPhone);
    setOtherFixed(newOther);
  };

  const handleVariableExpensesChange = (newGroceries: number, newDining: number, newTransport: number, newShopping: number, newEntertainment: number) => {
    setGroceries(newGroceries);
    setDining(newDining);
    setTransport(newTransport);
    setShopping(newShopping);
    setEntertainment(newEntertainment);
  };

  const totalIncome = salary + tips;
  const totalDebts = personalLoan + carFinance + creditCards;
  const totalFixedExpenses = rent + utilities + internet + phone + otherFixed;
  const totalVariableExpenses = groceries + dining + transport + shopping + entertainment;

  // Prepare debts for DebtAdvisor
  const debts = [
    { name: t('personalLoan'), balance: personalLoan * 12, apr: 5.5, minimumPayment: personalLoan },
    { name: t('carFinance'), balance: carFinance * 12, apr: 6.9, minimumPayment: carFinance },
    { name: t('creditCards'), balance: creditCards * 12, apr: 21.9, minimumPayment: creditCards },
  ].filter(debt => debt.balance > 0);

  // Prepare payments for Calendar
  const payments = [
    { name: t('salary'), amount: salary, dueDay: 1, category: 'income' as const },
    { name: t('rent'), amount: rent, dueDay: 1, category: 'fixed' as const },
    { name: t('personalLoan'), amount: personalLoan, dueDay: 5, category: 'debt' as const },
    { name: t('carFinance'), amount: carFinance, dueDay: 10, category: 'debt' as const },
    { name: t('creditCards'), amount: creditCards, dueDay: 15, category: 'debt' as const },
    { name: t('utilities'), amount: utilities, dueDay: 20, category: 'fixed' as const },
  ].filter(payment => payment.amount > 0);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-medium">
              <Calculator className="h-8 w-8 text-primary-foreground" />
            </div>
            <LanguageToggle language={language} onLanguageChange={setLanguage} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            {t('appTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('appDescription')}
          </p>
        </header>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="calendar">{t('calendar')}</TabsTrigger>
            <TabsTrigger value="advisor">{t('debtAdvisor')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <IncomeForm onIncomeChange={handleIncomeChange} language={language} />
                <DebtsForm onDebtsChange={handleDebtsChange} language={language} />
                <FixedExpensesForm onExpensesChange={handleFixedExpensesChange} language={language} />
                <VariableExpensesForm onExpensesChange={handleVariableExpensesChange} language={language} />
                <DebtForecast totalDebts={totalDebts} language={language} />
              </div>

              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-8">
                  <BudgetSummary 
                    totalIncome={totalIncome} 
                    totalDebts={totalDebts}
                    totalFixedExpenses={totalFixedExpenses}
                    totalVariableExpenses={totalVariableExpenses}
                    language={language}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView payments={payments} language={language} />
          </TabsContent>

          <TabsContent value="advisor">
            <div className="max-w-3xl mx-auto">
              <DebtAdvisor 
                debts={debts} 
                extraPayment={totalIncome - totalDebts - totalFixedExpenses - totalVariableExpenses} 
                language={language}
              />
            </div>
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>{t('calculationsNote')}</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
