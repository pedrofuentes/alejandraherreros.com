# AGENTS.md — guía de contenido para alejandraherreros.com

## 1. Overview

Este repositorio contiene el sitio brochure de **Alejandra Herreros Bofill**, profesora particular de **Física y Matemática** formada en la **Pontificia Universidad Católica de Chile (PUC)**. El sitio está pensado para estudiantes, apoderados y personas que buscan clases particulares en Chile.

La reconstrucción deja el sitio en una arquitectura simple para que la dueña del contenido, o un agente de IA, pueda actualizar textos editando **plantillas Nunjucks (`.njk`)** y datos **JSON**, hacer commit y dejar que CI publique automáticamente.

- **Stack:** Eleventy (11ty) v3, Nunjucks, Markdown, CSS estático y cero JavaScript en el sitio público.
- **Idioma de trabajo:** español de Chile, `es-CL`.
- **Dominio:** `https://alejandraherreros.com`.
- **Deploy:** GitHub Pages, mediante GitHub Actions al hacer push a `main`.
- **Repositorio público:** `pedrofuentes/alejandraherreros.com`.

## 2. Repository map

```txt
.eleventy.js
  Configuración de Eleventy: entrada en src/, salida en _site/, includes en src/_includes/, data en src/_data/ y passthrough de src/assets/.

package.json
  Scripts del proyecto: build (eleventy), serve, clean y migrate.

.nvmrc
  Versión recomendada de Node: 22.

src/_data/site.json
  Datos compartidos del sitio: name, shortName, tagline, lang/locale, url, description, author, credentials, contact.email, contact.web3formsAccessKey, nav[] y social[].

src/assets/css/tokens.css
  Tokens de diseño: paleta "cuaderno científico" (papel cálido #f4eede, azul Prusia #123c5a, acento ocre #b0761a), tipografías Fraunces/Newsreader/IBM Plex Mono, escala de espaciado, radios, sombras y aliases semánticos.

src/assets/css/styles.css
  Estilos principales del sitio. Usa los tokens de tokens.css e incluye la base visual, tipografía, layout, header, footer, cards y botones. También es el lugar previsto para @font-face de fuentes self-hosted en src/assets/fonts/.

src/assets/css/contact-form.css
  Estilos del formulario de contacto.

src/assets/images/
  Imágenes del sitio. Eleventy las copia a /assets/images/ en el sitio publicado.

src/assets/fonts/
  Fuentes self-hosted del sitio, cuando estén presentes. Eleventy las copia a /assets/fonts/.

src/_includes/layouts/base.njk
  Shell HTML base: <head>, SEO, header, contenido principal, footer y hojas de estilo.

src/_includes/partials/
  Parciales reutilizables como header.njk, footer.njk, seo-head.njk, contact-form.njk y componentes visuales. Algunos parciales pueden variar por track, pero la regla es mantener contenido reutilizable aquí.

src/<slug>.njk
  Una página Nunjucks por URL, con front matter YAML y macros reutilizables. Páginas actuales: index.njk, clases.njk, trayectoria.njk, recomendaciones.njk, contact-us.njk y leer-mas-programacion.njk.

src/404.njk
  Página 404 estática.

src/robots.njk
  robots.txt generado por Eleventy.

src/sitemap.njk
  sitemap.xml generado por Eleventy.

.github/workflows/deploy.yml
  Workflow de GitHub Actions que construye el sitio y lo publica en GitHub Pages al hacer push a main. Si todavía no existe en este worktree, debe mantenerse con esa responsabilidad cuando se agregue.

scripts/migrate-wordpress.mjs
  Importador legacy de contenido/media desde WordPress. Es de uso único vía npm run migrate; no se usa para ediciones normales.

CNAME
  Dominio custom para GitHub Pages: alejandraherreros.com.
```

## 3. Content model

### Páginas

Cada URL pública principal vive como una plantilla Nunjucks (`.njk`) en `src/`, con front matter YAML y componentes reutilizables (macros) para componer la página sin JavaScript:

```njk
---
layout: layouts/base.njk
title: Clases
description: Clases de Física y Matemática individuales o grupales...
---
{% import "partials/macros.njk" as ui %}

{% call ui.section("clases", "Clases", "Título de la sección", "Texto introductorio.") %}
  <div class="prose">
    <p>Contenido de la página. Edita el texto entre las etiquetas.</p>
  </div>
{% endcall %}
```

Para editar el texto de una página, cambia los textos dentro de las llamadas a macros (por ejemplo el título o la introducción de `ui.section(...)`, o el texto de `ui.featureCard(...)`) o el contenido dentro de los bloques `<div class="prose">…</div>`. Los componentes disponibles (`hero`, `section`, `cardGrid`, `featureCard`, `testimonial`, `cta`, `button`) están documentados en `src/_includes/partials/macros.njk`.

Campos base de front matter:

