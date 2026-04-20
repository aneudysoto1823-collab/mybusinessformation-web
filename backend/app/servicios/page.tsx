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
    <div class="svc-acc-item" data-svc="${s.id}" id="${s.id}">
      <div class="svc-acc-header" onclick="toggleSvc(this)">
        <div class="svc-acc-icon">${svgIcons[s.icon] || svgIcons['file-text']}</div>
        <div class="svc-acc-title-wrap">
          <div class="svc-acc-title" data-en="${s.name}" data-es="${s.name_es}">${s.name}</div>
          <div class="svc-acc-sub" data-en="${s.sub_en}" data-es="${s.sub_es}">${s.sub_en}</div>
        </div>
        <div class="svc-acc-price">${s.price}</div>
        <div class="svc-acc-chevron">${svgIcons.chevron}</div>
      </div>
      <div class="svc-acc-content">
        <div class="svc-acc-inner">
          <p class="svc-acc-desc" data-en="${s.desc_en}" data-es="${s.desc_es}">${s.desc_en}</p>
          <div class="svc-includes">
            <div class="svc-includes-title">What's included</div>
            ${s.includes_en.map((i, idx) => `<div class="svc-incl-item" data-en="<span class='svc-incl-icon'>&#10003;</span> ${i}" data-es="<span class='svc-incl-icon'>&#10003;</span> ${s.includes_es[idx]}"><span class="svc-incl-icon">&#10003;</span> ${i}</div>`).join('')}
          </div>
          <div class="svc-time" data-en="${s.time_en}" data-es="${s.time_es}">${s.time_en}</div>
          <button class="btn-svc-order" onclick="openServiceForm('${s.id}')" data-en="${s.btn_en}" data-es="${s.btn_es}">${s.btn_en}</button>
        </div>
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
.logo-text{font-family:'Fraunces',serif;font-size:.95rem;color:var(--navy);font-weight:700;line-height:1.2}
.logo-text span{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:.63rem;color:var(--gray400);font-weight:400;letter-spacing:.8px;text-transform:uppercase}
nav a{font-size:.82rem;font-weight:500;color:var(--gray600);padding:6px 10px;border-radius:6px;transition:all .2s;margin-left:2px}
nav a:hover{color:var(--navy);background:var(--gray100)}
.lang-toggle{display:flex;background:var(--gray100);border-radius:20px;padding:3px;gap:2px}
.lang-btn{padding:5px 12px;border-radius:16px;border:none;cursor:pointer;font-size:.77rem;font-weight:600;font-family:inherit;transition:all .2s;color:var(--gray400);background:transparent}
.lang-btn.active{background:var(--navy);color:#fff}
.btn-start{background:var(--green);color:#fff;padding:9px 18px;border-radius:8px;font-size:.85rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-start:hover{background:var(--green-dark)}
/* PAGE HERO */
.page-hero{background:var(--white);padding:20px 32px 18px;text-align:center;border-bottom:1px solid var(--gray100)}

.page-hero-inner{max-width:1280px;margin:0 auto;position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
@media(max-width:768px){.page-hero-inner{grid-template-columns:1fr}}
.hero-badge{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.9);font-size:.7rem;font-weight:600;padding:5px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:18px}
.page-hero h1{font-size:1.1rem;color:var(--navy);font-weight:700;margin-bottom:4px;letter-spacing:0}
.page-hero h1 em{color:var(--blue);font-style:normal}
.page-hero p{font-size:.8rem;color:var(--gray600);line-height:1.5;margin:0}
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
.btn-bundle-primary{background:var(--green);color:#fff;padding:14px 32px;border-radius:10px;font-size:.95rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-bundle-primary:hover{background:var(--green-dark)}
.btn-bundle-sec{background:rgba(255,255,255,.1);color:#fff;padding:14px 24px;border-radius:10px;font-size:.92rem;font-weight:600;border:1.5px solid rgba(255,255,255,.2);cursor:pointer;font-family:inherit;transition:all .2s}
.btn-bundle-sec:hover{background:rgba(255,255,255,.18)}
/* FOOTER */
footer{background:var(--navy);color:rgba(255,255,255,.6);padding:48px 32px 24px;margin-top:auto}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr}}
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
/* ACCORDION SERVICES LIST */
.services-accordion{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
@media(max-width:860px){.services-accordion{grid-template-columns:1fr}}
.svc-acc-item{border:1.5px solid var(--gray200);border-radius:12px;overflow:hidden;background:#fff;transition:border-color .2s,box-shadow .25s}
.svc-acc-item:hover{border-color:#cbd5e1}
.svc-acc-item.active{border-color:var(--blue);box-shadow:0 8px 28px rgba(37,99,235,.08);grid-column:1/-1}
@media(max-width:860px){.svc-acc-item.active{grid-column:auto}}
.svc-acc-header{padding:13px 16px;display:flex;align-items:center;gap:13px;cursor:pointer;background:#fff;user-select:none;transition:background .15s}
.svc-acc-header:hover{background:var(--gray50)}
.svc-acc-icon{width:38px;height:38px;border-radius:9px;background:var(--blue-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--blue)}
.svc-acc-icon svg{width:19px;height:19px}
.svc-acc-item.active .svc-acc-icon{background:var(--blue);color:#fff}
.svc-acc-title-wrap{flex:1;min-width:0}
.svc-acc-title{font-family:'Fraunces',serif;font-size:.95rem;font-weight:700;color:var(--navy);line-height:1.25;margin-bottom:2px}
.svc-acc-sub{font-size:.71rem;color:var(--gray500);line-height:1.3}
.svc-acc-price{font-family:'Fraunces',serif;font-size:.95rem;font-weight:700;color:var(--navy);flex-shrink:0;white-space:nowrap}
.svc-acc-chevron{width:22px;height:22px;color:var(--gray400);flex-shrink:0;transition:transform .25s,color .2s;display:flex;align-items:center;justify-content:center}
.svc-acc-chevron svg{width:16px;height:16px}
.svc-acc-item.active .svc-acc-chevron{transform:rotate(180deg);color:var(--blue)}
.svc-acc-content{max-height:0;overflow:hidden;transition:max-height .35s ease}
.svc-acc-item.active .svc-acc-content{max-height:1200px}
.svc-acc-inner{padding:4px 18px 20px;border-top:1px solid var(--gray100)}
.svc-acc-desc{font-size:.83rem;color:var(--gray600);line-height:1.7;margin:14px 0 16px}
.svc-acc-inner .svc-includes{margin-bottom:14px}
.svc-acc-inner .btn-svc-order{background:var(--green);color:#fff;padding:11px;border-radius:9px;font-size:.88rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all .2s;width:100%;margin-top:4px}
.svc-acc-inner .btn-svc-order:hover{background:var(--green-dark);transform:translateY(-1px)}
`
  const body = `

<div class="topbar" id="topbar-svc">&#127775; Florida's trusted business formation experts — <strong>LLC &amp; Corporation</strong> filing made simple.</div>

<header id="mainHeader">
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-mark">FL</div>
      <div class="logo-text">Florida Business Formation Center<span>mybusinessformation.com</span></div>
    </a>
    <nav>
      <a href="/">Home</a>
      <a href="/paquetes">Formation Packages</a>
      <a href="/#faq">FAQ</a>
      <a href="/#contact">Contact</a>
    </nav>
    <div style="display:flex;align-items:center;gap:11px">
      <div class="lang-toggle">
        <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
      </div>
    </div>
  </div>
</header>

<!-- SERVICES GRID -->
<section class="services-section" style="padding-top:36px">
  <div class="services-inner">
    <div style="text-align:center;margin-bottom:20px">
      <span class="section-label" id="svc-section-label">All Services</span>
      <h2 class="section-title" id="svc-section-title">Everything Your Business Needs</h2>
      <p class="section-sub" style="margin:0 auto" id="svc-section-sub">Individual services for every business need.</p>
    </div>
    <div class="services-accordion">${servicesAccordionHtml}</div>
  </div>
</section>

<!-- BUNDLE BANNER -->
<section class="bundle-section">
  <div class="bundle-inner">
    <h2>Save with a Formation Package</h2>
    <p>Our Standard and Premium packages bundle multiple services together — you'll pay less than ordering each service individually, and everything gets done at once.</p>
    <div class="bundle-btns">
      <a href="/paquetes"><button class="btn-bundle-primary">&#128197; View Formation Packages &#8594;</button></a>
      <button class="btn-bundle-sec" onclick="window.open('https://wa.me/1XXXXXXXXXX','_blank')">&#x1F4AC; Ask Us Which Is Best</button>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo-mark" style="display:inline-flex;margin-bottom:12px">FL</div>
        <div style="font-family:'Fraunces',serif;color:#fff;font-size:.95rem;font-weight:600;margin-bottom:6px">Florida Business Formation Center</div>
        <p>Professional business formation services for entrepreneurs and investors throughout Florida.</p>
        <p style="margin-top:9px;color:rgba(255,255,255,.35);font-size:.72rem">&#128231; info@mybusinessformation.com</p>
      </div>
      <div class="footer-col">
        <h5>Formation</h5>
        <a href="/paquetes?entity=llc">LLC Formation</a>
        <a href="/paquetes?entity=corp">Corporation Formation</a>
        <a href="#registered-agent" onclick="openServiceForm('registered-agent')">Registered Agent</a>
        <a href="#ein" onclick="openServiceForm('ein')">EIN / Tax ID</a>
        <a href="#operating-agreement" onclick="openServiceForm('operating-agreement')">Operating Agreement</a>
      </div>
      <div class="footer-col">
        <h5>Add-On Services</h5>
        <a href="#itin" onclick="openServiceForm('itin')">ITIN Application</a>
        <a href="#dba" onclick="openServiceForm('dba')">DBA / Fictitious Name</a>
        <a href="#amendment" onclick="openServiceForm('amendment')">Articles of Amendment</a>
        <a href="#virtual-address" onclick="openServiceForm('virtual-address')">Virtual Mailing Address</a>
        <a href="#annual-report" onclick="openServiceForm('annual-report')">Annual Report Filing</a>
      </div>
      <div class="footer-col">
        <h5>Company</h5>
        <a href="/">Home</a>
        <a href="/paquetes">Formation Packages</a>
        <a href="/#faq">FAQ</a>
        <a href="/#contact">Contact</a>
      </div>
    </div>
    <hr class="footer-divider"/>
    <div class="footer-copy">&#169; 2025 Florida Business Formation Center &middot; mybusinessformation.com &middot; All Rights Reserved.</div>
    <div class="footer-disclaimer">Florida Business Formation Center is a document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice.</div>
  </div>
</footer>

<a class="wa-float" href="https://wa.me/1XXXXXXXXXX" target="_blank">
  <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>

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
          <button class="btn-submit-svc" onclick="submitService()">&#x1F680; <span id="svc-submit-lbl">Submit Order</span> &#8594;</button>
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

var serviceForms={
'registered-agent':{
  title:'Registered Agent Service',
  title_es:'Servicio de Agente Registrado',
  sub:'We need your current business info to file the Change of Registered Agent with the Florida Division of Corporations.',
  headerClass:'',
  price:'Annual fee',
  html:\`
    <div class="info-box">&#127968; <strong>Florida Requirement:</strong> Every LLC and Corporation must maintain a Registered Agent with a physical FL address. The Change of Agent form is filed directly with the Florida Division of Corporations (Sunbiz).</div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input"><option value="">Select...</option><option>LLC</option><option>Corporation</option></select></div>
    <div class="form-group"><label class="form-label">Registered Business Name *</label><input type="text" class="form-input" placeholder="Exact name as registered with the State"/></div>
    <div class="form-group"><label class="form-label">Florida Document Number (from Sunbiz)</label><input type="text" class="form-input" placeholder="e.g. L23000123456"/></div>
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
    <button class="btn-submit-svc" onclick="submitService()">&#x1F680; Submit Order &#8594;</button>
    <div class="disclaimer">Florida Business Formation Center is not a law firm. We do not provide legal advice.</div>\`
},
'ein':{
  title:'EIN / Tax ID Number — $49',
  title_es:'Número EIN / ID Fiscal — $49',
  sub:'IRS Form SS-4 preparation and submission. Required to open a business bank account.',
  price:'$49',
  html:\`
    <div class="info-box">&#127981; <strong>Federal Requirement:</strong> Your EIN is issued by the IRS and required for federal taxes, opening a business bank account, and hiring employees.</div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input"><option value="">Select...</option><option>LLC — Single Member</option><option>LLC — Multi-Member</option><option>Corporation (S-Corp or C-Corp)</option></select></div>
    <div class="form-group"><label class="form-label">Legal Business Name *</label><input type="text" class="form-input" placeholder="Exact name as registered with FL"/></div>
    <div class="form-group"><label class="form-label">Florida Document Number (from Sunbiz)</label><input type="text" class="form-input" placeholder="Optional — helps confirm entity"/></div>
    <div class="form-group"><label class="form-label">State of Formation *</label><input type="text" class="form-input" value="Florida" readonly/></div>
    <div class="form-group"><label class="form-label">Business Start / Effective Date *</label><input type="date" class="form-input"/></div>
    <div class="section-divider">Responsible Party (Sunbiz / IRS Terms)</div>
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
    <button class="btn-submit-svc" onclick="submitService()">&#x1F680; Order EIN — $49 &#8594;</button>
    <div class="disclaimer">EIN is issued by the IRS. Processing typically takes 1–3 business days after we submit.</div>\`
},
'operating-agreement':{
  title:'Operating Agreement — $79',
  title_es:'Acuerdo Operativo — $79',
  sub:'Custom LLC Operating Agreement based on Florida statutes and your ownership structure.',
  price:'$79',
  html:\`
    <div class="info-box">&#128196; <strong>Florida Requirement:</strong> Banks require your Operating Agreement (along with your EIN and Certificate of Formation) to open a business checking account.</div>
    <div class="section-divider">LLC Information</div>
    <div class="form-group"><label class="form-label">LLC Name *</label><input type="text" class="form-input" placeholder="Exact registered name including LLC"/></div>
    <div class="form-group"><label class="form-label">State of Formation</label><input type="text" class="form-input" value="Florida" readonly/></div>
    <div class="form-group"><label class="form-label">Date of Formation / Effective Date *</label><input type="date" class="form-input"/></div>
    <div class="form-group"><label class="form-label">Principal Office Address *</label><input type="text" class="form-input" placeholder="Street address (no PO Box)"/></div>
    <div class="section-divider">Management Structure</div>
    <div class="form-group"><label class="form-label">Management Type *</label><select class="select-input"><option>Member-Managed (members run day-to-day)</option><option>Manager-Managed (designated manager runs operations)</option></select></div>
    <div class="section-divider">Members / Owners</div>
    <div id="oa-members">
      <div style="border:1.5px solid var(--gray200);border-radius:9px;padding:14px;margin-bottom:11px">
        <div style="font-size:.82rem;font-weight:600;color:var(--navy);margin-bottom:11px">Member #1</div>
        <div class="form-row"><div class="form-group"><label class="form-label">Full Legal Name *</label><input type="text" class="form-input" placeholder="First and last name"/></div><div class="form-group"><label class="form-label">Ownership % *</label><input type="number" class="form-input" placeholder="e.g. 100" min="1" max="100"/></div></div>
        <div class="form-group"><label class="form-label">Address *</label><input type="text" class="form-input" placeholder="Home or business address"/></div>
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
    <button class="btn-submit-svc" onclick="submitService()">&#x1F680; Order Operating Agreement — $79 &#8594;</button>
    <div class="disclaimer">We prepare your custom Operating Agreement within 2–5 business days.</div>\`
},
'itin':{
  title:'ITIN Application — $135',
  title_es:'Solicitud de ITIN — $135',
  sub:'IRS Form W-7 preparation for foreign nationals who need a US taxpayer identification number.',
  price:'$135',
  html:\`
    <div class="info-box">&#127760; <strong>Who needs an ITIN?</strong> Foreign nationals, non-resident aliens, and individuals who must file US taxes but are not eligible for a Social Security Number (SSN).</div>
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
    <div class="info-box">&#128196; We'll send you a complete document checklist after you submit this form. You do NOT need to mail us originals — we guide you through certified copy options.</div>
    <div class="section-divider">Contact</div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="For status updates and ITIN delivery"/></div>
    <div class="form-group"><label class="form-label">WhatsApp / Phone</label><input type="tel" class="form-input" placeholder="+1 (XXX) XXX-XXXX or international number"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>ITIN Application Service</span><span>$135</span></div><div class="summary-row"><span>IRS Application Fee</span><span>FREE</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$135</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">&#x1F680; Order ITIN Application — $135 &#8594;</button>
    <div class="disclaimer">ITIN is issued by the IRS. Processing takes 6–10 weeks. We are not a law firm and do not provide tax advice.</div>\`
},
'dba':{
  title:'DBA / Fictitious Name Filing — $49',
  title_es:'Registro DBA / Nombre Ficticio — $49',
  sub:'Register your Fictitious Name (DBA) with the Florida Division of Corporations.',
  price:'$49 + state fee',
  html:\`
    <div class="info-box">&#127991; <strong>Florida Requirement:</strong> Any business operating under a name different from its legal registered name must file a Fictitious Name Registration with the Florida Division of Corporations. Valid for 5 years.</div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input"><option value="">Select...</option><option>LLC</option><option>Corporation</option><option>Sole Proprietorship</option><option>Partnership</option></select></div>
    <div class="form-group"><label class="form-label">Legal Entity Name *</label><input type="text" class="form-input" placeholder="Your registered legal business name"/></div>
    <div class="form-group"><label class="form-label">Florida Document Number (from Sunbiz)</label><input type="text" class="form-input" placeholder="e.g. L23000123456 (if entity is registered)"/></div>
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
    <button class="btn-submit-svc" onclick="submitService()">&#x1F680; Order DBA Filing — $49 &#8594;</button>
    <div class="disclaimer">Fictitious Name is registered for 5 years per Florida Statute § 865.09. Renewal required before expiration.</div>\`
},
'virtual-address':{
  title:'Virtual Mailing Address — $29/month',
  title_es:'Dirección Postal Virtual — $29/mes',
  sub:'Professional FL address for your business. Mail received and forwarded digitally.',
  price:'$29/mo',
  html:\`
    <div class="info-box">&#128205; <strong>Privacy &amp; Professionalism:</strong> Your home address stays off all public Florida Division of Corporations records. Use this address for your business registration, website, and business cards.</div>
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
    <button class="btn-submit-svc" onclick="submitService()">&#x1F680; Activate Virtual Address — $29 &#8594;</button>
    <div class="disclaimer">Monthly subscription. Cancel anytime with 30 days written notice to info@mybusinessformation.com.</div>\`
},
'annual-report':{
  title:'Annual Report Filing',
  title_es:'Declaración Anual',
  sub:'File your Florida Annual Report on time and avoid the $400 late fee.',
  price:'Annual',
  html:\`
    <div class="warn-box">&#9888; <strong>Florida Deadline:</strong> Annual Reports must be filed between January 1 and May 1. After May 1, a $400 late penalty is imposed by the State. Continued non-filing results in administrative dissolution.</div>
    <div class="section-divider">Business Information</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input"><option value="">Select...</option><option>LLC</option><option>Corporation</option></select></div>
    <div class="form-group"><label class="form-label">Registered Business Name *</label><input type="text" class="form-input" placeholder="Exact name as registered with State of Florida"/></div>
    <div class="form-group"><label class="form-label">Florida Document Number *</label><input type="text" class="form-input" placeholder="e.g. L23000123456 — from your Sunbiz records"/></div>
    <div class="form-group"><label class="form-label">EIN / Tax ID Number *</label><input type="text" class="form-input" placeholder="XX-XXXXXXX"/></div>
    <div class="section-divider">Updated Principal Office Address</div>
    <div class="form-group"><label class="form-label">Principal Street Address *</label><input type="text" class="form-input" placeholder="Street address — no PO Box — must be in Florida"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
    <div class="section-divider">Registered Agent (Sunbiz Required Field)</div>
    <div class="form-group"><label class="form-label">Registered Agent Name *</label><input type="text" class="form-input" placeholder="Current registered agent name"/></div>
    <div class="form-group"><label class="form-label">Agent FL Street Address *</label><input type="text" class="form-input" placeholder="FL street address (no PO Box)"/></div>
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
    <button class="btn-submit-svc" onclick="submitService()">&#x1F680; Submit Annual Report Order &#8594;</button>
    <div class="disclaimer">State fees are paid to the Florida Division of Corporations. Our service fee is separate.</div>\`
},
'amendment':{
  title:'Articles of Amendment — $59',
  title_es:'Artículos de Enmienda — $59',
  sub:'Change your business name, address, registered agent, or other registered details with the State of Florida.',
  price:'$59 + state fee',
  html:\`
    <div class="info-box">&#9998; <strong>When do you need an Amendment?</strong> Whenever your registered business name, principal address, registered agent, officers/directors, or business purpose changes — you must update Sunbiz within a reasonable time.</div>
    <div class="section-divider">Business Identification</div>
    <div class="form-group"><label class="form-label">Entity Type *</label><select class="select-input"><option value="">Select...</option><option>LLC</option><option>Corporation</option></select></div>
    <div class="form-group"><label class="form-label">Current Registered Business Name *</label><input type="text" class="form-input" placeholder="Exact name as it appears in Sunbiz"/></div>
    <div class="form-group"><label class="form-label">Florida Document Number *</label><input type="text" class="form-input" placeholder="e.g. L23000123456 — from your Sunbiz certificate"/></div>
    <div class="section-divider">What Are You Amending? (Check all that apply)</div>
    <div class="form-group">
      <label class="check-label"><input type="checkbox" id="amend-name"/> Business Name Change</label>
      <label class="check-label"><input type="checkbox" id="amend-addr"/> Principal Address Change</label>
      <label class="check-label"><input type="checkbox" id="amend-mail"/> Mailing Address Change</label>
      <label class="check-label"><input type="checkbox" id="amend-agent"/> Registered Agent Change</label>
      <label class="check-label"><input type="checkbox" id="amend-officers"/> Officers / Directors / Managers Change</label>
      <label class="check-label"><input type="checkbox" id="amend-purpose"/> Business Purpose Change</label>
      <label class="check-label"><input type="checkbox" id="amend-other"/> Other</label>
    </div>
    <div class="section-divider">New / Updated Information</div>
    <div class="form-group"><label class="form-label">New Business Name (if changing)</label><input type="text" class="form-input" placeholder="New name including LLC or Corp suffix"/></div>
    <div class="form-group"><label class="form-label">New Principal Address (if changing)</label><input type="text" class="form-input" placeholder="New FL street address — no PO Box"/></div>
    <div class="form-group"><label class="form-label">New Registered Agent Name (if changing)</label><input type="text" class="form-input" placeholder="New registered agent full name or company"/></div>
    <div class="form-group"><label class="form-label">New Registered Agent FL Address</label><input type="text" class="form-input" placeholder="FL physical street address"/></div>
    <div class="form-group"><label class="form-label">Describe Other Changes</label><textarea class="form-input" rows="3" placeholder="Describe any other amendments in detail..."></textarea></div>
    <div class="section-divider">Adoption Method</div>
    <div class="form-group"><label class="form-label">How was this amendment approved? *</label><select class="select-input"><option>By the members/managers/directors</option><option>By written consent of all members</option><option>By majority vote at a duly noticed meeting</option><option>By the authorized manager acting alone</option></select></div>
    <div class="section-divider">Contact &amp; Signature</div>
    <div class="form-row"><div class="form-group"><label class="form-label">Name of Authorized Person *</label><input type="text" class="form-input" placeholder="Who is authorizing this amendment"/></div><div class="form-group"><label class="form-label">Title / Role *</label><input type="text" class="form-input" placeholder="Managing Member, Director, etc."/></div></div>
    <div class="form-group"><label class="form-label">Email *</label><input type="email" class="form-input" placeholder="Confirmation and document delivery"/></div>
    <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div>
    <div class="summary-box"><div class="summary-row"><span>Articles of Amendment Service</span><span>$59</span></div><div class="summary-row"><span>FL Division of Corporations Filing Fee</span><span>~$25</span></div><div class="summary-row"><span style="font-weight:700">Total Today</span><span>$59 + state fee</span></div></div>
    <button class="btn-submit-svc" onclick="submitService()">&#x1F680; Order Articles of Amendment &#8594;</button>
    <div class="disclaimer">Florida state filing fee is approximately $25 for LLC and $35 for Corporation, paid to the FL Division of Corporations.</div>\`
}
};

function submitService(){
  var num=genOrderNum();
  document.getElementById('svcFormBody').innerHTML=\`
    <div class="success-screen">
      <div class="success-icon">&#x2705;</div>
      <h3>Order Submitted!</h3>
      <p>Your request has been received. A member of our team will contact you within one business day to confirm details and complete your order.</p>
      <div class="order-display"><span>Your Order Number</span><strong>\${num}</strong></div>
      <p style="font-size:.82rem;color:var(--gray600);margin-bottom:20px">Keep this number for your records. Our team will reference it when we contact you.</p>
      <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">
        <button onclick="window.open('https://wa.me/1XXXXXXXXXX','_blank')" style="background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;font-size:.85rem;font-weight:600;border:none;cursor:pointer;font-family:inherit">&#x1F4AC; WhatsApp Us</button>
        <button onclick="closeServiceForm()" style="background:var(--navy);color:#fff;padding:10px 20px;border-radius:8px;font-size:.84rem;font-weight:600;border:none;cursor:pointer;font-family:inherit">Close</button>
      </div>
    </div>\`;
}
function addOAMember(){
  var c=document.getElementById('oa-members');if(!c)return;
  var n=c.children.length+1;
  var d=document.createElement('div');
  d.style.cssText='border:1.5px solid var(--gray200);border-radius:9px;padding:14px;margin-bottom:11px';
  d.innerHTML='<div style="font-size:.82rem;font-weight:600;color:var(--navy);margin-bottom:11px">Member #'+n+'</div><div class="form-row"><div class="form-group"><label class="form-label">Full Legal Name</label><input type="text" class="form-input" placeholder="Name"/></div><div class="form-group"><label class="form-label">Ownership %</label><input type="number" class="form-input" placeholder="%" min="1" max="100"/></div></div><div class="form-group"><label class="form-label">Address</label><input type="text" class="form-input" placeholder="Address"/></div>';
  c.appendChild(d);
}
function addARPerson(){
  var c=document.getElementById('ar-officers');if(!c)return;
  var d=document.createElement('div');
  d.style.cssText='border:1.5px solid var(--gray200);border-radius:9px;padding:14px;margin-bottom:11px';
  d.innerHTML='<div class="form-row-3"><div class="form-group"><label class="form-label">Title</label><select class="select-input"><option>MGR</option><option>President</option><option>Director</option><option>VP</option><option>Secretary</option></select></div><div class="form-group"><label class="form-label">Full Name</label><input type="text" class="form-input" placeholder="Name"/></div><div class="form-group"><label class="form-label">Address</label><input type="text" class="form-input" placeholder="Address"/></div></div>';
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
  var iE={'registered-agent':['Dirección oficial en FL para tu negocio','Acepta notificaciones y documentos legales','Cambio de Agente Registrado tramitado ante el estado','Reenvío de documentos y notificación por correo'],'ein':['Preparación y envío de la solicitud de EIN ante el IRS','Verificación del nombre del negocio','Entrega del EIN en 1-3 días hábiles','Soporte durante todo el proceso'],'operating-agreement':['Acuerdo Operativo personalizado para tu LLC','Cubre estructura de propiedad, gestión y finanzas','Entrega digital en 2-5 días hábiles','Listo para bancos e instituciones financieras'],'itin':['Preparación del Formulario W-7 del IRS','Guía sobre documentos requeridos','Presentación ante el IRS en tu nombre','El ITIN llega en 6-10 semanas (procesamiento IRS)'],'dba':['Registro del Nombre Ficticio ante la División de Corporaciones FL','Validez por 5 años','Publicación en periódico si aplica','Entrega en 1-3 días hábiles'],'virtual-address':['Dirección postal profesional en Florida','Recepción y escaneo de correspondencia','Notificación digital cuando llega correo','Tu dirección personal no aparece en registros públicos'],'annual-report':['Preparación y envío de la Declaración Anual ante Sunbiz','Verificación de datos registrados','Confirmación de presentación exitosa','Protección contra multas y disolución'],'amendment':['Preparación del documento de enmienda','Tramitación ante la División de Corporaciones FL','Verificación de registros actuales','Confirmación y entrega en 1-3 días hábiles']};
  var iEn={'registered-agent':['Official FL street address for your business','Accepts service of process &amp; legal documents','Change of Registered Agent filed with state','Document forwarding &amp; email notifications'],'ein':['IRS EIN application preparation and submission','Business name verification','EIN delivered within 1-3 business days','Full support throughout the process'],'operating-agreement':['Custom Operating Agreement for your LLC','Covers ownership, management &amp; finances','Digital delivery in 2-5 business days','Ready for banks and financial institutions'],'itin':['IRS Form W-7 preparation','Guidance on required documents','Filing with the IRS on your behalf','ITIN arrives in 6-10 weeks (IRS processing)'],'dba':['Fictitious Name registration with FL Division of Corporations','Valid for 5 years','Newspaper publication if required','Delivered in 1-3 business days'],'virtual-address':['Professional FL mailing address','Mail receipt and scanning','Digital notification when mail arrives','Your personal address stays off public records'],'annual-report':['Annual Report preparation and submission to Sunbiz','Verification of current registered data','Confirmation of successful filing','Protection against late fees and dissolution'],'amendment':['Amendment document preparation','Filed with FL Division of Corporations','Verification of current records','Confirmation and delivery in 1-3 business days']};
  Object.keys(iE).forEach(function(sid){var card=document.getElementById(sid);if(!card)return;card.querySelectorAll('.svc-incl-item').forEach(function(item,i){var icon=item.querySelector('.svc-incl-icon');var iH=icon?icon.outerHTML:'<span class="svc-incl-icon">&#10003;</span>';var arr=isEs?iE[sid]:iEn[sid];if(arr&&arr[i]!==undefined)item.innerHTML=iH+' '+arr[i];});});
  var e;
  e=document.getElementById('bundle-title');    if(e)e.textContent=isEs?'Ahorra con un Paquete de Formación':'Save with a Formation Package';
  e=document.getElementById('bundle-sub');      if(e)e.textContent=isEs?'Nuestros paquetes Standard y Premium combinan varios servicios — pagas menos que ordenándolos individualmente.':'Our Standard and Premium packages bundle multiple services — pay less than ordering individually.';
  e=document.getElementById('bundle-btn-main'); if(e)e.innerHTML=isEs?'&#128197; Ver Paquetes de Formación &#8594;':'&#128197; View Formation Packages &#8594;';
  e=document.getElementById('bundle-btn-sec');  if(e)e.innerHTML=isEs?'&#x1F4AC; Pregúntanos cuál es mejor':'&#x1F4AC; Ask Us Which Is Best';
  var fbrand=document.querySelector('.footer-brand p'); if(fbrand)fbrand.textContent=isEs?'Servicios profesionales de formación empresarial para emprendedores e inversionistas en toda Florida.':'Professional business formation services for entrepreneurs and investors throughout Florida.';
  var fd=document.querySelector('.footer-disclaimer'); if(fd)fd.innerHTML=isEs?'<strong>Aviso Importante:</strong> Florida Business Formation Center es un servicio de preparación de documentos. No somos una firma legal.':'<strong>Important Notice:</strong> Florida Business Formation Center is a document preparation service. We are not a law firm.';
  var copy=document.querySelector('.footer-copy'); if(copy)copy.innerHTML=isEs?'&#169; 2025 Florida Business Formation Center &middot; Todos los Derechos Reservados.':'&#169; 2025 Florida Business Formation Center &middot; All Rights Reserved.';
  var tb=document.getElementById('topbar-svc'); if(tb)tb.innerHTML=isEs?'&#127775; Expertos en formación empresarial en Florida — <strong>LLC &amp; Corporación</strong> fácil y rápido.':'&#127775; Florida&#39;s trusted business formation experts — <strong>LLC &amp; Corporation</strong> filing made simple.';
  var navM={'How It Works':isEs?'Cómo Funciona':'How It Works','Packages':isEs?'Paquetes':'Packages','Formation Packages':isEs?'Paquetes de Formación':'Formation Packages','Services':isEs?'Servicios':'Services','FAQ':isEs?'Preguntas':'FAQ','Contact':isEs?'Contacto':'Contact','Home':isEs?'Inicio':'Home'};
  document.querySelectorAll('nav a').forEach(function(a){var t=a.textContent.trim();if(navM[t])a.textContent=navM[t];});
  if(document.getElementById('svcOverlay')&&document.getElementById('svcOverlay').classList.contains('active')){translateFormLabels();}
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

(function(){var l=localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();
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
  area.innerHTML='<div style="margin-top:16px"><div style="font-size:.72rem;font-weight:600;color:var(--gray400);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">'+(es?'M&eacute;todo de Pago':'Payment Method')+'</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><button type="button" onclick="toggleSvcPayMethod(this)" style="background:#fff;border:1.5px solid var(--gray200);padding:6px 14px;border-radius:7px;font-size:.79rem;font-weight:600;color:var(--navy);cursor:pointer;font-family:inherit">&#128179; '+(es?'Cr&eacute;dito / D&eacute;bito':'Credit / Debit')+' &#9660;</button><span style="background:#fff;border:1.5px solid var(--gray200);padding:6px 14px;border-radius:7px;font-size:.79rem;font-weight:600;color:var(--navy)">&#63743; Apple Pay</span><span style="background:#fff;border:1.5px solid var(--gray200);padding:6px 14px;border-radius:7px;font-size:.79rem;font-weight:600;color:var(--navy)">&#128247; Zelle</span></div><div id="svc-pay-card" style="display:none;background:#f8fafc;border:1.5px solid var(--blue);border-radius:10px;padding:14px;margin-bottom:10px"><div style="font-size:.72rem;font-weight:600;color:var(--blue);text-transform:uppercase;margin-bottom:12px">'+(es?'Informaci&oacute;n de la Tarjeta':'Card Information')+'</div><div class="form-group"><label class="form-label">'+(es?'Nombre en la Tarjeta':'Name on Card')+'</label><input type="text" class="form-input" placeholder="'+(es?'Nombre como aparece en la tarjeta':'Full name as on card')+'"/></div><div class="form-group"><label class="form-label">'+(es?'N&uacute;mero de Tarjeta':'Card Number')+'</label><input type="text" class="form-input" placeholder="•••• •••• •••• ••••" maxlength="19"/></div><div style="display:flex;gap:12px"><div class="form-group" style="flex:1"><label class="form-label">'+(es?'Vencimiento':'Expiry')+'</label><input type="text" class="form-input" placeholder="MM/YY" maxlength="5"/></div><div class="form-group" style="flex:1"><label class="form-label">CVV</label><input type="text" class="form-input" placeholder="•••" maxlength="4"/></div></div></div><p style="font-size:.71rem;color:var(--gray500)">&#128274; '+(es?'Al enviar te contactamos en 1 hora h&aacute;bil para confirmar el pago.':'After submitting our team contacts you within 1 business hour to confirm payment.')+'</p></div>';
}

function translateFormLabels(){
  var isEs=document.getElementById('btn-es').classList.contains('active');
  var fb=document.getElementById('svcFormBody');if(!fb)return;
  var L={'Full Name *':isEs?'Nombre Completo *':'Full Name *','Full Name':isEs?'Nombre Completo':'Full Name','Email *':isEs?'Correo Electrónico *':'Email *','Email':isEs?'Correo Electrónico':'Email','Phone':isEs?'Teléfono':'Phone','Phone *':isEs?'Teléfono *':'Phone *','WhatsApp / Phone':isEs?'WhatsApp / Teléfono':'WhatsApp / Phone','Address':isEs?'Dirección':'Address','Address *':isEs?'Dirección *':'Address *','City':isEs?'Ciudad':'City','City *':isEs?'Ciudad *':'City *','ZIP':isEs?'Código Postal':'ZIP','Entity Type *':isEs?'Tipo de Entidad *':'Entity Type *','Entity Type':isEs?'Tipo de Entidad':'Entity Type','Registered Business Name *':isEs?'Nombre Registrado del Negocio *':'Registered Business Name *','Florida Document Number (from Sunbiz)':isEs?'Número de Documento FL (de Sunbiz)':'Florida Document Number (from Sunbiz)','Florida Document Number *':isEs?'Número de Documento FL *':'Florida Document Number *','Current Agent Name':isEs?'Nombre del Agente Actual':'Current Agent Name','Principal Business Street Address *':isEs?'Dirección Principal del Negocio *':'Principal Business Street Address *','Your Name *':isEs?'Tu Nombre *':'Your Name *','Electronic Signature *':isEs?'Firma Electrónica *':'Electronic Signature *','Email for Mail Notifications *':isEs?'Correo para Notificaciones *':'Email for Mail Notifications *','Business Name *':isEs?'Nombre del Negocio *':'Business Name *','Responsible Party Name *':isEs?'Nombre del Responsable *':'Responsible Party Name *','SSN or ITIN of Responsible Party *':isEs?'SSN o ITIN del Responsable *':'SSN or ITIN of Responsible Party *','Business Start / Effective Date *':isEs?'Fecha de Inicio / Vigencia *':'Business Start / Effective Date *','LLC Name *':isEs?'Nombre de la LLC *':'LLC Name *','Management Type *':isEs?'Tipo de Gestión *':'Management Type *','Member Name':isEs?'Nombre del Miembro':'Member Name','Ownership % *':isEs?'% de Propiedad *':'Ownership % *','First Name *':isEs?'Nombre *':'First Name *','Last Name *':isEs?'Apellido *':'Last Name *','Date of Birth *':isEs?'Fecha de Nacimiento *':'Date of Birth *','Country of Citizenship *':isEs?'País de Ciudadanía *':'Country of Citizenship *','Country of Birth *':isEs?'País de Nacimiento *':'Country of Birth *','Primary ID Document *':isEs?'Documento de Identidad Principal *':'Primary ID Document *','US Mailing Address *':isEs?'Dirección Postal en EE.UU. *':'US Mailing Address *','Primary Reason *':isEs?'Razón Principal *':'Primary Reason *','Desired Fictitious Name *':isEs?'Nombre Ficticio Deseado *':'Desired Fictitious Name *','Alternative Name #1 (optional)':isEs?'Nombre Alternativo #1 (opcional)':'Alternative Name #1 (optional)','County':isEs?'Condado':'County','Physical Forwarding Address (if needed)':isEs?'Dirección de Reenvío Físico (si aplica)':'Physical Forwarding Address (if needed)','Plan':isEs?'Plan':'Plan','Florida Business Address *':isEs?'Dirección Empresarial en Florida *':'Florida Business Address *','Name of Authorized Person *':isEs?'Nombre de la Persona Autorizada *':'Name of Authorized Person *','EIN / Tax ID Number *':isEs?'EIN / Número de ID Fiscal *':'EIN / Tax ID Number *','Type of Amendment':isEs?'Tipo de Enmienda':'Type of Amendment','New Business Name (if changing)':isEs?'Nuevo Nombre del Negocio (si cambia)':'New Business Name (if changing)','Describe Other Changes':isEs?'Describe Otros Cambios':'Describe Other Changes','How was this amendment approved? *':isEs?'¿Cómo fue aprobada esta enmienda? *':'How was this amendment approved? *','State of Formation *':isEs?'Estado de Formación *':'State of Formation *','Principal Office Address *':isEs?'Dirección de la Oficina Principal *':'Principal Office Address *','Title / Role *':isEs?'Título / Cargo *':'Title / Role *'};
  var P={'Exact name as registered with the State':isEs?'Nombre exacto como está registrado ante el Estado':'Exact name as registered with the State','Exact name as it appears in Sunbiz':isEs?'Nombre exacto como aparece en Sunbiz':'Exact name as it appears in Sunbiz','e.g. L23000123456':'e.g. L23000123456','Name of agent you are replacing':isEs?'Nombre del agente que estás reemplazando':'Name of agent you are replacing','Street address — no PO Box':isEs?'Dirección — sin apartado postal':'Street address — no PO Box','FL physical street address':isEs?'Dirección física en FL':'FL physical street address','City':isEs?'Ciudad':'City','ZIP':isEs?'Código Postal':'ZIP','Authorized representative':isEs?'Representante autorizado':'Authorized representative','you@email.com':isEs?'tucorreo@ejemplo.com':'you@email.com','Type your full legal name — constitutes your signature':isEs?'Escribe tu nombre legal completo — constituye tu firma':'Type your full legal name — constitutes your signature','Type full legal name — authorizes Annual Report filing':isEs?'Escribe tu nombre legal completo — autoriza la Declaración Anual':'Type full legal name — authorizes Annual Report filing','The DBA name you want to use (no LLC/Corp suffix needed)':isEs?'El nombre DBA que quieres usar (sin sufijo LLC/Corp)':'The DBA name you want to use (no LLC/Corp suffix needed)','Backup DBA name':isEs?'Nombre DBA alternativo':'Backup DBA name','We email you when mail arrives':isEs?'Te notificamos por correo cuando llega correspondencia':'We email you when mail arrives','Where to forward physical mail (optional)':isEs?'Dónde reenviar correo físico (opcional)':'Where to forward physical mail (optional)','New FL street address — no PO Box':isEs?'Nueva dirección FL — sin apartado postal':'New FL street address — no PO Box','Describe any other amendments in detail...':isEs?'Describe cualquier otra enmienda en detalle...':'Describe any other amendments in detail...'};
  fb.querySelectorAll('.form-label').forEach(function(el){var t=el.textContent.trim();if(L[t])el.textContent=L[t];});
  fb.querySelectorAll('[placeholder]').forEach(function(el){var p=el.getAttribute('placeholder');if(P[p])el.setAttribute('placeholder',P[p]);});
  var SD={'Business Information':'Información del Negocio','Business Identification':'Identificación del Negocio','Business Address':'Dirección del Negocio','Current Registered Agent (if applicable)':'Agente Registrado Actual (si aplica)','New / Updated Information':'Información Nueva / Actualizada','Registered Agent (Sunbiz Required Field)':'Agente Registrado (Campo Requerido Sunbiz)','Responsible Party (Sunbiz / IRS Terms)':'Parte Responsable (Términos Sunbiz / IRS)','Contact':'Contacto','Contact & Business Purpose':'Contacto y Propósito del Negocio','Contact &amp; Business Purpose':'Contacto y Propósito del Negocio','Contact & Forwarding':'Contacto y Reenvío','Contact &amp; Forwarding':'Contacto y Reenvío','Contact & Signature':'Contacto y Firma','Contact &amp; Signature':'Contacto y Firma','Owner / Authorized Representative':'Propietario / Representante Autorizado','LLC Information':'Información de la LLC','Management Structure':'Estructura de Gestión','Members / Owners':'Miembros / Propietarios','Applicant Information (IRS Form W-7)':'Información del Solicitante (Formulario W-7 del IRS)','Reason for ITIN Application':'Razón de la Solicitud de ITIN','Identity Documents':'Documentos de Identidad','US Address (Mailing)':'Dirección Postal en EE.UU.','Fictitious Name (DBA)':'Nombre Ficticio (DBA)','Service Options':'Opciones de Servicio','Updated Principal Office Address':'Dirección Actualizada de la Oficina Principal','What Are You Amending? (Check all that apply)':'¿Qué Estás Enmendando? (Marca todas las que apliquen)'};
  fb.querySelectorAll('.section-divider').forEach(function(el){var t=el.textContent.trim();if(isEs&&SD[t])el.textContent=SD[t];else if(!isEs){Object.keys(SD).forEach(function(en){if(SD[en]===t)el.textContent=en;});}});
  fb.querySelectorAll('select option').forEach(function(opt){var map={'Select...':isEs?'Seleccionar...':'Select...','Corporation':isEs?'Corporación':'Corporation','Member-Managed':isEs?'Gestionado por Miembros':'Member-Managed','Manager-Managed':isEs?'Gestionado por Gerente':'Manager-Managed'};var t=opt.textContent.trim();if(map[t]!==undefined)opt.textContent=map[t];});
  if(window.currentService){
    var ibEn={'registered-agent':'&#127968; <strong>Florida Requirement:<\\/strong> Every LLC and Corporation must maintain a Registered Agent with a physical FL address. Filed directly with the Florida Division of Corporations (Sunbiz).','ein':'&#127981; <strong>Federal Requirement:<\\/strong> Your EIN is issued by the IRS and required for federal taxes, opening a business bank account, and hiring employees.','operating-agreement':'&#128196; <strong>Florida Requirement:<\\/strong> Banks require your Operating Agreement (along with your EIN and Certificate of Formation) to open a business checking account.','itin':'&#127760; <strong>Who needs an ITIN?<\\/strong> Foreign nationals, non-resident aliens, and individuals who must file US taxes but are not eligible for a Social Security Number (SSN).','dba':'&#127991; <strong>Florida Requirement:<\\/strong> Any business operating under a name different from its legal registered name must file a Fictitious Name Registration with the FL Division of Corporations. Valid for 5 years.','virtual-address':'&#128205; <strong>Privacy &amp; Professionalism:<\\/strong> Your home address stays off all public Florida Division of Corporations records.','annual-report':'&#9888; <strong>Florida Deadline:<\\/strong> Annual Reports must be filed between January 1 and May 1. After May 1, a $400 late penalty is imposed. Continued non-filing results in administrative dissolution.','amendment':'&#9998; <strong>When do you need an Amendment?<\\/strong> Whenever your registered business name, principal address, registered agent, or officers change.'};
    var ibEs={'registered-agent':'&#127968; <strong>Requisito de Florida:<\\/strong> Toda LLC y Corporación debe mantener un Agente Registrado con dirección física en FL. Se tramita directamente ante la División de Corporaciones de Florida (Sunbiz).','ein':'&#127981; <strong>Requisito Federal:<\\/strong> Tu EIN es emitido por el IRS y requerido para impuestos federales, abrir una cuenta bancaria empresarial y contratar empleados.','operating-agreement':'&#128196; <strong>Requisito de Florida:<\\/strong> Los bancos requieren tu Acuerdo Operativo (junto con tu EIN y Certificado de Formación) para abrir una cuenta corriente empresarial.','itin':'&#127760; <strong>¿Quién necesita un ITIN?<\\/strong> Extranjeros, no residentes, y personas que deben presentar impuestos en EE.UU. pero no son elegibles para un Número de Seguro Social (SSN).','dba':'&#127991; <strong>Requisito de Florida:<\\/strong> Todo negocio que opere bajo un nombre diferente a su nombre legal registrado debe presentar un Registro de Nombre Ficticio ante la División de Corporaciones de Florida. Válido por 5 años.','virtual-address':'&#128205; <strong>Privacidad y Profesionalismo:<\\/strong> Tu dirección personal no aparecerá en los registros públicos de la División de Corporaciones de Florida.','annual-report':'&#9888; <strong>Fecha Límite de Florida:<\\/strong> Las Declaraciones Anuales deben presentarse entre el 1 de enero y el 1 de mayo. Después del 1 de mayo se impone una multa de $400.','amendment':'&#9998; <strong>¿Cuándo necesitas una Enmienda?<\\/strong> Cuando cambia el nombre registrado, dirección principal, agente registrado u oficiales.'};
    var ib=fb.querySelector('.info-box,.warn-box');
    if(ib&&ibEn[window.currentService])ib.innerHTML=isEs?ibEs[window.currentService]:ibEn[window.currentService];
  }
}

function openServiceForm(svcId){
  var svc=serviceForms[svcId];if(!svc)return;
  currentService=svcId;window.currentService=svcId;
  var isEs=document.getElementById('btn-es').classList.contains('active');
  document.getElementById('svcFormTitle').textContent=isEs&&svc.title_es?svc.title_es:svc.title;
  document.getElementById('svcFormSub').textContent=isEs&&svc.sub_es?svc.sub_es:svc.sub;
  document.getElementById('svcFormBody').innerHTML=svc.html;
  if(isEs){translateFormLabels();}
  var prEn={'registered-agent':'Annual Fee', 'ein':'$49 — One-time fee', 'operating-agreement':'$79 — One-time fee', 'itin':'$135 — One-time fee', 'dba':'$49 + FL state fee', 'virtual-address':'$29/month — Cancel anytime', 'annual-report':'Annual Service', 'amendment':'$59 + FL state fee'};
  var prEs={'registered-agent':'Tarifa Anual', 'ein':'$49 — Pago único', 'operating-agreement':'$79 — Pago único', 'itin':'$135 — Pago único', 'dba':'$49 + tarifa estatal FL', 'virtual-address':'$29/mes — Cancela cuando quieras', 'annual-report':'Servicio Anual', 'amendment':'$59 + tarifa estatal FL'};
  var bgEn={'registered-agent':'Required by FL Law', 'ein':'Federal Requirement', 'operating-agreement':'Bank Required', 'itin':'IRS Issued', 'dba':'FL State Filing', 'virtual-address':'Privacy Protection', 'annual-report':'Deadline: May 1', 'amendment':'FL State Filing'};
  var bgEs={'registered-agent':'Requerido por Ley en FL', 'ein':'Requisito Federal', 'operating-agreement':'Requerido por el Banco', 'itin':'Emitido por el IRS', 'dba':'Trámite Estatal FL', 'virtual-address':'Protección de Privacidad', 'annual-report':'Fecha Límite: 1 de mayo', 'amendment':'Trámite Estatal FL'};
  var tmEn={'registered-agent':'Same business day filing', 'ein':'1-3 business days', 'operating-agreement':'2-5 business days', 'itin':'6-10 weeks (IRS processing)', 'dba':'1-3 business days', 'virtual-address':'Active same business day', 'annual-report':'Filed within 24 hours', 'amendment':'1-3 business days'};
  var tmEs={'registered-agent':'Tramitación el mismo día hábil', 'ein':'1-3 días hábiles', 'operating-agreement':'2-5 días hábiles', 'itin':'6-10 semanas (proceso IRS)', 'dba':'1-3 días hábiles', 'virtual-address':'Activa el mismo día hábil', 'annual-report':'Tramitado en 24 horas', 'amendment':'1-3 días hábiles'};
  var icEn={'registered-agent':['Official FL street address', 'Legal document acceptance', 'Change of Agent filing', 'Document forwarding & notifications'], 'ein':['IRS EIN application prep', 'Business name verification', 'EIN in 1-3 business days', 'Full support throughout'], 'operating-agreement':['Custom LLC Operating Agreement', 'Covers ownership & management', 'Digital delivery in 2-5 days', 'Bank-ready document'], 'itin':['IRS Form W-7 preparation', 'Required documents guidance', 'IRS filing on your behalf', 'ITIN in 6-10 weeks'], 'dba':['Fictitious Name registration', 'FL Division of Corporations filing', 'Valid for 5 years', '1-3 business days delivery'], 'virtual-address':['Professional FL mailing address', 'Mail scanning & forwarding', 'Email notification on arrival', 'Keeps home address private'], 'annual-report':['Annual Report prep & submission', 'Current data verification', 'Sunbiz filing confirmation', 'Avoid $400 late penalty'], 'amendment':['Amendment document preparation', 'FL Division of Corporations filing', 'Current records verification', '1-3 business days delivery']};
  var icEs={'registered-agent':['Dirección oficial en FL', 'Acepta documentos legales', 'Tramitación del Cambio de Agente', 'Reenvío y notificaciones'], 'ein':['Preparación solicitud EIN', 'Verificación del nombre', 'EIN en 1-3 días hábiles', 'Soporte durante el proceso'], 'operating-agreement':['Acuerdo Operativo personalizado', 'Cubre propiedad y gestión', 'Entrega digital en 2-5 días', 'Listo para el banco'], 'itin':['Preparación Formulario W-7', 'Guía de documentos requeridos', 'Presentación ante el IRS', 'ITIN en 6-10 semanas'], 'dba':['Registro de Nombre Ficticio', 'Trámite ante División de Corp. FL', 'Válido por 5 años', 'Entrega en 1-3 días hábiles'], 'virtual-address':['Dirección postal profesional en FL', 'Escaneo y reenvío de correo', 'Notificación por email', 'Dirección personal privada'], 'annual-report':['Preparación y envío a Sunbiz', 'Verificación de datos actuales', 'Confirmación de presentación', 'Evita multa de $400'], 'amendment':['Preparación del documento', 'Trámite ante División de Corp. FL', 'Verificación de registros actuales', 'Entrega en 1-3 días hábiles']};
  var priceStr=isEs?(prEs[svcId]||''):(prEn[svcId]||'');
  var badgeStr=isEs?(bgEs[svcId]||'FL'):(bgEn[svcId]||'FL');
  var timeStr=isEs?(tmEs[svcId]||''):(tmEn[svcId]||'');
  var includes=isEs?(icEs[svcId]||[]):(icEn[svcId]||[]);
  var el;
  el=document.getElementById('sum-svc-name');     if(el)el.textContent=isEs&&svc.title_es?svc.title_es:svc.title;
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

function toggleSvc(headerEl){
  var item=headerEl.parentElement;
  var wasActive=item.classList.contains('active');
  var actives=document.querySelectorAll('.svc-acc-item.active');
  for(var i=0;i<actives.length;i++)actives[i].classList.remove('active');
  if(!wasActive){
    item.classList.add('active');
    var id=item.getAttribute('data-svc');
    try{window.history.pushState({svcOpen:id},'','#'+id);}catch(e){}
    setTimeout(function(){item.scrollIntoView({behavior:'smooth',block:'nearest'});},200);
  } else {
    if(window.history.state && window.history.state.svcOpen){
      try{window.history.back();}catch(e){}
    }
  }
}

window.addEventListener('popstate',function(e){
  var actives=document.querySelectorAll('.svc-acc-item.active');
  for(var i=0;i<actives.length;i++)actives[i].classList.remove('active');
  if(e.state && e.state.svcOpen){
    var item=document.querySelector('.svc-acc-item[data-svc="'+e.state.svcOpen+'"]');
    if(item){
      item.classList.add('active');
      setTimeout(function(){item.scrollIntoView({behavior:'smooth',block:'nearest'});},100);
    }
  }
});
</script>
`
  return (
    <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
  )
}
