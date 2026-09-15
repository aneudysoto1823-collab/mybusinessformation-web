# Backup pre-cambios de compliance FTC/UPL — 2026-09-15

Copias exactas (sin modificar) de los 3 templates de carta/email que la auditoría de compliance FTC/UPL del 2026-09-15 identificó con hallazgos — guardadas ANTES de empezar a modificarlos, para poder comparar "antes vs después" o revertir si hace falta.

- `new-business-letter.ORIGINAL.ts` — generador del PDF de la carta física (equivalente original de `backend/lib/new-business-letter.ts`)
- `campaign-email.ORIGINAL.ts` — email "Carta Nuevas Empresas" (equivalente original de `backend/lib/campaign-email.ts`)
- `vip-reminder-email.ORIGINAL.ts` — email "Oferta VIP" (equivalente original de `backend/lib/vip-reminder-email.ts`)

Nota: el historial de git también tiene estas versiones (commit previo a esta fecha), así que esto es una copia de conveniencia para comparar lado a lado, no la única forma de recuperar el original.

Hallazgos que motivaron este backup (ver conversación con Claude 2026-09-15 para el detalle completo):
1. Sello + formato tipo "aviso oficial de gobierno" (título, recuadro de registro).
2. El disclaimer "no somos el gobierno" aparece DESPUÉS de los precios, no antes.
3. Nunca se aclara antes de pagar que el EIN se puede tramitar gratis uno mismo en irs.gov.

Esta carpeta se puede borrar una vez que los cambios de compliance estén confirmados y no se necesite comparar más.
