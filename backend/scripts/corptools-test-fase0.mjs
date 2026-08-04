// Corporate Tools API — Fase 0: test READ-ONLY contra la cuenta de TEST.
//
// Hace exactamente 3 GETs contra https://api.corporatetools.com usando SOLO las
// keys de TEST (CORPTOOLS_ACCESS_KEY_TEST / CORPTOOLS_SECRET_KEY_TEST). Si
// esas dos no estan definidas, hace throw — nunca cae a las keys de PROD.
//
//   1) GET /account
//   2) GET /websites?url=https://www.registeredagentsinc.com/
//   3) GET /registered-agent-products?url=<url confirmada en el paso 2>
//
// NO llama a POST /companies, NO llama a POST /services, NO crea companies,
// NO asigna servicios, NO factura nada. GET requests por diseno HTTP no crean
// registros ni cobros del lado de RAI.
//
// Doble candado: ALLOWED_METHODS solo permite 'GET'. Si algun dia se edita el
// archivo por error y pasa 'POST', el wrapper hace throw ANTES del fetch.

import dotenv from 'dotenv'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { SignJWT } from 'jose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const BASE_URL = 'https://api.corporatetools.com'
const WEBSITE_URL_CANDIDATE = 'https://www.registeredagentsinc.com/'

// GUARDIA DOBLE — solo GET permitido.
const ALLOWED_METHODS = new Set(['GET'])

// GUARDIA DE KEYS — solo TEST. Nunca cae a PROD por accidente.
const ACCESS_KEY = process.env.CORPTOOLS_ACCESS_KEY_TEST
const SECRET_KEY = process.env.CORPTOOLS_SECRET_KEY_TEST
if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('ERROR: Faltan CORPTOOLS_ACCESS_KEY_TEST y/o CORPTOOLS_SECRET_KEY_TEST en .env.local.')
  console.error('Este script SOLO usa keys de TEST y no cae a PROD como fallback.')
  process.exit(1)
}

async function signJwt(pathOnly, hashInput) {
  const content = crypto.createHash('sha256').update(hashInput).digest('hex')
  const secret = new TextEncoder().encode(SECRET_KEY)
  return await new SignJWT({ path: pathOnly, content })
    .setProtectedHeader({ alg: 'HS256', access_key: ACCESS_KEY })
    .sign(secret)
}

async function doFetch(fullUrl, token) {
  const res = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, ok: res.ok, data }
}

async function ctFetch(method, pathOnly, queryParams = null) {
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(`[SAFETY] Method ${method} not allowed. Only GET is permitted in this test script.`)
  }
  const queryString = queryParams ? new URLSearchParams(queryParams).toString() : ''
  const body = ''
  const fullUrl = queryString ? `${BASE_URL}${pathOnly}?${queryString}` : `${BASE_URL}${pathOnly}`

  // Attempt 1: firma segun DOC OFICIAL — content = SHA256(queryString + body)
  const tokenDocSpec = await signJwt(pathOnly, queryString + body)
  const first = await doFetch(fullUrl, tokenDocSpec)
  let signMode = queryString ? 'doc-spec (query+body)' : 'no-query'

  // Fallback: si dio 401 Y habia query, reintentar sin incluir el query en el hash.
  let result = first
  if (first.status === 401 && queryString) {
    const tokenGithubSpec = await signJwt(pathOnly, body)
    const second = await doFetch(fullUrl, tokenGithubSpec)
    result = second
    signMode = (second.ok || second.status !== 401)
      ? 'github-example (body-only)'
      : 'AMBOS FALLARON (doc-spec y github-example dieron 401)'
  }
  return { ...result, url: fullUrl, signMode }
}

function bar(label) {
  console.log(`\n${'='.repeat(74)}\n  ${label}\n${'='.repeat(74)}`)
}

