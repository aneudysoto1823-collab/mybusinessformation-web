// Email de la carta de cumplimiento — versión OpaBiz (2026-10-05).
// Separada a propósito de lib/campaign-email.ts (la de mybusinessformation.com):
// el founder pidió las dos marcas completamente separadas (nombre, precios,
// certificado, landing). Misma estructura y mismas reglas FTC/UPL que la de
// FBFC: disclaimer arriba antes de cualquier precio, precio tipo factura con
// la tarifa de gobierno aparte, disclosure completo al final. Única fuente de
// verdad para el envío real (api/campaigns/send-opabiz) y el preview
// (api/campaigns/preview-opabiz).

import { PHYSICAL_MAILING_ADDRESS, brandHeaderHtml, brandWhatsappUrl } from './email-constants'
import type { CampaignCompany } from './campaign-email'

// opabiz.com redirige el apex a www con un 308; los links del email van con
// www para no depender de ese salto (los POST de baja one-click no lo siguen).
export const OPABIZ_CAMPAIGN_BASE_URL = 'https://www.opabiz.com'

const GREEN = '#7BBB5D'

/** Link de seguimiento del botón/QR: registra el escaneo y lleva a opabiz.com/oferta. */
export function opabizTrackUrl(company: { id: string; document_id: string }, lang: 'en' | 'es'): string {
  return `${OPABIZ_CAMPAIGN_BASE_URL}/api/campaigns/track-scan?doc=${encodeURIComponent(company.document_id)}&cid=${company.id}&brand=opabiz${lang === 'es' ? '&lang=es' : ''}`
}

