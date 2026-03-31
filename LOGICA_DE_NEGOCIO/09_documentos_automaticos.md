# Etapa 6 — Contratos y Documentos Automáticos

## Descripción
Generación de documentos legales usando los datos que el cliente ya ingresó en el formulario de formación. El sistema es semi-manual: los documentos se pre-llenan automáticamente con los datos del cliente, y el equipo los revisa, envía al estado/IRS, y sube los finales aprobados.

## Flujo real de trabajo (semi-manual)

### Automático (sistema solo):
1. Cliente llena formulario y paga
2. Sistema envía email de confirmación + link para crear cuenta en el portal
3. Sistema busca nombres en base de datos Sunbiz local y actualiza status de la orden
4. Orden aparece en panel de admin con status correcto

### Manual (equipo desde el panel de admin):
5. Admin entra al panel y ve las órdenes
6. Para cada orden el panel muestra documentos PRE-LLENADOS con los datos del cliente
7. Admin descarga el documento pre-llenado, lo revisa y lo envía al estado o IRS
8. Admin sube los documentos aprobados/finales al sistema
9. Cliente los descarga desde su portal

## Documentos pre-llenados en el panel de admin (por paquete)

### Basic ($49)
- Articles of Organization → para enviar a Sunbiz Florida

### Standard ($149) — incluye todo lo de Basic más:
- EIN SS-4 → para enviar al IRS
- Operating Agreement

### Premium ($249) — incluye todo lo de Standard más:
- ITIN W-7
- DBA / Fictitious Name
- Articles of Amendment

### Add-ons (si el cliente los contrató):
- EIN SS-4 → si addons.ein = true
- Operating Agreement → si addons.oa = true
- ITIN W-7 → si addons.itin = true
- Annual Report → si addons.ar = true

### Obligatorio para todos (sin importar paquete):
- BOI Filing (FinCEN) → requerido por ley desde 2024 para todos los negocios

## Datos disponibles para pre-llenar
Del modelo Order:
- firstName, lastName, email, phone, country
- companyName, companyName2, companyName3
- entityType (llc o corp)
- businessAddress
- members (JSON: nombre, título, % propiedad, dirección de cada miembro)
- registeredAgent
- orgSignature
- package, addons, speed

## Lo que se construirá en el panel de admin
En backend/app/admin/orders/[id]/page.tsx agregar sección "Documentos Pre-llenados":
- Mostrar solo los documentos que aplican según paquete y addons
- Cada documento tiene un botón "Download Pre-filled PDF"
- Al hacer clic genera el PDF con los datos del cliente y lo descarga
- Documentos finales subidos por el admin también aparecen aquí

## Lo que verá el cliente en su portal
En backend/app/client-portal/dashboard/page.tsx sección "My Documents":
- Documentos pendientes → "Pending — being prepared"
- Documentos finales subidos por el admin → botón "Download PDF"

## Stack para generación de PDFs
- Librería: pdf-lib (Node.js) — ya disponible en el ecosistema
- Plantillas: PDFs base con campos llenables o coordenadas fijas
- Almacenamiento: Supabase Storage bucket 'documents'
- Trigger: manual desde el panel de admin (botón Download)

## Resumen de documentos por tipo

| Documento | Paquete / Condición | Destino |
|-----------|---------------------|---------|
| Articles of Organization | Todos (Basic+) | Sunbiz Florida |
| EIN SS-4 | Standard+ o addons.ein | IRS |
| Operating Agreement | Standard+ o addons.oa | Cliente |
| ITIN W-7 | Premium+ o addons.itin | IRS |
| DBA / Fictitious Name | Premium+ | Sunbiz Florida |
| Articles of Amendment | Premium+ | Sunbiz Florida |
| Annual Report | addons.ar | Sunbiz Florida |
| BOI Filing (FinCEN) | Todos — obligatorio por ley 2024 | FinCEN |

## Estado
- [x] Flujo real de trabajo documentado
- [ ] Plantillas PDF base creadas para cada documento
- [ ] Motor de generación con pdf-lib implementado
- [ ] Sección "Documentos Pre-llenados" en panel de admin
- [ ] Botones Download Pre-filled PDF por documento
- [ ] Sección "My Documents" en portal del cliente
- [ ] BOI Filing pre-llenado
- [ ] Articles of Organization pre-llenado
- [ ] EIN SS-4 pre-llenado
- [ ] Operating Agreement pre-llenado
- [ ] ITIN W-7 pre-llenado
- [ ] DBA / Fictitious Name pre-llenado
- [ ] Annual Report pre-llenado
- [ ] Upload de documentos finales por admin
- [ ] Descarga de documentos finales por cliente

## Historial
- 2026-03-30: Documentación inicial de la etapa creada
- 2026-03-31: Flujo real de trabajo documentado — sistema semi-manual con pre-llenado desde panel de admin
