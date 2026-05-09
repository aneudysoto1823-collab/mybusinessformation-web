// Hook de Next.js que se ejecuta una vez al arrancar el server.
// Carga la config de Sentry según el runtime que está corriendo.
// Documentación: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Export requerido por @sentry/nextjs para capturar errores en Server Components
// con el patrón onRequestError de Next.js 15+.
export { captureRequestError as onRequestError } from '@sentry/nextjs'
