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
    const { language = 'en' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user's authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from auth token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get active profile
    const { data: activeProfile, error: profileError } = await supabase
      .from('financial_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching active profile:", profileError);
      throw new Error("Error fetching active profile");
    }

    if (!activeProfile) {
      throw new Error("No active profile found. Please select a profile first.");
    }

    // Get current month for payment tracker
    const now = new Date();
    const currentMonthYear = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Fetch user's financial data filtered by active profile
    const [incomeData, debtsData, fixedExpensesData, variableExpensesData, savingsData, savingsGoalsData, paymentTrackerData, debtPaymentsData] = await Promise.all([
      supabase.from('income_sources').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('debts').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('fixed_expenses').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('variable_expenses').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('savings').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id).maybeSingle(),
      supabase.from('savings_goals').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('payment_tracker').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id).eq('month_year', currentMonthYear),
      supabase.from('debt_payments').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id).gte('payment_date', currentMonthYear),
    ]);

    // Calculate totals
    const totalIncome = incomeData.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    const totalDebts = debtsData.data?.reduce((sum, d) => sum + Number(d.minimum_payment), 0) || 0;
    const currentMonth = new Date().getMonth() + 1;
    const totalFixed = fixedExpensesData.data?.reduce((sum, e) => {
      const amount = Number(e.amount) || 0;
      if (e.frequency_type === 'annual') {
        return sum + (e.payment_month === currentMonth ? amount : 0);
      }
      return sum + amount;
    }, 0) || 0;
    const totalVariable = variableExpensesData.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const totalSavingsGoals = savingsGoalsData.data
      ?.filter((g) => !!g.is_active)
      .reduce((sum, g) => sum + Number(g.monthly_contribution || 0), 0) || 0;
    const monthlyEmergencyContribution = Number(savingsData.data?.monthly_emergency_contribution || 0);
    const totalExpenses = totalDebts + totalFixed + totalVariable;
    const monthlySavingsCommitments = totalSavingsGoals + monthlyEmergencyContribution;
    const monthlyBalance = totalIncome - totalExpenses - monthlySavingsCommitments;

    // Calculate payment tracker statistics
    const paidPayments = paymentTrackerData.data?.filter(p => p.payment_status === 'paid') || [];
    const pendingPayments = paymentTrackerData.data?.filter(p => p.payment_status === 'pending') || [];
    const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalDebtPayments = debtPaymentsData.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Translation helpers
    const translations = {
      en: {
        activeProfile: 'ACTIVE PROFILE',
        officialTotals: 'Official totals',
        totalIncome: 'Total income',
        debts: 'Debts (minimum payment)',
        fixedExpenses: 'Fixed expenses',
        variableExpenses: 'Variable expenses',
        activeSavingsGoals: 'Active savings goals',
        emergencyFundContribution: 'Emergency fund (monthly contribution)',
        availableBalance: 'Available monthly balance',
        detailedDebts: 'Detailed debts',
        noDebts: 'No debts',
        noBank: 'No bank',
        balance: 'Balance',
        minimumPayment: 'Minimum payment',
        savingsGoals: 'Savings goals',
        target: 'Target',
        current: 'Current',
        monthlyContribution: 'Monthly contribution',
        noActiveGoals: 'No active goals',
        emergencyFund: 'Emergency fund',
        currentMonthPaymentStatus: 'Current month payment status',
        paidPayments: 'Paid payments',
        pendingPayments: 'Pending payments',
        debtPaymentsThisMonth: 'Debt payments made this month',
        pendingPaymentDetails: 'Pending payment details',
        noPendingPayments: 'No pending payments',
        dueDate: 'due',
        noDate: 'no date',
        systemPrompt: 'You are Budget Buddy, an expert financial assistant. Generate 1-3 PRACTICAL AND ACTIONABLE budget allocation recommendations based on the user\'s financial situation.',
        rules: `RULES FOR RECOMMENDATIONS:
1. Only recommend if available monthly balance > £0
2. Consider current payment status:
   - If there are important pending payments, recommend prioritizing them
   - If payments are ahead, suggest using excess wisely
3. Prioritize:
   - Complete pending payments for the month
   - Pay high APR debts (>15%)
   - Build emergency fund if < 3 months of expenses
   - Increase contributions to savings goals close to completion
4. Each allocation must have a clear purpose
5. total_amount must be the sum of all allocations
6. Amounts must be realistic and not exceed available balance
7. Maximum 3 recommendations`
      },
      es: {
        activeProfile: 'PERFIL ACTIVO',
        officialTotals: 'Totales oficiales',
        totalIncome: 'Ingresos totales',
        debts: 'Deudas (pago mínimo)',
        fixedExpenses: 'Gastos fijos',
        variableExpenses: 'Gastos variables',
        activeSavingsGoals: 'Metas de ahorro activas',
        emergencyFundContribution: 'Fondo de emergencia (contribución mensual)',
        availableBalance: 'Balance disponible mensual',
        detailedDebts: 'Deudas detalladas',
        noDebts: 'Sin deudas',
        noBank: 'Sin banco',
        balance: 'Balance',
        minimumPayment: 'Pago mínimo',
        savingsGoals: 'Metas de ahorro',
        target: 'Objetivo',
        current: 'Actual',
        monthlyContribution: 'Contribución mensual',
        noActiveGoals: 'Sin metas activas',
        emergencyFund: 'Fondo de emergencia',
        currentMonthPaymentStatus: 'Estado de pagos del mes actual',
        paidPayments: 'Pagos realizados',
        pendingPayments: 'Pagos pendientes',
        debtPaymentsThisMonth: 'Pagos de deudas realizados este mes',
        pendingPaymentDetails: 'Detalle de pagos pendientes',
        noPendingPayments: 'Sin pagos pendientes',
        dueDate: 'vence',
        noDate: 'sin fecha',
        systemPrompt: 'Eres Budget Buddy, un asistente financiero experto. Genera 1-3 recomendaciones PRÁCTICAS Y ACCIONABLES de distribución de presupuesto basadas en la situación financiera del usuario.',
        rules: `REGLAS PARA LAS RECOMENDACIONES:
1. Solo recomienda si hay balance disponible mensual > £0
2. Considera el estado de pagos actual:
   - Si hay pagos pendientes importantes, recomienda priorizarlos
   - Si hay pagos adelantados, sugiere usar el excedente sabiamente
3. Prioriza:
   - Completar pagos pendientes del mes
   - Pagar deudas con APR alto (>15%)
   - Construir fondo de emergencia si es < 3 meses de gastos
   - Aumentar contribuciones a metas de ahorro cercanas a completarse
4. Cada allocation debe tener un propósito claro
5. El total_amount debe ser la suma de todos los allocations
6. Los montos deben ser realistas y no exceder el balance disponible
7. Máximo 3 recomendaciones`
      },
      pt: {
        activeProfile: 'PERFIL ATIVO',
        officialTotals: 'Totais oficiais',
        totalIncome: 'Receita total',
        debts: 'Dívidas (pagamento mínimo)',
        fixedExpenses: 'Despesas fixas',
        variableExpenses: 'Despesas variáveis',
        activeSavingsGoals: 'Metas de poupança ativas',
        emergencyFundContribution: 'Fundo de emergência (contribuição mensal)',
        availableBalance: 'Saldo disponível mensal',
        detailedDebts: 'Dívidas detalhadas',
        noDebts: 'Sem dívidas',
        noBank: 'Sem banco',
        balance: 'Saldo',
        minimumPayment: 'Pagamento mínimo',
        savingsGoals: 'Metas de poupança',
        target: 'Objetivo',
        current: 'Atual',
        monthlyContribution: 'Contribuição mensal',
        noActiveGoals: 'Sem metas ativas',
        emergencyFund: 'Fundo de emergência',
        currentMonthPaymentStatus: 'Status de pagamentos do mês atual',
        paidPayments: 'Pagamentos realizados',
        pendingPayments: 'Pagamentos pendentes',
        debtPaymentsThisMonth: 'Pagamentos de dívidas realizados este mês',
        pendingPaymentDetails: 'Detalhes de pagamentos pendentes',
        noPendingPayments: 'Sem pagamentos pendentes',
        dueDate: 'vencimento',
        noDate: 'sem data',
        systemPrompt: 'Você é o Budget Buddy, um assistente financeiro especialista. Gere 1-3 recomendações PRÁTICAS E ACIONÁVEIS de alocação de orçamento com base na situação financeira do usuário.',
        rules: `REGRAS PARA AS RECOMENDAÇÕES:
1. Recomende apenas se o saldo disponível mensal > £0
2. Considere o status de pagamento atual:
   - Se houver pagamentos pendentes importantes, recomende priorizá-los
   - Se os pagamentos estiverem adiantados, sugira usar o excedente com sabedoria
3. Priorize:
   - Completar pagamentos pendentes do mês
   - Pagar dívidas com APR alto (>15%)
   - Construir fundo de emergência se < 3 meses de despesas
   - Aumentar contribuições para metas de poupança próximas à conclusão
4. Cada alocação deve ter um propósito claro
5. total_amount deve ser a soma de todas as alocações
6. Os valores devem ser realistas e não exceder o saldo disponível
7. Máximo de 3 recomendações`
      }
    };

    const t = translations[language as keyof typeof translations] || translations.en;

    // Prepare financial context
    const financialContext = `
${t.activeProfile}: ${activeProfile.name} (${activeProfile.type})

${t.officialTotals}:
- ${t.totalIncome}: £${totalIncome.toFixed(2)}
- ${t.debts}: £${totalDebts.toFixed(2)}
- ${t.fixedExpenses}: £${totalFixed.toFixed(2)}
- ${t.variableExpenses}: £${totalVariable.toFixed(2)}
- ${t.activeSavingsGoals}: £${totalSavingsGoals.toFixed(2)}
- ${t.emergencyFundContribution}: £${monthlyEmergencyContribution.toFixed(2)}
- ${t.availableBalance}: £${monthlyBalance.toFixed(2)}

${t.detailedDebts}:
${debtsData.data?.map(d => `- ${d.name} (${d.bank || t.noBank}): ${t.balance} £${Number(d.balance).toFixed(2)}, APR ${Number(d.apr).toFixed(2)}%, ${t.minimumPayment} £${Number(d.minimum_payment).toFixed(2)}`).join('\n') || t.noDebts}

${t.savingsGoals}:
${savingsGoalsData.data?.filter(g => g.is_active).map(g => `- ${g.goal_name}: ${t.target} £${Number(g.target_amount).toFixed(2)}, ${t.current} £${Number(g.current_amount).toFixed(2)}, ${t.monthlyContribution} £${Number(g.monthly_contribution || 0).toFixed(2)}`).join('\n') || t.noActiveGoals}

${t.emergencyFund}: £${Number(savingsData.data?.emergency_fund || 0).toFixed(2)}

${t.currentMonthPaymentStatus}:
- ${t.paidPayments}: £${totalPaid.toFixed(2)} (${paidPayments.length} ${language === 'en' ? 'payments' : language === 'pt' ? 'pagamentos' : 'pagos'})
- ${t.pendingPayments}: £${totalPending.toFixed(2)} (${pendingPayments.length} ${language === 'en' ? 'payments' : language === 'pt' ? 'pagamentos' : 'pagos'})
- ${t.debtPaymentsThisMonth}: £${totalDebtPayments.toFixed(2)}

${t.pendingPaymentDetails}:
${pendingPayments.length > 0 ? pendingPayments.map(p => `- ${p.payment_type}: £${Number(p.amount).toFixed(2)} (${t.dueDate}: ${p.payment_date || t.noDate})`).join('\n') : t.noPendingPayments}
    `;

    const systemPrompt = `${t.systemPrompt}

IMPORTANT: Return EXCLUSIVELY a valid JSON object, without any additional text before or after. The format must be:

{
  "recommendations": [
    {
      "id": "unique-id-1",
      "title": "Título corto de la recomendación",
      "description": "Explicación breve de por qué esta recomendación ayudará",
      "allocations": [
        {
          "category": "Nombre descriptivo",
          "amount": 123.45,
          "target_id": "debt-id-o-goal-id-si-aplica",
          "target_type": "debt o savings_goal o emergency_fund"
        }
      ],
      "total_amount": 123.45
    }
  ]
}

${t.rules}

Financial context:
${financialContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: language === 'en' 
            ? "Generate budget recommendations based on my current situation." 
            : language === 'pt'
            ? "Gere recomendações de orçamento com base na minha situação atual."
            : "Genera recomendaciones de presupuesto basadas en mi situación actual." }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_budget_recommendations",
              description: language === 'en' 
                ? "Generate budget allocation recommendations" 
                : language === 'pt'
                ? "Gerar recomendações de alocação de orçamento"
                : "Genera recomendaciones de distribución de presupuesto",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        allocations: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              category: { type: "string" },
                              amount: { type: "number" },
                              target_id: { type: "string" },
                              target_type: { type: "string", enum: ["debt", "savings_goal", "emergency_fund"] }
                            },
                            required: ["category", "amount"],
                            additionalProperties: false
                          }
                        },
                        total_amount: { type: "number" }
                      },
                      required: ["id", "title", "description", "allocations", "total_amount"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["recommendations"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_budget_recommendations" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const errorMsg = language === 'en' 
          ? "Rate limit exceeded, please try again later." 
          : language === 'pt'
          ? "Limite de taxa excedido, tente novamente mais tarde."
          : "Límite de solicitudes excedido, intenta de nuevo más tarde.";
        return new Response(JSON.stringify({ error: errorMsg }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        const errorMsg = language === 'en' 
          ? "Payment required, please add funds to your account." 
          : language === 'pt'
          ? "Pagamento necessário, adicione fundos à sua conta."
          : "Se requiere pago, por favor agrega fondos a tu cuenta.";
        return new Response(JSON.stringify({ error: errorMsg }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      const errorMsg = language === 'en' 
        ? "AI service error" 
        : language === 'pt'
        ? "Erro do serviço de IA"
        : "Error del servicio de AI";
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      const recommendations = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(recommendations), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback if no tool call
    return new Response(JSON.stringify({ recommendations: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in budget-recommendations function:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMsg, recommendations: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
