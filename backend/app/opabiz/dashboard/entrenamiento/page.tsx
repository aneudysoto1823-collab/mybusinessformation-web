'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConnectHeader, CONNECT_BASE_CSS, useConnectLang, locale } from '../../_components/ConnectShell'
import type { Me } from '../../_components/ConnectShell'
import OpeningScript from '../../_components/OpeningScript'
import { TRAINING_QUIZ } from '@/lib/opabiz-training'

type Paso = { titulo: string; parrafos: string[]; puntos?: string[]; guion?: boolean }

// Entrenamiento del agente (2026-10-07). Corto y basado en los pasos reales
// que va a hacer. Tono cercano a propósito (pedido del founder): explica el
// porqué de cada regla en vez de dar órdenes. Si se cambia algo importante,
// subir TRAINING_VERSION en lib/opabiz-training.ts para que todos lo relean.
const T = {
  es: {
    volver: 'Volver al panel',
    titulo: 'Bienvenido a OpaBiz Connect',
    intro: 'Antes de empezar a atender clientes, tómate unos minutos para leer cómo trabajamos. Son pocos pasos y te van a acompañar en todo momento. Y si en algún momento tienes una duda, Claudia Agente está para ayudarte.',
    pasos: [
      {
        titulo: 'Quiénes somos',
        parrafos: [
          'OpaBiz ayuda a emprendedores a formar su empresa en Florida y a mantenerla al día: Agente Registrado, EIN, declaración anual y otros trámites.',
          'Somos un servicio privado de preparación de documentos. No somos abogados ni una oficina del gobierno, por eso nunca damos consejos legales ni de impuestos. Lo que sí hacemos, y muy bien, es acompañar al cliente para que su trámite quede completo y bien presentado.',
        ],
      },
      {
        titulo: 'Cómo empezar cada conversación',
        parrafos: [
          'Al comenzar con cada cliente, preséntate y cuéntale de forma sencilla cómo trabajamos. Así sabe desde el principio qué puede esperar de nosotros y se siente en confianza. Aquí tienes el guion; puedes decirlo con tus propias palabras mientras se entienda la idea.',
        ],
        guion: true,
      },
      {
        titulo: 'Cómo te llega un cliente',
        parrafos: [
          'Cuando hay un cliente para atender, por ejemplo alguien que agendó una cita, te lo asignamos y te llega un aviso por email y, si las activaste, una notificación en el celular.',
        ],
        puntos: [
          'Tienes 10 minutos para aceptar la orden desde tu panel. Si no puedes atenderla, recházala con un motivo corto para que pase enseguida a otro compañero.',
          'Si tiene cita, te avisamos 1 hora antes.',
          'Mantén tu disponibilidad al día en el panel: así solo te llegan órdenes cuando de verdad puedes atenderlas.',
          'Activa las notificaciones en tu panel para enterarte al instante. En iPhone primero tienes que instalar la app en la pantalla de inicio: al lado de Notificaciones tienes el botón "Cómo activarlas en iPhone" con los pasos.',
        ],
      },
      {
        titulo: 'Cómo llenar la orden con el cliente',
        parrafos: [
          'Usas el mismo formulario que ve el cliente en la página, en modo agente.',
        ],
        puntos: [
          'En tu panel toca "Crear orden asistida". Se abre el formulario en una pestaña nueva.',
          'Complétalo con los datos que te va dando el cliente, paso a paso, revisando juntos que todo esté bien escrito.',
          'Al final no vas a ver el pago: en su lugar toca "Guardar".',
          'Al cliente le llega un email con un link para revisar su orden y pagarla.',
          'Si te equivocaste en algo, entra a "Mis solicitudes enviadas" para corregirla o volver a enviarle el email, mientras el cliente no haya pagado.',
        ],
      },
      {
        titulo: 'El pago siempre lo hace el cliente',
        parrafos: [
          'Nunca le cobras al cliente ni le pides los datos de su tarjeta. El pago lo hace él mismo desde el link que le llega por email, en una página segura. Así su información queda protegida y tú nunca tienes que manejar datos de pago.',
          'Si el cliente quiere dictarte su tarjeta, explícale con amabilidad que, por su seguridad, el pago lo completa él directamente desde el email.',
        ],
      },
      {
        titulo: 'Cuida los datos del cliente',
        parrafos: [
          'Algunos trámites piden el número de Seguro Social o ITIN. Ese número se escribe solamente dentro del formulario. No lo pidas por WhatsApp, no lo anotes en papel y no aceptes fotos de documentos por otros medios.',
        ],
      },
      {
        titulo: 'Si tienes una duda',
        parrafos: [
          'Mientras llenas una orden, abajo a la izquierda tienes a Claudia Agente. Escríbele o díctale con el micrófono lo que el cliente te pregunta, y te sugiere cómo responderle. Úsala todas las veces que quieras.',
          'Si el cliente te pide un consejo legal o de impuestos, por ejemplo qué tipo de empresa le conviene para pagar menos impuestos, no le des tu opinión: recomiéndale con amabilidad que lo consulte con un abogado o un contador. Lo que sí puedes hacer es explicarle cómo funciona cada trámite.',
        ],
      },
      {
        titulo: 'Lo que ganas',
        parrafos: [
          'Tu trabajo suma puntos: ganas puntos por cada orden que completas y por cada orden que llenas para un cliente. Con más puntos, tienes más prioridad para recibir nuevos clientes.',
          'Si formas parte del programa de agentes, cada orden que llenaste y que el cliente paga te genera una comisión, que puedes ver en tu panel.',
        ],
      },
    ] as Paso[],
    quizTitulo: 'Repaso rápido',
    quizSub: 'Seis preguntas cortas sobre lo más importante. No es un examen: al revisar, te mostramos la respuesta correcta en las que no acertaste.',
    revisar: 'Revisar respuestas',
    faltan: 'Contesta todas las preguntas para revisar.',
    bien: 'Correcto',
    mal: 'La respuesta correcta es:',
    resultado: (c: number, n: number) => `Acertaste ${c} de ${n}.`,
    resultadoTodo: '¡Excelente! Acertaste todas.',
    resultadoRepaso: 'Repasa las respuestas marcadas antes de empezar.',
    confirmarTitulo: 'Para terminar',
    check: 'Leí el entrenamiento y entiendo cómo trabajamos en OpaBiz.',
    confirmar: 'Confirmar y empezar',
    guardando: 'Guardando…',
    error: 'No se pudo guardar. Intenta de nuevo.',
    completado: (fecha: string) => `Completaste el entrenamiento el ${fecha}. Puedes volver a leerlo cuando quieras.`,
    cargando: 'Cargando…',
  },
  en: {
    volver: 'Back to dashboard',
    titulo: 'Welcome to OpaBiz Connect',
    intro: "Before you start helping clients, take a few minutes to read how we work. It's just a few steps, and you'll have support every step of the way. Whenever you have a question, Claudia Agent is there to help.",
    pasos: [
      {
        titulo: 'Who we are',
        parrafos: [
          'OpaBiz helps entrepreneurs form their business in Florida and keep it in good standing: Registered Agent, EIN, annual report and other filings.',
          "We're a private document preparation service. We're not attorneys or a government office, so we never give legal or tax advice. What we do, and do well, is guide clients so their paperwork is complete and properly filed.",
        ],
      },
      {
        titulo: 'How to start every conversation',
        parrafos: [
          "With every client, introduce yourself and explain simply how we work. That way they know from the start what to expect from us and feel at ease. Here's the script; feel free to say it in your own words as long as the idea comes across.",
        ],
        guion: true,
      },
      {
        titulo: 'How clients reach you',
        parrafos: [
          "When there's a client to help, for example someone who booked an appointment, we assign them to you and you get an email and, if you turned them on, a phone notification.",
        ],
        puntos: [
          "You have 10 minutes to accept the order from your dashboard. If you can't take it, decline it with a short reason so it goes right away to a teammate.",
          'If there is an appointment, we remind you 1 hour before.',
          'Keep your availability up to date on the dashboard, so you only get orders when you can really take them.',
          'Turn on notifications on your dashboard to hear about orders right away. On iPhone you first need to add the app to your home screen: next to Notifications there is a "How to turn them on on iPhone" button with the steps.',
        ],
      },
      {
        titulo: 'How to fill out the order with the client',
        parrafos: [
          'You use the same form the client sees on the website, in agent mode.',
        ],
        puntos: [
          'On your dashboard, tap "Create assisted order". The form opens in a new tab.',
          'Fill it out with the details the client gives you, step by step, checking together that everything is spelled correctly.',
          'At the end you won\'t see the payment step: tap "Save" instead.',
          'The client gets an email with a link to review the order and pay.',
          'If you made a mistake, go to "My submitted requests" to fix it or resend the email, as long as the client hasn\'t paid yet.',
        ],
      },
      {
        titulo: 'The client always makes the payment',
        parrafos: [
          'You never charge the client or ask for their card details. They pay on their own, from the link in their email, on a secure page. That keeps their information protected, and you never have to handle payment details.',
          'If a client wants to read you their card number, kindly explain that, for their security, they complete the payment themselves from the email.',
        ],
      },
      {
        titulo: "Take care of the client's information",
        parrafos: [
          "Some filings require a Social Security number or ITIN. That number is entered only inside the form. Don't ask for it over WhatsApp, don't write it on paper, and don't accept photos of documents through other channels.",
        ],
      },
      {
        titulo: 'If you have a question',
        parrafos: [
          "While you fill out an order, Claudia Agent is at the bottom left. Type or dictate what the client is asking, and she'll suggest how to answer. Use her as often as you like.",
          "If the client asks for legal or tax advice, for example which type of company will lower their taxes, don't give your opinion: kindly suggest they check with an attorney or an accountant. What you can do is explain how each filing works.",
        ],
      },
      {
        titulo: 'What you earn',
        parrafos: [
          'Your work earns points: you get points for every order you complete and every order you fill out for a client. More points give you higher priority for new clients.',
          "If you're part of the agent program, every order you filled out that the client pays earns you a commission, which you can see on your dashboard.",
        ],
      },
    ] as Paso[],
    quizTitulo: 'Quick review',
    quizSub: "Six short questions about what matters most. It's not a test: when you check, we'll show you the right answer for any you missed.",
    revisar: 'Check answers',
    faltan: 'Answer every question to check.',
    bien: 'Correct',
    mal: 'The correct answer is:',
    resultado: (c: number, n: number) => `You got ${c} of ${n} right.`,
    resultadoTodo: 'Great job! You got them all right.',
    resultadoRepaso: 'Review the marked answers before you start.',
    confirmarTitulo: 'To finish',
    check: 'I have read the training and understand how we work at OpaBiz.',
    confirmar: 'Confirm and get started',
    guardando: 'Saving…',
    error: 'Could not save. Please try again.',
    completado: (fecha: string) => `You completed the training on ${fecha}. You can read it again anytime.`,
    cargando: 'Loading…',
  },
}

