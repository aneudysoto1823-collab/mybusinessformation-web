// Pasos para activar las notificaciones de OpaBiz Connect en iPhone/iPad.
// Apple solo permite notificaciones si la app está instalada en la pantalla
// de inicio (iOS 16.4+). Única fuente para el panel del agente y los emails
// que reciben los agentes con su link de acceso.

export type ConnectLang = 'es' | 'en'

const LOGIN_PATH = 'opabiz.com/opabiz/login'

export const IOS_PUSH_STEPS: Record<ConnectLang, string[]> = {
  es: [
    `Abre la página en Safari. Si llegaste desde un link de Gmail u otra app, copia la dirección (${LOGIN_PATH}) y pégala en Safari.`,
    'Toca el botón Compartir: el cuadrado con una flecha hacia arriba, abajo de la pantalla.',
    'Baja en el menú y toca "Agregar a pantalla de inicio". Después toca "Agregar".',
    'Cierra Safari y abre OpaBiz Connect desde el ícono nuevo en tu pantalla de inicio. Inicia sesión.',
    'En tu panel, activa Notificaciones y toca "Permitir" cuando el iPhone te lo pregunte.',
  ],
  en: [
    `Open the page in Safari. If you got here from a Gmail link or another app, copy the address (${LOGIN_PATH}) and paste it into Safari.`,
    'Tap the Share button: the square with an arrow pointing up, at the bottom of the screen.',
    'Scroll down the menu and tap "Add to Home Screen". Then tap "Add".',
    'Close Safari and open OpaBiz Connect from the new icon on your home screen. Log in.',
    'On your dashboard, turn on Notifications and tap "Allow" when your iPhone asks.',
  ],
}

export const IOS_PUSH_NOTE: Record<ConnectLang, string> = {
  es: 'Necesitas iOS 16.4 o más nuevo. Aunque no las actives, cada orden asignada te llega igual por email.',
  en: 'You need iOS 16.4 or newer. Even without them, every assigned order still reaches you by email.',
}

// Bloque HTML para emails (estilos inline, sin emojis ni flechas).
export function iosPushStepsEmailHtml(lang: ConnectLang): string {
  const title = lang === 'es' ? 'Avisos de órdenes en tu iPhone' : 'Order alerts on your iPhone'
  const intro = lang === 'es'
    ? 'Si usas iPhone, sigue estos pasos una sola vez para recibir un aviso al instante cada vez que te asignen una orden:'
    : 'If you use an iPhone, follow these steps once to get an instant alert every time an order is assigned to you:'
  const items = IOS_PUSH_STEPS[lang]
    .map(s => `<li style="margin-bottom:6px">${s}</li>`)
    .join('')
  return `
    <div style="margin:24px 0 8px;padding:16px 18px;background:#fff;border:1px solid #e2e8f0;border-radius:8px">
      <p style="color:#1C2E44;font-size:.95rem;font-weight:700;margin:0 0 6px">${title}</p>
      <p style="color:#475569;font-size:.88rem;line-height:1.6;margin:0 0 10px">${intro}</p>
      <ol style="color:#475569;font-size:.88rem;line-height:1.6;margin:0 0 10px;padding-left:20px">${items}</ol>
      <p style="color:#94a3b8;font-size:.78rem;line-height:1.5;margin:0">${IOS_PUSH_NOTE[lang]}</p>
    </div>
  `
}
