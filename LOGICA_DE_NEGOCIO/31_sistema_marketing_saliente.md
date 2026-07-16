# Proceso 31 — Sistema de marketing saliente (cartas + emails a LLC nuevas)

## Qué es este sistema (en palabras simples)

**Es la máquina que toma las LLC que se crean cada día en Florida, las filtra con criterio, les consigue datos de contacto, y te deja disparar campañas de cartas físicas y emails desde tu panel.**

La idea de negocio nació de algo real: cuando creamos Soto Digital Holding y Florida Business Formation Center, nos llegaron montones de cartas de empresas ofreciéndonos de todo (ITIN, EIN, certificado de status, BOI) — pero **a ciegas**, sin saber si lo necesitábamos. Cada carta les cuesta entre $0.50 y $0.75. En Florida se crean 1,200–1,800 LLC por día, así que mandar a todos sería ~$900/día solo en papel.

Nuestra diferencia: **no mandamos a ciegas.** Clasificamos y enriquecemos la data primero, y solo le mandamos a cada dueño lo que probablemente necesita. No tiene sentido ofrecerle un ITIN a un "John Smith" que casi seguro es ciudadano; pero un "Javier Soto" recién llegado probablemente necesita EIN, ITIN y licencias. Gastamos igual o menos, pero con mucho mayor porcentaje de acierto.

---

## La regla de oro: la data fresca vale, la vieja no

Una LLC recién creada es valiosa porque el dueño **acaba de empezar** y está en el momento exacto de necesitar servicios. Si pasan semanas sin contactarlo, ese momento se enfría: ya recibió las cartas de la competencia, ya resolvió lo que necesitaba, o ya pasó la etapa.

**Por eso el negocio gira alrededor de la fecha.** Si el lunes proceso las LLC del viernes, es porque ese mismo lunes les mando cartas y emails. Una LLC clase A que no usé esta semana ya casi no sirve para la campaña de "LLC nueva" — se guarda, pero no se persigue.

Esto define dos cosas del sistema:
- La **fecha de creación** (`filing_date`) es el eje central de todo.
- Registramos **cuándo se contactó** cada LLC, para no repetir y para saber cuáles ya pasaron su momento.

---

## La estrategia de costos: clasificar es gratis, enriquecer cuesta

Esto es lo más importante para el bolsillo. Hay dos momentos, y son distintos:

| Paso | Qué hace | Cuesta |
|---|---|---|
| **Clasificar** | Calcular score, vertical, perfil del dueño, tipo de dirección | **Casi gratis** — usa data que ya tenemos de Sunbiz, solo procesamiento |
| **Enriquecer** | Validar dirección (Google), conseguir email (Enformion u otra), validar email (ZeroBounce) | **Cuesta por LLC** — cada API cobra por consulta |

**Por eso el sistema separa los dos pasos:**

1. **Clasifico TODO gratis.** De 3,000 LLC nuevas, el sistema me dice "700 son score A". No gasté en APIs. Y esas 700 quedan identificadas para siempre.
2. **Enriquezco solo lo que el presupuesto permite.** De las 700 score A, le digo "enriquece solo 300". Pago por 300, no por 3,000. Las otras 400 quedan clasificadas y guardadas — si la otra semana tengo más presupuesto, las enriquezco sin volver a clasificar.

**Presupuesto por volumen, no por día.** Yo pongo el número ("enriquece 300", "esta semana solo 150"), el sistema respeta el límite. Nunca gasto más de lo que dije.

**Ahorro extra — encadenar de barato a caro.** Dentro del enriquecimiento, los sub-pasos cuestan distinto. Lo inteligente es: primero validar dirección (barato), y **solo a las que tienen dirección buena** buscarles email. Así no pago por buscar email de una LLC cuya dirección ya descarté. Cada paso filtra antes del siguiente paso más caro.

---

## Dónde vive el sistema (quién hace el trabajo)

