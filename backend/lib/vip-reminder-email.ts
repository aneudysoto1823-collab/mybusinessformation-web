// Email "Recordatorio de Cumplimiento" (VIP Compliance Reminder) — segundo
// tipo de campaña de /admin/campaigns, compañero de la carta B1
// (lib/campaign-email.ts). Inspirado en un email real de un competidor (US
// Filing Services) que el founder recibió: ofrece PRIMERO la Declaración
// Anual sola (presentación única, sin suscripción) y DESPUÉS, como upsell, el
// combo VIP (Agente Registrado + Declaración Anual, renovado automático cada
// año) — misma secuencia y mismo nivel de detalle/persuasión que el
// competidor.
//
// Copiado A PROPÓSITO sin 2 elementos del original (decisión founder
// 2026-09-11, mismo criterio que ya aplicó con DBA/ITIN/Foreign LLC en esta
// sesión — no prometer algo que no entregamos):
//   1. Ancla de descuento falsa ("$250/year instead of the regular $299") —
//      nunca mostramos un precio "regular" más alto en ningún otro lugar del
//      sitio; el combo siempre es $179 llano. Inventar un ancla más alta acá
//      sería mentir sobre el precio real.
//   2. Bullets vacíos ("Ongoing compliance monitoring", "Priority support")
//      sin ningún servicio real detrás. Se reemplazan por la misma promesa
//      concreta que ya usa /vip: monitoreamos el plazo y presentamos cada año,
//      con confirmación por email.
// El resto del copy SÍ imita de cerca la profundidad del competidor: la
// explicación de "cómo funciona" (por qué conviene presentar temprano) y la
// introducción con las dos opciones son adaptaciones directas de su email.
//
// Acento verde más claro (#16A34A, ajustado 2026-09-11 — el primer intento
// con #059669 salió "muy oscuro" a criterio del founder) para diferenciar
// visualmente esta campaña de la carta B1 (que sigue azul/navy) — el header
// se mantiene navy, igual que el resto del sitio.
import { CAMPAIGN_EMAIL_BASE_URL as BASE_URL, type CampaignCompany } from './campaign-email'

const GREEN = '#16A34A'
const GREEN_DARK = '#15803D'

