'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConnectHeader, Avatar, NIVEL_LABELS, CONNECT_BASE_CSS, useConnectLang } from '../../_components/ConnectShell'
import type { Me } from '../../_components/ConnectShell'

const IDIOMA_CODES = ['es', 'en', 'pt'] as const

const T = {
  es: {
    idiomas: { es: 'Español', en: 'Inglés', pt: 'Portugués' } as Record<string, string>,
    errGuardar: 'No se pudieron guardar los cambios.', guardado: 'Cambios guardados.', errConexion: 'Error de conexión. Intenta de nuevo.',
    errFoto: 'No se pudo subir la foto.', pwdCorta: 'La contraseña nueva debe tener al menos 8 caracteres.', pwdNoCoincide: 'Las contraseñas nuevas no coinciden.',
    errPwd: 'No se pudo cambiar la contraseña.', pwdOk: 'Contraseña actualizada. Úsala la próxima vez que entres.',
    volver: 'Volver al panel', titulo: 'Mi perfil', sub: 'Mantén tus datos al día: así te contactamos y te asignamos órdenes en tu zona e idioma.',
    cargando: 'Cargando…', errCargar: 'No se pudo cargar tu perfil.',
    warn: 'La foto, la dirección y los idiomas todavía no se pueden guardar: falta correr la migración de perfil en la base de datos. Avísale al administrador.',
    nivel: 'Nivel', puntaje: 'Puntaje', subiendo: 'Subiendo…', cambiarFoto: 'Cambiar foto', subirFoto: 'Subir foto',
    datos: 'Datos personales', datosSub: 'Esta información la ve solo el equipo de OpaBiz.', nombre: 'Nombre completo', telefono: 'Teléfono', email: 'Email',
    emailHelp: 'Es tu usuario para ingresar y donde te llegan los avisos. Para cambiarlo, pídeselo al administrador.',
    direccion: 'Dirección', calle: 'Calle y número', ciudad: 'Ciudad', estado: 'Estado', zip: 'Código postal', idiomasTitulo: 'Idiomas que hablas',
    guardando: 'Guardando…', guardar: 'Guardar cambios', contrasena: 'Contraseña', contrasenaSub: 'Por seguridad, te pedimos la contraseña actual.',
    actual: 'Contraseña actual', nueva: 'Contraseña nueva', minimo: 'Mínimo 8 caracteres.', confirmar: 'Confirmar contraseña nueva', cambiar: 'Cambiar contraseña',
  },
  en: {
    idiomas: { es: 'Spanish', en: 'English', pt: 'Portuguese' } as Record<string, string>,
    errGuardar: 'Could not save your changes.', guardado: 'Changes saved.', errConexion: 'Connection error. Please try again.',
    errFoto: 'Could not upload the photo.', pwdCorta: 'The new password must be at least 8 characters.', pwdNoCoincide: 'The new passwords do not match.',
    errPwd: 'Could not change the password.', pwdOk: 'Password updated. Use it the next time you sign in.',
    volver: 'Back to dashboard', titulo: 'My profile', sub: 'Keep your details up to date so we can reach you and assign orders in your area and language.',
    cargando: 'Loading…', errCargar: 'Could not load your profile.',
    warn: 'Photo, address and languages cannot be saved yet: the profile database migration has not been run. Let the administrator know.',
    nivel: 'Level', puntaje: 'Score', subiendo: 'Uploading…', cambiarFoto: 'Change photo', subirFoto: 'Upload photo',
    datos: 'Personal details', datosSub: 'Only the OpaBiz team can see this information.', nombre: 'Full name', telefono: 'Phone', email: 'Email',
    emailHelp: 'This is your sign-in username and where notifications are sent. To change it, ask the administrator.',
    direccion: 'Address', calle: 'Street address', ciudad: 'City', estado: 'State', zip: 'ZIP code', idiomasTitulo: 'Languages you speak',
    guardando: 'Saving…', guardar: 'Save changes', contrasena: 'Password', contrasenaSub: 'For your security, we ask for your current password.',
    actual: 'Current password', nueva: 'New password', minimo: 'At least 8 characters.', confirmar: 'Confirm new password', cambiar: 'Change password',
  },
}