**Todo vive en la app de opabiz, en Vercel — junto al panel de admin y al cron.** No en una PC, no en un servidor extra tipo Hetzner, no dependiendo de Claude Code para operar.

- **Claude Code construye la máquina una sola vez** (los conectores a cada API).
- **Yo la opero para siempre desde el panel**, con botones. No vuelvo a depender de Code para usarla.
- **Cada API es un "conector" dentro de la app** (igual que ya se hizo con ZeroBounce y Lob para opabiz). El panel los orquesta.

Es la misma filosofía que ya usa opabiz (el form llama a un endpoint que llama a Turso), pero más grande: el panel llama a endpoints que llaman a las APIs y a las bases.

### Cómo se ve un lunes en la mañana

**Filosofía: todo es pull.** El único paso automático es el cron nocturno del Bloque 1 — trae LLC nuevas a la Base B y las deja marcadas `procesada = no`. Nada más corre solo. En el panel yo decido cuándo y sobre cuántas trabajar, poniendo el número en cada input.

1. Abro el **panel de admin** (la pantalla "Marketing Campaigns") desde cualquier navegador.
2. En el bloque de **Clasificación** escribo `500` y aprieto **"Clasificar"** → el sistema toma las **500 más nuevas sin clasificar** (FIFO por `filing_date`), las scorea con Claude Haiku, y me devuelve "500 procesadas, 120 score A". (Gratis — centavos de tokens.)
3. En el bloque de **Enriquecimiento** escribo `300`, elijo score `A`, y aprieto **"Enriquecer"** → el sistema toma las **300 más nuevas clasificadas A sin enriquecer** y corre Google → Enformion → ZeroBounce en cadena. Antes de disparar me muestra el costo estimado (~$36). (Aquí gasto, solo lo de 300.)
4. En el bloque de **Campañas** aplico filtros (vertical, fecha, `nunca contactado`), veo cuántas coinciden (ej. 847), escribo `200` y aprieto **"Enviar cartas"** → conecta con el sistema de cartas físicas. Costo estimado ~$150 antes de confirmar. *(Bloque 4, segunda parte.)*
5. Mismo filtro, escribo `2000` y aprieto **"Enviar emails"** → usa **Resend** para mandar la campaña. Costo prácticamente cero. *(Bloque 4, segunda parte.)*

Todo con botones, sin PC, sin Code, sin servidor extra. Yo decido los números, la app ejecuta.

### Diseño del panel — los 3 bloques operativos

```
┌─────────────────────────────────────────────────────────────┐
│  Bloque 2 — Clasificación (Claude Haiku)                    │
├─────────────────────────────────────────────────────────────┤
│  Sin clasificar en la Base B: 2,847                         │
│                                                             │
│  Clasificar  [   500  ]   [ Clasificar ahora ]              │
│  Costo estimado: ~$0.15 (Claude Haiku, tokens)              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Bloque 3 — Enriquecimiento (Google + Enformion + ZeroBounce)│
├─────────────────────────────────────────────────────────────┤
│  Clasificadas sin enriquecer: A=412, B=1,203, C=987         │
│                                                             │
│  Enriquecer  [   300  ]   score [ A ▾ ]                     │
│  [ Enriquecer ahora ]                                       │
│  Costo estimado: ~$36 (Google $6 + Enformion $24 + ZB $6)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Bloque 4 — Campañas (cartas + emails)                      │
├─────────────────────────────────────────────────────────────┤
│  Filtros: [vertical ▾] [score ▾] [fecha desde/hasta]        │
│           [☑ nunca contactado] [☑ dirección validada]       │
│                                                             │
│  Coinciden con el filtro actual: 847                        │
│                                                             │
│  Enviar  [   200  ] cartas   [ Enviar cartas ]              │
│  Costo estimado: ~$150 (papel + franqueo)                   │
│                                                             │
│  Enviar  [ 2,000  ] emails   [ Enviar emails ]              │
│  Costo estimado: ~$0.40 (Resend por 2K envíos)              │
└─────────────────────────────────────────────────────────────┘
```

