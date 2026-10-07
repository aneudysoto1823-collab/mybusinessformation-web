---
title: "Contabilidad"
summary: "Ingresos, gastos, gastos recurrentes, reportes e impuestos estimados."
updated: "2026-10-07"
---

## Qué es

Un módulo interno para llevar las cuentas del negocio, en **/admin/contabilidad**. Tiene cinco partes: **Dashboard**, **Clientes**, **Ingresos**, **Gastos** y **Reportes**.

## Ingresos

Cada ingreso es como una factura: cliente, monto, fecha y estado del pago. La numeración de facturas es automática y empieza de nuevo cada año.

**Cómo entran los ingresos de las ventas del sitio:**
- **Órdenes pagadas:** se importan con el botón de **sincronizar órdenes**. Trae las órdenes pagadas que todavía no están en contabilidad y crea el cliente y el ingreso. Se puede tocar las veces que quieras: nunca duplica.
- **Renovaciones de suscripciones** (Agente Registrado, Declaración Anual): se anotan solas cuando Stripe cobra la renovación.
- **Reembolsos y contracargos:** si se reembolsa o se pierde una disputa en Stripe, el ingreso de esa orden se ajusta solo.

También se pueden cargar ingresos a mano.

La pestaña de Ingresos muestra el **MRR activo**: cuánto entra por mes, en promedio, por las suscripciones vigentes.

## Gastos

Se cargan a mano o con ayuda de la IA:

- **A mano:** fecha, categoría, descripción y monto.
- **Con IA:** subes la factura en PDF o en foto y la IA completa sola el proveedor, la fecha, el monto, la categoría y si es recurrente. Revísalo antes de guardar.
- **Adjuntar la factura:** cada gasto puede llevar su archivo, que después se abre desde el ícono de la tabla.

**Gastos recurrentes** (suscripciones mensuales o anuales, como el hosting o los servicios):
- Se marcan como recurrentes con su fecha de renovación.
- Cuando llega la fecha, el sistema crea solo el gasto del período siguiente. Se puede **pausar** con el botón "Auto / Pausado".
- Avisos de vencimiento por color: **rojo** si ya venció, **naranja** si vence en 7 días o menos, **ámbar** si vence en 8 a 30 días. Aparecen en Gastos y en el Dashboard.

Las **comisiones pagadas a afiliados y agentes** se anotan solas como gasto al tocar "Marcar como pagado".

## Dashboard e impuestos estimados

El Dashboard muestra ingresos, gastos, balance y los avisos de gastos por vencer.

Calcula también los **impuestos federales estimados**:
- Tú pones el porcentaje (25% por defecto).
- Impuesto estimado = ganancia por ese porcentaje.
- Lo divide en los **4 pagos trimestrales al IRS** (abril, junio, septiembre y enero).
- Florida no cobra impuesto estatal sobre la renta, solo aplica el federal.

Es una estimación para planificar, no reemplaza al contador.

## Reportes

Un reporte por período con los indicadores principales:

| Indicador | Qué dice |
|---|---|
| **CAC** | Cuánto cuesta conseguir un cliente nuevo |
| **ROI** | Cuánto devuelve lo que se gasta |
| **AOV** | Cuánto gasta en promedio cada cliente por orden |
| **Runway** | Cuántos meses se puede operar con el dinero actual |
| **Churn** | Qué porcentaje de suscripciones se cancela |

## Exportar

- **Excel:** descarga la tabla con los filtros que tengas puestos.
- **PDF:** abre la vista de impresión del navegador.

## Poner en cero

El botón **"Poner en cero"** del Dashboard borra **todos** los datos de contabilidad. Pide confirmación. Está pensado para limpiar los datos de prueba antes del lanzamiento. **Ojo:** también borra los gastos, que son reales; antes de usarlo, revisa el plan de limpieza en la lista de prelanzamiento.
