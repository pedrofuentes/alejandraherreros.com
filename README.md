# alejandraherreros.com

Sitio estático de **Alejandra Herreros Bofill**, profesora particular de Física y Matemática en Chile.

Stack: Eleventy (11ty) v3, Nunjucks, Markdown, CSS estático y cero JavaScript en el sitio público. El contenido se edita principalmente en `src/*.md` y `src/_data/site.json`.

## Quick start

```sh
npm install
npm run serve
```

Build de producción:

```sh
npm run build
```

## Deploy

El sitio se publica en GitHub Pages. Los cambios se despliegan al hacer push a `main`: GitHub Actions construye Eleventy y publica el resultado automáticamente.

## Content guide

Ver [`AGENTS.md`](./AGENTS.md) para el mapa del repositorio, modelo de contenido, recetas de edición, convenciones y setup pendiente.
