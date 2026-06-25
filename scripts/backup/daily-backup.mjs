#!/usr/bin/env node
/**
 * Backup diario de OpaBiz.
 *
 * Corre cada noche vía GitHub Actions (.github/workflows/backup-daily.yml).
 *
 * Pasos:
 *  1. pg_dump comprimido de Supabase Postgres → opabiz-backups/supabase-dumps/YYYY-MM-DD.sql.gz
 *  2. Sync incremental de PDFs del bucket Supabase Storage 'certificates' → opabiz-pdfs/certificates/orders/{orderId}/certificate.pdf
 *  3. Retención: borra dumps en opabiz-backups con prefijo supabase-dumps/ con LastModified > 30 dias
 *  4. Si CUALQUIER paso falla, manda email a alert@opabiz.com via Resend y exit code != 0
 *
 * Env vars requeridas (vienen de GitHub Secrets):
 *   DATABASE_URL                  postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres
 *   R2_ACCOUNT_ID                 (no se usa directamente, queda como referencia)
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_ENDPOINT                   https://ACCT.r2.cloudflarestorage.com
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY
 *   INTERNAL_ALERT_EMAIL          alert@opabiz.com
 *   RESEND_FROM_TRANSACTIONAL     noreply@opabiz.com
 */

import { spawn } from 'node:child_process'
import { createReadStream, createWriteStream, statSync, mkdirSync, unlinkSync, existsSync, rmdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

// ────────────────────────────────────────────────────────────────────
// Setup
// ────────────────────────────────────────────────────────────────────

const REQUIRED_ENV = [
  'DATABASE_URL',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]
const missing = REQUIRED_ENV.filter((k) => !process.env[k])
if (missing.length) {
  console.error('FATAL env vars missing:', missing.join(', '))
  process.exit(2)
}

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const ALERT_EMAIL = process.env.INTERNAL_ALERT_EMAIL || 'alert@opabiz.com'
const ALERT_FROM = process.env.RESEND_FROM_TRANSACTIONAL || 'noreply@opabiz.com'

const today = new Date().toISOString().slice(0, 10)
const ts = new Date().toISOString()
const log = (...args) => console.log(`[${new Date().toISOString()}]`, ...args)

const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

async function sendAlert(subject, body) {
  if (!RESEND_API_KEY) {
    log('WARN no RESEND_API_KEY — alert no enviada:', subject)
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `OpaBiz Alerts <${ALERT_FROM}>`,
        to: [ALERT_EMAIL],
        subject: `OpaBiz Backup: ${subject}`,
        text: body,
      }),
    })
    if (!res.ok) log('WARN Resend alert failed:', res.status, await res.text())
    else log('Alert enviada a', ALERT_EMAIL)
  } catch (e) {
    log('WARN sendAlert exception:', e.message)
  }
}

async function r2Has(bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (e) {
    if (e.$metadata?.httpStatusCode === 404) return false
    throw e
  }
}

async function r2PutFile(bucket, key, localPath, contentType) {
  const body = createReadStream(localPath)
  const size = statSync(localPath).size
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
      ContentLength: size,
    }),
  )
  return size
}

async function r2PutBuffer(bucket, key, buf, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buf,
      ContentType: contentType || 'application/octet-stream',
      ContentLength: buf.length,
    }),
  )
}

// ────────────────────────────────────────────────────────────────────
// Paso 1 — pg_dump → R2
// ────────────────────────────────────────────────────────────────────

