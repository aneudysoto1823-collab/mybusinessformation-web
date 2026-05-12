# TROUBLESHOOTING — Responsive Design (Etapa 17)

Guía para diagnosticar y resolver problemas relacionados con el diseño responsive implementado en la Etapa 17.

---

## 1. El menú hamburguesa no aparece en mobile

**Síntoma:** En pantallas ≤768px el nav se ve igual que en desktop (horizontal) o simplemente desaparece sin botón.

**Causas y soluciones:**

1. **El CSS de `.hamburger` fue sobrescrito.** Busca en `backend/app/page.tsx` la clase `.hamburger` y verifica que el bloque `@media(max-width:768px)` incluya `display:flex` para esa clase. Si falta, agrégalo.

2. **El botón HTML fue eliminado del body string.** En `page.tsx`, busca `id="hamburger-btn"` en la sección `const body = \`...\``. Debe estar dentro del `<header>` tras el link de Login.

3. **Conflicto con el `display:flex` del `.header-inner`.** El botón hamburguesa vive dentro del wrapper de lang-toggle + login, que tiene `display:flex`. Si ese wrapper cambió a `display:none` en mobile, el botón desaparece con él.

---

## 2. El nav no se cierra al hacer clic en un link

**Síntoma:** El usuario abre el menú, toca un link de ancla (#how, #pricing…) y el menú queda abierto.

**Causa:** El event listener que cierra el nav al hacer clic en links internos está en la sección `<script>` del body de `page.tsx`. Si el script fue editado o el `querySelectorAll('#main-nav a')` no encuentra los elementos, el listener no se registra.

**Solución:**
```javascript
// Debe existir en el bloque <script> de page.tsx:
document.querySelectorAll('#main-nav a').forEach(function(a){
  a.addEventListener('click',function(){
    document.getElementById('main-nav').classList.remove('open');
    document.getElementById('hamburger-btn').classList.remove('open');
  });
});
```
Si se agregan links nuevos al nav con JavaScript dinámico, hay que agregar el listener manualmente a esos elementos también.

---

## 3. Scroll horizontal aparece en alguna página

**Síntoma:** En mobile se puede deslizar horizontalmente — hay contenido que desborda.

**Diagnóstico:**
```javascript
// En la consola del navegador con DevTools mobile:
document.querySelectorAll('*').forEach(el => {
  if (el.offsetWidth > document.documentElement.offsetWidth) console.log(el);
});
```

**Causas comunes:**
- Un `width` fijo (ej. `width:600px`) sin `max-width:100%`
- Un `grid` o `flex` con `gap` que empuja el contenido fuera
- Una imagen sin `max-width:100%` (ya hay `img{max-width:100%}` global en el home, pero si se agrega una imagen nueva sin ese reset puede romper)
- El `body` global tiene `overflow-x:hidden` en el home — si se quita esa regla aparece el scroll horizontal

---

## 4. El formulario de registro (home) se ve mal en mobile

**Síntoma:** El form overlay que aparece al hacer clic en "Start My Business" se ve desbordado o con scroll horizontal en mobile.

**Contexto:** El form overlay tiene sus propias media queries dentro del CSS del home:
- `@media(max-width:820px)` → el layout cambia de flex-row a flex-column
- `@media(max-width:600px)` → el padding del card se reduce
- `@media(max-width:540px)` → los form-row pasan a 1 columna

Estos breakpoints son **independientes** del hamburger; fueron implementados antes de la Etapa 17.

**Si algo del form se ve roto:** Revisar primero si el problema es en el overlay (`.form-overlay`) o en la página principal. El overlay tiene `position:fixed;inset:0` por lo que ocupa pantalla completa — cualquier problema de layout interno es un asunto del form, no del responsive general.

---

## 5. Las páginas de login se ven con demasiado espacio en mobile

**Contexto:** Ambas páginas de login (`/login` y `/client-portal`) tienen un breakpoint a ≤720px/760px que oculta la foto y deja solo el formulario. A ≤480px se reduce el padding del card de `36-44px` a `24px`.

**Si en un teléfono pequeño (375px) el card queda muy apretado:**
- El selector es `@media (max-width: 480px) { .card-form { padding: 24px 20px 20px; } }`
- Reducir el padding lateral a `16px` si hace falta
- El `min-height: unset` ya está aplicado para que el card no sea más alto de lo necesario

---

## 6. Los stats del admin no se ven bien en mobile

**Síntoma:** En un teléfono las 4 tarjetas de stats del dashboard admin (`/admin`) se ven demasiado pequeñas o en una sola fila.

**Implementado en Etapa 17:** A ≤640px el grid pasa a 2 columnas (`repeat(2, 1fr)`). Si el dispositivo es más angosto y las tarjetas siguen siendo incómodas, bajar a `grid-template-columns: 1fr 1fr` con `gap: 8px` en el selector `@media(max-width:375px)`.

**Nota:** El admin está diseñado para uso en desktop. El responsive en admin es un "nice to have" — los admins trabajan en computadoras. No priorizar por encima de las páginas públicas.

---

## 7. Cómo probar responsive sin dispositivo físico

**Chrome DevTools (recomendado):**
1. F12 → ícono de mobile (toggle device toolbar)
2. Seleccionar: iPhone SE (375px), iPhone 14 (390px), iPad (768px)
3. En "Dimensions" → Responsive → probar 375, 480, 768, 1024px manualmente

**Páginas a probar en cada cambio:**
1. `/` (home) — navbar hamburguesa, hero, pricing, footer
2. `/client-portal` — card de login, foto se oculta, formulario
3. `/login` — igual que client-portal
4. `/client-portal/dashboard` — cards, timeline, botones de descarga
5. `/admin` — stats grid, tabla de órdenes (scroll horizontal)

---

## 8. Agregar responsive a páginas nuevas

Para agregar media queries a una página nueva que use el patrón `<style>` tag:

```tsx
// Al final del string CSS, antes del backtick de cierre:
@media (max-width: 768px) {
  /* ajustes tablet/mobile */
}
@media (max-width: 480px) {
  /* ajustes mobile pequeño */
}
```

**Breakpoints estándar del proyecto (Etapa 17):**
- `768px` — tablet / mobile landscape
- `480px` — mobile portrait (iPhone SE y similares)

No inventar breakpoints intermedios sin necesidad. Esto mantiene el CSS predecible.
