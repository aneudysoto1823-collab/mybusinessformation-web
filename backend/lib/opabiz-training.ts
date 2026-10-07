// Entrenamiento de agentes de OpaBiz Connect (2026-10-07).
//
// Sin imports de servidor a propósito: lo usan tanto las páginas del agente
// (cliente) como las rutas de la API.
//
// La confirmación de lectura se guarda en empleado_perfil.datos_extra_json
// ({ entrenamiento: { version, aceptadoAt } }), sin columna nueva. Si el
// contenido cambia de forma importante, subir TRAINING_VERSION: a todos los
// agentes se les vuelve a pedir que lo lean.

export const TRAINING_VERSION = 1

export type TrainingLang = 'es' | 'en'

export interface TrainingStatus {
  completado: boolean
  aceptadoAt: string | null
}

export function readTrainingStatus(datosExtra: unknown): TrainingStatus {
  const extra = datosExtra && typeof datosExtra === 'object' ? datosExtra as Record<string, unknown> : {}
  const e = extra.entrenamiento && typeof extra.entrenamiento === 'object' ? extra.entrenamiento as Record<string, unknown> : null
  const completado = !!e && Number(e.version) >= TRAINING_VERSION && typeof e.aceptadoAt === 'string'
  return { completado, aceptadoAt: completado ? (e!.aceptadoAt as string) : null }
}

// Guion de apertura: lo que el agente dice al empezar cada conversación.
// Se muestra en el entrenamiento, en el panel del agente y en Claudia Agente.
export const OPENING_SCRIPT: Record<TrainingLang, string> = {
  es: '¡Hola! Mi nombre es [su nombre] y voy a ayudarle de parte de OpaBiz. Antes de empezar, le cuento rapidito cómo trabajamos: somos un servicio que le ayuda a preparar y presentar los documentos de su empresa. No somos abogados ni una oficina del gobierno, así que no damos consejos legales ni de impuestos, pero con mucho gusto le acompaño en todo el proceso del trámite. ¿Empezamos?',
  en: "Hi! My name is [your name] and I'll be helping you today on behalf of OpaBiz. Before we start, just a quick note on how we work: we're a service that helps you prepare and file your business paperwork. We're not attorneys or a government office, so we don't give legal or tax advice, but I'm happy to walk you through every step of the process. Shall we get started?",
}
