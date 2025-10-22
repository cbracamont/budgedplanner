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

    // Fetch user's financial data
    const [incomeData, debtsData, fixedExpensesData, variableExpensesData, savingsData] = await Promise.all([
      supabase.from('income_sources').select('*').eq('user_id', user.id),
      supabase.from('debts').select('*').eq('user_id', user.id),
      supabase.from('fixed_expenses').select('*').eq('user_id', user.id),
      supabase.from('variable_expenses').select('*').eq('user_id', user.id),
      supabase.from('savings').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    // Calculate totals
    const totalIncome = incomeData.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    const totalDebts = debtsData.data?.reduce((sum, d) => sum + Number(d.minimum_payment), 0) || 0;
    const totalFixed = fixedExpensesData.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const totalVariable = variableExpensesData.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const monthlySavings = savingsData.data?.monthly_goal || 0;

    // Prepare financial context
    const financialContext = `
Usuario con los siguientes datos financieros mensuales:
- Ingresos totales: £${totalIncome.toFixed(2)}
- Deudas (pago mínimo): £${totalDebts.toFixed(2)}
- Gastos fijos: £${totalFixed.toFixed(2)}
- Gastos variables: £${totalVariable.toFixed(2)}
- Meta de ahorro mensual: £${monthlySavings.toFixed(2)}
- Balance disponible: £${(totalIncome - totalDebts - totalFixed - totalVariable).toFixed(2)}

Detalles de deudas:
${debtsData.data?.map(d => `- ${d.name}: Balance £${d.balance}, APR ${d.apr}%, Pago mínimo £${d.minimum_payment}`).join('\n') || 'Sin deudas'}

Ingresos:
${incomeData.data?.map(i => `- ${i.name}: £${i.amount}`).join('\n') || 'Sin ingresos'}

Gastos fijos:
${fixedExpensesData.data?.map(e => `- ${e.name}: £${e.amount} (${e.frequency_type})`).join('\n') || 'Sin gastos fijos'}

Gastos variables:
${variableExpensesData.data?.map(e => `- ${e.name || 'Sin nombre'}: £${e.amount}`).join('\n') || 'Sin gastos variables'}
    `;

    const systemPrompt = `Eres un asesor financiero experto especializado en finanzas personales del Reino Unido. Tu objetivo es ayudar al usuario a:
- Optimizar su presupuesto y reducir gastos innecesarios
- Crear estrategias para pagar deudas más rápido (método avalancha/snowball)
- Mejorar sus ahorros y alcanzar metas financieras
- Tomar decisiones financieras inteligentes basadas en su situación

Proporciona consejos prácticos, específicos y accionables. Usa datos concretos cuando sea posible.
Sé amigable, empático y alentador. Responde en español.

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