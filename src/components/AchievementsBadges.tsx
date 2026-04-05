import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock } from "lucide-react";
import { useAchievements, useAddAchievement } from "@/hooks/useAchievements";
import { useDebtPaymentHistory } from "@/hooks/useDebtPayments";
import { Language } from "@/lib/i18n";
import { toast } from "sonner";

interface AchievementsBadgesProps {
  language: Language;
}

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  unlocked: boolean;
  category: "payments" | "amount" | "streak";
}

const txt = (language: Language, en: string, es: string, pt: string) =>
  language === "en" ? en : language === "es" ? es : pt;

export const AchievementsBadges = ({ language }: AchievementsBadgesProps) => {
  const { data: earnedAchievements = [] } = useAchievements();
  const { data: paymentHistory = [] } = useDebtPaymentHistory();
  const addAchievement = useAddAchievement();

  const totalPayments = paymentHistory.length;
  const totalPaid = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);

  const calculateStreak = () => {
    if (paymentHistory.length === 0) return 0;
    const monthsWithPayments = new Set(
      paymentHistory.map(p => {
        const date = new Date(p.payment_date);
        return `${date.getFullYear()}-${date.getMonth()}`;
      })
    );
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let i = 0; i < 12; i++) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}`;
      if (monthsWithPayments.has(key)) {
        streak++;
      } else {
        break;
      }
      checkDate.setMonth(checkDate.getMonth() - 1);
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  const allAchievements: Achievement[] = useMemo(() => [
    {
      id: "first_payment", type: "first_payment",
      title: txt(language, "🎯 First Step", "🎯 Primer Paso", "🎯 Primeiro Passo"),
      description: txt(language, "Make your first payment", "Realiza tu primer pago", "Faça o seu primeiro pagamento"),
      icon: "🎯", target: 1, current: totalPayments,
      unlocked: earnedAchievements.some(a => a.achievement_type === "first_payment"), category: "payments"
    },
    {
      id: "five_payments", type: "five_payments",
      title: txt(language, "⚡ Consistent", "⚡ Constante", "⚡ Consistente"),
      description: txt(language, "Make 5 payments", "Realiza 5 pagos", "Faça 5 pagamentos"),
      icon: "⚡", target: 5, current: totalPayments,
      unlocked: earnedAchievements.some(a => a.achievement_type === "five_payments"), category: "payments"
    },
    {
      id: "ten_payments", type: "ten_payments",
      title: txt(language, "🌟 Disciplined", "🌟 Disciplinado", "🌟 Disciplinado"),
      description: txt(language, "Make 10 payments", "Realiza 10 pagos", "Faça 10 pagamentos"),
      icon: "🌟", target: 10, current: totalPayments,
      unlocked: earnedAchievements.some(a => a.achievement_type === "ten_payments"), category: "payments"
    },
    {
      id: "twenty_payments", type: "twenty_payments",
      title: txt(language, "🔥 Unstoppable", "🔥 Imparable", "🔥 Imparável"),
      description: txt(language, "Make 20 payments", "Realiza 20 pagos", "Faça 20 pagamentos"),
      icon: "🔥", target: 20, current: totalPayments,
      unlocked: earnedAchievements.some(a => a.achievement_type === "twenty_payments"), category: "payments"
    },
    {
      id: "hundred_paid", type: "hundred_paid",
      title: txt(language, "💵 Saver", "💵 Ahorrista", "💵 Poupador"),
      description: txt(language, "Pay £100 total", "Paga £100 en total", "Pague £100 no total"),
      icon: "💵", target: 100, current: totalPaid,
      unlocked: earnedAchievements.some(a => a.achievement_type === "hundred_paid"), category: "amount"
    },
    {
      id: "five_hundred_paid", type: "five_hundred_paid",
      title: txt(language, "💰 Committed", "💰 Comprometido", "💰 Comprometido"),
      description: txt(language, "Pay £500 total", "Paga £500 en total", "Pague £500 no total"),
      icon: "💰", target: 500, current: totalPaid,
      unlocked: earnedAchievements.some(a => a.achievement_type === "five_hundred_paid"), category: "amount"
    },
    {
      id: "thousand_paid", type: "thousand_paid",
      title: txt(language, "💪 Warrior", "💪 Guerrero", "💪 Guerreiro"),
      description: txt(language, "Pay £1,000 total", "Paga £1,000 en total", "Pague £1.000 no total"),
      icon: "💪", target: 1000, current: totalPaid,
      unlocked: earnedAchievements.some(a => a.achievement_type === "thousand_paid"), category: "amount"
    },
    {
      id: "five_thousand_paid", type: "five_thousand_paid",
      title: txt(language, "👑 Legend", "👑 Leyenda", "👑 Lenda"),
      description: txt(language, "Pay £5,000 total", "Paga £5,000 en total", "Pague £5.000 no total"),
      icon: "👑", target: 5000, current: totalPaid,
      unlocked: earnedAchievements.some(a => a.achievement_type === "five_thousand_paid"), category: "amount"
    },
    {
      id: "three_month_streak", type: "three_month_streak",
      title: txt(language, "🔄 Rhythm", "🔄 Ritmo", "🔄 Ritmo"),
      description: txt(language, "3 consecutive months", "3 meses consecutivos", "3 meses consecutivos"),
      icon: "🔄", target: 3, current: currentStreak,
      unlocked: earnedAchievements.some(a => a.achievement_type === "three_month_streak"), category: "streak"
    },
    {
      id: "six_month_streak", type: "six_month_streak",
      title: txt(language, "🎖️ Dedicated", "🎖️ Dedicado", "🎖️ Dedicado"),
      description: txt(language, "6 consecutive months", "6 meses consecutivos", "6 meses consecutivos"),
      icon: "🎖️", target: 6, current: currentStreak,
      unlocked: earnedAchievements.some(a => a.achievement_type === "six_month_streak"), category: "streak"
    },
    {
      id: "year_streak", type: "year_streak",
      title: txt(language, "🏆 Master", "🏆 Maestro", "🏆 Mestre"),
      description: txt(language, "12 consecutive months", "12 meses consecutivos", "12 meses consecutivos"),
      icon: "🏆", target: 12, current: currentStreak,
      unlocked: earnedAchievements.some(a => a.achievement_type === "year_streak"), category: "streak"
    },
  ], [totalPayments, totalPaid, currentStreak, earnedAchievements, language]);

  useEffect(() => {
    const checkAndUnlock = async () => {
      for (const achievement of allAchievements) {
        if (!achievement.unlocked && achievement.current >= achievement.target) {
          try {
            await addAchievement.mutateAsync({
              achievement_type: achievement.type,
              title: achievement.title,
              description: achievement.description,
              icon: achievement.icon,
              metadata: { target: achievement.target, current: achievement.current, category: achievement.category },
              profile_id: null,
            });
            toast.success(`${txt(language, "Achievement unlocked!", "¡Logro desbloqueado!", "Conquista desbloqueada!")} ${achievement.title}`);
          } catch (error) {
            console.error("Error unlocking achievement:", error);
          }
        }
      }
    };
    if (paymentHistory.length > 0) {
      checkAndUnlock();
    }
  }, [allAchievements, addAchievement, paymentHistory.length, language]);

  const categorizedAchievements = useMemo(() => ({
    payments: allAchievements.filter(a => a.category === "payments"),
    amount: allAchievements.filter(a => a.category === "amount"),
    streak: allAchievements.filter(a => a.category === "streak"),
  }), [allAchievements]);

  const totalUnlocked = allAchievements.filter(a => a.unlocked).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {txt(language, "Achievements", "Logros", "Conquistas")}
          </CardTitle>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {totalUnlocked}/{allAchievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            {txt(language, "💳 Payments Made", "💳 Pagos Realizados", "💳 Pagamentos Feitos")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categorizedAchievements.payments.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} language={language} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            {txt(language, "💰 Money Paid", "💰 Dinero Pagado", "💰 Dinheiro Pago")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categorizedAchievements.amount.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} language={language} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            {txt(language, "🔥 Payment Streak", "🔥 Racha de Pagos", "🔥 Sequência de Pagamentos")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categorizedAchievements.streak.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} language={language} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AchievementCard = ({ achievement, language }: { achievement: Achievement; language: Language }) => {
  const progress = achievement.target > 0 ? Math.min(100, (achievement.current / achievement.target) * 100) : 0;
  
  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-300 ${
        achievement.unlocked
          ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-md"
          : "bg-muted/30 border-muted opacity-70"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`text-3xl ${!achievement.unlocked && "grayscale opacity-50"}`}>
          {achievement.unlocked ? achievement.icon : <Lock className="h-7 w-7 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${achievement.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
            {achievement.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {achievement.description}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {achievement.category === "amount" 
              ? `£${achievement.current.toFixed(0)} / £${achievement.target}`
              : `${achievement.current} / ${achievement.target}`
            }
          </span>
          {achievement.unlocked ? (
            <Badge variant="default" className="text-xs">
              {language === "en" ? "✓ Unlocked" : language === "es" ? "✓ Desbloqueado" : "✓ Desbloqueado"}
            </Badge>
          ) : (
            <span className="text-muted-foreground">
              {progress.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
