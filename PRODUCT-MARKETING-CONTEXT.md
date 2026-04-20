# MyBusinessFormation.com — Contexto de Marketing

**Última actualización:** 2026-04-20
**Responsable del documento:** Ethan (founder) + Claude (CMO asistido)

---

## Qué es el producto

MyBusinessFormation.com es una plataforma online en español para formar LLCs y Corporaciones en el Estado de Florida. Opera 100% digital (sin oficinas físicas visibles al público) y entrega el Certificate of Formation emitido por la Florida Division of Corporations, más documentos complementarios (EIN, Operating Agreement, ITIN, BOI Filing) según el paquete. Rango de precio: $49 a $249 + cargo estatal de FL.

## Modelo de negocio

**3 paquetes de formación** (one-time, más cargo estatal de FL):

| Paquete | Precio | Incluye |
|---------|--------|---------|
| **Basic** | $49 | Registro, búsqueda de nombre, Certificate of Formation |
| **Standard** ⭐ | $149 | Basic + EIN + Guía Bancaria + Registered Agent (año 1 gratis) |
| **Premium** | $249 | Standard + Operating Agreement + Filing acelerado + ITIN + DBA + Amendment |

**Cargo estatal de Florida** (pasa directo al Estado, no margen nuestro):
- LLC: $125
- Corporación: $70

**Add-ons individuales** (venta adicional o suelta):
- EIN $49 · Operating Agreement $79 · Expedited $99 · Bank Guide $29 · ITIN $69 · DBA $49 · Amendment $59 · Virtual Address $29/mes · Registered Agent recurring (TBD año 2+)

**18 servicios individuales** también vendibles por separado (ver [servicios/page.tsx](backend/app/servicios/page.tsx)): Registered Agent, EIN, Operating Agreement, ITIN, DBA, Virtual Address, Annual Report, Amendment, Banking Resolution, Business Tax Receipt, Sales Tax Registration, Exclusive Formation Guide, Good Standing, S-Corp Election, Foreign LLC, Business License, Dissolution, Tax Account Closure.

**Revenue streams:**
1. Paquetes one-time (principal)
2. Add-ons one-time (upsell en checkout)
3. Registered Agent recurrente (año 2 en adelante) → LTV largo
4. Virtual Mailing Address mensual → LTV recurrente
5. Annual Report filing (anual) → retención año tras año
6. Dissolution / Tax Account Closure (cuando cierran negocio — revenue hasta el final)

**Unit economics estimados:**
- AOV probable (mix Basic/Standard/Premium): ~$145 + $125 FL fee = **~$270 ticket promedio**
- Margen neto por orden (sin contar FL fee): ~60-70% (después de procesamiento, Resend, Supabase, Vercel)
- LTV con Registered Agent año 2-5 + Annual Report recurrente: **$350-500** estimado

## Problema que resuelve

Un latino en Florida que quiere formalizar su negocio enfrenta esta fricción real:

1. **Barrera de idioma**: LegalZoom/Bizee/ZenBusiness son en inglés. Formularios con terminología legal confusa ("Registered Agent", "Articles of Organization", "Operating Agreement", "BOI Filing") que no tienen traducción intuitiva. Aunque la persona hable inglés decente, meter datos personales en un sitio legal en inglés genera desconfianza.

2. **Sin SSN**: Muchos latinos (emprendedores inmigrantes, visa holders, residentes con ITIN) no tienen Social Security Number. LegalZoom asume que sí — y cuando el usuario llega al paso del EIN, se atora. Nadie le explica que sin SSN puede usar ITIN o aplicar por EIN vía formulario SS-4 con proceso alterno.

3. **Miedo al error legal**: El mercado latino tiene aversión a "meterse en problemas con el gobierno". Un sitio en inglés aumenta esa ansiedad. Prefieren pagar más por alguien que les hable y les explique que por un formulario barato que no entienden.

4. **Desconocimiento del paisaje regulatorio**:
   - BOI Filing (obligatorio desde 2024 por FinCEN — penalidades hasta $500/día) — la mayoría de latinos no lo conoce.
   - Annual Report FL (deadline 1 de mayo, multa $400 si se pasa).
   - Registered Agent obligatorio por ley FL.
   - Differences LLC vs Corp para propósitos fiscales.