- `layout`: normalmente `layouts/base.njk`.
- `title`: título humano de la página. En la home puede omitirse si el layout usa el nombre del sitio.
- `description`: descripción SEO breve y específica.
- Campos estructurados adicionales: se pueden agregar cuando una página o componente los necesite, manteniendo nombres claros y documentando el uso cerca del contenido.

### Datos globales

`src/_data/site.json` es la fuente de verdad para contenido compartido:

- nombre del sitio: `name`, `shortName`;
- frase corta: `tagline`;
- idioma y locale: `lang: "es-CL"`, `locale: "es_CL"`;
- URL canónica y descripción general;
- contacto: `contact.email`, `contact.web3formsAccessKey`;
- navegación principal: `nav[]`.

### Diseño y componentes

- Los colores, fuentes, escala de espaciado y tokens visuales se cambian en `src/assets/css/tokens.css`.
- Los estilos de layout y componentes se mantienen en `src/assets/css/styles.css` y CSS específico como `contact-form.css`.
- Layouts y componentes reutilizables van en `src/_includes/`, especialmente `layouts/base.njk` y `partials/`.
- Mantener el sitio **sin JavaScript del lado cliente** salvo que una decisión futura lo justifique explícitamente.

### Slugs y URLs actuales

Preservar estos slugs para no romper SEO, links externos ni historial del sitio:

| Archivo | URL |
| --- | --- |
| `src/index.njk` | `/` |
| `src/clases.njk` | `/clases/` |
| `src/trayectoria.njk` | `/trayectoria/` |
| `src/recomendaciones.njk` | `/recomendaciones/` |
| `src/contact-us.njk` | `/contact-us/` |
| `src/leer-mas-programacion.njk` | `/leer-mas-programacion/` |

No renombrar `contact-us` aunque el texto visible sea “Contacto”, porque el slug puede tener valor SEO/histórico.

## 4. Recipes

### Update copy on an existing page

1. Abrir el archivo de la página:
   - Home: `src/index.njk`
   - Clases: `src/clases.njk`
   - Trayectoria: `src/trayectoria.njk`
   - Recomendaciones: `src/recomendaciones.njk`
   - Contacto: `src/contact-us.njk`
   - Programación de clases: `src/leer-mas-programacion.njk`
2. Editar los textos dentro de las llamadas a macros (`ui.section(...)`, `ui.hero(...)`, `ui.featureCard(...)`) o dentro de los bloques `<div class="prose">…</div>`.
3. Si cambia el foco de la página, actualizar también `description`.
4. Probar localmente:

```sh
npm install
npm run serve
```

5. Revisar la página en el navegador y confirmar que los links siguen funcionando.

### Update the bio / trayectoria

1. Editar `src/trayectoria.njk`.
2. Mantener el contenido en español chileno, tono profesional y cercano.
3. Conservar hechos importantes: nombre completo, formación PUC, experiencia docente y foco en Física/Matemática.
4. Si el resumen SEO cambia, editar `description` en el front matter.
5. Previsualizar con:

```sh
npm run serve
```

### Change the nav, contact email, or Web3Forms access key

Editar `src/_data/site.json`.

Ejemplo para contacto:

```json
"contact": {
  "email": "contacto@alejandraherreros.com",
  "web3formsAccessKey": "TU_ACCESS_KEY_PUBLICA"
}
```

Ejemplo para navegación:

```json
"nav": [
  { "label": "Inicio", "url": "/" },
  { "label": "Clases", "url": "/clases/" },
  { "label": "Trayectoria", "url": "/trayectoria/" },
  { "label": "Recomendaciones", "url": "/recomendaciones/" },
  { "label": "Contacto", "url": "/contact-us/" }
]
```

Reglas:

- `label` es el texto visible en el menú.
- `url` debe terminar con `/`.
- No cambiar slugs existentes salvo que se haya planificado una redirección.
- La key de Web3Forms es una key pública client-side; no poner secretos privados en el repo.

### Add a new page

1. Crear `src/<slug>.njk`, por ejemplo `src/preguntas-frecuentes.njk`.
2. Agregar front matter mínimo:

```njk
---
layout: layouts/base.njk
title: Preguntas frecuentes
description: Preguntas frecuentes sobre las clases particulares de Física y Matemática de Alejandra Herreros.
---
{% import "partials/macros.njk" as ui %}

{% call ui.section("faq", "Preguntas frecuentes", "Preguntas frecuentes") %}
  <div class="prose">
    <p>Contenido de la nueva página...</p>
  </div>
{% endcall %}
```

3. La URL publicada será `/<slug>/`, por ejemplo `/preguntas-frecuentes/`.
4. Si debe aparecer en el menú, agregarla a `site.nav` en `src/_data/site.json`:

```json
{ "label": "Preguntas frecuentes", "url": "/preguntas-frecuentes/" }
```

5. Ejecutar:

