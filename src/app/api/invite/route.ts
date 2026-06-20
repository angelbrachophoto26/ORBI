import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { inviteId, projectName, ownerEmail, collaboratorEmail } = await req.json();

    const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/invite/accept?id=${inviteId}`;

    await resend.emails.send({
      from: "Orbi <onboarding@resend.dev>",
      to: collaboratorEmail,
      subject: `${ownerEmail} te invitó a colaborar en "${projectName}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
            <div style="background: #059669; border-radius: 10px; padding: 8px; display: inline-block;">
              <span style="color: white; font-size: 20px;">⊙</span>
            </div>
            <span style="font-size: 20px; font-weight: bold; color: white;">Orbi</span>
          </div>

          <h2 style="color: white; font-size: 18px; margin: 0 0 8px;">Te invitaron a colaborar</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
            <strong style="color: #e2e8f0;">${ownerEmail}</strong> te invitó a colaborar en el proyecto
            <strong style="color: #e2e8f0;">"${projectName}"</strong> en Orbi — Marketing Intelligence.
          </p>

          <a href="${acceptUrl}" style="display: inline-block; background: #059669; color: white; font-weight: 600; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-decoration: none;">
            Aceptar invitación →
          </a>

          <p style="color: #475569; font-size: 12px; margin-top: 32px;">
            Si no esperabas esta invitación, puedes ignorar este email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("invite error:", err);
    return NextResponse.json({ error: "Error enviando invitación" }, { status: 500 });
  }
}