5. **Costo oculto y upsells agresivos en competidores**: LegalZoom anuncia $149 pero cobra extras que suben el ticket a $400-600. Genera resentimiento post-compra.

6. **Soporte inexistente en español**: LegalZoom/Bizee tienen chatbots o agentes en inglés. Si necesitas aclarar algo durante o después de tu orden, te toca esperar en cola o recurrir a Google Translate.

## Público objetivo

### Demografía núcleo
- **Edad**: 28-52 años
- **Ubicación primaria**: Florida — Miami-Dade, Broward, Orange (Orlando), Hillsborough (Tampa), Duval (Jacksonville), Osceola
- **País de origen típico**: Cuba, Venezuela, Colombia, República Dominicana, México, Puerto Rico (internos), Argentina, Perú
- **Tiempo en USA**: 1-15 años (incluye recién llegados y establecidos)
- **Idioma primario**: español; inglés intermedio o funcional
- **Situación migratoria**: ciudadano, residente permanente, TPS, asilo, parole humanitario, visa B1/B2 convertida, incluso ITIN holders sin estatus definido (forman LLC porque es legal hacerlo sin estatus)
- **Ingreso anual**: $35K-$120K (segmento wide — desde trabajadores con side hustle hasta emprendedores establecidos)
- **Tipo de negocio que quieren formar**:
  - Construcción / handyman / remodelación (constructores, plomeros, eléctricos)
  - Limpieza residencial o comercial
  - Restaurantes / food trucks / catering
  - Salones de belleza / barberías
  - Transporte (Uber/Lyft, delivery, fletes)
  - Servicios profesionales (contadores, consultores, agentes de seguros)
  - E-commerce / dropshipping / Amazon FBA
  - Inmobiliaria (agentes de bienes raíces)
  - Tecnología / marketing digital / diseño

### Pain points específicos
- "Quiero proteger mis bienes personales de demandas"
- "Mi pastor / mi primo / mi mecánico me dijo que abra una LLC pero no sé cómo"
- "Fui a H&R Block y me dijeron que sin LLC no puedo deducir gastos del negocio"
- "Quiero abrir cuenta bancaria a nombre de mi negocio"
- "Necesito factura para cobrar a mis clientes corporativos"
- "Un cliente me pidió W-9 y no sé qué poner sin LLC"
- "Tengo ITIN pero no SSN — ¿puedo hacerlo?"
- "LegalZoom me cobró $300 y aún no entiendo qué compré"

### Presupuesto típico
- Piensan en rango $50-$300 para formación
- Dispuestos a pagar premium por servicio en español y soporte humano
- Muy sensibles a "cargos ocultos" — transparencia en pricing es diferenciador

### Nivel de inglés
- **60-70%** intermedio-funcional (puede leer emails simples en inglés, pero no un contrato legal)
- **20-30%** bajo (necesita traducción hasta para navegar la web)
- **10%** alto/bilingüe (usa nuestro servicio por preferencia cultural, no necesidad)

## Propuesta de valor única frente a LegalZoom/Bizee/ZenBusiness

**"Tu LLC en Florida, formada por latinos que entienden tu realidad — en español, sin SSN obligatorio, con todo incluido desde $49."**

Puntos centrales:

1. **100% en español real** — no traducción automática, no Spanglish. Formularios, términos, soporte, emails, portal de seguimiento — todo pensado en español latinoamericano (no ibérico ni neutro europeo).

2. **Diseñado para no-residentes y personas sin SSN** — proceso claro para usar ITIN, aplicar EIN por fax (fórmula SS-4 extendida), y guías específicas para bancos que aceptan ITIN.

3. **Incluimos BOI Filing sin cargo extra** — FinCEN exige desde 2024; muchos competidores lo cobran aparte o ni lo mencionan (penalización hasta $500/día por no presentarlo).

4. **Especialización 100% Florida** — no "50 estados" genérico. Conocemos Sunbiz, los plazos, los requisitos específicos de cada condado para BTR (Business Tax Receipt), el Annual Report deadline, las reglas de nombres, las palabras reservadas.

