// Plantilla del email de campaña B1 (Aviso Informativo de Cumplimiento) —
// única fuente de verdad, usada tanto por el envío real (api/campaigns/send)
// como por el preview de solo lectura (api/campaigns/preview-email). Antes
// vivía inline en send/route.ts; se extrajo el 2026-09-11 para que el preview
// no pueda quedar desincronizado del email que de verdad se manda.

import { PHYSICAL_MAILING_ADDRESS } from './email-constants'

export const CAMPAIGN_EMAIL_BASE_URL = 'https://mybusinessformation.com'

// Mismo verde que usa Oferta VIP (#7BBB5D, "el verde que ellos usan" —
// pedido founder 2026-09-11 en ese template) — extendido acá 2026-09-15
// para el botón principal y el precio de cada servicio: "el verde da mejor
// sensación" que el azul de marca en estos dos puntos puntuales. La franja
// navy "Available Services" y el resto del membrete se dejan sin tocar a
// propósito — mantiene el tono de aviso oficial de este email en particular.
const GREEN = '#7BBB5D'

export type CampaignCompany = {
  id: string
  document_id: string
  company_name: string
  company_type: string
  owner_name: string | null
  city: string | null
  state: string
  email: string
  registration_date: string | null
}

export function buildComplianceEmail(company: CampaignCompany, trackUrl: string, lang: 'en' | 'es') {
  const isEs = lang === 'es'

  // Bug real encontrado 2026-09-15 (probando el recuadro nuevo de VIP, que
  // copiaba esta misma función): un date-only string como "2026-01-15" se
  // parsea con new Date(d) como medianoche UTC, y en una zona horaria
  // detrás de UTC (ej. US Eastern) el toLocaleDateString posterior lo
  // corre un día para atrás ("January 14" en vez de "January 15"). Mismo
  // fix que ya usa formatLongDateForLetter() en lib/new-business-letter.ts
  // para el PDF: parsear año/mes/día y construir la fecha en hora LOCAL,
  // no vía el string crudo.
  const fmtDate = (d?: string | null) => {
    if (!d) return '—'
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
    const dt = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d)
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  const registrationDate = fmtDate(company.registration_date)
  const noticeDate = new Date().toLocaleDateString(isEs ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const unsubscribeUrl = `${CAMPAIGN_EMAIL_BASE_URL}/unsubscribe?email=${encodeURIComponent(company.email)}`

  const subject = isEs
    ? `Aviso Informativo de Cumplimiento — ${company.company_name}`
    : `Business Compliance Notice — ${company.company_name}`

  const title = isEs
    ? 'AVISO INFORMATIVO DE CUMPLIMIENTO EMPRESARIAL'
    : 'BUSINESS COMPLIANCE INFORMATION NOTICE'

  const greeting = isEs
    ? `Felicitaciones por el registro reciente de ${company.company_name}.`
    : `Congratulations on the recent registration of ${company.company_name}.`

  const p1 = isEs
    ? 'Como empresa de reciente formación en Florida, existen varios trámites, registros y servicios de cumplimiento que suelen solicitarse durante las primeras etapas de operación. Estos servicios ayudan a establecer la credibilidad del negocio, respaldar relaciones bancarias, mantener registros precisos y contribuir al buen estado legal de su empresa a largo plazo.'
    : 'As a newly formed Florida business, there are several filings, registrations, and compliance-related services commonly requested during the early stages of operation. These services can help establish business credibility, support banking relationships, maintain accurate business records, and assist with the long-term good standing of your company.'

  const p2 = isEs
    ? 'Muchas instituciones financieras, proveedores, prestamistas, agencias gubernamentales y socios comerciales pueden solicitar documentación que confirme el estado de su negocio, su información de identificación fiscal y su historial de cumplimiento. Completar los trámites correspondientes a tiempo ayuda a evitar demoras innecesarias al abrir cuentas bancarias comerciales, solicitar financiamiento, firmar contratos, contratar empleados o expandir operaciones.'
    : 'Many financial institutions, vendors, lenders, government agencies, and business partners may request documentation confirming your business status, tax identification information, and compliance history. Completing applicable filings in a timely manner can help avoid unnecessary delays when opening business bank accounts, applying for financing, entering into contracts, hiring employees, or expanding operations.'

  const p3 = isEs
    ? `Como ${company.company_name} es un negocio recién registrado, le ofrecemos los siguientes servicios que contribuirán a la organización y el buen funcionamiento de su empresa.`
    : `As a newly registered business, we offer ${company.company_name} the following services, which will help organize and strengthen your operation.`

  // Disclaimer superior — hallazgo #2 auditoría FTC/UPL 2026-09-15: antes el
  // aviso de "no somos gobierno" solo vivía al final del email, después de
  // mostrar los 3 precios. Este va justo debajo del recuadro de registro,
  // antes de la grilla de servicios.
  const topDisclaimer = isEs
    ? 'Florida Business Formation Center es un servicio privado de preparación de documentos. No somos una agencia gubernamental, no estamos afiliados con el Estado de Florida ni con el IRS, y usted no está obligado a utilizar nuestros servicios.'
    : 'Florida Business Formation Center is a private document preparation service. We are not a government agency, we are not affiliated with the State of Florida or the IRS, and you are not required to use our services.'

  const disclosure = isEs
    ? 'Florida Business Formation Center es un servicio profesional de preparación y presentación de documentos. No somos un bufete de abogados y no brindamos asesoría legal, fiscal ni financiera. Nuestros servicios no constituyen el ejercicio de la abogacía ni crean una relación abogado-cliente. Todas las presentaciones están sujetas a la aprobación de la División de Corporaciones de Florida y del IRS. Para orientación legal o fiscal específica a su situación, le recomendamos consultar a un abogado de Florida con licencia o a un contador público certificado. Florida Business Formation Center no está afiliado, respaldado ni aprobado por ninguna agencia gubernamental federal, estatal o local, incluidos el IRS, el Departamento de Trabajo de EE. UU. o la División de Corporaciones de Florida. Este aviso no es una factura ni una solicitud de pago. Los servicios descritos son opcionales.'
    : 'Florida Business Formation Center is a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant. Florida Business Formation Center is not affiliated with, endorsed by, or approved by any federal, state, or local government agency, including the IRS, the U.S. Department of Labor, or the Florida Division of Corporations. This notice is not a bill, invoice, or demand for payment. The services described are optional.'

  const services = [
    {
      name: isEs ? 'Carteles de Ley Laboral' : 'Labor Law Posters',
      price: '$120',
      desc: isEs
        ? 'Las leyes federales y de Florida exigen que toda empresa con al menos un empleado exhiba los carteles vigentes de ley laboral en un lugar visible. Exhibir carteles desactualizados puede generar multas en una inspección.'
        : 'Federal and Florida law require every business with at least one employee to display current labor law notices where employees can see them. Displaying outdated posters can result in fines during an inspection.',
    },
    {
      name: isEs ? 'EIN (Número Fiscal)' : 'EIN (Tax ID)',
      price: '$161',
      govFeeLabel: 'IRS Fee', govFeeAmount: '$0.00',
      desc: isEs
        ? 'Número de nueve dígitos emitido por el IRS para identificar su negocio ante el fisco federal. Suele requerirse para abrir una cuenta bancaria comercial, declarar impuestos y obtener licencias.'
        : 'A nine-digit number issued by the IRS to identify your business for federal tax purposes. Commonly required to open a business bank account, file taxes, and apply for licenses.',
    },
    {
      name: isEs ? 'Certificado de Estatus' : 'Certificate of Status',
      price: '$79',
      desc: isEs
        ? 'Documento oficial del Estado de Florida que confirma que su negocio está activo y en buen estado. Solicitado por bancos, prestamistas, proveedores y socios.'
        : 'An official document from the State of Florida confirming your business is active and in good standing. Frequently requested by banks, lenders, vendors, and partners.',
    },
  ]

  // Precio en formato de factura (hallazgo #3 auditoría FTC/UPL 2026-09-15):
  // "FILING SERVICES FEE" arriba del monto deja claro que es NUESTRO
  // honorario, no un cargo de gobierno. El servicio que sí tiene una tarifa
  // gubernamental real (EIN → IRS Fee $0.00) la muestra en una 2da línea chica.
  const servicesHtml = services.map(s => `
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid #f1f5f9">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="vertical-align:top">
              <div style="font-weight:700;color:#1C2E44;font-size:15px;margin-bottom:4px">${s.name}</div>
              <div style="color:#64748b;font-size:13px;line-height:1.6">${s.desc}</div>
            </td>
            <td width="110" style="text-align:right;vertical-align:top">
              <div style="color:#94A3B8;font-size:9px;font-weight:700;letter-spacing:.03em;text-transform:uppercase">Filing Services Fee</div>
              <span style="font-weight:800;color:${GREEN};font-size:17px;white-space:nowrap">${s.price}</span>
              ${s.govFeeLabel && s.govFeeAmount ? `<div style="color:#94A3B8;font-size:10.5px;font-weight:600;margin-top:2px">${s.govFeeLabel}: ${s.govFeeAmount}</div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('')

  // Mismo bug/fix real que vip-reminder-email.ts (encontrado 2026-09-14
  // probando el envío desde el celular): rgba(255,255,255,.55-.6) en texto
  // sobre navy se ve invisible/oscuro en varios clientes de correo mobile
  // (no soportan bien el canal alpha en color de texto), aunque en desktop
  // se viera perfecto — reemplazado por un color sólido (#B9C6DA). De paso,
  // "mybusinessformation.com" pasa a ser un <a href> real, antes era un
  // <div> con texto sin link.
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

        <!-- Membrete -->
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
                    <a href="https://mybusinessformation.com" style="color:#B9C6DA;font-size:11px;letter-spacing:.5px;text-decoration:none">mybusinessformation.com</a>
                  </td>
                </tr></table>
              </td>
              <td align="right" style="color:#B9C6DA;font-size:11px;text-transform:uppercase;letter-spacing:.5px">
                ${isEs ? 'Aviso Informativo' : 'Information Notice'}
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Título -->
        <tr>
          <td style="background:#fff;padding:26px 36px 6px;text-align:center">
            <div style="color:#1C2E44;font-size:16px;font-weight:800;letter-spacing:.7px;font-family:Georgia,serif">${title}</div>
          </td>
        </tr>

        <!-- Recuadro de registro -->
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
                        <div style="color:#1C2E44;font-size:13px;font-weight:600">${registrationDate}</div>
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

        <!-- Disclaimer superior (antes de cualquier precio) -->
        <tr>
          <td style="background:#fff;padding:14px 36px 0">
            <div style="background:#EEF7E9;border:1px solid #CFE8C3;border-radius:10px;padding:12px 16px">
              <p style="color:#3F5E32;font-size:12px;line-height:1.6;margin:0">${topDisclaimer}</p>
            </div>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="background:#fff;padding:20px 36px 6px">
            <p style="color:#1C2E44;font-size:15px;font-weight:700;margin:0 0 16px">${greeting}</p>
            <p style="color:#475569;font-size:13.5px;line-height:1.7;margin:0 0 14px">${p1}</p>
            <p style="color:#475569;font-size:13.5px;line-height:1.7;margin:0 0 14px">${p2}</p>
            <p style="color:#475569;font-size:13.5px;line-height:1.7;margin:0">${p3}</p>
          </td>
        </tr>

        <!-- Servicios -->
        <tr>
          <td style="background:#fff;padding:16px 36px 6px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden">
              <tr><td style="background:#1C2E44;padding:11px 20px"><span style="color:#fff;font-weight:700;font-size:13px;letter-spacing:.3px">${isEs ? 'Servicios Disponibles' : 'Available Services'}</span></td></tr>
              ${servicesHtml}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#fff;padding:24px 36px 6px;text-align:center">
            <a href="${trackUrl}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;padding:15px 44px;border-radius:9px;font-weight:700;font-size:15px">${isEs ? 'Solicitar Estos Servicios' : 'Request These Services'}</a>
            <!-- PENDIENTE (2026-09-11): reemplazar por el link de WhatsApp cuando mybiz
                 tenga uno activo propio — hoy usa https://wa.me/13528377755, que es el
                 número de OpaBiz, no el de mybusinessformation.com. Mientras tanto se
                 muestra el email de soporte en su lugar. -->
            <div style="color:#64748b;font-size:12px;margin-top:14px">${isEs ? '¿Preguntas? Escríbanos a ' : 'Questions? Email us at '}<a href="mailto:info@mybusinessformation.com" style="color:#2563EB;text-decoration:none;font-weight:600">info@mybusinessformation.com</a></div>
          </td>
        </tr>

        <!-- Guide bonus (dynamic, agregado por route handler si aplica) -->
        <!--GUIDE_BONUS-->

        <!-- Aviso Importante (disclosure) -->
        <tr>
          <td style="background:#fff;padding:18px 36px 26px">
            <div style="border-top:1px solid #eef2f7;padding-top:16px">
              <div style="color:#1C2E44;font-size:11px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">${isEs ? 'Aviso Importante' : 'Important Disclosure'}</div>
              <p style="color:#94A3B8;font-size:10.5px;line-height:1.7;margin:0">${disclosure}</p>
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
