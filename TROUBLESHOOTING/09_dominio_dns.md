# 09 — Dominio y DNS

Problemas con el dominio `mybusinessformation.com`, registros DNS, certificados SSL, propagación, redirects.

---

### 1. mybusinessformation.com no carga (sitio principal caído)
**Status:** 🔴 Crítico
**Síntoma visible:** Al entrar a `https://mybusinessformation.com` el navegador muestra "This site can't be reached" o "DNS_PROBE_FINISHED_NXDOMAIN". El sitio en `mybusinessformation-web.vercel.app` SÍ funciona, pero el dominio custom no.
**Solución posible:** Verificar primero https://www.vercel-status.com — descartar problema de Vercel. Ir a https://dnschecker.org → buscar `mybusinessformation.com` con tipo "A" o "CNAME" desde múltiples regiones. Si NO resuelve a las IPs de Vercel (76.76.21.x), problema de DNS. Ir al provider del dominio (Cloudflare/Namecheap/GoDaddy) → DNS settings → verificar registros: debe haber A o CNAME apuntando a Vercel. Comparar con instrucciones en Vercel Dashboard → Settings → Domains → click sobre el dominio → ver registros esperados. Corregir en provider, esperar propagación 5-30 min.

---

### 2. SSL certificate expirado o inválido
**Status:** 🔴 Crítico
**Síntoma visible:** Browser muestra "Your connection is not private — NET::ERR_CERT_DATE_INVALID" o "NET::ERR_CERT_AUTHORITY_INVALID". Aviso rojo. Usuarios no pueden entrar al sitio.
**Solución posible:** Vercel maneja SSL automáticamente con Let's Encrypt — los certificados se renuevan solos cada 90 días. Si expiró, hay un problema. Ir a Vercel Dashboard → Settings → Domains → click sobre `mybusinessformation.com` → ver estado SSL. Si dice "Error" o "Pending verification", revisar que los DNS records estén correctos (Vercel necesita validar ownership). Si DNS bien pero SSL no se renovó, click "Refresh" en Vercel para reintentar. Como hotfix temporal: redirigir tráfico al `mybusinessformation-web.vercel.app` que tiene SSL de Vercel siempre válido.

---

### 3. www.mybusinessformation.com no funciona pero el sin www sí (o viceversa)
**Status:** 🟡 Medio
**Síntoma visible:** `mybusinessformation.com` carga correctamente pero `www.mybusinessformation.com` da error o viceversa. Inconsistencia de qué versión funciona.
**Solución posible:** Ir a Vercel Dashboard → Settings → Domains → asegurar que AMBOS están listados: `mybusinessformation.com` (apex) y `www.mybusinessformation.com`. Configurar redirect automático en Vercel: una de las dos debe ser canónica (recomendado: sin www → primary), la otra redirige. Ir al provider de DNS y verificar que `www` tiene registro CNAME apuntando a Vercel (ej: `cname.vercel-dns.com`). Esperar propagación.

---

### 4. Email a `support@mybusinessformation.com` rebota o no llega
**Status:** 🟡 Medio
**Síntoma visible:** Cliente envía email a `support@mybusinessformation.com` y rebota con "Mailbox not found" o "Domain has no mail exchanger". O simplemente no llega a tu inbox.
**Solución posible:** Verificar registros MX en el provider de DNS. Si no hay MX records configurados, el dominio no puede recibir email. Configurar según el provider de email elegido: si usas Google Workspace, agregar MX records de Google (5 records con prioridades). Si usas Zoho Mail Free, agregar MX records de Zoho. Si solo necesitas forwarding (no inbox completa), usar ImprovMX (gratis, 25 aliases) — agregar sus 2 MX records. Esperar propagación (5-30 min) y enviar email de prueba.

---

### 5. Dominio expiró por no renovar a tiempo
**Status:** 🔴 Crítico
**Síntoma visible:** Sitio dejó de funcionar de un día para otro. Al hacer WHOIS del dominio (`whois mybusinessformation.com` en terminal) ves status "expired" o "redemption period". El dominio puede ser comprado por otra persona en cualquier momento.
**Solución posible:** Ir AHORA al provider donde compraste el dominio (Cloudflare Registrar, Namecheap, GoDaddy) → Domains → encontrar `mybusinessformation.com` → renovar inmediatamente. Si está en "redemption period" (30 días post-expiración), aún se puede recuperar pero con cargo extra ($100-300). Si pasó >60 días (deletion), el dominio se libera al mercado — riesgo de perderlo permanentemente. Después de renovar, configurar **auto-renewal por 5 años** y método de pago de respaldo. Documentar fecha de renovación próxima.

