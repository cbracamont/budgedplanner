import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieIcon, TrendingUp } from "lucide-react";
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
    <Card className="overflow-hidden animate-fade-in shadow-medium">
      <CardHeader className="pb-2">
        <CardTitle className="text-title flex items-center gap-2">
          <PieIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          {labels.title}
        </CardTitle>
        <CardDescription className="text-body">{labels.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 gap-8 items-center p-6">
          <div className="relative flex items-center justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="86%"
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
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "12px",
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-metric text-foreground">{formatCurrency(totalExpenses)}</div>
                <div className="text-label text-muted-foreground mt-1">{labels.monthlyTotal}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-3">
            {pieData.map((d, i) => {
              const percent = totalExpenses > 0 ? ((d.value / totalExpenses) * 100).toFixed(1) : "0.0";
              const trend =
                d.value > totalExpenses * 0.2 ? labels.high : d.value > totalExpenses * 0.1 ? labels.medium : labels.low;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} aria-hidden="true" />
                    <div>
                      <p className="text-body font-medium">{d.name}</p>
                      <p className="text-body-sm text-muted-foreground flex items-center gap-1.5">
                        <span>{percent}%</span>
                        <span aria-hidden="true">·</span>
                        <span>{`${trend} ${labels.impact}`}</span>
                      </p>

                    </div>
                  </div>
                  <p className="text-metric-sm">{formatCurrency(d.value)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t px-6 py-4 bg-muted/40">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="text-label text-muted-foreground">{labels.monthlyTotal}</span>
            <div className="flex items-center gap-3">
              <span className="text-metric-sm text-foreground">{formatCurrency(totalExpenses)}</span>
              <span className="flex items-center gap-1 text-body-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                {totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : 0}% {labels.ofIncome}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
