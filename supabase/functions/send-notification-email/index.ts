import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  email: string;
  title: string;
  message: string;
  type: string;
  dueDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, title, message, type, dueDate }: NotificationEmailRequest = await req.json();

    console.log("Sending notification email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Family Budget UK <onboarding@resend.dev>",
      to: [email],
      subject: `Family Budget UK - ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .notification-type {
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 15px;
              }
              .type-warning { background: #fef3c7; color: #92400e; }
              .type-info { background: #dbeafe; color: #1e40af; }
              .type-alert { background: #fee2e2; color: #991b1b; }
              .type-success { background: #d1fae5; color: #065f46; }
              .message {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #667eea;
              }
              .due-date {
                background: #fff7ed;
                padding: 15px;
                border-radius: 8px;
                margin-top: 20px;
                border-left: 4px solid #f59e0b;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
              }
              .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">📊 Family Budget UK</h1>
            </div>
            <div class="content">
              <span class="notification-type type-${type}">${type}</span>
              <h2 style="color: #1f2937; margin-top: 10px;">${title}</h2>
              
              <div class="message">
                <p style="margin: 0;">${message}</p>
              </div>
              
              ${dueDate ? `
                <div class="due-date">
                  <strong>📅 Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              ` : ''}
              
              <a href="${Deno.env.get('VITE_SUPABASE_URL') || 'https://lovable.app'}" class="button">
                View in App
              </a>
              
              <div class="footer">
                <p>This is an automated notification from your Family Budget UK app.</p>
                <p>You're receiving this because you have notifications enabled for your account.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