**Reglas del diseño**:

- **El número lo pone el operador**, el sistema no lo sugiere. Simetría entre los 3 bloques.
- **El sistema elige QUÉ registros** procesar aplicando siempre el mismo criterio: **más nuevos primero** (FIFO por `filing_date`). Respeta la regla de oro "la data fresca vale".
- **Costo estimado visible** antes de cada botón. Confirmación explícita antes de disparar el gasto.
- **Contador de disponibles** en cada bloque (cuántas sin clasificar / cuántas sin enriquecer / cuántas matchean el filtro) para que el operador sepa si tiene sentido correr el paso.
- **El filtro del Bloque 4** solo se aplica al Bloque 4 — Bloques 2 y 3 usan FIFO puro, sin filtros complicados (mantiene el flujo simple: si querés priorizar otro vertical, es porque ya hiciste enriquecimiento y estás decidiendo qué mandar).

---

## Las dos bases de datos

La línea que de verdad importa separar no es "cuántas bases", sino **qué es producción que un cliente toca en tiempo real, vs qué es trabajo interno de marketing.**

### Base A — `opabiz-sunbiz-search` (producción, intocable)
- Es la base de **búsqueda de nombres** de opabiz. Un cliente la consulta mientras llena el form.
- No se toca ni se arriesga. El cron la actualiza (nombres nuevos + cambios de status), pero ningún proceso de marketing la toca.

### Base B — la "cocina de marketing" (una sola base, una tabla)
- Aquí el cron deposita **todas las LLC nuevas crudas** cada noche.
- Aquí se les van llenando **columnas** a medida que pasan por clasificación y enriquecimiento.
- Es una sola tabla. Los "niveles" no son bases distintas ni ubicaciones — **son columnas que se filtran.**

**Por qué una sola tabla con columnas-nivel (y no 2-3 bases que mover):** una LLC no "se muda" cuando sube de nivel; simplemente se le llena una columna más. Cuando quiero una campaña, no busco "en qué base está" — **filtro la única tabla**: "dame las score A con email validado de los últimos 3 días que nunca contacté". Una consulta, una tabla, nunca se pierde una LLC. Y el espacio no es problema: 3.9M ocupan 1.45 GB; duplicar unos campos no pesa nada.

> **Separar Base A de Base B** evita que un proceso pesado de enriquecimiento afecte la velocidad de la búsqueda de nombres que tus clientes usan en vivo. Misma tecnología (Turso), dos bases con roles claros.

---

## El modelo de datos de la Base B (cómo crece una LLC)

Cada LLC en la Base B va llenando columnas según la etapa. No se mueve de lugar; gana columnas.

| Etapa | Columnas que se llenan | Quién las llena |
|---|---|---|
| **Del cron** (Bloque 1) | nombre, document_number, **filing_date**, dirección principal, dirección postal, agente registrado + tipo, dueño/officers, FEI, estado/país, `procesada = no` | El cron nocturno |
| **Clasificación** (Bloque 2) | score (A/B/C), vertical, perfil del dueño (probable extranjero vs ciudadano), tipo de dirección (residencial/comercial/virtual), `tiene_direccion_buena` | Claude Haiku (gratis) |
| **Enriquecimiento** (Bloque 3) | email, `email_validado`, teléfono, `direccion_validada` | Google / Enformion / ZeroBounce (pago) |
| **Campaña** (Bloque 4) | `fecha_contactada`, qué se envió (carta/email), `procesada = sí` | El panel al disparar |

### Las columnas de control (las que evitan repetir y miden frescura)
- **`filing_date`** → qué tan nueva es la LLC (el eje del valor).
- **`procesada`** (sí/no) → si ya pasó por clasificación. **Esto, no el orden por fecha, es lo que garantiza no repetir.**
- **`fecha_contactada`** (o vacío) → si ya le mandé algo, y cuándo.

