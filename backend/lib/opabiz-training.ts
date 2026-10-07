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
  // Resultado de las preguntas de repaso (null si se completó sin ellas).
  quiz: { correctas: number; total: number } | null
}

export function readTrainingStatus(datosExtra: unknown): TrainingStatus {
  const extra = datosExtra && typeof datosExtra === 'object' ? datosExtra as Record<string, unknown> : {}
  const e = extra.entrenamiento && typeof extra.entrenamiento === 'object' ? extra.entrenamiento as Record<string, unknown> : null
  const completado = !!e && Number(e.version) >= TRAINING_VERSION && typeof e.aceptadoAt === 'string'
  const q = completado && e!.quiz && typeof e!.quiz === 'object' ? e!.quiz as Record<string, unknown> : null
  const quiz = q && Number.isFinite(Number(q.correctas)) && Number.isFinite(Number(q.total))
    ? { correctas: Number(q.correctas), total: Number(q.total) }
    : null
  return { completado, aceptadoAt: completado ? (e!.aceptadoAt as string) : null, quiz }
}

// Guion de apertura: lo que el agente dice al empezar cada conversación.
// Se muestra en el entrenamiento, en el panel del agente y en Claudia Agente.
export const OPENING_SCRIPT: Record<TrainingLang, string> = {
  es: '¡Hola! Mi nombre es [su nombre] y voy a ayudarle de parte de OpaBiz. Antes de empezar, le cuento rapidito cómo trabajamos: somos un servicio que le ayuda a preparar y presentar los documentos de su empresa. No somos abogados ni una oficina del gobierno, así que no damos consejos legales ni de impuestos, pero con mucho gusto le acompaño en todo el proceso del trámite. ¿Empezamos?',
  en: "Hi! My name is [your name] and I'll be helping you today on behalf of OpaBiz. Before we start, just a quick note on how we work: we're a service that helps you prepare and file your business paperwork. We're not attorneys or a government office, so we don't give legal or tax advice, but I'm happy to walk you through every step of the process. Shall we get started?",
}

// Preguntas de repaso al final del entrenamiento (2026-10-07). Opción
// múltiple; no se aprueba ni reprueba: al revisar, en las que falló se le
// muestra la respuesta correcta con la explicación. La posición de la
// respuesta correcta varía a propósito. Mismo orden de preguntas y opciones en
// los dos idiomas (el índice `correcta` vale para ambos).
export interface QuizQuestion {
  pregunta: string
  opciones: string[]
  correcta: number
  explicacion: string
}

