import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Debt {
  id: string
  user_id: string
  name: string
  balance: number
  minimum_payment: number
  payment_day: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting automatic debt payment generation...')

    // Get all active debts (balance > 0)
    const { data: debts, error: debtsError } = await supabaseClient
      .from('debts')
      .select('*')
      .gt('balance', 0)
      .gt('minimum_payment', 0)

    if (debtsError) {
      console.error('Error fetching debts:', debtsError)
      throw debtsError
    }

    if (!debts || debts.length === 0) {
      console.log('No active debts found')
      return new Response(
        JSON.stringify({ message: 'No active debts to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Found ${debts.length} active debts`)

    const today = new Date()
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthYearStr = currentMonth.toISOString().split('T')[0]

    // Generate payments for current month and next 2 months
    const monthsToGenerate = [0, 1, 2]
    let totalGenerated = 0

    for (const monthOffset of monthsToGenerate) {
      const targetMonth = new Date(currentMonth)
      targetMonth.setMonth(targetMonth.getMonth() + monthOffset)
      const targetMonthStr = targetMonth.toISOString().split('T')[0]

      console.log(`Generating payments for month: ${targetMonthStr}`)

      for (const debt of debts as Debt[]) {
        // Check if payment already exists for this debt and month
        const { data: existingPayment } = await supabaseClient
          .from('payment_tracker')
          .select('id')
          .eq('user_id', debt.user_id)
          .eq('month_year', targetMonthStr)
          .eq('source_id', debt.id)
          .eq('payment_type', 'debt')
          .single()

        if (existingPayment) {
          console.log(`Payment already exists for debt ${debt.name} in ${targetMonthStr}`)
          continue
        }

        // Calculate payment date (payment_day of the target month)
        const paymentDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), debt.payment_day)
        const paymentDateStr = paymentDate.toISOString().split('T')[0]

        // Determine payment status based on current date
        let paymentStatus: 'pending' | 'paid' = 'pending'
        if (paymentDate <= today) {
          paymentStatus = 'pending' // Will be marked as paid when user actually pays
        }

        // Create payment tracker entry
        const { error: insertError } = await supabaseClient
          .from('payment_tracker')
          .insert({
            user_id: debt.user_id,
            month_year: targetMonthStr,
            payment_type: 'debt',
            source_id: debt.id,
            source_table: 'debts',
            amount: debt.minimum_payment,
            payment_status: paymentStatus,
            payment_date: paymentDateStr,
            notes: `Pago automático generado para ${debt.name}`
          })

        if (insertError) {
          console.error(`Error creating payment for debt ${debt.name}:`, insertError)
          continue
        }

        totalGenerated++
        console.log(`Created payment for debt ${debt.name} on ${paymentDateStr}`)
      }
    }

    console.log(`Successfully generated ${totalGenerated} payments`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${totalGenerated} automatic debt payments`,
        debtsProcessed: debts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error in auto-generate-debt-payments:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
