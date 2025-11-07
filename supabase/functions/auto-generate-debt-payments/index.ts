import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Debt {
  id: string
  user_id: string
  profile_id: string | null
  name: string
  balance: number
  minimum_payment: number
  payment_day: number
  is_installment?: boolean | null
  start_date?: string | null
  end_date?: string | null
  installment_amount?: number | null
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

    // Generate payments for 3 months before and 6 months after current month
    const monthsToGenerate = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6]
    let totalGenerated = 0

    for (const monthOffset of monthsToGenerate) {
      const targetMonth = new Date(currentMonth)
      targetMonth.setMonth(targetMonth.getMonth() + monthOffset)
      const targetMonthStr = targetMonth.toISOString().split('T')[0]

      console.log(`Generating payments for month: ${targetMonthStr}`)

      for (const debt of debts as Debt[]) {
        // Respect schedule limits (start_date / end_date) when provided
        const targetMonthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1)
        const startMonthStart = debt.start_date
          ? new Date(new Date(debt.start_date).getFullYear(), new Date(debt.start_date).getMonth(), 1)
          : null
        const endMonthStart = debt.end_date
          ? new Date(new Date(debt.end_date).getFullYear(), new Date(debt.end_date).getMonth(), 1)
          : null

        if (startMonthStart && targetMonthStart < startMonthStart) {
          console.log(`Skipping ${debt.name} for ${targetMonthStr} (before start_date ${debt.start_date})`)
          continue
        }
        if (endMonthStart && targetMonthStart > endMonthStart) {
          console.log(`Skipping ${debt.name} for ${targetMonthStr} (after end_date ${debt.end_date})`)
          continue
        }

        // Build query to check for existing payment
        let existingQuery = supabaseClient
          .from('payment_tracker')
          .select('id')
          .eq('user_id', debt.user_id)
          .eq('month_year', targetMonthStr)
          .eq('source_id', debt.id)
          .eq('payment_type', 'debt')

        // Add profile_id filter if debt has a profile
        if (debt.profile_id) {
          existingQuery = existingQuery.eq('profile_id', debt.profile_id)
        } else {
          existingQuery = existingQuery.is('profile_id', null)
        }

        const { data: existingPayment, error: existingError } = await existingQuery.maybeSingle()
        if (existingError && existingError.code !== 'PGRST116') {
          console.error(`Error checking existing payment for ${debt.name}:`, existingError)
        }

        if (existingPayment) {
          console.log(`Payment already exists for debt ${debt.name} in ${targetMonthStr}`)
          continue
        }

        // Calculate payment date (clamped to valid day in month)
        const lastDayOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate()
        const day = Math.min(Math.max(1, debt.payment_day), lastDayOfMonth)
        const paymentDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day)
        const paymentDateStr = paymentDate.toISOString().split('T')[0]

        // Determine payment status based on current date
        let paymentStatus: 'pending' | 'paid' = 'pending'
        if (paymentDate <= today) {
          paymentStatus = 'pending' // Will be marked as paid when user actually pays
        }

        // Choose amount based on schedule when applicable
        const amount = (debt.is_installment && debt.installment_amount) ? debt.installment_amount : debt.minimum_payment

        // Create payment tracker entry
        const { error: insertError } = await supabaseClient
          .from('payment_tracker')
          .insert({
            user_id: debt.user_id,
            profile_id: debt.profile_id,
            month_year: targetMonthStr,
            payment_type: 'debt',
            source_id: debt.id,
            source_table: 'debts',
            amount,
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
