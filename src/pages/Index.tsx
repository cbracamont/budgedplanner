import { useState } from "react";
import { IncomeForm } from "@/components/IncomeForm";
import { DebtsForm } from "@/components/DebtsForm";
import { FixedExpensesForm } from "@/components/FixedExpensesForm";
import { VariableExpensesForm } from "@/components/VariableExpensesForm";
import { BudgetSummary } from "@/components/BudgetSummary";
import { DebtForecast } from "@/components/DebtForecast";
import { Calculator } from "lucide-react";

const Index = () => {
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
            Family Budget Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your personal finances with clarity. Enter your income, debts, and expenses to calculate your monthly and weekly budget.
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <IncomeForm onIncomeChange={handleIncomeChange} />
            <DebtsForm onDebtsChange={handleDebtsChange} />
            <FixedExpensesForm onExpensesChange={handleFixedExpensesChange} />
            <VariableExpensesForm onExpensesChange={handleVariableExpensesChange} />
            <DebtForecast totalDebts={totalDebts} />
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <BudgetSummary 
                totalIncome={totalIncome} 
                totalDebts={totalDebts}
                totalFixedExpenses={totalFixedExpenses}
                totalVariableExpenses={totalVariableExpenses}
              />
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Calculations are estimates based on the information provided</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
