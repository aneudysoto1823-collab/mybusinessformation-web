# 10 — Otros problemas no categorizados

Problemas que no encajan en las categorías anteriores: ataques, sobrecostos, accesos perdidos, problemas de tooling.

---

### 1. Ataque DDoS — sitio muy lento o caído por tráfico malicioso
**Status:** 🔴 Crítico
**Síntoma visible:** Sitio extremadamente lento o intermitentemente caído. En Vercel Analytics ves spike enorme de tráfico desde una sola región o IPs sospechosas. Bandwidth sube agresivamente.
**Solución posible:** Acción inmediata: si Cloudflare está activado (recomendado), ir a Cloudflare Dashboard → Security → "Under Attack Mode" — activarlo. Esto pone CAPTCHA antes de cada visitor por unos minutos hasta que el ataque pase. Si NO tienes Cloudflare aún, activarlo AHORA — toma 5 min: cuenta gratis → agregar dominio → cambiar nameservers en el registrar. Mientras se activa, en Vercel ir a Firewall (si está disponible) → bloquear IPs específicas atacantes. Documentar el ataque, considerar upgrade a Cloudflare Pro $20/mes para WAF avanzado.

---

### 2. Costo del mes sobrepasado (factura inesperada)
**Status:** 🟡 Medio
**Síntoma visible:** Email de Vercel/Railway/Supabase/Stripe avisando que el cargo del mes fue mayor de lo esperado. O al revisar el dashboard ves consumo anormal.
**Solución posible:** Identificar dónde está el sobre-consumo. Vercel: Dashboard → Settings → Usage. Railway: Dashboard → Settings → Usage. Supabase: Dashboard → Settings → Billing. Si es por tráfico legítimo: bueno, escalá el plan. Si es por consumo anómalo (ataque, bot scraping, bug que genera loops), investigar causa raíz: revisar logs por patrones extraños. Como prevención: configurar alertas de uso al 70% y 90% en cada plataforma para enterarte antes del límite.

---

### 3. Acceso revocado a un servicio (clave API rotada o cuenta suspendida)
**Status:** 🔴 Crítico
**Síntoma visible:** De repente un servicio empieza a fallar con 401/403 errors. Ej: Stripe API rejects all requests, Resend rejects sends. O recibes email "Your account has been suspended".
**Solución posible:** Identificar si fue (a) clave API rotada accidentalmente por alguien del equipo o (b) cuenta suspendida por el proveedor. Para (a): ir al servicio → Settings → API Keys → crear nueva clave → actualizar en Vercel/Railway → restart. Para (b): leer email del proveedor cuidadosamente — explicar la razón de la suspensión. Responder con documentación requerida o hacer ajustes solicitados. Mientras tanto, el servicio está caído. Tener plan B de cada servicio crítico (alternativa de email, procesador de pago alternativo).

---

### 4. GitHub no permite push (commit rechazado)
**Status:** 🟡 Medio
**Síntoma visible:** Al hacer `git push` aparece error "Permission denied" o "Authentication failed" o "remote: Repository not found". El último push había funcionado.
**Solución posible:** Causa frecuente: token de GitHub expiró. Ir a GitHub → Settings → Developer settings → Personal access tokens → ver si el token actual está expirado. Generar nuevo token (classic) con permisos `repo`. En la terminal: `git remote set-url origin https://USERNAME:TOKEN@github.com/REPO.git` o usar `gh auth login` si tienes GitHub CLI. Otra causa: rama `main` protegida y tratando de push directo — verificar settings del repo. Si pasa con el partner (Fabián), verificar que sigue siendo collaborator del repo: GitHub → Settings → Manage Access.

---

### 5. Vercel deploy preview de PR no funciona
**Status:** 🟢 Bajo
**Síntoma visible:** Cada Pull Request en GitHub debería generar URL temporal en Vercel para preview, pero los previews recientes no se generan o fallan.
**Solución posible:** Ir a Vercel Dashboard → Settings → Git → verificar que "Deploy Hooks" y "Pull Request Comments" están activados. Verificar que la integración GitHub está conectada (si dice "Reconnect", hacerlo). Si están bien, el problema puede ser env vars faltantes en ambiente "Preview" — Settings → Environment Variables → asegurar que las variables están marcadas para Preview también, no solo Production. Re-trigger deploy del PR.

