import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'migration-output');
const imageDir = path.join(rootDir, 'src', 'assets', 'images');
const extractedAt = new Date().toISOString();
const siteOrigin = 'https://alejandraherreros.com';
const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

const pages = [
  { slug: 'index', url: 'https://alejandraherreros.com/' },
  { slug: 'clases', url: 'https://alejandraherreros.com/clases/' },
  { slug: 'trayectoria', url: 'https://alejandraherreros.com/trayectoria/' },
  { slug: 'recomendaciones', url: 'https://alejandraherreros.com/recomendaciones/' },
  { slug: 'contact-us', url: 'https://alejandraherreros.com/contact-us/' },
  { slug: 'leer-mas-programacion', url: 'https://alejandraherreros.com/leer-mas-programacion/' },
];

const mediaEndpoint = 'https://alejandraherreros.com/wp-json/wp/v2/media?per_page=100&_fields=id,source_url,mime_type,alt_text,media_details';
const likelyProfileUrl = 'https://alejandraherreros.com/wp-content/uploads/2021/03/WhatsApp-Image-2021-03-02-at-7.31.16-PM.jpeg';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});
turndown.remove(['script', 'style', 'noscript']);

const imageMap = new Map();
const pageStats = [];
const failedDownloads = [];
const heroByPage = {};
let headerVideo = { found: false, value: 'none found' };

function log(message) {
  console.log(`[migrate] ${message}`);
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': userAgent, accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function absoluteUrl(value, base) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return null;
  try { return new URL(trimmed, base).href; } catch { return null; }
}

function canonicalImageUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    u.pathname = u.pathname.replace(/-\d{2,5}x\d{2,5}(?=\.(?:jpe?g|png|gif|webp|svg)$)/i, '');
    return u.href;
  } catch {
    return url;
  }
}

function parseSrcset(srcset, base) {
  if (!srcset) return [];
  return srcset.split(',').map((part) => {
    const [rawUrl, descriptor = ''] = part.trim().split(/\s+/, 2);
    const url = absoluteUrl(rawUrl, base);
    const width = descriptor.endsWith('w') ? Number.parseInt(descriptor, 10) : 0;
    const density = descriptor.endsWith('x') ? Number.parseFloat(descriptor) : 0;
    return url ? { url, score: width || density || 0 } : null;
  }).filter(Boolean);
}

function extractCssImageUrls(value, base) {
  const urls = [];
  if (!value) return urls;
  const regex = /url\(([^)]+)\)/gi;
  for (const match of value.matchAll(regex)) {
    const url = absoluteUrl(match[1], base);
    if (url) urls.push(url);
  }
  return urls;
}

function addImage(url, pageSlug = null, details = {}) {
  const canonical = canonicalImageUrl(url);
  const key = canonical;
  const existing = imageMap.get(key) || {
    originalUrl: canonical,
    mime: details.mime || null,
    width: details.width || null,
    height: details.height || null,
    altText: details.altText || '',
    usedOnPages: [],
    pageCandidateUrls: new Set(),
    sourceUrls: new Set(),
  };
  if (details.mime && !existing.mime) existing.mime = details.mime;
  if (details.width && !existing.width) existing.width = details.width;
  if (details.height && !existing.height) existing.height = details.height;
  if (details.altText && !existing.altText) existing.altText = details.altText;
  existing.sourceUrls.add(url);
  if (pageSlug && !existing.usedOnPages.includes(pageSlug)) existing.usedOnPages.push(pageSlug);
  if (pageSlug) existing.pageCandidateUrls.add(url);
  imageMap.set(key, existing);
  return existing;
}

function pageTitle($) {
  const h1 = $('h1').first().text().replace(/\s+/g, ' ').trim();
  const title = $('title').first().text().replace(/\s+/g, ' ').trim().replace(/\s+[|–-]\s+Alejandra Herreros.*$/i, '');
  return h1 || title || '';
}

function cleanMain($, pageSlug) {
  let $main = $('main#main').first();
  if (!$main.length) $main = $('.entry-content').first();
  if (!$main.length) $main = $('#main').first();
  if (!$main.length) $main = $('body').first();

  const $copy = cheerio.load(`<div id="migration-root">${$main.html() || ''}</div>`, { decodeEntities: false });
  const root = $copy('#migration-root');
  root.find('header, nav, footer, script, style, noscript, .qlwapp, #qlwapp, [class*="whatsapp"], .skip-link, .screen-reader-text, .site-header, .site-footer').remove();
  root.find('.entry-header, .page-header, .page-title, .widget-area').each((_, el) => {
    const text = $copy(el).text().replace(/\s+/g, ' ').trim();
    if (!text || text.length < 120) $copy(el).remove();
  });

  root.find('[style]').each((_, el) => {
    for (const url of extractCssImageUrls($copy(el).attr('style'), pages.find((p) => p.slug === pageSlug)?.url || siteOrigin)) {
      addImage(url, pageSlug);
      if (!heroByPage[pageSlug]) heroByPage[pageSlug] = canonicalImageUrl(url);
    }
  });

  return root.html() || '';
}