export default function EntrenamientoPage() {
  const router = useRouter()
  const [lang] = useConnectLang()
  const t = T[lang]
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)
  const [respuestas, setRespuestas] = useState<(number | null)[]>(() => TRAINING_QUIZ.es.map(() => null))
  const [revisado, setRevisado] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/opabiz/auth/me').then(async res => {
      if (res.status === 401) { router.push('/opabiz/login'); return }
      if (res.ok) setMe(await res.json())
      setLoading(false)
    })
  }, [router])

  async function confirmar() {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/opabiz/me/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceptado: true, respuestas }),
      })
      if (!res.ok) { setError(t.error); return }
      router.push('/opabiz/dashboard')
    } catch {
      setError(t.error)
    } finally {
      setSaving(false)
    }
  }

  const quiz = TRAINING_QUIZ[lang]
  const todasContestadas = respuestas.every(r => r !== null)
  const correctas = quiz.filter((q, i) => respuestas[i] === q.correcta).length

  function elegir(i: number, op: number) {
    if (revisado) return
    setRespuestas(prev => prev.map((r, j) => (j === i ? op : r)))
  }

  const completado = me?.entrenamiento?.completado
  const fecha = me?.entrenamiento?.aceptadoAt
    ? new Date(me.entrenamiento.aceptadoAt).toLocaleDateString(locale(lang), { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <>
      <style>{CONNECT_BASE_CSS + `
        .tr-wrap{max-width:760px}
        .tr-title{font-size:1.4rem;font-weight:700;color:#1C2E44;font-family:var(--font-serif)}
        .tr-intro{font-size:.92rem;color:#475569;line-height:1.65;margin-top:6px}
        .tr-done{margin-top:14px}
        .tr-steps{list-style:none;display:flex;flex-direction:column;gap:14px;margin-top:20px}
        .tr-step{display:flex;gap:14px}
        .tr-num{width:30px;height:30px;border-radius:50%;background:#1C2E44;color:#fff;font-weight:700;font-size:.85rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
        .tr-body{flex:1;min-width:0}
        .tr-step-title{font-size:1rem;font-weight:700;color:#1C2E44;margin-bottom:6px}
        .tr-body p{font-size:.9rem;color:#334155;line-height:1.65;margin-bottom:8px}
        .tr-body ul{padding-left:20px;margin:0 0 6px}
        .tr-body li{font-size:.9rem;color:#334155;line-height:1.6;margin-bottom:5px}
        .tr-body .os-card{margin-top:6px}
        .tr-confirm,.tr-quiz{margin-top:22px}
        .tr-q{padding:14px 0;border-top:1px solid #F1F5F9}
        .tr-q-title{font-size:.92rem;font-weight:700;color:#1C2E44;margin-bottom:10px;line-height:1.45;padding:0}
        .tr-opt{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:10px;margin-bottom:8px;font-size:.88rem;color:#334155;line-height:1.5;cursor:pointer;background:#fff}
        .tr-opt input{margin-top:3px;flex-shrink:0}
        .tr-opt.sel{border-color:#2563EB;background:#F7FAFF}
        .tr-opt.ok{border-color:#059669;background:#ECFDF5}
        .tr-opt.bad{border-color:#DC2626;background:#FEF2F2}
        .tr-fb{font-size:.84rem;line-height:1.55;border-radius:10px;padding:10px 12px;margin-top:2px}
        .tr-fb-ok{color:#065F46;background:#ECFDF5;font-weight:700}
        .tr-fb-bad{color:#7F1D1D;background:#FEF2F2}
        .tr-hint{font-size:.78rem;color:#94A3B8;margin-top:8px}
        .tr-result{font-size:.84rem;font-weight:600;color:#92400E;background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:10px 14px}
        .tr-check{display:flex;align-items:flex-start;gap:10px;font-size:.9rem;color:#1C2E44;line-height:1.5;cursor:pointer;margin:10px 0 16px}
        .tr-check input{width:18px;height:18px;margin-top:2px;flex-shrink:0}
        @media(max-width:768px){.tr-step{gap:10px}.tr-title{font-size:1.2rem}}
      `}</style>
      <ConnectHeader me={me} />
      <div className="oc-wrap tr-wrap">
        {completado && (
          <Link href="/opabiz/dashboard" className="oc-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            {t.volver}
          </Link>
        )}
        {loading ? (
          <p className="oc-empty">{t.cargando}</p>
        ) : (
          <>
            <h1 className="tr-title">{t.titulo}</h1>
            <p className="tr-intro">{t.intro}</p>
            {completado && <div className="oc-msg-ok tr-done">{t.completado(fecha)}</div>}

            <ol className="tr-steps">
              {t.pasos.map((p, i) => (
                <li key={p.titulo} className="oc-card tr-step">
                  <span className="tr-num">{i + 1}</span>
                  <div className="tr-body">
                    <div className="tr-step-title">{p.titulo}</div>
                    {p.parrafos.map(x => <p key={x}>{x}</p>)}
                    {p.puntos && <ul>{p.puntos.map(x => <li key={x}>{x}</li>)}</ul>}
                    {p.guion && <OpeningScript lang={lang} />}
                  </div>
                </li>
              ))}
            </ol>

            {!completado && (
              <div className="oc-card tr-quiz">
                <div className="oc-card-title">{t.quizTitulo}</div>
                <div className="oc-card-sub">{t.quizSub}</div>
                {quiz.map((q, i) => {
                  const elegida = respuestas[i]
                  const acerto = elegida === q.correcta
                  return (
                    <div key={q.pregunta} className="tr-q" role="radiogroup" aria-labelledby={`q${i}-title`}>
                      <div id={`q${i}-title`} className="tr-q-title">{i + 1}. {q.pregunta}</div>
                      {q.opciones.map((op, k) => {
                        let cls = 'tr-opt'
                        if (elegida === k) cls += ' sel'
                        if (revisado && k === q.correcta) cls += ' ok'
                        if (revisado && elegida === k && !acerto) cls += ' bad'
                        return (
                          <label key={op} className={cls}>
                            <input type="radio" name={`q${i}`} checked={elegida === k} onChange={() => elegir(i, k)} disabled={revisado} />
                            <span>{op}</span>
                          </label>
                        )
                      })}
                      {revisado && (
                        acerto ? (
                          <div className="tr-fb tr-fb-ok">{t.bien}</div>
                        ) : (
                          <div className="tr-fb tr-fb-bad"><strong>{t.mal}</strong> {q.opciones[q.correcta]}<br />{q.explicacion}</div>
                        )
                      )}
                    </div>
                  )
                })}
                {!revisado ? (
                  <>
                    <button type="button" className="oc-btn oc-btn-primary" onClick={() => setRevisado(true)} disabled={!todasContestadas}>{t.revisar}</button>
                    {!todasContestadas && <div className="tr-hint">{t.faltan}</div>}
                  </>
                ) : (
                  <div className={correctas === quiz.length ? 'oc-msg-ok' : 'tr-result'}>
                    {correctas === quiz.length ? t.resultadoTodo : `${t.resultado(correctas, quiz.length)} ${t.resultadoRepaso}`}
                  </div>
                )}
              </div>
            )}

            {!completado && revisado && (
              <div className="oc-card tr-confirm">
                <div className="oc-card-title">{t.confirmarTitulo}</div>
                <label className="tr-check">
                  <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
                  {t.check}
                </label>
                <button type="button" className="oc-btn oc-btn-primary" onClick={confirmar} disabled={!checked || saving}>
                  {saving ? t.guardando : t.confirmar}
                </button>
                {error && <div className="oc-msg-err" style={{ marginTop: 12 }}>{error}</div>}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
