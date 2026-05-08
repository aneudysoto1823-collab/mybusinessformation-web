'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Company = {
  document_id: string
  company_name: string
  company_type: string
  owner_name: string | null
  address: string | null
  city: string | null
  state: string
  zip: string | null
  email: string | null
  status: string
  id?: string
}


const SERVICES = [
  {
    id: 'labor_law',
    titleEn: 'Labor Law Poster 2026',
    titleEs: 'Póster de Leyes Laborales 2026',
    descEn: 'Mandatory federal & state poster for all Florida businesses. Avoid fines up to $17,650.',
    descEs: 'Póster obligatorio federal y estatal para todos los negocios en Florida. Evita multas de hasta $17,650.',
    price: 120.00,
  },
  {
    id: 'ein',
    titleEn: 'EIN / Tax ID Number',
    titleEs: 'EIN / Número de Identificación Fiscal',
    descEn: 'Required to open a business bank account, hire employees, and file taxes.',
    descEs: 'Necesario para abrir cuenta bancaria, contratar empleados y declarar impuestos.',
    price: 161.00,
  },
  {
    id: 'certificate',
    titleEn: 'Certificate of Status (FL)',
    titleEs: 'Certificado de Estado (FL)',
    descEn: 'Official document proving your business is active and in good standing with Florida.',
    descEs: 'Documento oficial que acredita que tu negocio está activo y al corriente con Florida.',
    price: 79.00,
  },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── HEADER ── */
  .nb-header {
    background: #1B3A6B;
    height: 64px;
    padding: 0 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,.25);
  }
  .nb-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .nb-logo-mark {
    width: 38px;
    height: 38px;
    background: #2563EB;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: 'Fraunces', serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -.5px;
    flex-shrink: 0;
  }
  .nb-logo-text { line-height: 1.25; }
  .nb-logo-text .l1 {
    color: #fff;
    font-family: 'Fraunces', serif;
    font-size: .95rem;
    font-weight: 700;
  }
  .nb-logo-text .l2 {
    color: #93c5fd;
    font-size: .68rem;
    font-weight: 500;
    letter-spacing: .3px;
  }
  .nb-header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .nb-phone {
    color: rgba(255,255,255,.85);
    font-size: .82rem;
    font-weight: 600;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color .15s;
  }
  .nb-phone:hover { color: #fff; }
  .nb-lang {
    display: flex;
    background: rgba(255,255,255,.12);
    border-radius: 20px;
    padding: 3px;
    gap: 2px;
  }
  .nb-lang button {
    padding: 4px 13px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    font-size: .72rem;
    font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .15s;
  }
  .nb-lang button.active  { background: #fff; color: #1B3A6B; }
  .nb-lang button:not(.active) { background: transparent; color: rgba(255,255,255,.65); }

  /* ── WELCOME ── */
  .nb-welcome {
    background: #fff;
    padding: 36px 40px 38px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
  }
  .nb-welcome-inner { max-width: 680px; margin: 0 auto; }
  .nb-welcome h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(1.2rem, 2.2vw, 1.55rem);
    font-weight: 700;
    color: #1B3A6B;
    line-height: 1.2;
    margin-bottom: 10px;
  }
  .nb-welcome h1 span { color: #2563EB; }
  .nb-welcome p {
    color: #475569;
    font-size: .86rem;
    line-height: 1.75;
    max-width: 560px;
    margin: 0 auto;
  }

  /* ── ID ENTRY ── */
  .entry-wrap {
    min-height: calc(100vh - 64px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F5F9;
    padding: 40px 24px;
  }
  .entry-card {
    background: #fff;
    border-radius: 16px;
    padding: 40px 44px;
    max-width: 460px;
    width: 100%;
    box-shadow: 0 8px 40px rgba(27,58,107,.14);
    border: 1px solid #e2e8f0;
  }
  .entry-tag {
    display: inline-block;
    background: #EFF6FF;
    color: #2563EB;
    font-size: .68rem;
    font-weight: 700;
    letter-spacing: .8px;
    text-transform: uppercase;
    padding: 4px 11px;
    border-radius: 20px;
    margin-bottom: 14px;
  }
  .entry-title {
    font-family: 'Fraunces', serif;
    font-size: 1.55rem;
    font-weight: 900;
    color: #1B3A6B;
    line-height: 1.2;
    margin-bottom: 8px;
  }
  .entry-sub {
    color: #64748b;
    font-size: .86rem;
    line-height: 1.65;
    margin-bottom: 24px;
  }
  .entry-label {
    display: block;
    font-size: .67rem;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: .5px;
    margin-bottom: 5px;
  }
  .entry-input {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: .92rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1e293b;
    outline: none;
    transition: all .2s;
    background: #f8fafc;
    letter-spacing: .5px;
  }
  .entry-input:focus {
    border-color: #2563EB;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(37,99,235,.08);
  }
  .entry-input.err { border-color: #ef4444; background: #fef2f2; }
  .entry-err {
    font-size: .74rem;
    color: #dc2626;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .entry-btn {
    width: 100%;
    padding: 13px;
    border-radius: 8px;
    background: #1B3A6B;
    color: #fff;
    font-size: .92rem;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin-top: 14px;
    transition: all .2s;
    box-shadow: 0 4px 14px rgba(27,58,107,.3);
  }
  .entry-btn:hover:not(:disabled) {
    background: #15306090;
    transform: translateY(-1px);
    box-shadow: 0 7px 20px rgba(27,58,107,.38);
  }
  .entry-btn:disabled { opacity: .55; cursor: not-allowed; }
  .entry-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 18px 0;
    color: #cbd5e1;
    font-size: .72rem;
  }
  .entry-divider::before, .entry-divider::after {
    content: ''; flex: 1; height: 1px; background: #e2e8f0;
  }

  /* ── SERVICES ── */
  .svc-section {
    padding: 44px 40px 36px;
    background: #F1F5F9;
  }
  .svc-inner { max-width: 1100px; margin: 0 auto; }
  .svc-heading {
    text-align: center;
    margin-bottom: 26px;
  }
  .svc-heading h2 {
    font-family: 'Fraunces', serif;
    font-size: clamp(1.1rem, 2vw, 1.4rem);
    font-weight: 700;
    color: #1B3A6B;
    margin-bottom: 6px;
  }
  .svc-heading p {
    color: #64748b;
    font-size: .84rem;
    line-height: 1.65;
    max-width: 520px;
    margin: 0 auto;
  }
  .svc-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .svc-card {
    background: #fff;
    border: 1px solid rgba(0,0,0,.06);
    border-radius: 16px;
    padding: 22px 20px 20px;
    cursor: pointer;
    transition: all .22s;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 4px 18px rgba(27,58,107,.07);
  }
  .svc-card:hover {
    box-shadow: 0 8px 32px rgba(27,58,107,.13);
    transform: translateY(-2px);
  }
  .svc-card.selected {
    transform: translateY(-2px);
  }
  .svc-check {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 2px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all .2s;
    align-self: flex-end;
  }
  .svc-card.selected .svc-check {
    background: #2563EB;
    border-color: #2563EB;
  }
  .svc-title {
    font-size: .95rem;
    font-weight: 700;
    color: #1B3A6B;
    line-height: 1.3;
  }
  .svc-desc {
    font-size: .79rem;
    color: #64748b;
    line-height: 1.75;
    flex: 1;
  }
  .svc-hl {
    color: #2563EB;
    font-weight: 600;
  }
  .svc-price {
    font-size: 1.1rem;
    font-weight: 800;
    color: #2563EB;
    margin-top: 4px;
  }

  /* ── FORM + CHECKOUT ── */
  .form-section {
    background: #fff;
    border-top: 1px solid #e2e8f0;
    padding: 40px 40px 60px;
  }
  .form-inner { max-width: 1100px; margin: 0 auto; }
  .form-heading { margin-bottom: 28px; }
  .form-heading h2 {
    font-family: 'Fraunces', serif;
    font-size: clamp(1.15rem, 2.2vw, 1.5rem);
    font-weight: 700;
    color: #1B3A6B;
    margin-bottom: 6px;
  }
  .form-heading p {
    color: #64748b;
    font-size: .86rem;
    line-height: 1.7;
  }
  .form-body {
    display: flex;
    gap: 32px;
    align-items: flex-start;
  }
  .form-left { flex: 1; min-width: 0; }
  .form-block { margin-bottom: 32px; }
  .form-block-title {
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #94a3b8;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 13px;
  }
  .form-field { display: flex; flex-direction: column; gap: 5px; }
  .form-field.span2 { grid-column: span 2; }
  .form-label {
    font-size: .66rem;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: .5px;
  }
  .form-label .req { color: #ef4444; margin-left: 2px; }
  .form-input {
    padding: 10px 13px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: .88rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1e293b;
    outline: none;
    background: #f8fafc;
    transition: all .2s;
    width: 100%;
  }
  .form-input:focus {
    border-color: #2563EB;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(37,99,235,.08);
  }
  .form-input[readOnly] {
    background: #f1f5f9;
    color: #64748b;
    cursor: default;
  }
  .form-input[readOnly]:focus { border-color: #e2e8f0; box-shadow: none; }
  .form-hint { font-size: .7rem; color: #94a3b8; margin-top: 2px; }

  /* ── STEP INDICATOR ── */
  .steps-bar {
    display: flex;
    align-items: center;
    margin-bottom: 28px;
  }
  .step-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .step-circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .72rem;
    font-weight: 700;
    transition: all .25s;
  }
  .step-circle.done { background: #16a34a; color: #fff; }
  .step-circle.active { background: #fff; color: #1B3A6B; border: 2px solid #1B3A6B; box-shadow: 0 0 0 4px rgba(27,58,107,.12); }
  .step-circle.pending { background: #fff; color: #94a3b8; border: 2px solid #e2e8f0; }
  .step-lbl {
    font-size: .62rem;
    font-weight: 600;
    white-space: nowrap;
    color: #94a3b8;
    letter-spacing: .2px;
  }
  .step-lbl.active { color: #1B3A6B; }
  .step-lbl.done   { color: #16a34a; }
  .step-connector {
    flex: 1;
    height: 2px;
    background: #e2e8f0;
    margin: 0 8px;
    margin-bottom: 18px;
    transition: background .25s;
  }
  .step-connector.done { background: #16a34a; }

  /* ── STEP NAV BUTTONS ── */
  .step-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    gap: 12px;
  }
  .step-back {
    background: none;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 22px;
    font-size: .88rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .2s;
  }
  .step-back:hover { border-color: #94a3b8; color: #374151; }
  .step-next {
    background: #2563EB;
    border: none;
    border-radius: 8px;
    padding: 11px 28px;
    font-size: .88rem;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .2s;
    box-shadow: 0 4px 14px rgba(37,99,235,.3);
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .step-next:hover { background: #1d4ed8; transform: translateY(-1px); }
  .step-next.primary { background: #2563EB; }
  .step-next.primary:hover { background: #1d4ed8; }

  /* ── CHECKOUT BOX ── */
  .co-box {
    width: 400px;
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 24px rgba(27,58,107,.1);
    position: sticky;
    top: 84px;
  }
  .co-title {
    font-family: 'Fraunces', serif;
    font-size: 1rem;
    font-weight: 700;
    color: #1B3A6B;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid #f1f5f9;
  }
  .co-line {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
    font-size: .83rem;
  }
  .co-line-name { color: #374151; flex: 1; margin-right: 8px; }
  .co-line-price { color: #1B3A6B; font-weight: 600; white-space: nowrap; }
  .co-divider { height: 1px; background: #f1f5f9; margin: 14px 0; }
  .co-savings {
    display: flex;
    justify-content: space-between;
    font-size: .8rem;
    color: #16a34a;
    font-weight: 600;
    margin-bottom: 10px;
  }
  .co-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 20px;
  }
  .co-total-label {
    font-size: .82rem;
    font-weight: 700;
    color: #1B3A6B;
    text-transform: uppercase;
    letter-spacing: .4px;
  }
  .co-total-amount {
    font-size: 1.45rem;
    font-weight: 700;
    color: #1B3A6B;
  }
  .co-total-amount span {
    font-size: .75rem;
    font-weight: 500;
    color: #94a3b8;
    margin-left: 3px;
  }
  .co-btn {
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    background: #1B3A6B;
    color: #fff;
    font-size: .92rem;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .2s;
    box-shadow: 0 4px 16px rgba(27,58,107,.28);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .co-btn:hover { background: #153060; transform: translateY(-1px); box-shadow: 0 7px 22px rgba(27,58,107,.36); }
  .co-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }
  .co-trust {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 14px;
    color: #94a3b8;
    font-size: .71rem;
  }
  .co-empty {
    text-align: center;
    color: #94a3b8;
    font-size: .8rem;
    padding: 20px 0;
  }

  @media (max-width: 960px) {
    .form-body { flex-direction: column; }
    .co-box { width: 100%; position: static; }
    .svc-section { padding: 36px 20px 28px; }
    .form-section { padding: 36px 20px 52px; }
  }
  @media (max-width: 700px) {
    .svc-grid { grid-template-columns: 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .form-field.span2 { grid-column: span 1; }
  }
  /* ── TOOLTIP ── */
  .tip-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    margin-left: 5px;
    vertical-align: middle;
  }
  .tip-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #64748b;
    font-size: .6rem;
    font-weight: 700;
    cursor: help;
    flex-shrink: 0;
    transition: background .15s;
  }
  .tip-wrap:hover .tip-icon { background: #2563EB; color: #fff; }
  .tip-box {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    color: #1B3A6B;
    font-size: .72rem;
    line-height: 1.55;
    padding: 9px 13px;
    border-radius: 9px;
    width: 230px;
    pointer-events: none;
    opacity: 0;
    transition: opacity .18s;
    z-index: 20;
    white-space: normal;
    box-shadow: 0 4px 18px rgba(27,58,107,.13);
    border: 1px solid rgba(0,0,0,.06);
  }
  .tip-box::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #fff;
  }
  .tip-wrap:hover .tip-box { opacity: 1; }

  /* ── RADIO / CHECKBOX CUSTOM ── */
  .form-radio-group { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
  .form-radio-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    transition: all .15s;
  }
  .form-radio-row:hover { border-color: #93c5fd; background: #f0f7ff; }
  .form-radio-row.selected { border-color: #2563EB; background: #EFF6FF; }
  .form-radio-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    transition: all .15s;
  }
  .form-radio-row.selected .form-radio-dot { border-color: #2563EB; }
  .form-radio-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2563EB;
    opacity: 0;
    transition: opacity .15s;
  }
  .form-radio-row.selected .form-radio-inner { opacity: 1; }
  .form-radio-text { font-size: .82rem; color: #374151; font-weight: 500; line-height: 1.4; }
  .form-radio-sub { font-size: .72rem; color: #94a3b8; margin-top: 2px; }

  /* Yes/No toggle */
  .yn-group { display: flex; gap: 10px; margin-top: 4px; }
  .yn-btn {
    flex: 1;
    padding: 9px;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    font-size: .82rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .15s;
    text-align: center;
  }
  .yn-btn:hover { border-color: #93c5fd; }
  .yn-btn.yes.active { border-color: #2563EB; background: #EFF6FF; color: #2563EB; }
  .yn-btn.no.active  { border-color: #2563EB; background: #EFF6FF; color: #2563EB; }

  /* Textarea */
  .form-textarea {
    width: 100%;
    padding: 10px 13px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: .88rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1e293b;
    outline: none;
    background: #f8fafc;
    transition: all .2s;
    resize: vertical;
    min-height: 80px;
  }
  .form-textarea:focus {
    border-color: #2563EB;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(37,99,235,.08);
  }

  /* Shipping toggle */
  .ship-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    margin-top: 6px;
    font-size: .82rem;
    color: #374151;
    font-weight: 500;
    user-select: none;
  }
  .ship-check {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    border: 2px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all .15s;
  }
  .ship-check.on { background: #2563EB; border-color: #2563EB; }

  /* Compliance pre-filled block */
  .compliance-block {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 16px;
    margin-top: 4px;
  }
  .compliance-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 7px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .compliance-row:last-child { border-bottom: none; }
  .compliance-q { font-size: .76rem; color: #374151; flex: 1; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }

  @media (max-width: 600px) {
    .nb-header { padding: 0 16px; }
    .nb-welcome { padding: 28px 20px 30px; }
    .entry-card { padding: 28px 22px; }
    .svc-section { padding: 32px 16px 24px; }
    .form-section { padding: 32px 16px 48px; }
  }

  .disclosure {
    max-width: 860px;
    margin: 0 auto;
    padding: 24px 20px 32px;
    text-align: center;
    color: #94a3b8;
    font-size: .68rem;
    line-height: 1.6;
    border-top: 1px solid #e2e8f0;
  }
  .disclosure-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .disclosure-links button {
    background: none;
    border: none;
    cursor: pointer;
    color: #64748b;
    font-size: .76rem;
    font-weight: 600;
    padding: 0;
    font-family: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color .2s;
  }
  .disclosure-links button:hover { color: #2563EB; }
  .disclosure-links span { color: #cbd5e1; font-size: .76rem; }

  .legal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.55);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .legal-modal {
    background: #fff;
    border-radius: 14px;
    width: 100%;
    max-width: 640px;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .legal-modal-header {
    padding: 20px 22px 16px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .legal-modal-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1C2E44;
  }
  .legal-close {
    width: 30px;
    height: 30px;
    border: none;
    background: #f1f5f9;
    border-radius: 7px;
    cursor: pointer;
    font-size: 1.1rem;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: background .2s;
  }
  .legal-close:hover { background: #e2e8f0; }
  .legal-modal-body {
    padding: 22px;
    overflow-y: auto;
    flex: 1;
  }
  .legal-updated {
    font-size: .71rem;
    color: #94a3b8;
    margin-bottom: 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  .legal-section { margin-bottom: 22px; }
  .legal-section h3 {
    font-size: .87rem;
    font-weight: 700;
    color: #1C2E44;
    margin-bottom: 7px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f1f5f9;
  }
  .legal-section p {
    font-size: .79rem;
    color: #475569;
    line-height: 1.75;
    margin-bottom: 7px;
  }
  .legal-section ul { padding-left: 16px; margin-bottom: 7px; }
  .legal-section li {
    font-size: .79rem;
    color: #475569;
    line-height: 1.7;
    margin-bottom: 3px;
  }
  .legal-warn {
    background: #FEF3C7;
    border-left: 3px solid #F59E0B;
    border-radius: 0 6px 6px 0;
    padding: 9px 12px;
    margin: 10px 0;
    font-size: .77rem;
    color: #92400E;
    line-height: 1.6;
  }
`

function NewBusinessContent() {
  const sp = useSearchParams()
  const [lang, setLang] = useState<'en' | 'es'>('en')

  const [docInput, setDocInput]   = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [company, setCompany]     = useState<Company | null>(null)
  const [lookupErr, setLookupErr] = useState('')

  const [selected, setSelected]   = useState<Set<string>>(new Set(SERVICES.map(s => s.id)))
  const [step, setStep]           = useState(1)
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())

  function goToStep(n: number) {
    setDoneSteps(prev => { const s = new Set(prev); s.add(step); return s })
    setStep(n)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const [showSsn, setShowSsn]     = useState(false)
  const [modal, setModal]         = useState<null | 'terms' | 'privacy' | 'legal'>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const shipRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    // Step 1 — Business
    companyName: '', address: '', city: '', zip: '',
    llcStartMonth: '', llcStartYear: '',
    businessDescription: '',
    differentShipping: false,
    shipAddress: '', shipCity: '', shipZip: '',
    // Step 2 — Contact
    firstName: '', middleInitial: '', lastName: '', suffix: '',
    email: '', phone: '',
    ssnItin: '', ssnItinConfirm: '',
    // Step 3 — EIN compliance
    einReason: '',
    einFirstName: '', einLastName: '',
    hasW2: 'no',
    hasHighwayVehicle: 'no',
    hasGambling: 'no',
    hasForm720: 'no',
    hasAlcohol: 'no',
  })

  const lookup = useCallback(async (id: string): Promise<boolean> => {
    if (!id.trim()) return false
    setLookingUp(true); setLookupErr('')
    try {
      const res  = await fetch(`/api/sunbiz?document_id=${encodeURIComponent(id.trim())}`)
      const data = await res.json()
      if (!res.ok || !data.company) {
        setLookupErr(lang === 'es' ? 'Document ID no encontrado. Verifica e intenta de nuevo.' : 'Document ID not found. Please verify and try again.')
        return false
      }
      setCompany(data.company)
      return true
    } catch {
      setLookupErr(lang === 'es' ? 'Error de conexión. Intenta de nuevo.' : 'Connection error. Please try again.')
      return false
    } finally {
      setLookingUp(false)
    }
  }, [lang])

  useEffect(() => {
    const id = sp.get('id')
    const l  = sp.get('lang')
    if (l === 'es') setLang('es')
    if (id) { setDocInput(id); lookup(id) }
  }, [sp, lookup])

  useEffect(() => {
    if (company || docInput.length < 12) return
    const timer = setTimeout(() => { lookup(docInput) }, 600)
    return () => clearTimeout(timer)
  }, [docInput, company, lookup])

  useEffect(() => {
    if (company) {
      setForm(f => ({
        ...f,
        companyName: company.company_name ?? '',
        address:     company.address ?? '',
        city:        company.city ?? '',
        zip:         company.zip ?? '',
        email:       company.email ?? '',
      }))
    }
  }, [company])


  const [checkingOut, setCheckingOut] = useState(false)

  async function handleCheckout() {
    setCheckingOut(true)
    try {
      const svcMap: Record<string, string> = { labor_law: 'labor_law_poster', ein: 'ein', certificate: 'certificate_of_status' }
      const allThree = SERVICES.every(s => selected.has(s.id))
      const selected_services = allThree ? ['bundle'] : [...selected].map(id => svcMap[id])
      const res = await fetch('/api/sunbiz/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id:        company?.id ?? null,
          document_id:       docInput,
          company_name:      form.companyName,
          selected_services,
          lang,
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      // silent fail — user can retry
    } finally {
      setCheckingOut(false)
    }
  }

  function toggleService(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function setField(key: keyof typeof form, val: string | boolean) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function Tip({ en, es }: { en: string; es: string }) {
    return (
      <span className="tip-wrap">
        <span className="tip-icon">?</span>
        <span className="tip-box">{lang === 'es' ? es : en}</span>
      </span>
    )
  }

  function RadioGroup({ options, value, onChange }: {
    options: { value: string; label: string; sub?: string }[]
    value: string
    onChange: (v: string) => void
  }) {
    return (
      <div className="form-radio-group">
        {options.map(o => (
          <div key={o.value} className={`form-radio-row${value === o.value ? ' selected' : ''}`} onClick={() => onChange(o.value)}>
            <div className="form-radio-dot"><div className="form-radio-inner" /></div>
            <div>
              <div className="form-radio-text">{o.label}</div>
              {o.sub && <div className="form-radio-sub">{o.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  function YesNo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <div className="yn-group">
        <button className={`yn-btn yes${value === 'yes' ? ' active' : ''}`} onClick={() => onChange('yes')}>
          {lang === 'es' ? 'Sí' : 'Yes'}
        </button>
        <button className={`yn-btn no${value === 'no' ? ' active' : ''}`} onClick={() => onChange('no')}>
          No
        </button>
      </div>
    )
  }

  function getDesc(id: string) {
    if (id === 'labor_law') return lang === 'es'
      ? <><span className="svc-hl">La Ley de Florida requiere que todo negocio con al menos un empleado</span> muestre los avisos laborales vigentes. La tarifa mínima de Florida se actualiza cada año, por lo que tu póster debe mantenerse al día. Te entregamos un póster 2026 completamente actualizado, listo para colgar desde el primer día.</>
      : <><span className="svc-hl">Florida requires every business with at least one employee</span> to display current state and federal labor law notices in a visible location. Florida's minimum wage updates every year, so your poster must stay current to remain compliant. We provide a fully updated 2026 poster, ready to hang from day one.</>
    if (id === 'ein') return lang === 'es'
      ? <>Tu EIN es el número de identificación federal de tu negocio, emitido por el IRS y requerido para <span className="svc-hl">abrir una cuenta bancaria, contratar empleados, declarar impuestos y solicitar préstamos.</span> Sin él, la mayoría de los bancos no procesarán tu solicitud. Nosotros gestionamos todo el proceso para que lo recibas rápido y sin trámites.</>
      : <>Your EIN is your business's federal identification number, issued by the IRS and required to <span className="svc-hl">open a business bank account, hire employees, file taxes, and apply for loans.</span> Without it, most banks won't process your application. We handle the entire process so you receive it quickly and without the paperwork hassle.</>
    if (id === 'certificate') return lang === 'es'
      ? <>Este documento oficial del Departamento de Estado de Florida confirma que tu negocio está <span className="svc-hl">activo, autorizado para operar y al corriente con el estado.</span> Bancos, prestamistas y agencias gubernamentales lo solicitan al aplicar para financiamiento o abrir una cuenta comercial. Tenerlo listo significa sin demoras cuando llegue la oportunidad.</>
      : <>This official document from the Florida Department of State confirms that your business is <span className="svc-hl">active, authorized to operate, and in good standing with the state.</span> Banks, lenders, and government agencies commonly request it when you apply for financing or open a business account. Having it ready means no delays when opportunity comes knocking.</>
    return null
  }

  const einSelected   = selected.has('ein')
  const allSelected   = selected.size === SERVICES.length
  const subtotal      = SERVICES.filter(s => selected.has(s.id)).reduce((acc, s) => acc + s.price, 0)
  const discountAmt   = allSelected ? +(subtotal * 0.10).toFixed(2) : 0
  const total         = +(subtotal - discountAmt).toFixed(2)

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(SERVICES.map(s => s.id)))
  }

  const displayName = company?.company_name ?? 'SUNSHINE GLAZING LLC'

  const welcomeTitle = lang === 'es'
    ? <>¡Felicidades, <span>{displayName}!</span></>
    : <>Congratulations, <span>{displayName}!</span></>

  const welcomeSub = lang === 'es'
    ? 'Tu registro en el Estado de Florida ha sido exitoso. Estamos aquí para ayudarte a completar los pasos finales para que tu negocio sea plenamente operativo y cumpla con todas las normativas.'
    : 'Your registration with the State of Florida was successful. We are here to help you complete the final steps so your business is fully operational and compliant with all regulations.'

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', background: '#F1F5F9' }}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <header className="nb-header">
        <div className="nb-logo">
          <div className="nb-logo-mark">FL</div>
          <div className="nb-logo-text">
            <div className="l1">Florida Business Formation Center</div>
            <div className="l2">mybusinessformation.com</div>
          </div>
        </div>
        <div className="nb-header-right">
          <div className="nb-lang">
            {(['en', 'es'] as const).map(l => (
              <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <a href="tel:8001234567" className="nb-phone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.86 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            (800) 123-4567
          </a>
        </div>
      </header>

      <>
          {/* WELCOME — si llegó con ?id= (QR scan) */}
          {sp.get('id') && (
          <section className="nb-welcome">
            <div className="nb-welcome-inner">
              {lookingUp
                ? <h1 style={{ color:'#94a3b8' }}>{lang === 'es' ? 'Buscando tu empresa...' : 'Looking up your business...'}</h1>
                : <><h1>{welcomeTitle}</h1><p>{welcomeSub}</p></>
              }
            </div>
          </section>
          )}

          {/* ── SERVICES ── */}
          <section className="svc-section">
            <div className="svc-inner">
              <div className="svc-heading">
                <h2>{lang === 'es' ? 'Construye una Base Sólida' : 'Build a Strong Foundation'}</h2>
                <p>{lang === 'es'
                  ? 'Estos son los servicios principales incluidos en tu aviso para iniciar tu negocio protegido y sobre terreno sólido.'
                  : 'These are the core services included in your notice to start your business protected and on solid ground.'}</p>
              </div>

              <div className="svc-grid">
                {SERVICES.map(svc => {
                  const isSelected = selected.has(svc.id)
                  return (
                    <div
                      key={svc.id}
                      className={`svc-card${isSelected ? ' selected' : ''}`}
                      onClick={() => toggleService(svc.id)}
                    >
                      <div className="svc-title">{lang === 'es' ? svc.titleEs : svc.titleEn}</div>
                      <div className="svc-desc">{getDesc(svc.id)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── FORM + CHECKOUT ── */}
          <section className="form-section">
            <div className="form-inner">
              <div className="form-body">
                {/* ── LEFT: STEP FORM ── */}
                <div className="form-left" ref={formRef}>
                  {/* Heading — solo en step 1 */}
                  {step === 1 && (
                  <div className="form-heading">
                    <h2>
                      {lang === 'es'
                        ? `Completa tu información en ${einSelected ? '3' : '2'} simples pasos`
                        : `Complete your information in ${einSelected ? '3' : '2'} simple steps`}
                    </h2>
                  </div>
                  )}

                  {/* Step indicator */}
                  <div className="steps-bar">
                    {/* Step 1 */}
                    <div className="step-node">
                      <div className={`step-circle ${doneSteps.has(1) || step > 1 ? 'done' : step === 1 ? 'active' : 'pending'}`}>
                        {doneSteps.has(1) || step > 1
                          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : '1'}
                      </div>
                      <span className={`step-lbl ${step === 1 ? 'active' : doneSteps.has(1) || step > 1 ? 'done' : ''}`}>
                        {lang === 'es' ? 'Negocio' : 'Business'}
                      </span>
                    </div>
                    <div className={`step-connector ${doneSteps.has(1) || step > 1 ? 'done' : ''}`} />

                    {/* Step 2 */}
                    <div className="step-node">
                      <div className={`step-circle ${doneSteps.has(2) || step > 2 ? 'done' : step === 2 ? 'active' : 'pending'}`}>
                        {doneSteps.has(2) || step > 2
                          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : '2'}
                      </div>
                      <span className={`step-lbl ${step === 2 ? 'active' : doneSteps.has(2) || step > 2 ? 'done' : ''}`}>
                        {lang === 'es' ? 'Contacto' : 'Contact'}
                      </span>
                    </div>

                    {/* Step 3 — only if EIN selected */}
                    {einSelected && (
                      <>
                        <div className={`step-connector ${doneSteps.has(2) || step > 2 ? 'done' : ''}`} />
                        <div className="step-node">
                          <div className={`step-circle ${form.einReason ? 'done' : step === 3 ? 'active' : 'pending'}`}>
                            {form.einReason
                              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : '3'}
                          </div>
                          <span className={`step-lbl ${form.einReason ? 'done' : step === 3 ? 'active' : ''}`}>EIN</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── STEP 1: Business info ── */}
                  {step === 1 && (
                    <>
                      <div className="form-block-title">
                        {lang === 'es' ? 'Información del negocio' : 'Business information'}
                      </div>
                      <div className="form-grid">
                        {/* Document ID lookup */}
                        <div className="form-field span2">
                          <label className="form-label">
                            Document ID
                            <Tip
                              en="Your Florida business Document ID. Found on your state registration notice."
                              es="El Document ID de tu negocio en Florida. Aparece en tu aviso de registro estatal."
                            />
                          </label>
                          <input
                            className={`form-input${lookupErr ? ' err' : ''}`}
                            value={docInput}
                            onChange={e => { setDocInput(e.target.value.toUpperCase()); setLookupErr('') }}
                            placeholder="e.g. L26000098321"
                            readOnly={!!company}
                            style={company ? { background:'#f1f5f9', color:'#64748b' } : {}}
                          />
                          {lookupErr && !sp.get('id') && <p style={{ color:'#ef4444', fontSize:'.75rem', marginTop:4 }}>⚠ {lookupErr}</p>}
                          {company && <p style={{ color:'#16a34a', fontSize:'.75rem', marginTop:4 }}>✓ {company.company_name}</p>}
                        </div>

                        {/* Business name */}
                        <div className="form-field span2">
                          <label className="form-label">
                            {lang === 'es' ? 'Nombre del negocio' : 'Business name'}
                          </label>
                          <input
                            className="form-input"
                            value={form.companyName}
                            onChange={e => !company && setField('companyName', e.target.value)}
                            readOnly={!!company}
                            style={company ? { background:'#f1f5f9', color:'#64748b' } : {}}
                            placeholder={lang === 'es' ? 'Nombre de tu empresa' : 'Your business name'}
                          />
                        </div>

                        {/* Address */}
                        <div className="form-field span2">
                          <label className="form-label">{lang === 'es' ? 'Dirección' : 'Street address'}<span className="req">*</span></label>
                          <input
                            className="form-input"
                            value={form.address}
                            onChange={e => setField('address', e.target.value)}
                            placeholder={lang === 'es' ? 'Calle y número' : 'Street address'}
                          />
                        </div>

                        {/* City */}
                        <div className="form-field">
                          <label className="form-label">{lang === 'es' ? 'Ciudad' : 'City'}<span className="req">*</span></label>
                          <input
                            className="form-input"
                            value={form.city}
                            onChange={e => setField('city', e.target.value)}
                            placeholder="Miami"
                          />
                        </div>

                        {/* ZIP */}
                        <div className="form-field">
                          <label className="form-label">ZIP Code<span className="req">*</span></label>
                          <input
                            className="form-input"
                            value={form.zip}
                            onChange={e => setField('zip', e.target.value)}
                            placeholder="33101"
                          />
                        </div>

                        {/* LLC Start Date */}
                        <div className="form-field">
                          <label className="form-label">
                            {lang === 'es' ? 'Mes de inicio de la LLC' : 'LLC start month'}
                            <Tip
                              en="The month your LLC became active in Florida. Found on your registration certificate."
                              es="El mes en que tu LLC quedó activa en Florida. Aparece en tu certificado de registro."
                            />
                          </label>
                          <select
                            className="form-input"
                            value={form.llcStartMonth}
                            onChange={e => setField('llcStartMonth', e.target.value)}
                          >
                            <option value="">{lang === 'es' ? 'Selecciona mes' : 'Select month'}</option>
                            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                              <option key={m} value={String(i + 1).padStart(2,'0')}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-field">
                          <label className="form-label">
                            {lang === 'es' ? 'Año de inicio' : 'LLC start year'}
                          </label>
                          <input
                            className="form-input"
                            value={form.llcStartYear}
                            onChange={e => setField('llcStartYear', e.target.value)}
                            placeholder="2024"
                            maxLength={4}
                          />
                        </div>

                        {/* Business description */}
                        <div className="form-field span2">
                          <label className="form-label">
                            {lang === 'es' ? '¿A qué se dedica el negocio?' : 'What does your business do?'}
                            <Tip
                              en="Briefly describe your main business activity. Example: 'Residential painting contractor' or 'Online retail of handmade jewelry'."
                              es="Describe brevemente la actividad principal del negocio. Ejemplo: 'Contratista de pintura residencial' o 'Venta online de joyería artesanal'."
                            />
                            <span className="req">*</span>
                          </label>
                          <textarea
                            className="form-textarea"
                            value={form.businessDescription}
                            onChange={e => setField('businessDescription', e.target.value)}
                            placeholder={lang === 'es'
                              ? 'ej. Empresa de construcción y remodelación residencial en Miami-Dade'
                              : 'e.g. Residential construction and remodeling company in Miami-Dade'}
                            rows={3}
                          />
                        </div>

                        {/* Shipping address toggle */}
                        <div className="form-field span2">
                          <div className="ship-toggle" onClick={() => { setField('differentShipping', !form.differentShipping); if (!form.differentShipping) setTimeout(() => shipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }}>
                            <div className={`ship-check${form.differentShipping ? ' on' : ''}`}>
                              {form.differentShipping && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              )}
                            </div>
                            {lang === 'es' ? 'Enviar documentos a una dirección diferente' : 'Ship documents to a different address'}
                          </div>
                        </div>

                        {form.differentShipping && (
                          <>
                            <div className="form-field span2" ref={shipRef}>
                              <label className="form-label">{lang === 'es' ? 'Dirección de envío' : 'Shipping address'}</label>
                              <input
                                className="form-input"
                                value={form.shipAddress}
                                onChange={e => setField('shipAddress', e.target.value)}
                                placeholder={lang === 'es' ? 'Calle y número' : 'Street address'}
                              />
                            </div>
                            <div className="form-field">
                              <label className="form-label">{lang === 'es' ? 'Ciudad' : 'City'}</label>
                              <input
                                className="form-input"
                                value={form.shipCity}
                                onChange={e => setField('shipCity', e.target.value)}
                                placeholder="Miami"
                              />
                            </div>
                            <div className="form-field">
                              <label className="form-label">ZIP Code</label>
                              <input
                                className="form-input"
                                value={form.shipZip}
                                onChange={e => setField('shipZip', e.target.value)}
                                placeholder="33101"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="step-nav">
                        <span />
                        <button className="step-next" onClick={() => goToStep(2)}>
                          {lang === 'es' ? 'Siguiente' : 'Next'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── STEP 2: Contact info ── */}
                  {step === 2 && (
                    <>
                      <div className="form-block-title">
                        {lang === 'es' ? 'Persona Responsable' : 'Responsible Party'}
                      </div>
                      <div className="form-grid">
                        {/* First name */}
                        <div className="form-field">
                          <label className="form-label">{lang === 'es' ? 'Nombre' : 'First name'}<span className="req">*</span></label>
                          <input
                            className="form-input"
                            value={form.firstName}
                            onChange={e => setField('firstName', e.target.value)}
                            placeholder={lang === 'es' ? 'Juan' : 'John'}
                          />
                        </div>

                        {/* Middle initial */}
                        <div className="form-field" style={{ maxWidth: 100 }}>
                          <label className="form-label">{lang === 'es' ? 'Inicial' : 'M.I.'}</label>
                          <input
                            className="form-input"
                            value={form.middleInitial}
                            onChange={e => setField('middleInitial', e.target.value.slice(0,1).toUpperCase())}
                            placeholder="A"
                            maxLength={1}
                          />
                        </div>

                        {/* Last name */}
                        <div className="form-field">
                          <label className="form-label">{lang === 'es' ? 'Apellido' : 'Last name'}<span className="req">*</span></label>
                          <input
                            className="form-input"
                            value={form.lastName}
                            onChange={e => setField('lastName', e.target.value)}
                            placeholder={lang === 'es' ? 'García' : 'Smith'}
                          />
                        </div>

                        {/* Suffix */}
                        <div className="form-field" style={{ maxWidth: 130 }}>
                          <label className="form-label">Suffix</label>
                          <select className="form-input" value={form.suffix} onChange={e => setField('suffix', e.target.value)}>
                            <option value="">—</option>
                            <option>Jr.</option>
                            <option>Sr.</option>
                            <option>II</option>
                            <option>III</option>
                            <option>IV</option>
                          </select>
                        </div>

                        {/* Email */}
                        <div className="form-field">
                          <label className="form-label">Email<span className="req">*</span></label>
                          <input
                            className="form-input"
                            type="email"
                            value={form.email}
                            onChange={e => setField('email', e.target.value)}
                            placeholder="email@example.com"
                          />
                        </div>

                        {/* Phone */}
                        <div className="form-field">
                          <label className="form-label">{lang === 'es' ? 'Teléfono' : 'Phone'}<span className="req">*</span></label>
                          <input
                            className="form-input"
                            type="tel"
                            value={form.phone}
                            onChange={e => setField('phone', e.target.value)}
                            placeholder="(305) 000-0000"
                          />
                        </div>

                        {/* SSN / ITIN — only needed when EIN is selected */}
                        {einSelected && <div className="form-field">
                          <label className="form-label">
                            SSN / ITIN
                            <Tip
                              en="Your Social Security Number (SSN) or Individual Taxpayer Identification Number (ITIN). Required by the IRS to verify identity. Transmitted securely and never stored on our servers."
                              es="Tu Número de Seguro Social (SSN) o Número de Identificación Personal del Contribuyente (ITIN). Requerido por el IRS para verificar identidad. Se transmite de forma segura y nunca se almacena en nuestros servidores."
                            />
                            <span className="req">*</span>
                          </label>
                          <div style={{ position:'relative' }}>
                            <input
                              className="form-input"
                              type={showSsn ? 'text' : 'password'}
                              value={form.ssnItin}
                              onChange={e => setField('ssnItin', e.target.value)}
                              placeholder="XXX-XX-XXXX"
                              style={{ paddingRight: 44 }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowSsn(v => !v)}
                              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:4, lineHeight:1 }}
                              title={showSsn ? (lang === 'es' ? 'Ocultar' : 'Hide') : (lang === 'es' ? 'Mostrar' : 'Show')}
                            >
                              {showSsn
                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              }
                            </button>
                          </div>
                        </div>}

                        {einSelected && <div className="form-field">
                          <label className="form-label">
                            {lang === 'es' ? 'Confirmar SSN / ITIN' : 'Confirm SSN / ITIN'}
                            <span className="req">*</span>
                          </label>
                          <div style={{ position:'relative' }}>
                            <input
                              className="form-input"
                              type={showSsn ? 'text' : 'password'}
                              value={form.ssnItinConfirm}
                              onChange={e => setField('ssnItinConfirm', e.target.value)}
                              placeholder="XXX-XX-XXXX"
                              style={{
                                paddingRight: 44,
                                borderColor: form.ssnItinConfirm
                                  ? (form.ssnItin === form.ssnItinConfirm ? '#22c55e' : '#ef4444')
                                  : undefined,
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowSsn(v => !v)}
                              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:4, lineHeight:1 }}
                            >
                              {showSsn
                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              }
                            </button>
                          </div>
                          {form.ssnItinConfirm && form.ssnItin !== form.ssnItinConfirm && (
                            <span className="form-hint" style={{ color:'#ef4444' }}>
                              {lang === 'es' ? 'Los números no coinciden.' : 'Numbers do not match.'}
                            </span>
                          )}
                          {form.ssnItinConfirm && form.ssnItin === form.ssnItinConfirm && (
                            <span className="form-hint" style={{ color:'#22c55e' }}>
                              {lang === 'es' ? 'Confirmado.' : 'Confirmed.'}
                            </span>
                          )}
                          <span className="form-hint">
                            {lang === 'es'
                              ? 'Requerido por el IRS. Transmitido de forma cifrada.'
                              : 'Required by the IRS. Transmitted encrypted.'}
                          </span>
                        </div>}
                      </div>

                      <div className="step-nav">
                        <button className="step-back" onClick={() => goToStep(1)}>
                          ← {lang === 'es' ? 'Atrás' : 'Back'}
                        </button>
                        {einSelected ? (
                          <button className="step-next" onClick={() => goToStep(3)}>
                            {lang === 'es' ? 'Siguiente' : 'Next'}
                          </button>
                        ) : (
                          <button className="step-next primary" onClick={() => goToStep(4)}>
                            {lang === 'es' ? 'Revisar Orden' : 'Review Order'}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── STEP 3: EIN info (only if EIN selected) ── */}
                  {step === 3 && einSelected && (
                    <>
                      <div className="form-block-title" style={{ color:'#2563EB' }}>
                        EIN / Tax ID — {lang === 'es' ? 'Información adicional requerida por el IRS' : 'Additional information required by the IRS'}
                      </div>
                      <div className="form-grid">

                        {/* Reason for applying */}
                        <div className="form-field span2">
                          <label className="form-label">
                            {lang === 'es' ? 'Razón para solicitar el EIN' : 'Reason for applying'}
                            <Tip
                              en="Select the reason that best describes why you need an EIN. Most new LLCs select 'Started a new business'."
                              es="Selecciona la razón que mejor describe por qué necesitas un EIN. La mayoría de LLCs nuevas selecciona 'Inicié un nuevo negocio'."
                            />
                            <span className="req">*</span>
                          </label>
                          <RadioGroup
                            value={form.einReason}
                            onChange={v => setField('einReason', v)}
                            options={[
                              {
                                value: 'started_business',
                                label: lang === 'es' ? 'Inicié un nuevo negocio' : 'Started a new business',
                              },
                              {
                                value: 'hired_employees',
                                label: lang === 'es' ? 'Contraté empleados' : 'Hired employees',
                              },
                              {
                                value: 'banking',
                                label: lang === 'es' ? 'Abrir cuenta bancaria empresarial' : 'Open a business bank account',
                              },
                              {
                                value: 'other',
                                label: lang === 'es' ? 'Otra razón' : 'Other reason',
                              },
                            ]}
                          />
                        </div>

                        {/* IRS compliance questions — W-2 included */}
                        <div className="form-field span2">
                          <label className="form-label" style={{ marginBottom: 8 }}>
                            {lang === 'es' ? 'Preguntas de cumplimiento del IRS' : 'IRS compliance questions'}
                            <Tip
                              en="These questions are required by the IRS SS-4 form. Most standard businesses answer No to all of them. We have pre-filled them for you — adjust only if applicable."
                              es="Estas preguntas son requeridas por el formulario IRS SS-4. La mayoría de negocios normales responde No a todas. Las hemos pre-llenado — ajusta solo si aplica."
                            />
                          </label>
                          <div className="compliance-block">
                            <div className="compliance-row">
                              <span className="compliance-q">
                                {lang === 'es' ? '¿Tiene o tendrá empleados con formulario W-2?' : 'Do you have or expect to have W-2 employees?'}
                                <Tip
                                  en="W-2 employees are workers on your payroll who receive a W-2 tax form at year-end. This does not include independent contractors (1099)."
                                  es="Los empleados W-2 son trabajadores en tu nómina que reciben el formulario W-2 al cierre del año. No incluye contratistas independientes (1099)."
                                />
                              </span>
                              <YesNo value={form.hasW2} onChange={v => setField('hasW2', v)} />
                            </div>
                            <div className="compliance-row">
                              <span className="compliance-q">
                                {lang === 'es'
                                  ? '¿Opera vehículos de carretera con peso bruto de 55,000+ lbs?'
                                  : 'Highway motor vehicles with 55,000+ lbs gross weight?'}
                                <Tip
                                  en="Applies if your business operates heavy trucks or commercial vehicles used for interstate transport weighing 55,000 lbs or more."
                                  es="Aplica si tu negocio opera camiones pesados o vehículos comerciales para transporte interestatal con peso de 55,000 lbs o más."
                                />
                              </span>
                              <YesNo value={form.hasHighwayVehicle} onChange={v => setField('hasHighwayVehicle', v)} />
                            </div>
                            <div className="compliance-row">
                              <span className="compliance-q">
                                {lang === 'es'
                                  ? '¿Involucra el negocio juegos de azar (gambling)?'
                                  : 'Does the business involve gambling or wagering?'}
                                <Tip
                                  en="Applies to casinos, sports betting, lottery operations, or any business that accepts wagers from the public."
                                  es="Aplica a casinos, apuestas deportivas, loterías o cualquier negocio que acepte apuestas del público."
                                />
                              </span>
                              <YesNo value={form.hasGambling} onChange={v => setField('hasGambling', v)} />
                            </div>
                            <div className="compliance-row">
                              <span className="compliance-q">
                                {lang === 'es'
                                  ? '¿Deberá presentar el formulario 720 (impuestos especiales)?'
                                  : 'Required to file Form 720 (federal excise taxes)?'}
                                <Tip
                                  en="Form 720 covers federal excise taxes on specific goods/services like fuel, indoor tanning, or certain imported goods. Most businesses are not subject to this."
                                  es="El formulario 720 cubre impuestos especiales federales sobre bienes/servicios específicos como combustible, bronceado o ciertos productos importados. La mayoría de negocios no aplica."
                                />
                              </span>
                              <YesNo value={form.hasForm720} onChange={v => setField('hasForm720', v)} />
                            </div>
                            <div className="compliance-row">
                              <span className="compliance-q">
                                {lang === 'es'
                                  ? '¿Involucra alcohol, tabaco o armas de fuego?'
                                  : 'Involves alcohol, tobacco, or firearms?'}
                                <Tip
                                  en="Applies to businesses that manufacture, sell, or distribute alcohol, tobacco products, or firearms. Requires additional federal licensing."
                                  es="Aplica a negocios que fabrican, venden o distribuyen alcohol, tabaco o armas de fuego. Requiere licencias federales adicionales."
                                />
                              </span>
                              <YesNo value={form.hasAlcohol} onChange={v => setField('hasAlcohol', v)} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="step-nav">
                        <button className="step-back" onClick={() => goToStep(2)}>
                          ← {lang === 'es' ? 'Atrás' : 'Back'}
                        </button>
                        <button className="step-next primary" onClick={() => goToStep(4)}>
                          {lang === 'es' ? 'Revisar Orden' : 'Review Order'}
                        </button>
                      </div>
                    </>
                  )}
                  {/* ── STEP 4: Review ── */}
                  {step === 4 && (
                    <>
                      <div className="form-block-title">{lang === 'es' ? 'Revisa tu información' : 'Review your information'}</div>

                      {/* Business info */}
                      <div style={{ marginBottom:12, background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <span style={{ fontSize:'.78rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{lang === 'es' ? 'Negocio' : 'Business'}</span>
                          <button onClick={() => setStep(1)} style={{ background:'none', border:'1px solid #2563EB', borderRadius:6, color:'#2563EB', fontSize:'.72rem', fontWeight:600, padding:'3px 10px', cursor:'pointer', fontFamily:'inherit' }}>{lang === 'es' ? 'Editar' : 'Edit'}</button>
                        </div>
                        {([
                          [lang === 'es' ? 'Nombre' : 'Business name', form.companyName],
                          [lang === 'es' ? 'Dirección' : 'Address', form.address],
                          [lang === 'es' ? 'Ciudad' : 'City', form.city],
                          ['ZIP', form.zip],
                          [lang === 'es' ? 'Inicio LLC' : 'LLC start', [form.llcStartMonth, form.llcStartYear].filter(Boolean).join(' / ')],
                          [lang === 'es' ? 'Descripción' : 'Description', form.businessDescription],
                        ] as [string,string][]).filter(([,v]) => v).map(([label, val]) => (
                          <div key={label} style={{ display:'flex', gap:8, padding:'4px 0', borderTop:'1px solid #f1f5f9', fontSize:'.83rem' }}>
                            <span style={{ color:'#94a3b8', minWidth:100 }}>{label}</span>
                            <span style={{ color:'#1B3A6B', fontWeight:500 }}>{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Contact */}
                      <div style={{ marginBottom:12, background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <span style={{ fontSize:'.78rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{lang === 'es' ? 'Contacto' : 'Contact'}</span>
                          <button onClick={() => setStep(2)} style={{ background:'none', border:'1px solid #2563EB', borderRadius:6, color:'#2563EB', fontSize:'.72rem', fontWeight:600, padding:'3px 10px', cursor:'pointer', fontFamily:'inherit' }}>{lang === 'es' ? 'Editar' : 'Edit'}</button>
                        </div>
                        {([
                          [lang === 'es' ? 'Nombre' : 'Name', [form.firstName, form.middleInitial, form.lastName, form.suffix].filter(Boolean).join(' ')],
                          ['Email', form.email],
                          [lang === 'es' ? 'Teléfono' : 'Phone', form.phone],
                        ] as [string,string][]).filter(([,v]) => v).map(([label, val]) => (
                          <div key={label} style={{ display:'flex', gap:8, padding:'4px 0', borderTop:'1px solid #f1f5f9', fontSize:'.83rem' }}>
                            <span style={{ color:'#94a3b8', minWidth:100 }}>{label}</span>
                            <span style={{ color:'#1B3A6B', fontWeight:500 }}>{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* EIN */}
                      {einSelected && (
                        <div style={{ marginBottom:12, background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                            <span style={{ fontSize:'.78rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>EIN / Tax ID</span>
                            <button onClick={() => setStep(3)} style={{ background:'none', border:'1px solid #2563EB', borderRadius:6, color:'#2563EB', fontSize:'.72rem', fontWeight:600, padding:'3px 10px', cursor:'pointer', fontFamily:'inherit' }}>{lang === 'es' ? 'Editar' : 'Edit'}</button>
                          </div>
                          {form.einReason && (
                            <div style={{ display:'flex', gap:8, padding:'4px 0', borderTop:'1px solid #f1f5f9', fontSize:'.83rem' }}>
                              <span style={{ color:'#94a3b8', minWidth:100 }}>{lang === 'es' ? 'Razón' : 'Reason'}</span>
                              <span style={{ color:'#1B3A6B', fontWeight:500 }}>{form.einReason.replace(/_/g,' ')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="step-nav" style={{ marginTop:8 }}>
                        <button className="step-back" onClick={() => goToStep(einSelected ? 3 : 2)}>
                          ← {lang === 'es' ? 'Atrás' : 'Back'}
                        </button>
                        <button className="step-next primary" onClick={handleCheckout} disabled={checkingOut}>
                          {checkingOut ? '...' : (lang === 'es' ? 'Proceder al Pago' : 'Proceed to Checkout')}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* ── RIGHT: CHECKOUT BOX ── */}
                <div className="co-box">
                  <div className="co-title">{lang === 'es' ? 'Resumen de Orden' : 'Order Summary'}</div>

                  {/* Select All row */}
                  <div
                    style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, cursor:'pointer' }}
                    onClick={toggleAll}
                  >
                    <div style={{
                      width:20, height:20, borderRadius:5,
                      border: allSelected ? 'none' : '2px solid #cbd5e1',
                      background: allSelected ? '#2563EB' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      transition:'all .2s'
                    }}>
                      {allSelected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'.82rem', fontWeight:700, color:'#1B3A6B' }}>
                        {lang === 'es' ? 'Seleccionar todo' : 'Select all'}
                      </div>
                      <div style={{ fontSize:'.7rem', color: allSelected ? '#16a34a' : '#f59e0b', fontWeight:600, marginTop:1 }}>
                        {allSelected
                          ? (lang === 'es' ? `Ahorrando $${discountAmt.toFixed(2)} con el bundle` : `Saving $${discountAmt.toFixed(2)} with the bundle`)
                          : (lang === 'es' ? 'Selecciona los 3 y ahorra un 10%' : 'Select all 3 and save 10%')}
                      </div>
                    </div>
                    <span style={{ fontSize:'.75rem', fontWeight:600, color:'#64748b' }}>
                      {lang === 'es' ? 'Precio' : 'Price'}
                    </span>
                  </div>

                  <div className="co-divider" style={{ marginTop:0 }} />

                  {/* Service lines — always show all, toggle checked state */}
                  {SERVICES.map(svc => {
                    const isOn = selected.has(svc.id)
                    return (
                      <div key={svc.id} className="co-line" style={{ alignItems:'center', gap:8 }}>
                        <div
                          style={{
                            width:18, height:18, borderRadius:4,
                            background: isOn ? '#2563EB' : 'transparent',
                            border: isOn ? 'none' : '2px solid #cbd5e1',
                            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer',
                            transition:'all .2s'
                          }}
                          onClick={() => toggleService(svc.id)}
                        >
                          {isOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span className="co-line-name">{lang === 'es' ? svc.titleEs : svc.titleEn}</span>
                        <span className="co-line-price" style={{ color: isOn ? '#1B3A6B' : '#e2e8f0' }}>${svc.price.toFixed(2)}</span>
                      </div>
                    )
                  })}

                  <div className="co-divider" />

                  {/* 10% bundle discount */}
                  {allSelected && (
                    <div className="co-savings">
                      <span>10% {lang === 'es' ? 'Descuento Bundle' : 'Bundle Discount'}</span>
                      <span>−${discountAmt.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="co-total">
                    <span className="co-total-label">Total</span>
                    <span className="co-total-amount">
                      ${total.toFixed(2)}<span>USD</span>
                    </span>
                  </div>

                  <div className="co-trust">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    {lang === 'es' ? 'Pago 100% seguro con Stripe' : '100% secure payment with Stripe'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="disclosure">
            <div className="disclosure-links">
              <button onClick={() => setModal('terms')}>
                {lang === 'es' ? 'Términos y Condiciones' : 'Terms & Conditions'}
              </button>
              <span>•</span>
              <button onClick={() => setModal('privacy')}>
                {lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
              </button>
              <span>•</span>
              <button onClick={() => setModal('legal')}>
                {lang === 'es' ? 'Aviso Legal' : 'Legal Disclaimer'}
              </button>
            </div>
            Florida Business Formation Center is a privately owned third-party document preparation service and is not affiliated with or endorsed by any government agency,
            including the IRS, Department of Labor, or Florida Department of State. This is a solicitation for services, not an official government notice. Fees include
            administrative and processing costs. All sales are final and non-refundable. Business registration data is sourced from public records.
          </div>

          {modal && (
            <div className="legal-overlay" onClick={() => setModal(null)}>
              <div className="legal-modal" onClick={e => e.stopPropagation()}>
                <div className="legal-modal-header">
                  <div className="legal-modal-title">
                    {modal === 'terms' && (lang === 'es' ? 'Términos y Condiciones' : 'Terms & Conditions')}
                    {modal === 'privacy' && (lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy')}
                    {modal === 'legal' && (lang === 'es' ? 'Aviso Legal' : 'Legal Disclaimer')}
                  </div>
                  <button className="legal-close" onClick={() => setModal(null)}>×</button>
                </div>
                <div className="legal-modal-body">

                  {modal === 'terms' && <>
                    <div className="legal-updated">{lang === 'es' ? 'Última actualización: 1 de enero de 2025' : 'Last Updated: January 1, 2025'}</div>
                    <div className="legal-warn">⚠ {lang === 'es' ? <><strong>No somos un bufete:</strong> Florida Business Formation Center es un servicio de preparación de documentos. No brindamos asesoría legal, fiscal ni financiera.</> : <><strong>Not a Law Firm:</strong> Florida Business Formation Center is a document preparation and filing service. We do not provide legal, tax, or financial advice.</>}</div>
                    <div className="legal-section">
                      <h3>1. {lang === 'es' ? 'Aceptación de Términos' : 'Acceptance of Terms'}</h3>
                      <p>{lang === 'es' ? 'Al acceder o utilizar los servicios de Florida Business Formation Center, usted acepta quedar sujeto a estos Términos y Condiciones. Nos reservamos el derecho de modificarlos en cualquier momento.' : 'By accessing or using the services of Florida Business Formation Center, you agree to be fully bound by these Terms and Conditions. We reserve the right to modify these Terms at any time.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>2. {lang === 'es' ? 'Descripción de Servicios' : 'Description of Services'}</h3>
                      <p>{lang === 'es' ? 'Florida Business Formation Center proporciona servicios de preparación y presentación de documentos, incluyendo:' : 'Florida Business Formation Center provides document preparation and filing services, including:'}</p>
                      <ul>
                        <li>{lang === 'es' ? 'Formación de LLC y Corporación ante la División de Corporaciones de Florida' : 'LLC and Corporation formation filing with the Florida Division of Corporations'}</li>
                        <li>{lang === 'es' ? 'Asistencia para solicitud de EIN (Número de Identificación del Empleador)' : 'EIN (Employer Identification Number) application assistance'}</li>
                        <li>{lang === 'es' ? 'Preparación del Acuerdo Operativo' : 'Operating Agreement preparation'}</li>
                        <li>{lang === 'es' ? 'Servicio de Agente Registrado' : 'Registered Agent service'}</li>
                        <li>{lang === 'es' ? 'Asistencia para solicitud de ITIN' : 'ITIN application assistance'}</li>
                      </ul>
                    </div>
                    <div className="legal-section">
                      <h3>3. {lang === 'es' ? 'Responsabilidades del Cliente' : 'Client Responsibilities'}</h3>
                      <p>{lang === 'es' ? 'Al utilizar nuestros servicios, usted garantiza que toda la información que proporciona es precisa, completa y veraz. Debe tener al menos 18 años de edad y la autoridad legal para celebrar este acuerdo.' : 'By using our services, you warrant that all information you provide is accurate, complete, and truthful. You must be at least 18 years of age and have the legal authority to enter into this agreement.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>4. {lang === 'es' ? 'Tarifas y Pagos' : 'Fees & Payments'}</h3>
                      <p>{lang === 'es' ? 'Nuestras tarifas de servicio se muestran claramente durante el proceso de pedido. Las tarifas estatales de Florida son independientes de nuestras tarifas y se pagan directamente al Estado.' : 'Our service fees are clearly displayed during the order process. Florida state filing fees are separate and paid directly to the State of Florida.'}</p>
                      <div className="legal-warn">⚠ {lang === 'es' ? 'Las ventas son finales y no reembolsables una vez que los documentos han sido preparados o enviados.' : 'All sales are final and non-refundable once documents have been prepared or submitted.'}</div>
                    </div>
                    <div className="legal-section">
                      <h3>5. {lang === 'es' ? 'Tiempos de Procesamiento' : 'Processing Times'}</h3>
                      <p>{lang === 'es' ? 'Los tiempos de procesamiento son estimados y no están garantizados. Dependen del volumen actual de la División de Corporaciones de Florida y están fuera de nuestro control.' : 'Processing times are estimates only and are not guaranteed. These timeframes are subject to the Florida Division of Corporations\' current processing volume and are beyond our control.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>6. {lang === 'es' ? 'Limitación de Responsabilidad' : 'Limitation of Liability'}</h3>
                      <p>{lang === 'es' ? 'En la máxima medida permitida por la ley, Florida Business Formation Center no será responsable por daños indirectos, incidentales o consecuentes. Nuestra responsabilidad total no excederá el monto de las tarifas pagadas por usted.' : 'To the maximum extent permitted by law, Florida Business Formation Center shall not be liable for any indirect, incidental, or consequential damages. Our total liability shall not exceed the total service fees paid by you.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>7. {lang === 'es' ? 'Ley Aplicable' : 'Governing Law'}</h3>
                      <p>{lang === 'es' ? 'Estos Términos se regirán por las leyes del Estado de Florida. Cualquier disputa estará sujeta a la jurisdicción de los tribunales del Condado de Miami-Dade, Florida.' : 'These Terms shall be governed by the laws of the State of Florida. Any disputes shall be subject to the jurisdiction of courts in Miami-Dade County, Florida.'}</p>
                    </div>
                  </>}

                  {modal === 'privacy' && <>
                    <div className="legal-updated">{lang === 'es' ? 'Última actualización: 1 de enero de 2025' : 'Last Updated: January 1, 2025'}</div>
                    <div className="legal-section">
                      <h3>1. {lang === 'es' ? 'Información que Recopilamos' : 'Information We Collect'}</h3>
                      <p>{lang === 'es' ? 'Recopilamos información que usted proporciona directamente, incluyendo:' : 'We collect information you provide directly when you use our services, including:'}</p>
                      <ul>
                        <li>{lang === 'es' ? 'Nombre legal completo, dirección, correo electrónico y teléfono' : 'Full legal name, address, email address, and phone number'}</li>
                        <li>{lang === 'es' ? 'Información empresarial (nombre, dirección, estructura de propiedad)' : 'Business information (name, address, purpose, ownership structure)'}</li>
                        <li>{lang === 'es' ? 'Número de Seguro Social o ITIN (requerido para solicitudes de EIN e ITIN)' : 'Social Security Number or ITIN (required for EIN and ITIN applications)'}</li>
                        <li>{lang === 'es' ? 'Información de pago (procesada de forma segura; no almacenamos números de tarjeta)' : 'Payment information (processed securely — we do not store card numbers)'}</li>
                      </ul>
                    </div>
                    <div className="legal-section">
                      <h3>2. {lang === 'es' ? 'Cómo Usamos Su Información' : 'How We Use Your Information'}</h3>
                      <ul>
                        <li>{lang === 'es' ? 'Preparar y presentar sus documentos de formación ante la División de Corporaciones de Florida' : 'Prepare and file your business formation documents with the Florida Division of Corporations'}</li>
                        <li>{lang === 'es' ? 'Enviar solicitudes de EIN, ITIN y otras al IRS en su nombre' : 'Submit EIN, ITIN, and other applications to the IRS on your behalf'}</li>
                        <li>{lang === 'es' ? 'Comunicarnos con usted sobre el estado de su pedido' : 'Communicate with you about your order status and service updates'}</li>
                        <li>{lang === 'es' ? 'Cumplir con requisitos legales y regulatorios' : 'Comply with legal and regulatory requirements'}</li>
                      </ul>
                      <p>{lang === 'es' ? 'No vendemos su información personal a terceros con fines de marketing.' : 'We do not sell your personal information to third parties for marketing purposes.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>3. {lang === 'es' ? 'Compartir Su Información' : 'Sharing Your Information'}</h3>
                      <p>{lang === 'es' ? 'Solo compartimos su información con:' : 'We only share your information with:'}</p>
                      <ul>
                        <li>{lang === 'es' ? 'División de Corporaciones de Florida — para presentar sus documentos' : 'Florida Division of Corporations — to file your formation documents'}</li>
                        <li>{lang === 'es' ? 'IRS — para solicitudes de EIN e ITIN' : 'Internal Revenue Service (IRS) — for EIN and ITIN applications'}</li>
                        <li>{lang === 'es' ? 'Procesadores de pago — para procesar sus pagos de forma segura' : 'Payment processors — to securely process your payments'}</li>
                        <li>{lang === 'es' ? 'Autoridades — cuando lo exija la ley' : 'Legal authorities — when required by law or court order'}</li>
                      </ul>
                    </div>
                    <div className="legal-section">
                      <h3>4. {lang === 'es' ? 'Seguridad de Datos' : 'Data Security'}</h3>
                      <p>{lang === 'es' ? 'Implementamos cifrado SSL y controles de acceso restringidos. Sin embargo, ningún método de transmisión por Internet es 100% seguro. Conservamos su información solo durante el tiempo necesario.' : 'We implement SSL encryption and restricted access controls. However, no method of transmission over the Internet is 100% secure. We retain your information only as long as necessary to fulfill the services requested.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>5. {lang === 'es' ? 'Sus Derechos' : 'Your Rights'}</h3>
                      <p>{lang === 'es' ? 'Usted tiene derecho a acceder, corregir o solicitar la eliminación de sus datos personales. Para ejercer estos derechos, contáctenos en' : 'You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact us at'} <strong>info@mybusinessformation.com</strong>.</p>
                    </div>
                    <div className="legal-section">
                      <h3>6. Cookies</h3>
                      <p>{lang === 'es' ? 'Nuestro sitio utiliza cookies para mejorar su experiencia. Puede controlar la configuración de cookies a través de su navegador.' : 'Our website uses cookies to improve your browsing experience. You can control cookie settings through your browser.'}</p>
                    </div>
                  </>}

                  {modal === 'legal' && <>
                    <div className="legal-warn">⚠ {lang === 'es' ? 'Lea cuidadosamente. Este aviso rige el uso de mybusinessformation.com y todos los servicios de Florida Business Formation Center.' : 'Please Read Carefully. This disclaimer governs your use of mybusinessformation.com and all services offered by Florida Business Formation Center.'}</div>
                    <div className="legal-section">
                      <h3>1. {lang === 'es' ? 'No Somos un Bufete de Abogados' : 'We Are Not a Law Firm'}</h3>
                      <p>{lang === 'es' ? 'Florida Business Formation Center es un servicio de preparación y presentación de documentos. No somos un bufete de abogados y no estamos autorizados a ejercer la abogacía. El uso de nuestros servicios no crea ninguna relación abogado-cliente.' : 'Florida Business Formation Center is a document preparation and filing service. We are not a law firm and are not authorized to practice law. No attorney-client relationship is created by your use of our services.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>2. {lang === 'es' ? 'Sin Asesoría Legal, Fiscal ni Financiera' : 'No Legal, Tax, or Financial Advice'}</h3>
                      <p>{lang === 'es' ? 'Nada en este sitio web ni en nuestros servicios constituye asesoría legal, fiscal o financiera. Le recomendamos consultar con profesionales legales y fiscales calificados antes de tomar decisiones empresariales.' : 'Nothing on this website or provided through our services constitutes legal, tax, or financial advice. We strongly encourage you to consult with qualified legal and tax professionals before making any business decisions.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>3. {lang === 'es' ? 'Exactitud de la Información' : 'Accuracy of Information'}</h3>
                      <p>{lang === 'es' ? 'Si bien nos esforzamos por proporcionar información precisa, las leyes y regulaciones cambian con frecuencia. Siempre verifique los requisitos actuales con la División de Corporaciones de Florida o un profesional licenciado.' : 'While we strive to provide accurate information, laws and regulations change frequently. Always verify current requirements with the Florida Division of Corporations or a licensed professional.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>4. {lang === 'es' ? 'Tarifas Estatales y Demoras' : 'State Fees & Processing Delays'}</h3>
                      <p>{lang === 'es' ? 'Las tarifas estatales de Florida están sujetas a cambios sin previo aviso. Los tiempos de procesamiento están fuera de nuestro control. No somos responsables de demoras causadas por agencias gubernamentales.' : 'Florida state filing fees are subject to change without notice. Processing times are outside our control. We are not responsible for delays caused by government agencies or rejected filings due to name conflicts.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>5. {lang === 'es' ? 'Sin Garantía de Aprobación' : 'No Guarantee of Approval'}</h3>
                      <p>{lang === 'es' ? 'No podemos garantizar que la División de Corporaciones de Florida o el IRS aprobarán su trámite. Todas las aprobaciones son a la única discreción de la agencia gubernamental correspondiente.' : 'We cannot guarantee that the Florida Division of Corporations or the IRS will approve your filing. All approvals are at the sole discretion of the respective government agency.'}</p>
                    </div>
                    <div className="legal-section">
                      <h3>6. {lang === 'es' ? 'Consulte un Profesional Licenciado' : 'Consult a Licensed Professional'}</h3>
                      <p>{lang === 'es' ? 'Para asuntos legales, fiscales o de cumplimiento normativo relacionados con su negocio, recomendamos consultar con:' : 'For matters involving legal strategy, tax planning, or compliance related to your business, we recommend consulting:'}</p>
                      <ul>
                        <li>{lang === 'es' ? 'Un abogado licenciado en Florida para asesoría legal' : 'A licensed Florida attorney for legal advice'}</li>
                        <li>{lang === 'es' ? 'Un Contador Público Certificado (CPA) para planificación fiscal' : 'A Certified Public Accountant (CPA) for tax planning'}</li>
                        <li>{lang === 'es' ? 'Un abogado de inmigración para asuntos de visa e ITIN' : 'A licensed immigration attorney for visa and ITIN matters'}</li>
                      </ul>
                    </div>
                  </>}

                </div>
              </div>
            </div>
          )}
      </>
    </div>
  )
}

export default function NewBusinessPage() {
  return (
    <Suspense>
      <NewBusinessContent />
    </Suspense>
  )
}