function yamlValue(value) {
  return JSON.stringify(String(value ?? ''));
}

function markdownFrontMatter({ source, title }) {
  return `---\nsource: ${yamlValue(source)}\ntitle: ${yamlValue(title)}\nextracted_at: ${yamlValue(extractedAt)}\n---\n\n`;
}

function isLikelyBase64Name(base) {
  return base.length > 42 && /^[a-z0-9_-]+$/i.test(base) && !/[aeiou].*[aeiou]/i.test(base);
}

function kebabCaseFilename(url, mime) {
  const u = new URL(url);
  const extFromPath = path.extname(decodeURIComponent(u.pathname)).toLowerCase();
  const extFromMime = mime?.includes('png') ? '.png'
    : mime?.includes('webp') ? '.webp'
    : mime?.includes('gif') ? '.gif'
    : mime?.includes('svg') ? '.svg'
    : mime?.includes('jpeg') || mime?.includes('jpg') ? '.jpg'
    : '';
  const ext = extFromPath || extFromMime || '.img';
  let base = path.basename(decodeURIComponent(u.pathname), extFromPath || ext).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  base = base.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  if (!base || isLikelyBase64Name(base)) base = `image-${crypto.createHash('sha256').update(url).digest('hex').slice(0, 8)}`;
  return `${base}${ext === '.jpeg' ? '.jpg' : ext}`;
}

async function uniqueFilename(desired, used) {
  let filename = desired;
  let i = 2;
  const ext = path.extname(desired);
  const base = path.basename(desired, ext);
  while (used.has(filename)) {
    filename = `${base}-${i}${ext}`;
    i += 1;
  }
  used.add(filename);
  return filename;
}

function mediaDetails(item) {
  const d = item.media_details || {};
  return {
    mime: item.mime_type || null,
    width: d.width || null,
    height: d.height || null,
    altText: item.alt_text || '',
  };
}

function addMediaLibraryVariants(item) {
  if (!item?.source_url || !item?.mime_type?.startsWith('image/')) return;
  const details = mediaDetails(item);
  addImage(item.source_url, null, details);
  const sizes = item.media_details?.sizes || {};
  for (const size of Object.values(sizes)) {
    if (size?.source_url) addImage(size.source_url, null, { ...details, width: size.width, height: size.height });
  }
}