5. **Portal de seguimiento en tiempo real** — cliente ve exactamente en qué paso va (Order Received → Payment → Name Check → Filed → Approved → Completed). LegalZoom tiene esto pero en inglés; Bizee no lo tiene tan claro.

6. **Precio honesto sin upsells agresivos** — $49 Basic cubre lo realmente necesario. Upgrades opcionales, no trampas.

## Competencia principal

| Competidor | Precio base | Idioma | Fortaleza | Debilidad frente a nosotros |
|------------|-------------|--------|-----------|-----------------------------|
| **LegalZoom** | $149 base (termina $400-600 con extras) | Inglés; "español" es traducción mecánica | Marca #1 reconocida, infraestructura madura | Upsells agresivos, soporte mediocre en español, asume SSN |
| **Bizee (ex-Incfile)** | $0 + state fee (Silver); hasta $348 (Platinum) | Inglés | Precio entry gratis — imán de tráfico | Calidad de servicio variable, sin soporte latino, complica cambios |
| **ZenBusiness** | $0 + state fee (Starter); hasta $349 (Pro) | Inglés | UX moderna, diseño limpio | Igual — nada pensado para latinos; upsells |
| **Northwest Registered Agent** | $39 + state fee | Inglés | Mejor soporte del mercado (en inglés), privacidad | Caro para paquetes completos, marca desconocida en latino |
| **Rocket Lawyer** | $99.99 + state fee | Inglés | Legal + formación combinados | Modelo suscripción confunde; caro real |
| **Competidores latinos pequeños** | $150-500 | Español | Presencia local (Doral, Hialeah) | Precio alto, sin plataforma digital — todo por WhatsApp/oficinas |
| **Asesorías/contadores que cobran por formación** | $200-800 | Español | Confianza personal (referido) | Proceso lento, sin tracking, precio arbitrario |

### Gap de mercado confirmado
No existe un competidor digital-first, en español, con precios agresivos, especializado en Florida, que eduque activamente sobre BOI, ITIN, EIN-sin-SSN y los detalles del ecosistema latino. Los actores "latinos" son offline o semi-digital con precios altos. Los actores digitales son anglo y no hablan español real.

## Diferenciadores frente a la competencia (bullets para copy)

1. **"El único servicio 100% en español hecho por latinos, para latinos en Florida."** — no traducción, no call center en India.
2. **"Sin SSN no es problema — te guiamos paso a paso para que puedas formar tu negocio con ITIN."**
3. **"BOI Filing incluido SIEMPRE en todos nuestros paquetes"** — competencia lo cobra aparte o no lo menciona (riesgo legal).
4. **"Solo trabajamos Florida — por eso sabemos más que cualquier servicio genérico de 50 estados."**
5. **"Precio honesto, sin upsells agresivos: sabes desde el primer clic cuánto vas a pagar, sin sorpresas al final."**
6. **"Portal propio para seguir tu orden en tiempo real, 24/7, en español."**

## Tono de marca

- **Español latino contemporáneo**, NO ibérico ni neutro europeo. Decir "tu negocio", no "vuestro negocio". "Carro", no "coche". "Celular", no "móvil".
- **Profesional pero cálido** — no frío ni corporativo. Registro de WhatsApp de amigo que sabe del tema. No "Estimado usuario" sino "Hola, soy Ethan — te explico".
- **Explicativo, no condescendiente** — asumimos que nuestro cliente es listo pero no conoce el sistema legal gringo. Explicamos términos en inglés cuando aparecen ("Registered Agent" es "Agente Registrado", la persona que recibe documentos legales por ti...).
- **Anti-jerga legal** — evitar "suscrito", "tenor", "fehaciente", "por consiguiente". Usar "firma", "contenido", "seguro", "entonces".
- **Cero disclaimers intimidantes** al inicio del copy — al final, con tamaño discreto pero legible.
- **Empático con la realidad migratoria** — sin prometer lo que no somos (no damos asesoría migratoria, no aprobamos visas, no somos abogados).