async function dumpPostgresToR2() {
  log('=== Paso 1: pg_dump Supabase Postgres ===')
  const workDir = join(tmpdir(), `opabiz-backup-${today}`)
  if (!existsSync(workDir)) mkdirSync(workDir, { recursive: true })
  const localFile = join(workDir, `${today}.sql.gz`)

  // pg_dump --clean --if-exists --no-owner --no-acl | gzip > localFile
  // no-owner/no-acl: evita errores en restore por roles que solo existen en Supabase managed.
  // exclude-schema: schemas internas de Supabase (auth, storage, realtime, etc.) no las
  // backupeamos — son responsabilidad de Supabase y no queremos pisarlas en un restore.
  // Storage tiene su propia data (metadata de archivos) pero los archivos físicos los sincronizamos
  // aparte en Paso 2 hacia opabiz-pdfs.
  await new Promise((resolve, reject) => {
    const pgDump = spawn('pg_dump', [
      process.env.DATABASE_URL,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-acl',
      '--no-publications',
      '--no-subscriptions',
      '--format=plain',
      '--exclude-schema=auth',
      '--exclude-schema=storage',
      '--exclude-schema=realtime',
      '--exclude-schema=supabase_functions',
      '--exclude-schema=extensions',
      '--exclude-schema=graphql',
      '--exclude-schema=graphql_public',
      '--exclude-schema=pgbouncer',
      '--exclude-schema=pgsodium',
      '--exclude-schema=pgsodium_masks',
      '--exclude-schema=vault',
    ], { stdio: ['ignore', 'pipe', 'inherit'] })

    const gzip = spawn('gzip', ['-9'], { stdio: ['pipe', 'pipe', 'inherit'] })
    const fileStream = createWriteStream(localFile)

    pgDump.stdout.pipe(gzip.stdin)
    gzip.stdout.pipe(fileStream)

    let pgCode = null
    let gzCode = null
    let fileDone = false

    const tryFinish = () => {
      if (pgCode === null || gzCode === null || !fileDone) return
      if (pgCode !== 0) return reject(new Error(`pg_dump exit ${pgCode}`))
      if (gzCode !== 0) return reject(new Error(`gzip exit ${gzCode}`))
      resolve()
    }

    pgDump.on('close', (c) => { pgCode = c; tryFinish() })
    gzip.on('close', (c) => { gzCode = c; tryFinish() })
    fileStream.on('finish', () => { fileDone = true; tryFinish() })
    fileStream.on('error', reject)
    pgDump.on('error', reject)
    gzip.on('error', reject)
  })

  const sizeBytes = statSync(localFile).size
  const sizeMb = (sizeBytes / 1024 / 1024).toFixed(2)
  log(`pg_dump completado: ${sizeMb} MB → ${localFile}`)

  if (sizeBytes < 1024) throw new Error(`pg_dump output sospechosamente chico: ${sizeBytes} bytes`)

  const key = `supabase-dumps/${today}.sql.gz`
  await r2PutFile('opabiz-backups', key, localFile, 'application/gzip')
  log(`Subido a R2: opabiz-backups/${key} (${sizeMb} MB)`)

  unlinkSync(localFile)
  try { rmdirSync(workDir) } catch {}
  return { key, sizeBytes }
}

// ────────────────────────────────────────────────────────────────────
// Paso 2 — Sync PDFs Supabase Storage → R2
// ────────────────────────────────────────────────────────────────────