async function main() {
  console.log('Corporate Tools API — Fase 0 (cuenta TEST, 3 GETs, cero side-effects)')
  console.log(`Base:     ${BASE_URL}`)
  console.log(`Env:      TEST (keys: CORPTOOLS_*_TEST)`)
  console.log(`Website:  ${WEBSITE_URL_CANDIDATE}`)

  // 1) GET /account
  bar('1) GET /account   — confirma que las keys de TEST funcionan')
  const account = await ctFetch('GET', '/account')
  console.log(`URL:      ${account.url}`)
  console.log(`Status:   ${account.status}`)
  console.log(`SignMode: ${account.signMode}`)
  console.log('Body:', JSON.stringify(account.data, null, 2))
  if (!account.ok) {
    console.log('\nKeys de TEST invalidas o problema de auth.')
  }

  // 2) GET /websites?url=<candidate>
  bar(`2) GET /websites?url=${WEBSITE_URL_CANDIDATE}   — ¿la cuenta TEST comparte website con PROD?`)
  const websites = await ctFetch('GET', '/websites', { url: WEBSITE_URL_CANDIDATE })
  console.log(`URL:      ${websites.url}`)
  console.log(`Status:   ${websites.status}`)
  console.log(`SignMode: ${websites.signMode}`)
  console.log('Body:', JSON.stringify(websites.data, null, 2))

  // Detectar URL confirmada del response (si viene distinta)
  let confirmedUrl = null
  const websiteResult = websites.data?.result
  const websiteObj = websiteResult?.website
  if (Array.isArray(websiteResult) && websiteResult.length > 0 && websiteResult[0]?.url) {
    confirmedUrl = websiteResult[0].url
  } else if (websiteObj && websiteObj !== null && typeof websiteObj === 'object' && websiteObj.url) {
    confirmedUrl = websiteObj.url
  } else if (websiteResult?.url && websiteObj !== null) {
    // Algunas respuestas ponen url directo en result
    confirmedUrl = websiteResult.url
  }

  if (confirmedUrl) {
    console.log(`\nWebsite encontrado en la cuenta TEST. URL confirmada: ${confirmedUrl}`)
  } else {
    console.log(`\nLa cuenta TEST NO tiene "${WEBSITE_URL_CANDIDATE}" registrado como website.`)
    console.log('STOP — igual que la vez anterior con opabiz.com. Preguntarle a RAI cual es la URL exacta del website registrado en la cuenta TEST.')
  }

  // 3) GET /registered-agent-products?url=<confirmedUrl>
  //    Si no hay confirmedUrl, igual probamos con la candidata para tener info completa.
  const urlToUse = confirmedUrl || WEBSITE_URL_CANDIDATE
  bar(`3) GET /registered-agent-products?url=${urlToUse}   — Florida product_id + precio`)
  const products = await ctFetch('GET', '/registered-agent-products', { url: urlToUse })
  console.log(`URL:      ${products.url}`)
  console.log(`Status:   ${products.status}`)
  console.log(`SignMode: ${products.signMode}`)
  console.log('Body:', JSON.stringify(products.data, null, 2))

  const productsList = Array.isArray(products.data?.result) ? products.data.result : []
  const florida = productsList.find(p => p?.jurisdiction === 'Florida')

  // Resumen
  bar('RESUMEN — cuenta TEST')
  console.log(`Keys OK:         ${account.ok ? 'SI' : 'NO'}`)
  console.log(`Website OK:      ${confirmedUrl ? 'SI (' + confirmedUrl + ')' : 'NO (URL no registrada en TEST — preguntar a RAI)'}`)
  console.log(`# productos RA:  ${productsList.length}`)
  if (florida) {
    console.log(`\nFlorida encontrado:`)
    console.log(`  product_id:  ${florida.id}`)
    console.log(`  price:       $${florida.price}`)
    console.log(`  duration:    ${florida.duration} months`)
    console.log(`  name:        ${florida.name}`)
  } else if (productsList.length > 0) {
    console.log(`\nFlorida NO esta en la lista. Jurisdicciones disponibles:`)
    for (const p of productsList) console.log(`  - ${p?.jurisdiction} ($${p?.price})`)
  } else {
    console.log(`\nLista de productos vacia — la URL del website no matchea o la cuenta TEST no tiene productos configurados.`)
  }
  console.log()
}

main().catch(err => {
  console.error('\nERROR:', err.message)
  process.exit(1)
})
