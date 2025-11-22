import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Weekly Feedback Report Edge Function
 * Compiles last 7 days of feedback and sends summary email
 * Designed to be called by cron job
 */
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting weekly feedback report generation...");

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get feedback data from request body
    const { feedbacks } = await req.json();
    
    if (!feedbacks || feedbacks.length === 0) {
      console.log("No feedback to report");
      return new Response(
        JSON.stringify({ message: "No feedback for this week" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate feedback data
    if (!Array.isArray(feedbacks)) {
      console.error("Invalid feedback format");
      return new Response(
        JSON.stringify({ error: "Invalid feedback format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get date range for the week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter feedbacks from last 7 days with validation
    const recentFeedbacks = feedbacks.filter((f: any) => {
      if (!f.timestamp || !f.text) return false;
      const feedbackDate = new Date(f.timestamp);
      return feedbackDate >= weekAgo && feedbackDate <= now;
    });

    if (recentFeedbacks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No recent feedback" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate email content with sanitized data
    const weekOf = `${weekAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;
    const feedbackList = recentFeedbacks
      .slice(0, 100) // Limit to 100 items max
      .map((f: any, index: number) => {
        const text = String(f.text).substring(0, 500); // Limit text length
        return `${index + 1}. ${new Date(f.timestamp).toLocaleString()}\n   ${text}`;
      })
      .join('\n\n');

    const emailHtml = `
      <h1>Weekly Feedback Summary</h1>
      <h2>Week of ${weekOf}</h2>
      <p><strong>Total Feedback Received:</strong> ${recentFeedbacks.length}</p>
      <hr />
      <h3>Feedback Details:</h3>
      <pre style="white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px;">
${feedbackList}
      </pre>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Budget Planner <onboarding@resend.dev>",
      to: ["cbracamont@gmail.com"],
      subject: `Weekly Feedback Summary - Week of ${weekOf}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        feedbackCount: recentFeedbacks.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in weekly-feedback-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
