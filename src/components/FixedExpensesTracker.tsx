// src/components/FixedExpensesTracker.tsx
import { Trash2, Plus, CalendarIcon } from "lucide-react";
import { useFixedExpenses, useAddFixedExpense, useDeleteFixedExpense } from "@/hooks/useFinancialData";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
type Frequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";
interface VariableExpense {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

// Multiplicadores exactos para convertir cualquier frecuencia a mensual
const frequencyMultiplier: Record<Frequency, number> = {
  weekly: 4.333,
  "bi-weekly": 2,
  monthly: 1,
  quarterly: 0.333,
  annually: 0.0833
};
export const FixedExpensesTracker = () => {
  const {
    toast
  } = useToast();
  const {
    data: expenses = []
  } = useFixedExpenses();
  const addExpenseMutation = useAddFixedExpense();
  const deleteExpenseMutation = useDeleteFixedExpense();
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: 0,
    frequency: "monthly" as Frequency,
    date: new Date()
  });

  // Calculate monthly total from database expenses
  const monthlyTotal = expenses.reduce((total, expense) => {
    const frequency = expense.frequency_type as Frequency;
    return total + expense.amount * (frequencyMultiplier[frequency] || 1);
  }, 0);
  const handleAdd = async () => {
    if (newExpense.name.trim() && newExpense.amount > 0) {
      try {
        await addExpenseMutation.mutateAsync({
          name: newExpense.name,
          amount: newExpense.amount,
          payment_day: newExpense.date.getDate(),
          frequency_type: newExpense.frequency
        });
        setNewExpense({
          name: "",
          amount: 0,
          frequency: "monthly",
          date: new Date()
        });
        setIsAdding(false);
        toast({
          title: "Expense Added",
          description: "Fixed expense has been added successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add expense",
          variant: "destructive"
        });
      }
    }
  };
  const handleDelete = async (id: string) => {
    try {
      await deleteExpenseMutation.mutateAsync(id);
      toast({
        title: "Expense Deleted",
        description: "Fixed expense has been deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive"
      });
    }
  };
  return <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Fixed Expenses</h2>
          <p className="text-gray-600 dark:text-gray-400">Committed monthly expenses:</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition font-medium">
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {expenses.map(expense => <div key={expense.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition">
            <div>
              <p className="font-semibold text-lg">{expense.name}</p>
              <p className="text-sm text-gray-500 capitalize">
                {expense.frequency_type === "bi-weekly" ? "Bi-weekly" : expense.frequency_type} - Day {expense.payment_day}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-indigo-600">£{expense.amount}</span>
              <button onClick={() => handleDelete(expense.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>)}
      </div>

      {isAdding && <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700">
          <h3 className="text-xl font-bold mb-4">New Fixed Expense</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input 
              type="text" 
              placeholder="e.g. Gym membership" 
              value={newExpense.name} 
              onChange={e => setNewExpense({
                ...newExpense,
                name: e.target.value
              })} 
              className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
            <input 
              type="number" 
              placeholder="Amount" 
              value={newExpense.amount || ""} 
              onChange={e => setNewExpense({
                ...newExpense,
                amount: Number(e.target.value)
              })} 
              className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <select 
              value={newExpense.frequency} 
              onChange={e => setNewExpense({
                ...newExpense,
                frequency: e.target.value as Frequency
              })} 
              className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal h-[50px]",
                    !newExpense.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newExpense.date ? format(newExpense.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newExpense.date}
                  onSelect={(date) => date && setNewExpense({ ...newExpense, date })}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition">
              Save Expense
            </button>
            <button onClick={() => setIsAdding(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-xl font-bold transition">
              Cancel
            </button>
          </div>
        </div>}

      <div className="mt-10 p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl text-center">
        <p className="text-2xl opacity-90">Total fixed expenses per month</p>
        <p className="text-6xl font-black mt-2">£{monthlyTotal.toFixed(0)}</p>
      </div>
    </div>;
};