**Cómo se garantiza no repetir data:** cuando proceso "los últimos 3 días", el sistema busca las que tengan `procesada = no` en ese rango. Las que ya procesé antes están en `procesada = sí`, así que las ignora aunque caigan en el rango de fechas. Solo agarra las nuevas que el cron metió después.

**Qué pasa con las que no se enriquecen:** si de 3,000 solo 300 logran email, las 2,700 restantes **no se borran** — se quedan en la Base B marcadas como procesadas. Muchas tendrán dirección buena y sirven para **carta física** aunque no tengan email. Las que no sirven para nada quedan guardadas igual (no pesan), por si más adelante hay otra fuente o estrategia.

**Qué pasa con las clase A que no alcanzó el presupuesto:** si Haiku da 700 clase A y solo enriquezco 300, las 400 restantes quedan clasificadas con `fecha_contactada` vacío. Si no las uso esa semana, ya pasaron su momento de "LLC nueva" — quedan guardadas e identificables, fuera del flujo activo.

---

## Los 4 bloques (cómo se construye, por partes)

El sistema se construye en bloques separados. Cada bloque es independiente y se prueba antes de seguir.

### Bloque 1 — El cron nocturno *(el que se construye primero)*
Cada noche, en Vercel, trae las LLC nuevas de Sunbiz con todos sus datos crudos y las deposita en la Base B con `procesada = no`. Además actualiza el status de las LLC que se desactivan (para que la búsqueda de nombres de opabiz libere nombres según los plazos de Florida). **El cron solo trae y marca; no clasifica ni enriquece.**

### Bloque 2 — Clasificación *(diseño acordado, pendiente implementar)*
Yo escribo un número `N` en el input y aprieto "Clasificar". El sistema toma las **N más nuevas con `procesada = no`** (FIFO por `filing_date`), las manda a Claude Haiku, y les calcula score (A/B/C), vertical, perfil del dueño (probable extranjero vs ciudadano) y tipo de dirección (residencial/comercial/virtual). Al terminar quedan `procesada = sí` y me devuelve el resumen ("500 procesadas, 120 A, 250 B, 130 C"). **Gratis** (no llama APIs de pago, solo tokens de Haiku).

### Bloque 3 — Enriquecimiento *(diseño acordado, pendiente implementar)*
Yo escribo `N` + elijo score (A por default) y aprieto "Enriquecer". El sistema toma las **N más nuevas clasificadas de ese score con enriquecimiento vacío** y corre las APIs en cadena, de barato a caro con filtros:
1. **Google** valida y normaliza dirección
2. Solo las que pasaron el filtro anterior → **Enformion** busca email del dueño
3. Solo las que consiguieron email → **ZeroBounce** valida que ese email exista y reciba

Las que consiguen contacto válido en toda la cadena quedan listas para campaña. **Antes de disparar el sistema muestra el costo estimado** (basado en el N + costos unitarios de cada API) y pide confirmación. **Aquí se gasta**, solo sobre las N que elegí.

### Bloque 4 — Campañas *(segunda parte, más adelante)*
Vista con filtros en la tabla (vertical, score, fecha, `nunca contactado`, `dirección validada`). El filtro me muestra cuántos registros coinciden. Después yo escribo cuántos mandar (puede ser menos que los que coinciden — subset) y aprieto "Enviar cartas" o "Enviar emails". Cada acción muestra costo estimado antes de confirmar. Conecta con el sistema de cartas físicas y con **Resend** (dominio de marketing separado — ver nota abajo) para los emails.

---

## Las APIs que usa el sistema (los conectores)

| API | Para qué | Cuándo se llama | Cuesta |
|---|---|---|---|
| **Claude Haiku** | Clasificar (score, vertical, perfil del dueño) | Bloque 2 | Centavos (tokens) |
| **Google API** | Validar/normalizar dirección | Bloque 3 | Por consulta |
| **Enformion (u otra)** | Conseguir el email del dueño | Bloque 3 | Por consulta |
| **ZeroBounce** | Validar que el email exista y reciba | Bloque 3 | Por consulta |
| **Resend** | Enviar los emails de campaña | Bloque 4 | Por envío |

