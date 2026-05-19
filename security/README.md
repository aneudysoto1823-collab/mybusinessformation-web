# Security — MyBusinessFormation Web

Carpeta de procesos y registros de seguridad del proyecto. **No es código** — son los documentos que respaldan el ciclo de auditoría y la trazabilidad de correcciones de seguridad.

---

## Estructura

```
security/
├── README.md              ← este archivo
├── plantilla_auditoria.md ← plantilla en blanco para nuevas auditorías OWASP Top 10
└── auditoria_mensual.md   ← histórico acumulado de auditorías y correcciones
```

---

## Cuándo usar cada archivo

### `plantilla_auditoria.md`
Plantilla en blanco basada en OWASP Top 10 (2021). Copiá su contenido al inicio de `auditoria_mensual.md` cuando empieces una nueva auditoría. Tiene:
- Sección de contexto (stack, alcance, fecha)
- 10 secciones (A01–A10) con espacios para hallazgos
- Plantilla de hallazgo individual (severidad, descripción, archivos, plan de fix)
- Resumen de severidades

### `auditoria_mensual.md`
Histórico acumulado. Cada sesión de auditoría se anexa al inicio con su fecha, sin borrar las anteriores. Permite ver la evolución del estado de seguridad a lo largo del tiempo.

---

## Convenciones

### Severidad
- **🔴 CRÍTICA** — exposición directa de datos, bypass de auth, RCE, mass-assignment con efectos en pagos/estados.
- **🟠 ALTA** — escalación de privilegios, fuga parcial de datos, ausencia de rate-limit en endpoints sensibles.
- **🟡 MEDIA** — falta de headers de seguridad, validaciones laxas, mensajes que revelan stack.
- **🟢 BAJA** — best practices no críticas, telemetría que podría filtrar metadatos no sensibles.

### ID de hallazgo
Formato: `<SEVERIDAD>-<NÚMERO>` único en la auditoría — por ejemplo `CRIT-1`, `ALTO-3`, `MED-7`. Los IDs se reutilizan en commits (`git commit -m "fix(security): CRIT-3 ..."`).

### Categorías OWASP
Cada hallazgo debe etiquetarse con la categoría OWASP que corresponda:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable and Outdated Components
- A07: Identification and Authentication Failures
- A08: Software and Data Integrity Failures
- A09: Security Logging and Monitoring Failures
- A10: Server-Side Request Forgery

---

## Flujo de una auditoría

1. **Antes de codear** — copiar plantilla al inicio de `auditoria_mensual.md`, llenar contexto + fecha.
2. **Auditoría** — recorrer las 10 secciones OWASP, anotar hallazgos con ID + severidad + descripción + archivos.
3. **Plan de fixes** — al final de cada hallazgo, escribir el plan concreto (qué cambia, dónde, qué env vars hay que agregar).
4. **Esperar OK del founder** antes de empezar a aplicar fixes.
5. **Aplicar fixes** uno por uno, commit dedicado por hallazgo (commit messages en español).
6. **Cerrar hallazgo** — anotar el commit hash en el ID y marcar estado **CORREGIDO**.
7. **Pendientes** — si quedan hallazgos sin corregir, listarlos al final de la sesión con prioridad sugerida.

---

## Frecuencia recomendada

Auditoría OWASP Top 10 completa: **mensual** (o cada vez que se hace cambio mayor a auth, pagos, o endpoints públicos).

Auditoría rápida (solo headers + dependencias + rate-limit): **cada release** mayor.

---

## Referencias internas

- `LOGICA_DE_NEGOCIO/18_security_headers_y_hardening.md` — documento maestro de hardening
- `LOGICA_DE_NEGOCIO/14_sentry_monitoreo_errores.md` — monitoreo y alerting
- `LOGICA_DE_NEGOCIO/15_sentry_betterstack_monitoring.md` — uptime + BetterStack
- `CONTEXTO.md` — etapas del proyecto y estado de Etapa 14 (seguridad)
