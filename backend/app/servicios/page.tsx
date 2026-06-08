import type { Metadata } from 'next'
import ChatWidget from '@/components/ChatWidget'

// Schema.org @graph para la página /servicios.
// - CollectionPage envuelve el catálogo
// - ItemList con un Service por cada item del catálogo, con Offer cuando hay
//   precio fijo en USD (Bing es estricto: omite offers para precios variables)
// - BreadcrumbList para jerarquía
// Reusa @id de Organization (provider) declarado en home.
type SchemaService = { id: string; name: string; description: string; priceUsd?: number }

const SERVICIOS_FOR_SCHEMA: SchemaService[] = [
  { id: 'registered-agent', name: 'Registered Agent (Florida)', description: 'Physical FL street address that receives legal documents and government notices on behalf of your LLC or Corporation.' },
  { id: 'ein', name: 'EIN / Tax ID Number', description: 'IRS-issued business tax identification number, required to open a bank account, hire employees, and file taxes.', priceUsd: 49 },
  { id: 'operating-agreement', name: 'Operating Agreement', description: 'Internal LLC document defining ownership, management structure, and member responsibilities. Required by most banks.', priceUsd: 79 },
  { id: 'itin', name: 'ITIN Application', description: 'IRS Individual Taxpayer Identification Number for non-US founders without a Social Security Number.', priceUsd: 135 },
  { id: 'dba', name: 'DBA / Fictitious Name Registration', description: 'Florida Fictitious Name registration so your business can operate under a name different from the legal entity name.', priceUsd: 49 },
  { id: 'virtual-address', name: 'Virtual Mailing Address', description: 'Professional Florida mailing address with mail receipt, scanning, and digital forwarding.' },
  { id: 'annual-report', name: 'Annual Report Filing', description: 'Yearly required filing with the Florida Division of Corporations to keep the entity active.' },
  { id: 'amendment', name: 'Articles of Amendment', description: 'Filing to change company name, registered agent, address, or member structure with the State of Florida.', priceUsd: 59 },
  { id: 'banking-resolution', name: 'Banking Resolution', description: 'Corporate document authorizing signers and account openings, commonly required by banks.', priceUsd: 49 },
  { id: 'business-tax-receipt', name: 'Business Tax Receipt', description: 'Local business tax receipt (occupational license) required by most Florida counties and municipalities to operate.', priceUsd: 79 },
  { id: 'sales-tax-registration', name: 'Sales Tax Registration', description: 'Florida Department of Revenue sales tax permit (Form DR-1) for businesses selling taxable goods or services.', priceUsd: 79 },
  { id: 'exclusive-guide', name: 'Exclusive Formation Guide', description: 'Curated bilingual guide covering post-formation steps to keep your Florida business compliant.', priceUsd: 49 },
  { id: 'good-standing', name: 'Certificate of Good Standing', description: 'Official Florida certificate confirming your business is active and up-to-date with state filings.', priceUsd: 49 },
  { id: 'scorp-election', name: 'S-Corp Election (IRS Form 2553)', description: 'Federal tax election to be treated as an S Corporation for pass-through taxation.', priceUsd: 79 },
  { id: 'foreign-llc', name: 'Foreign LLC / Corp Registration', description: 'Register an out-of-state LLC or Corporation to legally do business in Florida.', priceUsd: 99 },
  { id: 'business-license', name: 'Business License Research & Filing', description: 'Identify and file the federal, state, and local licenses your business needs to operate legally.', priceUsd: 99 },
  { id: 'dissolution', name: 'Business Dissolution', description: 'Formal dissolution filing with the Florida Division of Corporations to close an LLC or Corporation cleanly.', priceUsd: 79 },
  { id: 'cierre-fiscal', name: 'Tax Account Closure', description: 'Close federal and state tax accounts (IRS, FL DOR) after dissolving a business.', priceUsd: 79 },
]

const serviciosSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': 'https://opabiz.com/servicios',
      url: 'https://opabiz.com/servicios',
      name: 'Florida Business Services Catalog',
      description:
        'Full catalog of Florida business services: LLC formation, EIN, Operating Agreement, Registered Agent, Annual Report, DBA, ITIN and more. Bilingual EN/ES.',
      inLanguage: 'en-US',
      isPartOf: { '@id': 'https://opabiz.com/#website' },
      breadcrumb: { '@id': 'https://opabiz.com/servicios#breadcrumb' },
      mainEntity: { '@id': 'https://opabiz.com/servicios#itemlist' },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://opabiz.com/servicios#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://opabiz.com' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://opabiz.com/servicios' },
      ],
    },
    {
      '@type': 'ItemList',
      '@id': 'https://opabiz.com/servicios#itemlist',
      name: 'Florida Business Services',
      numberOfItems: SERVICIOS_FOR_SCHEMA.length,
      itemListElement: SERVICIOS_FOR_SCHEMA.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Service',
          '@id': `https://opabiz.com/servicios#${s.id}`,
          name: s.name,
          description: s.description,
          serviceType: 'Business Formation & Compliance',
          areaServed: { '@type': 'State', name: 'Florida' },
          provider: { '@id': 'https://opabiz.com/#organization' },
          ...(s.priceUsd !== undefined
            ? {
                offers: {
                  '@type': 'Offer',
                  price: s.priceUsd,
                  priceCurrency: 'USD',
                  availability: 'https://schema.org/InStock',
                  url: `https://opabiz.com/servicios#${s.id}`,
                },
              }
            : {}),
        },
      })),
    },
  ],
}

export const metadata: Metadata = {
  title: 'Florida Business Services — LLC, Corporation, EIN, Registered Agent & More',
  description: 'Full catalog of Florida business services: LLC formation, Corporation, EIN, Operating Agreement, Registered Agent, Annual Report, DBA, ITIN, and more. Bilingual EN/ES.',
  alternates: {
    canonical: 'https://opabiz.com/servicios',
    languages: {
      'en-US': 'https://opabiz.com/servicios',
      'es-US': 'https://opabiz.com/servicios?lang=es',
    },
  },
  openGraph: {
    url: 'https://opabiz.com/servicios',
    title: 'Florida Business Services — LLC, Corporation, EIN & More',
    description: 'Everything your Florida business needs: LLC and Corporation formation, EIN, Operating Agreement, Registered Agent, Annual Report, DBA, ITIN, and more.',
  },
}

