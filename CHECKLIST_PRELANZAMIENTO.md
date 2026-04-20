# CHECKLIST PRE-LANZAMIENTO — MyBusinessFormation.com

**Última actualización:** 20 abril 2026
**Fecha objetivo de lanzamiento:** 15 septiembre 2026
**Tiempo restante:** ~5 meses

> **Cómo usar este archivo:** Recorre cada sección antes de lanzar. Marca con `[x]` cada ítem completado. NO lances hasta que el 100% de los ítems críticos (🔴) estén marcados. Los importantes (🟡) deberían estar al 90%+. Los opcionales (🟢) son nice-to-have.

---

## 🔴 ETAPA 4 — Pagos con Stripe (CRÍTICA — bloquea lanzamiento)

- [ ] Crear cuenta Stripe en stripe.com con email del negocio
- [ ] Completar verificación de identidad de Stripe (puede tardar 2-7 días)
- [ ] Conectar cuenta bancaria del negocio para recibir pagos
- [ ] Obtener API keys de prueba (`sk_test_...`, `pk_test_...`)
- [ ] Obtener API keys de producción (`sk_live_...`, `pk_live_...`)
- [ ] Configurar variables de entorno en Vercel: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] Configurar variables de entorno en Railway (mismas)
- [ ] Implementar `POST /api/payments/create-intent` (PaymentIntent server-side)
- [ ] Integrar Stripe Elements en el formulario de checkout (frontend)
- [ ] Implementar `POST /api/payments/webhook` con firma verificada
- [ ] Configurar webhook en dashboard Stripe apuntando a `/api/payments/webhook`
- [ ] Eventos webhook a escuchar: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- [ ] Probar pago exitoso con tarjeta de prueba `4242 4242 4242 4242`
- [ ] Probar pago rechazado con `4000 0000 0000 0002`
- [ ] Probar 3D Secure con `4000 0027 6000 3184`
- [ ] Verificar que webhook actualiza `paymentStatus = paid` y `status = in_review`
- [ ] Verificar que se dispara email de confirmación (Email 1) automáticamente
- [ ] Configurar Stripe Tax para calcular impuestos automáticamente (FL no tiene state income tax pero sí sales tax si vendes producto)
- [ ] Activar emails automáticos de Stripe a clientes (recibos)
- [ ] Activar protección contra fraude de Stripe (Radar default rules)
- [ ] Hacer pago real con tarjeta personal de $1 en producción para validar end-to-end
- [ ] Reembolsar ese pago de prueba después de validar

---

## 🔴 ETAPA 5 — Búsqueda de Nombres Sunbiz Florida (CRÍTICA — bloquea automatización)

- [ ] Solicitar acceso FTP a la base de datos trimestral de Florida Division of Corporations
- [ ] Descargar primer dump trimestral de Sunbiz (~3.5M registros)
- [ ] Crear tabla `sunbiz_corps` en Supabase con índices apropiados (GIN trigram para búsqueda fuzzy)
- [ ] Script de import inicial (parsear formato fixed-width o CSV de Florida)
- [ ] Validar que los 3.5M registros importaron sin errores
- [ ] Implementar endpoint `GET /api/names/check?name=X` con search exacto + similar
- [ ] Conectar el panel admin (`/admin/orders/[id]`) para usar este endpoint real (hoy es mock)
- [ ] Implementar cron nocturno para descargar y aplicar diff trimestral
- [ ] Configurar Vercel Cron Job o Railway Cron para ejecutar el update
- [ ] Documentar el proceso de update manual (fallback si falla el cron)
- [ ] **Plan B si Etapa 5 no está lista para sept 15:** lanzar con verificación manual desde panel admin (sin automatización pero funcional)

---

## 🟡 ETAPA 7 — Comunicación Automática (mayoría completa, faltan ítems críticos)