export function buildVipReminderEmail(company: CampaignCompany, lang: 'en' | 'es') {
  const isEs = lang === 'es'

  const unsubscribeUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(company.email)}`
  const idParam = `id=${encodeURIComponent(company.document_id)}${isEs ? '&lang=es' : ''}`
  const arUrl = `${BASE_URL}/annual-report?${idParam}`
  const vipUrl = `${BASE_URL}/vip?${idParam}`

  // Florida exige la primera Declaración Anual el año SIGUIENTE al de
  // formación (vence el 1 de mayo). Si no hay fecha real, cae al texto
  // genérico sin mencionar un año inventado.
  const regYear = company.registration_date ? new Date(company.registration_date).getFullYear() : null
  const firstArYear = regYear && !isNaN(regYear) ? regYear + 1 : null

  const subject = firstArYear
    ? (isEs ? `Su Declaración Anual ${firstArYear} — ${company.company_name}` : `Your ${firstArYear} Annual Report — ${company.company_name}`)
    : (isEs ? `Su próxima Declaración Anual — ${company.company_name}` : `Your next Annual Report — ${company.company_name}`)

  const intro = firstArYear
    ? (isEs
        ? `Usted formó <strong>${company.company_name}</strong> en ${regYear} — lo que significa que ${firstArYear} trae su primera Declaración Anual ante el Estado de Florida. Hay dos formas de encargarse de esto, según cuánto quiera dejarlo resuelto.`
        : `You formed <strong>${company.company_name}</strong> in ${regYear} — which means ${firstArYear} brings your first Florida Annual Report requirement. There are two ways to take care of it, depending on how much you'd like to take off your plate.`)
    : (isEs
        ? `Toda LLC y Corporación de Florida debe presentar una Declaración Anual cada año para seguir activa ante el Estado. Hay dos formas de encargarse de esto, según cuánto quiera dejarlo resuelto.`
        : `Every Florida LLC and Corporation must file an Annual Report each year to stay active with the State. There are two ways to take care of it, depending on how much you'd like to take off your plate.`)

  const filingYearLabel = firstArYear ? String(firstArYear) : (isEs ? 'este año' : 'this year')

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Helvetica Neue',Arial,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F1F5F9;padding:32px 0">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%">

        <!-- Membrete (navy, igual que B1 y el resto del sitio) -->
        <tr>
          <td style="background:#1C2E44;border-radius:14px 14px 0 0;padding:22px 36px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
              <td>
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="width:42px">
                    <img src="https://mybusinessformation.com/fbfc-seal.png" width="42" height="42" alt="Florida Business Formation Center" style="display:block"/>
                  </td>
                  <td style="padding-left:12px">
                    <div style="color:#fff;font-size:15px;font-weight:700;font-family:Georgia,serif">Florida Business Formation Center</div>
                    <div style="color:rgba(255,255,255,.6);font-size:11px;letter-spacing:.5px">mybusinessformation.com</div>
                  </td>
                </tr></table>
              </td>
              <td align="right" style="color:rgba(255,255,255,.55);font-size:11px;text-transform:uppercase;letter-spacing:.5px">
                ${isEs ? 'Recordatorio de Cumplimiento' : 'Compliance Reminder'}
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="background:#fff;padding:32px 36px 8px">
            <p style="color:#1C2E44;font-size:15px;font-weight:700;margin:0 0 14px">
              ${isEs ? `Hola${company.owner_name ? ' ' + company.owner_name : ''},` : `Hello${company.owner_name ? ' ' + company.owner_name : ''},`}
            </p>
            <p style="color:#475569;font-size:13.5px;line-height:1.7;margin:0">${intro}</p>
          </td>
        </tr>

        <!-- Sección 1 — AR solo (presentación única) -->
        <tr>
          <td style="background:#fff;padding:20px 36px 6px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1.5px solid #E2E8F0;border-radius:12px">
              <tr>
                <td style="padding:24px 26px">
                  <div style="font-size:11px;font-weight:700;color:${GREEN_DARK};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">${isEs ? 'Opción 1 — Presentación Única' : 'Option 1 — One-Time Filing'}</div>
                  <div style="font-size:17px;font-weight:800;color:#1C2E44;font-family:Georgia,serif;margin-bottom:10px">${isEs ? `Presente ahora su Declaración Anual ${filingYearLabel}` : `File your ${filingYearLabel} Annual Report now`}</div>
                  <p style="color:#64748b;font-size:13px;line-height:1.65;margin:0 0 12px">
                    ${isEs
                      ? `¿Prefiere simplemente sacárselo de encima? Envíenos su información hoy y presentaremos su Declaración Anual ${filingYearLabel} apenas se abra el período de presentación de Florida — sin suscripción, sin nada que renovar.`
                      : `Want to simply get it out of the way? Give us your information today, and we'll file your ${filingYearLabel} Annual Report as soon as Florida opens its filing window — no subscription, nothing to renew.`}
                  </p>
                  <p style="color:#94A3B8;font-size:12px;line-height:1.6;margin:0 0 18px">
                    <strong style="color:#64748b">${isEs ? 'Cómo funciona: ' : 'How it works: '}</strong>${isEs
                      ? 'Florida no acepta la Declaración Anual antes del 1 de enero del año que corresponde presentar, así que dejamos su presentación en cola y la enviamos apenas se abra el período — mucho antes del plazo límite del 1 de mayo.'
                      : "Florida doesn't accept next year's Annual Report before January 1, so we queue your filing now and submit it the moment the window opens — well ahead of the May 1 deadline."}
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px">
                    <tr>
                      <td style="font-size:24px;font-weight:800;color:#1C2E44;font-family:Georgia,serif">$99</td>
                      <td align="right" style="font-size:11.5px;color:#94A3B8;vertical-align:bottom;padding-bottom:4px">${isEs ? '+ $139 tarifa estatal de Florida' : '+ $139 Florida state fee'}</td>
                    </tr>
                  </table>
                  <a href="${arUrl}" style="display:block;text-align:center;background:${GREEN};color:#fff;text-decoration:none;padding:13px 24px;border-radius:9px;font-weight:700;font-size:14.5px">${isEs ? 'Presentar mi Declaración Anual →' : 'File My Annual Report →'}</a>
                  <p style="text-align:center;font-size:11px;color:#94A3B8;margin:10px 0 0">${isEs ? 'Su información ya está pre-cargada — solo revise y confirme.' : 'Your information is pre-filled — just review and confirm.'}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Separador "Or" -->
        <tr>
          <td style="background:#fff;padding:18px 36px;text-align:center">
            <span style="display:inline-block;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px">${isEs ? 'O' : 'Or'}</span>
          </td>
        </tr>

        <!-- Sección 2 — Combo VIP -->
        <tr>
          <td style="background:#fff;padding:0 36px 6px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1.5px solid ${GREEN};border-radius:12px">
              <tr>
                <td style="padding:24px 26px">
                  <div style="font-size:11px;font-weight:700;color:${GREEN_DARK};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">${isEs ? 'Opción 2 — Paquete VIP de Cumplimiento' : 'Option 2 — VIP Compliance Package'}</div>
                  <div style="font-size:17px;font-weight:800;color:#1C2E44;font-family:Georgia,serif;margin-bottom:10px">${isEs ? 'O no vuelva a pensarlo, nunca más' : 'Or never think about it again'}</div>
                  <p style="color:#64748b;font-size:13px;line-height:1.65;margin:0 0 14px">
                    ${isEs
                      ? 'Si prefiere resolver esto una sola vez, el Paquete VIP incluye su Agente Registrado y su Declaración Anual juntos, renovados automáticamente cada año. Nosotros monitoreamos el plazo y presentamos por usted — recibe una confirmación por correo cada vez que se hace.'
                      : "If you'd rather solve this once, the VIP Package bundles your Registered Agent and Annual Report together, renewed automatically every year. We monitor the deadline and file it for you — you get an email confirmation each time it's done."}
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px">
                    <tr><td style="padding:0 0 6px;width:20px;vertical-align:top;color:${GREEN};font-weight:800;font-size:12.5px">&#10003;</td><td style="padding:0 0 6px;font-size:12.5px;color:#475569;line-height:1.6">${isEs ? '<strong style="color:#1C2E44">Agente Registrado</strong> — dirección oficial de Florida, renovada automáticamente.' : '<strong style="color:#1C2E44">Registered Agent</strong> — official Florida address, renewed automatically.'}</td></tr>
                    <tr><td style="padding:0 0 6px;width:20px;vertical-align:top;color:${GREEN};font-weight:800;font-size:12.5px">&#10003;</td><td style="padding:0 0 6px;font-size:12.5px;color:#475569;line-height:1.6">${isEs ? '<strong style="color:#1C2E44">Declaración Anual</strong> — presentada cada año antes del plazo, sin que usted tenga que recordarlo.' : '<strong style="color:#1C2E44">Annual Report</strong> — filed every year before the deadline, without you having to remember.'}</td></tr>
                    <tr><td style="width:20px;vertical-align:top;color:${GREEN};font-weight:800;font-size:12.5px">&#10003;</td><td style="font-size:12.5px;color:#475569;line-height:1.6">${isEs ? 'Confirmación por email cada vez que se presenta.' : "Email confirmation every time it's filed."}</td></tr>
                  </table>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px">
                    <tr>
                      <td style="font-size:24px;font-weight:800;color:#1C2E44;font-family:Georgia,serif">$179<span style="font-size:13px;font-weight:600;color:#64748b">${isEs ? '/año' : '/year'}</span></td>
                      <td align="right" style="font-size:11.5px;color:#94A3B8;vertical-align:bottom;padding-bottom:4px">${isEs ? '+ $139 tarifa estatal de Florida' : '+ $139 Florida state fee'}</td>
                    </tr>
                  </table>
                  <a href="${vipUrl}" style="display:block;text-align:center;background:${GREEN};color:#fff;text-decoration:none;padding:13px 24px;border-radius:9px;font-weight:700;font-size:14.5px">${isEs ? 'Obtener Paquete VIP →' : 'Get VIP Compliance Package →'}</a>
                  <p style="text-align:center;font-size:11px;color:#94A3B8;margin:10px 0 0">${isEs ? 'Cancele cuando quiera. Sin contrato a largo plazo.' : 'Cancel anytime. No long-term contract.'}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Contacto -->
        <tr>
          <td style="background:#fff;padding:22px 36px 6px;text-align:center">
            <div style="color:#64748b;font-size:12px">${isEs ? '¿Prefiere solo uno de los dos, o algo distinto? ' : 'Only need one of these, or something else? '}<a href="${BASE_URL}/servicios" style="color:#2563EB;text-decoration:none;font-weight:600">${isEs ? 'Ver todos los servicios' : 'Browse all services'}</a></div>
            <div style="color:#64748b;font-size:12px;margin-top:6px">${isEs ? '¿Preguntas? Escríbanos a ' : 'Questions? Email us at '}<a href="mailto:info@mybusinessformation.com" style="color:#2563EB;text-decoration:none;font-weight:600">info@mybusinessformation.com</a></div>
          </td>
        </tr>

        <!-- Aviso Importante -->
        <tr>
          <td style="background:#fff;padding:18px 36px 26px">
            <div style="border-top:1px solid #eef2f7;padding-top:16px">
              <div style="color:#1C2E44;font-size:11px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">${isEs ? 'Aviso Importante' : 'Important Disclosure'}</div>
              <p style="color:#94A3B8;font-size:10.5px;line-height:1.7;margin:0">
                ${isEs
                  ? 'Florida Business Formation Center es un servicio profesional de preparación y presentación de documentos. No somos un bufete de abogados y no brindamos asesoría legal, fiscal ni financiera. Nuestros servicios no constituyen el ejercicio de la abogacía ni crean una relación abogado-cliente. Todas las presentaciones están sujetas a la aprobación de la División de Corporaciones de Florida. Este aviso no es una factura ni una solicitud de pago. Los servicios descritos son opcionales.'
                  : 'Florida Business Formation Center is a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations. This notice is not a bill, invoice, or demand for payment. The services described are optional.'}
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;border-radius:0 0 14px 14px;padding:18px 36px;text-align:center">
            <p style="color:#94A3B8;font-size:11px;line-height:1.6;margin:0 0 6px"><strong>Florida Business Formation Center</strong> · mybusinessformation.com<br/>3700 SW 27th St, Suite D104, Gainesville, FL 32608<br/>info@mybusinessformation.com</p>
            <p style="color:#CBD5E1;font-size:10px;line-height:1.6;margin:0">${isEs ? 'Recibió este correo porque su empresa figura en los registros públicos de Florida. ' : 'You received this email because your company appears in Florida public records. '}<a href="${unsubscribeUrl}" style="color:#94A3B8;text-decoration:underline">${isEs ? 'Cancelar suscripción' : 'Unsubscribe'}</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}
