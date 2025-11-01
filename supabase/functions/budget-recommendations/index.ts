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

    // Fetch user's financial data filtered by active profile
    const [incomeData, debtsData, fixedExpensesData, variableExpensesData, savingsData, savingsGoalsData] = await Promise.all([
      supabase.from('income_sources').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('debts').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('fixed_expenses').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('variable_expenses').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('savings').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id).maybeSingle(),
      supabase.from('savings_goals').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
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

    // Prepare financial context
    const financialContext = `
PERFIL ACTIVO: ${activeProfile.name} (${activeProfile.type})

Totales oficiales:
- Ingresos totales: £${totalIncome.toFixed(2)}
- Deudas (pago mínimo): £${totalDebts.toFixed(2)}
- Gastos fijos: £${totalFixed.toFixed(2)}
- Gastos variables: £${totalVariable.toFixed(2)}
- Metas de ahorro activas: £${totalSavingsGoals.toFixed(2)}
- Fondo de emergencia (contribución mensual): £${monthlyEmergencyContribution.toFixed(2)}
- Balance disponible mensual: £${monthlyBalance.toFixed(2)}

Deudas detalladas:
${debtsData.data?.map(d => `- ${d.name} (${d.bank || 'Sin banco'}): Balance £${Number(d.balance).toFixed(2)}, APR ${Number(d.apr).toFixed(2)}%, Pago mínimo £${Number(d.minimum_payment).toFixed(2)}`).join('\n') || 'Sin deudas'}

Metas de ahorro:
${savingsGoalsData.data?.filter(g => g.is_active).map(g => `- ${g.goal_name}: Objetivo £${Number(g.target_amount).toFixed(2)}, Actual £${Number(g.current_amount).toFixed(2)}, Contribución mensual £${Number(g.monthly_contribution || 0).toFixed(2)}`).join('\n') || 'Sin metas activas'}

Fondo de emergencia: £${Number(savingsData.data?.emergency_fund || 0).toFixed(2)}
    `;

    const systemPrompt = `Eres Budget Buddy, un asistente financiero experto. Genera 1-3 recomendaciones PRÁCTICAS Y ACCIONABLES de distribución de presupuesto basadas en la situación financiera del usuario.

IMPORTANTE: Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional antes o después. El formato debe ser:

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

REGLAS PARA LAS RECOMENDACIONES:
1. Solo recomienda si hay balance disponible mensual > £0
2. Prioriza:
   - Pagar deudas con APR alto (>15%)
   - Construir fondo de emergencia si es < 3 meses de gastos
   - Aumentar contribuciones a metas de ahorro cercanas a completarse
3. Cada allocation debe tener un propósito claro
4. El total_amount debe ser la suma de todos los allocations
5. Los montos deben ser realistas y no exceder el balance disponible
6. Máximo 3 recomendaciones

Contexto financiero:
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
          { role: "user", content: "Genera recomendaciones de presupuesto basadas en mi situación actual." }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_budget_recommendations",
              description: "Genera recomendaciones de distribución de presupuesto",
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
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere pago, por favor agrega fondos a tu cuenta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error del servicio de AI" }), {
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido", recommendations: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