function inspectHeaderVideo(html, base) {
  const urls = new Set();
  const $ = cheerio.load(html);
  $('video source[src], video[src]').each((_, el) => {
    const src = $(el).attr('src');
    const url = absoluteUrl(src, base);
    if (url) urls.add(url);
  });
  $('[data-video-url], [data-video], [data-bg-video], [data-background-video]').each((_, el) => {
    for (const attr of ['data-video-url', 'data-video', 'data-bg-video', 'data-background-video']) {
      const url = absoluteUrl($(el).attr(attr), base);
      if (url) urls.add(url);
    }
  });
  for (const match of html.matchAll(/https?:\\?\/\\?\/[^'"\s)]+\.mp4/gi)) {
    urls.add(match[0].replaceAll('\\/', '/'));
  }
  for (const match of html.matchAll(/wp-custom-header|custom-header|header_video|videoUrl|video_url/gi)) {
    const start = Math.max(0, match.index - 300);
    const end = Math.min(html.length, match.index + 600);
    for (const mp4 of html.slice(start, end).matchAll(/https?:\\?\/\\?\/[^'"\s)]+\.mp4/gi)) urls.add(mp4[0].replaceAll('\\/', '/'));
  }
  if (urls.size) headerVideo = { found: true, value: [...urls] };
}

async function extractPages() {
  for (const page of pages) {
    try {
      log(`Fetching page ${page.slug}`);
      const html = await fetchText(page.url);
      const $ = cheerio.load(html, { decodeEntities: false });
      const title = pageTitle($) || page.slug;

      if (page.slug === 'index') inspectHeaderVideo(html, page.url);

      $('img').each((_, img) => {
        const $img = $(img);
        const candidates = parseSrcset($img.attr('srcset'), page.url);
        const src = absoluteUrl($img.attr('src'), page.url);
        if (src) candidates.push({ url: src, score: 1 });
        if (!candidates.length) return;
        candidates.sort((a, b) => b.score - a.score);
        const chosen = candidates[0].url;
        addImage(chosen, page.slug, {
          altText: $img.attr('alt') || '',
          width: Number.parseInt($img.attr('width') || '', 10) || null,
          height: Number.parseInt($img.attr('height') || '', 10) || null,
        });
        if (!heroByPage[page.slug]) heroByPage[page.slug] = canonicalImageUrl(chosen);
      });

      $('[style]').each((_, el) => {
        for (const url of extractCssImageUrls($(el).attr('style'), page.url)) {
          addImage(url, page.slug);
          if (!heroByPage[page.slug]) heroByPage[page.slug] = canonicalImageUrl(url);
        }
      });

      const cleanedHtml = cleanMain($, page.slug);
      let markdown = turndown.turndown(cleanedHtml).replace(/\n{3,}/g, '\n\n').trim();
      markdown = `${markdownFrontMatter({ source: page.url, title })}${markdown}\n`;
      await fs.writeFile(path.join(outDir, `${page.slug}.md`), markdown, 'utf8');
      pageStats.push({ slug: page.slug, title, chars: markdown.length });
    } catch (error) {
      log(`Failed page ${page.slug}: ${error.message}`);
      pageStats.push({ slug: page.slug, title: '', chars: 0, error: error.message });
    }
  }
}

async function downloadImages() {
  const usedFilenames = new Set();
  const entries = [];
  for (const item of [...imageMap.values()].sort((a, b) => a.originalUrl.localeCompare(b.originalUrl))) {
    if (item.mime && !item.mime.startsWith('image/')) continue;
    try {
      const response = await fetch(item.originalUrl, { headers: { 'user-agent': userAgent, accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const contentType = response.headers.get('content-type')?.split(';')[0] || item.mime || '';
      if (contentType && !contentType.startsWith('image/')) throw new Error(`non-image content-type ${contentType}`);
      item.mime = contentType || item.mime;
      const filename = await uniqueFilename(kebabCaseFilename(item.originalUrl, item.mime), usedFilenames);
      const relative = `/assets/images/${filename}`;
      const bytes = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(path.join(imageDir, filename), bytes);
      item.localPath = relative;
      entries.push({
        originalUrl: item.originalUrl,
        localPath: relative,
        mime: item.mime,
        width: item.width,
        height: item.height,
        altText: item.altText || '',
        usedOnPages: item.usedOnPages.sort(),
      });
    } catch (error) {
      failedDownloads.push({ originalUrl: item.originalUrl, error: error.message, usedOnPages: item.usedOnPages.sort() });
      log(`Failed image ${item.originalUrl}: ${error.message}`);
    }
  }
  return entries;
}

function localForUrl(entries, url) {
  if (!url) return null;
  const canonical = canonicalImageUrl(url);
  return entries.find((entry) => entry.originalUrl === canonical)?.localPath || null;
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(imageDir, { recursive: true });

  await extractPages();

  try {
    log('Fetching media library');
    const mediaItems = await fetchJson(mediaEndpoint);
    for (const item of mediaItems) addMediaLibraryVariants(item);
  } catch (error) {
    log(`Failed media library: ${error.message}`);
  }

  const media = await downloadImages();
  const profilePhoto = {
    originalUrl: canonicalImageUrl(likelyProfileUrl),
    localPath: localForUrl(media, likelyProfileUrl),
    note: 'Likely profile photo supplied in migration brief.',
  };
  const heroImages = Object.fromEntries(Object.entries(heroByPage).map(([slug, url]) => [slug, { originalUrl: url, localPath: localForUrl(media, url) }]));
  const manifest = {
    extractedAt,
    sourcePages: pages,
    headerVideo,
    profilePhoto,
    heroImages,
    media,
    failedDownloads,
    pageStats,
  };
  await fs.writeFile(path.join(outDir, 'media-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  log(`Extracted ${pageStats.length} pages, downloaded ${media.length} images, failed ${failedDownloads.length}.`);
  log(`Header video: ${headerVideo.found ? JSON.stringify(headerVideo.value) : 'none found'}`);
}

main().catch((error) => {
  console.error(`[migrate] Unexpected fatal error: ${error.stack || error.message}`);
  process.exitCode = 1;
});