export default function ServiciosPage() {
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
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
  }

  type Service = { id: string; icon: string; name: string; name_es: string; price: string; sub_en: string; sub_es: string; desc_en: string; desc_es: string; includes_en: string[]; includes_es: string[]; time_en: string; time_es: string; btn_en: string; btn_es: string }
  const services: Service[] = [
    { id: 'registered-agent', icon: 'home', name: 'Registered Agent', name_es: 'Agente Registrado', price: 'Annual',
      sub_en: 'Required by FL law', sub_es: 'Requerido por ley en FL',
      desc_en: 'Every Florida LLC and Corporation must have a Registered Agent with a physical FL street address. We receive your legal documents, tax notices, and official mail on your behalf.',
      desc_es: 'Toda LLC y Corporación de Florida debe tener un Agente Registrado con dirección física en FL. Nosotros recibimos tus documentos legales, notificaciones fiscales y correspondencia oficial en tu nombre.',
      includes_en: ['Official FL street address for your business','Accepts service of process &amp; legal documents','Change of Registered Agent filed with state','Document forwarding &amp; email notifications'],
      includes_es: ['Dirección oficial en FL para tu negocio','Acepta notificaciones y documentos legales','Cambio de Agente Registrado tramitado ante el estado','Reenvío de documentos y notificación por correo'],
      time_en: '&#9889; Processing: Same business day filing with FL Division of Corporations',
      time_es: '&#9889; Procesamiento: Presentación el mismo día hábil ante la División de Corporaciones FL',
      btn_en: 'Order Registered Agent Service &#8594;', btn_es: 'Ordenar servicio de Agente Registrado &#8594;' },
    { id: 'ein', icon: 'hash', name: 'EIN / Tax ID Number', name_es: 'EIN / Número de Identificación Fiscal', price: '$49',
      sub_en: 'One-time fee', sub_es: 'Pago único',
      desc_en: 'Your federal Employer Identification Number (EIN) is a 9-digit IRS number required to open a business bank account, hire employees, and file federal taxes.',
      desc_es: 'Tu Número de Identificación Fiscal federal (EIN) es un número de 9 dígitos del IRS necesario para abrir cuenta bancaria de negocios, contratar empleados y presentar impuestos federales.',
      includes_en: ['IRS EIN application preparation and submission','EIN confirmation letter (PDF)','Email confirmation with EIN number','Required to open a business bank account'],
      includes_es: ['Preparación y envío de la solicitud de EIN ante el IRS','Carta de confirmación del EIN (PDF)','Confirmación por correo con tu número de EIN','Necesario para abrir cuenta bancaria de negocios'],
      time_en: '&#9889; Processing: Typically 1–3 business days via IRS',
      time_es: '&#9889; Procesamiento: Típicamente 1-3 días hábiles vía IRS',
      btn_en: 'Order EIN — $49 &#8594;', btn_es: 'Ordenar EIN — $49 &#8594;' },
    { id: 'operating-agreement', icon: 'file-text', name: 'Operating Agreement', name_es: 'Acuerdo Operativo', price: '$79',
      sub_en: 'One-time fee', sub_es: 'Pago único',
      desc_en: "The Operating Agreement is your LLC's internal governing document — it defines ownership percentages, management roles, profit distribution, and decision-making rules.",
      desc_es: 'El Acuerdo Operativo es el documento interno de gobierno de tu LLC — define porcentajes de propiedad, roles de gestión, distribución de ganancias y reglas para la toma de decisiones.',
      includes_en: ['Custom Operating Agreement (LLC)','Ownership &amp; management structure','Profit/loss distribution clauses','Required by most FL banks to open accounts'],
      includes_es: ['Acuerdo Operativo personalizado para tu LLC','Estructura de propiedad y gestión','Cláusulas de distribución de ganancias y pérdidas','Requerido por la mayoría de bancos en FL'],
      time_en: '&#9889; Processing: 2–5 business days',
      time_es: '&#9889; Procesamiento: 2-5 días hábiles',
      btn_en: 'Order Operating Agreement — $79 &#8594;', btn_es: 'Ordenar Acuerdo Operativo — $79 &#8594;' },
    { id: 'itin', icon: 'globe', name: 'ITIN Application', name_es: 'Solicitud de ITIN', price: '$135',
      sub_en: 'One-time fee', sub_es: 'Pago único',
      desc_en: 'An ITIN (Individual Taxpayer Identification Number) is issued by the IRS to individuals who need to file US taxes but are not eligible for a Social Security Number.',
      desc_es: 'Un ITIN (Número de Identificación Fiscal Individual) es emitido por el IRS a personas que necesitan presentar impuestos en USA pero no califican para un Social Security Number.',
      includes_en: ['IRS Form W-7 preparation','Document checklist &amp; guidance','Submission support to IRS CAA','For foreign nationals, non-resident aliens'],
      includes_es: ['Preparación del Formulario W-7 del IRS','Lista de documentos y guía personalizada','Apoyo en envío a CAA del IRS','Para extranjeros y no residentes'],
      time_en: '&#128338; Processing: 6–10 weeks (IRS processing time)',
      time_es: '&#128338; Procesamiento: 6-10 semanas (tiempo del IRS)',
      btn_en: 'Order ITIN Application — $135 &#8594;', btn_es: 'Ordenar solicitud de ITIN — $135 &#8594;' },
    { id: 'dba', icon: 'tag', name: 'DBA / Fictitious Name', name_es: 'DBA / Nombre Ficticio', price: '$49',
      sub_en: '+ FL state fee', sub_es: '+ tarifa estatal de FL',
      desc_en: 'A DBA (Doing Business As) or Fictitious Name lets your business operate under a different name from its registered legal name. Required for branding under an alternate name in Florida.',
      desc_es: 'Un DBA (Doing Business As) o Nombre Ficticio permite que tu negocio opere bajo un nombre distinto al nombre legal registrado. Requerido para operar con un nombre alterno en Florida.',
      includes_en: ['Fictitious Name registration with State of FL','Name availability search','Florida Fictitious Name Registration Certificate','Valid for 5 years (FL requirement)'],
      includes_es: ['Registro de Nombre Ficticio con el Estado de FL','Búsqueda de disponibilidad del nombre','Certificado de Registro de Nombre Ficticio de Florida','Vigencia de 5 años (requisito FL)'],
      time_en: '&#9889; Processing: 3–7 business days',
      time_es: '&#9889; Procesamiento: 3-7 días hábiles',
      btn_en: 'Order DBA Filing — $49 &#8594;', btn_es: 'Ordenar registro de DBA — $49 &#8594;' },
    { id: 'virtual-address', icon: 'map-pin', name: 'Virtual Mailing Address', name_es: 'Dirección Virtual de Correo', price: '$29/mo',
      sub_en: 'Cancel anytime', sub_es: 'Cancela cuando quieras',
      desc_en: 'Get a professional Florida business address. Your home address stays private on all public Florida Division of Corporations records.',
      desc_es: 'Obtén una dirección profesional de negocios en Florida. Tu dirección personal se mantiene privada en los registros públicos de la División de Corporaciones.',
      includes_en: ['Professional FL mailing address','Mail receiving &amp; digital forwarding','Home address stays private on public records','Available immediately after sign-up'],
      includes_es: ['Dirección postal profesional en Florida','Recepción de correo y reenvío digital','Tu dirección personal no aparece en registros públicos','Activo inmediatamente al inscribirte'],
      time_en: '&#9889; Activation: Same business day',
      time_es: '&#9889; Activación: El mismo día hábil',
      btn_en: 'Order Virtual Address — $29/mo &#8594;', btn_es: 'Ordenar Dirección Virtual — $29/mes &#8594;' },
    { id: 'annual-report', icon: 'calendar', name: 'Annual Report Filing', name_es: 'Presentación de Reporte Anual', price: 'Annual',
      sub_en: 'FL Deadline: May 1', sub_es: 'Fecha Límite FL: 1 de mayo',
      desc_en: 'Every Florida LLC and Corporation must file an Annual Report between January 1 and May 1. Missing this deadline results in a $400 late fee and potential administrative dissolution.',
      desc_es: 'Toda LLC y Corporación de Florida debe presentar un Reporte Anual entre el 1 de enero y el 1 de mayo. Perder la fecha límite resulta en multa de $400 y posible disolución administrativa.',
      includes_en: ['Annual Report filed with FL Division of Corps','Updates to officers, directors, agent info','On-time filing guaranteed before May 1','Email confirmation receipt'],
      includes_es: ['Reporte Anual presentado ante la División de Corporaciones FL','Actualización de oficiales, directores e info del agente','Presentación garantizada antes del 1 de mayo','Confirmación de recibo por correo'],
      time_en: '&#9888; FL Deadline: Jan 1 – May 1 each year ($400 late fee after May 1)',
      time_es: '&#9888; Fecha Límite FL: 1 ene – 1 may cada año (multa de $400 después del 1 de mayo)',
      btn_en: 'Order Annual Report Filing &#8594;', btn_es: 'Ordenar presentación de Reporte Anual &#8594;' },
    { id: 'amendment', icon: 'pencil', name: 'Articles of Amendment', name_es: 'Artículos de Enmienda', price: '$59',
      sub_en: '+ FL state fee', sub_es: '+ tarifa estatal de FL',
      desc_en: 'Need to change your business name, address, registered agent, or officers? We prepare and file Articles of Amendment with the Florida Division of Corporations on your behalf.',
      desc_es: '¿Necesitas cambiar el nombre de tu negocio, dirección, agente registrado u oficiales? Preparamos y presentamos los Artículos de Enmienda ante la División de Corporaciones de Florida por ti.',
      includes_en: ['Amendment document preparation','Filing with FL Division of Corporations','Amended certificate returned to you','Name change, address, officers, purpose'],
      includes_es: ['Preparación del documento de enmienda','Presentación ante la División de Corporaciones FL','Certificado enmendado devuelto a ti','Cambio de nombre, dirección, oficiales, propósito'],
      time_en: '&#9889; Processing: 5–10 business days after submission',
      time_es: '&#9889; Procesamiento: 5-10 días hábiles después del envío',
      btn_en: 'Order Articles of Amendment — $59 &#8594;', btn_es: 'Ordenar Artículos de Enmienda — $59 &#8594;' },
    { id: 'banking-resolution', icon: 'landmark', name: 'Banking Resolution', name_es: 'Resolución Bancaria', price: '$49',
      sub_en: 'One-time fee', sub_es: 'Pago único',
      desc_en: 'A Banking Resolution authorizes a member or officer to open a business bank account on behalf of your LLC or Corporation. Most banks require this document before opening your account.',
      desc_es: 'Una Resolución Bancaria autoriza a un miembro u oficial a abrir una cuenta bancaria de negocios en nombre de tu LLC o Corporación. La mayoría de los bancos exigen este documento antes de abrirte la cuenta.',
      includes_en: ['Custom Banking Resolution document','Authorizes account opening on behalf of LLC','Accepted by most U.S. banks','Delivered by email (PDF)'],
      includes_es: ['Documento de Resolución Bancaria personalizado','Autoriza la apertura de cuenta en nombre de la LLC','Aceptado por la mayoría de bancos en USA','Entregado por correo (PDF)'],
      time_en: '&#9889; Processing: 1–2 business days',
      time_es: '&#9889; Procesamiento: 1-2 días hábiles',
      btn_en: 'Order Banking Resolution — $49 &#8594;', btn_es: 'Ordenar Resolución Bancaria — $49 &#8594;' },
    { id: 'business-tax-receipt', icon: 'receipt', name: 'Business Tax Receipt', name_es: 'Recibo de Impuesto Empresarial', price: '$79',
      sub_en: '+ county fee', sub_es: '+ tarifa del condado',
      desc_en: 'A Business Tax Receipt (formerly Occupational License) is required to legally operate your business in most Florida counties. We handle the application and filing with your local county.',
      desc_es: 'Un Business Tax Receipt (antes Licencia Ocupacional) es requerido para operar legalmente tu negocio en la mayoría de condados de Florida. Nosotros manejamos la solicitud y presentación ante tu condado local.',
      includes_en: ['County-specific BTR application preparation','Filing with your local Florida county','Required to legally operate in FL counties','Business Tax Receipt certificate delivered'],
      includes_es: ['Preparación de la solicitud de BTR específica de tu condado','Presentación ante tu condado local de Florida','Requerido para operar legalmente en condados de FL','Certificado de Business Tax Receipt entregado'],
      time_en: '&#9889; Processing: 3–7 business days',
      time_es: '&#9889; Procesamiento: 3-7 días hábiles',
      btn_en: 'Order Business Tax Receipt — $79 &#8594;', btn_es: 'Ordenar Business Tax Receipt — $79 &#8594;' },
    { id: 'sales-tax-registration', icon: 'trending-up', name: 'Sales Tax Registration', name_es: 'Registro de Impuesto sobre Ventas', price: '$79',
      sub_en: 'One-time fee', sub_es: 'Pago único',
      desc_en: 'Any Florida business that sells products or taxable services must register with the Florida Department of Revenue to collect and remit sales tax. We handle the registration on your behalf.',
      desc_es: 'Todo negocio en Florida que vende productos o servicios gravables debe registrarse con el Departamento de Ingresos de Florida para cobrar y remitir el impuesto sobre ventas. Manejamos el registro por ti.',
      includes_en: ['FL Department of Revenue registration','Sales tax certificate (DR-11)','Required for businesses selling taxable goods','Filing instructions included'],
      includes_es: ['Registro con el Departamento de Ingresos de FL','Certificado de impuesto sobre ventas (DR-11)','Requerido para negocios que venden bienes gravables','Instrucciones de presentación incluidas'],
      time_en: '&#9889; Processing: 2–5 business days',
      time_es: '&#9889; Procesamiento: 2-5 días hábiles',
      btn_en: 'Order Sales Tax Registration — $79 &#8594;', btn_es: 'Ordenar Registro de Impuesto sobre Ventas — $79 &#8594;' },
    { id: 'exclusive-guide', icon: 'book-open', name: 'Exclusive Formation Guide', name_es: 'Guía Exclusiva de Formación', price: '$49',
      sub_en: 'One-time fee', sub_es: 'Pago único',
      desc_en: 'Our Exclusive Formation Guide gives you everything you need to get your Florida business off to the best possible start — from banking requirements to compliance checklists.',
      desc_es: 'Nuestra Guía Exclusiva de Formación te da todo lo que necesitas para que tu negocio en Florida arranque de la mejor forma — desde requisitos bancarios hasta listas de cumplimiento legal.',
      includes_en: ['Step-by-step post-formation checklist','Banking requirements &amp; account opening tips','Florida compliance calendar &amp; deadlines','Delivered by email (PDF)'],
      includes_es: ['Lista de verificación paso a paso post-formación','Requisitos bancarios y tips para abrir cuenta','Calendario de cumplimiento y fechas límite de Florida','Entregada por correo (PDF)'],
      time_en: '&#9889; Delivery: Same business day',
      time_es: '&#9889; Entrega: El mismo día hábil',
      btn_en: 'Order Exclusive Guide — $49 &#8594;', btn_es: 'Ordenar Guía Exclusiva — $49 &#8594;' },
    { id: 'good-standing', icon: 'award', name: 'Certificate of Good Standing', name_es: 'Certificado de Buena Reputación', price: '$49',
      sub_en: '+ FL state fee', sub_es: '+ tarifa estatal de FL',
      desc_en: 'A Certificate of Good Standing proves your business is active and compliant with the State of Florida. Required by banks, investors, and government agencies before entering contracts.',
      desc_es: 'Un Certificado de Buena Reputación prueba que tu negocio está activo y en cumplimiento con el Estado de Florida. Requerido por bancos, inversionistas y agencias gubernamentales antes de firmar contratos.',
      includes_en: ['Official certificate from FL Division of Corps','Certified digital &amp; physical copy','Accepted by banks, investors &amp; agencies','Apostille available upon request'],
      includes_es: ['Certificado oficial de la División de Corporaciones FL','Copia digital y física certificada','Aceptado por bancos, inversionistas y agencias','Apostilla disponible a solicitud'],
      time_en: '&#9889; Processing: 1–3 business days',
      time_es: '&#9889; Procesamiento: 1-3 días hábiles',
      btn_en: 'Order Certificate — $49 &#8594;', btn_es: 'Ordenar Certificado — $49 &#8594;' },
    { id: 'scorp-election', icon: 'star', name: 'S-Corp Election (Form 2553)', name_es: 'Elección de S-Corp (Formulario 2553)', price: '$79',
      sub_en: 'One-time fee', sub_es: 'Pago único',
      desc_en: 'Elect S-Corporation tax status with the IRS to save on self-employment taxes. Available for existing LLCs and C-Corps. Must be filed within 75 days of formation or by March 15.',
      desc_es: 'Elige el estatus fiscal de Corporación S con el IRS para ahorrar en impuestos de trabajo por cuenta propia. Disponible para LLCs y Corporaciones C existentes. Debe presentarse dentro de 75 días tras la formación o antes del 15 de marzo.',
      includes_en: ['IRS Form 2553 preparation &amp; submission','IRS acceptance confirmation letter','Deadline guidance &amp; tax year advisory','Only for U.S. citizens &amp; permanent residents'],
      includes_es: ['Preparación y envío del Formulario 2553 del IRS','Carta de aceptación del IRS','Asesoría sobre fechas límite y año fiscal','Solo para ciudadanos y residentes permanentes de USA'],
      time_en: '&#9889; Processing: 2–4 weeks (IRS processing)',
      time_es: '&#9889; Procesamiento: 2-4 semanas (procesamiento del IRS)',
      btn_en: 'Order S-Corp Election — $79 &#8594;', btn_es: 'Ordenar Elección de S-Corp — $79 &#8594;' },
    { id: 'foreign-llc', icon: 'globe-2', name: 'Foreign LLC / Corp Registration', name_es: 'Registro de LLC / Corp Extranjera', price: '$99',
      sub_en: '+ state filing fee', sub_es: '+ tarifa estatal de presentación',
      desc_en: 'If your Florida LLC or Corporation operates in another U.S. state, you must register as a Foreign Entity in that state. We handle the filing so your business stays legally compliant.',
      desc_es: 'Si tu LLC o Corporación de Florida opera en otro estado de USA, debes registrarte como Entidad Extranjera en ese estado. Manejamos la presentación para que tu negocio cumpla la ley.',
      includes_en: ['Foreign qualification filing in target state','Certificate of Authority from FL Division of Corps','Registered Agent in target state included','Available for all 50 U.S. states'],
      includes_es: ['Calificación como Entidad Extranjera en el estado destino','Certificado de Autoridad de la División de Corporaciones FL','Agente Registrado en el estado destino incluido','Disponible para los 50 estados de USA'],
      time_en: '&#9889; Processing: 5–10 business days',
      time_es: '&#9889; Procesamiento: 5-10 días hábiles',
      btn_en: 'Order Foreign Registration — $99 &#8594;', btn_es: 'Ordenar Registro de Entidad Extranjera — $99 &#8594;' },
    { id: 'business-license', icon: 'clipboard-list', name: 'Business License', name_es: 'Licencia de Negocios', price: '$99',
      sub_en: 'One-time fee', sub_es: 'Pago único',
      desc_en: 'We handle the application for your Florida business license — identifying exactly which federal, state, and local licenses your business needs and filing them on your behalf.',
      desc_es: 'Manejamos la solicitud de tu licencia de negocios de Florida — identificamos qué licencias federales, estatales y locales necesita tu negocio, y las presentamos en tu nombre.',
      includes_en: ['Federal, state &amp; local license application','Industry-specific &amp; location-based filing','Step-by-step application process','Confirmation delivered by email'],
      includes_es: ['Solicitud de licencia federal, estatal y local','Presentación específica para tu industria y ubicación','Proceso de solicitud paso a paso','Confirmación entregada por correo'],
      time_en: '&#9889; Processing: 2–3 business days',
      time_es: '&#9889; Procesamiento: 2-3 días hábiles',
      btn_en: 'Order Business License — $99 &#8594;', btn_es: 'Ordenar Licencia de Negocios — $99 &#8594;' },
    { id: 'dissolution', icon: 'archive', name: 'Business Dissolution', name_es: 'Disolución del Negocio', price: '$79',
      sub_en: '+ FL state fee', sub_es: '+ tarifa estatal de FL',
      desc_en: 'Closing your business? We properly dissolve your Florida LLC or Corporation with the state so you stop accumulating annual fees and avoid future liability.',
      desc_es: '¿Cerrando tu negocio? Disolvemos correctamente tu LLC o Corporación de Florida ante el estado para que dejes de acumular tarifas anuales y evites responsabilidades futuras.',
      includes_en: ['Articles of Dissolution prepared &amp; filed','FL Division of Corporations submission','Dissolution confirmation from the state','Stops annual report obligations'],
      includes_es: ['Artículos de Disolución preparados y presentados','Envío a la División de Corporaciones FL','Confirmación de disolución por parte del estado','Detiene la obligación del Reporte Anual'],
      time_en: '&#9889; Processing: 3–7 business days',
      time_es: '&#9889; Procesamiento: 3-7 días hábiles',
      btn_en: 'Order Dissolution — $79 &#8594;', btn_es: 'Ordenar Disolución — $79 &#8594;' },
    { id: 'cierre-fiscal', icon: 'lock', name: 'Tax Account Closure', name_es: 'Cierre de Cuentas Fiscales', price: '$79',
      sub_en: 'One-time fee', sub_es: 'Pago único',
      desc_en: 'Closing your business? We handle the proper closure of your tax accounts with the IRS and Florida Department of Revenue so you avoid future tax obligations and penalties.',
      desc_es: '¿Cerrando tu negocio? Manejamos el cierre correcto de tus cuentas fiscales con el IRS y el Departamento de Ingresos de Florida para que evites obligaciones fiscales y multas futuras.',
      includes_en: ['IRS EIN account closure letter preparation','FL Department of Revenue account closure','Guidance on final tax return obligations','Confirmation documents delivered by email'],
      includes_es: ['Preparación de carta de cierre de cuenta EIN con el IRS','Cierre de cuenta con el Departamento de Ingresos de FL','Guía sobre obligaciones de declaración final','Documentos de confirmación entregados por correo'],
      time_en: '&#9889; Processing: 5–10 business days',
      time_es: '&#9889; Procesamiento: 5-10 días hábiles',
      btn_en: 'Order Tax Account Closure — $79 &#8594;', btn_es: 'Ordenar Cierre de Cuentas Fiscales — $79 &#8594;' }
  ]

  const servicesAccordionHtml = services.map(s => `
    <div class="svc-acc-item" data-svc="${s.id}" id="${s.id}" onclick="touchSvc(this)">
      <div class="svc-acc-header">
        <div class="svc-acc-icon">${svgIcons[s.icon] || svgIcons['file-text']}</div>
        <div class="svc-acc-title-wrap">
          <div class="svc-acc-title" data-en="${s.name}" data-es="${s.name_es}">${s.name_es}</div>
          <div class="svc-acc-sub" data-en="${s.sub_en}" data-es="${s.sub_es}">${s.sub_es}</div>
        </div>
        <div class="svc-acc-price">${s.price}</div>
        <div class="svc-acc-chevron">${svgIcons.chevron}</div>
      </div>
      <div class="svc-popup" onmouseenter="clearTimeout(_svcTimer)" onmouseleave="deactivateSvc()">
        <div class="svc-popup-head">
          <div class="svc-popup-icon">${svgIcons[s.icon] || svgIcons['file-text']}</div>
          <div class="svc-popup-title-wrap">
            <div class="svc-popup-name" data-en="${s.name}" data-es="${s.name_es}">${s.name_es}</div>
            <div class="svc-popup-sub" data-en="${s.sub_en}" data-es="${s.sub_es}">${s.sub_es}</div>
          </div>
          <div class="svc-popup-price">${s.price}</div>
        </div>
        <div class="svc-popup-content">
          <div class="svc-popup-left">
            <p class="svc-popup-desc" data-en="${s.desc_en}" data-es="${s.desc_es}">${s.desc_es}</p>
            <div class="svc-popup-time" data-en="${s.time_en}" data-es="${s.time_es}">${s.time_es}</div>
          </div>
          <div class="svc-popup-right">
            <div class="svc-popup-includes">
              <div class="svc-popup-includes-title" data-en="What's included" data-es="Qué incluye">Qué incluye</div>
              ${s.includes_es.map((inc, idx) => `<div class="svc-popup-incl-item" data-en="${s.includes_en[idx]}" data-es="${inc}"><span class="svc-popup-incl-icon">&#10003;</span>${inc}</div>`).join('')}
            </div>
            <button class="svc-popup-btn" onclick="openServiceForm('${s.id}')" data-en="${s.btn_en}" data-es="${s.btn_es}">${s.btn_es}</button>
          </div>
        </div>
      </div>
      <div class="svc-mobile-expand">
        <p class="svc-mexp-desc" data-en="${s.desc_en}" data-es="${s.desc_es}">${s.desc_es}</p>
        <div class="svc-mexp-includes-title svc-includes-title" data-en="What's included" data-es="Qué incluye">Qué incluye</div>
        <div class="svc-mexp-includes">
          ${s.includes_es.map((inc, idx) => `<div class="svc-mexp-incl-item" data-en="${s.includes_en[idx]}" data-es="${inc}"><span class="svc-popup-incl-icon">&#10003;</span>${inc}</div>`).join('')}
        </div>
        <div class="svc-mexp-time" data-en="${s.time_en}" data-es="${s.time_es}">${s.time_es}</div>
        <button class="svc-mexp-btn" onclick="openServiceForm('${s.id}')" data-en="${s.btn_en}" data-es="${s.btn_es}">${s.btn_es}</button>
      </div>
    </div>
  `).join('')

  const styles = `
:root{--navy:#1C2E44;--navy2:#22364E;--blue:#2563EB;--blue-light:#EFF6FF;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--gold:#F59E0B;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray500:#64748B;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',sans-serif;color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3,h4{font-family:'Fraunces',serif;line-height:1.15}
a{text-decoration:none;color:inherit}
.topbar{background:var(--navy);color:#fff;font-size:.77rem;padding:9px 24px;text-align:center}
.topbar strong{color:var(--gold)}
header{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray200);padding:0 32px;transition:box-shadow .3s}
header.scrolled{box-shadow:0 2px 20px rgba(28,46,68,.1)}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:66px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;background:linear-gradient(135deg,var(--navy),var(--blue));border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Fraunces',serif;font-size:1rem;font-weight:700;flex-shrink:0}
.logo-text{font-family:'Fraunces',serif;font-size:1.5rem;color:var(--navy);font-weight:700;line-height:1.2}
.logo-text span{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:.63rem;color:var(--gray400);font-weight:400;letter-spacing:.8px;text-transform:uppercase}
.logo-text span.logo-opa{display:inline;font-size:1.5rem;color:var(--navy);font-style:normal;letter-spacing:-.5px;text-transform:none;font-family:'Fraunces',serif;font-weight:700}
.logo-text span.logo-biz{display:inline;font-size:1.5rem;color:#2563EB;font-style:normal;letter-spacing:-.5px;text-transform:none;font-family:'Fraunces',serif;font-weight:700}
nav a{font-size:.82rem;font-weight:500;color:var(--gray600);padding:6px 10px;border-radius:6px;transition:all .2s;margin-left:2px}
nav a:hover{color:var(--navy);background:var(--gray100)}
.lang-toggle{display:flex;background:var(--gray100);border-radius:20px;padding:3px;gap:2px}
.lang-btn{padding:5px 12px;border-radius:16px;border:none;cursor:pointer;font-size:.77rem;font-weight:600;font-family:inherit;transition:all .2s;color:var(--gray400);background:transparent}
.lang-btn.active{background:var(--navy);color:#fff}
.hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:8px;margin-right:-6px;flex-shrink:0}
.hamburger span{display:block;width:22px;height:2px;background:var(--navy);border-radius:2px;transition:all 0.3s}
.hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.hamburger.open span:nth-child(2){opacity:0}
.hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
@media(max-width:768px){nav{display:none}nav.open{display:flex;flex-direction:column;position:absolute;top:62px;left:-16px;right:-16px;background:#fff;padding:10px 16px 14px;border-bottom:1px solid var(--gray200);box-shadow:0 8px 24px rgba(0,0,0,0.08);z-index:200;gap:2px}nav.open a{padding:11px 12px;font-size:.92rem;border-radius:8px;font-weight:500;margin-left:0}nav.open a:hover{background:var(--gray100)}.hamburger{display:flex}header{position:relative;padding:0 16px}.logo-text{font-size:1rem}.logo-text span{display:none}.page-hero{padding:28px 20px 26px}.page-hero h1{font-size:clamp(1.6rem,7vw,2.4rem)}}
/* PAGE HERO */
.page-hero{background:linear-gradient(135deg,var(--navy),#1a3a6b);padding:52px 32px 48px;text-align:center}
.page-hero-inner{max-width:700px;margin:0 auto;position:relative;z-index:1}
.hero-badge{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.9);font-size:.7rem;font-weight:600;padding:5px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:18px}
.page-hero h1{font-size:clamp(2rem,4.5vw,3rem);color:#fff;font-weight:700;margin-bottom:12px;letter-spacing:0}
.page-hero h1 em{color:var(--blue);font-style:normal}
.page-hero p{font-size:.95rem;color:rgba(255,255,255,.78);line-height:1.6;margin:0}
.hero-services-list{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:4px}
.hs-item{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:9px 13px;cursor:pointer;transition:all .2s;font-size:.82rem;color:rgba(255,255,255,.85)}
.hs-item:hover{background:rgba(255,255,255,.14);color:#fff}
.hs-icon{font-size:1.1rem;flex-shrink:0}
/* TRUST BAR */
.trust-bar{background:var(--gray50);border-bottom:1px solid var(--gray200);padding:13px 32px}
.trust-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:28px;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:6px;font-size:.75rem;font-weight:500;color:var(--gray600)}
.trust-check{color:var(--green);font-weight:700;font-size:.71rem;background:var(--green-light);padding:2px 6px;border-radius:4px}
.trust-sep{width:1px;height:14px;background:var(--gray200)}
/* SERVICES GRID */
.services-section{padding:64px 32px;background:var(--white)}
.services-inner{max-width:1280px;margin:0 auto}
.section-label{display:inline-block;font-size:.7rem;font-weight:600;color:var(--blue);text-transform:uppercase;letter-spacing:1.3px;margin-bottom:12px}
.section-title{font-size:clamp(1.8rem,3.5vw,2.6rem);color:var(--navy);font-weight:700;margin-bottom:8px}
.section-sub{font-size:1rem;color:var(--gray600);max-width:560px;font-weight:300}
.services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:40px}
@media(max-width:1100px){.services-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.services-grid{grid-template-columns:1fr}}
/* SERVICE CARDS */
.svc-card{border:1.5px solid var(--gray200);border-radius:16px;overflow:hidden;transition:all .25s;display:flex;flex-direction:column;background:var(--white)}
.svc-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(28,46,68,.10);border-color:var(--blue)}
.svc-card-header{padding:24px 22px 18px;background:var(--white);border-bottom:1px solid var(--gray100)}
.svc-card-header.blue,.svc-card-header.green,.svc-card-header.gold,.svc-card-header.purple,.svc-card-header.teal,.svc-card-header.orange,.svc-card-header.slate{background:var(--white)}
.svc-icon-wrap{width:44px;height:44px;background:var(--blue-light);border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.svc-icon{font-size:1.4rem}
.svc-name{font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:8px}
.svc-price{display:flex;align-items:baseline;gap:4px;margin-bottom:2px}
.svc-price strong{font-family:'Fraunces',serif;font-size:1.7rem;font-weight:900;color:var(--navy);line-height:1}
.svc-price-sub{font-size:.75rem;color:var(--gray400);margin-top:2px}
.svc-body{padding:18px 22px;flex:1;display:flex;flex-direction:column;gap:0}
.svc-desc{font-size:.83rem;color:var(--gray600);line-height:1.75;margin-bottom:14px}
.svc-includes{margin-bottom:16px}
.svc-includes-title{font-size:.71rem;font-weight:600;color:var(--gray400);text-transform:uppercase;letter-spacing:.6px;margin-bottom:7px}
.svc-incl-item{display:flex;align-items:flex-start;gap:7px;font-size:.79rem;color:var(--gray800);margin-bottom:5px}
.svc-incl-icon{color:var(--green);margin-top:2px;font-size:.85rem;flex-shrink:0}
.svc-time{display:flex;align-items:center;gap:6px;font-size:.73rem;color:var(--gray500);margin-bottom:14px;padding:7px 10px;background:var(--gray50);border-radius:7px}
.btn-svc-order{background:#fff;color:var(--navy);padding:11px;border-radius:9px;font-size:.87rem;font-weight:600;border:1.5px solid var(--gray200);cursor:pointer;font-family:inherit;transition:all .2s;width:100%;margin-top:auto}
.btn-svc-order:hover{border-color:var(--blue);color:var(--blue);transform:translateY(-1px)}
.btn-svc-order.green,.btn-svc-order.gold{background:#fff;color:var(--navy);border:1.5px solid var(--gray200)}
.btn-svc-order.green:hover,.btn-svc-order.gold:hover{border-color:var(--blue);color:var(--blue)}
/* BUNDLE BANNER */
.bundle-section{background:linear-gradient(135deg,var(--navy),#1a3a6b);padding:56px 32px;text-align:center;color:#fff}
.bundle-inner{max-width:900px;margin:0 auto}
.bundle-inner h2{font-size:clamp(1.8rem,3.5vw,2.5rem);font-weight:900;margin-bottom:12px}
.bundle-inner p{font-size:.95rem;color:rgba(255,255,255,.7);line-height:1.75;margin-bottom:28px;max-width:560px;margin-left:auto;margin-right:auto}
.bundle-btns{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}
.btn-bundle-primary{background:#fff;color:var(--blue);padding:14px 32px;border-radius:10px;font-size:.95rem;font-weight:600;border:2px solid #fff;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-bundle-primary:hover{background:rgba(255,255,255,.88);transform:translateY(-1px)}
.btn-bundle-sec{background:rgba(255,255,255,.1);color:#fff;padding:14px 24px;border-radius:10px;font-size:.92rem;font-weight:600;border:1.5px solid rgba(255,255,255,.2);cursor:pointer;font-family:inherit;transition:all .2s}
.btn-bundle-sec:hover{background:rgba(255,255,255,.18)}
/* FOOTER */
footer{background:var(--navy);color:rgba(255,255,255,.6);padding:48px 32px 24px;margin-top:auto}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:40px;margin-bottom:40px}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr}}
.footer-brand p{font-size:.79rem;line-height:1.7;color:rgba(255,255,255,.5);max-width:260px;margin-top:10px}
.footer-col h5{font-family:'Fraunces',serif;font-size:.92rem;color:#fff;margin-bottom:14px;font-weight:600}
.footer-col a{display:block;font-size:.8rem;color:rgba(255,255,255,.5);margin-bottom:8px;transition:color .2s;cursor:pointer}
.footer-col a:hover{color:#fff}
.footer-divider{border:none;border-top:1px solid rgba(255,255,255,.1);margin-bottom:20px}
.footer-copy{font-size:.74rem;color:rgba(255,255,255,.35)}
.footer-disclaimer{font-size:.71rem;color:rgba(255,255,255,.28);max-width:620px;line-height:1.6;margin-top:6px}
.wa-float{position:fixed;bottom:26px;right:26px;z-index:500;background:#25D366;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.5);cursor:pointer;transition:all .25s}
.wa-float:hover{transform:scale(1.1)}
.wa-float svg{width:24px;height:24px;fill:#fff}
/* FORM OVERLAY */



.form-header{background:linear-gradient(135deg,var(--navy),#1e4db7);padding:22px 26px 18px;border-radius:16px 16px 0 0;position:sticky;top:0;z-index:10}
.form-header-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.form-header h3{font-family:'Fraunces',serif;color:#fff;font-size:1.12rem;font-weight:700}
.form-close{background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s}
.form-close:hover{background:rgba(255,255,255,.25)}
.form-sub{font-size:.75rem;color:rgba(255,255,255,.55)}
.form-body{padding:28px}
.form-label{display:block;font-size:.82rem;font-weight:600;color:var(--gray800);margin-bottom:6px}
.form-input{width:100%;padding:11px 13px;border:1.5px solid var(--gray200);border-radius:8px;font-size:.89rem;font-family:inherit;color:var(--gray800);transition:border-color .2s;background:#fff}
.form-input:focus{outline:none;border-color:var(--blue)}
.form-input::placeholder{color:var(--gray400)}
.form-group{margin-bottom:16px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:13px}
.form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px}
.select-input{width:100%;padding:11px 13px;border:1.5px solid var(--gray200);border-radius:8px;font-size:.89rem;font-family:inherit;color:var(--gray800);background:#fff}
.select-input:focus{outline:none;border-color:var(--blue)}
.section-divider{font-size:.74rem;font-weight:600;color:var(--gray400);text-transform:uppercase;letter-spacing:.6px;padding:12px 0 8px;border-bottom:1px solid var(--gray200);margin-bottom:14px}
.info-box{background:var(--blue-light);border-left:3px solid var(--blue);padding:11px 14px;border-radius:0 8px 8px 0;font-size:.8rem;color:var(--navy);line-height:1.65;margin-bottom:16px}
.warn-box{background:#FEF3C7;border-left:3px solid var(--gold);padding:11px 14px;border-radius:0 8px 8px 0;font-size:.8rem;color:#92400E;line-height:1.65;margin-bottom:16px}
.check-label{display:flex;align-items:flex-start;gap:9px;cursor:pointer;font-size:.84rem;color:var(--gray700);margin-bottom:9px;line-height:1.4}
.check-label input{margin-top:3px;width:15px;height:15px;accent-color:var(--blue)}
.summary-box{background:var(--gray50);border:1px solid var(--gray200);border-radius:10px;padding:16px 18px;margin-top:8px;margin-bottom:16px}
.summary-row{display:flex;justify-content:space-between;font-size:.84rem;padding:5px 0;border-bottom:1px solid var(--gray100)}
.summary-row:last-child{border-bottom:none;padding-top:10px;font-weight:700;color:var(--navy)}
.btn-submit-svc{background:var(--green);color:#fff;padding:14px;border-radius:9px;font-size:.95rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all .2s;width:100%;margin-top:4px}
.btn-submit-svc:hover{background:var(--green-dark)}
.disclaimer{font-size:.72rem;color:var(--gray400);text-align:center;margin-top:10px;line-height:1.6}
.success-screen{text-align:center;padding:24px 10px}
.success-icon{width:72px;height:72px;background:var(--green-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:2rem}
.success-screen h3{font-family:'Fraunces',serif;font-size:1.5rem;color:var(--navy);margin-bottom:9px}
.success-screen p{font-size:.87rem;color:var(--gray600);max-width:400px;margin:0 auto 22px;line-height:1.7}
.order-display{background:var(--navy);color:#fff;padding:14px 22px;border-radius:10px;display:inline-block;margin-bottom:22px}
.order-display span{font-size:.72rem;color:rgba(255,255,255,.55);display:block;margin-bottom:3px}
.order-display strong{font-family:'Fraunces',serif;font-size:1.7rem;font-weight:700;color:var(--gold);letter-spacing:1px}

/* ── Form overlay — full screen ──────────────────── */
.form-overlay{display:none;position:fixed;inset:0;z-index:1000;background:#f8fafc;overflow-y:auto}
.form-overlay.active{display:block}
.form-modal{background:transparent;width:100%;min-height:100vh}
.form-topbar{background:var(--navy);padding:14px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(28,46,68,.25)}
.form-topbar-left{display:flex;align-items:center;gap:12px}
.form-topbar-back{background:rgba(255,255,255,.12);border:none;color:rgba(255,255,255,.75);padding:6px 14px;border-radius:7px;cursor:pointer;font-size:.78rem;font-weight:600;font-family:inherit;transition:all .2s}
.form-topbar-back:hover{background:rgba(255,255,255,.22);color:#fff}
.form-topbar-title{font-family:'Fraunces',serif;color:#fff;font-size:1rem;font-weight:700}
.form-topbar-badge{font-size:.69rem;font-weight:600;background:var(--blue);color:#fff;padding:3px 9px;border-radius:20px}
.form-close{background:rgba(255,255,255,.12);border:none;color:rgba(255,255,255,.75);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.form-close:hover{background:rgba(255,255,255,.25);color:#fff}
.form-columns{display:grid;grid-template-columns:1fr 360px;gap:0;max-width:1100px;margin:0 auto;width:100%;padding:0 24px 60px;box-sizing:border-box}
@media(max-width:860px){.form-columns{grid-template-columns:1fr;padding:0 16px 48px}}
.form-left{padding:36px 40px 36px 0;border-right:1px solid var(--gray200)}
@media(max-width:860px){.form-left{padding:28px 0 0;border-right:none}}
.form-sub-title{font-size:.82rem;font-weight:500;color:var(--gray600);line-height:1.6;margin-bottom:24px}
.info-box{background:#eff6ff;border-left:4px solid var(--blue);border-radius:0 8px 8px 0;padding:12px 16px;font-size:.78rem;color:var(--navy);line-height:1.65;margin-bottom:22px}
.info-box strong{color:var(--blue)}
.warn-box{background:#fefce8;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;font-size:.78rem;color:#92400e;line-height:1.65;margin-bottom:22px}
.warn-box strong{color:#b45309}
.section-divider{display:flex;align-items:center;gap:10px;font-size:.69rem;font-weight:700;color:var(--gray500);text-transform:uppercase;letter-spacing:.7px;margin:24px 0 14px}
.section-divider::after{content:'';flex:1;height:1px;background:var(--gray200)}
.form-label{display:block;font-size:.82rem;font-weight:600;color:var(--gray800);margin-bottom:6px}
.form-input,.select-input{width:100%;padding:11px 14px;border:1.5px solid var(--gray200);border-radius:9px;font-size:.89rem;font-family:inherit;color:var(--gray800);transition:border-color .2s,box-shadow .2s;background:#fff;box-sizing:border-box}
.form-input:focus,.select-input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.1)}
.form-input::placeholder{color:var(--gray400)}
.form-group{margin-bottom:16px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:13px}
.form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px}
@media(max-width:540px){.form-row,.form-row-3{grid-template-columns:1fr}}
.form-right{padding:36px 0 36px 32px;position:sticky;top:65px;height:fit-content;align-self:start}
@media(max-width:860px){.form-right{padding:24px 0 32px;position:static}}
.svc-summary-card{background:#fff;border:1.5px solid var(--gray200);border-radius:14px;overflow:hidden}
.svc-summary-head{background:linear-gradient(135deg,var(--navy),#1e4db7);padding:20px 22px}
.svc-summary-name{font-family:'Fraunces',serif;font-size:1rem;font-weight:700;color:#fff;margin-bottom:4px}
.svc-summary-price{font-size:.82rem;color:rgba(255,255,255,.65)}
.svc-summary-price strong{color:#fff;font-size:1.1rem}
.svc-summary-badge{display:inline-block;background:rgba(255,255,255,.15);color:rgba(255,255,255,.85);font-size:.68rem;font-weight:600;padding:3px 9px;border-radius:20px;margin-top:8px}
.svc-summary-body{padding:18px 22px}
.svc-summary-includes-title{font-size:.69rem;font-weight:700;color:var(--gray400);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px}
.svc-summary-item{display:flex;align-items:flex-start;gap:8px;font-size:.79rem;color:var(--gray700);margin-bottom:8px;line-height:1.5}
.svc-summary-check{color:var(--green);font-size:.82rem;flex-shrink:0;margin-top:2px}
.svc-summary-time{display:flex;align-items:center;gap:7px;font-size:.74rem;color:var(--gray500);padding:10px 12px;background:var(--gray50);border-radius:8px;margin-top:12px}
.form-submit-area{margin-top:20px}
.btn-submit-svc{background:var(--green);color:#fff;padding:15px;border-radius:10px;font-size:.95rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;width:100%;display:flex;align-items:center;justify-content:center;gap:8px}
.btn-submit-svc:hover{background:#047857;transform:translateY(-1px);box-shadow:0 6px 20px rgba(5,150,105,.3)}
.form-secure-note{display:flex;align-items:center;justify-content:center;gap:5px;font-size:.71rem;color:var(--gray400);margin-top:9px}
.form-disclaimer{font-size:.69rem;color:var(--gray400);text-align:center;margin-top:14px;line-height:1.6;border-top:1px solid var(--gray100);padding-top:14px}
/* SERVICES GRID */
.services-accordion{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
@media(max-width:860px){.services-accordion{grid-template-columns:1fr}}
.svc-acc-item{border:1.5px solid var(--gray200);border-radius:12px;overflow:visible;background:#fff;transition:border-color .2s,box-shadow .2s,transform .18s;cursor:pointer;position:relative}
.svc-acc-item:hover,.svc-acc-item.active{border-color:var(--blue);box-shadow:0 6px 24px rgba(37,99,235,.12);transform:translateY(-2px);z-index:10}
.svc-acc-item:hover .svc-acc-icon,.svc-acc-item.active .svc-acc-icon{background:var(--blue);color:#fff}
.svc-acc-header{padding:14px 16px;display:flex;align-items:center;gap:13px;background:#fff;user-select:none;border-radius:12px}
.svc-acc-icon{width:40px;height:40px;border-radius:10px;background:var(--blue-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--blue);transition:background .2s,color .2s}
.svc-acc-icon svg{width:19px;height:19px}
.svc-acc-title-wrap{flex:1;min-width:0}
.svc-acc-title{font-family:'Fraunces',serif;font-size:.95rem;font-weight:700;color:var(--navy);line-height:1.25;margin-bottom:2px}
.svc-acc-sub{font-size:.71rem;color:var(--gray500);line-height:1.3}
.svc-acc-price{font-family:'Fraunces',serif;font-size:.93rem;font-weight:700;color:var(--navy);flex-shrink:0;white-space:nowrap}
.svc-acc-chevron{width:20px;height:20px;color:var(--gray400);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform .25s}
.svc-acc-chevron svg{width:15px;height:15px}
.svc-acc-item.expanded .svc-acc-chevron{transform:rotate(180deg)}
.svc-mobile-expand{display:none;padding:0 16px 16px;border-top:1px solid var(--gray100)}
.svc-acc-item.expanded .svc-mobile-expand{display:block}
.svc-mexp-desc{font-size:.82rem;color:var(--gray600);line-height:1.6;margin:14px 0 14px}
.svc-mexp-includes-title{font-size:.71rem;font-weight:600;color:var(--gray400);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.svc-mexp-includes{margin-bottom:12px}
.svc-mexp-incl-item{display:flex;align-items:flex-start;gap:8px;font-size:.8rem;color:var(--gray600);line-height:1.5;margin-bottom:5px}
.svc-mexp-time{font-size:.75rem;color:var(--gray500);background:var(--gray50);border-radius:7px;padding:8px 12px;margin-bottom:14px}
.svc-mexp-btn{background:var(--blue);color:#fff;padding:13px;border-radius:9px;font-size:.87rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:background .2s;width:100%;min-height:44px}
.svc-mexp-btn:hover{background:#1d4ed8}
/* POPUP PANEL — horizontal layout, absolute inside card */
.svc-popup{position:absolute;left:calc(100% + 14px);top:0;width:560px;background:#fff;border-radius:16px;border:1.5px solid var(--gray200);box-shadow:0 20px 60px rgba(28,46,68,.18),0 4px 14px rgba(37,99,235,.08);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;transform:translateX(8px);z-index:600}
.services-accordion .svc-acc-item:nth-child(even) .svc-popup{left:auto;right:calc(100% + 14px);transform:translateX(-8px)}
.svc-acc-item.active .svc-popup{opacity:1;pointer-events:auto;transform:translateX(0)}
@media(max-width:1100px){.svc-popup{display:none}}
@media(max-width:768px){.footer-col a{display:inline-block;margin-right:14px;margin-bottom:6px}}
.svc-popup-head{padding:14px 18px 12px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--gray100)}
.svc-popup-icon{width:40px;height:40px;border-radius:10px;background:var(--blue);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;box-shadow:0 4px 12px rgba(37,99,235,.28)}
.svc-popup-icon svg{width:19px;height:19px}
.svc-popup-title-wrap{flex:1;min-width:0}
.svc-popup-name{font-family:'Fraunces',serif;font-size:.97rem;font-weight:700;color:var(--navy);line-height:1.2;margin-bottom:2px}
.svc-popup-sub{font-size:.7rem;color:var(--gray500)}
.svc-popup-price{font-family:'Fraunces',serif;font-size:1rem;font-weight:800;color:var(--blue);white-space:nowrap;padding-left:8px}
.svc-popup-content{display:grid;grid-template-columns:1fr 1fr;gap:0}
.svc-popup-left{padding:14px 16px 16px;border-right:1px solid var(--gray100);display:flex;flex-direction:column;gap:10px}
.svc-popup-right{padding:14px 16px 16px;display:flex;flex-direction:column;gap:10px}
.svc-popup-desc{font-size:.8rem;color:var(--gray600);line-height:1.72;margin:0;flex:1}
.svc-popup-includes{background:var(--gray50);border-radius:9px;padding:10px 12px;flex:1}
.svc-popup-includes-title{font-size:.65rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.9px;margin-bottom:8px}
.svc-popup-incl-item{font-size:.78rem;color:var(--gray800);padding:3px 0;display:flex;align-items:flex-start;gap:7px;border-bottom:1px solid var(--gray100)}
.svc-popup-incl-item:last-child{border-bottom:none}
.svc-popup-incl-icon{color:var(--green);font-weight:700;flex-shrink:0}
.svc-popup-time{font-size:.71rem;color:var(--gray500);padding:6px 10px;background:var(--gray50);border-radius:7px}
.svc-popup-btn{background:#fff;color:var(--blue);padding:11px;border-radius:10px;font-size:.86rem;font-weight:700;border:2px solid var(--blue);cursor:pointer;font-family:inherit;transition:all .2s;width:100%}
.svc-popup-btn:hover{background:var(--blue);color:#fff;transform:translateY(-1px);box-shadow:0 6px 18px rgba(37,99,235,.28)}
`
  const body = `

<div class="topbar" id="topbar-svc">&#127775; Florida's trusted business formation experts — <strong>LLC &amp; Corporation</strong> filing made simple.</div>

<header id="mainHeader">
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-mark">OB</div>
      <div class="logo-text"><span class="logo-opa">Opa</span><span class="logo-biz">Biz</span><span>Florida Business Formation Center</span></div>
    </a>
    <nav>
      <a href="/" data-en="Home" data-es="Inicio">Inicio</a>
      <a href="/#pricing" data-en="Formation Packages" data-es="Paquetes de Formación">Paquetes de Formación</a>
      <a href="/#faq" data-en="FAQ" data-es="Preguntas Frecuentes">Preguntas Frecuentes</a>
      <a href="/#contact" data-en="Contact" data-es="Contacto">Contacto</a>
    </nav>
    <div style="display:flex;align-items:center;gap:11px">
      <div class="lang-toggle">
        <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
      </div>
      <button class="hamburger" id="hamburger-btn" aria-label="Toggle menu" onclick="toggleNav()">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<!-- HERO -->
<div class="page-hero">
  <div class="page-hero-inner">
    <span class="hero-badge" id="svc-section-label">All Services</span>
    <h1 id="svc-section-title">Everything Your Business Needs</h1>
  </div>
</div>

<!-- SERVICES GRID -->
<section class="services-section" style="padding-top:36px">
  <div class="services-inner">
    <div class="services-accordion">${servicesAccordionHtml}</div>
  </div>
</section>

<!-- BUNDLE BANNER -->
<section class="bundle-section">
  <div class="bundle-inner">
    <h2 id="bundle-title">Ahorra con un Paquete de Formación</h2>
    <p id="bundle-sub">Nuestros paquetes Standard y Premium combinan varios servicios — pagas menos que ordenándolos individualmente.</p>
    <div class="bundle-btns">
      <a href="/#pricing"><button id="bundle-btn-main" class="btn-bundle-primary">&#128197; Ver Paquetes de Formación &#8594;</button></a>
      <button id="bundle-btn-sec" class="btn-bundle-sec" onclick="window.open('/booking?lang=en','_self')">&#128197; Schedule a Consultation</button>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo-mark" style="display:inline-flex;margin-bottom:12px">OB</div>
        <div style="font-family:'Fraunces',serif;font-size:1rem;font-weight:700;margin-bottom:6px"><span style="color:#e2e8f0">Opa</span><span style="color:#60a5fa;font-style:italic">Biz</span></div>
        <p>Professional business formation services for entrepreneurs and investors throughout Florida.</p>
        <p style="margin-top:9px;color:rgba(255,255,255,.35);font-size:.72rem">&#128231; info@opabiz.com</p>
      </div>
      <div class="footer-col">
        <h5 data-en="Company" data-es="Compañía">Compañía</h5>
        <a href="/" data-en="Home" data-es="Inicio">Inicio</a>
        <a href="/#pricing" data-en="Packages" data-es="Paquetes">Paquetes</a>
        <a href="/#faq" data-en="FAQ" data-es="FAQ">FAQ</a>
        <a href="/#contact" data-en="Contact" data-es="Contacto">Contacto</a>
        <a href="/about" data-en="About Us" data-es="Nosotros">About Us</a>
      </div>
      <div class="footer-col">
        <h5 data-en="Legal" data-es="Legal">Legal</h5>
        <a href="/terms" data-en="Terms &amp; Conditions" data-es="Términos y Condiciones">Terms &amp; Conditions</a>
        <a href="/privacy" data-en="Privacy Policy" data-es="Política de Privacidad">Privacy Policy</a>
        <a href="/legal" data-en="Legal Disclaimer" data-es="Aviso Legal">Legal Disclaimer</a>
      </div>
    </div>
    <hr class="footer-divider"/>
    <div class="footer-copy">&#169; 2025 Florida Business Formation Center &middot; opabiz.com &middot; All Rights Reserved.</div>
    <div class="footer-disclaimer"><strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>OpaBiz is a trade name of Florida Business Formation Center — a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant.</div>
  </div>
</footer>


<!-- SERVICE FORM MODAL -->
<div class="form-overlay" id="svcOverlay">
  <div class="form-modal" id="svcModal">
    <div class="form-topbar">
      <div class="form-topbar-left">
        <button class="form-topbar-back" onclick="closeServiceForm()">&#8592; <span id="svc-back-lbl">Back</span></button>
        <span class="form-topbar-title" id="svcFormTitle">Service Order</span>
        <span class="form-topbar-badge" id="svc-badge-lbl">Florida</span>
      </div>
      <button class="form-close" onclick="closeServiceForm()">&#x2715;</button>
    </div>
    <div class="form-columns">
      <div class="form-left">
        <p class="form-sub-title" id="svcFormSub">Fill in the details below. We'll handle the rest.</p>
        <div id="svcFormBody"></div>
      </div>
      <div class="form-right">
        <div class="svc-summary-card">
          <div class="svc-summary-head">
            <div class="svc-summary-name" id="sum-svc-name">Service</div>
            <div class="svc-summary-price"><strong id="sum-svc-price">&mdash;</strong></div>
            <span class="svc-summary-badge" id="sum-svc-badge">Florida</span>
          </div>
          <div class="svc-summary-body">
            <div class="svc-summary-includes-title" id="sum-includes-lbl">What's included</div>
            <div id="sum-includes-list"></div>
            <div class="svc-summary-time"><span>&#9889;</span><span id="sum-time-txt">Processing time</span></div>
          </div>
        </div>
        <div id="svc-payment-area"></div>
        <div class="form-submit-area">
          <button class="btn-submit-svc" onclick="submitService()"><span id="svc-submit-lbl">Submit Order</span> &#8594;</button>
          <div class="form-secure-note">&#128274; <span id="svc-secure-lbl">Secure & encrypted</span></div>
        </div>
        <p class="form-disclaimer" id="svc-disclaimer-text">Florida Business Formation Center is a document preparation service, not a law firm. We do not provide legal, tax, or financial advice.</p>
      </div>
    </div>
  </div>
</div>
<script>
var currentService='';
var orderNum='';
function genOrderNum(){return 'FBFC-'+Math.floor(10000+Math.random()*90000);}

function toggleAmendSection(cb){
  var map={'amend-name':'amend-section-name','amend-addr':'amend-section-addr','amend-mail':'amend-section-mail','amend-agent':'amend-section-agent','amend-officers':'amend-section-officers','amend-purpose':'amend-section-purpose','amend-other':'amend-section-other'};
  var sec=document.getElementById(map[cb.id]);
  if(sec) sec.style.display=cb.checked?'':'none';
  var anyChecked=['amend-name','amend-addr','amend-mail','amend-agent','amend-officers','amend-purpose','amend-other'].some(function(id){var el=document.getElementById(id);return el&&el.checked;});
  var div=document.getElementById('amend-new-info-divider');
  if(div) div.style.display=anyChecked?'':'none';
}

var serviceForms={
'registered-agent':{
  title:'Registered Agent Service',
  title_es:'Servicio de Agente Registrado',
  sub:'We need your current business info to file the Change of Registered Agent with the Florida Division of Corporations.',
  sub_es:'Necesitamos la información actual de tu negocio para tramitar el cambio de Agente Registrado ante la División de Corporaciones de Florida.',
  headerClass:'',
  price:'Annual fee',
  html:\`
    <div class="info-box"><strong>Florida State Requirement:</strong> Every LLC and Corporation must maintain a Registered Agent with a physical FL address. The Change of Agent form is filed directly with the Florida Division of Corporations.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal</label><input type="text" class="form-input" placeholder="e.g. L23000123456" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option></select></div>
    <div class="form-group"><label class="form-label">Registered Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered with the State"/></div>
    <div class="section-divider">Current Registered Agent (if applicable)</div>
    <div class="form-group"><label class="form-label">Current Agent Name</label><input type="text" class="form-input" placeholder="Name of agent you are replacing"/></div>
    <div class="section-divider">Business Address</div>
    <div class="form-group"><label class="form-label">Principal Business Street Address *</label><input type="text" class="form-input" placeholder="Street address — no PO Box"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="section-divider">Contact &amp; Signature</div>
    <div class="form-group"><label class="form-label">Your Name *</label><input type="text" class="form-input" placeholder="Authorized representative"/></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="you@email.com"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type your full legal name — constitutes your signature"/></div>
    <div class="summary-box"><div class="summary-row"><span>Registered Agent Service</span><span>Annual Fee</span></div><div class="summary-row"><span>FL Division of Corporations Filing</span><span>Included</span></div><div class="summary-row"><span style="font-weight:700">Total</span><span>Annual Fee</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Submit Order &#8594;</button>
    <div class="disclaimer">Florida Business Formation Center is not a law firm. We do not provide legal advice.</div>\`
},
'ein':{
  title:'EIN / Tax ID Number — $49',
  title_es:'Número EIN / ID Fiscal — $49',
  sub:'IRS Form SS-4 preparation and submission. Required to open a business bank account.',
  sub_es:'Preparación y envío del Formulario SS-4 del IRS. Requerido para abrir una cuenta bancaria empresarial.',
  price:'$49',
  html:\`
    <div class="info-box"><strong>Federal Requirement:</strong> Your EIN is issued by the IRS and required for federal taxes, opening a business bank account, and hiring employees.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal</label><input type="text" class="form-input" placeholder="Optional — helps confirm entity" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC — Single Member</option><option>LLC — Multi-Member</option><option>Corporation (S-Corp or C-Corp)</option></select></div>
    <div class="form-group"><label class="form-label">Legal Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered with FL"/></div>
    <div class="form-group"><label class="form-label">State of Formation *</label><input type="text" class="form-input" value="Florida" readonly/></div>
    <div class="form-group"><label class="form-label">Business Start / Effective Date *</label><input type="date" class="form-input"/></div>
    <div class="section-divider">Responsible Party (State / IRS Terms)</div>
    <div class="form-row"><div class="form-group"><label class="form-label">First Name *</label><input type="text" class="form-input" placeholder="First"/></div><div class="form-group"><label class="form-label">Last Name *</label><input type="text" class="form-input" placeholder="Last"/></div></div>
    <div class="form-group"><label class="form-label">SSN or ITIN of Responsible Party *</label><input type="text" class="form-input" placeholder="XXX-XX-XXXX (required by IRS)"/></div>
    <div class="form-group"><label class="form-label">Title / Role *</label><select class="select-input"><option>Managing Member</option><option>Manager</option><option>Owner</option><option>Officer / Director</option></select></div>
    <div class="section-divider">Business Address</div>
    <div class="form-group"><label class="form-label">Business Street Address *</label><input type="text" class="form-input" placeholder="Street address"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="section-divider">Contact &amp; Business Purpose</div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="For EIN confirmation delivery"/></div>
    <div class="form-group"><label class="form-label">Phone Number</label><input type="tel" class="form-input" placeholder="(XXX) XXX-XXXX"/></div>
    <div class="form-group"><label class="form-label">Primary Business Activity</label><select class="select-input"><option>Retail &amp; E-Commerce</option><option>Real Estate</option><option>Restaurant / Food Service</option><option>Construction</option><option>Technology</option><option>Consulting</option><option>Import / Export</option><option>Health &amp; Wellness</option><option>Other</option></select></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>EIN Application Service</span><span>$49</span></div><div class="summary-row"><span>IRS Filing Fee</span><span>FREE</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$49</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order EIN — $49 &#8594;</button>
    <div class="disclaimer">EIN is issued by the IRS. Processing typically takes 1–3 business days after we submit.</div>\`
},
'operating-agreement':{
  title:'Operating Agreement — $79',
  title_es:'Acuerdo Operativo — $79',
  sub:'Custom LLC Operating Agreement based on Florida statutes and your ownership structure.',
  sub_es:'Acuerdo Operativo personalizado para LLC basado en los estatutos de Florida y tu estructura de propiedad.',
  price:'$79',
  html:\`
    <div class="info-box"><strong>Florida State Requirement:</strong> Banks require your Operating Agreement (along with your EIN and Certificate of Formation) to open a business checking account.</div>
    <div class="section-divider">LLC Information</div>
    <div class="form-group"><label class="form-label">LLC Name *</label><input type="text" class="form-input" placeholder="Exact registered name including LLC"/></div>
    <div class="form-group"><label class="form-label">State of Formation</label><input type="text" class="form-input" value="Florida" readonly/></div>
    <div class="form-group"><label class="form-label">Date of Formation / Effective Date *</label><input type="date" class="form-input"/></div>
    <div class="form-group"><label class="form-label">Principal Office Street Address *</label><input type="text" class="form-input" placeholder="Street address (no PO Box)"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">State</label><input type="text" class="form-input" value="FL" readonly/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="section-divider">Management Structure</div>
    <div class="form-group"><label class="form-label">Management Type *</label><select class="select-input"><option>Member-Managed (members run day-to-day)</option><option>Manager-Managed (designated manager runs operations)</option></select></div>
    <div class="section-divider">Members / Owners</div>
    <div id="oa-members">
      <div style="border:1.5px solid var(--gray200);border-radius:9px;padding:14px;margin-bottom:11px">
        <div style="font-size:.82rem;font-weight:600;color:var(--navy);margin-bottom:11px">Member #1</div>
        <div class="form-row"><div class="form-group"><label class="form-label">Full Legal Name *</label><input type="text" class="form-input" placeholder="First and last name"/></div><div class="form-group"><label class="form-label">Ownership % *</label><input type="number" class="form-input" placeholder="e.g. 100" min="1" max="100"/></div></div>
        <div class="form-group"><label class="form-label">Street Address *</label><input type="text" class="form-input" placeholder="Street address"/></div>
        <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">State *</label><input type="text" class="form-input" placeholder="State"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
      </div>
    </div>
    <button class="btn-add-member" onclick="addOAMember()" style="background:var(--blue-light);color:var(--blue);border:1.5px dashed var(--blue);padding:10px;border-radius:8px;width:100%;font-size:.86rem;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:16px">+ Add Another Member</button>
    <div class="section-divider">Financial Provisions</div>
    <div class="form-group"><label class="form-label">Fiscal Year End</label><select class="select-input"><option>December 31</option><option>March 31</option><option>June 30</option><option>September 30</option></select></div>
    <div class="form-group"><label class="form-label">Profit/Loss Distribution</label><select class="select-input"><option>Pro-rata to ownership percentages</option><option>Equal distribution among members</option><option>Custom (specify below)</option></select></div>
    <div class="section-divider">Contact</div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="Where we send your Operating Agreement"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>Custom Operating Agreement</span><span>$79</span></div><div class="summary-row"><span>Delivery</span><span>PDF via Email</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$79</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Operating Agreement — $79 &#8594;</button>
    <div class="disclaimer">We prepare your custom Operating Agreement within 2–5 business days.</div>\`
},
'itin':{
  title:'ITIN Application — $135',
  title_es:'Solicitud de ITIN — $135',
  sub:'IRS Form W-7 preparation for foreign nationals who need a US taxpayer identification number.',
  sub_es:'Preparación del Formulario W-7 del IRS para extranjeros que necesitan un número de identificación fiscal en EE.UU.',
  price:'$135',
  html:\`
    <div class="info-box"><strong>Who needs an ITIN?</strong> Foreign nationals, non-resident aliens, and individuals who must file US taxes but are not eligible for a Social Security Number (SSN).</div>
    <div class="warn-box">&#9888; ITIN processing by the IRS typically takes 6–10 weeks. Our service fee covers preparation and submission assistance only — the IRS issues the ITIN directly.</div>
    <div class="section-divider">Applicant Information (IRS Form W-7)</div>
    <div class="form-row"><div class="form-group"><label class="form-label">First Name *</label><input type="text" class="form-input" placeholder="As on passport"/></div><div class="form-group"><label class="form-label">Last Name *</label><input type="text" class="form-input" placeholder="As on passport"/></div></div>
    <div class="form-group"><label class="form-label">Name as it appears on tax return</label><input type="text" class="form-input" placeholder="If different from above"/></div>
    <div class="form-group"><label class="form-label">Date of Birth *</label><input type="date" class="form-input"/></div>
    <div class="form-group"><label class="form-label">Country of Birth *</label><input type="text" class="form-input" placeholder="e.g. Mexico, Colombia, Brazil"/></div>
    <div class="form-group"><label class="form-label">Country of Citizenship *</label><input type="text" class="form-input" placeholder="e.g. Venezuela, Cuba, Argentina"/></div>
    <div class="form-group"><label class="form-label">Foreign TIN (if applicable)</label><input type="text" class="form-input" placeholder="Tax ID number from your country of origin"/></div>
    <div class="section-divider">Reason for ITIN Application</div>
    <div class="form-group"><label class="form-label">Primary Reason *</label><select class="select-input"><option>Non-resident alien filing a US tax return</option><option>Spouse or dependent of a US citizen/resident</option><option>Dependent of non-resident alien visa holder</option><option>Non-resident alien student or researcher</option><option>Other — Florida business owner requiring tax filing</option></select></div>
    <div class="section-divider">US Address (Mailing)</div>
    <div class="form-group"><label class="form-label">US Mailing Address *</label><input type="text" class="form-input" placeholder="Where IRS should mail your ITIN letter"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="section-divider">Identity Documents</div>
    <div class="form-group"><label class="form-label">Primary ID Document *</label><select class="select-input"><option>Passport (preferred by IRS)</option><option>Foreign national ID + birth certificate</option><option>Visa + passport</option></select></div>
    <div class="info-box">We'll send you a complete document checklist after you submit this form. You do NOT need to mail us originals — we guide you through certified copy options.</div>
    <div class="section-divider">Contact</div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="For status updates and ITIN delivery"/></div>
    <div class="form-group"><label class="form-label">WhatsApp / Phone</label><input type="tel" class="form-input" placeholder="+1 (XXX) XXX-XXXX or international number"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>ITIN Application Service</span><span>$135</span></div><div class="summary-row"><span>IRS Application Fee</span><span>FREE</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$135</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order ITIN Application — $135 &#8594;</button>
    <div class="disclaimer">ITIN is issued by the IRS. Processing takes 6–10 weeks. We are not a law firm and do not provide tax advice.</div>\`
},
'dba':{
  title:'DBA / Fictitious Name Filing — $49',
  title_es:'Registro DBA / Nombre Ficticio — $49',
  sub:'Register your Fictitious Name (DBA) with the Florida Division of Corporations.',
  sub_es:'Registra tu Nombre Ficticio (DBA) ante la División de Corporaciones de Florida.',
  price:'$49 + state fee',
  html:\`
    <div class="info-box"><strong>Florida State Requirement:</strong> Any business operating under a name different from its legal registered name must file a Fictitious Name Registration with the Florida Division of Corporations. Valid for 5 years.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal</label><input type="text" class="form-input" placeholder="e.g. L23000123456 (if entity is registered)" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option><option>Sole Proprietorship</option><option>Partnership</option></select></div>
    <div class="form-group"><label class="form-label">Legal Entity Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Your registered legal business name"/></div>
    <div class="section-divider">Fictitious Name (DBA)</div>
    <div class="form-group"><label class="form-label">Desired Fictitious Name *</label><input type="text" class="form-input" placeholder="The DBA name you want to use (no LLC/Corp suffix needed)"/></div>
    <div class="form-group"><label class="form-label">Alternative Name #1 (optional)</label><input type="text" class="form-input" placeholder="Backup DBA name"/></div>
    <div class="form-group"><label class="form-label">Why are you using a DBA?</label><select class="select-input"><option>Brand / marketing name</option><option>Multiple business lines under one entity</option><option>Website / domain name</option><option>Doing business in a different county</option><option>Other</option></select></div>
    <div class="section-divider">Business Address</div>
    <div class="form-group"><label class="form-label">Florida Business Address *</label><input type="text" class="form-input" placeholder="Street address (no PO Box)"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="section-divider">Owner / Authorized Representative</div>
    <div class="form-row"><div class="form-group"><label class="form-label">First Name *</label><input type="text" class="form-input" placeholder="First name"/></div><div class="form-group"><label class="form-label">Last Name *</label><input type="text" class="form-input" placeholder="Last name"/></div></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="you@email.com"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>DBA / Fictitious Name Filing</span><span>$49</span></div><div class="summary-row"><span>FL State Filing Fee</span><span>Included</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$49</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order DBA Filing — $49 &#8594;</button>
    <div class="disclaimer">Fictitious Name is registered for 5 years per Florida Statute § 865.09. Renewal required before expiration.</div>\`
},
'virtual-address':{
  title:'Virtual Mailing Address — $29/month',
  title_es:'Dirección Postal Virtual — $29/mes',
  sub:'Professional FL address for your business. Mail received and forwarded digitally.',
  sub_es:'Dirección profesional en FL para tu negocio. Correo recibido y reenviado digitalmente.',
  price:'$29/mo',
  html:\`
    <div class="info-box"><strong>Privacy &amp; Professionalism:</strong> Your home address stays off all public Florida Division of Corporations records. Use this address for your business registration, website, and business cards.</div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Business Name *</label><input type="text" class="form-input" placeholder="Your business name (as registered or as DBA)"/></div>
    <div class="form-group"><label class="form-label">Entity Type</label><select class="select-input"><option>LLC</option><option>Corporation</option><option>Sole Proprietorship / Individual</option><option>Partnership</option></select></div>
    <div class="section-divider">Contact &amp; Forwarding</div>
    <div class="form-row"><div class="form-group"><label class="form-label">First Name *</label><input type="text" class="form-input" placeholder="Contact person first name"/></div><div class="form-group"><label class="form-label">Last Name *</label><input type="text" class="form-input" placeholder="Last name"/></div></div>
    <div class="form-group"><label class="form-label">Email for Mail Notifications *</label><input type="email" class="form-input" placeholder="We email you when mail arrives"/></div>
    <div class="form-group"><label class="form-label">Physical Forwarding Address (if needed)</label><input type="text" class="form-input" placeholder="Where to forward physical mail (optional)"/></div>
    <div class="form-group"><label class="form-label">Phone / WhatsApp</label><input type="tel" class="form-input" placeholder="(XXX) XXX-XXXX"/></div>
    <div class="section-divider">Service Options</div>
    <div class="form-group"><label class="form-label">Plan</label><select class="select-input"><option>Digital Forwarding Only — $29/month</option><option>Digital + Physical Forwarding — $39/month</option></select></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name — confirms monthly authorization"/></div>
    <div class="summary-box"><div class="summary-row"><span>Virtual Mailing Address</span><span>$29/month</span></div><div class="summary-row"><span>Setup Fee</span><span>FREE</span></div><div class="summary-row"><span style="font-weight:700">First Month Due Today</span><span>$29</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Activate Virtual Address — $29 &#8594;</button>
    <div class="disclaimer">Monthly subscription. Cancel anytime with 30 days written notice to info@opabiz.com.</div>\`
},
'annual-report':{
  title:'Annual Report Filing',
  title_es:'Declaración Anual',
  sub:'File your Florida Annual Report on time and avoid the $400 late fee.',
  sub_es:'Presenta tu Reporte Anual de Florida a tiempo y evita la multa de $400.',
  price:'Annual',
  html:\`
    <div class="warn-box">&#9888; <strong>Florida Deadline:</strong> Annual Reports must be filed between January 1 and May 1. After May 1, a $400 late penalty is imposed by the State. Continued non-filing results in administrative dissolution.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal *</label><input type="text" class="form-input" placeholder="e.g. L23000123456 — from your state records" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option></select></div>
    <div class="form-group"><label class="form-label">Registered Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered with State of Florida"/></div>
    <div class="form-group"><label class="form-label">EIN / Tax ID Number *</label><input type="text" class="form-input" placeholder="XX-XXXXXXX"/></div>
    <div class="section-divider">Updated Principal Office Address</div>
    <div class="form-group"><label class="form-label">Principal Street Address *</label><input type="text" class="form-input" placeholder="Street address — no PO Box — must be in Florida"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="section-divider">Registered Agent (State Required Field)</div>
    <div class="form-group"><label class="form-label">Registered Agent Name *</label><input type="text" class="form-input" placeholder="Current registered agent name"/></div>
    <div class="form-group"><label class="form-label">Agent FL Street Address *</label><input type="text" class="form-input" placeholder="Street address (no PO Box)"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">State</label><input type="text" class="form-input" value="FL" readonly/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="section-divider">Officers / Directors / Managers</div>
    <div id="ar-officers">
      <div style="border:1.5px solid var(--gray200);border-radius:9px;padding:14px;margin-bottom:11px">
        <div class="form-row-3">
          <div class="form-group"><label class="form-label">Title *</label><select class="select-input"><option>MGR</option><option>MGRM</option><option>President</option><option>VP</option><option>Secretary</option><option>Director</option></select></div>
          <div class="form-group"><label class="form-label">Full Name *</label><input type="text" class="form-input" placeholder="Name"/></div>
          <div class="form-group"><label class="form-label">Address *</label><input type="text" class="form-input" placeholder="Address"/></div>
        </div>
      </div>
    </div>
    <button onclick="addARPerson()" style="background:var(--blue-light);color:var(--blue);border:1.5px dashed var(--blue);padding:9px;border-radius:8px;width:100%;font-size:.84rem;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:16px">+ Add Another Officer/Director</button>
    <div class="section-divider">Contact &amp; Signature</div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="Confirmation email"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name — authorizes Annual Report filing"/></div>
    <div class="summary-box"><div class="summary-row"><span>Annual Report Filing Service</span><span>Service Fee</span></div><div class="summary-row"><span>FL State Annual Report Fee (LLC)</span><span>$138.75</span></div><div class="summary-row"><span>FL State Annual Report Fee (Corp)</span><span>$150</span></div><div class="summary-row"><span style="font-weight:700">Due Today</span><span>Service Fee + State Fee</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Submit Annual Report Order &#8594;</button>
    <div class="disclaimer">State fees are paid to the Florida Division of Corporations. Our service fee is separate.</div>\`
},
'amendment':{
  title:'Articles of Amendment — $59',
  title_es:'Artículos de Enmienda — $59',
  sub:'Change your business name, address, registered agent, or other registered details with the State of Florida.',
  sub_es:'Cambia el nombre de tu negocio, dirección, agente registrado u otros datos registrados ante el Estado de Florida.',
  price:'$59 + state fee',
  html:\`
    <div class="info-box"><strong>When do you need an Amendment?</strong> Whenever your registered business name, principal address, registered agent, officers/directors, or business purpose changes — you must update state records within a reasonable time.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal *</label><input type="text" class="form-input" placeholder="e.g. L23000123456 — from your state certificate" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Identification</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option></select></div>
    <div class="form-group"><label class="form-label">Current Registered Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered with the State"/></div>
    <div class="section-divider">What Are You Amending? (Check all that apply)</div>
    <div class="form-group">
      <label class="check-label"><input type="checkbox" id="amend-name" onchange="toggleAmendSection(this)"/> Business Name Change</label>
      <label class="check-label"><input type="checkbox" id="amend-addr" onchange="toggleAmendSection(this)"/> Principal Address Change</label>
      <label class="check-label"><input type="checkbox" id="amend-mail" onchange="toggleAmendSection(this)"/> Mailing Address Change</label>
      <label class="check-label"><input type="checkbox" id="amend-agent" onchange="toggleAmendSection(this)"/> Registered Agent Change</label>
      <label class="check-label"><input type="checkbox" id="amend-officers" onchange="toggleAmendSection(this)"/> Officers / Directors / Managers Change</label>
      <label class="check-label"><input type="checkbox" id="amend-purpose" onchange="toggleAmendSection(this)"/> Business Purpose Change</label>
      <label class="check-label"><input type="checkbox" id="amend-other" onchange="toggleAmendSection(this)"/> Other</label>
    </div>

    <div id="amend-new-info-divider" class="section-divider" style="display:none">New / Updated Information</div>

    <div id="amend-section-name" style="display:none">
      <div class="form-group"><label class="form-label">New Business Name *</label><input type="text" class="form-input" placeholder="New name — include LLC or Corp suffix (e.g. ABC Solutions LLC)"/></div>
    </div>

    <div id="amend-section-addr" style="display:none">
      <div class="form-group"><label class="form-label">New Principal Street Address *</label><input type="text" class="form-input" placeholder="Street address — no PO Box"/></div>
      <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">State</label><input type="text" class="form-input" value="FL" readonly/></div><div class="form-group"><label class="form-label">ZIP *</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    </div>

    <div id="amend-section-mail" style="display:none">
      <div class="form-group"><label class="form-label">New Mailing Address *</label><input type="text" class="form-input" placeholder="Street address or PO Box"/></div>
      <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">State</label><input type="text" class="form-input" value="FL" readonly/></div><div class="form-group"><label class="form-label">ZIP *</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    </div>

    <div id="amend-section-agent" style="display:none">
      <div class="form-group"><label class="form-label">New Registered Agent Name *</label><input type="text" class="form-input" placeholder="Full legal name or company name of new agent"/></div>
      <div class="form-group"><label class="form-label">New Registered Agent FL Street Address *</label><input type="text" class="form-input" placeholder="FL street address — no PO Box"/></div>
      <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">State</label><input type="text" class="form-input" value="FL" readonly/></div><div class="form-group"><label class="form-label">ZIP *</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    </div>

    <div id="amend-section-officers" style="display:none">
      <div class="form-group"><label class="form-label">Officers / Directors / Managers Changes *</label><textarea class="form-input" rows="4" placeholder="Describe the changes: who is being added, removed, or updated. Include full name and title for each person (e.g. Add: John Doe — Managing Member / Remove: Jane Smith — Director)"></textarea></div>
    </div>

    <div id="amend-section-purpose" style="display:none">
      <div class="form-group"><label class="form-label">New Business Purpose *</label><textarea class="form-input" rows="3" placeholder="Describe the new or updated purpose of your business (e.g. The purpose of this company is to engage in real estate investment and property management)"></textarea></div>
    </div>

    <div id="amend-section-other" style="display:none">
      <div class="form-group"><label class="form-label">Describe Other Changes *</label><textarea class="form-input" rows="3" placeholder="Describe any other amendments in detail..."></textarea></div>
    </div>
    <div class="section-divider">Adoption Method</div>
    <div class="form-group"><label class="form-label">How was this amendment approved? *</label><select class="select-input"><option>By the members/managers/directors</option><option>By written consent of all members</option><option>By majority vote at a duly noticed meeting</option><option>By the authorized manager acting alone</option></select></div>
    <div class="section-divider">Contact &amp; Signature</div>
    <div class="form-row"><div class="form-group"><label class="form-label">Name of Authorized Person *</label><input type="text" class="form-input" placeholder="Who is authorizing this amendment"/></div><div class="form-group"><label class="form-label">Title / Role *</label><input type="text" class="form-input" placeholder="Managing Member, Director, etc."/></div></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="Confirmation and document delivery"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>Articles of Amendment Service</span><span>$59</span></div><div class="summary-row"><span>FL Division of Corporations Filing Fee</span><span>~$25</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$59 + state fee</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Articles of Amendment &#8594;</button>
    <div class="disclaimer">Florida state filing fee is approximately $25 for LLC and $35 for Corporation, paid to the FL Division of Corporations.</div>\`
},
'banking-resolution':{
  title:'Banking Resolution — $49',
  title_es:'Resolución Bancaria — $49',
  sub:'Custom document authorizing a member or officer to open a business bank account on behalf of your entity.',
  sub_es:'Documento personalizado que autoriza a un miembro u oficial a abrir una cuenta bancaria en nombre de tu entidad.',
  price:'$49',
  html:\`
    <div class="info-box"><strong>Required by most banks:</strong> A Banking Resolution authorizes your LLC or Corporation to open a business bank account. Most U.S. banks require this document along with your EIN and Certificate of Formation.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal</label><input type="text" class="form-input" placeholder="e.g. L23000123456" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option></select></div>
    <div class="form-group"><label class="form-label">Legal Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered with State of Florida"/></div>
    <div class="form-group"><label class="form-label">EIN / Tax ID Number *</label><input type="text" class="form-input" placeholder="XX-XXXXXXX"/></div>
    <div class="form-group"><label class="form-label">State of Formation</label><input type="text" class="form-input" value="Florida" readonly/></div>
    <div class="section-divider">Bank Information</div>
    <div class="form-group"><label class="form-label">Bank Name *</label><input type="text" class="form-input" placeholder="e.g. Bank of America, Chase, Wells Fargo"/></div>
    <div class="form-group"><label class="form-label">Account Type *</label><select class="select-input"><option>Business Checking</option><option>Business Savings</option><option>Both Checking &amp; Savings</option></select></div>
    <div class="section-divider">Authorized Person</div>
    <div class="form-row"><div class="form-group"><label class="form-label">Full Legal Name *</label><input type="text" class="form-input" placeholder="Name of person authorized to open the account"/></div><div class="form-group"><label class="form-label">Title / Role *</label><select class="select-input"><option>Managing Member</option><option>Manager</option><option>Owner</option><option>President</option><option>Officer / Director</option></select></div></div>
    <div class="section-divider">Contact &amp; Signature</div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="For document delivery"/></div>
    <div class="form-group"><label class="form-label">Phone / WhatsApp</label><input type="tel" class="form-input" placeholder="(XXX) XXX-XXXX"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>Banking Resolution</span><span>$49</span></div><div class="summary-row"><span>Delivery</span><span>PDF via Email</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$49</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Banking Resolution — $49 &#8594;</button>
    <div class="disclaimer">Florida Business Formation Center is a document preparation service, not a law firm. We do not provide legal advice.</div>\`
},
'business-tax-receipt':{
  title:'Business Tax Receipt — $79',
  title_es:'Recibo de Impuesto Empresarial — $79',
  sub:'BTR application filed with your local Florida county. Required to legally operate in most FL counties.',
  sub_es:'Solicitud del Business Tax Receipt presentada ante tu condado local. Requerido para operar legalmente en la mayoría de condados de FL.',
  price:'$79 + county fee',
  html:\`
    <div class="info-box"><strong>Florida State Requirement:</strong> A Business Tax Receipt (formerly Occupational License) is required to legally operate in most Florida counties. The county fee varies by county and business type.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal</label><input type="text" class="form-input" placeholder="e.g. L23000123456" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option><option>Sole Proprietorship</option><option>Partnership</option></select></div>
    <div class="form-group"><label class="form-label">Legal Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered"/></div>
    <div class="form-group"><label class="form-label">EIN / Tax ID Number *</label><input type="text" class="form-input" placeholder="XX-XXXXXXX"/></div>
    <div class="section-divider">Business Location</div>
    <div class="form-group"><label class="form-label">Florida County *</label><select class="select-input"><option value="">Select county...</option><option>Miami-Dade</option><option>Broward</option><option>Palm Beach</option><option>Orange</option><option>Hillsborough</option><option>Pinellas</option><option>Duval</option><option>Brevard</option><option>Volusia</option><option>Seminole</option><option>Osceola</option><option>Polk</option><option>Lee</option><option>Collier</option><option>Sarasota</option><option>Other</option></select></div>
    <div class="form-group"><label class="form-label">Business Street Address *</label><input type="text" class="form-input" placeholder="Street address where business operates"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="section-divider">Business Details</div>
    <div class="form-group"><label class="form-label">Type of Business / Industry *</label><select class="select-input"><option value="">Select...</option><option>Retail Store</option><option>Restaurant / Food Service</option><option>Professional Services (Consulting, Legal, etc.)</option><option>Construction / Contractor</option><option>Real Estate</option><option>Health &amp; Beauty</option><option>Technology</option><option>Import / Export</option><option>Transportation / Delivery</option><option>E-Commerce / Online</option><option>Other</option></select></div>
    <div class="form-group"><label class="form-label">Brief Business Description *</label><input type="text" class="form-input" placeholder="e.g. Online retail clothing store / Residential cleaning services"/></div>
    <div class="form-group"><label class="form-label">Number of Employees</label><select class="select-input"><option>0 (Owner only)</option><option>1–5</option><option>6–10</option><option>11–25</option><option>25+</option></select></div>
    <div class="section-divider">Owner / Authorized Representative</div>
    <div class="form-row"><div class="form-group"><label class="form-label">First Name *</label><input type="text" class="form-input" placeholder="First name"/></div><div class="form-group"><label class="form-label">Last Name *</label><input type="text" class="form-input" placeholder="Last name"/></div></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="you@email.com"/></div>
    <div class="form-group"><label class="form-label">Phone *</label><input type="tel" class="form-input" placeholder="(XXX) XXX-XXXX"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>BTR Service Fee</span><span>$79</span></div><div class="summary-row"><span>County Filing Fee</span><span>Varies by county</span></div><div class="summary-row"><span style="font-weight:700">Service Fee Due Today</span><span>$79</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Business Tax Receipt — $79 &#8594;</button>
    <div class="disclaimer">County filing fee is paid separately to your local Florida county. Our $79 covers application preparation and filing assistance.</div>\`
},
'sales-tax-registration':{
  title:'Sales Tax Registration — $79',
  title_es:'Registro de Impuesto sobre Ventas — $79',
  sub:'Florida Department of Revenue registration to collect and remit sales tax (Form DR-1).',
  sub_es:'Registro ante el Departamento de Ingresos de Florida para cobrar y remitir el impuesto sobre ventas (Formulario DR-1).',
  price:'$79',
  html:\`
    <div class="info-box"><strong>Florida State Requirement:</strong> Any business selling taxable products or services in Florida must register with the FL Department of Revenue. Unregistered businesses face penalties and back taxes.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal</label><input type="text" class="form-input" placeholder="e.g. L23000123456" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option><option>Sole Proprietorship</option><option>Partnership</option></select></div>
    <div class="form-group"><label class="form-label">Legal Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered"/></div>
    <div class="form-group"><label class="form-label">EIN / Tax ID Number *</label><input type="text" class="form-input" placeholder="XX-XXXXXXX"/></div>
    <div class="form-group"><label class="form-label">Business Start Date *</label><input type="date" class="form-input"/></div>
    <div class="section-divider">Business Address</div>
    <div class="form-group"><label class="form-label">Florida Business Address *</label><input type="text" class="form-input" placeholder="Street address — no PO Box"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="section-divider">Sales Tax Details</div>
    <div class="form-group"><label class="form-label">What are you selling? *</label><select class="select-input"><option value="">Select...</option><option>Physical products / merchandise</option><option>Food &amp; beverages (taxable)</option><option>Software / digital products</option><option>Services (taxable in FL)</option><option>Both products &amp; services</option><option>Rental property / equipment</option></select></div>
    <div class="form-group"><label class="form-label">Where will you sell? *</label><select class="select-input"><option>Online only</option><option>Physical location in FL</option><option>Both online and physical location</option><option>Wholesale to other businesses</option></select></div>
    <div class="form-group"><label class="form-label">Estimated Monthly Sales *</label><select class="select-input"><option>Under $1,000</option><option>$1,000 – $5,000</option><option>$5,000 – $25,000</option><option>Over $25,000</option></select></div>
    <div class="section-divider">Responsible Party</div>
    <div class="form-row"><div class="form-group"><label class="form-label">First Name *</label><input type="text" class="form-input" placeholder="First name"/></div><div class="form-group"><label class="form-label">Last Name *</label><input type="text" class="form-input" placeholder="Last name"/></div></div>
    <div class="form-group"><label class="form-label">SSN or ITIN *</label><input type="text" class="form-input" placeholder="XXX-XX-XXXX (required by FL DOR)"/></div>
    <div class="form-group"><label class="form-label">Title / Role *</label><select class="select-input"><option>Managing Member</option><option>Manager</option><option>Owner</option><option>President</option><option>Officer / Director</option></select></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="you@email.com"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>Sales Tax Registration Service</span><span>$79</span></div><div class="summary-row"><span>FL DOR Registration Fee</span><span>FREE</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$79</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Sales Tax Registration — $79 &#8594;</button>
    <div class="disclaimer">Registration is with the Florida Department of Revenue. Sales tax must be collected and remitted on taxable sales. We do not provide tax advice.</div>\`
},
'exclusive-guide':{
  title:'Exclusive Formation Guide — $49',
  title_es:'Guía Exclusiva de Formación — $49',
  sub:'Step-by-step Florida business guide — banking, compliance calendar, and post-formation checklist.',
  sub_es:'Guía paso a paso para negocios en Florida — banca, calendario de cumplimiento y lista de verificación post-formación.',
  price:'$49',
  html:\`
    <div class="info-box"><strong>What you get:</strong> Our Exclusive Formation Guide covers everything you need after forming your LLC or Corporation — from opening your business bank account to Florida compliance deadlines and annual obligations. Delivered same business day by email.</div>
    <div class="section-divider">Your Business (Optional)</div>
    <div class="form-group"><label class="form-label">Business Name</label><input type="text" class="form-input" placeholder="Your business name (optional)"/></div>
    <div class="form-group"><label class="form-label">Entity Type</label><select class="select-input"><option value="">Select (optional)...</option><option>LLC</option><option>Corporation</option><option>Sole Proprietorship</option></select></div>
    <div class="form-group"><label class="form-label">Industry / Business Type</label><select class="select-input"><option value="">Select (optional)...</option><option>Retail &amp; E-Commerce</option><option>Real Estate</option><option>Restaurant / Food Service</option><option>Construction</option><option>Technology</option><option>Consulting / Professional Services</option><option>Import / Export</option><option>Health &amp; Wellness</option><option>Other</option></select></div>
    <div class="section-divider">Contact for Delivery</div>
    <div class="form-row"><div class="form-group"><label class="form-label">First Name *</label><input type="text" class="form-input" placeholder="First name"/></div><div class="form-group"><label class="form-label">Last Name *</label><input type="text" class="form-input" placeholder="Last name"/></div></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="Where we send your Guide (PDF)"/></div>
    <div class="form-group"><label class="form-label">Phone / WhatsApp</label><input type="tel" class="form-input" placeholder="(XXX) XXX-XXXX"/></div>
    <div class="summary-box"><div class="summary-row"><span>Exclusive Formation Guide (PDF)</span><span>$49</span></div><div class="summary-row"><span>Delivery</span><span>Same business day</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$49</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Exclusive Guide — $49 &#8594;</button>
    <div class="disclaimer">Guide is delivered by email within the same business day. Digital PDF format only.</div>\`
},
'good-standing':{
  title:'Certificate of Good Standing — $49',
  title_es:'Certificado de Buena Reputación — $49',
  sub:'Official certificate from FL Division of Corporations confirming your business is active and compliant.',
  sub_es:'Certificado oficial de la División de Corporaciones de FL que confirma que tu negocio está activo y en regla.',
  price:'$49 + state fee',
  html:\`
    <div class="info-box"><strong>When do you need this?</strong> Banks, investors, and government agencies require a Certificate of Good Standing before opening accounts, approving loans, signing contracts, or entering business partnerships.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal *</label><input type="text" class="form-input" placeholder="e.g. L23000123456" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option></select></div>
    <div class="form-group"><label class="form-label">Registered Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered with State of Florida"/></div>
    <div class="section-divider">Certificate Details</div>
    <div class="form-group"><label class="form-label">Purpose of Certificate *</label><select class="select-input"><option value="">Select...</option><option>Opening a business bank account</option><option>Loan or financing application</option><option>Business contract or partnership</option><option>Government / licensing requirement</option><option>Investor requirement</option><option>Apostille for international use</option><option>Other</option></select></div>
    <div class="form-group"><label class="form-label">Number of Copies *</label><select class="select-input"><option>1 copy</option><option>2 copies</option><option>3 copies</option><option>5 copies</option></select></div>
    <div class="form-group"><label class="form-label">Delivery Format *</label><select class="select-input"><option>Digital (PDF) — faster</option><option>Physical copy by mail</option><option>Both digital and physical</option></select></div>
    <div class="section-divider">Contact</div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="you@email.com"/></div>
    <div class="form-group"><label class="form-label">Phone / WhatsApp</label><input type="tel" class="form-input" placeholder="(XXX) XXX-XXXX"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>Certificate of Good Standing Service</span><span>$49</span></div><div class="summary-row"><span>FL Division of Corporations Fee</span><span>~$8.75</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$49 + state fee</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Certificate — $49 &#8594;</button>
    <div class="disclaimer">Certificate is issued by the Florida Division of Corporations. State fee is separate and varies by entity type.</div>\`
},
'foreign-llc':{
  title:'Foreign LLC / Corp Registration — $99',
  title_es:'Registro de LLC / Corp Extranjera — $99',
  sub:'Register your Florida LLC or Corporation to legally operate in another U.S. state.',
  sub_es:'Registra tu LLC o Corporación de Florida para operar legalmente en otro estado de EE.UU.',
  price:'$99 + state filing fee',
  html:\`
    <div class="info-box"><strong>When is this required?</strong> If your Florida LLC or Corporation has employees, a physical office, or regularly conducts business in another U.S. state, you must register as a Foreign Entity in that state to avoid fines and legal exposure.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal *</label><input type="text" class="form-input" placeholder="e.g. L23000123456" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Florida Entity Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option></select></div>
    <div class="form-group"><label class="form-label">Florida Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered in Florida"/></div>
    <div class="form-group"><label class="form-label">EIN / Tax ID Number *</label><input type="text" class="form-input" placeholder="XX-XXXXXXX"/></div>
    <div class="form-group"><label class="form-label">Date of Formation in Florida *</label><input type="date" class="form-input"/></div>
    <div class="section-divider">Target State Registration</div>
    <div class="form-group"><label class="form-label">State(s) to Register In *</label><input type="text" class="form-input" placeholder="e.g. Texas, New York, California (list all that apply)"/></div>
    <div class="form-group"><label class="form-label">Reason for Operating in That State *</label><select class="select-input"><option value="">Select...</option><option>Physical office or store</option><option>Employees or contractors there</option><option>Regular client meetings or contracts</option><option>Real estate or property ownership</option><option>E-commerce fulfillment center</option><option>Other</option></select></div>
    <div class="form-group"><label class="form-label">Business Address in Target State (if any)</label><input type="text" class="form-input" placeholder="Street address in target state (leave blank if none)"/></div>
    <div class="section-divider">Contact &amp; Signature</div>
    <div class="form-row"><div class="form-group"><label class="form-label">Your Name *</label><input type="text" class="form-input" placeholder="Authorized representative"/></div><div class="form-group"><label class="form-label">Title / Role *</label><select class="select-input"><option>Managing Member</option><option>Manager</option><option>President</option><option>Officer / Director</option></select></div></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="you@email.com"/></div>
    <div class="form-group"><label class="form-label">Phone / WhatsApp</label><input type="tel" class="form-input" placeholder="(XXX) XXX-XXXX"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>Foreign Registration Service Fee</span><span>$99</span></div><div class="summary-row"><span>State Filing Fee</span><span>Varies by state</span></div><div class="summary-row"><span>Registered Agent in Target State</span><span>Included (1st year)</span></div><div class="summary-row"><span style="font-weight:700">Service Fee Due Today</span><span>$99</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Foreign Registration — $99 &#8594;</button>
    <div class="disclaimer">State filing fees vary by state and are paid separately. Registered Agent service in the target state is included for the first year.</div>\`
},
'business-license':{
  title:'Business License — $99',
  title_es:'Licencia de Negocios — $99',
  sub:'We identify and apply for all federal, state, and local licenses required for your specific business.',
  sub_es:'Identificamos y tramitamos todas las licencias federales, estatales y locales requeridas para tu negocio.',
  price:'$99',
  html:\`
    <div class="info-box"><strong>What\'s included:</strong> We research which licenses your business needs at the federal, Florida state, county, and city level — then handle the applications on your behalf. Requirements vary by industry and location.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal</label><input type="text" class="form-input" placeholder="e.g. L23000123456" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option><option>Sole Proprietorship</option><option>Partnership</option></select></div>
    <div class="form-group"><label class="form-label">Legal Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered"/></div>
    <div class="form-group"><label class="form-label">EIN / Tax ID Number *</label><input type="text" class="form-input" placeholder="XX-XXXXXXX"/></div>
    <div class="section-divider">Business Location</div>
    <div class="form-group"><label class="form-label">Business Street Address *</label><input type="text" class="form-input" placeholder="Street address where business operates"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="form-group"><label class="form-label">Florida County *</label><select class="select-input"><option value="">Select county...</option><option>Miami-Dade</option><option>Broward</option><option>Palm Beach</option><option>Orange</option><option>Hillsborough</option><option>Pinellas</option><option>Duval</option><option>Brevard</option><option>Volusia</option><option>Seminole</option><option>Osceola</option><option>Polk</option><option>Lee</option><option>Collier</option><option>Sarasota</option><option>Other</option></select></div>
    <div class="section-divider">Business Activity</div>
    <div class="form-group"><label class="form-label">Primary Industry *</label><select class="select-input"><option value="">Select...</option><option>Retail Store</option><option>Restaurant / Food Service</option><option>Construction / Contractor</option><option>Real Estate / Property Management</option><option>Health &amp; Medical</option><option>Beauty / Personal Care</option><option>Transportation / Trucking</option><option>Technology / Software</option><option>Financial Services</option><option>Education / Childcare</option><option>Import / Export</option><option>E-Commerce / Online</option><option>Cleaning / Janitorial</option><option>Landscaping</option><option>Consulting / Professional Services</option><option>Other</option></select></div>
    <div class="form-group"><label class="form-label">Describe Your Business Activities *</label><input type="text" class="form-input" placeholder="e.g. Online retail store shipping nationwide / Local landscaping services"/></div>
    <div class="form-group"><label class="form-label">Do you sell food or beverages?</label><select class="select-input"><option>No</option><option>Yes — food / beverages for sale</option><option>Yes — alcohol included</option></select></div>
    <div class="section-divider">Contact &amp; Signature</div>
    <div class="form-row"><div class="form-group"><label class="form-label">First Name *</label><input type="text" class="form-input" placeholder="First name"/></div><div class="form-group"><label class="form-label">Last Name *</label><input type="text" class="form-input" placeholder="Last name"/></div></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="you@email.com"/></div>
    <div class="form-group"><label class="form-label">Phone *</label><input type="tel" class="form-input" placeholder="(XXX) XXX-XXXX"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>Business License Research &amp; Filing</span><span>$99</span></div><div class="summary-row"><span>License Application Fees</span><span>Varies by license</span></div><div class="summary-row"><span style="font-weight:700">Service Fee Due Today</span><span>$99</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Business License — $99 &#8594;</button>
    <div class="disclaimer">License application fees (if any) are paid directly to the issuing authority. Our $99 covers research, preparation, and filing assistance.</div>\`
},
'dissolution':{
  title:'Business Dissolution — $79',
  title_es:'Disolución del Negocio — $79',
  sub:'Articles of Dissolution filed with the Florida Division of Corporations to properly close your business.',
  sub_es:'Artículos de Disolución presentados ante la División de Corporaciones de Florida para cerrar correctamente tu negocio.',
  price:'$79 + state fee',
  html:\`
    <div class="warn-box">&#9888; <strong>Before dissolving:</strong> Make sure all Annual Reports are filed, FL state fees are paid, and outstanding debts are resolved. Dissolution stops future Annual Report obligations but does NOT close your IRS or FL DOR tax accounts — order Tax Account Closure separately.</div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal *</label><input type="text" class="form-input" placeholder="e.g. L23000123456" onblur="lookupFLDoc(this)"/><div id="fldoc-status" style="margin-top:5px;min-height:18px"></div></div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input" data-field="entity-type"><option value="">Select...</option><option>LLC</option><option>Corporation</option></select></div>
    <div class="form-group"><label class="form-label">Registered Business Name *</label><input type="text" class="form-input" data-field="business-name" placeholder="Exact name as registered with State of Florida"/></div>
    <div class="form-group"><label class="form-label">EIN / Tax ID Number</label><input type="text" class="form-input" placeholder="XX-XXXXXXX (for our records)"/></div>
    <div class="section-divider">Dissolution Details</div>
    <div class="form-group"><label class="form-label">Reason for Dissolution *</label><select class="select-input"><option value="">Select...</option><option>Business permanently closed</option><option>Business sold to new owner</option><option>Changed to different entity type</option><option>Partnership dissolved</option><option>Retirement / personal decision</option><option>Other</option></select></div>
    <div class="form-group"><label class="form-label">Date Dissolution Was Approved *</label><input type="date" class="form-input"/></div>
    <div class="form-group"><label class="form-label">How Was Dissolution Authorized? *</label><select class="select-input"><option>By unanimous consent of all members/shareholders</option><option>By written consent of all members</option><option>By majority vote at a duly noticed meeting</option><option>By the sole member / owner acting alone</option></select></div>
    <div class="section-divider">Obligations Checklist</div>
    <div class="form-group">
      <label class="check-label"><input type="checkbox" id="diss-taxes"/> All state and federal taxes have been filed and paid</label>
      <label class="check-label"><input type="checkbox" id="diss-reports"/> All Annual Reports are up to date</label>
      <label class="check-label"><input type="checkbox" id="diss-debts"/> Outstanding debts and obligations have been resolved</label>
      <label class="check-label"><input type="checkbox" id="diss-accounts"/> Business bank accounts will be closed after dissolution</label>
    </div>
    <div class="section-divider">Contact &amp; Signature</div>
    <div class="form-row"><div class="form-group"><label class="form-label">Your Name *</label><input type="text" class="form-input" placeholder="Authorized representative / member / officer"/></div><div class="form-group"><label class="form-label">Title / Role *</label><select class="select-input"><option>Managing Member</option><option>Sole Member</option><option>Manager</option><option>President</option><option>Officer / Director</option></select></div></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="you@email.com"/></div>
    <div class="form-group"><label class="form-label">Phone / WhatsApp</label><input type="tel" class="form-input" placeholder="(XXX) XXX-XXXX"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name — authorizes Articles of Dissolution"/></div>
    <div class="summary-box"><div class="summary-row"><span>Business Dissolution Service</span><span>$79</span></div><div class="summary-row"><span>FL Filing Fee (LLC)</span><span>$25</span></div><div class="summary-row"><span>FL Filing Fee (Corp)</span><span>$35</span></div><div class="summary-row"><span style="font-weight:700">Service Fee Due Today</span><span>$79</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Dissolution — $79 &#8594;</button>
    <div class="disclaimer">State filing fee paid separately to FL Division of Corporations. Dissolution does not close IRS or FL DOR tax accounts.</div>\`
},
'cierre-fiscal':{
  title:'Tax Account Closure — $79',
  title_es:'Cierre de Cuentas Fiscales — $79',
  sub:'Proper closure of your EIN with the IRS and sales tax account with the FL Department of Revenue.',
  sub_es:'Cierre correcto de tu EIN ante el IRS y tu cuenta de impuesto sobre ventas ante el Departamento de Ingresos de Florida.',
  price:'$79',
  html:\`
    <div class="info-box"><strong>Why this matters:</strong> Simply dissolving your FL entity does NOT close your IRS or FL Department of Revenue accounts. Unclosed tax accounts can result in penalties, tax notices, and future obligations — even after your business is dissolved.</div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Legal Business Name *</label><input type="text" class="form-input" placeholder="Exact name as registered"/></div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input"><option value="">Select...</option><option>LLC</option><option>Corporation</option><option>Sole Proprietorship</option><option>Partnership</option></select></div>
    <div class="form-group"><label class="form-label">EIN / Tax ID Number *</label><input type="text" class="form-input" placeholder="XX-XXXXXXX (required by IRS)"/></div>
    <div class="form-group"><label class="form-label">Número de Registro Estatal</label><input type="text" class="form-input" placeholder="e.g. L23000123456 (if entity was registered in FL)"/></div>
    <div class="section-divider">Closure Details</div>
    <div class="form-group"><label class="form-label">Reason for Closure *</label><select class="select-input"><option value="">Select...</option><option>Business permanently closed</option><option>Business sold — new owner has their own EIN</option><option>Changed entity type (e.g. LLC to Corp)</option><option>No longer operating in Florida</option><option>Other</option></select></div>
    <div class="form-group"><label class="form-label">Last Business Activity Date *</label><input type="date" class="form-input"/></div>
    <div class="form-group"><label class="form-label">Final Tax Return Filed?</label><select class="select-input"><option>Yes — final return has been filed</option><option>No — we need guidance on this</option><option>Not sure</option></select></div>
    <div class="section-divider">Accounts to Close</div>
    <div class="form-group">
      <label class="check-label"><input type="checkbox" id="close-irs" checked/> IRS EIN Account Closure</label>
      <label class="check-label"><input type="checkbox" id="close-fldor"/> FL Department of Revenue Account (if registered for sales tax)</label>
    </div>
    <div class="form-group"><label class="form-label">FL DOR Account Number (if applicable)</label><input type="text" class="form-input" placeholder="Your FL sales tax registration number (optional)"/></div>
    <div class="section-divider">Responsible Party &amp; Contact</div>
    <div class="form-row"><div class="form-group"><label class="form-label">First Name *</label><input type="text" class="form-input" placeholder="First name"/></div><div class="form-group"><label class="form-label">Last Name *</label><input type="text" class="form-input" placeholder="Last name"/></div></div>
    <div class="form-group"><label class="form-label">SSN or ITIN *</label><input type="text" class="form-input" placeholder="XXX-XX-XXXX (required for IRS correspondence)"/></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="you@email.com"/></div>
    <div class="form-group"><label class="form-label">Phone / WhatsApp</label><input type="tel" class="form-input" placeholder="(XXX) XXX-XXXX"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>Tax Account Closure Service</span><span>$79</span></div><div class="summary-row"><span>IRS &amp; FL DOR Processing</span><span>Included</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$79</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">Order Tax Account Closure — $79 &#8594;</button>
    <div class="disclaimer">IRS EIN closure takes 2–4 weeks. FL DOR account closure takes 2–3 weeks. We do not provide tax advice — consult a CPA for your final tax obligations.</div>\`
}
};

function submitService(){
  var num=genOrderNum();
  var isEs=document.getElementById('btn-es').classList.contains('active');
  document.getElementById('svcFormBody').innerHTML=\`
    <div class="success-screen">
      <div class="success-icon">&#x2705;</div>
      <h3>\${isEs?'¡Orden Enviada!':'Order Submitted!'}</h3>
      <p>\${isEs?'Tu solicitud ha sido recibida. Un miembro de nuestro equipo te contactará dentro de un día hábil para confirmar los detalles y completar tu orden.':'Your request has been received. A member of our team will contact you within one business day to confirm details and complete your order.'}</p>
      <div class="order-display"><span>\${isEs?'Tu Número de Orden':'Your Order Number'}</span><strong>\${num}</strong></div>
      <p style="font-size:.82rem;color:var(--gray600);margin-bottom:20px">\${isEs?'Guarda este número para tus registros. Nuestro equipo lo usará al contactarte.':'Keep this number for your records. Our team will reference it when we contact you.'}</p>
      <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">
        <button onclick="window.open('https://wa.me/13528377755','_blank')" style="background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;font-size:.85rem;font-weight:600;border:none;cursor:pointer;font-family:inherit">&#x1F4AC; \${isEs?'Consulta por WhatsApp':'WhatsApp Consultation'}</button>
        <button onclick="closeServiceForm()" style="background:var(--navy);color:#fff;padding:10px 20px;border-radius:8px;font-size:.84rem;font-weight:600;border:none;cursor:pointer;font-family:inherit">\${isEs?'Cerrar':'Close'}</button>
      </div>
    </div>\`;
}
function addOAMember(){
  var c=document.getElementById('oa-members');if(!c)return;
  var n=c.children.length+1;
  var isEs=document.getElementById('btn-es').classList.contains('active');
  var d=document.createElement('div');
  d.style.cssText='border:1.5px solid var(--gray200);border-radius:9px;padding:14px;margin-bottom:11px';
  d.innerHTML='<div style="font-size:.82rem;font-weight:600;color:var(--navy);margin-bottom:11px">'+(isEs?'Miembro #':'Member #')+n+'</div><div class="form-row"><div class="form-group"><label class="form-label">'+(isEs?'Nombre Legal Completo':'Full Legal Name')+'</label><input type="text" class="form-input" placeholder="'+(isEs?'Nombre y apellido completo':'Name')+'"/></div><div class="form-group"><label class="form-label">'+(isEs?'% de Propiedad':'Ownership %')+'</label><input type="number" class="form-input" placeholder="%" min="1" max="100"/></div></div><div class="form-group"><label class="form-label">'+(isEs?'Dirección':'Address')+'</label><input type="text" class="form-input" placeholder="'+(isEs?'Dirección':'Address')+'"/></div>';
  c.appendChild(d);
}
function addARPerson(){
  var c=document.getElementById('ar-officers');if(!c)return;
  var isEs=document.getElementById('btn-es').classList.contains('active');
  var d=document.createElement('div');
  d.style.cssText='border:1.5px solid var(--gray200);border-radius:9px;padding:14px;margin-bottom:11px';
  d.innerHTML='<div class="form-row-3"><div class="form-group"><label class="form-label">'+(isEs?'Título':'Title')+'</label><select class="select-input"><option>MGR</option><option>MGRM</option><option>'+(isEs?'Presidente':'President')+'</option><option>VP</option><option>'+(isEs?'Secretario':'Secretary')+'</option><option>Director</option></select></div><div class="form-group"><label class="form-label">'+(isEs?'Nombre Completo':'Full Name')+'</label><input type="text" class="form-input" placeholder="'+(isEs?'Nombre':'Name')+'"/></div><div class="form-group"><label class="form-label">'+(isEs?'Dirección':'Address')+'</label><input type="text" class="form-input" placeholder="'+(isEs?'Dirección':'Address')+'"/></div></div>';
  c.appendChild(d);
}
// URL hash auto-open
(function(){
  var h=window.location.hash.replace('#','');
  if(h){setTimeout(function(){highlightCard(h);},300);}
})();
window.addEventListener('scroll',function(){document.getElementById('mainHeader').classList.toggle('scrolled',window.scrollY>30);});
function setLang(lang){
  localStorage.setItem('flbc_lang',lang);
  var isEs=lang==='es';
  document.getElementById('btn-en').classList.toggle('active',lang==='en');
  document.getElementById('btn-es').classList.toggle('active',lang==='es');
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){el.innerHTML=isEs?el.getAttribute('data-es'):el.getAttribute('data-en');});
  var sl=document.getElementById('svc-section-label'); if(sl)sl.textContent=isEs?'Todos los Servicios':'All Services';
  var st=document.getElementById('svc-section-title'); if(st)st.textContent=isEs?'Todo lo que tu Negocio Necesita':'Everything Your Business Needs';
  var ss=document.getElementById('svc-section-sub'); if(ss)ss.textContent=isEs?'Servicios individuales para cada necesidad de tu negocio.':'Individual services for every business need.';
  document.querySelectorAll('.svc-includes-title').forEach(function(el){el.textContent=isEs?'Qué incluye':"What's included";});
  var prM={'registered-agent':isEs?'<strong>Tarifa Anual</strong> &nbsp;&middot;&nbsp; Requerido por ley en FL':'<strong>Annual Fee</strong> &nbsp;&middot;&nbsp; Required by FL law','ein':isEs?'<strong>$49</strong> &nbsp;&middot;&nbsp; Pago único':'<strong>$49</strong> &nbsp;&middot;&nbsp; One-time fee','operating-agreement':isEs?'<strong>$79</strong> &nbsp;&middot;&nbsp; Pago único':'<strong>$79</strong> &nbsp;&middot;&nbsp; One-time fee','itin':isEs?'<strong>$135</strong> &nbsp;&middot;&nbsp; Pago único':'<strong>$135</strong> &nbsp;&middot;&nbsp; One-time fee','dba':isEs?'<strong>$49 + tarifa estatal FL</strong>':'<strong>$49 + FL state fee</strong>','virtual-address':isEs?'<strong>$29/mes</strong> &nbsp;&middot;&nbsp; Cancela cuando quieras':'<strong>$29/month</strong> &nbsp;&middot;&nbsp; Cancel anytime','annual-report':isEs?'<strong>Servicio Anual</strong> &nbsp;&middot;&nbsp; Fecha Límite FL: 1 de mayo':'<strong>Annual Service</strong> &nbsp;&middot;&nbsp; FL Deadline: May 1','amendment':isEs?'<strong>$59 + tarifa estatal FL</strong>':'<strong>$59 + FL state fee</strong>'};
  Object.keys(prM).forEach(function(sid){var card=document.getElementById(sid);if(!card)return;var pd=card.querySelector('.svc-price');if(pd)pd.innerHTML=prM[sid];});
  var iE={'registered-agent':['Dirección oficial en FL para tu negocio','Acepta notificaciones y documentos legales','Cambio de Agente Registrado tramitado ante el estado','Reenvío de documentos y notificación por correo'],'ein':['Preparación y envío de la solicitud de EIN ante el IRS','Verificación del nombre del negocio','Entrega del EIN en 1-3 días hábiles','Soporte durante todo el proceso'],'operating-agreement':['Acuerdo Operativo personalizado para tu LLC','Cubre estructura de propiedad, gestión y finanzas','Entrega digital en 2-5 días hábiles','Listo para bancos e instituciones financieras'],'itin':['Preparación del Formulario W-7 del IRS','Guía sobre documentos requeridos','Presentación ante el IRS en tu nombre','El ITIN llega en 6-10 semanas (procesamiento IRS)'],'dba':['Registro del Nombre Ficticio ante la División de Corporaciones FL','Validez por 5 años','Publicación en periódico si aplica','Entrega en 1-3 días hábiles'],'virtual-address':['Dirección postal profesional en Florida','Recepción y escaneo de correspondencia','Notificación digital cuando llega correo','Tu dirección personal no aparece en registros públicos'],'annual-report':['Preparación y envío de la Declaración Anual ante el estado','Verificación de datos registrados','Confirmación de presentación exitosa','Protección contra multas y disolución'],'amendment':['Preparación del documento de enmienda','Tramitación ante la División de Corporaciones FL','Verificación de registros actuales','Confirmación y entrega en 1-3 días hábiles']};
  var iEn={'registered-agent':['Official FL street address for your business','Accepts service of process &amp; legal documents','Change of Registered Agent filed with state','Document forwarding &amp; email notifications'],'ein':['IRS EIN application preparation and submission','Business name verification','EIN delivered within 1-3 business days','Full support throughout the process'],'operating-agreement':['Custom Operating Agreement for your LLC','Covers ownership, management &amp; finances','Digital delivery in 2-5 business days','Ready for banks and financial institutions'],'itin':['IRS Form W-7 preparation','Guidance on required documents','Filing with the IRS on your behalf','ITIN arrives in 6-10 weeks (IRS processing)'],'dba':['Fictitious Name registration with FL Division of Corporations','Valid for 5 years','Newspaper publication if required','Delivered in 1-3 business days'],'virtual-address':['Professional FL mailing address','Mail receipt and scanning','Digital notification when mail arrives','Your personal address stays off public records'],'annual-report':['Annual Report preparation and submission to the state','Verification of current registered data','Confirmation of successful filing','Protection against late fees and dissolution'],'amendment':['Amendment document preparation','Filed with FL Division of Corporations','Verification of current records','Confirmation and delivery in 1-3 business days']};
  Object.keys(iE).forEach(function(sid){var card=document.getElementById(sid);if(!card)return;card.querySelectorAll('.svc-incl-item').forEach(function(item,i){var icon=item.querySelector('.svc-incl-icon');var iH=icon?icon.outerHTML:'<span class="svc-incl-icon">&#10003;</span>';var arr=isEs?iE[sid]:iEn[sid];if(arr&&arr[i]!==undefined)item.innerHTML=iH+' '+arr[i];});});
  var e;
  e=document.getElementById('bundle-title');    if(e)e.textContent=isEs?'Ahorra con un Paquete de Formación':'Save with a Formation Package';
  e=document.getElementById('bundle-sub');      if(e)e.textContent=isEs?'Nuestros paquetes Standard y Premium combinan varios servicios — pagas menos que ordenándolos individualmente.':'Our Standard and Premium packages bundle multiple services — pay less than ordering individually.';
  e=document.getElementById('bundle-btn-main'); if(e)e.innerHTML=isEs?'&#128197; Ver Paquetes de Formación &#8594;':'&#128197; View Formation Packages &#8594;';
  e=document.getElementById('bundle-btn-sec');  if(e){ e.innerHTML=isEs?'&#128197; Programar cita de consulta':'&#128197; Schedule a Consultation'; e.setAttribute('onclick',"window.open('"+(isEs?'/booking?lang=es':'/booking?lang=en')+"','_self')"); }
  var fbrand=document.querySelector('.footer-brand p'); if(fbrand)fbrand.textContent=isEs?'Servicios profesionales de formación empresarial para emprendedores e inversionistas en toda Florida.':'Professional business formation services for entrepreneurs and investors throughout Florida.';
  var fd=document.querySelector('.footer-disclaimer'); if(fd)fd.innerHTML=isEs?'<strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Aviso Importante</strong> OpaBiz es un nombre comercial de Florida Business Formation Center — un servicio profesional de preparación y presentación de documentos. No somos una firma de abogados y no brindamos asesoría legal, fiscal ni financiera. Nuestros servicios no constituyen el ejercicio del derecho ni crean una relación abogado-cliente. Todos los trámites están sujetos a aprobación por la División de Corporaciones de Florida y el IRS. Para orientación legal o fiscal específica a su situación, le recomendamos consultar con un abogado licenciado en Florida o un contador público certificado.':'<strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>OpaBiz is a trade name of Florida Business Formation Center — a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant.';
  var copy=document.querySelector('.footer-copy'); if(copy)copy.innerHTML=isEs?'&#169; 2025 Florida Business Formation Center &middot; Todos los Derechos Reservados.':'&#169; 2025 Florida Business Formation Center &middot; All Rights Reserved.';
  var tb=document.getElementById('topbar-svc'); if(tb)tb.innerHTML=isEs?'&#127775; Expertos en formación empresarial en Florida — <strong>LLC &amp; Corporación</strong> fácil y rápido.':'&#127775; Florida&#39;s trusted business formation experts — <strong>LLC &amp; Corporation</strong> filing made simple.';
  var navM={'How It Works':isEs?'Cómo Funciona':'How It Works','Packages':isEs?'Paquetes':'Packages','Formation Packages':isEs?'Paquetes de Formación':'Formation Packages','Services':isEs?'Servicios':'Services','FAQ':isEs?'Preguntas':'FAQ','Contact':isEs?'Contacto':'Contact','Home':isEs?'Inicio':'Home'};
  document.querySelectorAll('nav a').forEach(function(a){var t=a.textContent.trim();if(navM[t])a.textContent=navM[t];});
  if(document.getElementById('svcOverlay')&&document.getElementById('svcOverlay').classList.contains('active')){translateFormLabels();}
}

function lookupFLDoc(input){
  var docNum=input.value.trim().toUpperCase();
  if(!docNum||docNum.length<5)return;
  var isEs=document.getElementById('btn-es').classList.contains('active');
  var st=document.getElementById('fldoc-status');
  if(st)st.innerHTML='<span style="color:var(--gray500);font-size:.75rem">&#128269; '+(isEs?'Buscando en registros de FL...':'Looking up FL state records...')+'</span>';
  fetch('/api/sunbiz?document_id='+encodeURIComponent(docNum))
    .then(function(r){return r.json();})
    .then(function(data){
      var st=document.getElementById('fldoc-status');
      if(data.error||!data.company){
        if(st)st.innerHTML='<span style="color:#dc2626;font-size:.75rem">&#9888; '+(isEs?'No encontrado en registros de Florida.':'Not found in Florida state records.')+'</span>';
        return;
      }
      var c=data.company;
      var fb=document.getElementById('svcFormBody');
      var filled=0;
      var nameEl=fb.querySelector('[data-field="business-name"]');
      if(nameEl&&c.company_name){nameEl.value=c.company_name;nameEl.style.background='#eff6ff';filled++;}
      var typeEl=fb.querySelector('[data-field="entity-type"]');
      if(typeEl&&c.company_type){
        var tv=c.company_type==='CORP'?'Corporation':'LLC';
        for(var i=0;i<typeEl.options.length;i++){if(typeEl.options[i].text.indexOf(tv)!==-1){typeEl.selectedIndex=i;typeEl.style.background='#eff6ff';filled++;break;}}
      }
      if(st)st.innerHTML='<span style="color:var(--green);font-size:.75rem">&#10003; '+(isEs?filled+' campo(s) auto-rellenado(s) desde registros de FL.':filled+' field(s) auto-filled from FL state records.')+'</span>';
    })
    .catch(function(){
      var st=document.getElementById('fldoc-status');
      if(st)st.innerHTML='<span style="color:#dc2626;font-size:.75rem">&#9888; '+(isEs?'Error al consultar registros.':'Error looking up records.')+'</span>';
    });
}
function closeServiceForm(){
  document.getElementById('svcOverlay').classList.remove('active');
  document.body.style.overflow='';
  currentService='';window.currentService='';
  var pa=document.getElementById('svc-payment-area');if(pa)pa.innerHTML='';
}

function highlightCard(svcId){
  var card=document.getElementById(svcId);if(!card)return;
  card.classList.add('highlighted');
  setTimeout(function(){card.scrollIntoView({behavior:'smooth',block:'center'});},100);
  setTimeout(function(){card.classList.remove('highlighted');},5000);
}

(function(){var p=new URLSearchParams(window.location.search);var l=p.get('lang')||localStorage.getItem('flbc_lang')||'es';setLang(l);})();
window.addEventListener('scroll',function(){var h=document.getElementById('mainHeader');if(h)h.classList.toggle('scrolled',window.scrollY>30);});


function toggleSvcPayMethod(btn){
  var f=document.getElementById('svc-pay-card');if(!f)return;
  var open=f.style.display!=='none';
  f.style.display=open?'none':'block';
  btn.style.borderColor=open?'var(--gray200)':'var(--blue)';
}

function injectSvcPayment(area){
  if(!area)return;
  var es=document.getElementById('btn-es').classList.contains('active');
  area.innerHTML='<div style="margin-top:16px"><div style="font-size:.72rem;font-weight:600;color:var(--gray400);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">'+(es?'M&eacute;todo de Pago':'Payment Method')+'</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><button type="button" onclick="toggleSvcPayMethod(this)" style="background:#fff;border:1.5px solid var(--gray200);padding:6px 14px;border-radius:7px;font-size:.79rem;font-weight:600;color:var(--navy);cursor:pointer;font-family:inherit">&#128179; '+(es?'Cr&eacute;dito / D&eacute;bito':'Credit / Debit')+' &#9660;</button><span style="background:#fff;border:1.5px solid var(--gray200);padding:6px 14px;border-radius:7px;font-size:.79rem;font-weight:600;color:var(--navy)">&#63743; Apple Pay</span><span style="background:#fff;border:1.5px solid var(--gray200);padding:6px 14px;border-radius:7px;font-size:.79rem;font-weight:600;color:var(--navy)">&#128247; Zelle</span></div><div id="svc-pay-card" style="display:none;background:#f8fafc;border:1.5px solid var(--blue);border-radius:10px;padding:14px;margin-bottom:10px"><div style="font-size:.72rem;font-weight:600;color:var(--blue);text-transform:uppercase;margin-bottom:12px">'+(es?'Informaci&oacute;n de la Tarjeta':'Card Information')+'</div><div class="form-group"><label class="form-label">'+(es?'Nombre en la Tarjeta':'Name on Card')+'</label><input type="text" class="form-input" placeholder="'+(es?'Nombre como aparece en la tarjeta':'Full name as on card')+'"/></div><div class="form-group"><label class="form-label">'+(es?'N&uacute;mero de Tarjeta':'Card Number')+'</label><input type="text" class="form-input" placeholder="•••• •••• •••• ••••" maxlength="19"/></div><div style="display:flex;gap:12px"><div class="form-group" style="flex:1"><label class="form-label">'+(es?'Vencimiento':'Expiry')+'</label><input type="text" class="form-input" placeholder="MM/YY" maxlength="5"/></div><div class="form-group" style="flex:1"><label class="form-label">CVV</label><input type="text" class="form-input" placeholder="•••" maxlength="4"/></div></div></div></div>';
}

function translateFormLabels(){
  var isEs=document.getElementById('btn-es').classList.contains('active');
  var fb=document.getElementById('svcFormBody');if(!fb)return;
  var L={'Full Name *':isEs?'Nombre Completo *':'Full Name *','Full Name':isEs?'Nombre Completo':'Full Name','Email *':isEs?'Correo Electrónico *':'Email *','Email':isEs?'Correo Electrónico':'Email','Phone':isEs?'Teléfono':'Phone','Phone *':isEs?'Teléfono *':'Phone *','WhatsApp / Phone':isEs?'WhatsApp / Teléfono':'WhatsApp / Phone','Address':isEs?'Dirección':'Address','Address *':isEs?'Dirección *':'Address *','City':isEs?'Ciudad':'City','City *':isEs?'Ciudad *':'City *','ZIP':isEs?'Código Postal':'ZIP','Entity Type *':isEs?'Tipo de Entidad *':'Entity Type *','Entity Type':isEs?'Tipo de Entidad':'Entity Type','Registered Business Name *':isEs?'Nombre Registrado del Negocio *':'Registered Business Name *','Número de Registro Estatal':isEs?'Número de Registro Estatal':'FL State Registration Number','Número de Registro Estatal *':isEs?'Número de Registro Estatal *':'FL State Registration Number *','Current Agent Name':isEs?'Nombre del Agente Actual':'Current Agent Name','Principal Business Street Address *':isEs?'Dirección Principal del Negocio *':'Principal Business Street Address *','Your Name *':isEs?'Tu Nombre *':'Your Name *','Electronic Signature *':isEs?'Firma Electrónica *':'Electronic Signature *','Email for Mail Notifications *':isEs?'Correo para Notificaciones *':'Email for Mail Notifications *','Business Name *':isEs?'Nombre del Negocio *':'Business Name *','Responsible Party Name *':isEs?'Nombre del Responsable *':'Responsible Party Name *','SSN or ITIN of Responsible Party *':isEs?'SSN o ITIN del Responsable *':'SSN or ITIN of Responsible Party *','Business Start / Effective Date *':isEs?'Fecha de Inicio / Vigencia *':'Business Start / Effective Date *','LLC Name *':isEs?'Nombre de la LLC *':'LLC Name *','Management Type *':isEs?'Tipo de Gestión *':'Management Type *','Member Name':isEs?'Nombre del Miembro':'Member Name','Ownership % *':isEs?'% de Propiedad *':'Ownership % *','First Name *':isEs?'Nombre *':'First Name *','Last Name *':isEs?'Apellido *':'Last Name *','Date of Birth *':isEs?'Fecha de Nacimiento *':'Date of Birth *','Country of Citizenship *':isEs?'País de Ciudadanía *':'Country of Citizenship *','Country of Birth *':isEs?'País de Nacimiento *':'Country of Birth *','Primary ID Document *':isEs?'Documento de Identidad Principal *':'Primary ID Document *','US Mailing Address *':isEs?'Dirección Postal en EE.UU. *':'US Mailing Address *','Primary Reason *':isEs?'Razón Principal *':'Primary Reason *','Desired Fictitious Name *':isEs?'Nombre Ficticio Deseado *':'Desired Fictitious Name *','Alternative Name #1 (optional)':isEs?'Nombre Alternativo #1 (opcional)':'Alternative Name #1 (optional)','County':isEs?'Condado':'County','Physical Forwarding Address (if needed)':isEs?'Dirección de Reenvío Físico (si aplica)':'Physical Forwarding Address (if needed)','Plan':isEs?'Plan':'Plan','Florida Business Address *':isEs?'Dirección Empresarial en Florida *':'Florida Business Address *','Name of Authorized Person *':isEs?'Nombre de la Persona Autorizada *':'Name of Authorized Person *','EIN / Tax ID Number *':isEs?'EIN / Número de ID Fiscal *':'EIN / Tax ID Number *','Type of Amendment':isEs?'Tipo de Enmienda':'Type of Amendment','New Business Name (if changing)':isEs?'Nuevo Nombre del Negocio (si cambia)':'New Business Name (if changing)','Describe Other Changes':isEs?'Describe Otros Cambios':'Describe Other Changes','How was this amendment approved? *':isEs?'¿Cómo fue aprobada esta enmienda? *':'How was this amendment approved? *','State of Formation *':isEs?'Estado de Formación *':'State of Formation *','Principal Office Address *':isEs?'Dirección de la Oficina Principal *':'Principal Office Address *','Title / Role *':isEs?'Título / Cargo *':'Title / Role *',
'Legal Business Name *':isEs?'Nombre Legal del Negocio *':'Legal Business Name *',
'Business Street Address *':isEs?'Dirección del Negocio *':'Business Street Address *',
'Phone Number':isEs?'Número de Teléfono':'Phone Number',
'Primary Business Activity':isEs?'Actividad Principal del Negocio':'Primary Business Activity',
'State of Formation':isEs?'Estado de Formación':'State of Formation',
'Date of Formation / Effective Date *':isEs?'Fecha de Formación / Fecha Efectiva *':'Date of Formation / Effective Date *',
'Full Legal Name *':isEs?'Nombre Legal Completo *':'Full Legal Name *',
'Fiscal Year End':isEs?'Fin del Año Fiscal':'Fiscal Year End',
'Profit/Loss Distribution':isEs?'Distribución de Ganancias/Pérdidas':'Profit/Loss Distribution',
'Name as it appears on tax return':isEs?'Nombre en la declaración de impuestos':'Name as it appears on tax return',
'Foreign TIN (if applicable)':isEs?'TIN Extranjero (si aplica)':'Foreign TIN (if applicable)',
'Legal Entity Name *':isEs?'Nombre Legal de la Entidad *':'Legal Entity Name *',
'Why are you using a DBA?':isEs?'¿Por qué usas un DBA?':'Why are you using a DBA?',
'Phone / WhatsApp':isEs?'Teléfono / WhatsApp':'Phone / WhatsApp',
'Principal Street Address *':isEs?'Dirección Principal *':'Principal Street Address *',
'Registered Agent Name *':isEs?'Nombre del Agente Registrado *':'Registered Agent Name *',
'Agent FL Street Address *':isEs?'Dirección en FL del Agente *':'Agent FL Street Address *',
'Title *':isEs?'Título *':'Title *',
'Current Registered Business Name *':isEs?'Nombre Registrado Actual *':'Current Registered Business Name *',
'New Principal Address (if changing)':isEs?'Nueva Dirección Principal (si cambia)':'New Principal Address (if changing)',
'New Registered Agent Name (if changing)':isEs?'Nuevo Nombre del Agente Registrado (si cambia)':'New Registered Agent Name (if changing)',
'New Registered Agent FL Address':isEs?'Nueva Dirección FL del Agente Registrado':'New Registered Agent FL Address',
'Bank Name *':isEs?'Nombre del Banco *':'Bank Name *',
'Account Type *':isEs?'Tipo de Cuenta *':'Account Type *',
'Florida County *':isEs?'Condado de Florida *':'Florida County *',
'Type of Business / Industry *':isEs?'Tipo de Negocio / Industria *':'Type of Business / Industry *',
'Brief Business Description *':isEs?'Descripción Breve del Negocio *':'Brief Business Description *',
'Number of Employees':isEs?'Número de Empleados':'Number of Employees',
'Business Start Date *':isEs?'Fecha de Inicio del Negocio *':'Business Start Date *',
'What are you selling? *':isEs?'¿Qué estás vendiendo? *':'What are you selling? *',
'Where will you sell? *':isEs?'¿Dónde venderás? *':'Where will you sell? *',
'Estimated Monthly Sales *':isEs?'Ventas Mensuales Estimadas *':'Estimated Monthly Sales *',
'SSN or ITIN *':isEs?'SSN o ITIN *':'SSN or ITIN *',
'Business Name':isEs?'Nombre del Negocio':'Business Name',
'Industry / Business Type':isEs?'Industria / Tipo de Negocio':'Industry / Business Type',
'Purpose of Certificate *':isEs?'Propósito del Certificado *':'Purpose of Certificate *',
'Number of Copies *':isEs?'Número de Copias *':'Number of Copies *',
'Delivery Format *':isEs?'Formato de Entrega *':'Delivery Format *',
'State(s) to Register In *':isEs?'Estado(s) donde Registrarse *':'State(s) to Register In *',
'Reason for Operating in That State *':isEs?'Razón para Operar en ese Estado *':'Reason for Operating in That State *',
'Business Address in Target State (if any)':isEs?'Dirección del Negocio en el Estado Destino (si aplica)':'Business Address in Target State (if any)',
'Date of Formation in Florida *':isEs?'Fecha de Formación en Florida *':'Date of Formation in Florida *',
'Florida Business Name *':isEs?'Nombre del Negocio en Florida *':'Florida Business Name *',
'Primary Industry *':isEs?'Industria Principal *':'Primary Industry *',
'Describe Your Business Activities *':isEs?'Describe tus Actividades de Negocio *':'Describe Your Business Activities *',
'Do you sell food or beverages?':isEs?'¿Vendes alimentos o bebidas?':'Do you sell food or beverages?',
'Reason for Dissolution *':isEs?'Motivo de la Disolución *':'Reason for Dissolution *',
'Date Dissolution Was Approved *':isEs?'Fecha en que se Aprobó la Disolución *':'Date Dissolution Was Approved *',
'How Was Dissolution Authorized? *':isEs?'¿Cómo fue Autorizada la Disolución? *':'How Was Dissolution Authorized? *',
'Reason for Closure *':isEs?'Motivo del Cierre *':'Reason for Closure *',
'Last Business Activity Date *':isEs?'Fecha de Última Actividad del Negocio *':'Last Business Activity Date *',
'Final Tax Return Filed?':isEs?'¿Se Presentó la Declaración Final de Impuestos?':'Final Tax Return Filed?',
'FL DOR Account Number (if applicable)':isEs?'Número de Cuenta FL DOR (si aplica)':'FL DOR Account Number (if applicable)',
'Sole Member':isEs?'Único Miembro':'Sole Member'};
  var P={'Exact name as registered with the State':isEs?'Nombre exacto como está registrado ante el Estado':'Exact name as registered with the State','Exact name as registered with the State':isEs?'Nombre exacto como está registrado ante el Estado':'Exact name as registered with the State','e.g. L23000123456':'e.g. L23000123456','Name of agent you are replacing':isEs?'Nombre del agente que estás reemplazando':'Name of agent you are replacing','Street address — no PO Box':isEs?'Dirección — sin apartado postal':'Street address — no PO Box','FL physical street address':isEs?'Dirección física en FL':'FL physical street address','City':isEs?'Ciudad':'City','ZIP':isEs?'Código Postal':'ZIP','Authorized representative':isEs?'Representante autorizado':'Authorized representative','you@email.com':isEs?'tucorreo@ejemplo.com':'you@email.com','Type your full legal name — constitutes your signature':isEs?'Escribe tu nombre legal completo — constituye tu firma':'Type your full legal name — constitutes your signature','Type full legal name — authorizes Annual Report filing':isEs?'Escribe tu nombre legal completo — autoriza la Declaración Anual':'Type full legal name — authorizes Annual Report filing','The DBA name you want to use (no LLC/Corp suffix needed)':isEs?'El nombre DBA que quieres usar (sin sufijo LLC/Corp)':'The DBA name you want to use (no LLC/Corp suffix needed)','Backup DBA name':isEs?'Nombre DBA alternativo':'Backup DBA name','We email you when mail arrives':isEs?'Te notificamos por correo cuando llega correspondencia':'We email you when mail arrives','Where to forward physical mail (optional)':isEs?'Dónde reenviar correo físico (opcional)':'Where to forward physical mail (optional)','New FL street address — no PO Box':isEs?'Nueva dirección FL — sin apartado postal':'New FL street address — no PO Box','Describe any other amendments in detail...':isEs?'Describe cualquier otra enmienda en detalle...':'Describe any other amendments in detail...',
'Optional — helps confirm entity':isEs?'Opcional — ayuda a confirmar la entidad':'Optional — helps confirm entity',
'Exact name as registered with FL':isEs?'Nombre exacto como está registrado en FL':'Exact name as registered with FL',
'For EIN confirmation delivery':isEs?'Para entrega de confirmación del EIN':'For EIN confirmation delivery',
'First':isEs?'Nombre':'First',
'Last':isEs?'Apellido':'Last',
'XXX-XX-XXXX (required by IRS)':isEs?'XXX-XX-XXXX (requerido por el IRS)':'XXX-XX-XXXX (required by IRS)',
'Street address':isEs?'Dirección':'Street address',
'Exact registered name including LLC':isEs?'Nombre registrado exacto incluyendo LLC':'Exact registered name including LLC',
'Street address (no PO Box)':isEs?'Dirección (sin apartado postal)':'Street address (no PO Box)',
'First and last name':isEs?'Nombre y apellido completo':'First and last name',
'Home or business address':isEs?'Dirección personal o del negocio':'Home or business address',
'Where we send your Operating Agreement':isEs?'Donde te enviamos tu Acuerdo Operativo':'Where we send your Operating Agreement',
'As on passport':isEs?'Como aparece en el pasaporte':'As on passport',
'If different from above':isEs?'Si es diferente al anterior':'If different from above',
'e.g. Mexico, Colombia, Brazil':isEs?'ej. México, Colombia, Brasil':'e.g. Mexico, Colombia, Brazil',
'e.g. Venezuela, Cuba, Argentina':isEs?'ej. Venezuela, Cuba, Argentina':'e.g. Venezuela, Cuba, Argentina',
'Tax ID number from your country of origin':isEs?'Número de ID fiscal de tu país de origen':'Tax ID number from your country of origin',
'Where IRS should mail your ITIN letter':isEs?'Donde el IRS enviará tu carta con el ITIN':'Where IRS should mail your ITIN letter',
'Your registered legal business name':isEs?'Tu nombre legal registrado del negocio':'Your registered legal business name',
'e.g. L23000123456 (if entity is registered)':isEs?'ej. L23000123456 (si la entidad está registrada)':'e.g. L23000123456 (if entity is registered)',
'Contact person first name':isEs?'Nombre del contacto':'Contact person first name',
'Last name':isEs?'Apellido':'Last name',
'Type full legal name — confirms monthly authorization':isEs?'Escribe tu nombre legal completo — confirma la autorización mensual':'Type full legal name — confirms monthly authorization',
'Street address — no PO Box — must be in Florida':isEs?'Dirección — sin apartado postal — debe ser en Florida':'Street address — no PO Box — must be in Florida',
'Current registered agent name':isEs?'Nombre del agente registrado actual':'Current registered agent name',
'FL street address (no PO Box)':isEs?'Dirección en FL (sin apartado postal)':'FL street address (no PO Box)',
'Exact name as registered with State of Florida':isEs?'Nombre exacto como está registrado ante el Estado de Florida':'Exact name as registered with State of Florida',
'e.g. L23000123456 — from your state records':isEs?'ej. L23000123456 — de tu registro estatal':'e.g. L23000123456 — from your state records',
'e.g. L23000123456 — from your state certificate':isEs?'ej. L23000123456 — de tu certificado estatal':'e.g. L23000123456 — from your state certificate',
'New name including LLC or Corp suffix':isEs?'Nuevo nombre incluyendo sufijo LLC o Corp':'New name including LLC or Corp suffix',
'New registered agent full name or company':isEs?'Nombre completo o empresa del nuevo agente registrado':'New registered agent full name or company',
'Who is authorizing this amendment':isEs?'Quién autoriza esta enmienda':'Who is authorizing this amendment',
'Managing Member, Director, etc.':isEs?'Miembro Gerente, Director, etc.':'Managing Member, Director, etc.',
'Confirmation and document delivery':isEs?'Confirmación y entrega de documentos':'Confirmation and document delivery',
'Type full legal name':isEs?'Escribe tu nombre legal completo':'Type full legal name',
'e.g. Bank of America, Chase, Wells Fargo':isEs?'ej. Bank of America, Chase, Wells Fargo':'e.g. Bank of America, Chase, Wells Fargo',
'Name of person authorized to open the account':isEs?'Nombre de la persona autorizada para abrir la cuenta':'Name of person authorized to open the account',
'Street address where business operates':isEs?'Dirección donde opera el negocio':'Street address where business operates',
'e.g. Online retail clothing store / Residential cleaning services':isEs?'ej. Tienda de ropa online / Servicios de limpieza residencial':'e.g. Online retail clothing store / Residential cleaning services',
'XXX-XX-XXXX (required by FL DOR)':isEs?'XXX-XX-XXXX (requerido por el FL DOR)':'XXX-XX-XXXX (required by FL DOR)',
'Your business name (optional)':isEs?'El nombre de tu negocio (opcional)':'Your business name (optional)',
'Where we send your Guide (PDF)':isEs?'Donde te enviamos tu Guía (PDF)':'Where we send your Guide (PDF)',
'e.g. Texas, New York, California (list all that apply)':isEs?'ej. Texas, Nueva York, California (lista todos los que apliquen)':'e.g. Texas, New York, California (list all that apply)',
'Street address in target state (leave blank if none)':isEs?'Dirección en el estado destino (dejar en blanco si no aplica)':'Street address in target state (leave blank if none)',
'e.g. Online retail store shipping nationwide / Local landscaping services':isEs?'ej. Tienda online con envíos nacionales / Servicios de jardinería local':'e.g. Online retail store shipping nationwide / Local landscaping services',
'XX-XXXXXXX (for our records)':isEs?'XX-XXXXXXX (para nuestros registros)':'XX-XXXXXXX (for our records)',
'Authorized representative / member / officer':isEs?'Representante autorizado / miembro / oficial':'Authorized representative / member / officer',
'Type full legal name — authorizes Articles of Dissolution':isEs?'Escribe tu nombre legal completo — autoriza los Artículos de Disolución':'Type full legal name — authorizes Articles of Dissolution',
'XX-XXXXXXX (required by IRS)':isEs?'XX-XXXXXXX (requerido por el IRS)':'XX-XXXXXXX (required by IRS)',
'e.g. L23000123456 (if entity was registered in FL)':isEs?'ej. L23000123456 (si la entidad estaba registrada en FL)':'e.g. L23000123456 (if entity was registered in FL)',
'XXX-XX-XXXX (required for IRS correspondence)':isEs?'XXX-XX-XXXX (requerido para correspondencia con el IRS)':'XXX-XX-XXXX (required for IRS correspondence)',
'Your FL sales tax registration number (optional)':isEs?'Tu número de registro de impuesto sobre ventas de FL (opcional)':'Your FL sales tax registration number (optional)',
'Exact name as registered':isEs?'Nombre exacto como está registrado':'Exact name as registered',
'For document delivery':isEs?'Para entrega del documento':'For document delivery',
'Select (optional)...':isEs?'Seleccionar (opcional)...':'Select (optional)...'};
  fb.querySelectorAll('.form-label').forEach(function(el){var t=el.textContent.trim();if(L[t])el.textContent=L[t];});
  fb.querySelectorAll('[placeholder]').forEach(function(el){var p=el.getAttribute('placeholder');if(P[p])el.setAttribute('placeholder',P[p]);});
  var SD={'Business Information':'Información del Negocio','Business Identification':'Identificación del Negocio','Business Address':'Dirección del Negocio','Current Registered Agent (if applicable)':'Agente Registrado Actual (si aplica)','New / Updated Information':'Información Nueva / Actualizada','Registered Agent (State Required Field)':'Agente Registrado (Campo Requerido Estatal)','Responsible Party (State / IRS Terms)':'Parte Responsable (Términos Estatales / IRS)','Contact':'Contacto','Contact & Business Purpose':'Contacto y Propósito del Negocio','Contact &amp; Business Purpose':'Contacto y Propósito del Negocio','Contact & Forwarding':'Contacto y Reenvío','Contact &amp; Forwarding':'Contacto y Reenvío','Contact & Signature':'Contacto y Firma','Contact &amp; Signature':'Contacto y Firma','Owner / Authorized Representative':'Propietario / Representante Autorizado','LLC Information':'Información de la LLC','Management Structure':'Estructura de Gestión','Members / Owners':'Miembros / Propietarios','Applicant Information (IRS Form W-7)':'Información del Solicitante (Formulario W-7 del IRS)','Reason for ITIN Application':'Razón de la Solicitud de ITIN','Identity Documents':'Documentos de Identidad','US Address (Mailing)':'Dirección Postal en EE.UU.','Fictitious Name (DBA)':'Nombre Ficticio (DBA)','Service Options':'Opciones de Servicio','Updated Principal Office Address':'Dirección Actualizada de la Oficina Principal','What Are You Amending? (Check all that apply)':'¿Qué Estás Enmendando? (Marca todas las que apliquen)',
'Financial Provisions':'Disposiciones Financieras',
'Officers / Directors / Managers':'Oficiales / Directores / Gerentes',
'Adoption Method':'Método de Aprobación',
'Officers / Directors / Managers (check all that apply)':'Oficiales / Directores / Gerentes',
'Bank Information':'Información del Banco',
'Authorized Person':'Persona Autorizada',
'Business Location':'Ubicación del Negocio',
'Business Details':'Detalles del Negocio',
'Sales Tax Details':'Detalles del Impuesto sobre Ventas',
'Responsible Party':'Parte Responsable',
'Certificate Details':'Detalles del Certificado',
'Target State Registration':'Registro en el Estado Destino',
'Florida Entity Information':'Información de la Entidad en Florida',
'Business Activity':'Actividad del Negocio',
'Dissolution Details':'Detalles de la Disolución',
'Obligations Checklist':'Lista de Verificación de Obligaciones',
'Closure Details':'Detalles del Cierre',
'Accounts to Close':'Cuentas a Cerrar',
'Responsible Party &amp; Contact':'Parte Responsable y Contacto',
'Your Business (Optional)':'Tu Negocio (Opcional)',
'Contact for Delivery':'Contacto para Entrega'};
  fb.querySelectorAll('.section-divider').forEach(function(el){var t=el.textContent.trim();if(isEs&&SD[t])el.textContent=SD[t];else if(!isEs){Object.keys(SD).forEach(function(en){if(SD[en]===t)el.textContent=en;});}});
  fb.querySelectorAll('select option').forEach(function(opt){var map={'Select...':isEs?'Seleccionar...':'Select...','Corporation':isEs?'Corporación':'Corporation','LLC — Single Member':isEs?'LLC — Miembro Único':'LLC — Single Member','LLC — Multi-Member':isEs?'LLC — Múltiples Miembros':'LLC — Multi-Member','Corporation (S-Corp or C-Corp)':isEs?'Corporación (S-Corp o C-Corp)':'Corporation (S-Corp or C-Corp)','Managing Member':isEs?'Miembro Gerente':'Managing Member','Manager':isEs?'Gerente':'Manager','Owner':isEs?'Propietario':'Owner','Officer / Director':isEs?'Oficial / Director':'Officer / Director','Retail & E-Commerce':isEs?'Comercio Minorista y E-Commerce':'Retail & E-Commerce','Real Estate':isEs?'Bienes Raíces':'Real Estate','Restaurant / Food Service':isEs?'Restaurante / Servicio de Alimentos':'Restaurant / Food Service','Construction':isEs?'Construcción':'Construction','Technology':isEs?'Tecnología':'Technology','Consulting':isEs?'Consultoría':'Consulting','Import / Export':isEs?'Importación / Exportación':'Import / Export','Health & Wellness':isEs?'Salud y Bienestar':'Health & Wellness','Other':isEs?'Otro':'Other','Member-Managed':isEs?'Gestionado por Miembros':'Member-Managed','Manager-Managed':isEs?'Gestionado por Gerente':'Manager-Managed','Member-Managed (members run day-to-day)':isEs?'Gestionado por Miembros (los miembros operan el negocio)':'Member-Managed (members run day-to-day)','Manager-Managed (designated manager runs operations)':isEs?'Gestionado por Gerente (un gerente designado dirige las operaciones)':'Manager-Managed (designated manager runs operations)','December 31':isEs?'31 de diciembre':'December 31','March 31':isEs?'31 de marzo':'March 31','June 30':isEs?'30 de junio':'June 30','September 30':isEs?'30 de septiembre':'September 30','Pro-rata to ownership percentages':isEs?'Proporcional a los porcentajes de propiedad':'Pro-rata to ownership percentages','Equal distribution among members':isEs?'Distribución equitativa entre miembros':'Equal distribution among members','Custom (specify below)':isEs?'Personalizada (especificar abajo)':'Custom (specify below)','Non-resident alien filing a US tax return':isEs?'Extranjero no residente que presenta declaración de impuestos en EE.UU.':'Non-resident alien filing a US tax return','Spouse or dependent of a US citizen/resident':isEs?'Cónyuge o dependiente de un ciudadano/residente de EE.UU.':'Spouse or dependent of a US citizen/resident','Dependent of non-resident alien visa holder':isEs?'Dependiente de titular de visa extranjero no residente':'Dependent of non-resident alien visa holder','Non-resident alien student or researcher':isEs?'Estudiante o investigador extranjero no residente':'Non-resident alien student or researcher','Other — Florida business owner requiring tax filing':isEs?'Otro — propietario de negocio en Florida que requiere declaración de impuestos':'Other — Florida business owner requiring tax filing','Passport (preferred by IRS)':isEs?'Pasaporte (preferido por el IRS)':'Passport (preferred by IRS)','Foreign national ID + birth certificate':isEs?'ID nacional extranjero + acta de nacimiento':'Foreign national ID + birth certificate','Visa + passport':isEs?'Visa + pasaporte':'Visa + passport','Brand / marketing name':isEs?'Nombre de marca / marketing':'Brand / marketing name','Multiple business lines under one entity':isEs?'Múltiples líneas de negocio bajo una entidad':'Multiple business lines under one entity','Website / domain name':isEs?'Sitio web / nombre de dominio':'Website / domain name','Doing business in a different county':isEs?'Operar en un condado diferente':'Doing business in a different county','Sole Proprietorship':isEs?'Propietario Individual':'Sole Proprietorship','Sole Proprietorship / Individual':isEs?'Propietario Individual':'Sole Proprietorship / Individual','Partnership':isEs?'Sociedad':'Partnership','Digital Forwarding Only — $29/month':isEs?'Solo Reenvío Digital — $29/mes':'Digital Forwarding Only — $29/month','Digital + Physical Forwarding — $39/month':isEs?'Reenvío Digital + Físico — $39/mes':'Digital + Physical Forwarding — $39/month','President':isEs?'Presidente':'President','Secretary':isEs?'Secretario':'Secretary','By the members/managers/directors':isEs?'Por los miembros/gerentes/directores':'By the members/managers/directors','By written consent of all members':isEs?'Por consentimiento escrito de todos los miembros':'By written consent of all members','By majority vote at a duly noticed meeting':isEs?'Por voto mayoritario en reunión debidamente convocada':'By majority vote at a duly noticed meeting','By the authorized manager acting alone':isEs?'Por el gerente autorizado actuando solo':'By the authorized manager acting alone',
'Business Checking':isEs?'Cuenta Corriente Empresarial':'Business Checking',
'Business Savings':isEs?'Cuenta de Ahorros Empresarial':'Business Savings',
'Both Checking & Savings':isEs?'Corriente y Ahorros':'Both Checking & Savings',
'Retail Store':isEs?'Tienda Minorista':'Retail Store',
'Professional Services (Consulting, Legal, etc.)':isEs?'Servicios Profesionales (Consultoría, Legal, etc.)':'Professional Services (Consulting, Legal, etc.)',
'Construction / Contractor':isEs?'Construcción / Contratista':'Construction / Contractor',
'Health & Beauty':isEs?'Salud y Belleza':'Health & Beauty',
'Transportation / Delivery':isEs?'Transporte / Entrega':'Transportation / Delivery',
'E-Commerce / Online':isEs?'E-Commerce / En Línea':'E-Commerce / Online',
'Physical products / merchandise':isEs?'Productos físicos / mercancía':'Physical products / merchandise',
'Food & beverages (taxable)':isEs?'Alimentos y bebidas (gravables)':'Food & beverages (taxable)',
'Software / digital products':isEs?'Software / productos digitales':'Software / digital products',
'Services (taxable in FL)':isEs?'Servicios (gravables en FL)':'Services (taxable in FL)',
'Both products & services':isEs?'Productos y servicios':'Both products & services',
'Rental property / equipment':isEs?'Propiedad / equipo en alquiler':'Rental property / equipment',
'Online only':isEs?'Solo en línea':'Online only',
'Physical location in FL':isEs?'Ubicación física en FL':'Physical location in FL',
'Both online and physical location':isEs?'En línea y ubicación física':'Both online and physical location',
'Wholesale to other businesses':isEs?'Al por mayor a otros negocios':'Wholesale to other businesses',
'Under $1,000':isEs?'Menos de $1,000':'Under $1,000',
'Over $25,000':isEs?'Más de $25,000':'Over $25,000',
'0 (Owner only)':isEs?'0 (Solo el propietario)':'0 (Owner only)',
'Opening a business bank account':isEs?'Abrir una cuenta bancaria empresarial':'Opening a business bank account',
'Loan or financing application':isEs?'Solicitud de préstamo o financiamiento':'Loan or financing application',
'Business contract or partnership':isEs?'Contrato o asociación empresarial':'Business contract or partnership',
'Government / licensing requirement':isEs?'Requisito gubernamental / de licencia':'Government / licensing requirement',
'Investor requirement':isEs?'Requisito de inversionista':'Investor requirement',
'Apostille for international use':isEs?'Apostilla para uso internacional':'Apostille for international use',
'1 copy':isEs?'1 copia':'1 copy',
'2 copies':isEs?'2 copias':'2 copies',
'3 copies':isEs?'3 copias':'3 copies',
'5 copies':isEs?'5 copias':'5 copies',
'Digital (PDF) — faster':isEs?'Digital (PDF) — más rápido':'Digital (PDF) — faster',
'Physical copy by mail':isEs?'Copia física por correo':'Physical copy by mail',
'Both digital and physical':isEs?'Digital y física':'Both digital and physical',
'Physical office or store':isEs?'Oficina o tienda física':'Physical office or store',
'Employees or contractors there':isEs?'Empleados o contratistas allí':'Employees or contractors there',
'Regular client meetings or contracts':isEs?'Reuniones regulares con clientes o contratos':'Regular client meetings or contracts',
'Real estate or property ownership':isEs?'Bienes raíces o propiedad':'Real estate or property ownership',
'E-commerce fulfillment center':isEs?'Centro de cumplimiento de e-commerce':'E-commerce fulfillment center',
'Real Estate / Property Management':isEs?'Bienes Raíces / Administración de Propiedades':'Real Estate / Property Management',
'Health & Medical':isEs?'Salud y Médico':'Health & Medical',
'Beauty / Personal Care':isEs?'Belleza / Cuidado Personal':'Beauty / Personal Care',
'Transportation / Trucking':isEs?'Transporte / Camiones':'Transportation / Trucking',
'Financial Services':isEs?'Servicios Financieros':'Financial Services',
'Education / Childcare':isEs?'Educación / Cuidado Infantil':'Education / Childcare',
'Cleaning / Janitorial':isEs?'Limpieza / Conserjería':'Cleaning / Janitorial',
'Landscaping':isEs?'Jardinería':'Landscaping',
'Consulting / Professional Services':isEs?'Consultoría / Servicios Profesionales':'Consulting / Professional Services',
'No':isEs?'No':'No',
'Yes — food / beverages for sale':isEs?'Sí — alimentos / bebidas a la venta':'Yes — food / beverages for sale',
'Yes — alcohol included':isEs?'Sí — incluye alcohol':'Yes — alcohol included',
'Business permanently closed':isEs?'Negocio cerrado permanentemente':'Business permanently closed',
'Business sold to new owner':isEs?'Negocio vendido a nuevo propietario':'Business sold to new owner',
'Changed to different entity type':isEs?'Cambio a tipo de entidad diferente':'Changed to different entity type',
'Partnership dissolved':isEs?'Sociedad disuelta':'Partnership dissolved',
'Retirement / personal decision':isEs?'Jubilación / decisión personal':'Retirement / personal decision',
'By unanimous consent of all members/shareholders':isEs?'Por consentimiento unánime de todos los miembros/accionistas':'By unanimous consent of all members/shareholders',
'By the sole member / owner acting alone':isEs?'Por el único miembro / propietario actuando solo':'By the sole member / owner acting alone',
'Business sold — new owner has their own EIN':isEs?'Negocio vendido — el nuevo propietario tiene su propio EIN':'Business sold — new owner has their own EIN',
'Changed entity type (e.g. LLC to Corp)':isEs?'Cambio de tipo de entidad (ej. LLC a Corp)':'Changed entity type (e.g. LLC to Corp)',
'No longer operating in Florida':isEs?'Ya no opera en Florida':'No longer operating in Florida',
'Yes — final return has been filed':isEs?'Sí — la declaración final ha sido presentada':'Yes — final return has been filed',
'No — we need guidance on this':isEs?'No — necesitamos orientación sobre esto':'No — we need guidance on this',
'Not sure':isEs?'No estoy seguro':'Not sure',
'Sole Member':isEs?'Único Miembro':'Sole Member',
'Select (optional)...':isEs?'Seleccionar (opcional)...':'Select (optional)...',
'Select county...':isEs?'Seleccionar condado...':'Select county...'};var t=opt.textContent.trim();if(map[t]!==undefined)opt.textContent=map[t];});
  fb.querySelectorAll('button').forEach(function(btn){
    var t=btn.textContent.trim();
    var BT={'+ Add Another Member':isEs?'+ Agregar Otro Miembro':'+ Add Another Member','+ Add Another Officer/Director':isEs?'+ Agregar Otro Oficial/Director':'+ Add Another Officer/Director'};
    if(BT[t]!==undefined)btn.textContent=BT[t];
  });
  fb.querySelectorAll('div').forEach(function(el){
    if(el.children.length===0&&/^Member #\d+$/.test(el.textContent.trim())){
      el.textContent=isEs?el.textContent.trim().replace('Member #','Miembro #'):el.textContent.trim().replace('Miembro #','Member #');
    }
  });
  fb.querySelectorAll('.check-label').forEach(function(el){var CB={'Business Name Change':isEs?'Cambio de Nombre del Negocio':'Business Name Change','Principal Address Change':isEs?'Cambio de Dirección Principal':'Principal Address Change','Mailing Address Change':isEs?'Cambio de Dirección Postal':'Mailing Address Change','Registered Agent Change':isEs?'Cambio de Agente Registrado':'Registered Agent Change','Officers / Directors / Managers Change':isEs?'Cambio de Oficiales / Directores / Gerentes':'Officers / Directors / Managers Change','Business Purpose Change':isEs?'Cambio de Propósito del Negocio':'Business Purpose Change','Other':isEs?'Otro':'Other','All state and federal taxes have been filed and paid':isEs?'Todos los impuestos estatales y federales han sido presentados y pagados':'All state and federal taxes have been filed and paid','All Annual Reports are up to date':isEs?'Todas las Declaraciones Anuales están al día':'All Annual Reports are up to date','Outstanding debts and obligations have been resolved':isEs?'Las deudas y obligaciones pendientes han sido resueltas':'Outstanding debts and obligations have been resolved','Business bank accounts will be closed after dissolution':isEs?'Las cuentas bancarias del negocio serán cerradas después de la disolución':'Business bank accounts will be closed after dissolution','IRS EIN Account Closure':isEs?'Cierre de Cuenta EIN ante el IRS':'IRS EIN Account Closure','FL Department of Revenue Account (if registered for sales tax)':isEs?'Cuenta del Departamento de Ingresos de FL (si está registrado para impuesto sobre ventas)':'FL Department of Revenue Account (if registered for sales tax)'};var nodes=el.childNodes;for(var i=0;i<nodes.length;i++){if(nodes[i].nodeType===3&&nodes[i].textContent.trim()){var t=nodes[i].textContent.trim();if(CB[t])nodes[i].textContent=' '+CB[t];break;}}});
  if(window.currentService){
    var ibEn={'registered-agent':'<strong>Florida State Requirement:<\\/strong> Every LLC and Corporation must maintain a Registered Agent with a physical FL address. Filed directly with the Florida Division of Corporations.','ein':'<strong>Federal Requirement:<\\/strong> Your EIN is issued by the IRS and required for federal taxes, opening a business bank account, and hiring employees.','operating-agreement':'<strong>Florida State Requirement:<\\/strong> Banks require your Operating Agreement (along with your EIN and Certificate of Formation) to open a business checking account.','itin':'<strong>Who needs an ITIN?<\\/strong> Foreign nationals, non-resident aliens, and individuals who must file US taxes but are not eligible for a Social Security Number (SSN).','dba':'<strong>Florida State Requirement:<\\/strong> Any business operating under a name different from its legal registered name must file a Fictitious Name Registration with the FL Division of Corporations. Valid for 5 years.','virtual-address':'<strong>Privacy &amp; Professionalism:<\\/strong> Your home address stays off all public Florida Division of Corporations records.','annual-report':'<strong>Florida Deadline:<\\/strong> Annual Reports must be filed between January 1 and May 1. After May 1, a $400 late penalty is imposed. Continued non-filing results in administrative dissolution.','amendment':'<strong>When do you need an Amendment?<\\/strong> Whenever your registered business name, principal address, registered agent, or officers change.','banking-resolution':'<strong>Required by most banks:<\\/strong> A Banking Resolution authorizes your LLC or Corporation to open a business bank account. Most U.S. banks require this document along with your EIN and Certificate of Formation.','business-tax-receipt':'<strong>Florida State Requirement:<\\/strong> A Business Tax Receipt (formerly Occupational License) is required to legally operate in most Florida counties. The county fee varies by county and business type.','sales-tax-registration':'<strong>Florida State Requirement:<\\/strong> Any business selling taxable products or services in Florida must register with the FL Department of Revenue. Unregistered businesses face penalties and back taxes.','exclusive-guide':'<strong>What you get:<\\/strong> Our Exclusive Formation Guide covers everything you need after forming your LLC or Corporation — from opening your business bank account to Florida compliance deadlines and annual obligations. Delivered same business day by email.','good-standing':'<strong>When do you need this?<\\/strong> Banks, investors, and government agencies require a Certificate of Good Standing before opening accounts, approving loans, signing contracts, or entering business partnerships.','foreign-llc':'<strong>When is this required?<\\/strong> If your Florida LLC or Corporation has employees, a physical office, or regularly conducts business in another U.S. state, you must register as a Foreign Entity in that state to avoid fines and legal exposure.','business-license':'<strong>What is included:<\\/strong> We research which licenses your business needs at the federal, Florida state, county, and city level — then handle the applications on your behalf. Requirements vary by industry and location.','dissolution':'<strong>Before dissolving:<\\/strong> Make sure all Annual Reports are filed, FL state fees are paid, and outstanding debts are resolved. Dissolution stops future Annual Report obligations but does NOT close your IRS or FL DOR tax accounts.','cierre-fiscal':'<strong>Why this matters:<\\/strong> Simply dissolving your FL entity does NOT close your IRS or FL Department of Revenue accounts. Unclosed tax accounts can result in penalties, tax notices, and future obligations — even after your business is dissolved.'};
    var ibEs={'registered-agent':'<strong>Requisito Estatal de Florida:<\\/strong> Toda LLC y Corporación debe mantener un Agente Registrado con dirección física en FL. Se tramita directamente ante la División de Corporaciones de Florida.','ein':'<strong>Requisito Federal:<\\/strong> Tu EIN es emitido por el IRS y requerido para impuestos federales, abrir una cuenta bancaria empresarial y contratar empleados.','operating-agreement':'<strong>Requisito Estatal de Florida:<\\/strong> Los bancos requieren tu Acuerdo Operativo (junto con tu EIN y Certificado de Formación) para abrir una cuenta corriente empresarial.','itin':'<strong>¿Quién necesita un ITIN?<\\/strong> Extranjeros, no residentes, y personas que deben presentar impuestos en EE.UU. pero no son elegibles para un Número de Seguro Social (SSN).','dba':'<strong>Requisito Estatal de Florida:<\\/strong> Todo negocio que opere bajo un nombre diferente a su nombre legal registrado debe presentar un Registro de Nombre Ficticio ante la División de Corporaciones de Florida. Válido por 5 años.','virtual-address':'<strong>Privacidad y Profesionalismo:<\\/strong> Tu dirección personal no aparecerá en los registros públicos de la División de Corporaciones de Florida.','annual-report':'<strong>Fecha Límite de Florida:<\\/strong> Las Declaraciones Anuales deben presentarse entre el 1 de enero y el 1 de mayo. Después del 1 de mayo se impone una multa de $400.','amendment':'<strong>¿Cuándo necesitas una Enmienda?<\\/strong> Cuando cambia el nombre registrado, dirección principal, agente registrado u oficiales.','banking-resolution':'<strong>Requerido por la mayoría de bancos:<\\/strong> Una Resolución Bancaria autoriza a tu LLC o Corporación a abrir una cuenta bancaria empresarial. La mayoría de bancos en EE.UU. requieren este documento junto con tu EIN y Certificado de Formación.','business-tax-receipt':'<strong>Requisito Estatal de Florida:<\\/strong> Un Business Tax Receipt (antes Licencia Ocupacional) es requerido para operar legalmente en la mayoría de condados de Florida. La tarifa del condado varía según el condado y el tipo de negocio.','sales-tax-registration':'<strong>Requisito Estatal de Florida:<\\/strong> Todo negocio que venda productos o servicios gravables en Florida debe registrarse con el Departamento de Ingresos de FL. Los negocios no registrados enfrentan multas e impuestos atrasados.','exclusive-guide':'<strong>Qué obtienes:<\\/strong> Nuestra Guía Exclusiva de Formación cubre todo lo que necesitas después de formar tu LLC o Corporación — desde abrir tu cuenta bancaria empresarial hasta las fechas límite de cumplimiento de Florida y obligaciones anuales. Entregada el mismo día hábil por correo.','good-standing':'<strong>¿Cuándo lo necesitas?<\\/strong> Los bancos, inversionistas y agencias gubernamentales requieren un Certificado de Buena Reputación antes de abrir cuentas, aprobar préstamos, firmar contratos o establecer asociaciones empresariales.','foreign-llc':'<strong>¿Cuándo se requiere?<\\/strong> Si tu LLC o Corporación de Florida tiene empleados, una oficina física, o realiza negocios regularmente en otro estado de EE.UU., debes registrarte como Entidad Extranjera en ese estado para evitar multas y exposición legal.','business-license':'<strong>Qué incluye:<\\/strong> Investigamos qué licencias necesita tu negocio a nivel federal, estatal de Florida, condado y ciudad — luego tramitamos las solicitudes en tu nombre. Los requisitos varían según la industria y la ubicación.','dissolution':'<strong>Antes de disolver:<\\/strong> Asegúrate de que todas las Declaraciones Anuales estén presentadas, las tarifas estatales de FL pagadas y las deudas pendientes resueltas. La disolución detiene las obligaciones del Reporte Anual pero NO cierra tus cuentas fiscales del IRS o FL DOR.','cierre-fiscal':'<strong>Por qué es importante:<\\/strong> Simplemente disolver tu entidad de FL NO cierra tus cuentas del IRS o del Departamento de Ingresos de FL. Las cuentas fiscales no cerradas pueden resultar en multas, avisos fiscales y obligaciones futuras — incluso después de que tu negocio esté disuelto.'};
    var ib=fb.querySelector('.info-box,.warn-box');
    if(ib&&ibEn[window.currentService])ib.innerHTML=isEs?ibEs[window.currentService]:ibEn[window.currentService];
  }
}

function openServiceForm(svcId){
  var svc=serviceForms[svcId];if(!svc)return;
  currentService=svcId;window.currentService=svcId;
  var isEs=document.getElementById('btn-es').classList.contains('active');
  var titleFull=isEs&&svc.title_es?svc.title_es:svc.title;
  document.getElementById('svcFormTitle').textContent=titleFull.split(' — ')[0];
  document.getElementById('svcFormSub').textContent=isEs&&svc.sub_es?svc.sub_es:svc.sub;
  document.getElementById('svcFormBody').innerHTML=svc.html;
  translateFormLabels();
  var prEn={'registered-agent':'Annual Fee', 'ein':'$49 — One-time fee', 'operating-agreement':'$79 — One-time fee', 'itin':'$135 — One-time fee', 'dba':'$49 + FL state fee', 'virtual-address':'$29/month — Cancel anytime', 'annual-report':'Annual Service', 'amendment':'$59 + FL state fee', 'banking-resolution':'$49 — One-time fee', 'business-tax-receipt':'$79 + county fee', 'sales-tax-registration':'$79 — One-time fee', 'exclusive-guide':'$49 — One-time fee', 'good-standing':'$49 + FL state fee', 'foreign-llc':'$99 + state filing fee', 'business-license':'$99 — One-time fee', 'dissolution':'$79 + FL state fee', 'cierre-fiscal':'$79 — One-time fee'};
  var prEs={'registered-agent':'Tarifa Anual', 'ein':'$49 — Pago único', 'operating-agreement':'$79 — Pago único', 'itin':'$135 — Pago único', 'dba':'$49 + tarifa estatal FL', 'virtual-address':'$29/mes — Cancela cuando quieras', 'annual-report':'Servicio Anual', 'amendment':'$59 + tarifa estatal FL', 'banking-resolution':'$49 — Pago único', 'business-tax-receipt':'$79 + tarifa del condado', 'sales-tax-registration':'$79 — Pago único', 'exclusive-guide':'$49 — Pago único', 'good-standing':'$49 + tarifa estatal FL', 'foreign-llc':'$99 + tarifa estatal', 'business-license':'$99 — Pago único', 'dissolution':'$79 + tarifa estatal FL', 'cierre-fiscal':'$79 — Pago único'};
  var bgEn={'registered-agent':'Required by FL Law', 'ein':'Federal Requirement', 'operating-agreement':'Bank Required', 'itin':'IRS Issued', 'dba':'FL State Filing', 'virtual-address':'Privacy Protection', 'annual-report':'Deadline: May 1', 'amendment':'FL State Filing', 'banking-resolution':'Bank Required', 'business-tax-receipt':'County Requirement', 'sales-tax-registration':'FL DOR Filing', 'exclusive-guide':'Digital Delivery', 'good-standing':'FL State Certificate', 'foreign-llc':'Multi-State Filing', 'business-license':'FL & Federal', 'dissolution':'FL State Filing', 'cierre-fiscal':'IRS & FL DOR'};
  var bgEs={'registered-agent':'Requerido por Ley en FL', 'ein':'Requisito Federal', 'operating-agreement':'Requerido por el Banco', 'itin':'Emitido por el IRS', 'dba':'Trámite Estatal FL', 'virtual-address':'Protección de Privacidad', 'annual-report':'Fecha Límite: 1 de mayo', 'amendment':'Trámite Estatal FL', 'banking-resolution':'Requerido por el Banco', 'business-tax-receipt':'Requisito del Condado', 'sales-tax-registration':'Trámite FL DOR', 'exclusive-guide':'Entrega Digital', 'good-standing':'Certificado Estatal', 'foreign-llc':'Trámite Multi-Estado', 'business-license':'FL y Federal', 'dissolution':'Trámite Estatal', 'cierre-fiscal':'IRS y FL DOR'};
  var tmEn={'registered-agent':'Same business day filing', 'ein':'1-3 business days', 'operating-agreement':'2-5 business days', 'itin':'6-10 weeks (IRS processing)', 'dba':'1-3 business days', 'virtual-address':'Active same business day', 'annual-report':'Filed within 24 hours', 'amendment':'1-3 business days', 'banking-resolution':'1-2 business days', 'business-tax-receipt':'3-7 business days', 'sales-tax-registration':'2-5 business days', 'exclusive-guide':'Same business day', 'good-standing':'1-3 business days', 'foreign-llc':'5-10 business days', 'business-license':'2-3 business days', 'dissolution':'3-7 business days', 'cierre-fiscal':'2-4 weeks (IRS processing)'};
  var tmEs={'registered-agent':'Tramitación el mismo día hábil', 'ein':'1-3 días hábiles', 'operating-agreement':'2-5 días hábiles', 'itin':'6-10 semanas (proceso IRS)', 'dba':'1-3 días hábiles', 'virtual-address':'Activa el mismo día hábil', 'annual-report':'Tramitado en 24 horas', 'amendment':'1-3 días hábiles', 'banking-resolution':'1-2 días hábiles', 'business-tax-receipt':'3-7 días hábiles', 'sales-tax-registration':'2-5 días hábiles', 'exclusive-guide':'El mismo día hábil', 'good-standing':'1-3 días hábiles', 'foreign-llc':'5-10 días hábiles', 'business-license':'2-3 días hábiles', 'dissolution':'3-7 días hábiles', 'cierre-fiscal':'2-4 semanas (proceso IRS)'};
  var icEn={'registered-agent':['Official FL street address', 'Legal document acceptance', 'Change of Agent filing', 'Document forwarding & notifications'], 'ein':['IRS EIN application prep', 'Business name verification', 'EIN in 1-3 business days', 'Full support throughout'], 'operating-agreement':['Custom LLC Operating Agreement', 'Covers ownership & management', 'Digital delivery in 2-5 days', 'Bank-ready document'], 'itin':['IRS Form W-7 preparation', 'Required documents guidance', 'IRS filing on your behalf', 'ITIN in 6-10 weeks'], 'dba':['Fictitious Name registration', 'FL Division of Corporations filing', 'Valid for 5 years', '1-3 business days delivery'], 'virtual-address':['Professional FL mailing address', 'Mail scanning & forwarding', 'Email notification on arrival', 'Keeps home address private'], 'annual-report':['Annual Report prep & submission', 'Current data verification', 'Sunbiz filing confirmation', 'Avoid $400 late penalty'], 'amendment':['Amendment document preparation', 'FL Division of Corporations filing', 'Current records verification', '1-3 business days delivery'], 'banking-resolution':['Custom Banking Resolution document', 'Authorizes account opening for LLC/Corp', 'Accepted by most U.S. banks', 'PDF delivered by email in 1-2 days'], 'business-tax-receipt':['BTR application preparation', 'County-specific filing', 'Required to legally operate in FL', 'BTR certificate delivered'], 'sales-tax-registration':['FL DOR Form DR-1 preparation', 'Sales tax certificate (DR-11)', 'Required for taxable sales in FL', 'Filing instructions included'], 'exclusive-guide':['Step-by-step post-formation checklist', 'Banking requirements & account tips', 'FL compliance calendar & deadlines', 'Delivered by email (PDF)'], 'good-standing':['Official FL Division of Corps certificate', 'Certified digital & physical copy', 'Accepted by banks & investors', 'Apostille available on request'], 'foreign-llc':['Foreign qualification filing', 'Certificate of Authority from FL', 'Registered Agent in target state', 'Available for all 50 U.S. states'], 'business-license':['Federal, state & local license research', 'Industry & location-specific filing', 'Step-by-step application process', 'Confirmation delivered by email'], 'dissolution':['Articles of Dissolution prepared & filed', 'FL Division of Corporations submission', 'Stops Annual Report obligations', 'Dissolution certificate delivered'], 'cierre-fiscal':['IRS EIN closure letter preparation', 'FL DOR account closure (if applicable)', 'Guidance on final tax obligations', 'Confirmation documents by email']};
  var icEs={'registered-agent':['Dirección oficial en FL', 'Acepta documentos legales', 'Tramitación del Cambio de Agente', 'Reenvío y notificaciones'], 'ein':['Preparación solicitud EIN', 'Verificación del nombre', 'EIN en 1-3 días hábiles', 'Soporte durante el proceso'], 'operating-agreement':['Acuerdo Operativo personalizado', 'Cubre propiedad y gestión', 'Entrega digital en 2-5 días', 'Listo para el banco'], 'itin':['Preparación Formulario W-7', 'Guía de documentos requeridos', 'Presentación ante el IRS', 'ITIN en 6-10 semanas'], 'dba':['Registro de Nombre Ficticio', 'Trámite ante División de Corp. FL', 'Válido por 5 años', 'Entrega en 1-3 días hábiles'], 'virtual-address':['Dirección postal profesional en FL', 'Escaneo y reenvío de correo', 'Notificación por email', 'Dirección personal privada'], 'annual-report':['Preparación y envío a Sunbiz', 'Verificación de datos actuales', 'Confirmación de presentación', 'Evita multa de $400'], 'amendment':['Preparación del documento', 'Trámite ante División de Corp. FL', 'Verificación de registros actuales', 'Entrega en 1-3 días hábiles'], 'banking-resolution':['Resolución Bancaria personalizada', 'Autoriza apertura de cuenta LLC/Corp', 'Aceptada por la mayoría de bancos en USA', 'PDF entregado por correo en 1-2 días'], 'business-tax-receipt':['Preparación de la solicitud BTR', 'Presentación específica al condado', 'Requerido para operar legalmente en FL', 'Certificado BTR entregado'], 'sales-tax-registration':['Preparación Formulario DR-1 FL DOR', 'Certificado de impuesto sobre ventas', 'Requerido para ventas gravables en FL', 'Instrucciones de presentación incluidas'], 'exclusive-guide':['Lista de verificación post-formación', 'Requisitos bancarios y tips', 'Calendario de cumplimiento FL', 'Entregada por correo (PDF)'], 'good-standing':['Certificado oficial de la División de Corp. FL', 'Copia digital y física certificada', 'Aceptado por bancos e inversionistas', 'Apostilla disponible a solicitud'], 'foreign-llc':['Calificación como Entidad Extranjera', 'Certificado de Autoridad de FL', 'Agente Registrado en estado destino', 'Disponible en los 50 estados de USA'], 'business-license':['Investigación de licencias federal, estatal y local', 'Presentación específica por industria y ubicación', 'Proceso de solicitud paso a paso', 'Confirmación entregada por correo'], 'dissolution':['Artículos de Disolución preparados y presentados', 'Envío a la División de Corporaciones FL', 'Detiene la obligación del Reporte Anual', 'Certificado de disolución entregado'], 'cierre-fiscal':['Preparación de carta de cierre EIN', 'Cierre de cuenta FL DOR (si aplica)', 'Guía sobre obligaciones fiscales finales', 'Documentos de confirmación por correo']};
  var priceStr=isEs?(prEs[svcId]||''):(prEn[svcId]||'');
  var badgeStr=isEs?(bgEs[svcId]||'FL'):(bgEn[svcId]||'FL');
  var timeStr=isEs?(tmEs[svcId]||''):(tmEn[svcId]||'');
  var includes=isEs?(icEs[svcId]||[]):(icEn[svcId]||[]);
  var el;
  el=document.getElementById('sum-svc-name');     if(el)el.textContent=titleFull.split(' — ')[0];
  el=document.getElementById('sum-svc-price');    if(el)el.textContent=priceStr;
  el=document.getElementById('sum-svc-badge');    if(el)el.textContent=badgeStr;
  el=document.getElementById('svc-badge-lbl');    if(el)el.textContent=badgeStr;
  el=document.getElementById('sum-includes-lbl'); if(el)el.textContent=isEs?'Qué incluye':"What's included";
  el=document.getElementById('sum-time-txt');     if(el)el.textContent=timeStr;
  el=document.getElementById('svc-back-lbl');     if(el)el.textContent=isEs?'Volver':'Back';
  el=document.getElementById('svc-secure-lbl');   if(el)el.textContent=isEs?'Seguro y cifrado':'Secure & encrypted';
  el=document.getElementById('svc-submit-lbl');   if(el)el.textContent=isEs?'Enviar Orden':'Submit Order';
  el=document.getElementById('svc-disclaimer-text'); if(el)el.textContent=isEs?'Florida Business Formation Center es un servicio de preparación de documentos, no una firma legal. No brindamos asesoría legal, fiscal ni financiera.':'Florida Business Formation Center is a document preparation service, not a law firm. We do not provide legal, tax, or financial advice.';
  var incList=document.getElementById('sum-includes-list');
  if(incList)incList.innerHTML=includes.map(function(item){return '<div class="svc-summary-item"><span class="svc-summary-check">&#10003;</span><span>'+item+'</span></div>';}).join('');
  var bodySubmit=document.getElementById('svcFormBody').querySelector('.btn-submit-svc'); if(bodySubmit)bodySubmit.parentNode.removeChild(bodySubmit);
  var bodyDisc=document.getElementById('svcFormBody').querySelector('.disclaimer');       if(bodyDisc)bodyDisc.parentNode.removeChild(bodyDisc);
  var bodySum=document.getElementById('svcFormBody').querySelector('.summary-box');       if(bodySum)bodySum.parentNode.removeChild(bodySum);
  injectSvcPayment(document.getElementById('svc-payment-area'));
  document.getElementById('svcOverlay').classList.add('active');
  document.body.style.overflow='hidden';
  document.getElementById('svcOverlay').scrollTop=0;
}

var _svcTimer=null,_activeItem=null;

function activateSvc(item){
  clearTimeout(_svcTimer);
  if(_activeItem&&_activeItem!==item){
    var prev=_activeItem.querySelector('.svc-popup');
    if(prev)prev.style.maxWidth='';
    _activeItem.classList.remove('active');
  }
  _activeItem=item;
  item.classList.add('active');
  if(!_isTouch){
    document.querySelectorAll('.svc-acc-item').forEach(function(a){
      if(a!==item)a.style.pointerEvents='none';
    });
  }
  var popup=item.querySelector('.svc-popup');
  if(popup){
    popup.style.maxWidth='';
    var rect=item.getBoundingClientRect();
    if(rect.top+300>window.innerHeight-16){popup.style.top='auto';popup.style.bottom='0';}
    else{popup.style.top='0';popup.style.bottom='auto';}
    var pr=popup.getBoundingClientRect();
    var margin=16;
    if(pr.right>window.innerWidth-margin)popup.style.maxWidth=(window.innerWidth-margin-pr.left)+'px';
    if(pr.left<margin)popup.style.maxWidth=(pr.right-margin)+'px';
  }
}

function deactivateSvc(){
  _svcTimer=setTimeout(function(){
    if(_activeItem){
      var p=_activeItem.querySelector('.svc-popup');
      if(p)p.style.maxWidth='';
      _activeItem.classList.remove('active');
      _activeItem=null;
    }
    if(!_isTouch)document.querySelectorAll('.svc-acc-item').forEach(function(a){a.style.pointerEvents='';});
  },300);
}

function touchSvc(item){
  if(window.innerWidth<=1100){
    var wasOpen=item.classList.contains('expanded');
    document.querySelectorAll('.svc-acc-item.expanded').forEach(function(i){i.classList.remove('expanded');});
    if(!wasOpen)item.classList.add('expanded');
  } else {
    var svcId=item.getAttribute('data-svc');
    if(svcId)openServiceForm(svcId);
  }
}

var _isTouch=('ontouchstart' in window||navigator.maxTouchPoints>0);
if(!_isTouch){
  document.querySelectorAll('.svc-acc-item').forEach(function(item){
    item.addEventListener('mouseenter',function(){activateSvc(item);});
    item.addEventListener('mouseleave',function(){deactivateSvc();});
  });
}

function toggleNav(){
  var nav=document.querySelector('nav');
  var btn=document.getElementById('hamburger-btn');
  if(!nav||!btn)return;
  var open=nav.classList.toggle('open');
  btn.classList.toggle('open',open);
  if(open){
    document.addEventListener('click',function closeNav(e){
      if(!nav.contains(e.target)&&!btn.contains(e.target)){
        nav.classList.remove('open');btn.classList.remove('open');
        document.removeEventListener('click',closeNav);
      }
    });
  }
}
</script>
`
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviciosSchema) }}
      />
      <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
      <ChatWidget />
    </>
  )
}