- [ ] **Verificar dominio `mybusinessformation.com` en Resend** — esto cambia from `onboarding@resend.dev` a `noreply@mybusinessformation.com` (mejora deliverability del 60% al 95%+)
- [ ] Configurar registros DNS SPF, DKIM, DMARC para Resend (necesario para verificación de dominio)
- [ ] Probar deliverability post-verificación con email a Gmail, Yahoo, Outlook (no debe ir a spam)
- [ ] Configurar dirección `support@mybusinessformation.com` (forward a Ethan)
- [ ] Configurar dirección `noreply@mybusinessformation.com` (sender)
- [ ] Configurar dirección `aneurysoto@gmail.com` como BCC en emails críticos para tener registro
- [ ] Email "contrato PDF adjunto" (depende de Etapa 6 — opcional pre-launch)
- [ ] Plantilla email "recordatorio cliente para enviar nuevos nombres" (cuando los 3 nombres están tomados y han pasado 48h sin respuesta)
- [ ] Plantilla email "Annual Report deadline aproximándose" (recordatorio para clientes año 2+)
- [ ] Test del flujo completo de los 4 emails con un orden simulado en producción

---

## 🔴 DOMINIO Y DNS (CRÍTICA — bloquea lanzamiento)

- [ ] Confirmar que `mybusinessformation.com` está registrado y a nombre del negocio
- [ ] Renovar dominio por mínimo 3 años (evita olvido y pérdida)
- [ ] Activar privacy protection del dominio (WHOIS privacy)
- [ ] Apuntar registros DNS:
  - [ ] A record o CNAME → Vercel (production)
  - [ ] CNAME `www` → Vercel
  - [ ] MX records → email provider (Google Workspace o similar para `support@`)
  - [ ] TXT records SPF, DKIM, DMARC para Resend