### Lenguaje inclusivo de la diversidad
- Neutro de género sin forzar "e" o "x" (mercado latino lo rechaza): usar "la persona que forma su negocio" en vez de "el emprendedor/la emprendedora".
- Evitar estereotipos (no poner solo fotos de restaurantes o construcción — mostrar también mujeres profesionales, parejas, profesionales técnicos).

## Canales activos y plan temporal

Fecha de hoy: **20 abril 2026**
Fecha objetivo de lanzamiento: **15 septiembre 2026** (~5 meses)

| Canal | Activación | Objetivo pre-launch | Objetivo launch |
|-------|------------|--------------------|-----------------| 
| **SEO español** | Día 1 (20 abr) | 25 artículos publicados, primeros 5-8 en top 20 | Top 10 en 10-15 keywords principales |
| **YouTube educativo** | Día 1 (20 abr) | 10 videos publicados, 500-1500 subs | 20 videos, 2K-5K subs, 3-5 videos rankeando |
| **Waitlist + email nurture** | Día 1 (20 abr) | 500-1500 suscriptores | Activar secuencia launch → conversión |
| **TikTok orgánico** | Semana -8 (20 jul) | 20-30 videos, 1K-5K seguidores | 40 videos, tracción viral objetivo 10K+ |
| **Instagram orgánico** | Día 1 (20 abr, soft) | 20 posts educativos, 300-800 seguidores | Pivot a anuncios + reels diarios |
| **Google Ads** | Semana -4 (18 ago) — **adelanto frente a tu brief de 3-4 semanas** | Learning phase + ajuste de creatividades | Escalar presupuesto conforme baje CPA |
| **Meta Ads (FB+IG)** | Semana -4 (18 ago) — **adelanto frente a tu brief de 2-3 semanas** | Superar learning phase (50 conversiones) | Escalar mejores ángulos |
| **Referidos / partnerships** | Post-launch (mes +1) | — | Programa de referidos con contadores |

## Idioma y región

- **Idioma primario**: español latino (ver "Tono de marca" arriba).
- **Idioma secundario**: inglés — versión en `/en/` del sitio es un 2-track futuro, NO prioridad pre-launch.
- **Geo target inicial**: Florida (todo el estado).
- **Sub-geos prioritarios en ads**: Miami-Dade, Broward, Palm Beach, Orange, Hillsborough, Osceola, Duval, Lee.
- **Expansión futura**: Texas (2º mercado latino USA), Nueva York, Nueva Jersey — pero NO antes de validar unit economics en FL.

## Estado actual

### Completadas
- [x] **Etapa 1** — Frontend Next.js en Vercel
- [x] **Etapa 2** — Backend Node/Express en Railway
- [x] **Etapa 3** — Supabase PostgreSQL con Prisma
- [x] **Etapa 7** — Emails automáticos via Resend (4 emails: confirmación, nombres tomados, alerta admin, certificate)
- [x] **Etapa 8** — Panel de Administración con JWT, proxy routes, filtros, subida de PDFs
- [x] **Etapa 9** — Portal del Cliente con login por email + FBFC, timeline de 7 pasos, descarga de documentos
- [x] Motor de PDFs con pdf-lib (5 documentos pre-llenados operativos)
- [x] Página de Servicios con 18 servicios en formato acordeón (redesign 20 abr 2026)

### Pendientes críticas para launch
- [ ] **Etapa 4** — Stripe completo (keys, Elements, webhooks)
- [ ] **Etapa 5** — Búsqueda Sunbiz local (descarga + importación de ~3.5M registros)
- [ ] Verificar dominio en Resend → cambiar from `onboarding@resend.dev` a `noreply@mybusinessformation.com`
- [ ] Apuntar dominio real `mybusinessformation.com` a Vercel (actualmente corre en `mybusinessformation-web.vercel.app`)
- [ ] ITIN W-7 y Annual Report pre-llenado (Etapa 6 — parcialmente completa)

### Pendientes post-launch (Etapa 10)
- [ ] Cloudflare, auditoría de seguridad, pruebas con 10 clientes simulados

## Fecha estimada de lanzamiento oficial

