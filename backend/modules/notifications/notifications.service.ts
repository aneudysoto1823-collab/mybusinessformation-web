import { Resend } from 'resend'

const resend = new Resend('re_Ff49asDD_MzA5uWD7ZihUmWFPxJmKpzXB')

const FROM_EMAIL = 'onboarding@resend.dev'
const INTERNAL_EMAIL = 'aneurysoto@gmail.com'

// ── 1. Confirmación al cliente cuando su orden es recibida ──────────────────
export const sendOrderConfirmation = async (order: {
  firstName: string
  lastName: string
  email: string
  companyName: string
  package: string
  id: string
}) => {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.email,
    subject: `✅ We received your order — ${order.companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:22px;margin:0">Florida Business Formation Center</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#1C2E44;font-size:20px">Hi ${order.firstName}, we got your order! 🎉</h2>
          <p style="color:#475569;line-height:1.7">
            Thank you for choosing Florida Business Formation Center. Here's a summary of your order:
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
            <p style="margin:6px 0;font-size:14px"><strong>Company Name:</strong> ${order.companyName}</p>
            <p style="margin:6px 0;font-size:14px"><strong>Package:</strong> ${order.package}</p>
            <p style="margin:6px 0;font-size:14px"><strong>Order Number:</strong> ${order.id}</p>
          </div>
          <p style="color:#475569;line-height:1.7">
            Our team is now reviewing your information. We'll contact you within <strong>1 business day</strong>
            to confirm name availability and next steps.
          </p>
          <p style="color:#475569;line-height:1.7">
            Questions? Reach us on <a href="https://wa.me/1XXXXXXXXXX" style="color:#059669">WhatsApp</a> or
            reply to this email.
          </p>
          <p style="margin-top:32px;color:#94a3b8;font-size:12px">
            Florida Business Formation Center · mybusinessformation.com<br/>
            This is a transactional email. We are a document preparation service, not a law firm.
          </p>
        </div>
      </div>
    `
  })
}

// ── 2. Alerta interna cuando llega una orden nueva ──────────────────────────
export const sendInternalAlert = async (order: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  companyName: string
  package: string
  amount: number
  id: string
}) => {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: INTERNAL_EMAIL,
    subject: `🔔 Nueva orden — ${order.companyName} (${order.package})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#059669;padding:20px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:20px;margin:0">🔔 Nueva Orden Recibida</h1>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#64748b;width:40%">Order ID</td><td style="padding:8px 0;font-weight:600">${order.id}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:8px 4px;color:#64748b">Cliente</td><td style="padding:8px 4px;font-weight:600">${order.firstName} ${order.lastName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0">${order.email}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:8px 4px;color:#64748b">Teléfono</td><td style="padding:8px 4px">${order.phone || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Empresa</td><td style="padding:8px 0;font-weight:600">${order.companyName}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:8px 4px;color:#64748b">Paquete</td><td style="padding:8px 4px;font-weight:600">${order.package}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Monto</td><td style="padding:8px 0;font-weight:600;color:#059669">$${order.amount}</td></tr>
          </table>
          <div style="margin-top:24px;padding:14px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1e40af">
            Revisa la orden en el panel y actualiza su estado cuando proceda.
          </div>
        </div>
      </div>
    `
  })
}

