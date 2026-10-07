---
title: "Visión general"
summary: "Qué es el negocio, las dos marcas, quién es la empresa legal y cómo encajan todas las piezas."
updated: "2026-10-06"
---

Este manual explica cómo funciona el negocio, sin tecnicismos. Si tienes una duda sobre un proceso, un precio o qué hacer en un caso puntual, búscalo arriba.

## Qué hacemos

Ayudamos a emprendedores a **formar su empresa en Florida** (LLC o Corporación) y a **mantenerla al día** con el estado: agente registrado, declaración anual, EIN, licencias y otros trámites.

Somos un **servicio privado de preparación de documentos**. No somos una agencia del gobierno ni un despacho de abogados, y eso tiene que quedar claro en todo lo que mostramos al cliente.

## Las dos marcas

Una sola empresa opera dos sitios web, cada uno con su propia marca:

| | OpaBiz | MyBiz |
|---|---|---|
| Sitio | opabiz.com | mybusinessformation.com |
| Para quién | Gente que quiere **formar una empresa nueva** | Empresas que **ya existen** y necesitan algún trámite |
| Qué vende | Paquetes de formación y servicios sueltos | Servicios sueltos (EIN, póster laboral, certificados, cumplimiento anual) |
| Logo | Círculo "OB" | Sello de Florida Business Formation Center |

Los dos sitios comparten todo por detrás: la misma base de datos, la misma cuenta de Stripe, el mismo panel de administración. Cada orden guarda de qué marca vino, y los emails al cliente salen con la marca correcta.

**MyBiz nunca forma empresas nuevas.** Por eso en ese sitio no aparece nada sobre buscar disponibilidad de nombre.

## La empresa legal

- **Nombre legal:** Florida Business Formation Center LLC.
- **OpaBiz** es un nombre comercial (Fictitious Name) registrado de esa misma LLC.
- En documentos legales, términos, privacidad y cartas físicas se usa el nombre legal. En el sitio y los emails de OpaBiz, el cliente ve "OpaBiz".

## Las piezas del sistema

Para ubicarte rápido, esto es lo que existe y para qué sirve:

- **El sitio público:** donde el cliente compra (formación en el home de opabiz.com, servicios sueltos en /servicios).
- **El portal del cliente:** donde el cliente entra con su número de orden para ver el estado, descargar documentos y manejar sus suscripciones.
- **El panel de administración** (`/admin`): donde el equipo procesa órdenes, manda documentos, ve la contabilidad, las campañas y todo lo demás.
- **OpaBiz Connect:** la app interna para los agentes de campo que atienden citas y ayudan a clientes a llenar sus órdenes.
- **Claudia:** la asistente virtual que responde preguntas en el chat del sitio y en WhatsApp.

## Proveedores principales

| Para qué | Proveedor |
|---|---|
| Cobros con tarjeta | Stripe |
| Envío de emails automáticos | Resend |
| Buzones de correo del equipo | Zoho Mail |
| Agente registrado real | RegisteredAgentsInc (Corporate Tools) |
| Base de datos de órdenes | Supabase |
| Registro de empresas de Florida | Turso (copia diaria de Sunbiz) |
| Hosting del sitio | Vercel |

El capítulo "Proveedores y cuentas" tendrá el detalle de cada uno.

## El número de orden

Toda orden tiene un número con este formato: **FBFC-XXXXXXXX** (ocho letras y números). Es lo que el cliente usa para entrar al portal y lo que conviene pedirle cuando escribe con una duda. Las órdenes viejas de marketing pueden empezar con **FBNB-**.
