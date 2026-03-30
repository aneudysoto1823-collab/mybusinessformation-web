# Etapa 6 — Contratos y Documentos Automáticos

## Descripción
Generación automática de documentos legales usando los datos que el cliente ya ingresó en el formulario de formación. El objetivo es eliminar el trabajo manual del equipo en la preparación de documentos.

## Documentos que se generan 90-100% automático

| Documento | Datos disponibles | Lo que falta |
|-----------|------------------|--------------|
| Operating Agreement | Nombre empresa, miembros, % propiedad, dirección, tipo entidad | Firma del cliente |
| IRS SS-4 (EIN) | Nombre empresa, dirección, responsable, tipo entidad | Nada — casi completo |
| BOI Filing (FinCEN) | Dueños, % propiedad, nombres, direcciones | ID/pasaporte del dueño |
| DBA / Fictitious Name | Nombre empresa, dueño, dirección | Nada |
| Annual Report | Toda la info de formación original | Nada |
| Articles of Amendment | Datos registrados originales | Solo el cambio específico |
| Certificate of Formation | Lo genera Florida — el equipo lo recibe y sube al sistema | Nada |

## Documentos que necesitan algo externo

| Documento | Qué falta |
|-----------|-----------|
| BOI Filing | Copia del ID/pasaporte del dueño |
| ITIN (W-7) | Pasaporte original o copia certificada |
| Articles of Organization | Envío directo a Sunbiz — depende de Etapa 5 |

## Datos que ya tenemos del formulario
- firstName, lastName, email, phone, country
- companyName, entityType, businessAddress
- members (nombre, título, % propiedad, dirección de cada miembro)
- registeredAgent, addons, package, speed
- orgSignature (firma del organizador)

## Prioridad de construcción
1. Operating Agreement — alto valor, clientes lo necesitan rápido
2. SS-4 para EIN — se puede llenar y enviar por fax al IRS automáticamente
3. BOI Filing — obligatorio para todos los negocios desde 2024

## Stack tecnológico planeado
- Plantillas: archivos DOCX con marcadores {NOMBRE_EMPRESA}, {NOMBRE_DUENO}, etc.
- Generación: librería docxtemplater (Node.js) para llenar plantillas DOCX
- Conversión a PDF: librería pdf-lib o servicio externo
- Almacenamiento: Supabase Storage (mismo bucket certificates) o migrar a AWS S3
- Trigger: automático cuando la orden llega a status = approved

## Flujo planeado
1. Orden llega a status = approved
2. Sistema toma la plantilla del documento
3. Llena los marcadores con datos del cliente desde la base de datos
4. Genera el PDF
5. Sube a Supabase Storage en orders/{orderId}/
6. Notifica al cliente que el documento está disponible en su portal
7. Cliente descarga desde /client-portal/dashboard

## Estado
- [ ] Crear plantillas DOCX para cada documento
- [ ] Implementar motor de generación con docxtemplater
- [ ] Operating Agreement automático
- [ ] SS-4 (EIN) automático
- [ ] BOI Filing automático
- [ ] DBA automático
- [ ] Annual Report automático
- [ ] Integración con portal del cliente para descarga
- [ ] Migración a AWS S3 (opcional, post-lanzamiento)

## Historial
- 2026-03-30: Documentación inicial de la etapa creada
