import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/i18n";

export interface PieDatum {
  name: string;
  value: number;
  color: string;
}

interface ExpenseBreakdownCardProps {
  pieData: PieDatum[];
  totalExpenses: number;
  totalIncome: number;
  labels: {
    title: string;
    subtitle: string;
    monthlyTotal: string;
    monthly: string;
    ofIncome: string;
    high: string;
    medium: string;
    low: string;
    impact: string;
  };
}

export const ExpenseBreakdownCard = ({
  pieData,
  totalExpenses,
  totalIncome,
  labels,
}: ExpenseBreakdownCardProps) => {
  if (pieData.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          {labels.title}
        </CardTitle>
        <CardDescription className="text-sm">{labels.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative flex items-center justify-center">
            <div className="w-56 h-56 md:w-64 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="85%"
                    dataKey="value"
                    stroke="none"
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-xl md:text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</div>
                <div className="text-xs text-muted-foreground mt-1">{labels.monthlyTotal}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-4">
            {pieData.map((d, i) => {
              const percent = totalExpenses > 0 ? ((d.value / totalExpenses) * 100).toFixed(1) : "0.0";
              const trend =
                d.value > totalExpenses * 0.2 ? labels.high : d.value > totalExpenses * 0.1 ? labels.medium : labels.low;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: d.color }} />
                    <div>
                      <p className="font-medium text-sm">{d.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{percent}%</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {trend} {labels.impact}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(d.value)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{labels.monthly}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-b-lg rounded-sm">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{labels.monthlyTotal}</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {formatCurrency(totalExpenses)}
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span>
                  {totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : 0}% {labels.ofIncome}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
