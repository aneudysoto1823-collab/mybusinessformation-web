import type { Metadata } from 'next'
import { SERVICES_CATALOG, getServiceFee } from '@/lib/services-pricing'

export const metadata: Metadata = {
  title: 'Additional Services — Florida Business Formation Center',
  description: 'Compliance and business services for Florida companies: Registered Agent, EIN, Operating Agreement, Virtual Address, Annual Report and more.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://mybusinessformation.com/servicios' },
}

// Clon de /servicios re-marcado para mybusinessformation.com (separación de
// dominios 2026-08-13). El precio sale de lib/services-pricing.ts (fuente
// autoritativa, la misma que usa /servicios/checkout — anti-drift). El
// contenido de exhibición (ícono, subtítulo, descripción, "qué incluye")
// se copia del catálogo ya aprobado de /servicios/page.tsx — esa página
// mantiene su propia copia hardcodeada (deuda técnica preexistente, no se
// toca acá) así que este es el mismo texto, no texto nuevo.
const EXCLUDED_IDS = new Set(['llc-formation', 'corp-formation'])

type Display = { icon: string; subEn: string; subEs: string; descEn: string; descEs: string; incEn: string[]; incEs: string[] }

const DISPLAY: Record<string, Display> = {
  'registered-agent': { icon: 'home', subEn: 'Free 1st year with any other service · $99/yr', subEs: 'Gratis 1er año con cualquier otro servicio · $99/año',
    descEn: 'Every Florida LLC and Corporation must have a Registered Agent with a physical FL street address. We receive your legal documents, tax notices, and official mail on your behalf.',
    descEs: 'Toda LLC y Corporación de Florida debe tener un Agente Registrado con dirección física en FL. Nosotros recibimos tus documentos legales, notificaciones fiscales y correspondencia oficial en tu nombre.',
    incEn: ['Official FL street address for your business', 'Accepts service of process & legal documents', 'Change of Registered Agent filed with state', 'Document forwarding & email notifications'],
    incEs: ['Dirección oficial en FL para tu negocio', 'Acepta notificaciones y documentos legales', 'Cambio de Agente Registrado tramitado ante el estado', 'Reenvío de documentos y notificación por correo'] },
  ein: { icon: 'hash', subEn: 'One-time fee', subEs: 'Pago único',
    descEn: 'Your federal Employer Identification Number (EIN) is a 9-digit IRS number required to open a business bank account, hire employees, and file federal taxes.',
    descEs: 'Tu Número de Identificación Fiscal federal (EIN) es un número de 9 dígitos del IRS necesario para abrir cuenta bancaria de negocios, contratar empleados y presentar impuestos federales.',
    incEn: ['IRS EIN application preparation and submission', 'EIN confirmation letter (PDF)', 'Email confirmation with EIN number', 'Required to open a business bank account'],
    incEs: ['Preparación y envío de la solicitud de EIN ante el IRS', 'Carta de confirmación del EIN (PDF)', 'Confirmación por correo con tu número de EIN', 'Necesario para abrir cuenta bancaria de negocios'] },
  'operating-agreement': { icon: 'file-text', subEn: 'One-time fee', subEs: 'Pago único',
    descEn: "The Operating Agreement is your LLC's internal governing document — it defines ownership percentages, management roles, profit distribution, and decision-making rules.",
    descEs: 'El Acuerdo Operativo es el documento interno de gobierno de tu LLC — define porcentajes de propiedad, roles de gestión, distribución de ganancias y reglas para la toma de decisiones.',
    incEn: ['Custom Operating Agreement (LLC)', 'Ownership & management structure', 'Profit/loss distribution clauses', 'Required by most FL banks to open accounts'],
    incEs: ['Acuerdo Operativo personalizado para tu LLC', 'Estructura de propiedad y gestión', 'Cláusulas de distribución de ganancias y pérdidas', 'Requerido por la mayoría de bancos en FL'] },
  itin: { icon: 'globe', subEn: 'One-time fee', subEs: 'Pago único',
    descEn: 'An ITIN (Individual Taxpayer Identification Number) is issued by the IRS to individuals who need to file US taxes but are not eligible for a Social Security Number.',
    descEs: 'Un ITIN (Número de Identificación Fiscal Individual) es emitido por el IRS a personas que necesitan presentar impuestos en USA pero no califican para un Social Security Number.',
    incEn: ['IRS Form W-7 preparation', 'Document checklist & guidance', 'Submission support to IRS CAA', 'For foreign nationals, non-resident aliens'],
    incEs: ['Preparación del Formulario W-7 del IRS', 'Lista de documentos y guía personalizada', 'Apoyo en envío a CAA del IRS', 'Para extranjeros y no residentes'] },
  dba: { icon: 'tag', subEn: '+ FL state fee', subEs: '+ tarifa estatal de FL',
    descEn: 'A DBA (Doing Business As) or Fictitious Name lets your business operate under a different name from its registered legal name.',
    descEs: 'Un DBA (Doing Business As) o Nombre Ficticio permite que tu negocio opere bajo un nombre distinto al nombre legal registrado.',
    incEn: ['Fictitious Name registration with State of FL', 'Name availability search', 'Florida Fictitious Name Registration Certificate', 'Valid for 5 years (FL requirement)'],
    incEs: ['Registro de Nombre Ficticio con el Estado de FL', 'Búsqueda de disponibilidad del nombre', 'Certificado de Registro de Nombre Ficticio de Florida', 'Vigencia de 5 años (requisito FL)'] },
  'virtual-address': { icon: 'map-pin', subEn: 'Monthly charge · cancel anytime', subEs: 'Cargo mensual · cancela cuando quieras',
    descEn: 'Get a professional Florida business address. Your home address stays private on all public Florida Division of Corporations records.',
    descEs: 'Obtén una dirección profesional de negocios en Florida. Tu dirección personal se mantiene privada en los registros públicos de la División de Corporaciones.',
    incEn: ['Professional FL mailing address', 'Mail receiving & digital forwarding', 'Home address stays private on public records', 'Available immediately after sign-up'],
    incEs: ['Dirección postal profesional en Florida', 'Recepción de correo y reenvío digital', 'Tu dirección personal no aparece en registros públicos', 'Activo inmediatamente al inscribirte'] },
  'annual-report': { icon: 'calendar', subEn: 'Annual charge · renews until cancelled', subEs: 'Cargo anual · se renueva hasta cancelar',
    descEn: 'Every Florida LLC and Corporation must file an Annual Report between January 1 and May 1. Missing this deadline results in a $400 late fee and potential administrative dissolution.',
    descEs: 'Toda LLC y Corporación de Florida debe presentar un Reporte Anual entre el 1 de enero y el 1 de mayo. Perder la fecha límite resulta en multa de $400 y posible disolución administrativa.',
    incEn: ['Annual Report filed with FL Division of Corps', 'Updates to officers, directors, agent info', 'On-time filing guaranteed before May 1', 'Email confirmation receipt'],
    incEs: ['Reporte Anual presentado ante la División de Corporaciones FL', 'Actualización de oficiales, directores e info del agente', 'Presentación garantizada antes del 1 de mayo', 'Confirmación de recibo por correo'] },
  amendment: { icon: 'pencil', subEn: '+ FL state fee', subEs: '+ tarifa estatal de FL',
    descEn: 'Need to change your business name, address, registered agent, or officers? We prepare and file Articles of Amendment with the Florida Division of Corporations on your behalf.',
    descEs: '¿Necesitas cambiar el nombre de tu negocio, dirección, agente registrado u oficiales? Preparamos y presentamos los Artículos de Enmienda ante la División de Corporaciones de Florida por ti.',
    incEn: ['Amendment document preparation', 'Filing with FL Division of Corporations', 'Amended certificate returned to you', 'Name change, address, officers, purpose'],
    incEs: ['Preparación del documento de enmienda', 'Presentación ante la División de Corporaciones FL', 'Certificado enmendado devuelto a ti', 'Cambio de nombre, dirección, oficiales, propósito'] },
  'banking-resolution': { icon: 'landmark', subEn: 'One-time fee', subEs: 'Pago único',
    descEn: 'A Banking Resolution authorizes a member or officer to open a business bank account on behalf of your LLC or Corporation. Most banks require this document before opening your account.',
    descEs: 'Una Resolución Bancaria autoriza a un miembro u oficial a abrir una cuenta bancaria de negocios en nombre de tu LLC o Corporación. La mayoría de los bancos exigen este documento antes de abrirte la cuenta.',
    incEn: ['Custom Banking Resolution document', 'Authorizes account opening on behalf of LLC', 'Accepted by most U.S. banks', 'Delivered by email (PDF)'],
    incEs: ['Documento de Resolución Bancaria personalizado', 'Autoriza la apertura de cuenta en nombre de la LLC', 'Aceptado por la mayoría de bancos en USA', 'Entregado por correo (PDF)'] },
  'business-tax-receipt': { icon: 'receipt', subEn: '+ county fee', subEs: '+ tarifa del condado',
    descEn: 'A Business Tax Receipt (formerly Occupational License) is required to legally operate your business in most Florida counties. We handle the application and filing with your local county.',
    descEs: 'Un Business Tax Receipt (antes Licencia Ocupacional) es requerido para operar legalmente tu negocio en la mayoría de condados de Florida. Nosotros manejamos la solicitud y presentación ante tu condado local.',
    incEn: ['County-specific BTR application preparation', 'Filing with your local Florida county', 'Required to legally operate in FL counties', 'Business Tax Receipt certificate delivered'],
    incEs: ['Preparación de la solicitud de BTR específica de tu condado', 'Presentación ante tu condado local de Florida', 'Requerido para operar legalmente en condados de FL', 'Certificado de Business Tax Receipt entregado'] },
  'sales-tax-registration': { icon: 'trending-up', subEn: 'One-time fee', subEs: 'Pago único',
    descEn: 'Any Florida business that sells products or taxable services must register with the Florida Department of Revenue to collect and remit sales tax.',
    descEs: 'Todo negocio en Florida que vende productos o servicios gravables debe registrarse con el Departamento de Ingresos de Florida para cobrar y remitir el impuesto sobre ventas.',
    incEn: ['FL Department of Revenue registration', 'Sales tax certificate (DR-11)', 'Required for businesses selling taxable goods', 'Filing instructions included'],
    incEs: ['Registro con el Departamento de Ingresos de FL', 'Certificado de impuesto sobre ventas (DR-11)', 'Requerido para negocios que venden bienes gravables', 'Instrucciones de presentación incluidas'] },
  'exclusive-guide': { icon: 'book-open', subEn: 'One-time fee', subEs: 'Pago único',
    descEn: 'Our Exclusive Formation Guide gives you everything you need to get your Florida business off to the best possible start — from banking requirements to compliance checklists.',
    descEs: 'Nuestra Guía Exclusiva de Formación te da todo lo que necesitas para que tu negocio en Florida arranque de la mejor forma — desde requisitos bancarios hasta listas de cumplimiento legal.',
    incEn: ['Step-by-step post-formation checklist', 'Banking requirements & account opening tips', 'Florida compliance calendar & deadlines', 'Delivered by email (PDF)'],
    incEs: ['Lista de verificación paso a paso post-formación', 'Requisitos bancarios y tips para abrir cuenta', 'Calendario de cumplimiento y fechas límite de Florida', 'Entregada por correo (PDF)'] },
  'good-standing': { icon: 'award', subEn: '+ FL state fee', subEs: '+ tarifa estatal de FL',
    descEn: 'A Certificate of Good Standing proves your business is active and compliant with the State of Florida. Required by banks, investors, and government agencies before entering contracts.',
    descEs: 'Un Certificado de Buena Reputación prueba que tu negocio está activo y en cumplimiento con el Estado de Florida. Requerido por bancos, inversionistas y agencias gubernamentales antes de firmar contratos.',
    incEn: ['Official certificate from FL Division of Corps', 'Certified digital & physical copy', 'Accepted by banks, investors & agencies', 'Apostille available upon request'],
    incEs: ['Certificado oficial de la División de Corporaciones FL', 'Copia digital y física certificada', 'Aceptado por bancos, inversionistas y agencias', 'Apostilla disponible a solicitud'] },
  'scorp-election': { icon: 'star', subEn: 'One-time fee', subEs: 'Pago único',
    descEn: 'Elect S-Corporation tax status with the IRS to save on self-employment taxes. Available for existing LLCs and C-Corps. Must be filed within 75 days of formation or by March 15.',
    descEs: 'Elige el estatus fiscal de Corporación S con el IRS para ahorrar en impuestos de trabajo por cuenta propia. Disponible para LLCs y Corporaciones C existentes.',
    incEn: ['IRS Form 2553 preparation & submission', 'IRS acceptance confirmation letter', 'Deadline guidance & tax year advisory', 'Only for U.S. citizens & permanent residents'],
    incEs: ['Preparación y envío del Formulario 2553 del IRS', 'Carta de aceptación del IRS', 'Asesoría sobre fechas límite y año fiscal', 'Solo para ciudadanos y residentes permanentes de USA'] },
  'foreign-llc': { icon: 'globe-2', subEn: '+ state filing fee', subEs: '+ tarifa estatal de presentación',
    descEn: 'If your Florida LLC or Corporation operates in another U.S. state, you must register as a Foreign Entity in that state. We handle the filing so your business stays legally compliant.',
    descEs: 'Si tu LLC o Corporación de Florida opera en otro estado de USA, debes registrarte como Entidad Extranjera en ese estado. Manejamos la presentación para que tu negocio cumpla la ley.',
    incEn: ['Foreign qualification filing in target state', 'Certificate of Authority from FL Division of Corps', 'Registered Agent in target state included', 'Available for all 50 U.S. states'],
    incEs: ['Calificación como Entidad Extranjera en el estado destino', 'Certificado de Autoridad de la División de Corporaciones FL', 'Agente Registrado en el estado destino incluido', 'Disponible para los 50 estados de USA'] },
  'business-license': { icon: 'clipboard-list', subEn: 'One-time fee', subEs: 'Pago único',
    descEn: 'We handle the application for your Florida business license — identifying exactly which federal, state, and local licenses your business needs and filing them on your behalf.',
    descEs: 'Manejamos la solicitud de tu licencia de negocios de Florida — identificamos qué licencias federales, estatales y locales necesita tu negocio, y las presentamos en tu nombre.',
    incEn: ['Federal, state & local license application', 'Industry-specific & location-based filing', 'Step-by-step application process', 'Confirmation delivered by email'],
    incEs: ['Solicitud de licencia federal, estatal y local', 'Presentación específica para tu industria y ubicación', 'Proceso de solicitud paso a paso', 'Confirmación entregada por correo'] },
  dissolution: { icon: 'archive', subEn: '+ FL state fee', subEs: '+ tarifa estatal de FL',
    descEn: 'Closing your business? We properly dissolve your Florida LLC or Corporation with the state so you stop accumulating annual fees and avoid future liability.',
    descEs: '¿Cerrando tu negocio? Disolvemos correctamente tu LLC o Corporación de Florida ante el estado para que dejes de acumular tarifas anuales y evites responsabilidades futuras.',
    incEn: ['Articles of Dissolution prepared & filed', 'FL Division of Corporations submission', 'Dissolution confirmation from the state', 'Stops annual report obligations'],
    incEs: ['Artículos de Disolución preparados y presentados', 'Envío a la División de Corporaciones FL', 'Confirmación de disolución por parte del estado', 'Detiene la obligación del Reporte Anual'] },
  'cierre-fiscal': { icon: 'lock', subEn: 'One-time fee', subEs: 'Pago único',
    descEn: 'Closing your business? We handle the proper closure of your tax accounts with the IRS and Florida Department of Revenue so you avoid future tax obligations and penalties.',
    descEs: '¿Cerrando tu negocio? Manejamos el cierre correcto de tus cuentas fiscales con el IRS y el Departamento de Ingresos de Florida para que evites obligaciones fiscales y multas futuras.',
    incEn: ['IRS EIN account closure letter preparation', 'FL Department of Revenue account closure', 'Guidance on final tax return obligations', 'Confirmation documents delivered by email'],
    incEs: ['Preparación de carta de cierre de cuenta EIN con el IRS', 'Cierre de cuenta con el Departamento de Ingresos de FL', 'Guía sobre obligaciones de declaración final', 'Documentos de confirmación entregados por correo'] },
  'certified-copy': { icon: 'file-text', subEn: '+ state fee', subEs: '+ tarifa estatal',
    descEn: 'An official state-certified copy of your Articles of Organization (LLC) or Incorporation (Corporation), stamped by the Florida Division of Corporations.',
    descEs: 'Una copia oficial certificada por el estado de tus Artículos de Organización (LLC) o Incorporación (Corporación), sellada por la División de Corporaciones de Florida.',
    incEn: ['State-certified copy from the FL Division of Corporations', 'For LLC (Organization) or Corporation (Incorporation)', 'Accepted by banks, courts and agencies', 'Digital and physical delivery options'],
    incEs: ['Copia certificada por la División de Corporaciones de FL', 'Para LLC (Organización) o Corporación (Incorporación)', 'Aceptada por bancos, tribunales y agencias', 'Opciones de entrega digital y física'] },
  // Mismos 2 servicios que ofrece la landing de new-business (unificación de
  // carrito 2026-08-13) — mismo texto/copy que ya usa esa página.
  'labor-law-poster': { icon: 'clipboard-list', subEn: 'Mandatory federal & state poster', subEs: 'Póster obligatorio federal y estatal',
    descEn: 'Mandatory federal & state poster for all Florida businesses. Avoid fines up to $17,650.',
    descEs: 'Póster obligatorio federal y estatal para todos los negocios en Florida. Evita multas de hasta $17,650.',
    incEn: ['2026 federal & Florida labor law poster', 'Covers minimum wage, OSHA, FMLA and more', 'Ships directly to your business address', 'Avoids fines up to $17,650 for non-compliance'],
    incEs: ['Póster de leyes laborales 2026 federal y de Florida', 'Cubre salario mínimo, OSHA, FMLA y más', 'Se envía directo a la dirección de tu negocio', 'Evita multas de hasta $17,650 por incumplimiento'] },
  'certificate-of-status': { icon: 'award', subEn: 'Official document from the State of Florida', subEs: 'Documento oficial del Estado de Florida',
    descEn: 'Official document proving your business is active and in good standing with Florida.',
    descEs: 'Documento oficial que acredita que tu negocio está activo y al corriente con Florida.',
    incEn: ['Official Certificate of Status from Florida', 'Proves your business is active and in good standing', 'Commonly requested by banks and lenders', 'Delivered digitally, ready to use'],
    incEs: ['Certificado de Estado oficial de Florida', 'Acredita que tu negocio está activo y al corriente', 'Comúnmente solicitado por bancos y prestamistas', 'Se entrega digital, listo para usar'] },
}

