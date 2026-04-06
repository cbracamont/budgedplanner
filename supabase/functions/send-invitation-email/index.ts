import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { recipientEmail, invitationCode, role, senderEmail, language = "en" } = await req.json();

    if (!recipientEmail || !invitationCode) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

    const roleLabels: Record<string, Record<string, string>> = {
      en: { viewer: "Viewer", contributor: "Contributor", editor: "Editor", owner: "Owner" },
      es: { viewer: "Observador", contributor: "Colaborador", editor: "Editor", owner: "Propietario" },
      pt: { viewer: "Visualizador", contributor: "Colaborador", editor: "Editor", owner: "Proprietário" },
    };

    const texts: Record<string, Record<string, string>> = {
      en: {
        subject: "You've been invited to a Family Budget Planner household",
        title: "Household Invitation",
        greeting: `${senderEmail || "Someone"} has invited you to join their household on Family Budget Planner.`,
        roleText: `Your role will be: <strong>${roleLabels[language]?.[role] || role}</strong>`,
        codeLabel: "Your invitation code:",
        instructions: "To accept this invitation, log in to Family Budget Planner, go to Settings → Invitations, and enter the code above. Or share this code to join.",
        expires: "This invitation expires in 7 days.",
        footer: "Family Budget Planner — Smart household budgeting",
      },
      es: {
        subject: "Te han invitado a un hogar en Family Budget Planner",
        title: "Invitación al Hogar",
        greeting: `${senderEmail || "Alguien"} te ha invitado a unirte a su hogar en Family Budget Planner.`,
        roleText: `Tu rol será: <strong>${roleLabels[language]?.[role] || role}</strong>`,
        codeLabel: "Tu código de invitación:",
        instructions: "Para aceptar esta invitación, inicia sesión en Family Budget Planner, ve a Configuración → Invitaciones e ingresa el código anterior.",
        expires: "Esta invitación expira en 7 días.",
        footer: "Family Budget Planner — Presupuesto inteligente para el hogar",
      },
      pt: {
        subject: "Você foi convidado para um lar no Family Budget Planner",
        title: "Convite para o Lar",
        greeting: `${senderEmail || "Alguém"} convidou você para participar do lar no Family Budget Planner.`,
        roleText: `Seu papel será: <strong>${roleLabels[language]?.[role] || role}</strong>`,
        codeLabel: "Seu código de convite:",
        instructions: "Para aceitar este convite, faça login no Family Budget Planner, vá para Configurações → Convites e insira o código acima.",
        expires: "Este convite expira em 7 dias.",
        footer: "Family Budget Planner — Orçamento inteligente para o lar",
      },
    };

    const t = texts[language] || texts.en;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">${t.title}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">${t.greeting}</p>
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px;">${t.roleText}</p>
          <p style="color:#666;font-size:14px;margin:0 0 8px;">${t.codeLabel}</p>
          <div style="background:#f0f0ff;border:2px dashed #6366f1;border-radius:8px;padding:16px;text-align:center;margin:0 0 24px;">
            <code style="font-size:28px;font-weight:bold;color:#6366f1;letter-spacing:4px;">${invitationCode}</code>
          </div>
          <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 16px;">${t.instructions}</p>
          <p style="color:#999;font-size:12px;margin:0;">${t.expires}</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #eee;">
          <p style="color:#999;font-size:12px;margin:0;">${t.footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    let emailResponse;

    if (LOVABLE_API_KEY) {
      // Use connector gateway
      emailResponse = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "Family Budget Planner <onboarding@resend.dev>",
          to: [recipientEmail],
          subject: t.subject,
          html: htmlContent,
        }),
      });
    } else {
      // Direct Resend API
      emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Family Budget Planner <onboarding@resend.dev>",
          to: [recipientEmail],
          subject: t.subject,
          html: htmlContent,
        }),
      });
    }

    const result = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Email send failed:", result);
      return new Response(JSON.stringify({ error: "Failed to send email", details: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-invitation-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