```sh
npm run build
```

6. Revisar que el build pase y que el link aparezca donde corresponde.

### Add or replace an image

1. Copiar la imagen a `src/assets/images/`, por ejemplo:

```txt
src/assets/images/alejandra-clases-fisica.jpg
```

2. Referenciarla desde la plantilla con la ruta pública:

```html
<img src="/assets/images/alejandra-clases-fisica.jpg" alt="Alejandra Herreros haciendo una clase particular de Física" loading="lazy" />
```

3. Usar nombres de archivo descriptivos, en minúsculas y con guiones.
4. Incluir siempre `alt` significativo en español. No usar `alt="imagen"`; describir la información útil de la imagen.
5. Si se reemplaza una imagen existente, mantener el mismo nombre solo si no cambia el significado de la imagen.

### Change brand colors or fonts

1. Editar `src/assets/css/tokens.css`.
2. Cambiar variables, no estilos sueltos, cuando sea posible:

```css
:root {
  --paper: #f4eede;        /* fondo papel cálido */
  --blue: #123c5a;         /* azul Prusia */
  --ochre: #b0761a;        /* acento ocre */
  --ink: #1b2230;          /* tinta / títulos */
  --font-display: "Fraunces", Georgia, serif;   /* títulos */
  --font-body: "Newsreader", Georgia, serif;     /* texto */
  --font-mono: "IBM Plex Mono", ui-monospace, monospace; /* etiquetas / notas */
}
```

3. Si se agregan fuentes self-hosted, poner archivos en `src/assets/fonts/` y declararlas con `@font-face` desde el CSS principal.
4. Probar contraste, foco visible y legibilidad móvil antes de publicar.

### Build & preview locally

Primera vez:

```sh
npm install
npm run serve
```

Uso habitual:

```sh
npm run serve
```

Build sin servidor local:

```sh
npm run build
```

Otros scripts útiles:

```sh
npm run clean
```

El build genera `_site/`, que no debe commitearse.

### Deploy

1. Hacer commit de los cambios.
2. Push a `main`.
3. GitHub Actions ejecuta el build y publica en GitHub Pages automáticamente.
4. El sitio normalmente queda actualizado en uno o dos minutos.

Comandos típicos:

```sh
git status
git add AGENTS.md README.md src/<archivo-editado>.md src/_data/site.json
git commit -m "Actualiza contenido del sitio"
git push origin main
```

Para commits hechos por Copilot, ver la convención de trailer más abajo.

### One-time WordPress import

El importador desde WordPress es legacy y no se usa para ediciones normales.

```sh
npm run migrate
```

Usarlo solo si se necesita repetir o auditar la migración inicial de contenido/media desde WordPress. Después de una importación, revisar manualmente Markdown, imágenes, slugs y textos antes de commitear.

## 5. Conventions

- Escribir todo el contenido público en **español chileno (`es-CL`)**.
- Tono: claro, profesional, cercano y confiable; evitar marketing genérico.
- Preservar slugs existentes: `/`, `/clases/`, `/trayectoria/`, `/recomendaciones/`, `/contact-us/`, `/leer-mas-programacion/`.
- Mantener el sitio **zero-JS**: preferir HTML semántico, Markdown, Nunjucks y CSS.
- Cuidar accesibilidad:
  - una jerarquía de headings clara;
  - links con texto descriptivo;
  - imágenes con `alt` útil;
  - buen contraste;
  - formularios con labels y mensajes comprensibles.
- No commitear `_site/`, `node_modules/`, `.env` ni secretos.
- La identidad git esperada para este proyecto es:

```sh
git config user.name "pedrofuentes"
git config user.email "git@pedrofuent.es"
```

- Todo commit creado por Copilot debe terminar con este trailer:

```txt
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

Ejemplo:

```sh
git commit -m "Actualiza textos de trayectoria

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

## 6. Setup still required

El formulario de contacto (Web3Forms) **ya está configurado** y GitHub Pages **ya está habilitado** (Source: GitHub Actions). Queda **una** tarea de una sola vez para la persona dueña del sitio:

1. **Configurar DNS de `alejandraherreros.com` para GitHub Pages**
   - Apex `alejandraherreros.com`: apuntar registros `A`/`AAAA` a las IPs oficiales de GitHub Pages.
   - `www`: crear un `CNAME` hacia `pedrofuentes.github.io`.
   - Mantener el archivo `CNAME` con `alejandraherreros.com` (ya está en el repo).
   - Después, activar **Enforce HTTPS** en Settings → Pages cuando el DNS propague.

Ya realizado (referencia): la clave pública de Web3Forms está en `src/_data/site.json` (`contact.web3formsAccessKey`); para cambiarla o cambiar el correo de destino, edita ese campo o gestiona el correo en el panel de Web3Forms. En la página de Contacto no se muestra ningún correo público (solo el formulario).