export const TRAINING_QUIZ: Record<TrainingLang, QuizQuestion[]> = {
  es: [
    {
      pregunta: 'Al empezar una conversación con un cliente, ¿qué le cuentas primero?',
      opciones: [
        'Que somos una oficina del Estado de Florida que procesa empresas.',
        'Que somos un servicio que le ayuda a preparar y presentar sus documentos, y que no somos abogados ni el gobierno.',
        'Que somos abogados especializados en formar empresas.',
      ],
      correcta: 1,
      explicacion: 'Siempre empezamos aclarando que somos un servicio privado de preparación de documentos, no abogados ni una oficina del gobierno. Así el cliente sabe desde el principio qué puede esperar de nosotros. Usa el guion de apertura.',
    },
    {
      pregunta: 'El cliente quiere dictarte su tarjeta para que pagues por él. ¿Qué haces?',
      opciones: [
        'Anoto el número y lo cargo yo en el formulario.',
        'Le pido que me mande una foto de la tarjeta por WhatsApp.',
        'Le explico con amabilidad que, por su seguridad, el pago lo hace él directamente desde el link que le llega por email.',
      ],
      correcta: 2,
      explicacion: 'Nunca cobramos ni manejamos datos de tarjetas. El cliente paga él mismo desde el link del email, en una página segura. Así su información queda protegida.',
    },
    {
      pregunta: 'Un trámite necesita el número de Seguro Social o ITIN del cliente. ¿Dónde se escribe?',
      opciones: [
        'Solamente dentro del formulario de la orden.',
        'Se lo pido por WhatsApp para no olvidarlo.',
        'Lo anoto en papel y lo paso al formulario después.',
      ],
      correcta: 0,
      explicacion: 'Ese número se escribe solo dentro del formulario. Nunca por WhatsApp, en papel ni en fotos: es información muy sensible del cliente.',
    },
    {
      pregunta: 'El cliente te pregunta qué tipo de empresa le conviene para pagar menos impuestos. ¿Qué le respondes?',
      opciones: [
        'Le digo cuál elegir según mi experiencia.',
        'Le explico cómo funciona cada tipo de empresa y le recomiendo consultar esa decisión con un contador o un abogado.',
        'Le digo que una LLC siempre paga menos impuestos.',
      ],
      correcta: 1,
      explicacion: 'No damos consejos legales ni de impuestos. Puedes explicarle cómo funciona cada trámite, pero la decisión de qué le conviene se la tiene que dar un contador o un abogado.',
    },
    {
      pregunta: 'Te asignan una orden pero en ese momento no puedes atenderla. ¿Qué haces?',
      opciones: [
        'La acepto igual y la atiendo cuando pueda.',
        'La dejo sin responder; el sistema la pasa sola.',
        'La rechazo con un motivo corto para que pase enseguida a otro compañero.',
      ],
      correcta: 2,
      explicacion: 'Si no puedes atenderla, recházala con un motivo: así el cliente no espera de más. Si la dejas sin responder, pasan 10 minutos antes de que se reasigne y se te anota como inactividad.',
    },
    {
      pregunta: 'Mientras llenas una orden, el cliente te hace una pregunta que no sabes responder. ¿Qué haces?',
      opciones: [
        'Le pregunto a Claudia Agente, abajo a la izquierda, escribiendo o con el micrófono.',
        'Le respondo lo que me parece, aunque no esté seguro.',
        'Le digo que no se puede hacer.',
      ],
      correcta: 0,
      explicacion: 'Claudia Agente está para eso: escríbele o díctale la pregunta y te sugiere cómo responderle. Es mejor tomarse un momento que darle al cliente información equivocada.',
    },
  ],
  en: [
    {
      pregunta: 'When you start a conversation with a client, what do you tell them first?',
      opciones: [
        'That we are a State of Florida office that processes businesses.',
        "That we're a service that helps them prepare and file their paperwork, and that we're not attorneys or the government.",
        'That we are attorneys who specialize in forming businesses.',
      ],
      correcta: 1,
      explicacion: "We always start by explaining that we're a private document preparation service, not attorneys or a government office. That way the client knows from the start what to expect from us. Use the opening script.",
    },
    {
      pregunta: 'The client wants to read you their card number so you can pay for them. What do you do?',
      opciones: [
        'I write down the number and enter it in the form myself.',
        'I ask them to send me a photo of the card over WhatsApp.',
        'I kindly explain that, for their security, they pay directly from the link they get by email.',
      ],
      correcta: 2,
      explicacion: 'We never charge clients or handle card details. The client pays on their own from the email link, on a secure page. That keeps their information protected.',
    },
    {
      pregunta: "A filing needs the client's Social Security number or ITIN. Where is it entered?",
      opciones: [
        'Only inside the order form.',
        'I ask for it over WhatsApp so I don\'t forget it.',
        'I write it on paper and enter it in the form later.',
      ],
      correcta: 0,
      explicacion: "That number is entered only inside the form. Never over WhatsApp, on paper or in photos: it's very sensitive client information.",
    },
    {
      pregunta: 'The client asks which type of company will help them pay less in taxes. What do you say?',
      opciones: [
        'I tell them which one to choose based on my experience.',
        'I explain how each type of company works and suggest they check that decision with an accountant or an attorney.',
        'I tell them an LLC always pays less in taxes.',
      ],
      correcta: 1,
      explicacion: "We don't give legal or tax advice. You can explain how each filing works, but the decision about what's best for them should come from an accountant or an attorney.",
    },
    {
      pregunta: "You're assigned an order but can't take it right now. What do you do?",
      opciones: [
        "I accept it anyway and get to it when I can.",
        "I leave it unanswered; the system passes it on.",
        'I decline it with a short reason so it goes right away to a teammate.',
      ],
      correcta: 2,
      explicacion: "If you can't take it, decline it with a reason so the client doesn't wait longer. If you leave it unanswered, it takes 10 minutes to be reassigned and it counts as an inactivity.",
    },
    {
      pregunta: "While filling out an order, the client asks something you don't know. What do you do?",
      opciones: [
        'I ask Claudia Agent, at the bottom left, by typing or using the microphone.',
        "I answer with my best guess, even if I'm not sure.",
        "I tell them it can't be done.",
      ],
      correcta: 0,
      explicacion: "That's what Claudia Agent is for: type or dictate the question and she'll suggest how to answer. It's better to take a moment than to give the client the wrong information.",
    },
  ],
}
