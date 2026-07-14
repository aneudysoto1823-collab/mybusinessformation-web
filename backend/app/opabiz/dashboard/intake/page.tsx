'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Member = { name: string }

const ADDON_OPTIONS: { key: string; label: string }[] = [
  { key: 'ein', label: 'EIN / Tax ID' },
  { key: 'oa', label: 'Operating Agreement' },
  { key: 'itin', label: 'ITIN' },
  { key: 'btr', label: 'Business Tax Receipt' },
  { key: 'str', label: 'Sales Tax Registration' },
  { key: 'cc', label: 'Certified Copy' },
]

export default function OpabizIntakePage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [entityType, setEntityType] = useState<'llc' | 'corp'>('llc')
  const [businessAddress, setBusinessAddress] = useState('')
  const [registeredAgent, setRegisteredAgent] = useState<'us' | 'own'>('us')
  const [members, setMembers] = useState<Member[]>([{ name: '' }])
  const [pkg, setPkg] = useState<'basic' | 'standard' | 'premium'>('standard')
  const [addons, setAddons] = useState<Record<string, boolean>>({})
  const [speed, setSpeed] = useState<'standard' | 'expedited'>('standard')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ fbfc: string } | null>(null)

  function addMember() { setMembers(prev => [...prev, { name: '' }]) }
  function removeMember(i: number) { setMembers(prev => prev.filter((_, idx) => idx !== i)) }
  function updateMember(i: number, name: string) {
    setMembers(prev => prev.map((m, idx) => idx === i ? { name } : m))
  }
  function toggleAddon(key: string) {
    setAddons(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function resetForm() {
    setFirstName(''); setLastName(''); setEmail(''); setPhone('')
    setCompanyName(''); setEntityType('llc'); setBusinessAddress('')
    setRegisteredAgent('us'); setMembers([{ name: '' }])
    setPkg('standard'); setAddons({}); setSpeed('standard')
    setSuccess(null); setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/opabiz/me/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email, phone, country: 'US',
          companyName, entityType, businessAddress,
          registeredAgent,
          members: members.filter(m => m.name.trim()),
          package: pkg,
          addons,
          speed,
        }),
      })
      if (res.status === 401) { router.push('/opabiz/login'); return }
      if (res.ok) {
        const data = await res.json()
        setSuccess({ fbfc: data.fbfc })
        return
      }
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'No se pudo enviar la solicitud.')
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f4f6f9;font-family:var(--font-sans)}
        .op-header{background:#1C2E44;padding:16px 18px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:10}
        .op-back{color:#fff;text-decoration:none;font-size:.85rem}
        .op-wrap{max-width:640px;margin:0 auto;padding:16px 16px 60px}
        .op-title{font-size:1.15rem;font-weight:800;color:#1C2E44;margin:4px 0 4px}
        .op-sub{font-size:.8rem;color:#64748B;margin-bottom:18px}
        .op-card{background:#fff;border-radius:12px;padding:18px;border:1px solid #E2E8F0;margin-bottom:14px}
        .op-section-title{font-size:.72rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}
        .op-field{margin-bottom:12px}
        .op-field label{display:block;font-size:.78rem;font-weight:600;color:#374151;margin-bottom:5px}
        .op-field input,.op-field textarea{width:100%;padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:16px;font-family:inherit;color:#1E293B;outline:none}
        .op-field input:focus,.op-field textarea:focus{border-color:#2563EB}
        .op-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:480px){.op-row2{grid-template-columns:1fr}}
        .op-choice-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px}
        .op-choice{border:1.5px solid #E2E8F0;border-radius:10px;padding:12px;text-align:center;cursor:pointer;font-size:.82rem;font-weight:700;color:#374151}
        .op-choice.sel{border-color:#2563EB;background:#EFF6FF;color:#1d4ed8}
        .op-member-row{display:flex;gap:8px;margin-bottom:8px;align-items:center}
        .op-member-row input{flex:1}
        .op-icon-btn{background:none;border:1.5px solid #FEE2E2;color:#dc2626;border-radius:6px;width:34px;height:34px;flex-shrink:0;cursor:pointer;font-size:.9rem}
        .op-add-link{background:none;border:none;color:#2563EB;font-weight:700;font-size:.82rem;cursor:pointer;padding:4px 0}
        .op-checklist{display:flex;flex-direction:column;gap:8px}
        .op-checklist label{display:flex;align-items:center;gap:8px;font-size:.85rem;color:#374151}
        .op-submit{width:100%;padding:14px;border-radius:8px;background:#2563EB;color:#fff;font-weight:700;font-size:.92rem;border:none;cursor:pointer;min-height:48px}
        .op-submit:disabled{opacity:.6;cursor:not-allowed}
        .op-error{color:#ef4444;font-size:.82rem;margin-top:10px;text-align:center}
        .op-success{text-align:center;padding:20px}
        .op-fbfc{font-size:1.4rem;font-weight:800;color:#1C2E44;letter-spacing:.5px;margin:10px 0 18px}
      `}</style>

      <div className="op-header">
        <Link href="/opabiz/dashboard" className="op-back">← Mis órdenes</Link>
      </div>

      <div className="op-wrap">
        {success ? (
          <div className="op-card op-success">
            <div style={{ fontSize: '2rem' }}>✅</div>
            <h2 className="op-title">Solicitud enviada</h2>
            <p className="op-sub">Le mandamos un email al cliente para que revise y pague. No hace falta que hagas nada más.</p>
            <div className="op-fbfc">{success.fbfc}</div>
            <button className="op-submit" onClick={resetForm}>Nueva intake asistida</button>
          </div>
        ) : (
          <>
            <h1 className="op-title">Intake asistida</h1>
            <p className="op-sub">Armá la solicitud con el cliente en la llamada. El cliente recibe un email para revisar y pagar — vos nunca tocás su tarjeta.</p>

            <form onSubmit={handleSubmit}>
              <div className="op-card">
                <div className="op-section-title">Contacto</div>
                <div className="op-row2">
                  <div className="op-field"><label>Nombre</label><input value={firstName} onChange={e => setFirstName(e.target.value)} required /></div>
                  <div className="op-field"><label>Apellido</label><input value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
                </div>
                <div className="op-field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                <div className="op-field"><label>Teléfono</label><input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>

              <div className="op-card">
                <div className="op-section-title">Empresa</div>
                <div className="op-field"><label>Nombre de la empresa</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} required /></div>
                <div className="op-choice-row">
                  <div className={`op-choice${entityType === 'llc' ? ' sel' : ''}`} onClick={() => setEntityType('llc')}>LLC</div>
                  <div className={`op-choice${entityType === 'corp' ? ' sel' : ''}`} onClick={() => setEntityType('corp')}>Corporation</div>
                </div>
                <div className="op-field" style={{ marginTop: 12 }}><label>Dirección del negocio</label><textarea style={{ minHeight: 60 }} value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} /></div>
              </div>

              <div className="op-card">
                <div className="op-section-title">Agente registrado</div>
                <div className="op-choice-row">
                  <div className={`op-choice${registeredAgent === 'us' ? ' sel' : ''}`} onClick={() => setRegisteredAgent('us')}>Nuestro agente</div>
                  <div className={`op-choice${registeredAgent === 'own' ? ' sel' : ''}`} onClick={() => setRegisteredAgent('own')}>Agente propio</div>
                </div>
              </div>

              <div className="op-card">
                <div className="op-section-title">Dueños / Miembros</div>
                {members.map((m, i) => (
                  <div key={i} className="op-member-row">
                    <input placeholder="Nombre completo" value={m.name} onChange={e => updateMember(i, e.target.value)} />
                    {members.length > 1 && <button type="button" className="op-icon-btn" onClick={() => removeMember(i)}>✕</button>}
                  </div>
                ))}
                <button type="button" className="op-add-link" onClick={addMember}>+ Agregar miembro</button>
              </div>

              <div className="op-card">
                <div className="op-section-title">Paquete</div>
                <div className="op-choice-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className={`op-choice${pkg === 'basic' ? ' sel' : ''}`} onClick={() => setPkg('basic')}>Basic</div>
                  <div className={`op-choice${pkg === 'standard' ? ' sel' : ''}`} onClick={() => setPkg('standard')}>Standard</div>
                  <div className={`op-choice${pkg === 'premium' ? ' sel' : ''}`} onClick={() => setPkg('premium')}>Premium</div>
                </div>
              </div>

              <div className="op-card">
                <div className="op-section-title">Servicios adicionales</div>
                <div className="op-checklist">
                  {ADDON_OPTIONS.map(o => (
                    <label key={o.key}>
                      <input type="checkbox" checked={!!addons[o.key]} onChange={() => toggleAddon(o.key)} />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="op-card">
                <div className="op-section-title">Velocidad</div>
                <div className="op-choice-row">
                  <div className={`op-choice${speed === 'standard' ? ' sel' : ''}`} onClick={() => setSpeed('standard')}>Standard</div>
                  <div className={`op-choice${speed === 'expedited' ? ' sel' : ''}`} onClick={() => setSpeed('expedited')}>Expedited (+$79)</div>
                </div>
              </div>

              <button type="submit" className="op-submit" disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar solicitud al cliente'}
              </button>
              {error && <p className="op-error">{error}</p>}
            </form>
          </>
        )}
      </div>
    </>
  )
}
