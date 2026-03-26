# Proceso 6 — Búsqueda de Disponibilidad de Nombres (Sunbiz)

## Descripción
Antes de registrar una LLC o Corporación en Florida, hay que verificar que el nombre deseado no esté ya en uso. Esto se hace en Sunbiz (Division of Corporations de Florida): sunbiz.org

## Cómo funciona actualmente
La búsqueda de nombre es **manual**: el equipo va a sunbiz.org y verifica si el nombre está disponible.

## Campos en la base de datos
El modelo Order tiene tres campos para nombres alternativos:
| Campo | Descripción |
|-------|-------------|
| `companyName` | Primera opción de nombre (requerido) |
| `companyName2` | Segunda opción (opcional) |
| `companyName3` | Tercera opción (opcional) |

El cliente provee hasta 3 opciones en caso de que la primera no esté disponible.

## Reglas de nombres en Florida

### Para LLCs
- Debe terminar en: `LLC`, `L.L.C.`, `Limited Liability Company`
- No puede ser idéntico o engañosamente similar a otro negocio registrado
- No puede contener palabras reservadas sin autorización (ej. "Bank", "Insurance")

### Para Corporaciones
- Debe terminar en: `Inc.`, `Corp.`, `Corporation`, `Incorporated`
- Mismas restricciones de unicidad y palabras reservadas

## Proceso de verificación (manual, paso a paso)
1. Recibir orden con los 3 nombres propuestos
2. Ir a [sunbiz.org](https://search.sunbiz.org/Inquiry/CorporationSearch/ByName)
3. Buscar Nombre 1 → si disponible: continuar con ese nombre
4. Si Nombre 1 tomado → buscar Nombre 2 → si disponible: continuar
5. Si Nombre 2 tomado → buscar Nombre 3 → si disponible: continuar
6. Si los 3 están tomados → disparar `POST /api/notifications/names-taken`
   - Cliente recibe email pidiendo nuevas opciones
   - Admin recibe alerta para hacer seguimiento
   - Orden permanece en `in_review` hasta que el cliente responda

## Automatización futura (Etapa 5)
Sunbiz no tiene una API oficial. Opciones para automatizar:
- Descargar base de datos trimestral de Florida vía FTP (~3.5 millones de registros)
- Importar a PostgreSQL y hacer búsqueda local en tiempo real
- Actualización automática nocturna con los nuevos registros

## Archivos clave
- `backend/prisma/schema.prisma` — campos `companyName`, `companyName2`, `companyName3`
- `backend/public/mybusinessformation.html` — campos de nombre en el formulario (no modificar)
- `backend/modules/notifications/notifications.service.ts` — `sendAllNamesTaken()` para cuando los 3 están tomados
