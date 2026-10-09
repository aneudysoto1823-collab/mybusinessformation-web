---
title: "Guías y Labor Law Poster"
summary: "Las guías PDF de regalo y el póster de leyes laborales: cómo se generan y se envían."
updated: "2026-10-09"
---

## Las Guías gratuitas

Son libros cortos en PDF que regalamos para generar confianza y atraer clientes:

- **Guía I: Formar su LLC o Corporación en Florida.** El proceso paso a paso, con cada servicio explicado (Agente Registrado, EIN, Operating Agreement, etc.) y botones que llevan a contratarlo.
- **Guía II: Mantenga su Empresa al Día en Florida.** Qué hacer después de formarla: declaración anual, impuestos, licencias, cuenta de banco, cómo cuidar la protección de la empresa.

Cada guía existe en **español e inglés** y en versión **OpaBiz** y **MyBiz**: 8 archivos en total.

### Cómo se reparten

| Dónde | Qué recibe la persona |
|---|---|
| Página **/guia-gratis** (links de redes sociales) | La Guía I, después de dejar nombre y email |
| Email de campaña a empresas nuevas | La Guía I adjunta, si nunca la recibió |
| Al pagar una formación | Las dos guías (o solo la II si ya tenía la I) |

Las guías van **adjuntas** al email y además con un link, por si el adjunto no abre. **Nadie recibe la Guía I dos veces**, venga por donde venga. Las guías llegan en el idioma de la persona.

### En el panel

En **/admin/guias**:
- Botones para **ver y descargar** cada guía.
- La lista de personas que la pidieron desde /guia-gratis, con una **nota** de seguimiento para cada una.

### Cambiar el contenido de una guía

El texto de las guías está en el proyecto (carpeta `GUIAS_PDF`). Para cambiar algo, pídeselo a Claude: edita el texto y genera el PDF de nuevo con su portada.

## Labor Law Poster

Es el **póster obligatorio de leyes laborales** que todo negocio con empleados en Florida tiene que tener en la pared, a la vista de los empleados. Lo vendemos impreso: {{precio:poster}}, con el envío incluido.

**Cómo es:**
- **Un solo póster** de 42 pulgadas de ancho por 39 de alto, con todos los avisos federales y de Florida juntos.
- Usa el **arte oficial** de cada agencia (OSHA, EEOC, salario mínimo de Florida, compensación de trabajadores, etc.), tal cual lo publica el gobierno. Nuestra marca va solo en el margen.
- Existe en **español e inglés**, versión OpaBiz y versión MyBiz.

**En el panel**, en **/admin/plantillas** (filtro Póster): ver, descargar y **mandarlo por email**. El archivo pesa entre 13 y 15 MB, así que por email va como link de descarga, no adjunto.

**Imprimir:** a tamaño real (100%, sin achicar) y a color. Algunos avisos tienen un tamaño mínimo por ley y el de compensación de trabajadores tiene que ir a color.

### Revisión una vez al año

Alrededor del **30 de septiembre** de cada año hay que revisar si alguna agencia publicó una versión nueva de su aviso. El salario mínimo de Florida cambia justo en esa fecha. Si algo cambió, se reemplaza el aviso y se genera el póster de nuevo.

## Galería de plantillas

En **/admin/plantillas** están juntos, para revisar cómo le llegan al cliente: los emails de campaña (Carta Nuevas Empresas de MyBiz y de OpaBiz, Oferta VIP), las cartas físicas en PDF, las Guías y el Labor Law Poster. Se filtran por tipo, marca e idioma.

Se arman con el mismo sistema que hace los envíos reales y con una empresa de ejemplo (Sunshine Coffee LLC). Por eso, cada vez que se cambia un texto, la galería ya muestra la versión nueva sin hacer nada más. Ver una plantilla ahí no envía nada ni registra nada.

Las vistas previas de cada campaña en Campaigns & Letters siguen igual, con la empresa real de cada fila.
