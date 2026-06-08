# Proceso 17 — OPABIZ: Sistema de Gestión Interna de Órdenes

## ¿Qué es OPABIZ?

OPABIZ es la aplicación interna de Florida Business Formation Center. Cuando un cliente paga su formación en opabiz.com, la orden no solo queda registrada en el sistema — también entra a OPABIZ, donde un empleado calificado la procesa.

Antes de OPABIZ, el equipo gestionaba las órdenes manualmente desde el panel admin. Con OPABIZ, el flujo es automatizado, trazable y escalable.

---

## Cómo encaja en el negocio

```
CLIENTE                        EQUIPO INTERNO
───────                        ──────────────
Paga en mybusinessformation    
        ↓
   Order creada (Prisma)        → OPABIZ recibe la orden automáticamente
        ↓                              ↓
   Email de confirmación         Motor asigna empleado óptimo
   enviado al cliente                  ↓
                                 Empleado recibe notificación
                                 (Push / WhatsApp)
                                       ↓
                                 Empleado acepta y trabaja
                                       ↓
                                 Sube documentos (Articles,
                                 BOI, Operating Agreement, etc.)
                                       ↓
                                 Completa la orden en OPABIZ
                                       ↓
   Portal cliente actualiza ←   Status sync a mybusinessformation
   Cliente recibe email de
   avance / aprobación
```

---

## Integración técnica

La conexión entre ambos sistemas se hace via **DB trigger en Supabase**:

1. El webhook de Stripe crea el registro en la tabla `Order` (Prisma)
2. Un trigger de PostgreSQL detecta el INSERT y crea automáticamente un registro en `ordenes_opabiz`
3. El motor de asignación (Edge Function) selecciona al empleado según:
   - Nivel jerárquico (basico / intermedio / avanzado / experto)
   - Tier de desempeño (Oro / Plata / Bronce / Riesgo)
   - Disponibilidad en ese momento
   - Historial de inactividades
4. Al completar en OPABIZ, una Edge Function actualiza el `status` en la tabla `Order` de mybusinessformation

---

## Qué cambia en el flujo actual

| Antes | Con OPABIZ |
|---|---|
| Admin cambia status manualmente en panel | Sistema asigna y notifica automáticamente |
| No hay trazabilidad de quién trabajó qué | Historial completo por orden y empleado |
| Documentos subidos sin estructura | Documentos organizados por orden en Storage |
| Sin métricas de rendimiento del equipo | Puntaje, tier y KPIs por empleado |
| Asignación informal | Motor inteligente con reglas configurables |

---

## Emails y notificaciones

OPABIZ **no reemplaza** el sistema de emails de mybusinessformation. Los emails al cliente siguen saliendo desde mybusinessformation via Resend (`sendOrderProcessed`, `sendOrderApproved`, etc.). OPABIZ maneja las notificaciones **internas** al empleado (Push + WhatsApp).

---

## Estados de orden en OPABIZ vs mybusinessformation

| mybusinessformation `Order.status` | OPABIZ `estado_orden_opabiz` |
|---|---|
| `pending` | — (no llega a OPABIZ hasta pago) |
| `in_review` | `pendiente` → `en_progreso` |
| `names_taken` | `revisando` |
| `ready_to_file` | `en_progreso` |
| `filed` | `en_progreso` |
| `approved` | `completada` |
| `completed` | `completada` |
| — | `cancelada` / `rechazada` (gestión interna) |

---

## Referencias

- Contexto completo de OPABIZ: `OPABIZ/00_contexto_y_plan.md`
- Troubleshooting OPABIZ: `OPABIZ/01_troubleshooting.md`
- Sistema de emails MBF: `LOGICA_DE_NEGOCIO/02_emails_automaticos.md`
- Flujo de orden MBF: `LOGICA_DE_NEGOCIO/01_flujo_de_orden.md`
