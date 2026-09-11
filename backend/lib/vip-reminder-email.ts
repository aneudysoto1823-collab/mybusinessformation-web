// Email "Recordatorio de Cumplimiento" (VIP Compliance Reminder) — segundo
// tipo de campaña de /admin/campaigns, compañero de la carta B1
// (lib/campaign-email.ts). Solo va a empresas RECIÉN formadas (siempre hay
// registration_date real), inspirado en un email real de un competidor (US
// Filing Services) que el founder recibió pero reescrito con voz propia
// (2026-09-11) — no es una traducción del original, solo se tomó la idea de
// ofrecer primero la Declaración Anual sola y después, como upsell, el combo
// VIP (Agente Registrado + Declaración Anual, renovado automático).
//
// Decisiones de copy tomadas con el founder en esta sesión:
//   1. Sin ancla de descuento falsa ni bullets vacíos ("Ongoing compliance
//      monitoring", "Priority support") — mismo criterio que ya aplicó con
//      DBA/ITIN/Foreign LLC: no prometer nada que no entregamos.
//   2. La Opción 1 NO le pide datos al cliente (ya los tenemos pre-cargados)
//      ni menciona que Florida recién abre el período el 1 de enero — decirlo
//      de entrada le da al cliente una excusa para posponer ("no lo necesito
//      todavía"). Esa explicación del mecanismo de cola queda para un email
//      de confirmación POST-pago (pendiente, no forma parte de este envío).
//   3. Sin guion largo (—) en ningún párrafo — ver memoria
//      feedback_writing_style. Se usa punto medio (·) donde antes iría un
//      guion como separador corto (subject, etiquetas de sección).
//
// Acento verde #7BBB5D (ajustado dos veces 2026-09-11: primero #059669 salió
// "muy oscuro", después #16A34A tampoco era el tono correcto) para
// diferenciar esta campaña de la carta B1 (que sigue azul/navy) — el header
// se mantiene navy, igual que el resto del sitio.
import { CAMPAIGN_EMAIL_BASE_URL as BASE_URL, type CampaignCompany } from './campaign-email'

// #7BBB5D pedido por el founder (2026-09-11, "el verde que ellos usan") para
// botones/bordes/checkmarks. GREEN_DARK es una variante más oscura del mismo
// tono, solo para las etiquetas de sección en mayúscula (texto chico sobre
// blanco necesita más contraste que un botón grande).
const GREEN = '#7BBB5D'
const GREEN_DARK = '#4C7A38'