type Msg = { ok: boolean; msg: string } | null

// Achica la foto a 512px (lado mayor) y la pasa a JPEG antes de subirla: una
// foto de celular pesa 3-8 MB y Vercel corta los bodies de más de ~4.5 MB.
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.88)
  )
}

export default function OpabizPerfilPage() {
  const router = useRouter()
  const [lang] = useConnectLang()
  const t = T[lang]
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [calle, setCalle] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [estado, setEstado] = useState('')
  const [zip, setZip] = useState('')
  const [idiomas, setIdiomas] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<Msg>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [photoMsg, setPhotoMsg] = useState<Msg>(null)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<Msg>(null)

  useEffect(() => {
    fetch('/api/opabiz/auth/me').then(async res => {
      if (res.status === 401) { router.push('/opabiz/login'); return }
      if (!res.ok) { setLoading(false); return }
      const data: Me = await res.json()
      setMe(data)
      setNombre(data.nombre)
      setTelefono(data.telefono)
      setCalle(data.perfil.direccionCalle)
      setCiudad(data.perfil.direccionCiudad)
      setEstado(data.perfil.direccionEstado)
      setZip(data.perfil.direccionZip)
      setIdiomas(data.perfil.idiomas)
      setLoading(false)
    })
  }, [router])

  // El link "Cambiar contraseña" del menú lleva a #seguridad; como la página
  // se arma después de cargar los datos, el navegador no llega a saltar solo.
  useEffect(() => {
    if (!loading && window.location.hash === '#seguridad') {
      document.getElementById('seguridad')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading])

  function toggleIdioma(code: string) {
    setIdiomas(prev => (prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]))
  }

  async function guardarPerfil(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaveMsg(null)
    setSaving(true)
    try {
      const res = await fetch('/api/opabiz/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, telefono,
          direccionCalle: calle, direccionCiudad: ciudad, direccionEstado: estado, direccionZip: zip,
          idiomas,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setSaveMsg({ ok: false, msg: data.error ?? t.errGuardar }); return }
      setMe(prev => prev && {
        ...prev, nombre: nombre.trim(), telefono: telefono.trim(),
        perfil: { ...prev.perfil, direccionCalle: calle, direccionCiudad: ciudad, direccionEstado: estado.toUpperCase(), direccionZip: zip, idiomas },
      })
      setSaveMsg({ ok: true, msg: t.guardado })
    } catch {
      setSaveMsg({ ok: false, msg: t.errConexion })
    } finally {
      setSaving(false)
    }
  }

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoMsg(null)
    setUploading(true)
    try {
      const blob = await resizeImage(file)
      const form = new FormData()
      form.append('file', new File([blob], 'foto.jpg', { type: 'image/jpeg' }))
      const res = await fetch('/api/opabiz/me/profile/photo', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setPhotoMsg({ ok: false, msg: data.error ?? t.errFoto }); return }
      setMe(prev => prev && { ...prev, perfil: { ...prev.perfil, fotoUrl: data.fotoUrl } })
    } catch (err) {
      setPhotoMsg({ ok: false, msg: err instanceof Error ? err.message : t.errFoto })
    } finally {
      setUploading(false)
    }
  }

  async function cambiarPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwdMsg(null)
    if (newPwd.length < 8) { setPwdMsg({ ok: false, msg: t.pwdCorta }); return }
    if (newPwd !== confirmPwd) { setPwdMsg({ ok: false, msg: t.pwdNoCoincide }); return }
    setSavingPwd(true)
    try {
      const res = await fetch('/api/opabiz/me/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setPwdMsg({ ok: false, msg: data.error ?? t.errPwd }); return }
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      setPwdMsg({ ok: true, msg: t.pwdOk })
    } catch {
      setPwdMsg({ ok: false, msg: t.errConexion })
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <>
      <style>{CONNECT_BASE_CSS + `
        .pf-wrap{max-width:860px}
        .pf-back{display:inline-flex;align-items:center;gap:6px;font-size:.82rem;font-weight:600;color:#64748B;text-decoration:none;margin-bottom:14px}
        .pf-back:hover{color:#1C2E44}
        .pf-title{font-family:var(--font-serif);font-size:1.6rem;font-weight:700;color:#1C2E44;margin-bottom:4px}
        .pf-sub{font-size:.85rem;color:#64748B;margin-bottom:20px}
        .pf-stack{display:flex;flex-direction:column;gap:16px}
        .pf-photo{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
        .pf-photo-info{flex:1;min-width:200px}
        .pf-photo-name{font-size:1.05rem;font-weight:700;color:#1C2E44}
        .pf-photo-meta{font-size:.8rem;color:#64748B;margin-top:3px}
        .pf-photo-actions{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}
        .pf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px}
        .pf-grid-addr{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,.8fr) minmax(0,1fr);gap:14px 16px}
        .pf-full{grid-column:1/-1}
        .pf-field label{display:block;font-size:.74rem;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px}
        .pf-field input{width:100%;padding:11px 12px;border:1.5px solid #E2E8F0;border-radius:9px;font-size:16px;font-family:inherit;color:#1E293B;outline:none;background:#fff}
        .pf-field input:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
        .pf-field input:read-only{background:#F8FAFC;color:#64748B}
        .pf-help{font-size:.74rem;color:#94A3B8;margin-top:5px;line-height:1.4}
        .pf-section{font-size:.78rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 12px}
        .pf-chips{display:flex;gap:8px;flex-wrap:wrap}
        .pf-chip{padding:8px 14px;border-radius:20px;border:1.5px solid #E2E8F0;background:#fff;font-size:.82rem;font-weight:600;color:#475569;cursor:pointer;font-family:inherit;min-height:40px}
        .pf-chip.on{border-color:#2563EB;color:#1D4ED8;background:#F7FAFF}
        .pf-footer{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:22px;flex-wrap:wrap}
        .pf-footer .oc-msg-ok,.pf-footer .oc-msg-err{flex:1;min-width:200px}
        .pf-warn{background:#FFFBEB;border:1px solid #FDE68A;color:#78350F;border-radius:10px;padding:10px 14px;font-size:.8rem;line-height:1.45}
        #seguridad{scroll-margin-top:84px}
        @media(max-width:640px){
          .pf-grid,.pf-grid-addr{grid-template-columns:1fr}
          .pf-footer .oc-btn{width:100%}
        }
      `}</style>

      <ConnectHeader me={me} />

      <div className="oc-wrap pf-wrap">
        <Link href="/opabiz/dashboard" className="pf-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          {t.volver}
        </Link>
        <h1 className="pf-title">{t.titulo}</h1>
        <p className="pf-sub">{t.sub}</p>

        {loading ? (
          <p className="oc-empty">{t.cargando}</p>
        ) : !me ? (
          <p className="oc-empty">{t.errCargar}</p>
        ) : (
          <div className="pf-stack">
            {!me.perfilDisponible && (
              <div className="pf-warn">{t.warn}</div>
            )}

            <div className="oc-card pf-photo">
              <Avatar nombre={me.nombre} fotoUrl={me.perfil.fotoUrl} size={96} />
              <div className="pf-photo-info">
                <div className="pf-photo-name">{me.nombre}</div>
                <div className="pf-photo-meta">{t.nivel} {NIVEL_LABELS[lang][me.nivel] ?? me.nivel}{me.tier ? ` · ${me.tier}` : ''} · {t.puntaje} {me.puntajeActual}</div>
                <div className="pf-photo-actions">
                  <button type="button" className="oc-btn oc-btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploading || !me.perfilDisponible}>
                    {uploading ? t.subiendo : me.perfil.fotoUrl ? t.cambiarFoto : t.subirFoto}
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={subirFoto} />
                </div>
                {photoMsg && <div className={photoMsg.ok ? 'oc-msg-ok' : 'oc-msg-err'} style={{ marginTop: 10 }}>{photoMsg.msg}</div>}
              </div>
            </div>

            <form className="oc-card" onSubmit={guardarPerfil}>
              <div className="oc-card-title">{t.datos}</div>
              <div className="oc-card-sub">{t.datosSub}</div>

              <div className="pf-grid">
                <div className="pf-field">
                  <label htmlFor="pf-nombre">{t.nombre}</label>
                  <input id="pf-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required autoComplete="name" />
                </div>
                <div className="pf-field">
                  <label htmlFor="pf-tel">{t.telefono}</label>
                  <input id="pf-tel" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} autoComplete="tel" placeholder="(305) 555-0123" />
                </div>
                <div className="pf-field pf-full">
                  <label htmlFor="pf-email">{t.email}</label>
                  <input id="pf-email" value={me.email} readOnly />
                  <div className="pf-help">{t.emailHelp}</div>
                </div>
              </div>

              <div className="pf-section">{t.direccion}</div>
              <div className="pf-grid-addr">
                <div className="pf-field pf-full">
                  <label htmlFor="pf-calle">{t.calle}</label>
                  <input id="pf-calle" value={calle} onChange={e => setCalle(e.target.value)} autoComplete="address-line1" disabled={!me.perfilDisponible} />
                </div>
                <div className="pf-field">
                  <label htmlFor="pf-ciudad">{t.ciudad}</label>
                  <input id="pf-ciudad" value={ciudad} onChange={e => setCiudad(e.target.value)} autoComplete="address-level2" disabled={!me.perfilDisponible} />
                </div>
                <div className="pf-field">
                  <label htmlFor="pf-estado">{t.estado}</label>
                  <input id="pf-estado" value={estado} onChange={e => setEstado(e.target.value.toUpperCase().slice(0, 2))} autoComplete="address-level1" placeholder="FL" disabled={!me.perfilDisponible} />
                </div>
                <div className="pf-field">
                  <label htmlFor="pf-zip">{t.zip}</label>
                  <input id="pf-zip" value={zip} onChange={e => setZip(e.target.value.replace(/[^\d-]/g, '').slice(0, 10))} autoComplete="postal-code" inputMode="numeric" disabled={!me.perfilDisponible} />
                </div>
              </div>

              <div className="pf-section">{t.idiomasTitulo}</div>
              <div className="pf-chips">
                {IDIOMA_CODES.map(code => (
                  <button key={code} type="button" className={`pf-chip ${idiomas.includes(code) ? 'on' : ''}`}
                    aria-pressed={idiomas.includes(code)} onClick={() => toggleIdioma(code)} disabled={!me.perfilDisponible}>
                    {t.idiomas[code]}
                  </button>
                ))}
              </div>

              <div className="pf-footer">
                {saveMsg && <div className={saveMsg.ok ? 'oc-msg-ok' : 'oc-msg-err'}>{saveMsg.msg}</div>}
                <button type="submit" className="oc-btn oc-btn-primary" disabled={saving}>{saving ? t.guardando : t.guardar}</button>
              </div>
            </form>

            <form className="oc-card" id="seguridad" onSubmit={cambiarPassword}>
              <div className="oc-card-title">{t.contrasena}</div>
              <div className="oc-card-sub">{t.contrasenaSub}</div>
              <div className="pf-grid">
                <div className="pf-field pf-full">
                  <label htmlFor="pf-cur">{t.actual}</label>
                  <input id="pf-cur" type="password" autoComplete="current-password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required />
                </div>
                <div className="pf-field">
                  <label htmlFor="pf-new">{t.nueva}</label>
                  <input id="pf-new" type="password" autoComplete="new-password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required />
                  <div className="pf-help">{t.minimo}</div>
                </div>
                <div className="pf-field">
                  <label htmlFor="pf-confirm">{t.confirmar}</label>
                  <input id="pf-confirm" type="password" autoComplete="new-password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
                </div>
              </div>
              <div className="pf-footer">
                {pwdMsg && <div className={pwdMsg.ok ? 'oc-msg-ok' : 'oc-msg-err'}>{pwdMsg.msg}</div>}
                <button type="submit" className="oc-btn oc-btn-primary" disabled={savingPwd}>{savingPwd ? t.guardando : t.cambiar}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