> **Nota sobre Resend y el envío masivo:** Resend ya manda los emails de confirmación de opabiz. Pero mandar miles de emails de **marketing** es distinto a los de confirmación: hay temas de **reputación de dominio y entregabilidad**. Si se manda una campaña grande desde el mismo dominio que usan los correos de clientes, se puede dañar la entrega de los emails importantes. Esto se maneja con un **dominio separado para marketing** y envíos escalonados. Se diseña en el Bloque 4, pero queda anotado desde ya.

---

## Decisiones embutidas

| Decisión | Por qué |
|---|---|
| Todo el sistema vive en la app de opabiz (Vercel) | Mismo lugar que el panel y el cron. Sin PC, sin servidor extra, sin depender de Code para operar. |
| Cron en Vercel, **no Hetzner** | Cerrar la dependencia de un servidor fijo. Hetzner solo se usó para la carga inicial; ya cumplió. |
| Dos bases Turso separadas (A producción / B marketing) | Que el enriquecimiento pesado nunca afecte la búsqueda de nombres que el cliente usa en vivo. |
| Base B = una sola tabla con columnas-nivel | Más simple que mover LLC entre bases. Se filtra por columnas, nunca se pierde una. |
| `filing_date` como eje central | La frescura ES el valor del negocio. Una LLC vieja no sirve para marketing de "LLC nueva". |
| Control por `procesada`, no por orden de fecha | Garantiza no repetir data aunque las fechas se solapen. |
| Clasificar (gratis) separado de enriquecer (pago) | Saber dónde están las buenas sin gastar; gastar solo sobre las elegidas. |
| Presupuesto por volumen, no por día | Yo pongo el número de enriquecimientos; el sistema nunca lo excede. |
| Enriquecer en cadena barato → caro con filtros | No pagar por buscar email de una LLC cuya dirección ya se descartó. |
| Construir por bloques (1 cron, 2 clasificar, 3 enriquecer, 4 campañas) | Cada bloque se prueba solo. Evita el caos de construir todo de golpe. |
| Las no-enriquecidas no se borran | No pesan, y muchas sirven para carta física o para reintento futuro. |

---

## Estado y pendientes

| Bloque | Estado |
|---|---|
| **Bloque 1 — Cron nocturno** | ✅ **IMPLEMENTADO 2026-06-26** — corre todas las noches a las 06 UTC sin intervención. Ver doc 26 sección "Implementación del cron Sunbiz Bloque 1" para detalle técnico. Base actual: 3,956,123 registros, integridad verificada (sunbiz_corps == sunbiz_fts, 0 duplicados). |
| **Bloque 2 — Clasificación** | **Diseño acordado 2026-07-16.** Input `N` + botón "Clasificar" → FIFO por `filing_date` sobre las `procesada = no`. Ver sección "Diseño del panel" arriba. Pendiente implementar (Claude Haiku + endpoint + UI en `/admin/campaigns`). |
| **Bloque 3 — Enriquecimiento** | **Diseño acordado 2026-07-16.** Input `N` + score + botón "Enriquecer" → cadena Google → Enformion → ZeroBounce con filtros de barato a caro. Costo estimado antes de disparar. Pendiente implementar. |
| **Bloque 4 — Campañas (cartas + emails)** | **Diseño acordado 2026-07-16** (filtros en tabla + input `N` + botón por canal). Segunda parte diferida. Incluye el tema de dominio de marketing para Resend. |

---

## Relacionados

- `06_busqueda_nombres_sunbiz.md` — la base de búsqueda de nombres de opabiz (Base A) que el cron también actualiza
- `07_panel_admin.md` — el panel desde donde se operan las campañas
- `12_marketing_automation_campanas.md` — la pantalla de Marketing Campaigns
- `SERVICIOS_EXTERNOS.md` — resumen de costos de todas las APIs (Haiku, Google, Enformion, ZeroBounce, Resend, Turso)
