const keyInput = document.getElementById('key')
const baseInput = document.getElementById('base')
const status = document.getElementById('status')

chrome.storage.local.get(['assistantKey', 'apiBase'], d => {
  if (d.assistantKey) keyInput.value = d.assistantKey
  baseInput.value = d.apiBase || 'https://www.opabiz.com'
})

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.local.set(
    { assistantKey: keyInput.value.trim(), apiBase: baseInput.value.trim() || 'https://www.opabiz.com' },
    () => {
      status.style.display = 'block'
      setTimeout(() => { status.style.display = 'none' }, 2000)
    }
  )
})