- [ ] Configurar dominio custom en Vercel (Settings → Domains → Add)
- [ ] Verificar que SSL automático de Vercel (Let's Encrypt) se activa en `mybusinessformation.com` y `www.mybusinessformation.com`
- [ ] Configurar redirect www → no-www (o viceversa, según preferencia)
- [ ] Probar desde 3 redes distintas (casa, móvil, VPN) que el sitio carga
- [ ] Verificar que Vercel Analytics empieza a recibir datos del dominio nuevo
- [ ] Actualizar todos los links absolutos en código de `mybusinessformation-web.vercel.app` a `mybusinessformation.com` (audit final)
- [ ] Actualizar OG image y meta tags con URL nueva del dominio

---

## 🔴 ETAPA 10 — Seguridad y Hardening (CRÍTICA antes de cobrar dinero real)

- [ ] Habilitar Cloudflare delante del dominio (proxy DNS)
- [ ] Configurar reglas WAF básicas en Cloudflare (bloqueo de bots conocidos, rate limiting básico)
- [ ] Activar "Bot Fight Mode" en Cloudflare
- [ ] Activar Cloudflare Turnstile (CAPTCHA) en formulario de registro de orden y formulario de waitlist
- [ ] Activar Cloudflare Turnstile en login del cliente (`/client-portal`) y admin (`/login`)
- [ ] Auditoría de seguridad — revisar `security/auditoria_mensual.md` y resolver pendientes
- [ ] Verificar que `INTERNAL_API_KEY` está rotada y solo en Vercel/Railway (no en cliente)
- [ ] Verificar que `SESSION_SECRET` (JWT) tiene 32+ caracteres aleatorios
- [ ] Verificar que `ADMIN_PASSWORD` es fuerte (16+ chars, mixed case + número + símbolo)
- [ ] Activar 2FA en cuentas de servicio críticas: Vercel, Railway, Supabase, Stripe, GitHub, Resend, dominio registrar
- [ ] Configurar password manager para guardar todas las credenciales (1Password / Bitwarden)
- [ ] Backup manual completo de todas las env vars (export desde Vercel + Railway, guardar offline cifrado)
- [ ] Verificar CORS del Express en Railway — solo acepta orígenes permitidos
- [ ] Verificar headers de seguridad de Vercel (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)
- [ ] Probar penetración básica: intentar bypass de middleware admin sin sesión, ver que redirecciona
- [ ] Probar bypass de middleware client-portal sin cookie, ver que redirecciona
- [ ] Probar SQL injection en formularios principales (Prisma debería protegernos, pero verificar)
- [ ] Probar XSS en campos de texto del formulario (escape correcto en panel admin)
- [ ] Eliminar consoles.log con datos sensibles del código de producción
- [ ] Activar Vercel Web Application Firewall si plan lo permite
- [ ] Documentar en `security/` el resultado de cada test

---

## 🔴 BASE DE DATOS Y BACKUPS (CRÍTICA)

- [ ] Upgrade Supabase a plan Pro ($25/mes) para activar:
  - [ ] Backups automáticos diarios (retención 7 días)
  - [ ] Point-in-time recovery
  - [ ] Read replicas si performance lo requiere
- [ ] Configurar backup adicional manual semanal a almacenamiento externo (Google Drive cifrado o S3)
- [ ] Probar restore de backup en environment de prueba (validar que funciona)
- [ ] Documentar el proceso de restore en `LOGICA_DE_NEGOCIO/` o `TROUBLESHOOTING/`
- [ ] Revisar índices de Supabase — agregar índices en columnas con queries frecuentes (`order.email`, `order.status`, `order.createdAt`)
- [ ] Configurar alertas de Supabase para connection pool saturado (>80% connections)
- [ ] Documentar el schema de Prisma versionado (cada cambio en migration)

---

## 🟡 INFRAESTRUCTURA — Hosting (Vercel + Railway)

- [ ] Verificar que Vercel está en plan Hobby (free) o evaluar upgrade a Pro ($20/mes) si necesitas:
  - [ ] Vercel Analytics avanzado (Web Vitals reales)
  - [ ] Más build time / bandwidth
  - [ ] Edge Functions sin límite estricto
  - [ ] Removal de la marca "Powered by Vercel"
- [ ] Verificar que Railway está en plan Hobby ($5/mes incluye $5 de crédito) o evaluar Pro ($20/mes)
- [ ] Configurar healthcheck en Railway (`/api/health` que retorne 200 OK)
- [ ] Configurar auto-deploy de Railway desde branch `main`
- [ ] Configurar preview deployments en Vercel (cada PR genera URL temporal)
- [ ] Configurar variables de entorno por ambiente: production, preview, development
- [ ] Documentar TODAS las env vars necesarias en `backend/.env.example` (sin valores reales)
- [ ] Crear segundo entorno "staging" en Railway para testing antes de producción

---

## 🟡 ETAPA 6 — Documentos Automáticos (parcialmente completo)

- [ ] Implementar generación de ITIN W-7 pre-llenado (formulario IRS)
- [ ] Implementar generación de Annual Report pre-llenado (formulario Sunbiz FL)
- [ ] Endpoint para upload de documentos finales por admin (panel)
- [ ] Endpoint para descarga de documentos finales por cliente (portal)
- [ ] Sección "My Documents" en `/client-portal/dashboard` con signed URLs
- [ ] Validar que los PDFs pre-llenados se generan correctamente con datos reales de orden
- [ ] Plantilla de Operating Agreement con cláusulas en español (revisión legal recomendada)
- [ ] Plantilla de Banking Resolution con datos correctos
- [ ] Test end-to-end: orden → admin descarga PDF pre-llenado → admin sube PDF final → cliente descarga

---

## 🟡 MONITOREO Y OBSERVABILIDAD (recomendado fuerte antes de lanzar)

> Ver `PROPUESTA_MONITOREO.md` para plan detallado.

- [ ] Crear cuenta Sentry y configurar SDK en Next.js (`@sentry/nextjs`)
- [ ] Configurar Sentry en Express Railway (`@sentry/node`)
- [ ] Filtrar PII en `beforeSend` para no capturar emails/SSN/tarjetas
- [ ] Crear cuenta BetterStack y agregar 8 monitores principales
- [ ] Configurar alertas a email principal (Ethan)
- [ ] Construir widget `SystemStatusWidget.tsx` en `/admin` (consume APIs Sentry + BetterStack)
- [ ] Implementar cron job "orden estancada > 30 min en pending" (Vercel Cron)
- [ ] Test de alertas: simular caída de Railway y verificar que llega email
- [ ] Documentar cómo responder a cada tipo de alerta (en `TROUBLESHOOTING/`)

---

## 🔴 CARPETA TROUBLESHOOTING (CRÍTICA antes de lanzar)

> Hoy NO existe carpeta `TROUBLESHOOTING/` en este proyecto. Usar la de `preenvios/` como modelo.

- [ ] Crear carpeta `TROUBLESHOOTING/` en raíz del proyecto
- [ ] Documento `01_sitio_caido_vercel.md`
- [ ] Documento `02_backend_railway_no_responde.md`
- [ ] Documento `03_supabase_errores_db.md`
- [ ] Documento `04_stripe_webhook_falla.md`
- [ ] Documento `05_resend_emails_no_llegan.md`
- [ ] Documento `06_orden_estancada_pending.md`
- [ ] Documento `07_dns_dominio_problemas.md`
- [ ] Documento `08_admin_no_puede_loguear.md`
- [ ] Documento `09_cliente_no_puede_loguear.md`
- [ ] Documento `10_pago_correcto_pero_no_orden.md`
- [ ] Cada documento debe tener: Síntoma, Gravedad (🔴🟡🟢), Causas ordenadas, Pasos exactos de fix

---

## 🟡 LEGAL Y COMPLIANCE (CRÍTICA antes de cobrar)

- [ ] Revisar `/terms` (Terms & Conditions) con abogado o notario público en FL
- [ ] Revisar `/privacy` (Privacy Policy) — debe cubrir CCPA si aplica, GDPR si tienes usuarios EU
- [ ] Revisar `/legal` (Legal Disclaimer) — disclaimer "no somos abogados, no damos asesoría legal"
- [ ] Agregar página o sección "Refund Policy" — cuándo procedes refund vs no
- [ ] Agregar disclaimer en footer de TODAS las páginas: "MyBusinessFormation is not a law firm and does not provide legal advice."
- [ ] Configurar Cookie Banner si te molestas con CCPA (poco crítico para FL pero buena práctica)
- [ ] Verificar que el formulario tiene checkbox de "Acepto Terms y Privacy" obligatorio antes de submit
- [ ] Verificar que el email de confirmación incluye link de unsubscribe (ya implementado, pero verificar)
- [ ] Registrar el negocio mismo (irónico) — formar la LLC propia: "MyBusinessFormation LLC" o similar
- [ ] Obtener EIN propio del negocio (para cuentas bancarias y Stripe)
- [ ] Abrir cuenta bancaria del negocio para conectar a Stripe
- [ ] Configurar la forma jurídica con la que vas a operar (sole prop, LLC, S-Corp)
- [ ] Sales tax permit en Florida (si vendes "guías PDF" o productos digitales podría aplicar)
- [ ] Business Tax Receipt del condado (Miami-Dade o donde estés)

---

## 🟡 CONTENIDO Y COPY DEL SITIO (importante para conversión)

- [ ] Reescribir copy del home en español latino auténtico (no traducción mecánica)
- [ ] Verificar que TODAS las páginas tienen versión EN y ES funcional (test cada toggle)
- [ ] Hero section con propuesta clara: "Tu LLC en Florida desde $49 — en español, sin SSN obligatorio"
- [ ] Sección de testimoniales con 3+ casos reales (cuando los tengas)
- [ ] Sección FAQ ampliada con 15-20 preguntas reales
- [ ] Sección "Cómo funciona" con 4-6 pasos visuales
- [ ] Página de blog (estructura mínima) lista para publicar artículos SEO post-launch
- [ ] Imágenes optimizadas (WebP, máximo 200KB cada una)
- [ ] Alt text descriptivo en todas las imágenes (accesibilidad + SEO)
- [ ] Meta titles + meta descriptions optimizados en cada página
- [ ] OG image custom (Open Graph) para compartir en redes
- [ ] Favicon en alta calidad (32x32, 192x192, 512x512)
- [ ] Página 404 custom con búsqueda y links útiles

---

## 🟡 SEO TÉCNICO (importante)

- [ ] Generar `robots.txt` permitiendo crawl
- [ ] Generar `sitemap.xml` automático con todas las páginas (`next-sitemap` package)
- [ ] Agregar dominio en Google Search Console y verificar ownership
- [ ] Submit del sitemap a Google Search Console
- [ ] Agregar dominio en Bing Webmaster Tools
- [ ] Agregar Schema.org markup (Organization, BreadcrumbList, FAQPage)
- [ ] Configurar Google Analytics 4 (GA4) — instalar `gtag` en `layout.tsx`
- [ ] Configurar Google Tag Manager (opcional pero recomendado)
- [ ] Crear Google Business Profile (Google My Business) para FL
- [ ] Verificar que canonical URLs están bien (cada página apunta a su URL canónica)
- [ ] Verificar que no hay duplicate content entre EN y ES (usar `hreflang` tags si planeas indexar ambos)

---

## 🟡 ANALÍTICA Y TRACKING (importante para optimización)

- [ ] Activar Vercel Web Analytics (free tier suficiente al inicio)
- [ ] Configurar Vercel Speed Insights
- [ ] Configurar Google Analytics 4 con conversion tracking de:
  - [ ] Submit del formulario waitlist
  - [ ] Inicio del checkout
  - [ ] Pago exitoso
  - [ ] Click en ciertos CTAs
- [ ] Configurar Meta Pixel (para futuro retargeting de ads de Meta)
- [ ] Configurar Google Ads Conversion Tag (para tracking de campañas)
- [ ] Documentar lista completa de eventos a trackear (event taxonomy)

---

## 🟢 MARKETING PRE-LANZAMIENTO (ver `PLAN_MARKETING_MBF.md` para detalle)

- [ ] Reclutar SEO writer en español latino (postear LinkedIn + Upwork)
- [ ] Construir landing `/espera` para waitlist con formulario funcional
- [ ] Configurar drip campaign de 6 emails en Resend (o ConvertKit si Resend no escala)
- [ ] Producir guía PDF de 45 páginas como lead magnet
- [ ] Grabar Video 1 YouTube (Pillar: "Cómo abrir un LLC en Florida 2026")
- [ ] Crear canal YouTube "MyBusinessFormation"
- [ ] Crear cuenta Instagram negocio
- [ ] Crear cuenta TikTok negocio
- [ ] Crear cuenta LinkedIn empresa
- [ ] Configurar herramienta de scheduling de posts (Buffer free tier)
- [ ] Diseñar templates visuales en Canva (posts, stories, reels)

---

## 🟢 PRUEBAS FINALES (opcional pero recomendado)

- [ ] Pruebas con 10 clientes simulados (amigos/familia) — flujo completo de orden a entrega
- [ ] Pruebas de UX en mobile (iPhone, Android — varios tamaños de pantalla)
- [ ] Pruebas de UX en navegadores (Chrome, Safari, Firefox, Edge)
- [ ] Pruebas de carga del sitio en 3G simulado (Chrome DevTools)
- [ ] Pruebas de performance: Lighthouse score > 90 en Performance, Accessibility, SEO
- [ ] Test de carga de tráfico (k6 o Artillery — simular 100 usuarios concurrentes)
- [ ] Test de formulario en móvil con teclado nativo (que no oculte campos)
- [ ] Test de portal cliente desde dispositivo del cliente (no solo desktop dev)

---

## 🔴 OPERACIONES (crítica antes de tener clientes reales)

- [ ] Definir quién atiende soporte primer mes (Ethan + Fabián)
- [ ] Definir SLA de respuesta a soporte: <24h en email, <4h crítico
- [ ] Configurar email `support@mybusinessformation.com` con autoresponder
- [ ] Crear plantillas de respuesta para preguntas frecuentes (saved replies en Gmail)
- [ ] Documentar el proceso operativo paso a paso para cada estado de orden (admin manual)
- [ ] Crear documento "Cómo procesar una orden de A a Z" para training (si contratas asistente luego)
- [ ] Definir horarios de atención (vs 24/7 imposible)
- [ ] Configurar WhatsApp Business número con saludo automático fuera de horario

---

## 🟡 FINANZAS Y CONTABILIDAD

- [ ] Cuenta bancaria del negocio abierta y conectada a Stripe
- [ ] Software de contabilidad: QuickBooks, Wave (free), o similar
- [ ] Plan para emitir invoices/recibos a clientes (Stripe lo hace automático)
- [ ] Definir frecuencia de payouts de Stripe (default semanal o cambiar a diario)
- [ ] Reservar fondos para impuestos federales (~25-30% de revenue)
- [ ] Reservar fondos para state filing fees ($125 LLC FL — pasa directo al estado, no margen)
- [ ] Documentar todos los gastos del negocio (Vercel, Railway, Supabase, ads, freelancers)

---

## ⏰ T-1 SEMANA antes de lanzar (checklist final)

- [ ] Todo arriba marcado al 90%+ en críticos
- [ ] Backup completo de DB hecho hoy
- [ ] Test E2E final: orden de prueba con tarjeta real $1, refund inmediato
- [ ] Verificar que Vercel + Railway + Supabase están en planes adecuados (no en risk de hit limit)
- [ ] Verificar Resend domain verified
- [ ] Verificar dominio apuntando bien y SSL OK
- [ ] Verificar que panel admin funciona en producción
- [ ] Verificar que portal cliente funciona en producción
- [ ] Notificar a waitlist con email "1 semana para el lanzamiento"
- [ ] Preparar post de lanzamiento en redes sociales
- [ ] Preparar email de "ya estamos vivos" para waitlist (con código early-bird)
- [ ] Calendar bloqueado para 48h post-launch para responder soporte

---

## ⏰ DÍA DEL LANZAMIENTO (15 sept 2026)

- [ ] 8 AM EST — verificación final: sitio carga, webhooks responden, panel funcional
- [ ] 9 AM EST — enviar email a waitlist con acceso anticipado + código WAITLIST30
- [ ] 12 PM EST — publicar en Instagram, TikTok, Facebook, LinkedIn
- [ ] 3 PM EST — abrir oficialmente al público (publicar URL en redes)
- [ ] Resto del día — monitorear panel de admin + Sentry + BetterStack en vivo
- [ ] Tener Etan + Fabián disponibles 12+ horas para soporte e incidentes

---

## ⏰ T+1 SEMANA post-lanzamiento

- [ ] Análisis: cuántas ventas, AOV, conversion rate, CPA
- [ ] Análisis: qué creatividad de ads funcionó mejor
- [ ] Análisis: qué keywords de SEO trajeron tráfico (Search Console)
- [ ] Recolectar feedback de primeros 10-20 clientes
- [ ] Documentar en `security/` cualquier incidente y cómo se resolvió
- [ ] Calibrar alertas (silenciar las ruidosas, agregar las que faltaron)

---

**TOTAL ITEMS DEL CHECKLIST:** ~210 items
**ITEMS CRÍTICOS (🔴):** ~70 items
**ITEMS IMPORTANTES (🟡):** ~90 items
**ITEMS OPCIONALES (🟢):** ~50 items

**REGLA DE LANZAMIENTO:** No lances hasta tener 100% de los 🔴 + 90% de los 🟡 marcados.
