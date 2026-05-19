import { getSupabaseAdmin } from './supabase'
import type { NextRequest } from 'next/server'
import { getClientIp } from './rate-limit'

// Helper para insertar registros en admin_audit_log.
// Tabla creada manualmente en Supabase con:
//   id BIGSERIAL PRIMARY KEY, admin_email TEXT, action TEXT, entity TEXT,
//   entity_id TEXT, before JSONB, after JSONB, ip TEXT,
//   created_at TIMESTAMPTZ DEFAULT now()
//
// Fail-quiet: si el insert falla, log a console pero NO bloquea la accion del admin.
// Auditoria es importante pero no debe romper operaciones legitimas si la tabla
// tiene un problema (RLS, conexion caida, etc.).

interface AuditEntry {
  action: string
  entity?: string
  entityId?: string
  before?: unknown
  after?: unknown
  request?: NextRequest // opcional — si se pasa, extrae IP del header
}

export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const ip = entry.request ? getClientIp(entry.request) : null

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('admin_audit_log').insert({
      // Por ahora solo hay 1 admin (process.env.ADMIN_USER). Cuando se agreguen
      // multiples admins, el JWT debe llevar sub/email y aca se lee de ahi.
      admin_email: process.env.ADMIN_USER ?? 'admin',
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      ip,
    })
    if (error) {
      console.error('[audit-log] insert error:', error.message)
    }
  } catch (err) {
    console.error('[audit-log] unexpected error:', err)
  }
}
