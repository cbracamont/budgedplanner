import { useState } from "react";
import { IncomeForm } from "@/components/IncomeForm";
import { DebtsForm } from "@/components/DebtsForm";
import { BudgetSummary } from "@/components/BudgetSummary";
import { Calculator } from "lucide-react";

const Index = () => {
  const [salary, setSalary] = useState(0);
  const [tips, setTips] = useState(0);
  const [personalLoan, setPersonalLoan] = useState(0);
  const [carFinance, setCarFinance] = useState(0);
  const [creditCards, setCreditCards] = useState(0);

  const handleIncomeChange = (newSalary: number, newTips: number) => {
    setSalary(newSalary);
    setTips(newTips);
  };

  const handleDebtsChange = (newPersonalLoan: number, newCarFinance: number, newCreditCards: number) => {
    setPersonalLoan(newPersonalLoan);
    setCarFinance(newCarFinance);
    setCreditCards(newCreditCards);
  };

  const totalIncome = salary + tips;
  const totalDebts = personalLoan + carFinance + creditCards;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-medium">
              <Calculator className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Calculadora de Presupuesto Familiar
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gestiona tus finanzas personales con claridad. Ingresa tus ingresos y deudas para calcular tu presupuesto mensual y semanal.
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <IncomeForm onIncomeChange={handleIncomeChange} />
            <DebtsForm onDebtsChange={handleDebtsChange} />
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <BudgetSummary totalIncome={totalIncome} totalDebts={totalDebts} />
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Los cálculos son estimaciones basadas en la información proporcionada</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
