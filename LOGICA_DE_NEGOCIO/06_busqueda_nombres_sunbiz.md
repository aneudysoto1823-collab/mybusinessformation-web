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

## Proceso de búsqueda (manual)
1. Recibir orden con los 3 nombres propuestos
2. Ir a [sunbiz.org](https://search.sunbiz.org/Inquiry/CorporationSearch/ByName)
3. Buscar cada nombre propuesto
4. Si hay coincidencia exacta o muy similar → ese nombre no está disponible
5. Confirmar el primer nombre disponible de las 3 opciones
6. Proceder con ese nombre al registrar

## Automatización futura (opcional)
Sunbiz no tiene una API oficial. Opciones para automatizar:
- Web scraping de sunbiz.org (frágil, puede romper con cambios del sitio)
- Servicio de terceros que consulta disponibilidad de nombres en Florida

## Impacto en el flujo
- Si el único nombre disponible es el 2do o 3ro → informar al cliente antes de proceder
- Si ninguno está disponible → contactar al cliente para nuevas opciones (esto retrasa la orden)
- El estado de la orden permanece `in_review` mientras se resuelve el nombre

## Archivos clave
- `backend/prisma/schema.prisma` — campos `companyName`, `companyName2`, `companyName3`
- `backend/public/mybusinessformation.html` — campos de nombre en el formulario (no modificar)
