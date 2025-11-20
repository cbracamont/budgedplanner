// src/components/Calendar.tsx
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Calendar = () => {
  const { variable } = useBudget();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const expensesOnDate = (date: Date) =>
    variable.filter((v) => isSameDay(new Date(v.date), date));

  const totalOnDate = (date: Date) =>
    expensesOnDate(date).reduce((sum, v) => sum + v.amount, 0);

  const selectedExpenses = selectedDate ? expensesOnDate(selectedDate) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Spending Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium w-32 text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Espacios vacíos antes del primer día */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((day) => {
            const total = totalOnDate(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square rounded-lg border transition-all ${
                  isToday
                    ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2"
                    : isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                } ${total > 0 ? "font-bold" : ""}`}
              >
                <div className="text-sm">{format(day, "d")}</div>
                {total > 0 && <div className="text-xs">£{total}</div>}
              </button>
            );
          })}
        </div>

        {selectedExpenses.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">
              {format(selectedDate!, "EEEE, MMMM d, yyyy")} – £
              {totalOnDate(selectedDate!).toFixed(0)}
            </h4>
            {selectedExpenses.map((exp) => (
              <div key={exp.id} className="flex justify-between text-sm">
                <span>{exp.category}</span>
                <span className="font-medium">£{exp.amount}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
