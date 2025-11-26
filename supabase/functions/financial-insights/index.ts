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
    const [incomeData, debtsData, paymentsData, savingsData] = await Promise.all([
      supabase.from('income_sources').select('*').eq('user_id', user.id).eq('profile_id', profileId),
      supabase.from('debts').select('*').eq('user_id', user.id).eq('profile_id', profileId),
      supabase.from('payment_tracker').select('*').eq('user_id', user.id).eq('profile_id', profileId),
      supabase.from('savings_goals').select('*').eq('user_id', user.id).eq('profile_id', profileId)
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
    const savingsProgress = savingsData.data?.reduce((sum, s) => sum + (s.current_amount / s.target_amount) * 100, 0) / (savingsData.data?.length || 1) || 0;

    // Get upcoming payments (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingDebts = debtsData.data?.filter(d => {
      const paymentDay = d.payment_day;
      const nextPaymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), paymentDay);
      return nextPaymentDate >= currentDate && nextPaymentDate <= nextWeek;
    }).map(d => ({
      name: d.name,
      amount: d.minimum_payment,
      date: d.payment_day,
      type: 'debt'
    })) || [];

    const translations = {
      en: {
        healthyStatus: "Your financial health is good",
        concernStatus: "Some areas need attention",
        criticalStatus: "Immediate action needed",
        upcomingPayments: "upcoming payments",
        pendingPayments: "pending payments worth",
        debtLevel: "Total debt",
        savingsProgress: "Savings goals progress"
      },
      es: {
        healthyStatus: "Tu salud financiera es buena",
        concernStatus: "Algunas áreas necesitan atención",
        criticalStatus: "Se requiere acción inmediata",
        upcomingPayments: "pagos próximos",
        pendingPayments: "pagos pendientes por valor de",
        debtLevel: "Deuda total",
        savingsProgress: "Progreso de metas de ahorro"
      },
      pt: {
        healthyStatus: "Sua saúde financeira está boa",
        concernStatus: "Algumas áreas precisam de atenção",
        criticalStatus: "Ação imediata necessária",
        upcomingPayments: "pagamentos próximos",
        pendingPayments: "pagamentos pendentes no valor de",
        debtLevel: "Dívida total",
        savingsProgress: "Progresso das metas de poupança"
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
        {
          label: t.pendingPayments,
          value: `$${totalPending.toLocaleString()}`,
          count: pendingPayments.length
        },
        {
          label: t.debtLevel,
          value: `$${totalDebt.toLocaleString()}`
        },
        {
          label: t.savingsProgress,
          value: `${Math.round(savingsProgress)}%`
        }
      ],
      upcomingPayments: upcomingDebts.map(p => ({
        ...p,
        label: `${t.upcomingPayments}`
      }))
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