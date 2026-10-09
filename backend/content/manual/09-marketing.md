---
title: "Marketing"
summary: "Marketing Saliente, Campaigns & Letters, cartas físicas, Oferta VIP y la Guía gratuita."
updated: "2026-10-09"
---

## La idea general

Cada día se registran en Florida cientos de empresas nuevas. Todas necesitan cosas que vendemos (EIN, póster laboral, certificado, agente registrado, declaración anual). El marketing consiste en encontrarlas, conseguir cómo contactarlas y mandarles una oferta, por carta física o por email.

Son dos paneles que trabajan en cadena:

1. **Marketing Saliente** (`/admin/marketing`): busca y prepara los contactos.
2. **Campaigns & Letters** (`/admin/campaigns`): manda las cartas y los emails.

## Paso 1: Marketing Saliente

Trabaja sobre la copia diaria del registro de empresas de Florida (Sunbiz), que se actualiza sola cada noche. Cada empresa nueva es un **lead**.

El botón **"Preparar leads listos (Proceso automático)"** hace todo de una vez:

1. **Trae las empresas nuevas** del registro de Florida.
2. **Las clasifica** por tipo de negocio y les da una nota: **A** (las mejores), **B** (normales) o **C** (poco valor). Desde el panel se puede apagar un tipo de negocio o una nota para que no se usen.
3. **Valida la dirección** para la carta física (que el correo pueda entregarla de verdad).
4. **Busca el email** del dueño con **Enformion**, un servicio de búsqueda de personas. Solo se paga cuando encuentra un resultado.

También se puede hacer paso por paso con **"Proceso manual"**.

Cuando hay leads listos, el botón **"Enviar a Campañas y Cartas"** los copia al segundo panel. Solo los copia, no les manda nada.

**Costos:** clasificar y validar tienen un costo chico por lead que el panel muestra antes de correrlo. Enformion tiene un cupo gratis al mes y después cobra por resultado encontrado.

## Paso 2: Campaigns & Letters

Un solo panel para las dos marcas. Arriba eliges la **plantilla**, agrupadas por marca:

| Plantilla | Marca | Cómo se manda | Qué ofrece |
|---|---|---|---|
| Carta Nuevas Empresas | MyBiz | Email y carta física | Póster laboral, EIN, Certificado de Status |
| Oferta VIP | MyBiz | Solo email | Declaración Anual sola, o el combo VIP (Agente Registrado + Declaración Anual) |
| Carta Nuevas Empresas | OpaBiz | Email y carta física | Póster laboral, EIN, Certificado de Good Standing |

**Con cada empresa puedes:**
- Ver o descargar la **carta en PDF** de la plantilla elegida, o imprimir varias juntas.
- Mandar el **email**, y antes ver una vista previa.
- Marcar **"Mark as Sent"** cuando la carta física ya salió por correo. Hay que hacerlo a mano: descargar el PDF no cuenta como enviado.
- Dejar una **nota** de seguimiento.
- Borrar empresas, de a una o varias.

Para revisar cómo quedan los emails y las cartas **sin elegir una empresa**, está la galería **/admin/plantillas** (capítulo 14). Muestra las tres plantillas de campaña con una empresa de ejemplo y siempre está al día con el último cambio de texto.

## Reglas para no molestar dos veces

- **Cada empresa la contacta una sola marca.** Cuando MyBiz u OpaBiz la contactan, deja de aparecer como "New", y la otra marca ya no puede mandarle su carta.
- **Si compra, no recibe más cartas** de ninguna de las dos marcas.
- **Si se da de baja** con el link del email, no recibe más campañas.
- **Si el email rebota o la marcan como spam**, esa dirección se bloquea sola.

El filtro **"Contact status"** muestra las empresas nuevas (nadie las contactó), las que recibieron email, las que recibieron carta, o todas. "Contactada por" filtra por marca, y las estadísticas de arriba comparan cuánto compra cada marca.

## Cómo llega el cliente a comprar

La carta y el email traen un **código QR** y un link personalizado. Cuando el cliente lo usa:

1. El sistema registra que lo escaneó.
2. Lo lleva a una página de oferta con los datos de su empresa ya completados: `mybusinessformation.com` para MyBiz, `opabiz.com/oferta` para OpaBiz.
3. Elige los servicios. Si lleva los tres juntos, tiene {{precio:descuento-combo}} de descuento.
4. Paga en el mismo checkout del resto del sitio.

Si no tiene el QR, puede escribir su número de documento de Florida en la página y se completan sus datos igual.

## La Guía gratuita

Son PDFs de regalo (Guía I sobre cómo formar la empresa, Guía II sobre cómo mantenerla al día), en español y en inglés, para cada marca.

- **Página pública `/guia-gratis`:** para links en redes sociales. La persona deja nombre y email y le llega la guía.
- **En la carta de campaña:** si el lead nunca la recibió, va de regalo en el email.
- **Al comprar una formación:** le llegan las dos guías con la confirmación.

Nunca se le manda la Guía I dos veces a la misma persona. Los leads de `/guia-gratis` se ven en `/admin/guias`, con notas de seguimiento.
