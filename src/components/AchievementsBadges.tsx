import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp, Zap, Star, Award } from "lucide-react";
import { useAchievements, useAddAchievement } from "@/hooks/useAchievements";
import { useDebtPaymentHistory } from "@/hooks/useDebtPayments";
import { Language, getTranslation } from "@/lib/i18n";
import { toast } from "sonner";

interface AchievementsBadgesProps {
  language: Language;
}

export const AchievementsBadges = ({ language }: AchievementsBadgesProps) => {
  const { data: achievements = [] } = useAchievements();
  const { data: paymentHistory = [] } = useDebtPaymentHistory();
  const addAchievement = useAddAchievement();

  useEffect(() => {
    const checkAchievements = async () => {
      const totalPayments = paymentHistory.length;
      const totalPaid = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);

      // Logro: Primera pago
      if (totalPayments >= 1 && !achievements.find(a => a.achievement_type === "first_payment")) {
        await addAchievement.mutateAsync({
          achievement_type: "first_payment",
          title: language === "es" ? "🎯 Primer Paso" : "🎯 First Step",
          description: language === "es" ? "Realizaste tu primer pago de deuda" : "Made your first debt payment",
          icon: "🎯",
          metadata: { payments: 1 },
          profile_id: null,
        });
        toast.success(language === "es" ? "¡Logro desbloqueado! 🎯 Primer Paso" : "Achievement unlocked! 🎯 First Step");
      }

      // Logro: 5 pagos
      if (totalPayments >= 5 && !achievements.find(a => a.achievement_type === "five_payments")) {
        await addAchievement.mutateAsync({
          achievement_type: "five_payments",
          title: language === "es" ? "⚡ Constancia" : "⚡ Consistency",
          description: language === "es" ? "Realizaste 5 pagos de deuda" : "Made 5 debt payments",
          icon: "⚡",
          metadata: { payments: 5 },
          profile_id: null,
        });
        toast.success(language === "es" ? "¡Logro desbloqueado! ⚡ Constancia" : "Achievement unlocked! ⚡ Consistency");
      }

      // Logro: 10 pagos
      if (totalPayments >= 10 && !achievements.find(a => a.achievement_type === "ten_payments")) {
        await addAchievement.mutateAsync({
          achievement_type: "ten_payments",
          title: language === "es" ? "🌟 Disciplinado" : "🌟 Disciplined",
          description: language === "es" ? "Realizaste 10 pagos de deuda" : "Made 10 debt payments",
          icon: "🌟",
          metadata: { payments: 10 },
          profile_id: null,
        });
        toast.success(language === "es" ? "¡Logro desbloqueado! 🌟 Disciplinado" : "Achievement unlocked! 🌟 Disciplined");
      }

      // Logro: £1000 pagados
      if (totalPaid >= 1000 && !achievements.find(a => a.achievement_type === "thousand_paid")) {
        await addAchievement.mutateAsync({
          achievement_type: "thousand_paid",
          title: language === "es" ? "💪 Guerrero Financiero" : "💪 Financial Warrior",
          description: language === "es" ? "Pagaste £1,000 en deudas" : "Paid £1,000 in debts",
          icon: "💪",
          metadata: { amount: 1000 },
          profile_id: null,
        });
        toast.success(language === "es" ? "¡Logro desbloqueado! 💪 Guerrero Financiero" : "Achievement unlocked! 💪 Financial Warrior");
      }
    };

    if (paymentHistory.length > 0) {
      checkAchievements();
    }
  }, [paymentHistory, achievements, addAchievement, language]);

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "first_payment":
        return <Target className="h-4 w-4" />;
      case "five_payments":
        return <Zap className="h-4 w-4" />;
      case "ten_payments":
        return <Star className="h-4 w-4" />;
      case "thousand_paid":
        return <Award className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  if (achievements.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {language === "es" ? "🏆 Logros Desbloqueados" : "🏆 Unlocked Achievements"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(achievement.earned_at).toLocaleDateString(
                      language === "es" ? "es-ES" : "en-US"
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};