---

### 6. Local development no funciona después de pull (errores de dependencias)
**Status:** 🟢 Bajo
**Síntoma visible:** Después de `git pull` y `npm run dev` aparecen errores tipo "Cannot find module" o "Module not found: Can't resolve...". Producción funciona OK pero local no.
**Solución posible:** Comando estándar de fix: dentro de `backend/` correr `rm -rf node_modules package-lock.json && npm install`. Esto reinstala dependencias frescas. Verificar que no hay cambios locales sin commitear que estén bloqueando pull con `git status`. Si después del install sigue fallando, verificar que `node` y `npm` están en versiones requeridas (Node v24.14.0, npm 11.9.0 según `contexto`). Usar `nvm use 24` si hay nvm instalado.

---

### 7. Pago a un servicio falló (tarjeta declined)
**Status:** 🔴 Crítico
**Síntoma visible:** Email de Vercel/Railway/Supabase/Stripe "Your payment failed — service will be suspended in X days". La tarjeta del founder venció, fue robada o tiene fondos insuficientes.
**Solución posible:** Acción inmediata: ir al servicio → Settings → Billing → Payment Methods → actualizar tarjeta. Verificar que cargo de prueba pasa. Como prevención: tener TODAS las facturaciones con misma tarjeta de negocio dedicada (no personal mezclada). Configurar recordatorio en calendar 30 días antes de la expiración de la tarjeta. Tener tarjeta secundaria como backup en TODOS los servicios críticos.

---

### 8. Login de admin pierde acceso (olvido de password o 2FA perdido)
**Status:** 🔴 Crítico
**Síntoma visible:** Admin ya no puede entrar a `/admin` porque olvidó la contraseña o perdió el dispositivo con la app de 2FA (si está activado). Sin acceso al panel para procesar órdenes.
**Solución posible:** Ya que las credenciales admin son env vars (`ADMIN_USER`/`ADMIN_PASSWORD`), no hay "forgot password" — son hardcoded. Acción: ir a Vercel Dashboard → Settings → Environment Variables → editar `ADMIN_PASSWORD` con valor nuevo conocido. Hacer Redeploy. Loguearse con nuevo password. Como prevención: usar password manager (1Password/Bitwarden) y tener backup codes guardados en lugar seguro físico. Cuando se implemente 2FA real, considerar autenticación con email magic link como recovery.

---

### 9. Branch `main` se rompió (commit malo en producción)
**Status:** 🔴 Crítico
**Síntoma visible:** Hiciste push a main, Vercel deployó el commit, sitio se rompe. Antes funcionaba. Necesitas regresar al estado anterior YA.
**Solución posible:** Acción inmediata desde Vercel: Dashboard → Deployments → encontrar el último deploy que funcionaba (el anterior al malo) → click "..." → "Promote to Production". Esto regresa el sitio en 30 segundos sin tocar git. Después, en local: `git revert <commit-hash-malo>` → push. O si prefieres rebase: `git reset --hard <commit-bueno>` y `git push --force` (cuidado, destructivo). Documentar el incidente y qué se rompió para evitar repetir.

---

### 10. Notificación legal (cease and desist, DMCA, etc.)
**Status:** 🔴 Crítico (legal)
**Síntoma visible:** Recibes email o carta certificada de un competidor (LegalZoom, Bizee) o entidad legal con reclamo: copyright infringement, trademark infringement, false advertising claim, etc.
**Solución posible:** NO responder inmediatamente sin asesoría legal. Acción: (1) Guardar TODO el comunicado completo (PDF, screenshots). (2) Contactar abogado de FL especializado en internet/IP — el primer chat es gratis o $200-400. (3) Mientras se asesora: NO modificar el sitio para "esconder evidencia" — eso empeora cualquier caso futuro. (4) NO contactar al reclamante directamente sin abogado. (5) Documentar internamente. Para prevenir: revisar copy del sitio asegurando que claims sobre competidores son fácticos y verificables, no inventados.
