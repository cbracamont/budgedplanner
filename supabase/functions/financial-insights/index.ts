import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, language = 'en' } = await req.json();

    // Fetch financial data
    const [incomeData, debtsData, paymentsData, savingsData, fixedData] = await Promise.all([
      supabase.from('income_sources').select('*').eq('user_id', user.id).eq('profile_id', profileId),
      supabase.from('debts').select('*').eq('user_id', user.id).eq('profile_id', profileId),
      supabase.from('payment_tracker').select('*').eq('user_id', user.id).eq('profile_id', profileId),
      supabase.from('savings_goals').select('*').eq('user_id', user.id).eq('profile_id', profileId),
      supabase.from('fixed_expenses').select('*').eq('user_id', user.id).eq('profile_id', profileId)
    ]);

    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const monthlyPayments = paymentsData.data?.filter(p => p.month_year === currentMonth) || [];
    const pendingPayments = monthlyPayments.filter(p => p.payment_status === 'pending');
    const paidPayments = monthlyPayments.filter(p => p.payment_status === 'paid');

    const totalIncome = incomeData.data?.reduce((sum, i) => sum + i.amount, 0) || 0;
    const totalDebt = debtsData.data?.reduce((sum, d) => sum + d.balance, 0) || 0;
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const savingsProgress = savingsData.data?.length
      ? savingsData.data.reduce(
          (sum, s) => sum + (s.target_amount > 0 ? Math.min(s.current_amount / s.target_amount, 1) * 100 : 0),
          0
        ) / savingsData.data.length
      : 0;

    // Upcoming payments in the next 7 days (debts + monthly fixed expenses)
    const daysUntil = (day: number) => {
      const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const target = thisMonth < new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day)
        : thisMonth;
      return Math.round(
        (target.getTime() - new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime()) /
          86400000
      );
    };

    const upcomingDebts = (debtsData.data || [])
      .filter(d => d.balance > 0 && d.payment_day)
      .map(d => ({ name: d.name, amount: d.minimum_payment, date: d.payment_day, type: 'debt', daysUntil: daysUntil(d.payment_day) }))
      .filter(p => p.daysUntil >= 0 && p.daysUntil <= 7);

    const upcomingFixed = (fixedData.data || [])
      .filter(f => (f.frequency_type ?? 'monthly') === 'monthly' && f.payment_day)
      .map(f => ({ name: f.name, amount: f.amount, date: f.payment_day, type: 'fixed', daysUntil: daysUntil(f.payment_day) }))
      .filter(p => p.daysUntil >= 0 && p.daysUntil <= 7);

    const upcoming = [...upcomingDebts, ...upcomingFixed].sort((a, b) => a.daysUntil - b.daysUntil);
    const upcomingTotal = upcoming.reduce((sum, p) => sum + (p.amount || 0), 0);

    const translations = {
      en: {
        healthyStatus: "Your financial health is good",
        concernStatus: "Some areas need attention",
        criticalStatus: "Immediate action needed",
        pendingPayments: "Pending payments this month",
        paidPayments: "Paid this month",
        debtLevel: "Total debt",
        savingsProgress: "Savings goals progress",
        next7days: "Due in the next 7 days"
      },
      es: {
        healthyStatus: "Tu salud financiera es buena",
        concernStatus: "Algunas áreas necesitan atención",
        criticalStatus: "Se requiere acción inmediata",
        pendingPayments: "Pagos pendientes este mes",
        paidPayments: "Pagado este mes",
        debtLevel: "Deuda total",
        savingsProgress: "Progreso de metas de ahorro",
        next7days: "Vence en los próximos 7 días"
      },
      pt: {
        healthyStatus: "Sua saúde financeira está boa",
        concernStatus: "Algumas áreas precisam de atenção",
        criticalStatus: "Ação imediata necessária",
        pendingPayments: "Pagamentos pendentes este mês",
        paidPayments: "Pago este mês",
        debtLevel: "Dívida total",
        savingsProgress: "Progresso das metas de poupança",
        next7days: "Vence nos próximos 7 dias"
      }
    };

    const t = translations[language as keyof typeof translations] || translations.en;

    // Determine financial status
    let status = 'healthy';
    let statusMessage = t.healthyStatus;

    if (totalDebt > totalIncome * 3 || pendingPayments.length > 5) {
      status = 'critical';
      statusMessage = t.criticalStatus;
    } else if (totalDebt > totalIncome || pendingPayments.length > 2) {
      status = 'concern';
      statusMessage = t.concernStatus;
    }

    const insights = {
      status,
      statusMessage,
      metrics: [
        { key: 'pending', label: t.pendingPayments, amount: totalPending, format: 'currency', count: pendingPayments.length },
        { key: 'paid', label: t.paidPayments, amount: totalPaid, format: 'currency', count: paidPayments.length },
        { key: 'next7', label: t.next7days, amount: upcomingTotal, format: 'currency', count: upcoming.length },
        { key: 'debt', label: t.debtLevel, amount: totalDebt, format: 'currency' },
        { key: 'savings', label: t.savingsProgress, amount: Math.round(savingsProgress), format: 'percent' }
      ],
      upcomingPayments: upcoming
    };

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