export function buildVipReminderEmail(company: CampaignCompany, lang: 'en' | 'es') {
  const isEs = lang === 'es'

  const unsubscribeUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(company.email)}`
  const idParam = `id=${encodeURIComponent(company.document_id)}${isEs ? '&lang=es' : ''}`
  const arUrl = `${BASE_URL}/annual-report?${idParam}`
  const vipUrl = `${BASE_URL}/vip?${idParam}`

  // Florida exige la primera Declaración Anual el año SIGUIENTE al de
  // formación (vence el 1 de mayo). El negocio confirma que esta campaña
  // solo se manda a empresas con registration_date real — el fallback acá es
  // solo defensivo (la columna es nullable en la DB), no un contenido
  // pensado a propósito.
  const regYear = company.registration_date ? new Date(company.registration_date).getFullYear() : null
  const firstArYear = regYear && !isNaN(regYear) ? regYear + 1 : null
  const filingYearLabel = firstArYear ? String(firstArYear) : (isEs ? 'próxima' : 'upcoming')

  const subject = isEs
    ? `Su Declaración Anual ${filingYearLabel} · ${company.company_name}`
    : `Your ${filingYearLabel} Annual Report · ${company.company_name}`

  const introParas = firstArYear
    ? (isEs
        ? [
            `Felicitaciones por haber formado <strong>${company.company_name}</strong> en Florida en ${regYear}. A medida que su negocio crece, mantenerse en regla ante el Estado importa tanto como lo fue empezar.`,
            `Toda LLC y Corporación de Florida debe presentar una Declaración Anual cada año para seguir activa en los registros del Estado. No presentarla puede generar cargos por atraso, y si se deja de presentar por suficiente tiempo, el Estado puede disolver la empresa administrativamente. ${filingYearLabel} es cuando esto le aplica por primera vez a ${company.company_name}.`,
            `Para su tranquilidad y evitar contratiempos, le ofrecemos dos formas de resolver esto:`,
          ]
        : [
            `Congratulations on forming <strong>${company.company_name}</strong> in Florida in ${regYear}. As your business grows, staying in good standing with the State matters just as much as getting started did.`,
            `Every Florida LLC and Corporation is required to file an Annual Report each year to remain active on the State's records. Missing it can lead to late fees, and if it goes unfiled long enough, the State can administratively dissolve the company. ${filingYearLabel} is when this first applies to ${company.company_name}.`,
            `For your peace of mind and to avoid any setbacks, we offer two ways to take care of it:`,
          ])
    : (isEs
        ? [
            `Felicitaciones por haber formado <strong>${company.company_name}</strong> en Florida.`,
            `Toda LLC y Corporación de Florida debe presentar una Declaración Anual cada año para seguir activa en los registros del Estado.`,
            `Para su tranquilidad y evitar contratiempos, le ofrecemos dos formas de resolver esto:`,
          ]
        : [
            `Congratulations on forming <strong>${company.company_name}</strong> in Florida.`,
            `Every Florida LLC and Corporation is required to file an Annual Report each year to remain active on the State's records.`,
            `For your peace of mind and to avoid any setbacks, we offer two ways to take care of it:`,
          ])

  const introHtml = introParas.map(p => `<p style="color:#475569;font-size:13.5px;line-height:1.7;margin:0 0 12px">${p}</p>`).join('')

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
            ${introHtml}
          </td>
        </tr>

        <!-- Sección 1 — AR solo (presentación única) -->
        <tr>
          <td style="background:#fff;padding:8px 36px 6px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1.5px solid #E2E8F0;border-radius:12px">
              <tr>
                <td style="padding:24px 26px">
                  <div style="font-size:11px;font-weight:700;color:${GREEN_DARK};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">${isEs ? 'Opción 1 · Presentación Única' : 'Option 1 · One-Time Filing'}</div>
                  <div style="font-size:17px;font-weight:800;color:#1C2E44;font-family:Georgia,serif;margin-bottom:10px">${isEs ? `Presente ahora su Declaración Anual ${filingYearLabel}` : `File your ${filingYearLabel} Annual Report now`}</div>
                  <p style="color:#64748b;font-size:13px;line-height:1.65;margin:0 0 18px">
                    ${isEs
                      ? 'Si prefiere simplemente resolverlo, podemos presentarla por usted como un servicio único. Es rápido de completar, y queda resuelto con tiempo de sobra antes del plazo límite del 1 de mayo.'
                      : "If you'd simply like to get it out of the way, we can file it for you as a one-time service. It's quick to set up, and it's taken care of well before the May 1 deadline."}
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px">
                    <tr>
                      <td style="font-size:24px;font-weight:800;color:#1C2E44;font-family:Georgia,serif">$99</td>
                      <td align="right" style="font-size:11.5px;color:#94A3B8;vertical-align:bottom;padding-bottom:4px">${isEs ? '+ $139 tarifa estatal de Florida' : '+ $139 Florida state fee'}</td>
                    </tr>
                  </table>
                  <a href="${arUrl}" style="display:block;text-align:center;background:${GREEN};color:#fff;text-decoration:none;padding:13px 24px;border-radius:9px;font-weight:700;font-size:14.5px">${isEs ? 'Presentar mi Declaración Anual →' : 'File My Annual Report →'}</a>
                  <p style="text-align:center;font-size:11px;color:#94A3B8;margin:10px 0 0">${isEs ? 'Su información ya está pre-cargada. Solo revise y confirme.' : 'Your information is pre-filled. Just review and confirm.'}</p>
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
                  <div style="font-size:11px;font-weight:700;color:${GREEN_DARK};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">${isEs ? 'Opción 2 · Paquete VIP de Cumplimiento' : 'Option 2 · VIP Compliance Package'}</div>
                  <div style="font-size:17px;font-weight:800;color:#1C2E44;font-family:Georgia,serif;margin-bottom:10px">${isEs ? 'Agente Registrado y Declaración Anual, cada año' : 'Registered Agent and Annual Report, every year'}</div>
                  <p style="color:#64748b;font-size:13px;line-height:1.65;margin:0 0 14px">
                    ${isEs
                      ? 'Si prefiere no lidiar con esto cada año, nuestro Paquete VIP de Cumplimiento reúne su Agente Registrado y su Declaración Anual, renovados automáticamente. Nosotros monitoreamos el plazo y presentamos en su nombre, con una confirmación por correo cada vez que se hace.'
                      : "If you'd rather not deal with this every year, our VIP Compliance Package bundles your Registered Agent and Annual Report together, renewed automatically. We monitor the deadline and file on your behalf, with an email confirmation each time it's done."}
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px">
                    <tr><td style="padding:0 0 6px;width:20px;vertical-align:top;color:${GREEN};font-weight:800;font-size:12.5px">&#10003;</td><td style="padding:0 0 6px;font-size:12.5px;color:#475569;line-height:1.6">${isEs ? '<strong style="color:#1C2E44">Agente Registrado:</strong> dirección oficial de Florida, renovada automáticamente.' : '<strong style="color:#1C2E44">Registered Agent:</strong> official Florida address, renewed automatically.'}</td></tr>
                    <tr><td style="padding:0 0 6px;width:20px;vertical-align:top;color:${GREEN};font-weight:800;font-size:12.5px">&#10003;</td><td style="padding:0 0 6px;font-size:12.5px;color:#475569;line-height:1.6">${isEs ? '<strong style="color:#1C2E44">Declaración Anual:</strong> presentada cada año antes del plazo, sin que usted tenga que recordarlo.' : '<strong style="color:#1C2E44">Annual Report:</strong> filed every year before the deadline, without you having to remember.'}</td></tr>
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
