import { Resend } from 'resend'

// Lazy init: se crea al primer uso, cuando dotenv ya cargó el .env
const getResend = () => new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'onboarding@resend.dev'
const INTERNAL_EMAIL = 'aneurysoto@gmail.com'

// ── 1. Confirmación al cliente cuando su orden es recibida ───────────────────
export const sendOrderConfirmation = async (order: {
  firstName: string
  lastName: string
  email: string
  companyName: string
  package: string
  id: string
}) => {
  await getResend().emails.send({
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
            <p style="margin:6px 0;font-size:14px"><strong>Confirmation Number:</strong> FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}</p>
          </div>
          <div style="text-align:center;margin:28px 0">
            <a href="https://mybusinessformation-web.vercel.app/client-portal?email=${encodeURIComponent(order.email)}&order=FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}"
               style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.2px">
              Track Your Order →
            </a>
            <p style="color:#94a3b8;font-size:12px;margin-top:10px">
              View your order status in real time at any time
            </p>
          </div>
          <p style="color:#475569;line-height:1.7">
            Our team is now reviewing your information and will verify name availability with the
            Florida Division of Corporations. We'll be in touch within <strong>1 business day</strong>.
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

// ── 2. Todos los nombres tomados — avisa al cliente Y alerta al admin ────────
//    Este función envía 2 emails en paralelo:
//      - Al cliente: pide 3 nuevas opciones
//      - Al admin:   alerta roja para contactar al cliente
export const sendAllNamesTaken = async (order: {
  firstName: string
  lastName: string
  email: string
  names: [string, string, string]
  id: string
}) => {
  await Promise.all([
    // Email al cliente
    getResend().emails.send({
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
              We checked the <strong>Florida Division of Corporations</strong> and unfortunately all three
              company names you submitted are already registered:
            </p>
            <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:20px 0">
              <p style="margin:6px 0;font-size:14px;color:#92400e">❌ &nbsp;<strong>${order.names[0]}</strong> — already taken</p>
              <p style="margin:6px 0;font-size:14px;color:#92400e">❌ &nbsp;<strong>${order.names[1]}</strong> — already taken</p>
              <p style="margin:6px 0;font-size:14px;color:#92400e">❌ &nbsp;<strong>${order.names[2]}</strong> — already taken</p>
            </div>
            <p style="color:#475569;line-height:1.7">
              Please contact us as soon as possible so we can help you choose new available names for your business.
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;font-size:14px">
              <strong>Order:</strong> ${order.id}
            </div>
            <p style="color:#475569;line-height:1.7">
              Need help choosing a name?
              <a href="https://wa.me/1XXXXXXXXXX" style="color:#059669">Chat with us on WhatsApp</a>
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
    getResend().emails.send({
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
              Los 3 nombres propuestos están registrados en Sunbiz.
              <strong>Contactar al cliente para solicitar nuevas opciones.</strong>
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr>
                <td style="padding:8px 0;color:#64748b;width:40%">Order ID</td>
                <td style="padding:8px 0;font-weight:600">${order.id}</td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:8px 4px;color:#64748b">Cliente</td>
                <td style="padding:8px 4px;font-weight:600">${order.firstName} ${order.lastName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b">Email</td>
                <td style="padding:8px 0">
                  <a href="mailto:${order.email}" style="color:#059669">${order.email}</a>
                </td>
              </tr>
            </table>
            <div style="margin-top:20px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;font-size:14px">
              <p style="margin:4px 0;color:#991b1b;font-weight:600">Nombres rechazados:</p>
              <p style="margin:6px 0;color:#991b1b">❌ ${order.names[0]}</p>
              <p style="margin:6px 0;color:#991b1b">❌ ${order.names[1]}</p>
              <p style="margin:6px 0;color:#991b1b">❌ ${order.names[2]}</p>
            </div>
            <div style="margin-top:16px;padding:14px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1e40af">
              Ya se envió email automático al cliente pidiendo nuevas opciones.
              Hacer seguimiento si no responde en 24 horas.
            </div>
          </div>
        </div>
      `
    })
  ])
}

// ── 3. Nombres sugeridos disponibles — el equipo encontró alternativas ───────
export const sendSuggestNames = async (order: {
  firstName: string
  email: string
  companyName: string
  id: string
}, availableNames: string[]) => {
  const nameList = availableNames
    .map(n => `<li style="margin:8px 0;font-size:14px;color:#166534"><strong>✅ ${n}</strong></li>`)
    .join('')

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: order.email,
    subject: `✅ Good news! We found available names for your business`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:22px;margin:0">Florida Business Formation Center</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#1C2E44;font-size:20px">Hi ${order.firstName}, we found available names! 🎉</h2>
          <p style="color:#475569;line-height:1.7">
            Our team searched the Florida Division of Corporations database and found the following
            names that are <strong>currently available</strong> for registration:
          </p>
          <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:20px;margin:20px 0">
            <p style="color:#166534;font-weight:700;margin:0 0 10px;font-size:14px">Available names:</p>
            <ul style="margin:0;padding-left:20px">
              ${nameList}
            </ul>
          </div>
          <p style="color:#475569;line-height:1.7">
            Please <strong>reply to this email</strong> and let us know which name you'd like to use
            for your business. Once we hear back from you, we'll move forward with the registration
            right away.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;font-size:14px">
            <strong>Your original company name:</strong> ${order.companyName}<br/>
            <strong>Order:</strong> ${order.id}
          </div>
          <p style="color:#475569;line-height:1.7">
            If you have questions or need help deciding,
            <a href="https://wa.me/1XXXXXXXXXX" style="color:#059669">chat with us on WhatsApp</a>.
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

// ── 4. Certificate of Formation — entrega final al cliente ───────────────────
export const sendCertificateDelivery = async (order: {
  firstName: string
  email: string
  companyName: string
  id: string
}) => {
  await getResend().emails.send({
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
            <strong>${order.companyName}</strong> is now an officially registered business entity
            in the State of Florida.
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
            Florida Business Formation Center · mybusinessformation.com<br/>
            Order ID: ${order.id}
          </p>
        </div>
      </div>
    `
  })
}