---

### 6. Registros DNS de Resend (SPF/DKIM/DMARC) no se verifican
**Status:** 🟡 Medio
**Síntoma visible:** En Resend Dashboard el dominio mybusinessformation.com sigue marcado como "Pending verification" después de haber agregado los registros DNS hace varias horas/días.
**Solución posible:** Ver `05_emails_no_envian.md` punto 6 para detalles. Resumen: usar https://dnschecker.org para verificar que los registros TXT propagaron globalmente. Si propagaron pero Resend no los detecta, click "Verify" en Resend para forzar re-check. Si Cloudflare está delante del dominio, verificar que los registros DNS están en modo "DNS only" (nube gris) NO "Proxied" (nube naranja) — Cloudflare proxy puede ocultar registros TXT.

---

### 7. Cloudflare DNS está caído o lento
**Status:** 🟡 Medio
**Síntoma visible:** Si usamos Cloudflare como DNS provider y Cloudflare tiene incidente, el sitio puede no resolver para algunos usuarios o cargar muy lento.
**Solución posible:** Ir a https://www.cloudflarestatus.com — verificar incidente. Si confirmado, no hay solución upstream — esperar resolución. Como mitigación si se vuelve crónico: tener un secondary DNS provider configurado (ej: Route 53 de AWS) para failover. Como último recurso temporal: cambiar nameservers del dominio del provider para no pasar por Cloudflare hasta que se resuelva (CTO decision).

---

### 8. Algún usuario reporta "el sitio no carga" pero a otros sí les funciona
**Status:** 🟢 Bajo
**Síntoma visible:** Recibes mensaje de cliente "no puedo entrar al sitio" pero verificas y a ti sí te funciona. Pasa generalmente con 1-2 usuarios aislados.
**Solución posible:** Casi siempre es problema del usuario, no del sitio: caché de DNS local de su computadora o ISP con datos viejos. Pedir al usuario: (1) Probar desde otro navegador. (2) Probar desde data móvil (no WiFi). (3) Limpiar DNS cache: `ipconfig /flushdns` (Windows) o `sudo dscacheutil -flushcache` (Mac). (4) Probar desde https://www.isitup.org/mybusinessformation.com — si dice "site is up", confirma que solo es ese usuario. Como segundo paso: verificar geográfico — algunos ISPs en Latam tienen DNS muy desactualizados.

---

### 9. Subdominio (ej: status.mybusinessformation.com) no funciona
**Status:** 🟢 Bajo
**Síntoma visible:** Configuraste subdominio `status.mybusinessformation.com` para BetterStack o `blog.mybusinessformation.com` para futuro blog, no carga. NXDOMAIN.
**Solución posible:** Ir al DNS provider → agregar CNAME para el subdominio apuntando al destino. Ejemplo BetterStack: CNAME `status.mybusinessformation.com` → `statuspage.betterstack.com`. Verificar en dnschecker.org que propagó. En el servicio destino (BetterStack) verificar que aceptó el subdominio. Esperar emisión SSL (Let's Encrypt automático en BetterStack — toma 5-30 min después de DNS propagado).

---

### 10. Después de cambiar DNS algunos usuarios ven sitio viejo, otros nuevo
**Status:** 🟢 Bajo
**Síntoma visible:** Hiciste un cambio en DNS (ej: migraste a Cloudflare). Algunos usuarios ya ven el sitio nuevo correctamente, otros siguen reportando que el sitio no carga o muestra contenido viejo.
**Solución posible:** Esto es propagación normal de DNS — TTL global puede ser 24-48 horas. No hay "fix" inmediato. Para acelerar el TTL futuro, antes de hacer cambios bajar el TTL de los registros a 300 seg (5 min) con 24-48h de antelación, hacer el cambio, después restaurar TTL a 3600. Para los usuarios afectados: recomendarles flush DNS local o esperar. Verificar globalmente con https://dnschecker.org cuál es el % de regiones que ya tienen el cambio.
