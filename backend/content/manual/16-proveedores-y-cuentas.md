---
title: "Proveedores y cuentas"
summary: "Qué nos da cada proveedor, cuánto cuesta y dónde se administra."
updated: "2026-10-07"
---

Lista de los servicios externos de los que depende el negocio. Las contraseñas y llaves **no van en este manual**: las claves del sitio están guardadas en Vercel, y el acceso a cada cuenta lo tienen los socios.

## El sitio y los datos

| Proveedor | Para qué lo usamos | Plan |
|---|---|---|
| **Vercel** | Aloja el sitio (opabiz.com y mybusinessformation.com) y corre las tareas automáticas | Pro (pago) |
| **Railway** | Un segundo servidor interno que todavía usa parte del panel (por ejemplo, el buscador de nombres) | |
| **Supabase** | Base de datos principal: órdenes, clientes, contabilidad, citas, archivos entregados | |
| **Turso** | Copia del registro de empresas de Florida (millones de empresas) y los leads de marketing | |
| **Cloudflare R2** | Copias de seguridad automáticas de las bases de datos | |
| **GitHub** | Guarda el código. Cada cambio que se sube se publica solo en Vercel | |
| **Namecheap** | Donde están registrados los dominios y su configuración (DNS) | |

## Cobros

| Proveedor | Para qué | Notas |
|---|---|---|
| **Stripe** | Cobros con tarjeta, suscripciones, reembolsos y códigos de descuento | Hoy en modo de prueba. Ver el capítulo "Pagos con Stripe" |

## Comunicación

| Proveedor | Para qué | Notas |
|---|---|---|
| **Resend** | Envía todos los emails automáticos | **Plan gratis**: hay que pasarlo a pago antes de cobrar en real |
| **Zoho Mail** | Los buzones del equipo (info@, admin@, alert@, marketing@, support@, noreply@) | Plan gratis. Solicitud enviada para revender email a clientes |
| **Telegram** | Alertas urgentes al equipo, independientes del email | Gratis |
| **WhatsApp Business** | Atención a clientes, número +1 (352) 278-2475 | |

## Servicios que prestamos a través de terceros

| Proveedor | Para qué | Notas |
|---|---|---|
| **RegisteredAgentsInc (Corporate Tools)** | El agente registrado real de nuestros clientes | Las facturas se pagan a mano desde su portal |

## Marketing y verificación

| Proveedor | Para qué | Notas |
|---|---|---|
| **Enformion** | Encuentra el email de los dueños de empresas nuevas | Cupo gratis al mes; cobra por resultado encontrado |
| **ZeroBounce** | Verifica que un email exista antes de usarlo | **Plan gratis (100 por mes)**: hay que pasarlo a pago antes de cobrar en real |
| **Lob y Google** | Verifican que una dirección de EE. UU. sea real y pueda recibir correo | |
| **Google Analytics y Search Console** | Visitas al sitio y posicionamiento en Google | Gratis |

## Inteligencia artificial y monitoreo

| Proveedor | Para qué | Notas |
|---|---|---|
| **Anthropic (Claude)** | Claudia, Claudia Agente, la extensión de WhatsApp y la lectura de facturas en Contabilidad | Se paga por uso, con recarga automática |
| **Sentry** | Registra los errores del sitio para poder arreglarlos | |

## En trámite (combo de dominio, teléfono y email)

| Proveedor | Para qué | Estado |
|---|---|---|
| **ResellerClub** | Revender dominios y email profesional (Business Email, marca blanca) | Cuenta activa con saldo cargado. Email probado con éxito. Ver el capítulo "Email profesional para clientes" |
| **Twilio** | Números de teléfono comerciales (incluidos 1-800) | Cuenta activa con saldo y recarga automática |
| **Zoho (revendedor)** | Alternativa para el email | Contrato recibido; no se firma por ahora (comisión del 15%, sin marca blanca, logo obligatorio en el home) |

Los precios del combo todavía no están definidos.