// ── 3. Actualización de estado al cliente ───────────────────────────────────
export const sendStatusUpdate = async (order: {
  firstName: string
  email: string
  companyName: string
  id: string
  status: string
}) => {
  const statusMessages: Record<string, { subject: string; body: string }> = {
    in_review: {
      subject: `📋 Your order is under review — ${order.companyName}`,
      body: 'Our team is reviewing your documents and verifying name availability with the Florida Division of Corporations.'
    },
    filed: {
      subject: `📤 Filed with the State of Florida — ${order.companyName}`,
      body: 'Great news! We have submitted your formation documents to the Florida Division of Corporations. Standard processing takes 7–10 business days.'
    },
    approved: {
      subject: `🎉 Your business is officially formed! — ${order.companyName}`,
      body: 'Your business has been officially approved by the State of Florida! Your Certificate of Formation will be delivered shortly.'
    },
    completed: {
      subject: `✅ Order complete — ${order.companyName}`,
      body: 'Your order is fully complete. All documents have been delivered. Welcome to the world of business!'
    }
  }

  const msg = statusMessages[order.status] || {
    subject: `Update on your order — ${order.companyName}`,
    body: `Your order status has been updated to: ${order.status}.`
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.email,
    subject: msg.subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:22px;margin:0">Florida Business Formation Center</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#1C2E44;font-size:18px">Hi ${order.firstName},</h2>
          <p style="color:#475569;line-height:1.7">${msg.body}</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;font-size:14px">
            <strong>Company:</strong> ${order.companyName}<br/>
            <strong>Order:</strong> ${order.id}
          </div>
          <p style="color:#475569;line-height:1.7">
            Questions? <a href="https://wa.me/1XXXXXXXXXX" style="color:#059669">Chat with us on WhatsApp</a>
          </p>
          <p style="margin-top:32px;color:#94a3b8;font-size:12px">
            Florida Business Formation Center · mybusinessformation.com
          </p>
        </div>
      </div>
    `
  })
}

// ── 4. Todos los nombres tomados — avisa al cliente y alerta al admin ────────
export const sendAllNamesTaken = async (order: {
  firstName: string
  lastName: string
  email: string
  names: [string, string, string]
  id: string
}) => {
  await Promise.all([
    // Email al cliente
    resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `⚠️ Action required — all 3 name options are taken`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
            <h1 style="color:#fff;font-size:22px;margin:0">Florida Business Formation Center</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <h2 style="color:#b45309;font-size:20px">Hi ${order.firstName}, we need your help ⚠️</h2>
            <p style="color:#475569;line-height:1.7">
              We checked the <strong>Florida Division of Corporations</strong> and unfortunately all three company
              names you submitted are already registered:
            </p>
            <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:20px 0">
              <p style="margin:6px 0;font-size:14px;color:#92400e">❌ &nbsp;<strong>${order.names[0]}</strong> — already taken</p>
              <p style="margin:6px 0;font-size:14px;color:#92400e">❌ &nbsp;<strong>${order.names[1]}</strong> — already taken</p>
              <p style="margin:6px 0;font-size:14px;color:#92400e">❌ &nbsp;<strong>${order.names[2]}</strong> — already taken</p>
            </div>
            <p style="color:#475569;line-height:1.7">
              Please reply to this email with <strong>3 new name options</strong> as soon as possible so we can
              continue processing your order. You can verify name availability yourself at
              <a href="https://search.sunbiz.org" style="color:#059669">search.sunbiz.org</a>.
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;font-size:14px">
              <strong>Order:</strong> ${order.id}
            </div>
            <p style="color:#475569;line-height:1.7">
              Need help choosing a name? <a href="https://wa.me/1XXXXXXXXXX" style="color:#059669">Chat with us on WhatsApp</a>
            </p>
            <p style="margin-top:32px;color:#94a3b8;font-size:12px">
              Florida Business Formation Center · mybusinessformation.com<br/>
              This is a transactional email. We are a document preparation service, not a law firm.
            </p>
          </div>
        </div>
      `
    }),
    // Alerta interna al admin
    resend.emails.send({
      from: FROM_EMAIL,
      to: INTERNAL_EMAIL,
      subject: `🚨 Nombres tomados — contactar cliente (Orden ${order.id})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#b91c1c;padding:20px 32px;border-radius:10px 10px 0 0">
            <h1 style="color:#fff;font-size:20px;margin:0">🚨 Nombres Tomados — Acción Requerida</h1>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <p style="color:#1e293b;font-size:15px;margin:0 0 20px">
              Los 3 nombres propuestos por el cliente ya están registrados en Sunbiz.
              <strong>Contactar al cliente para solicitar nuevas opciones.</strong>
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#64748b;width:40%">Order ID</td><td style="padding:8px 0;font-weight:600">${order.id}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 4px;color:#64748b">Cliente</td><td style="padding:8px 4px;font-weight:600">${order.firstName} ${order.lastName}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Email cliente</td><td style="padding:8px 0"><a href="mailto:${order.email}" style="color:#059669">${order.email}</a></td></tr>
            </table>
            <div style="margin-top:20px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;font-size:14px">
              <p style="margin:4px 0;color:#991b1b">❌ ${order.names[0]}</p>
              <p style="margin:4px 0;color:#991b1b">❌ ${order.names[1]}</p>
              <p style="margin:4px 0;color:#991b1b">❌ ${order.names[2]}</p>
            </div>
            <div style="margin-top:20px;padding:14px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1e40af">
              Ya se envió email automático al cliente pidiendo nuevas opciones. Hacer seguimiento si no responde en 24h.
            </div>
          </div>
        </div>
      `
    })
  ])
}

// ── 5. Entrega del Certificate of Formation ─────────────────────────────────
export const sendCertificateDelivery = async (order: {
  firstName: string
  email: string
  companyName: string
  id: string
}) => {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.email,
    subject: `🏆 Your Certificate of Formation is ready — ${order.companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:22px;margin:0">Florida Business Formation Center</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#059669;font-size:22px;text-align:center">🎉 Congratulations, ${order.firstName}!</h2>
          <p style="color:#475569;line-height:1.7;text-align:center">
            <strong>${order.companyName}</strong> is now an officially registered business entity in the State of Florida.
          </p>
          <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:20px;margin:24px 0;text-align:center">
            <p style="color:#166534;font-weight:600;margin:0 0 8px">Your Certificate of Formation</p>
            <p style="color:#166534;font-size:13px;margin:0">
              Your official document is attached to this email. Keep it in a safe place —
              you will need it to open your business bank account.
            </p>
          </div>
          <h3 style="color:#1C2E44;font-size:16px">What's next?</h3>
          <ul style="color:#475569;line-height:2;padding-left:20px">
            <li>Open your <strong>business bank account</strong> using your Certificate + EIN</li>
            <li>Set up your <strong>accounting software</strong> (QuickBooks, Wave)</li>
            <li>File your <strong>Annual Report</strong> each year before May 1st</li>
          </ul>
          <p style="color:#475569;line-height:1.7">
            Thank you for trusting us with your business formation. We wish you great success!
          </p>
          <p style="margin-top:32px;color:#94a3b8;font-size:12px">
            Florida Business Formation Center · mybusinessformation.com
          </p>
        </div>
      </div>
    `
  })
}
