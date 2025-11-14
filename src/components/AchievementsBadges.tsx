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

export const AchievementsBadges = ({ language }: AchievementsBadgesProps) => {
  const { data: earnedAchievements = [] } = useAchievements();
  const { data: paymentHistory = [] } = useDebtPaymentHistory();
  const addAchievement = useAddAchievement();

  const totalPayments = paymentHistory.length;
  const totalPaid = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);

  // Calculate streak (consecutive months with payments)
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
    // Payments milestones
    {
      id: "first_payment",
      type: "first_payment",
      title: language === "es" ? "🎯 Primer Paso" : "🎯 First Step",
      description: language === "es" ? "Realiza tu primer pago" : "Make your first payment",
      icon: "🎯",
      target: 1,
      current: totalPayments,
      unlocked: earnedAchievements.some(a => a.achievement_type === "first_payment"),
      category: "payments"
    },
    {
      id: "five_payments",
      type: "five_payments",
      title: language === "es" ? "⚡ Constante" : "⚡ Consistent",
      description: language === "es" ? "Realiza 5 pagos" : "Make 5 payments",
      icon: "⚡",
      target: 5,
      current: totalPayments,
      unlocked: earnedAchievements.some(a => a.achievement_type === "five_payments"),
      category: "payments"
    },
    {
      id: "ten_payments",
      type: "ten_payments",
      title: language === "es" ? "🌟 Disciplinado" : "🌟 Disciplined",
      description: language === "es" ? "Realiza 10 pagos" : "Make 10 payments",
      icon: "🌟",
      target: 10,
      current: totalPayments,
      unlocked: earnedAchievements.some(a => a.achievement_type === "ten_payments"),
      category: "payments"
    },
    {
      id: "twenty_payments",
      type: "twenty_payments",
      title: language === "es" ? "🔥 Imparable" : "🔥 Unstoppable",
      description: language === "es" ? "Realiza 20 pagos" : "Make 20 payments",
      icon: "🔥",
      target: 20,
      current: totalPayments,
      unlocked: earnedAchievements.some(a => a.achievement_type === "twenty_payments"),
      category: "payments"
    },
    // Amount milestones
    {
      id: "hundred_paid",
      type: "hundred_paid",
      title: language === "es" ? "💵 Ahorrista" : "💵 Saver",
      description: language === "es" ? "Paga £100 en total" : "Pay £100 total",
      icon: "💵",
      target: 100,
      current: totalPaid,
      unlocked: earnedAchievements.some(a => a.achievement_type === "hundred_paid"),
      category: "amount"
    },
    {
      id: "five_hundred_paid",
      type: "five_hundred_paid",
      title: language === "es" ? "💰 Comprometido" : "💰 Committed",
      description: language === "es" ? "Paga £500 en total" : "Pay £500 total",
      icon: "💰",
      target: 500,
      current: totalPaid,
      unlocked: earnedAchievements.some(a => a.achievement_type === "five_hundred_paid"),
      category: "amount"
    },
    {
      id: "thousand_paid",
      type: "thousand_paid",
      title: language === "es" ? "💪 Guerrero" : "💪 Warrior",
      description: language === "es" ? "Paga £1,000 en total" : "Pay £1,000 total",
      icon: "💪",
      target: 1000,
      current: totalPaid,
      unlocked: earnedAchievements.some(a => a.achievement_type === "thousand_paid"),
      category: "amount"
    },
    {
      id: "five_thousand_paid",
      type: "five_thousand_paid",
      title: language === "es" ? "👑 Leyenda" : "👑 Legend",
      description: language === "es" ? "Paga £5,000 en total" : "Pay £5,000 total",
      icon: "👑",
      target: 5000,
      current: totalPaid,
      unlocked: earnedAchievements.some(a => a.achievement_type === "five_thousand_paid"),
      category: "amount"
    },
    // Streak achievements
    {
      id: "three_month_streak",
      type: "three_month_streak",
      title: language === "es" ? "🔄 Ritmo" : "🔄 Rhythm",
      description: language === "es" ? "3 meses consecutivos" : "3 consecutive months",
      icon: "🔄",
      target: 3,
      current: currentStreak,
      unlocked: earnedAchievements.some(a => a.achievement_type === "three_month_streak"),
      category: "streak"
    },
    {
      id: "six_month_streak",
      type: "six_month_streak",
      title: language === "es" ? "🎖️ Dedicado" : "🎖️ Dedicated",
      description: language === "es" ? "6 meses consecutivos" : "6 consecutive months",
      icon: "🎖️",
      target: 6,
      current: currentStreak,
      unlocked: earnedAchievements.some(a => a.achievement_type === "six_month_streak"),
      category: "streak"
    },
    {
      id: "year_streak",
      type: "year_streak",
      title: language === "es" ? "🏆 Maestro" : "🏆 Master",
      description: language === "es" ? "12 meses consecutivos" : "12 consecutive months",
      icon: "🏆",
      target: 12,
      current: currentStreak,
      unlocked: earnedAchievements.some(a => a.achievement_type === "year_streak"),
      category: "streak"
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
              metadata: { 
                target: achievement.target, 
                current: achievement.current,
                category: achievement.category 
              },
              profile_id: null,
            });
            toast.success(`${language === "es" ? "¡Logro desbloqueado!" : "Achievement unlocked!"} ${achievement.title}`);
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
            {language === "es" ? "Logros" : "Achievements"}
          </CardTitle>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {totalUnlocked}/{allAchievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payments Category */}
        <div>
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            {language === "es" ? "💳 Pagos Realizados" : "💳 Payments Made"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categorizedAchievements.payments.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} language={language} />
            ))}
          </div>
        </div>

        {/* Amount Category */}
        <div>
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            {language === "es" ? "💰 Dinero Pagado" : "💰 Money Paid"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categorizedAchievements.amount.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} language={language} />
            ))}
          </div>
        </div>

        {/* Streak Category */}
        <div>
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            {language === "es" ? "🔥 Racha de Pagos" : "🔥 Payment Streak"}
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
              {language === "es" ? "✓ Desbloqueado" : "✓ Unlocked"}
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