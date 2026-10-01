// Hace el fetch cross-origin hacia el backend (opabiz.com) — un content
// script no puede saltarse CORS, pero el service worker de la extensión sí,
// siempre que el host esté declarado en host_permissions del manifest.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'ASK_CLAUDIA') return false

  ;(async () => {
    try {
      const { assistantKey, apiBase } = await chrome.storage.local.get(['assistantKey', 'apiBase'])
      if (!assistantKey) {
        sendResponse({ ok: false, error: 'Falta configurar la clave en las Opciones de la extensión.' })
        return
      }
      const base = (apiBase || 'https://www.opabiz.com').replace(/\/$/, '')
      const res = await fetch(`${base}/api/extension/suggest-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-assistant-key': assistantKey },
        body: JSON.stringify({ clientMessage: msg.clientMessage }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        sendResponse({ ok: false, error: data.error || `Error del servidor (${res.status})` })
        return
      }
      sendResponse({ ok: true, reply: data.reply || '' })
    } catch (err) {
      sendResponse({ ok: false, error: String(err && err.message ? err.message : err) })
    }
  })()

  return true // mantiene el canal de mensajes abierto para la respuesta async
})