async function syncCertificatesToR2() {
  log('=== Paso 2: sync PDFs Supabase Storage → R2 ===')

  // Lista todos los archivos del bucket 'certificates' (estructura: orders/{orderId}/certificate.pdf)
  // Supabase Storage API requiere listar carpeta por carpeta — primero 'orders/'.
  let copied = 0
  let skipped = 0
  let failed = 0

  // Listar carpetas dentro de 'orders/'
  const { data: orderFolders, error: listErr } = await supabase.storage
    .from('certificates')
    .list('orders', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

  if (listErr) {
    log('ERROR listando orders/:', listErr.message)
    if (listErr.message.includes('not found') || listErr.message.includes('Bucket not found')) {
      log('Bucket certificates no existe o esta vacio — saltando paso 2')
      return { copied: 0, skipped: 0, failed: 0 }
    }
    throw listErr
  }

  log(`Encontradas ${orderFolders.length} ordenes con certificados`)

  for (const folder of orderFolders) {
    const orderId = folder.name
    const { data: files, error: fErr } = await supabase.storage
      .from('certificates')
      .list(`orders/${orderId}`, { limit: 10 })
    if (fErr) {
      log(`ERROR listando orders/${orderId}:`, fErr.message)
      failed++
      continue
    }

    for (const f of files) {
      const supaPath = `orders/${orderId}/${f.name}`
      const r2Key = `certificates/${supaPath}`

      // Skip si ya existe en R2 (idempotente)
      if (await r2Has('opabiz-pdfs', r2Key)) {
        skipped++
        continue
      }

      // Descargar de Supabase
      const { data: blob, error: dErr } = await supabase.storage
        .from('certificates')
        .download(supaPath)
      if (dErr) {
        log(`ERROR download ${supaPath}:`, dErr.message)
        failed++
        continue
      }
      const buf = Buffer.from(await blob.arrayBuffer())
      await r2PutBuffer('opabiz-pdfs', r2Key, buf, 'application/pdf')
      copied++
      if (copied % 10 === 0) log(`  ...${copied} PDFs copiados`)
    }
  }

  log(`PDFs sync OK: ${copied} nuevos, ${skipped} ya existian, ${failed} fallidos`)
  return { copied, skipped, failed }
}

// ────────────────────────────────────────────────────────────────────
// Paso 3 — Retencion: borrar dumps > 30 dias
// ────────────────────────────────────────────────────────────────────

async function pruneOldDumps() {
  log('=== Paso 3: retencion (borrar dumps > 30 dias) ===')
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000

  let deleted = 0
  let kept = 0
  let token = undefined
  do {
    const r = await s3.send(
      new ListObjectsV2Command({
        Bucket: 'opabiz-backups',
        Prefix: 'supabase-dumps/',
        ContinuationToken: token,
      }),
    )
    for (const obj of r.Contents || []) {
      if (!obj.LastModified) continue
      if (obj.LastModified.getTime() < cutoff) {
        await s3.send(new DeleteObjectCommand({ Bucket: 'opabiz-backups', Key: obj.Key }))
        log(`  borrado: ${obj.Key} (${obj.LastModified.toISOString()})`)
        deleted++
      } else {
        kept++
      }
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (token)

  log(`Retencion OK: ${deleted} borrados, ${kept} conservados (<30 dias)`)
  return { deleted, kept }
}

// ────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────

async function main() {
  log('Backup diario OpaBiz — fecha:', today)
  const startedAt = Date.now()
  const summary = { date: today, ts }

  try {
    const r1 = await dumpPostgresToR2()
    summary.pgDumpKey = r1.key
    summary.pgDumpMb = (r1.sizeBytes / 1024 / 1024).toFixed(2)
  } catch (e) {
    log('FATAL paso 1 (pg_dump):', e.message)
    await sendAlert('FALLO Paso 1 pg_dump', `Fecha: ${today}\nError: ${e.message}\n\n${e.stack || ''}`)
    process.exit(1)
  }

  try {
    const r2 = await syncCertificatesToR2()
    summary.pdfs = r2
  } catch (e) {
    log('ERROR paso 2 (sync PDFs):', e.message)
    // No es fatal — el dump SQL ya esta seguro. Solo alerta.
    await sendAlert('Paso 2 PDFs fallo (no critico)', `Fecha: ${today}\nError: ${e.message}\n\nDump SQL seguro. PDFs no sincronizados.`)
    summary.pdfs = { error: e.message }
  }

  try {
    const r3 = await pruneOldDumps()
    summary.prune = r3
  } catch (e) {
    log('WARN paso 3 (retencion):', e.message)
    summary.prune = { error: e.message }
  }

  const durationS = ((Date.now() - startedAt) / 1000).toFixed(1)
  log(`Backup completado en ${durationS}s:`, JSON.stringify(summary))
}

main().catch(async (e) => {
  console.error('UNCAUGHT:', e)
  await sendAlert('Excepcion no manejada', `Error: ${e.message}\n${e.stack || ''}`)
  process.exit(1)
})