const svgIcons: Record<string, string> = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
  'file-text': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  'map-pin': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  landmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>',
  'trending-up': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  'book-open': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  'globe-2': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2 C 9 5 8 7 8 12 C 8 17 9 19 12 22"/><path d="M12 2 C 15 5 16 7 16 12 C 16 17 15 19 12 22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
  'clipboard-list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
  archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
}

const services = Object.entries(SERVICES_CATALOG)
  .filter(([id]) => !EXCLUDED_IDS.has(id) && DISPLAY[id])
  .map(([id, def]) => ({
    id,
    nameEn: def.name_en,
    nameEs: def.name_es,
    // getServiceFee(id,'fbfc') aplica el override de precio (ej. EIN $161 en
    // vez de $99) — esta página SIEMPRE es marca FBFC, se pasa fijo.
    price: getServiceFee(id, 'fbfc') + def.stateFee,
    billing: def.billing ?? null,
    ...DISPLAY[id],
  }))

export default function NewBusinessServiciosPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray500:#64748B;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-sans);color:var(--gray800);background:var(--gray100);line-height:1.6;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3{font-family:var(--font-serif);line-height:1.2}
a{text-decoration:none;color:inherit}
button{font-family:inherit}
.svc-header{background:#1B3A6B;padding:0 32px;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,.25)}
.svc-header-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:64px;gap:20px}
.svc-logo{display:flex;align-items:center;gap:11px}
.svc-logo-mark{width:42px;height:42px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:3px}
.svc-logo-mark img{width:100%;height:100%;object-fit:contain}
.svc-logo-text{font-family:var(--font-serif);font-size:1.02rem;font-weight:700;color:#fff;line-height:1.15}
.svc-header-right{display:flex;align-items:center;gap:14px}
.svc-back{color:rgba(255,255,255,.85);font-size:.82rem;font-weight:700;padding:6px 14px;border:1.5px solid rgba(255,255,255,.35);border-radius:6px;transition:all .15s}
.svc-back:hover{color:#fff;border-color:#fff}
.svc-lang{display:flex;background:rgba(255,255,255,.12);border-radius:20px;padding:3px;gap:2px}
.svc-lang button{padding:4px 13px;border-radius:16px;border:none;cursor:pointer;font-size:.72rem;font-weight:700;font-family:var(--font-sans);transition:all .15s;background:transparent;color:rgba(255,255,255,.65)}
.svc-lang button.active{background:#fff;color:#1B3A6B}
.svc-hero{background:#fff;padding:40px 32px 34px;text-align:center;border-bottom:1px solid var(--gray200)}
.svc-hero-inner{max-width:680px;margin:0 auto}
.svc-hero h1{font-size:clamp(1.4rem,3vw,1.9rem);color:var(--navy);margin-bottom:10px}
.svc-hero p{color:var(--gray600);font-size:.92rem;line-height:1.7}
.svc-grid-wrap{max-width:1200px;margin:0 auto;padding:36px 32px 60px;flex:1;width:100%}
.services-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:28px;align-items:start}
.services-main{min-width:0}
.svc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:760px){.svc-grid{grid-template-columns:1fr}}
.order-summary{position:sticky;top:80px;align-self:start}
.order-summary-card{background:#fff;border:1.5px solid var(--gray200);border-radius:14px;box-shadow:0 8px 30px rgba(28,46,68,.07);padding:18px 18px 20px}
.os-head{display:flex;align-items:center;gap:9px;padding-bottom:14px;border-bottom:1px solid var(--gray100);margin-bottom:14px}
.os-title{font-family:var(--font-serif);font-size:1.1rem;font-weight:700;color:var(--navy);margin:0;flex:1}
.os-count{background:var(--blue);color:#fff;font-size:.72rem;font-weight:700;min-width:22px;height:22px;border-radius:11px;display:none;align-items:center;justify-content:center;padding:0 7px}
.os-count.show{display:flex}
.os-empty{font-size:.82rem;color:var(--gray500);line-height:1.6;text-align:center;padding:18px 6px}
.os-items{display:flex;flex-direction:column}
.os-item{display:flex;align-items:flex-start;gap:8px;padding:9px 0;border-bottom:1px solid var(--gray100)}
.os-item-name{flex:1;font-size:.8rem;color:var(--gray800);font-weight:500;line-height:1.4}
.os-item-price{font-size:.8rem;font-weight:700;color:var(--blue);white-space:nowrap}
.os-item-x{background:none;border:none;color:var(--gray400);font-size:.78rem;cursor:pointer;padding:2px 5px;border-radius:6px;line-height:1;flex-shrink:0}
.os-item-x:hover{background:#fee2e2;color:#dc2626}
.os-subtotal-row{display:flex;align-items:center;justify-content:space-between;padding:13px 0 4px;font-size:.86rem;color:var(--gray800)}
.os-subtotal-row strong{font-family:var(--font-serif);font-size:1.3rem;color:var(--navy)}
.os-continue-btn{width:100%;background:var(--blue);color:#fff;border:none;padding:13px;border-radius:11px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;min-height:46px;transition:background .2s;margin-top:6px}
.os-continue-btn:hover{background:#1d4ed8}
@media(max-width:860px){.services-layout{grid-template-columns:1fr}.order-summary{display:none}}
@media(min-width:861px){.svc-bar{display:none!important}}
.svc-card{position:relative;border:1.5px solid var(--gray200);border-radius:12px;background:#fff;transition:border-color .2s,box-shadow .2s;cursor:pointer}
.svc-card:hover,.svc-card.expanded{border-color:var(--blue);box-shadow:0 6px 24px rgba(37,99,235,.12);z-index:20}
.svc-card.sel{border-color:var(--blue)}
.svc-card-head{padding:14px 16px;display:flex;align-items:center;gap:13px}
.svc-card-icon{width:40px;height:40px;border-radius:10px;background:var(--blue-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--blue)}
.svc-card-icon svg{width:19px;height:19px}
.svc-card-title-wrap{flex:1;min-width:0}
.svc-card-name{font-family:var(--font-serif);font-weight:700;font-size:.95rem;color:var(--navy);line-height:1.25}
.svc-card-sub{font-size:.71rem;color:var(--gray500);margin-top:2px}
.svc-card-price{font-family:var(--font-serif);font-weight:700;font-size:.93rem;color:var(--navy);flex-shrink:0;white-space:nowrap}
.svc-card-price span{font-weight:500;font-size:.68rem;color:var(--gray400)}
.svc-chevron{width:20px;height:20px;color:var(--gray400);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform .25s}
.svc-chevron svg{width:15px;height:15px}
.svc-card.expanded .svc-chevron:not(.added){transform:rotate(180deg)}
.svc-chevron.added{color:#16a34a}
.svc-card-body{display:none;padding:14px 16px 16px;border-top:1px solid var(--gray100)}
.svc-card.expanded .svc-card-body{
  display:block;position:absolute;top:100%;left:0;right:0;background:#fff;
  border:1.5px solid var(--blue);border-top:1px solid var(--gray100);
  border-radius:0 0 12px 12px;box-shadow:0 16px 34px rgba(28,46,68,.16);
}
@media(max-width:760px){.svc-card.expanded .svc-card-body{position:static;box-shadow:none;border:none;border-top:1px solid var(--gray100)}}
.svc-card-desc{font-size:.82rem;color:var(--gray600);line-height:1.6;margin:14px 0}
.svc-incl-title{font-size:.71rem;font-weight:700;color:var(--gray400);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.svc-incl-item{display:flex;align-items:flex-start;gap:8px;font-size:.8rem;color:var(--gray600);line-height:1.5;margin-bottom:5px}
.svc-incl-check{color:#16a34a;font-weight:800;flex-shrink:0}
.svc-add{background:#fff;color:var(--blue);border:1.5px solid var(--blue);border-radius:7px;padding:10px 16px;font-size:.82rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;min-height:40px;width:100%;margin-top:6px}
.svc-add:hover{background:var(--blue-light)}
.svc-add.added{background:var(--blue);color:#fff}
.svc-bar{position:fixed;left:0;right:0;bottom:0;background:var(--navy);color:#fff;padding:14px 32px;display:none;align-items:center;justify-content:center;gap:24px;z-index:200;box-shadow:0 -4px 20px rgba(0,0,0,.2)}
.svc-bar.show{display:flex}
.svc-bar-count{font-size:.88rem;font-weight:600}
.svc-bar-total{font-weight:800;font-size:1.05rem}
.svc-bar-btn{background:var(--blue);color:#fff;border:none;border-radius:8px;padding:11px 26px;font-size:.88rem;font-weight:700;cursor:pointer;font-family:inherit;min-height:44px}
.svc-footer{background:var(--navy);color:rgba(255,255,255,.6);padding:20px 32px;font-size:.75rem;text-align:center;line-height:1.7}
.svc-footer a{color:rgba(255,255,255,.8);margin:0 6px}
.svc-footer a:hover{color:#fff}
.en{display:inline}.es{display:none}
@media(max-width:640px){.svc-header{padding:0 16px}.svc-hero{padding:28px 16px}.svc-grid-wrap{padding:24px 16px 130px}.svc-bar{padding:12px 16px;gap:14px;flex-wrap:wrap}}
`

  const cardsHtml = services.map(s => `
    <div class="svc-card" id="card-${s.id}" data-id="${s.id}" onclick="svcExpand(event,'${s.id}')" onmouseenter="svcHoverOpen('${s.id}')" onmouseleave="svcHoverClose('${s.id}')">
      <div class="svc-card-head">
        <div class="svc-card-icon">${svgIcons[s.icon] || svgIcons['file-text']}</div>
        <div class="svc-card-title-wrap">
          <div class="svc-card-name"><span class="en">${s.nameEn}</span><span class="es">${s.nameEs}</span></div>
          <div class="svc-card-sub"><span class="en">${s.subEn}</span><span class="es">${s.subEs}</span></div>
        </div>
        <div class="svc-card-price">$${s.price.toFixed(2)}${s.billing ? `<span> / ${s.billing === 'annual' ? '<span class="en">yr</span><span class="es">año</span>' : '<span class="en">mo</span><span class="es">mes</span>'}</span>` : ''}</div>
        <div class="svc-chevron" id="chev-${s.id}">${svgIcons.chevron}</div>
      </div>
      <div class="svc-card-body">
        <p class="svc-card-desc"><span class="en">${s.descEn}</span><span class="es">${s.descEs}</span></p>
        <div class="svc-incl-title"><span class="en">What's included</span><span class="es">Qué incluye</span></div>
        ${s.incEn.map((inc, idx) => `<div class="svc-incl-item"><span class="svc-incl-check">&#10003;</span><span class="en">${inc}</span><span class="es">${s.incEs[idx]}</span></div>`).join('')}
        <button class="svc-add" id="btn-${s.id}" onclick="event.stopPropagation();svcToggle('${s.id}')">
          <span class="svc-add-lbl en">Add to order</span><span class="svc-add-lbl es">Agregar al pedido</span>
        </button>
      </div>
    </div>`).join('')

  const body = `
<header class="svc-header">
  <div class="svc-header-inner">
    <a href="/" class="svc-logo">
      <div class="svc-logo-mark"><img src="/fbfc-seal.png" alt="Florida Business Formation Center"/></div>
      <div class="svc-logo-text">Florida Business<br/>Formation Center</div>
    </a>
    <div class="svc-header-right">
      <a href="/client-portal" class="svc-back"><span class="en">Track Order</span><span class="es">Mi Orden</span></a>
      <a href="/" class="svc-back"><span class="en">Home</span><span class="es">Inicio</span></a>
      <div class="svc-lang">
        <button class="active" onclick="svcSetLang('en')">EN</button>
        <button onclick="svcSetLang('es')">ES</button>
      </div>
    </div>
  </div>
</header>

<section class="svc-hero">
  <div class="svc-hero-inner">
    <h1><span class="en">Additional Services</span><span class="es">Servicios Adicionales</span></h1>
    <p>
      <span class="en">Keep your Florida business compliant and growing. Click a service to see what's included — you can select more than one.</span>
      <span class="es">Mantenga su negocio en Florida al día y en crecimiento. Haga clic en un servicio para ver qué incluye — puede seleccionar más de uno.</span>
    </p>
  </div>
</section>

<div class="svc-grid-wrap">
  <div class="services-layout">
    <div class="services-main">
      <div class="svc-grid">${cardsHtml}</div>
    </div>
    <aside class="order-summary">
      <div class="order-summary-card">
        <div class="os-head">
          <h3 class="os-title"><span class="en">Your order</span><span class="es">Tu pedido</span></h3>
          <span class="os-count" id="os-count"></span>
        </div>
        <div class="os-empty" id="os-empty">
          <span class="en">No services added yet. Click a service and add what you need.</span>
          <span class="es">Aún no has agregado servicios. Haz clic en un servicio y agrega lo que necesites.</span>
        </div>
        <div class="os-items" id="os-items"></div>
        <div id="os-foot" style="display:none">
          <div class="os-subtotal-row"><span class="en">Estimated subtotal</span><span class="es">Subtotal estimado</span><strong id="os-subtotal">$0.00</strong></div>
          <button class="os-continue-btn" onclick="svcContinue()"><span class="en">Continue</span><span class="es">Continuar</span> &#8594;</button>
        </div>
      </div>
    </aside>
  </div>
</div>

<div class="svc-bar" id="svc-bar">
  <div class="svc-bar-count"><span id="svc-bar-n">0</span> <span class="en">services selected</span><span class="es">servicios seleccionados</span></div>
  <div class="svc-bar-total">$<span id="svc-bar-total">0.00</span></div>
  <button class="svc-bar-btn" onclick="svcContinue()"><span class="en">Continue</span><span class="es">Continuar</span></button>
</div>

<footer class="svc-footer">
  <div>
    <a href="/terms"><span class="en">Terms &amp; Conditions</span><span class="es">Términos y Condiciones</span></a>
    <a href="/privacy"><span class="en">Privacy Policy</span><span class="es">Política de Privacidad</span></a>
    <a href="/legal"><span class="en">Legal Disclaimer</span><span class="es">Aviso Legal</span></a>
  </div>
  <div style="margin-top:8px">
    <span class="en">Florida Business Formation Center is a privately owned third-party document preparation service and is not affiliated with or endorsed by any government agency.</span>
    <span class="es">Florida Business Formation Center es un servicio privado de preparación de documentos de terceros y no está afiliado ni respaldado por ninguna agencia gubernamental.</span>
  </div>
</footer>

<script>
(function(){
  var PRICES = ${JSON.stringify(Object.fromEntries(services.map(s => [s.id, s.price])))};
  var NAMES = ${JSON.stringify(Object.fromEntries(services.map(s => [s.id, { en: s.nameEn, es: s.nameEs }])))};
  var CHEVRON_SVG = ${JSON.stringify(svgIcons.chevron)};
  var CHECK_SVG = ${JSON.stringify(svgIcons.check)};
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem('flbc_svc_cart') || '[]'); if (!Array.isArray(cart)) cart = []; } catch(e) { cart = []; }

  function persist(){ try { localStorage.setItem('flbc_svc_cart', JSON.stringify(cart)); } catch(e){} }

  function curLang(){ return document.querySelector('.svc-lang button.active') && document.querySelector('.svc-lang button.active').textContent === 'ES' ? 'es' : 'en'; }

  function renderSidebar(){
    var isEs = curLang() === 'es';
    var known = cart.filter(function(id){ return PRICES.hasOwnProperty(id); });
    var n = known.length;
    var total = known.reduce(function(sum, id){ return sum + (PRICES[id] || 0); }, 0);
    var countEl = document.getElementById('os-count');
    if (countEl) { countEl.textContent = n; countEl.className = 'os-count' + (n > 0 ? ' show' : ''); }
    var emptyEl = document.getElementById('os-empty');
    var itemsEl = document.getElementById('os-items');
    var footEl = document.getElementById('os-foot');
    if (emptyEl) emptyEl.style.display = n === 0 ? '' : 'none';
    if (footEl) footEl.style.display = n === 0 ? 'none' : '';
    if (itemsEl) {
      itemsEl.innerHTML = known.map(function(id){
        var name = NAMES[id] ? (isEs ? NAMES[id].es : NAMES[id].en) : id;
        return '<div class="os-item"><button class="os-item-x" onclick="svcToggle(\\'' + id + '\\')">&times;</button>'
          + '<span class="os-item-name">' + name + '</span>'
          + '<span class="os-item-price">$' + (PRICES[id] || 0).toFixed(2) + '</span></div>';
      }).join('');
    }
    var subEl = document.getElementById('os-subtotal'); if (subEl) subEl.textContent = '$' + total.toFixed(2);
  }

  function render(){
    var known = cart.filter(function(id){ return PRICES.hasOwnProperty(id); });
    var n = known.length;
    var total = known.reduce(function(sum, id){ return sum + (PRICES[id] || 0); }, 0);
    var bar = document.getElementById('svc-bar');
    if (bar) bar.className = 'svc-bar' + (n > 0 ? ' show' : '');
    var nEl = document.getElementById('svc-bar-n'); if (nEl) nEl.textContent = n;
    var tEl = document.getElementById('svc-bar-total'); if (tEl) tEl.textContent = total.toFixed(2);
    document.querySelectorAll('.svc-card').forEach(function(card){
      var id = card.getAttribute('data-id');
      var isSel = cart.indexOf(id) !== -1;
      card.classList.toggle('sel', isSel);
      var btn = card.querySelector('.svc-add');
      if (btn) btn.classList.toggle('added', isSel);
      // Etiqueta del botón: "Add to order" -> "✓ Added" (mismo patrón que
      // opabiz.com/servicios) — para que quede claro que ya está en el
      // carrito (ej. los 3 de new-business, ya agregados de entrada).
      var lblEn = document.querySelector('#btn-' + id + ' .svc-add-lbl.en');
      var lblEs = document.querySelector('#btn-' + id + ' .svc-add-lbl.es');
      if (lblEn) lblEn.textContent = isSel ? '✓ Added' : 'Add to order';
      if (lblEs) lblEs.textContent = isSel ? '✓ Agregado' : 'Agregar al pedido';
      // Reemplaza la flecha de expandir por un check verde cuando ya está
      // agregado — la tarjeta sigue abriendo con hover/clic igual.
      var chev = document.getElementById('chev-' + id);
      if (chev) { chev.innerHTML = isSel ? CHECK_SVG : CHEVRON_SVG; chev.classList.toggle('added', isSel); }
    });
    renderSidebar();
  }

  window.svcToggle = function(id){
    var idx = cart.indexOf(id);
    if (idx === -1) cart.push(id); else cart.splice(idx, 1);
    persist();
    render();
    // Cierra el box al agregar/quitar — mismo comportamiento que opabiz.com/servicios.
    var card = document.getElementById('card-' + id);
    if (card) card.classList.remove('expanded');
  };

  window.svcExpand = function(e, id){
    if (e.target.closest('.svc-add')) return;
    var card = document.getElementById('card-' + id);
    if (!card) return;
    var wasExpanded = card.classList.contains('expanded');
    document.querySelectorAll('.svc-card.expanded').forEach(function(c){ c.classList.remove('expanded'); });
    if (!wasExpanded) card.classList.add('expanded');
  };

  // Abre/cierra al pasar el mouse (desktop) — mismo comportamiento que
  // opabiz.com/servicios. svcExpand (clic/chevron) sigue funcionando para
  // touch, donde no hay hover.
  window.svcHoverOpen = function(id){
    var card = document.getElementById('card-' + id);
    if (card) card.classList.add('expanded');
  };
  window.svcHoverClose = function(id){
    var card = document.getElementById('card-' + id);
    if (card) card.classList.remove('expanded');
  };

  window.svcContinue = function(){
    if (cart.length === 0) return;
    persist();
    try { localStorage.removeItem('flbc_svc_bundles'); } catch(e){}
    window.location.href = '/servicios/checkout';
  };

  window.svcSetLang = function(lang){
    // Nunca usar '' (revierte al display del CSS, que es 'none' para .es) —
    // hay que setear el valor explícito o el texto en español desaparece
    // (bug real 2026-08-15: nombres de servicios y botones del header en
    // blanco apenas el idioma activo era español, sin importar refrescar).
    document.querySelectorAll('.en').forEach(function(el){ el.style.display = lang === 'en' ? 'inline' : 'none'; });
    document.querySelectorAll('.es').forEach(function(el){ el.style.display = lang === 'es' ? 'inline' : 'none'; });
    document.querySelectorAll('.svc-lang button').forEach(function(b, i){ b.className = (i === (lang === 'en' ? 0 : 1)) ? 'active' : ''; });
    try { localStorage.setItem('flbc_lang', lang); } catch(e){}
    renderSidebar();
  };

  render();
  try {
    var savedLang = localStorage.getItem('flbc_lang');
    var params = new URLSearchParams(window.location.search);
    var urlLang = params.get('lang');
    var lang = urlLang === 'es' || urlLang === 'en' ? urlLang : (savedLang === 'es' ? 'es' : 'en');
    if (lang === 'es') window.svcSetLang('es');
  } catch(e) {}

  // Safari (y algunos otros navegadores) a veces restauran la página desde
  // su caché de "atrás/adelante" (bfcache) sin volver a correr este script
  // — el contenido que depende de JS (nombres, textos) queda en blanco
  // aunque lo que ya estaba en el HTML (precios, iconos) se vea bien.
  // event.persisted=true detecta esa restauración y recarga la página real.
  window.addEventListener('pageshow', function(e){ if (e.persisted) window.location.reload(); });
})();
</script>
`

  return (
    <div>
      <style>{styles}</style>
      <main dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  )
}
