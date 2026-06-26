// Cliente SFTP minimo contra el feed publico de Florida.
// Reusa ssh2-sftp-client (libreria madura, misma del proyecto datallc).
// NO inventar cliente SFTP a mano.
//
// Credenciales publicas oficiales (documentadas en cor.html de Sunbiz):
//   sftp.floridados.gov user=Public password=PubAccess1845!
// Por consistencia se setean tambien como env vars de Vercel para
// poder rotarlas si Florida cambia algo.

import SftpClient from 'ssh2-sftp-client'

const SFTP_HOST = process.env.SUNBIZ_SFTP_HOST || 'sftp.floridados.gov'
const SFTP_USER = process.env.SUNBIZ_SFTP_USER || 'Public'
const SFTP_PASS = process.env.SUNBIZ_SFTP_PASS || 'PubAccess1845!'
const SFTP_PORT = 22
const COR_DIR = 'doc/cor'

/**
 * Descarga el archivo daily YYYYMMDDc.txt del SFTP de Florida.
 * Devuelve el contenido como string (codificacion latin-1 segun el
 * layout oficial — algunos nombres tienen caracteres latinos).
 */
export async function downloadDailyFile(yyyymmdd: string): Promise<string> {
  if (!/^\d{8}$/.test(yyyymmdd)) {
    throw new Error(`Invalid date format ${yyyymmdd}, expected YYYYMMDD`)
  }
  const remotePath = `${COR_DIR}/${yyyymmdd}c.txt`
  const sftp = new SftpClient()
  try {
    await sftp.connect({
      host: SFTP_HOST,
      port: SFTP_PORT,
      username: SFTP_USER,
      password: SFTP_PASS,
      readyTimeout: 20_000,
    })
    // get() con dst undefined devuelve un Buffer
    const buf = await sftp.get(remotePath) as Buffer
    if (!buf || buf.length < 1024) {
      throw new Error(`Daily file ${remotePath} too small (${buf?.length || 0} bytes)`)
    }
    // Florida usa latin-1 — preservamos los caracteres del feed
    return buf.toString('latin1')
  } finally {
    try { await sftp.end() } catch { /* ignore */ }
  }
}
