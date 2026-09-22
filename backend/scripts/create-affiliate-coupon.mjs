// Crea el Coupon compartido del Programa de Afiliados en Stripe TEST (10%
// off, duration 'once') — mismo modelo que STRIPE_BASIC_COUPON_ID: un solo
// Coupon reusado por todos los afiliados, cada uno con su propio Promotion
// Code apuntando acá (ver lib/affiliates.ts createPromotionCodeForAffiliate).
//
// GUARDIA: rechaza correr si STRIPE_SECRET_KEY no es sk_test_ — nunca debe
// tocar la cuenta Live sin decisión explícita (ver checklist en CLAUDE.md
// "Stripe LIVE — preparado, NO activado"). Para Live, el founder crea el
// Coupon equivalente a mano en el Dashboard cuando decida lanzar, igual que
// se hizo con el statement descriptor de FBFC.
//
// Uso: node scripts/create-affiliate-coupon.mjs
// Copiar el id impreso a STRIPE_AFFILIATE_COUPON_ID en .env.local (y luego en
// Vercel, Development/Preview).

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

const coupon = await stripe.coupons.create({
  name: 'Affiliate Program — 10% off',
  percent_off: 10,
  duration: 'once',
})

console.log(`✓ Coupon creado: ${coupon.id}`)
console.log(`  Agregar a .env.local: STRIPE_AFFILIATE_COUPON_ID=${coupon.id}`)