export function buildOpabizComplianceEmail(company: CampaignCompany, trackUrl: string, lang: 'en' | 'es') {
  const isEs = lang === 'es'

  // Mismo parseo en hora local que la versión FBFC: un "2026-01-15" pasado
  // directo a new Date() se corre un día para atrás en US Eastern.
  const fmtDate = (d?: string | null) => {
    if (!d) return '—'
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
    const dt = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d)
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  const registrationDate = fmtDate(company.registration_date)
  const noticeDate = new Date().toLocaleDateString(isEs ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const unsubscribeUrl = `${OPABIZ_CAMPAIGN_BASE_URL}/unsubscribe?email=${encodeURIComponent(company.email)}`

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

  const topDisclaimer = isEs
    ? 'Formar y mantener una empresa implica mucho papeleo, y nosotros nos encargamos por usted. Somos un servicio privado y opcional de preparación de documentos, sin afiliación con el Estado de Florida ni el IRS.'
    : "Running a business means plenty of paperwork, and we handle it for you. We're a private, optional document preparation service, not affiliated with the State of Florida or the IRS."

  const disclosure = isEs
    ? 'OpaBiz es un nombre comercial de Florida Business Formation Center, un servicio profesional de preparación y presentación de documentos. No somos un bufete de abogados y no brindamos asesoría legal, fiscal ni financiera. Nuestros servicios no constituyen el ejercicio de la abogacía ni crean una relación abogado-cliente. Todas las presentaciones están sujetas a la aprobación de la División de Corporaciones de Florida y del IRS. Para orientación legal o fiscal específica a su situación, le recomendamos consultar a un abogado de Florida con licencia o a un contador público certificado. OpaBiz no está afiliado, respaldado ni aprobado por ninguna agencia gubernamental federal, estatal o local, incluidos el IRS, el Departamento de Trabajo de EE. UU. o la División de Corporaciones de Florida. Este aviso no es una factura ni una solicitud de pago. Los servicios descritos son opcionales.'
    : 'OpaBiz is a trade name of Florida Business Formation Center, a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant. OpaBiz is not affiliated with, endorsed by, or approved by any federal, state, or local government agency, including the IRS, the U.S. Department of Labor, or the Florida Division of Corporations. This notice is not a bill, invoice, or demand for payment. The services described are optional.'

  // Precios de opabiz.com (SERVICES_CATALOG): Poster $120, EIN $79,
  // Certificate of Good Standing $49 + $9 de Florida.
  const services: { name: string; price: string; feeLabel?: string; govFeeLabel?: string; govFeeAmount?: string; desc: string }[] = [
    {
      name: isEs ? 'Póster de Leyes Laborales' : 'Labor Law Poster',
      price: '$120',
      feeLabel: 'Service Fee',
      govFeeLabel: isEs ? 'Envío' : 'Shipping', govFeeAmount: isEs ? 'incluido' : 'included',
      desc: isEs
        ? 'Las leyes federales y de Florida exigen que toda empresa con al menos un empleado exhiba los avisos laborales vigentes en un lugar visible. Le enviamos un póster todo en uno, actualizado y listo para colgar, que le ayuda a evitar multas costosas en una inspección.'
        : 'Federal and Florida law require every business with at least one employee to display current labor law notices where employees can see them. We ship you an up-to-date, all-in-one poster ready to hang, which helps you avoid costly fines during an inspection.',
    },
    {
      name: isEs ? 'EIN (Número Fiscal)' : 'EIN (Tax ID)',
      price: '$79',
      govFeeLabel: 'IRS Fee', govFeeAmount: '$0.00',
      desc: isEs
        ? 'Número de nueve dígitos emitido por el IRS para identificar su negocio ante el fisco federal. Suele requerirse para abrir una cuenta bancaria comercial, declarar impuestos y obtener licencias. Presentarlo con nuestro equipo especializado ayuda a evitar errores en la solicitud y demoras en la aprobación.'
        : 'A nine-digit number issued by the IRS to identify your business for federal tax purposes. Commonly required to open a business bank account, file taxes, and apply for licenses. Filing it with our specialized team helps avoid application errors and delays in approval.',
    },
    {
      name: isEs ? 'Certificado de Buena Reputación' : 'Certificate of Good Standing',
      price: '$49',
      govFeeLabel: 'Florida State Fee', govFeeAmount: '$9',
      desc: isEs
        ? 'Documento oficial del Estado de Florida que confirma que su negocio está activo y en buen estado. Solicitado por bancos, prestamistas, proveedores y socios. Nuestro equipo especializado se encarga de tramitarlo correctamente, evitando errores que puedan retrasar su aprobación.'
        : 'An official document from the State of Florida confirming your business is active and in good standing. Frequently requested by banks, lenders, vendors, and partners. Our specialized team handles the request correctly, helping avoid errors that could delay approval.',
    },
  ]

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
              <div style="color:#94A3B8;font-size:9px;font-weight:700;letter-spacing:.03em;text-transform:uppercase">${s.feeLabel ?? 'Filing Services Fee'}</div>
              <span style="font-weight:800;color:${GREEN};font-size:17px;white-space:nowrap">${s.price}</span>
              ${s.govFeeLabel && s.govFeeAmount ? `<div style="color:#94A3B8;font-size:10.5px;font-weight:600;margin-top:2px">${s.govFeeLabel}: ${s.govFeeAmount}</div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('')

  const comboNote = isEs
    ? 'Contrate los 3 servicios juntos y ahorre un 10%.'
    : 'Get all 3 services together and save 10%.'

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

        <!-- Membrete OpaBiz -->
        <tr>
          <td style="background:#fff;border-radius:14px 14px 0 0;padding:22px 36px;border-bottom:1px solid #E2E8F0">
            <table cellpadding="0" cellspacing="0" border="0"><tr>${brandHeaderHtml('opabiz')}</tr></table>
          </td>
        </tr>

        <!-- Disclaimer superior (antes del título y de cualquier precio) -->
        <tr>
          <td style="background:#fff;padding:22px 36px 0">
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:12px 16px">
              <p style="color:#1E40AF;font-size:12px;line-height:1.6;margin:0">${topDisclaimer}</p>
            </div>
          </td>
        </tr>

        <!-- Título -->
        <tr>
          <td style="background:#fff;padding:18px 36px 6px;text-align:center">
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
              <tr><td style="padding:12px 20px;background:#F8FAFC"><span style="color:#1C2E44;font-size:13px;font-weight:700">${comboNote}</span></td></tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#fff;padding:24px 36px 6px;text-align:center">
            <a href="${trackUrl}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;padding:15px 44px;border-radius:9px;font-weight:700;font-size:15px">${isEs ? 'Solicitar Estos Servicios' : 'Request These Services'}</a>
            <div style="color:#64748b;font-size:12px;margin-top:14px">${isEs ? '¿Preguntas? Escríbanos por ' : 'Questions? Reach us on '}<a href="${brandWhatsappUrl('opabiz')}" style="color:#059669;text-decoration:none;font-weight:600">WhatsApp</a>${isEs ? ' o a ' : ' or at '}<a href="mailto:info@opabiz.com" style="color:#2563EB;text-decoration:none;font-weight:600">info@opabiz.com</a></div>
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
            <p style="color:#94A3B8;font-size:11px;line-height:1.6;margin:0 0 6px"><strong>OpaBiz</strong> · opabiz.com<br/>${PHYSICAL_MAILING_ADDRESS}<br/>info@opabiz.com</p>
            <p style="color:#CBD5E1;font-size:10px;line-height:1.6;margin:0">${isEs ? 'Recibió este correo porque su empresa figura en los registros públicos de Florida y su información de contacto fue obtenida a través de un proveedor externo de datos. ' : 'You received this email because your company appears in Florida public records and your contact information was obtained through a third-party data provider. '}<a href="${OPABIZ_CAMPAIGN_BASE_URL}/privacy" style="color:#94A3B8;text-decoration:underline">${isEs ? 'Política de Privacidad' : 'Privacy Policy'}</a> · <a href="${unsubscribeUrl}" style="color:#94A3B8;text-decoration:underline">${isEs ? 'Cancelar suscripción' : 'Unsubscribe'}</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}
