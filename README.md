# alejandraherreros.com

Sitio web de **Alejandra Herreros Bofill**, profesora particular de **Física y Matemática** en Chile (formada en la Pontificia Universidad Católica de Chile, 25 años de experiencia). Es una **reconstrucción estática** del antiguo sitio WordPress, pensada para que el contenido se edite fácilmente (Nunjucks + JSON), se haga commit y se publique solo.

- **Producción:** https://alejandraherreros.com _(en vivo una vez apuntado el DNS a GitHub Pages — ver [Setup pendiente](#setup-pendiente-una-sola-vez))_
- **Repositorio:** https://github.com/pedrofuentes/alejandraherreros.com (público)
- **Idioma del sitio:** español de Chile (`es-CL`)

## Stack

- **Eleventy (11ty) v3** — generador de sitios estáticos (Nunjucks + Markdown)
- **Cero JavaScript** en el sitio público (solo una mejora progresiva opcional en el formulario)
- **CSS propio** con tokens de diseño; fuentes **Oswald + Roboto** self-hosted
- **GitHub Pages + GitHub Actions** para build y deploy (acciones fijadas por SHA)
- **Web3Forms** para el formulario de contacto (sin backend)

## Estructura del proyecto

```txt
.eleventy.js                    Configuración de Eleventy (entrada src/, salida _site/)
.github/workflows/deploy.yml    Build + deploy a GitHub Pages
CNAME                           Dominio custom: alejandraherreros.com
AGENTS.md                       Guía de contenido: modelo, recetas y convenciones
scripts/migrate-wordpress.mjs   Importador (único) de contenido/media desde WordPress
src/
  _data/site.json               Datos compartidos: nombre, nav, contacto, descripción
  _includes/
    layouts/base.njk            Shell HTML (head/SEO, header, footer)
    partials/                   header, footer, seo-head, contact-form y macros (componentes)
  assets/css/                   tokens.css, styles.css, contact-form.css
  assets/fonts/                 Oswald + Roboto (woff2, self-hosted)
  assets/images/                imágenes del sitio
  assets/og-default.jpg         imagen para redes sociales (Open Graph)
  *.njk                         una página por URL
  404.njk · robots.njk · sitemap.njk
```

Páginas y URLs (se preservan los slugs del sitio original para no perder SEO):

| Archivo | URL |
| --- | --- |
| `src/index.njk` | `/` |
| `src/clases.njk` | `/clases/` |
| `src/trayectoria.njk` | `/trayectoria/` |
| `src/recomendaciones.njk` | `/recomendaciones/` |
| `src/contact-us.njk` | `/contact-us/` (Contacto) |
| `src/leer-mas-programacion.njk` | `/leer-mas-programacion/` |

## Desarrollo local

Requiere **Node 22** (ver `.nvmrc`).

```sh
npm install
npm run serve     # servidor local con recarga en http://localhost:8080
npm run build     # build de producción en _site/
npm run clean     # borra _site/
```

## Editar contenido

- **Textos de una página:** editar el `src/<página>.njk` correspondiente. Los textos van dentro de las llamadas a macros (`ui.section(...)`, `ui.hero(...)`, `ui.featureCard(...)`) o en los bloques `<div class="prose">…</div>`.
- **Nav, email de contacto, clave de Web3Forms y descripción global:** editar `src/_data/site.json`.
- **Colores y tipografías:** editar `src/assets/css/tokens.css` (variables CSS).
- **Imágenes:** poner el archivo en `src/assets/images/` y referenciarlo como `/assets/images/<archivo>` con un `alt` descriptivo en español.

Los componentes reutilizables (`hero`, `section`, `cardGrid`, `featureCard`, `testimonial`, `cta`, `button`) están en `src/_includes/partials/macros.njk`. Recetas completas (incluido cómo agregar una página nueva) en [`AGENTS.md`](./AGENTS.md).

## Deploy

Cada **push a `main`** dispara GitHub Actions (`.github/workflows/deploy.yml`), que construye Eleventy y publica `_site/` en GitHub Pages automáticamente (en ~1–2 minutos). Todas las acciones están fijadas a un **SHA de commit de 40 caracteres** con un comentario `# vX.Y.Z`.

```sh
git add -A
git commit -m "Actualiza contenido del sitio"
git push origin main
```

Identidad de git del proyecto: `pedrofuentes <git@pedrofuent.es>`. Los commits hechos por Copilot terminan con:

```txt
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

## Setup pendiente (una sola vez)

El sitio ya está **construido y desplegado** en GitHub Pages. Quedan dos pasos manuales que debe hacer la persona dueña del sitio. El sitio WordPress actual sigue funcionando hasta que se cambie el DNS, así que no hay interrupción.

### 1. Apuntar el DNS a GitHub Pages

El dominio custom `alejandraherreros.com` ya está configurado en GitHub. Para dejarlo en vivo, apuntar el DNS del dominio:

- **Apex `alejandraherreros.com` → registros `A`:**
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- **(Opcional, IPv6) registros `AAAA`:**
  - `2606:50c0:8000::153`
  - `2606:50c0:8001::153`
  - `2606:50c0:8002::153`
  - `2606:50c0:8003::153`
- **`www` → registro `CNAME`** hacia `pedrofuentes.github.io`

Después, en **Settings → Pages** del repositorio, activar **Enforce HTTPS** (una vez que el DNS propague).

### 2. Activar el formulario de contacto

El formulario usa **Web3Forms**. Mientras no haya clave configurada, la página de Contacto muestra un aviso con un enlace `mailto:` de respaldo. Para activarlo:

1. Crear una clave gratis en https://web3forms.com (es una clave **pública** client-side; no es un secreto).
2. En `src/_data/site.json`, completar `contact.email` (correo de destino) y `contact.web3formsAccessKey`:

   ```json
   "contact": {
     "email": "tu-correo@dominio.cl",
     "web3formsAccessKey": "TU_ACCESS_KEY"
   }
   ```

3. Commit + push (se despliega solo).

## Cómo se construyó

Reconstrucción del sitio WordPress (tema BoldGrid/Crio) como sitio estático:

- **Migración** del contenido y las imágenes desde el sitio original con `scripts/migrate-wordpress.mjs` (`npm run migrate`, uso único/legacy).
- **Diseño limpio** propio, conservando la marca (azul `#337AB7`, tipografías Oswald/Roboto) y **todos los slugs** originales para no romper el SEO.
- **Contenido honesto:** se conservan los textos reales; las recomendaciones del sitio antiguo eran texto de relleno (lorem ipsum), por lo que la página de Recomendaciones queda como invitación a dejar testimonios reales, sin inventar reseñas.
- **SEO:** `sitemap.xml`, `robots.txt`, canonical, Open Graph/Twitter con imagen social (`assets/og-default.jpg`), favicons y página 404 propia.

## Guía de contenido

Ver [`AGENTS.md`](./AGENTS.md) para el mapa completo del repositorio, el modelo de contenido, recetas de edición paso a paso, convenciones y el setup pendiente.
