// Panel flotante dentro de WhatsApp Web. A propósito NO intenta leer solo
// los mensajes entrantes del chat (la estructura interna de WhatsApp Web
// cambia seguido y es un objetivo frágil para automatizar) — el staff pega
// el mensaje del cliente a mano, que es instantáneo con un click derecho ->
// copiar. Lo que SÍ automatiza es insertar la respuesta de Claudia en el
// cuadro de escribir, que es un target mucho más estable.

function buildPanel() {
  const toggle = document.createElement('button')
  toggle.id = 'claudia-ext-toggle'
  toggle.title = 'Asistente Claudia'
  const avatar = document.createElement('img')
  avatar.src = chrome.runtime.getURL('claudia.jpg')
  avatar.alt = 'Claudia'
  toggle.appendChild(avatar)

  const panel = document.createElement('div')
  panel.id = 'claudia-ext-panel'
  panel.className = 'hidden'
  panel.innerHTML = `
    <div class="ce-header">Asistente Claudia</div>
    <div class="ce-body">
      <div>
        <div class="ce-label-row">
          <label>Mensaje del cliente</label>
          <select id="ce-mic-lang">
            <option value="es-ES">Español</option>
            <option value="en-US">English</option>
          </select>
        </div>
        <div class="ce-textarea-wrap">
          <textarea id="ce-client-msg" rows="3" placeholder="Pegá lo que escribió el cliente, o dictalo con el micrófono..."></textarea>
          <button class="ce-mic-btn" id="ce-mic" title="Dictar por voz" type="button">🎤</button>
        </div>
      </div>
      <div class="ce-btn-row">
        <button class="ce-ask-btn" id="ce-ask">Preguntarle a Claudia</button>
        <button class="ce-clear-btn" id="ce-clear" type="button" title="Borrar pregunta y respuesta">Limpiar</button>
      </div>
      <div class="ce-error" id="ce-error" style="display:none"></div>
      <div id="ce-reply-wrap" style="display:none">
        <label>Respuesta sugerida (editable)</label>
        <textarea id="ce-reply" rows="4"></textarea>
        <button class="ce-use-btn" id="ce-use">Usar esta respuesta</button>
      </div>
      <div class="ce-hint">La respuesta se inserta en el cuadro de WhatsApp — revisala y apretá Enter para mandarla, como siempre.</div>
    </div>
  `

  document.body.appendChild(toggle)
  document.body.appendChild(panel)

  toggle.addEventListener('click', () => panel.classList.toggle('hidden'))

  const askBtn = panel.querySelector('#ce-ask')
  const errorBox = panel.querySelector('#ce-error')
  const replyWrap = panel.querySelector('#ce-reply-wrap')
  const replyBox = panel.querySelector('#ce-reply')
  const clientMsgBox = panel.querySelector('#ce-client-msg')

  panel.querySelector('#ce-clear').addEventListener('click', () => {
    clientMsgBox.value = ''
    replyBox.value = ''
    replyWrap.style.display = 'none'
    errorBox.style.display = 'none'
    clientMsgBox.focus()
  })

  askBtn.addEventListener('click', () => {
    const clientMessage = panel.querySelector('#ce-client-msg').value.trim()
    errorBox.style.display = 'none'
    if (!clientMessage) {
      errorBox.textContent = 'Pegá primero el mensaje del cliente.'
      errorBox.style.display = 'block'
      return
    }
    askBtn.disabled = true
    askBtn.textContent = 'Pensando...'
    replyWrap.style.display = 'none'

    chrome.runtime.sendMessage({ type: 'ASK_CLAUDIA', clientMessage }, response => {
      askBtn.disabled = false
      askBtn.textContent = 'Preguntarle a Claudia'
      if (!response || !response.ok) {
        errorBox.textContent = (response && response.error) || 'No se pudo conectar con Claudia.'
        errorBox.style.display = 'block'
        return
      }
      replyBox.value = response.reply
      replyWrap.style.display = 'block'
    })
  })

  panel.querySelector('#ce-use').addEventListener('click', () => {
    const ok = insertIntoComposeBox(replyBox.value)
    if (!ok) {
      errorBox.textContent = 'No encontré el cuadro de mensaje de WhatsApp. Abrí una conversación primero.'
      errorBox.style.display = 'block'
    }
  })

  setupMic(panel.querySelector('#ce-client-msg'), panel.querySelector('#ce-mic'), panel.querySelector('#ce-mic-lang'), errorBox)
}

// Dictado por voz del lado del cuadro "Mensaje del cliente" — usa el
// reconocimiento de voz nativo de Chrome (Web Speech API), sin servicio
// externo. El audio lo procesan los servidores de Google (así funciona
// webkitSpeechRecognition en Chrome, no es nada propio de esta extensión).
function setupMic(textarea, micBtn, langSelect, errorBox) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    micBtn.disabled = true
    micBtn.title = 'Tu navegador no soporta dictado por voz'
    return
  }

  let recognition = null
  let listening = false
  let baseText = ''

  micBtn.addEventListener('click', () => {
    if (listening) {
      recognition.stop()
      return
    }

    baseText = textarea.value ? textarea.value.trim() + ' ' : ''
    recognition = new SpeechRecognition()
    recognition.lang = langSelect.value
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = event => {
      let finalChunk = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) finalChunk += transcript + ' '
        else interim += transcript
      }
      if (finalChunk) baseText += finalChunk
      textarea.value = baseText + interim
    }

    recognition.onerror = event => {
      errorBox.textContent = event.error === 'not-allowed'
        ? 'Dale permiso de micrófono a esta página para dictar.'
        : 'Error de dictado: ' + event.error
      errorBox.style.display = 'block'
    }

    recognition.onend = () => {
      listening = false
      micBtn.classList.remove('ce-mic-on')
      micBtn.textContent = '🎤'
    }

    recognition.start()
    listening = true
    micBtn.classList.add('ce-mic-on')
    micBtn.textContent = '⏹'
  })
}

function findComposeBox() {
  return (
    document.querySelector('footer div[contenteditable="true"][role="textbox"]') ||
    document.querySelector('div[contenteditable="true"][data-tab]') ||
    document.querySelector('div[contenteditable="true"][aria-label]')
  )
}

function insertIntoComposeBox(text) {
  const box = findComposeBox()
  if (!box || !text) return false

  box.focus()
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    if (i > 0) document.execCommand('insertLineBreak')
    if (line) document.execCommand('insertText', false, line)
  })
  return true
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', buildPanel)
} else {
  buildPanel()
}