**15 septiembre 2026** (objetivo). Ventana tolerable: **1 septiembre – 15 octubre 2026**.

Razones del target:
- Temporada fiscal Q4 — emprendedores latinos piensan en "abrir LLC antes de fin de año" para deducciones del año fiscal en curso.
- Post-verano — actividad de compra en español digital sube en FL después del verano.
- Evita conflicto con huracanes (peak agosto-septiembre) — pero si golpea, ventana de 30 días de tolerancia.
- Margen de 1 mes antes de Black Friday para establecer tráfico orgánico y validar ads.

## Objetivo de marketing — fase pre-lanzamiento (abril–agosto 2026)

**CONSTRUIR AUTORIDAD Y WAITLIST. No estamos vendiendo aún.** Métricas primarias:

| Métrica | Mínimo | Objetivo | Ambicioso |
|---------|--------|----------|-----------|
| Artículos SEO publicados | 15 | 25 | 30 |
| Artículos en top 20 de Google | 3 | 8 | 12 |
| Videos YouTube publicados | 8 | 12 | 16 |
| Suscriptores YouTube | 300 | 1,000 | 2,500 |
| Waitlist email | 500 | 1,500 | 3,000 |
| Seguidores Instagram | 300 | 800 | 1,500 |
| Seguidores TikTok | 500 | 2,000 | 5,000 |
| Tráfico orgánico web mensual (mes -1) | 2K | 6K | 12K |

## Objetivo de marketing — fase lanzamiento (septiembre–octubre 2026)

**GENERAR PRIMERAS VENTAS REALES.**

| Métrica | Mínimo | Objetivo | Ambicioso |
|---------|--------|----------|-----------|
| Ventas primeros 30 días | 30 | 80 | 150 |
| AOV | $150 | $180 | $220 |
| Revenue primer mes | $4.5K | $14K | $33K |
| CPA (Google Ads) | < $80 | < $50 | < $30 |
| CPA (Meta Ads) | < $100 | < $60 | < $35 |
| CAC blended | < $70 | < $45 | < $25 |
| Conversion rate sitio | 0.8% | 1.5% | 2.5% |
| Ratio waitlist → venta | 2% | 5% | 10% |

## Cumplimiento legal

### Reglas no negociables en todo material de marketing

1. **NO somos abogados.** Siempre usar: *"MyBusinessFormation.com es un servicio de preparación de documentos, no una firma de abogados. No brindamos asesoría legal."* Footer obligatorio en web, emails, landing pages, anuncios (versión corta en ads: "No es asesoría legal / Not legal advice").

2. **NO prometemos resultados migratorios.** Formar una LLC NO otorga estatus migratorio, NO ayuda a visa, NO es vía para green card. Cualquier copy que insinúe lo contrario es ilegal bajo advertising rules.

3. **NO hacer "garantías" de aprobación.** Florida aprueba la formación en >95% de casos, pero nunca prometer "garantizado". Usar "típicamente aprobado en X días".

4. **Disclaimers financieros**: cuando hablemos de "proteger tus bienes" o "separación de finanzas", siempre decir "consulta a un contador certificado para decisiones fiscales".

5. **Claims de competidores**: podemos comparar precios visibles y hechos públicos (LegalZoom cobra $149 base — público en su sitio). NO podemos inventar claims negativos o difamatorios.

6. **Testimoniales reales**: cuando empecemos a tenerlos, siempre con consentimiento escrito y identificación mínima (nombre + ciudad, no dirección completa).

7. **BOI Filing**: somos preparers autorizados según FinCEN pero NO somos representantes legales. Clarificar en copy.

8. **Privacy**: GDPR no aplica pero CCPA sí para algunos usuarios. Tener política de privacidad clara.

### Registros oficiales a mencionar para confianza
- Servicio registrado ante **Florida Division of Corporations**
- Procesamiento de pagos PCI-compliant vía **Stripe**
- Infraestructura alojada en **Vercel / Railway / Supabase** (mencionar si hay sección de seguridad)

---

**Fin del documento de contexto.** Este archivo alimenta el plan de marketing en `PLAN_MARKETING_MBF.md`.
