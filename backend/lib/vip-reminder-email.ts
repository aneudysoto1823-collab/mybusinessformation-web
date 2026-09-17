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
import { PHYSICAL_MAILING_ADDRESS, fbfcLetterHeaderHtml } from './email-constants'

// #7BBB5D pedido por el founder (2026-09-11, "el verde que ellos usan") para
// botones/bordes/checkmarks. GREEN_DARK es una variante más oscura del mismo
// tono, solo para las etiquetas de sección en mayúscula (texto chico sobre
// blanco necesita más contraste que un botón grande).
const GREEN = '#7BBB5D'
const GREEN_DARK = '#4C7A38'

export function buildVipReminderEmail(company: CampaignCompany, lang: 'en' | 'es') {
  const isEs = lang === 'es'

  // Mismo formateo que campaign-email.ts (Carta Nuevas Empresas) — para que
  // el recuadro de registro de abajo se vea idéntico entre las dos campañas.
  // Parseo seguro de año/mes/día (bug real 2026-09-15: new Date(d) directo
  // sobre un date-only string se corre un día para atrás en zonas horarias
  // detrás de UTC) — ver mismo fix en campaign-email.ts.
  const fmtDate = (d?: string | null) => {
    if (!d) return '—'
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
    const dt = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d)
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  const registrationDateFormatted = fmtDate(company.registration_date)
  const noticeDate = new Date().toLocaleDateString(isEs ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const unsubscribeUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(company.email)}`
  const idParam = `id=${encodeURIComponent(company.document_id)}${isEs ? '&lang=es' : ''}`
  const arUrl = `${BASE_URL}/annual-report?${idParam}`
  const vipUrl = `${BASE_URL}/vip?${idParam}`

  // Florida exige la primera Declaración Anual el año SIGUIENTE al de
  // formación (vence el 1 de mayo). El negocio confirma que esta campaña
  // solo se manda a empresas con registration_date real — el fallback acá es
  // solo defensivo (la columna es nullable en la DB), no un contenido
  // pensado a propósito.
  // Mismo parseo seguro que fmtDate arriba — sin esto, una empresa
  // registrada el 1 de enero podía calcularse un año atrás (31 de
  // diciembre en UTC) y mostrar el año de Declaración Anual equivocado.
  const regYearMatch = company.registration_date ? /^(\d{4})-(\d{2})-(\d{2})/.exec(company.registration_date) : null
  const regYear = regYearMatch ? Number(regYearMatch[1]) : (company.registration_date ? new Date(company.registration_date).getFullYear() : null)
  const firstArYear = regYear && !isNaN(regYear) ? regYear + 1 : null
  const filingYearLabel = firstArYear ? String(firstArYear) : (isEs ? 'próxima' : 'upcoming')

  const subject = isEs
    ? `Su Declaración Anual ${filingYearLabel} · ${company.company_name}`
    : `Your ${filingYearLabel} Annual Report · ${company.company_name}`

  // Disclaimer superior — hallazgo #2 auditoría FTC/UPL 2026-09-15: antes el
  // aviso de "no somos gobierno" solo vivía al final del email, después de
  // mostrar ambas ofertas con precio. Copy suavizado 2026-09-17 (pedido
  // founder: "que no asuste tanto a la gente") — abre con el beneficio
  // ("nosotros nos encargamos del papeleo") antes del disclosure legal, en
  // vez de arrancar con la aclaración. Los 3 hechos obligatorios siguen
  // ahí: privado, opcional, sin afiliación de gobierno.
  const topDisclaimer = isEs
    ? 'Formar y mantener una empresa implica mucho papeleo, y nosotros nos encargamos por usted. Somos un servicio privado y opcional de preparación de documentos, sin afiliación con el Estado de Florida ni el IRS.'
    : "Running a business means plenty of paperwork, and we handle it for you. We're a private, optional document preparation service, not affiliated with the State of Florida or the IRS."

  const introParas = firstArYear
    ? (isEs
        ? [
            `Felicitaciones por haber formado <strong>${company.company_name}</strong> en Florida en ${regYear}. A medida que su negocio crece, mantenerse en regla ante el Estado importa tanto como lo fue empezar.`,
            `Toda LLC y Corporación de Florida debe presentar una Declaración Anual cada año para seguir activa en los registros del Estado. No presentarla puede generar cargos por atraso, y si se deja de presentar por suficiente tiempo, el Estado puede disolver la empresa administrativamente. ${filingYearLabel} es cuando esto le aplica por primera vez a ${company.company_name}.`,
            `Puede presentar su Declaración Anual por separado, o aprovechar nuestra oferta VIP, que incluye tanto el Agente Registrado como la Declaración Anual. Presentarla con nuestro equipo especializado ayuda a evitar errores y demoras en la aprobación:`,
          ]
        : [
            `Congratulations on forming <strong>${company.company_name}</strong> in Florida in ${regYear}. As your business grows, staying in good standing with the State matters just as much as getting started did.`,
            `Every Florida LLC and Corporation is required to file an Annual Report each year to remain active on the State's records. Missing it can lead to late fees, and if it goes unfiled long enough, the State can administratively dissolve the company. ${filingYearLabel} is when this first applies to ${company.company_name}.`,
            `You can file your Annual Report on its own, or take advantage of our VIP offer, which includes both the Registered Agent and the Annual Report. Filing it with our specialized team helps avoid errors and delays in approval:`,
          ])
    : (isEs
        ? [
            `Felicitaciones por haber formado <strong>${company.company_name}</strong> en Florida.`,
            `Toda LLC y Corporación de Florida debe presentar una Declaración Anual cada año para seguir activa en los registros del Estado.`,
            `Puede presentar su Declaración Anual por separado, o aprovechar nuestra oferta VIP, que incluye tanto el Agente Registrado como la Declaración Anual. Presentarla con nuestro equipo especializado ayuda a evitar errores y demoras en la aprobación:`,
          ]
        : [
            `Congratulations on forming <strong>${company.company_name}</strong> in Florida.`,
            `Every Florida LLC and Corporation is required to file an Annual Report each year to remain active on the State's records.`,
            `You can file your Annual Report on its own, or take advantage of our VIP offer, which includes both the Registered Agent and the Annual Report. Filing it with our specialized team helps avoid errors and delays in approval:`,
          ])

  const introHtml = introParas.map(p => `<p style="color:#475569;font-size:13.5px;line-height:1.7;margin:0 0 12px">${p}</p>`).join('')

  // Bug real encontrado 2026-09-14 probando el envío desde el celular: el
  // dominio y "Compliance Reminder" del membrete usaban
  // rgba(255,255,255,.55-.6) (blanco semi-transparente) — varios clientes de
  // correo en mobile (Gmail app, Outlook mobile, modo oscuro) no soportan
  // bien el canal alpha en color de texto y lo renderizan invisible/oscuro,
  // aunque en desktop se viera perfecto. Reemplazado por un color sólido
  // (#B9C6DA) que se ve igual a simple vista pero renderiza consistente en
  // todos los clientes. De paso, "mybusinessformation.com" nunca fue un link
  // de verdad (era un <div> con texto) — ahora es <a href> real.
  //
  // Debajo del saludo se agregó tipo de entidad + Número de Documento, uno
  // debajo del otro (pedido founder 2026-09-14) — mismos datos que ya
  // muestra el recuadro de registro de Carta Nuevas Empresas, acá en
  // formato simple porque este email no tiene ese recuadro.
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

        <!-- Membrete (fondo blanco, igual que B1 — ver fbfcLetterHeaderHtml, auditoría FTC/UPL 2026-09-17).
             El link del dominio va directo al combo VIP (pedido founder 2026-09-17) en vez de a la
             homepage genérica, para que alguien que hace clic ahí arriba ya caiga con el carrito
             precargado, no solo quien llega hasta el botón verde de abajo. -->
        <tr>${fbfcLetterHeaderHtml({ domainHref: vipUrl })}</tr>

        <!-- Disclaimer superior (antes de cualquier precio) — tinte azul en vez de verde
             (pedido founder 2026-09-17: "suavizarlo, que no asuste tanto") -->
        <tr>
          <td style="background:#fff;padding:22px 36px 0">
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:12px 16px">
              <p style="color:#1E40AF;font-size:12px;line-height:1.6;margin:0">${topDisclaimer}</p>
            </div>
          </td>
        </tr>

        <!-- Recuadro de registro — mismo diseño que Carta Nuevas Empresas
             (pedido founder 2026-09-15: "con los datos le inspira mucho más
             confianza al cliente" que solo el saludo con nombre). Reemplaza
             el texto plano "LLC / documentId" que tenía este email antes. -->
        <tr>
          <td style="background:#fff;padding:14px 36px 6px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px">
              <tr>
                <td style="padding:16px 18px 8px">
                  <div style="color:#94A3B8;font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;margin-bottom:3px">${isEs ? 'Empresa Registrada en Florida' : 'Florida Registered Company'}</div>
                  <div style="color:#1C2E44;font-size:18px;font-weight:800;font-family:Georgia,serif">${company.company_name}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 18px 16px">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #E2E8F0">
                    <tr>
                      <td width="50%" style="padding:10px 0 0;vertical-align:top">
                        <div style="color:#94A3B8;font-size:9.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase">${isEs ? 'Número de Documento' : 'Document Number'}</div>
                        <div style="color:#1C2E44;font-size:13px;font-weight:600">${company.document_id}</div>
                      </td>
                      <td width="50%" style="padding:10px 0 0;vertical-align:top">
                        <div style="color:#94A3B8;font-size:9.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase">${isEs ? 'Fecha de Registro' : 'Registration Date'}</div>
                        <div style="color:#1C2E44;font-size:13px;font-weight:600">${registrationDateFormatted}</div>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="padding:10px 0 0;vertical-align:top">
                        <div style="color:#94A3B8;font-size:9.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase">${isEs ? 'Fecha del Aviso' : 'Notice Date'}</div>
                        <div style="color:#1C2E44;font-size:13px;font-weight:600">${noticeDate}</div>
                      </td>
                      <td width="50%" style="padding:10px 0 0;vertical-align:top">
                        <div style="color:#94A3B8;font-size:9.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase">${isEs ? 'Tipo de Entidad' : 'Entity Type'}</div>
                        <div style="color:#1C2E44;font-size:13px;font-weight:600">${company.company_type}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="background:#fff;padding:20px 36px 8px">
            <p style="color:#1C2E44;font-size:15px;font-weight:700;margin:0 0 14px">
              ${isEs ? `Hola${company.owner_name ? ' ' + company.owner_name : ''},` : `Hello${company.owner_name ? ' ' + company.owner_name : ''},`}
            </p>
            ${introHtml}
          </td>
        </tr>

        <!-- Sección 1 — AR solo, renovado cada año (2026-09-16: se descartó
             ofrecerla como "presentación única" — Florida la exige TODOS los
             años sin excepción, así que un one-time real solo pospone la
             conversión a un segundo momento con menos urgencia que ahora.
             Ver memoria de la sesión: decisión de negocio, ambas opciones de
             este email quedan como suscripción, solo cambia el alcance
             (AR sola vs. AR+RA combinados). getRecurringServicesFromOrder
             ya crea la Subscription para 'annual-report' sin cambios de
             código — lo único que hacía falta era que el copy dejara de
             prometer algo distinto.) -->
        <tr>
          <td style="background:#fff;padding:8px 36px 6px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1.5px solid #E2E8F0;border-radius:12px">
              <tr>
                <td style="padding:24px 26px">
                  <div style="font-size:11px;font-weight:700;color:${GREEN_DARK};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">${isEs ? 'Declaración Anual, cada año' : 'Annual Report, every year'}</div>
                  <div style="font-size:17px;font-weight:800;color:#1C2E44;font-family:Georgia,serif;margin-bottom:10px">${isEs ? `Presente ahora su Declaración Anual ${filingYearLabel}` : `File your ${filingYearLabel} Annual Report now`}</div>
                  <p style="color:#94A3B8;font-size:12px;line-height:1.6;margin:0 0 12px">
                    ${isEs
                      ? 'La Declaración Anual es una presentación breve ante el Estado de Florida que confirma que la información de su negocio sigue siendo correcta y mantiene su empresa activa. Es obligatoria todos los años.'
                      : 'The Annual Report is a short filing with the State of Florida confirming your business information is still accurate and keeping your company active. It is required every year.'}
                  </p>
                  <p style="color:#64748b;font-size:13px;line-height:1.65;margin:0 0 18px">
                    ${isEs
                      ? 'Si prefiere simplemente resolverlo, podemos presentarla por usted automáticamente cada año, con tiempo de sobra antes del plazo límite establecido.'
                      : "If you'd simply like to get it out of the way, we can file it for you automatically every year, well before the established deadline."}
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:6px;border-top:1px solid #EEF2F7;padding-top:10px">
                    <tr>
                      <td style="font-size:11px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:3px 0">Filing Services Fee</td>
                      <td align="right" style="font-size:16px;font-weight:800;color:#1C2E44;font-family:Georgia,serif;padding:3px 0">$99<span style="font-size:11px;font-weight:600;color:#64748b">${isEs ? '/año' : '/year'}</span></td>
                    </tr>
                    <tr>
                      <td style="font-size:10.5px;color:#A8B4C4;font-weight:600;padding:3px 0">Florida State Fee</td>
                      <td align="right" style="font-size:13px;font-weight:700;color:#64748B;padding:3px 0">$139</td>
                    </tr>
                  </table>
                  <a href="${arUrl}" style="display:block;text-align:center;background:${GREEN};color:#fff;text-decoration:none;padding:13px 24px;border-radius:9px;font-weight:700;font-size:14.5px;margin-top:12px">${isEs ? 'Presentar mi Declaración Anual' : 'File My Annual Report'}</a>
                  <p style="text-align:center;font-size:11px;color:#94A3B8;margin:10px 0 0">${isEs ? 'Cancele cuando quiera. Sin contrato a largo plazo.' : 'Cancel anytime. No long-term contract.'}</p>
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
                  <div style="font-size:11px;font-weight:700;color:${GREEN_DARK};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">${isEs ? 'Oferta VIP' : 'VIP Offer'}</div>
                  <div style="font-size:17px;font-weight:800;color:#1C2E44;font-family:Georgia,serif;margin-bottom:10px">${isEs ? 'Agente Registrado y Declaración Anual, cada año' : 'Registered Agent and Annual Report, every year'}</div>
                  <p style="color:#94A3B8;font-size:12px;line-height:1.6;margin:0 0 12px">
                    ${isEs
                      ? 'El Agente Registrado es la persona o empresa designada para recibir documentos legales y del Estado en nombre de su negocio. Usar nuestra dirección en vez de la suya mantiene su dirección personal fuera de los registros públicos de Florida.'
                      : "A Registered Agent is the person or company designated to receive legal and state documents on behalf of your business. Using our address instead of your own keeps your personal address out of Florida's public records."}
                  </p>
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
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:6px;border-top:1px solid #EEF2F7;padding-top:10px">
                    <tr>
                      <td style="font-size:11px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:3px 0">Filing Services Fee</td>
                      <td align="right" style="font-size:16px;font-weight:800;color:#1C2E44;font-family:Georgia,serif;padding:3px 0">$179<span style="font-size:11px;font-weight:600;color:#64748b">${isEs ? '/año' : '/year'}</span></td>
                    </tr>
                    <tr>
                      <td style="font-size:10.5px;color:#A8B4C4;font-weight:600;padding:3px 0">Florida State Fee</td>
                      <td align="right" style="font-size:13px;font-weight:700;color:#64748B;padding:3px 0">$139</td>
                    </tr>
                  </table>
                  <a href="${vipUrl}" style="display:block;text-align:center;background:${GREEN};color:#fff;text-decoration:none;padding:13px 24px;border-radius:9px;font-weight:700;font-size:14.5px;margin-top:12px">${isEs ? 'Obtener Paquete VIP' : 'Get VIP Compliance Package'}</a>
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
            <p style="color:#94A3B8;font-size:11px;line-height:1.6;margin:0 0 6px"><strong>Florida Business Formation Center</strong> · mybusinessformation.com<br/>${PHYSICAL_MAILING_ADDRESS}<br/>info@mybusinessformation.com</p>
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
