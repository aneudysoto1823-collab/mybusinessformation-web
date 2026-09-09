// Setea Product.statement_descriptor en los 4 Products de Stripe de FBFC
// (Registered Agent / Virtual Address / Annual Report / State Fee) — sin esto,
// las Subscriptions recurrentes de mybusinessformation.com facturan usando el
// descriptor BASE de la cuenta ("OPABIZ.COM"), que un cliente de FBFC nunca
// reconocería en su extracto (ver memoria project_pendiente_statement_descriptor_por_marca
// y lib/request-origin.ts statementDescriptorParams, que resuelve el mismo
// problema para pagos únicos vía payment_intent_data).
//
// Los 4 Products de OpaBiz NO se tocan a propósito: sin `statement_descriptor`
// propio, Stripe ya usa el descriptor base de la cuenta ("OPABIZ.COM"), que es
// correcto para esa marca — no hace falta setear nada ahí.
//
// GUARDIA: rechaza correr si STRIPE_SECRET_KEY no es sk_test_ — nunca debe
// tocar la cuenta Live sin que alguien lo decida explícitamente pasando esa
// key a mano (ver checklist en CLAUDE.md "Stripe LIVE — preparado, NO activado").
//
// Uso: node scripts/stripe-set-fbfc-statement-descriptors.mjs

import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Stripe from 'stripe'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const key = process.env.STRIPE_SECRET_KEY
if (!key) throw new Error('Falta STRIPE_SECRET_KEY en .env.local')
if (!key.startsWith('sk_test_')) {
  throw new Error(`GUARDIA: STRIPE_SECRET_KEY no es de TEST (empieza con "${key.slice(0, 8)}..."). Este script nunca debe correr contra Live sin decisión explícita.`)
}

const stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' })

const STATEMENT_DESCRIPTOR = 'MYBIZFORMATION'

// IDs de Stripe TEST mode documentados en memoria (project_pendiente_stripe_subscriptions,
// sesión 2026-09-07) — no son secretos (son ids de Product, no keys), así que
// se pueden hardcodear como default. Si alguna vez se recrean los Products de
// test, pasar los nuevos ids por env var del mismo nombre pisa este default.
const FBFC_PRODUCTS = {
  STRIPE_PRODUCT_ID_REGISTERED_AGENT_FBFC: 'prod_VDTRE7RzBlP3mk',
  STRIPE_PRODUCT_ID_VIRTUAL_ADDRESS_FBFC:  'prod_VDTSBFBtxatg5n',
  STRIPE_PRODUCT_ID_ANNUAL_REPORT_FBFC:    'prod_VDTY5EE9U5Cqua',
  STRIPE_PRODUCT_ID_STATE_FEE_FBFC:        'prod_VDTaOfrbtDRm8E',
}

for (const [envKey, defaultId] of Object.entries(FBFC_PRODUCTS)) {
  const productId = process.env[envKey] || defaultId
  const updated = await stripe.products.update(productId, { statement_descriptor: STATEMENT_DESCRIPTOR })
  console.log(`✓ ${envKey} (${productId}) → statement_descriptor: "${updated.statement_descriptor}"`)
}
