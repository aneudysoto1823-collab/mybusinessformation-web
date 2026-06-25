// Definición de campos específicos por servicio (à la carte).
//
// Fuente de verdad de los "extras" por servicio. Las MISMAS keys se usan en:
//  - el checkout del cliente (app/servicios/checkout/page.tsx → SVC_EXTRAS),
//    que guarda los valores en Order.addons.intake.extras como "svcId.fieldKey".
//  - el formulario autollenado del admin (ServicesFilingForm.tsx), que los lee.
// Si cambian las keys aquí, mantenerlas sincronizadas con el checkout.

export type FieldType = 'text' | 'tel' | 'email' | 'date' | 'select' | 'textarea' | 'repeater'

// Sub-columna de un campo 'repeater' (filas estructuradas: miembros, oficiales…)
export interface RepeaterCol {
  k: string
  en: string
  es: string
  type: 'text' | 'select'
  opts?: string[]
}

export interface ServiceField {
  k: string
  en: string
  es: string
  type: FieldType
  opts?: string[]
  /** solo para type:'repeater' — columnas de cada fila */
  cols?: RepeaterCol[]
}

export interface ServiceFieldDef {
  name_en: string
  name_es: string
  fields: ServiceField[]
}

export const SERVICE_FIELDS: Record<string, ServiceFieldDef> = {
  'ein': { name_en: 'EIN / Tax ID', name_es: 'EIN / ID Fiscal', fields: [
    { k: 'respName', en: 'Responsible party full name', es: 'Nombre completo del responsible party', type: 'text' },
    { k: 'ssnItin', en: 'SSN or ITIN of responsible party', es: 'SSN o ITIN del responsible party', type: 'text' },
    { k: 'title', en: 'Title / role', es: 'Título / rol', type: 'select', opts: ['Managing Member', 'Manager', 'Owner', 'Officer / Director'] },
    { k: 'activity', en: 'Primary business activity', es: 'Actividad principal', type: 'select', opts: ['Retail & E-Commerce', 'Real Estate', 'Restaurant / Food', 'Construction', 'Technology', 'Consulting', 'Import / Export', 'Health & Wellness', 'Other'] },
  ]},
  'itin': { name_en: 'ITIN Application', name_es: 'Solicitud de ITIN', fields: [
    { k: 'applName', en: 'Applicant full name (as on passport)', es: 'Nombre del solicitante (como en pasaporte)', type: 'text' },
    { k: 'dob', en: 'Date of birth', es: 'Fecha de nacimiento', type: 'date' },
    { k: 'countryBirth', en: 'Country of birth', es: 'País de nacimiento', type: 'text' },
    { k: 'countryCitizen', en: 'Country of citizenship', es: 'País de ciudadanía', type: 'text' },
    { k: 'reason', en: 'Reason for ITIN', es: 'Motivo del ITIN', type: 'select', opts: ['Non-resident filing US tax return', 'Spouse/dependent of US citizen/resident', 'Florida business owner requiring tax filing', 'Other'] },
    { k: 'usMailing', en: 'US mailing address (for IRS letter)', es: 'Dirección postal en EE.UU. (carta del IRS)', type: 'text' },
    { k: 'idDoc', en: 'Primary ID document', es: 'Documento de identidad principal', type: 'select', opts: ['Passport', 'Foreign national ID + birth certificate', 'Visa + passport'] },
  ]},
  'operating-agreement': { name_en: 'Operating Agreement', name_es: 'Acuerdo Operativo', fields: [
    { k: 'mgmt', en: 'Management type', es: 'Tipo de gestión', type: 'select', opts: ['Member-Managed', 'Manager-Managed'] },
    { k: 'members', en: 'Members / Owners', es: 'Miembros / Propietarios', type: 'repeater', cols: [
      { k: 'name', en: 'Full legal name', es: 'Nombre legal completo', type: 'text' },
      { k: 'pct', en: 'Ownership %', es: '% de propiedad', type: 'text' },
      { k: 'address', en: 'Address', es: 'Dirección', type: 'text' },
    ]},
    { k: 'fiscalYear', en: 'Fiscal year end', es: 'Fin de año fiscal', type: 'select', opts: ['December 31', 'March 31', 'June 30', 'September 30'] },
  ]},
  // El agente registrado actual está en Turso (registered_agent_name) — no se
  // le pide al cliente. El equipo lo ve autollenado en el bloque empresa.
  'registered-agent': { name_en: 'Registered Agent', name_es: 'Agente Registrado', fields: [] },
  'dba': { name_en: 'DBA / Fictitious Name', name_es: 'DBA / Nombre Ficticio', fields: [
    { k: 'desiredName', en: 'Desired fictitious name (DBA)', es: 'Nombre ficticio deseado (DBA)', type: 'text' },
    { k: 'altName', en: 'Alternative name (optional)', es: 'Nombre alternativo (opcional)', type: 'text' },
    { k: 'reason', en: 'Why a DBA?', es: '¿Por qué un DBA?', type: 'select', opts: ['Brand / marketing name', 'Multiple business lines', 'Website / domain', 'Different county', 'Other'] },
  ]},
  'virtual-address': { name_en: 'Virtual Mailing Address', name_es: 'Dirección Virtual', fields: [
    { k: 'plan', en: 'Plan', es: 'Plan', type: 'select', opts: ['Digital forwarding', 'Digital + physical forwarding'] },
    { k: 'forwarding', en: 'Physical forwarding address (optional)', es: 'Dirección de reenvío físico (opcional)', type: 'text' },
  ]},
  'annual-report': { name_en: 'Annual Report', name_es: 'Declaración Anual', fields: [
    { k: 'ein', en: 'EIN / Tax ID', es: 'EIN / ID Fiscal', type: 'text' },
    { k: 'officers', en: 'Officers / Managers / Directors', es: 'Oficiales / Managers / Directores', type: 'repeater', cols: [
      { k: 'title', en: 'Title', es: 'Título', type: 'select', opts: ['MGR', 'MGRM', 'President', 'VP', 'Secretary', 'Treasurer', 'Director'] },
      { k: 'name', en: 'Full name', es: 'Nombre completo', type: 'text' },
      { k: 'address', en: 'Address', es: 'Dirección', type: 'text' },
    ]},
  ]},
  'amendment': { name_en: 'Articles of Amendment', name_es: 'Artículos de Enmienda', fields: [
    { k: 'changes', en: 'What are you changing? (name, address, agent, officers...)', es: '¿Qué vas a cambiar? (nombre, dirección, agente, oficiales...)', type: 'textarea' },
    { k: 'newInfo', en: 'New / updated information', es: 'Información nueva / actualizada', type: 'textarea' },
    { k: 'authName', en: 'Authorized person name', es: 'Nombre de la persona autorizada', type: 'text' },
  ]},
  'banking-resolution': { name_en: 'Banking Resolution', name_es: 'Resolución Bancaria', fields: [
    { k: 'ein', en: 'EIN / Tax ID', es: 'EIN / ID Fiscal', type: 'text' },
    { k: 'bankName', en: 'Bank name', es: 'Nombre del banco', type: 'text' },
    { k: 'accountType', en: 'Account type', es: 'Tipo de cuenta', type: 'select', opts: ['Business Checking', 'Business Savings', 'Both'] },
    { k: 'authName', en: 'Authorized person', es: 'Persona autorizada', type: 'text' },
  ]},
  'business-tax-receipt': { name_en: 'Business Tax Receipt', name_es: 'Recibo de Impuesto', fields: [
    { k: 'ein', en: 'EIN / Tax ID', es: 'EIN / ID Fiscal', type: 'text' },
    { k: 'county', en: 'Florida county', es: 'Condado de Florida', type: 'select', opts: ['Miami-Dade', 'Broward', 'Palm Beach', 'Orange', 'Hillsborough', 'Pinellas', 'Duval', 'Other'] },
    { k: 'industry', en: 'Type of business', es: 'Tipo de negocio', type: 'text' },
    { k: 'employees', en: 'Number of employees', es: 'Número de empleados', type: 'select', opts: ['0 (Owner only)', '1-5', '6-10', '11-25', '25+'] },
  ]},
  'sales-tax-registration': { name_en: 'Sales Tax Registration', name_es: 'Registro Impuesto Ventas', fields: [
    { k: 'ein', en: 'EIN / Tax ID', es: 'EIN / ID Fiscal', type: 'text' },
    { k: 'startDate', en: 'Business start date', es: 'Fecha de inicio', type: 'date' },
    { k: 'selling', en: 'What are you selling?', es: '¿Qué vendes?', type: 'select', opts: ['Physical products', 'Food & beverages', 'Software / digital', 'Services', 'Both products & services', 'Rentals'] },
    { k: 'where', en: 'Where will you sell?', es: '¿Dónde venderás?', type: 'select', opts: ['Online only', 'Physical location in FL', 'Both', 'Wholesale'] },
    { k: 'ssnItin', en: 'Responsible party SSN or ITIN', es: 'SSN o ITIN del responsible party', type: 'text' },
  ]},
  'exclusive-guide': { name_en: 'Exclusive Formation Guide', name_es: 'Guía Exclusiva', fields: [
    { k: 'industry', en: 'Industry (optional)', es: 'Industria (opcional)', type: 'text' },
  ]},
  'good-standing': { name_en: 'Certificate of Good Standing', name_es: 'Certificado de Buena Reputación', fields: [
    { k: 'purpose', en: 'Purpose of certificate', es: 'Propósito del certificado', type: 'select', opts: ['Bank account', 'Loan / financing', 'Contract / partnership', 'Government / licensing', 'Investor', 'Apostille / international', 'Other'] },
    { k: 'copies', en: 'Number of copies', es: 'Número de copias', type: 'select', opts: ['1', '2', '3', '5'] },
    { k: 'delivery', en: 'Delivery format', es: 'Formato de entrega', type: 'select', opts: ['Digital (PDF)', 'Physical by mail', 'Both'] },
  ]},
  'scorp-election': { name_en: 'S-Corp Election (Form 2553)', name_es: 'Elección de S-Corp', fields: [
    { k: 'effectiveDate', en: 'Desired effective date', es: 'Fecha efectiva deseada', type: 'date' },
    { k: 'ein', en: 'EIN / Tax ID', es: 'EIN / ID Fiscal', type: 'text' },
    { k: 'shareholders', en: 'Shareholders / Members', es: 'Accionistas / Miembros', type: 'repeater', cols: [
      { k: 'name', en: 'Full name', es: 'Nombre completo', type: 'text' },
      { k: 'pct', en: 'Ownership %', es: '% de propiedad', type: 'text' },
      { k: 'ssnItin', en: 'SSN / ITIN', es: 'SSN / ITIN', type: 'text' },
    ]},
  ]},
  'foreign-llc': { name_en: 'Foreign Registration', name_es: 'Registro Extranjero', fields: [
    { k: 'ein', en: 'EIN / Tax ID', es: 'EIN / ID Fiscal', type: 'text' },
    { k: 'targetStates', en: 'State(s) to register in', es: 'Estado(s) donde registrar', type: 'text' },
    { k: 'reason', en: 'Reason for operating there', es: 'Motivo de operar allí', type: 'select', opts: ['Physical office / store', 'Employees there', 'Client contracts', 'Real estate', 'E-commerce fulfillment', 'Other'] },
    { k: 'targetAddress', en: 'Address in target state (if any)', es: 'Dirección en el estado destino (si aplica)', type: 'text' },
  ]},
  'business-license': { name_en: 'Business License', name_es: 'Licencia de Negocios', fields: [
    { k: 'ein', en: 'EIN / Tax ID', es: 'EIN / ID Fiscal', type: 'text' },
    { k: 'county', en: 'Florida county', es: 'Condado de Florida', type: 'select', opts: ['Miami-Dade', 'Broward', 'Palm Beach', 'Orange', 'Hillsborough', 'Pinellas', 'Duval', 'Other'] },
    { k: 'industry', en: 'Primary industry', es: 'Industria principal', type: 'text' },
    { k: 'description', en: 'Describe your business activities', es: 'Describe las actividades de tu negocio', type: 'textarea' },
  ]},
  'dissolution': { name_en: 'Business Dissolution', name_es: 'Disolución del Negocio', fields: [
    { k: 'ein', en: 'EIN / Tax ID', es: 'EIN / ID Fiscal', type: 'text' },
    { k: 'reason', en: 'Reason for dissolution', es: 'Motivo de la disolución', type: 'select', opts: ['Business permanently closed', 'Business sold', 'Changed entity type', 'Partnership dissolved', 'Retirement', 'Other'] },
    { k: 'approvedDate', en: 'Date dissolution was approved', es: 'Fecha en que se aprobó', type: 'date' },
    { k: 'authName', en: 'Authorized person', es: 'Persona autorizada', type: 'text' },
  ]},
  'cierre-fiscal': { name_en: 'Tax Account Closure', name_es: 'Cierre de Cuentas Fiscales', fields: [
    { k: 'ein', en: 'EIN / Tax ID', es: 'EIN / ID Fiscal', type: 'text' },
    { k: 'reason', en: 'Reason for closure', es: 'Motivo del cierre', type: 'select', opts: ['Business permanently closed', 'Business sold', 'Changed entity type', 'No longer operating in FL', 'Other'] },
    { k: 'lastActivity', en: 'Last business activity date', es: 'Fecha de última actividad', type: 'date' },
    { k: 'ssnItin', en: 'Responsible party SSN or ITIN', es: 'SSN o ITIN del responsible party', type: 'text' },
  ]},
  'certified-copy': { name_en: 'Certified Copy', name_es: 'Copia Certificada', fields: [
    { k: 'copies', en: 'Number of copies', es: 'Número de copias', type: 'select', opts: ['1', '2', '3', '5'] },
    { k: 'delivery', en: 'Delivery format', es: 'Formato de entrega', type: 'select', opts: ['Digital (PDF)', 'Physical by mail', 'Both'] },
  ]},
}
