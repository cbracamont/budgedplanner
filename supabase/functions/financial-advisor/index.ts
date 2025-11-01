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
    const { messages } = await req.json();
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

    // If no active profile found, return error
    if (!activeProfile) {
      throw new Error("No active profile found. Please select a profile first.");
    }

    // Fetch user's financial data filtered by active profile
    const [incomeData, debtsData, fixedExpensesData, variableExpensesData, savingsData, savingsGoalsData, debtPaymentsData] = await Promise.all([
      supabase.from('income_sources').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('debts').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('fixed_expenses').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('variable_expenses').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('savings').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id).maybeSingle(),
      supabase.from('savings_goals').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id),
      supabase.from('debt_payments').select('*, debts(name, bank)').eq('user_id', user.id).eq('profile_id', activeProfile.id).order('payment_date', { ascending: false }),
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

    // Prepare financial context (exactly same rules as dashboard)
    const financialContext = `
PERFIL ACTIVO: ${activeProfile.name} (${activeProfile.type})

REGLAS: Usa estrictamente los TOTALES OFICIALES provistos abajo; no los recalcules a partir de los listados. Si detectas discrepancias, prioriza "Balance disponible mensual".

Totales oficiales (mismo cálculo que el dashboard):
- Ingresos totales: £${totalIncome.toFixed(2)}
- Deudas (pago mínimo): £${totalDebts.toFixed(2)}
- Gastos fijos considerados este mes: £${totalFixed.toFixed(2)} (gastos ANUALES solo si payment_month == ${currentMonth})
- Gastos variables: £${totalVariable.toFixed(2)}
- Metas de ahorro ACTIVAS: £${totalSavingsGoals.toFixed(2)}
- Contribución a fondo de emergencia: £${monthlyEmergencyContribution.toFixed(2)}
- Balance disponible mensual: £${monthlyBalance.toFixed(2)}

Listado informativo:
Deudas:
${debtsData.data?.map(d => `- ${d.name}: Balance £${Number(d.balance).toFixed(2)}, APR ${Number(d.apr).toFixed(2)}%, Pago mínimo £${Number(d.minimum_payment).toFixed(2)}`).join('\n') || 'Sin deudas'}

Ingresos:
${incomeData.data?.map(i => `- ${i.name}: £${Number(i.amount).toFixed(2)}`).join('\n') || 'Sin ingresos'}

Gastos fijos (marcados si se incluyen este mes):
${fixedExpensesData.data?.map(e => `- ${e.name}: £${Number(e.amount).toFixed(2)} (${e.frequency_type}${e.frequency_type === 'annual' ? (e.payment_month === currentMonth ? ' - incluido este mes' : ' - no incluido este mes') : ''})`).join('\n') || 'Sin gastos fijos'}

Gastos variables:
${variableExpensesData.data?.map(e => `- ${e.name || 'Sin nombre'}: £${Number(e.amount).toFixed(2)}`).join('\n') || 'Sin gastos variables'}

Historial de pagos de deudas (últimos registros):
${debtPaymentsData.data?.slice(0, 20).map(p => `- ${p.debts?.name || 'Deuda'}: £${Number(p.amount).toFixed(2)} pagado el ${new Date(p.payment_date).toLocaleDateString('es-ES')}${p.notes ? ` (Nota: ${p.notes})` : ''}`).join('\n') || 'Sin historial de pagos'}
    `;

    const systemPrompt = `Eres Budget Buddy, un asistente financiero amigable especializado en finanzas personales del Reino Unido. Tu objetivo es ayudar al usuario a:
- Optimizar su presupuesto y reducir gastos innecesarios
- Crear estrategias para pagar deudas más rápido (método avalancha/snowball)
- Mejorar sus ahorros y alcanzar metas financieras
- Tomar decisiones financieras inteligentes basadas en su situación

REGLAS ESTRICTAS:
- Usa EXCLUSIVAMENTE los "Totales oficiales" del contexto como fuente de verdad. No vuelvas a sumar de los listados.
- Si muestras un desglose, respeta las marcas "incluido/no incluido este mes" para gastos fijos anuales.
- Cuando des cifras, muéstralas exactamente como están en los totales oficiales.
- Responde en español con consejos claros y accionables.
- Preséntate como Budget Buddy, tu compañero financiero amigable.

FORMATO DE RESPUESTA:
- Divide tu respuesta en secciones cortas y claras
- Usa viñetas (•) para listas de puntos
- Usa numeración (1., 2., 3.) para pasos o prioridades
- Deja líneas en blanco entre secciones para mejor legibilidad
- Evita bloques de texto largos (máximo 3-4 líneas por párrafo)
- Usa negritas con ** para resaltar cifras importantes o conceptos clave
- Estructura tus respuestas así:
  * Saludo breve (1 línea)
  * Análisis/situación actual (2-3 viñetas)
  * Recomendaciones (numeradas si son pasos)
  * Conclusión motivadora (1-2 líneas)

Contexto financiero del usuario:
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
          ...messages,
        ],
        stream: false,
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
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in financial-advisor function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});