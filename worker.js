const USER_AGENT = "CubePrices/1.0";
const CACHE_KEY = "cube-prices/catalog/v1";
const CATALOG_TTL_SECONDS = 60 * 30;
const SHOPIFY_PAGES = 10;
const CRAWL_LIMIT = 140;
const FETCH_TIMEOUT_MS = 12000;
const SITEMAP_LIMIT = 6;

const SOURCES = [
  {
    id: "speedcubeshop",
    name: "SpeedCubeShop",
    url: "https://speedcubeshop.com/",
    currency: "USD",
    kind: "shopify",
    productJsonPaths: ["/products.json?limit=250&page="],
  },
  {
    id: "thecubicle",
    name: "TheCubicle",
    url: "https://www.thecubicle.com/",
    currency: "USD",
    kind: "shopify",
    productJsonPaths: ["/products.json?limit=250&page=", "/collections/all/products.json?limit=250&page="],
  },
  {
    id: "cubershk",
    name: "Cubers Shop HK",
    url: "https://www.cubersshophk.store/",
    currency: "HKD",
    kind: "crawl",
    seeds: [
      "/products",
      "/c/%E4%B8%89%E9%9A%8E%E6%89%AD%E8%A8%88%E9%AA%B0%283%2A3%29",
      "/c/%E5%93%81%E7%89%8C%28Brand%29",
    ],
  },
  {
    id: "ziicube",
    name: "ZiiCube",
    url: "https://www.ziicube.com/",
    currency: "USD",
    kind: "crawl",
    seeds: ["/", "/3x3x3", "/MoYu-Cube", "/GAN-Cube", "/QiYi", "/X-Man", "/Smart-Cube"],
  },
  {
    id: "picubeshop",
    name: "PicubeShop",
    url: "https://www.picubeshop.com/",
    currency: "USD",
    kind: "crawl",
    seeds: ["/", "/collections/3x3", "/collections/moyu", "/collections/qiyi", "/collections/gan"],
  },
  {
    id: "gancube",
    name: "GANCUBE",
    url: "https://www.gancube.com/",
    currency: "USD",
    kind: "shopify",
    productJsonPaths: ["/products.json?limit=250&page=", "/collections/all/products.json?limit=250&page="],
  },
  {
    id: "cubezz",
    name: "Cubezz",
    url: "https://cubezz.com/",
    currency: "USD",
    kind: "crawl",
    seeds: ["/", "/3x3x3", "/2x2x2", "/4x4x4", "/puzzles", "/speed-cube", "/cube"],
  },
  {
    id: "mastercubestore",
    name: "MasterCubeStore",
    url: "https://mastercubestore.com/",
    currency: "EUR",
    kind: "crawl",
    seeds: ["/83-speedcubes-wca", "/52-3x3-cubes", "/320-mscube", "/sengso", "/other-brands", "/rubik-s", "/yj-moyu"],
  },
  {
    id: "kewbz",
    name: "KewbzUK",
    url: "https://kewbz.com/",
    currency: "GBP",
    kind: "shopify",
    productJsonPaths: ["/products.json?limit=250&page="],
  },
];

function withTimeout(promise, ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return Promise.race([
    promise(controller.signal).finally(() => clearTimeout(timeout)),
    new Promise((_, reject) => {
      controller.signal.addEventListener("abort", () => reject(new Error("Timeout")));
    }),
  ]);
}

async function fetchText(url, signal) {
  const response = await fetch(url, {
    signal,
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) return null;
  return response.text();
}

async function fetchJson(url, signal) {
  const response = await fetch(url, {
    signal,
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/json,text/plain,*/*",
    },
  });
  if (!response.ok) return null;
  return response.json();
}

function absoluteUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(uv|maglev|magnetic|ball[- ]core|core magnets?|frosted|stickerless|robot box|smart cube|bluetooth|limited edition|special edition|new year edition|year of the horse|standard|premium|flagship|matte|glossy|black internals?|with|cube|puzzle)\b/g, " ")
    .replace(/3x3x3/g, "3x3")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeModelKey(title) {
  const normalized = normalizeText(title)
    .replace(/\bmoyu\b/g, "")
    .replace(/\bmo yu\b/g, "")
    .replace(/\bqiyi\b/g, "")
    .replace(/\bgan\b/g, "gan")
    .replace(/\bpicube\b/g, "picube")
    .replace(/\bthe cubicle\b/g, "")
    .replace(/\bspeed cube shop\b/g, "")
    .replace(/\bcubers shop hk\b/g, "")
    .replace(/\b3 x 3\b/g, "3x3")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || normalizeText(title);
}

const BRAND_ALIASES = [
  { key: "GAN", label: "GAN", patterns: [/\bgan\b/i, /\bgancube\b/i] },
  { key: "QY", label: "QiYi (QY)", patterns: [/\bqiyi\b/i, /\bmofangge\b/i, /\bwarrior\b/i] },
  { key: "XMD", label: "X-Man (XMD)", patterns: [/\bx[- ]?man\b/i, /\bxmd\b/i] },
  { key: "MY", label: "MoYu (MY)", patterns: [/\bmoyu\b/i, /\bweilong\b/i, /\brs3\b/i, /\bwrm\b/i, /\bsuper weilong\b/i] },
  { key: "DY", label: "DaYan (DY)", patterns: [/\bdayan\b/i] },
  { key: "YX", label: "YuXin (YX)", patterns: [/\byuxin\b/i, /\byx\b/i, /\blittle magic\b/i] },
  { key: "YJ", label: "YJ", patterns: [/\byj\b/i, /\byulong\b/i, /\byupo\b/i] },
  { key: "SS", label: "ShengShou (SS)", patterns: [/\bshengshou\b/i] },
  { key: "RUBIKS", label: "Rubik's", patterns: [/\brubik'?s\b/i, /\brubik\b/i] },
  { key: "MSC", label: "MasterCubeStore", patterns: [/\bmastercubestore\b/i] },
  { key: "CUBEZZ", label: "Cubezz", patterns: [/\bcubezz\b/i] },
  { key: "PICUBE", label: "PicubeShop", patterns: [/\bpicube\b/i] },
];

function inferBrand(title, source) {
  const haystack = `${title} ${source?.name || ""}`;
  for (const brand of BRAND_ALIASES) {
    if (brand.patterns.some((pattern) => pattern.test(haystack))) {
      return { key: brand.key, label: brand.label };
    }
  }
  return { key: "OTHER", label: "Other" };
}

function inferShape(title) {
  const text = normalizeText(title);
  if (/\b2x2\b/.test(text)) return "2x2";
  if (/\b3x3\b/.test(text)) return "3x3";
  if (/\b4x4\b/.test(text)) return "4x4";
  if (/\b5x5\b/.test(text)) return "5x5";
  if (/\b6x6\b/.test(text)) return "6x6";
  if (/\b7x7\b/.test(text)) return "7x7";
  if (/\bskewb\b/.test(text)) return "skewb";
  if (/\bpyraminx\b/.test(text)) return "pyraminx";
  if (/\bmegaminx\b/.test(text)) return "megaminx";
  if (/\bsquare ?-?1\b|\bsq1\b/.test(text)) return "square-1";
  if (/\bclock\b|\bmagic clock\b/.test(text)) return "clock";
  if (/\bmirror\b/.test(text)) return "mirror cube";
  if (/\bcuboid\b|\b3x3x2\b|\b2x2x3\b|\b4x4x5\b/.test(text)) return "cuboid";
  return "other";
}

function inferCategory(title) {
  const text = normalizeText(title);
  if (/\btimer\b|\bstopwatch\b|\bsmart timer\b|\bhalo timer\b/.test(text)) return "timers";
  if (/\blube\b|\bmat\b|\bbag\b|\bcover\b|\bstickers?\b|\bstand\b|\bkeychain\b|\brobot\b|\bcenter cap\b/.test(text)) {
    return "accessories";
  }
  if (/\blearn\b|\bbeginner\b|\btraining\b|\bstarter\b|\bpractice\b/.test(text)) return "learning";
  if (/\bcenter\b/.test(text) && /\bcube\b/.test(text)) return "cube centers";
  if (/\bsmart cube\b|\bi carry\b|\bgo cube\b|\bsmart\b/.test(text)) return "smart cubes";
  if (/\bmosaic\b|\bspelling\b|\bmystery box\b|\bother\b/.test(text)) return "other puzzles";
  return "cubes";
}

function extractFirstMatch(html, regex) {
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const pattern of patterns) {
    const value = extractFirstMatch(html, pattern);
    if (value) return value;
  }
  return null;
}

function extractCanonical(html) {
  return (
    extractFirstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
    extractMeta(html, "og:url")
  );
}

function extractTitle(html) {
  return (
    extractMeta(html, "og:title") ||
    extractFirstMatch(html, /<title[^>]*>([^<]+)<\/title>/i) ||
    extractFirstMatch(html, /<h1[^>]*>([^<]+)<\/h1>/i)
  );
}

function extractCurrency(html, fallback) {
  return (
    extractMeta(html, "product:price:currency") ||
    extractMeta(html, "og:price:currency") ||
    extractFirstMatch(html, /itemprop=["']priceCurrency["'][^>]*content=["']([^"']+)["']/i) ||
    fallback
  );
}

function extractPrice(html) {
  const patterns = [
    /property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i,
    /itemprop=["']price["'][^>]*content=["']([^"']+)["']/i,
    /"price"\s*:\s*"?(?:\$)?([0-9]+(?:\.[0-9]+)?)"?/i,
    /Price:\s*(?:discount)?\$?\s*([0-9]+(?:\.[0-9]+)?)/i,
    /\b\$([0-9]+(?:\.[0-9]+)?)\b/,
  ];
  for (const pattern of patterns) {
    const value = extractFirstMatch(html, pattern);
    if (value) return Number(value);
  }
  return null;
}

function extractJsonLdProducts(html) {
  const results = [];
  const scripts = html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    const raw = script.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/, "").trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        if (String(node["@type"] || "").toLowerCase() !== "product") continue;
        const offers = Array.isArray(node.offers) ? node.offers : node.offers ? [node.offers] : [];
        const offer = offers[0] || {};
        results.push({
          title: node.name || null,
          price: offer.price != null ? Number(offer.price) : null,
          currency: offer.priceCurrency || null,
          url: offer.url || null,
          image: node.image || null,
        });
      }
    } catch {
      continue;
    }
  }
  return results;
}

function extractLinks(html, baseUrl) {
  const links = [];
  const hrefRe = /href=["']([^"'#?]+(?:\?[^"']*)?)["']/gi;
  let match;
  while ((match = hrefRe.exec(html))) {
    const abs = absoluteUrl(baseUrl, match[1]);
    if (!abs) continue;
    links.push(abs);
  }
  return links;
}

function extractSitemapLocs(xml) {
  const locs = [];
  const locRe = /<loc>([^<]+)<\/loc>/gi;
  let match;
  while ((match = locRe.exec(xml))) {
    locs.push(match[1].trim());
  }
  return locs;
}

function isLikelyProductUrl(url) {
  const path = new URL(url).pathname.toLowerCase();
  return (
    path.includes("/products/") ||
    path.includes("/product/") ||
    path.includes("/item/") ||
    path.startsWith("/p/") ||
    path.startsWith("/products")
  );
}

function isSameOrigin(url, root) {
  return new URL(url).origin === new URL(root).origin;
}

function productFromHtml(html, url, source) {
  const jsonLd = extractJsonLdProducts(html)[0] || {};
  const title = jsonLd.title || extractTitle(html);
  const price = jsonLd.price || extractPrice(html);
  if (!title || price == null || Number.isNaN(Number(price))) return null;

  const canonical = extractCanonical(html) || url;
  const currency = jsonLd.currency || extractCurrency(html, source.currency || "USD");
  const brand = inferBrand(title, source);
  const shape = inferShape(title);
  const offer = {
    storeId: source.id,
    storeName: source.name,
    title: title.trim(),
    price: Number(price),
    currency,
    url: canonical,
    source: source.kind,
  };

  return {
    key: normalizeModelKey(title),
    name: title.trim(),
    brandKey: brand.key,
    brandLabel: brand.label,
    shape,
    size: shape,
    category: inferCategory(title),
    tags: [brand.label],
    offers: [offer],
  };
}

function mergeProduct(map, product) {
  if (!product || !product.key) return;
  const existing = map.get(product.key);
  if (!existing) {
    map.set(product.key, {
      key: product.key,
      name: product.name,
      category: product.category || "cubes",
      brandKey: product.brandKey || "OTHER",
      brandLabel: product.brandLabel || "Other",
      shape: product.shape || "other",
      size: product.size || product.shape || "other",
      tags: product.tags || [],
      offers: [...product.offers],
    });
    return;
  }

  if ((existing.name || "").length > (product.name || "").length) {
    existing.name = product.name;
  }

  existing.category = existing.category || product.category || "cubes";
  existing.brandKey = existing.brandKey || product.brandKey || "OTHER";
  existing.brandLabel = existing.brandLabel || product.brandLabel || "Other";
  existing.shape = existing.shape || product.shape || "other";
  existing.size = existing.size || product.size || product.shape || "other";

  const offerIndex = new Set(existing.offers.map((offer) => `${offer.storeId}::${offer.url}`));
  for (const offer of product.offers) {
    const id = `${offer.storeId}::${offer.url}`;
    if (!offerIndex.has(id)) existing.offers.push(offer);
  }
}

async function crawlShopify(source) {
  const products = new Map();
  const origin = new URL(source.url).origin;

  for (const path of source.productJsonPaths) {
    for (let page = 1; page <= SHOPIFY_PAGES; page += 1) {
      const url = `${origin}${path}${page}`;
      const data = await withTimeout((signal) => fetchJson(url, signal), FETCH_TIMEOUT_MS).catch(() => null);
      const items = data && Array.isArray(data.products) ? data.products : [];
      if (!items.length) break;

      for (const item of items) {
        const variants = Array.isArray(item.variants) ? item.variants : [];
        const chosenVariant = variants.find((variant) => variant.available) || variants[0] || {};
        const price = Number(chosenVariant.price ?? item.price);
        if (!item.title || Number.isNaN(price)) continue;

        const product = {
          key: normalizeModelKey(item.title),
          name: item.title.trim(),
          category: inferCategory(item.title) || item.product_type || "cubes",
          brandKey: inferBrand(item.title, source).key,
          brandLabel: inferBrand(item.title, source).label,
          shape: inferShape(item.title),
          size: inferShape(item.title),
          tags: Array.isArray(item.tags)
            ? item.tags
            : typeof item.tags === "string"
              ? item.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
              : [],
          offers: [
            {
              storeId: source.id,
              storeName: source.name,
              title: item.title.trim(),
              price,
              currency: source.currency || "USD",
              url: item.handle ? `${origin}/products/${item.handle}` : item.url || origin,
              source: "shopify",
            },
          ],
        };

        mergeProduct(products, product);
      }
    }
  }

  return [...products.values()];
}

async function crawlGeneric(source) {
  const products = new Map();
  const origin = new URL(source.url).origin;
  const queue = source.seeds.map((path) => new URL(path, source.url).toString());
  const visited = new Set();
  let pageCount = 0;

  const sitemapSeed = new URL("/sitemap.xml", source.url).toString();
  const sitemapXml = await withTimeout((signal) => fetchText(sitemapSeed, signal), FETCH_TIMEOUT_MS).catch(() => null);
  if (sitemapXml) {
    const sitemapUrls = extractSitemapLocs(sitemapXml);
    let sitemapFiles = sitemapUrls.filter((loc) => loc.endsWith(".xml")).slice(0, SITEMAP_LIMIT);
    let pageUrls = sitemapUrls.filter((loc) => !loc.endsWith(".xml"));

    for (const sitemapUrl of sitemapFiles) {
      const nested = await withTimeout((signal) => fetchText(sitemapUrl, signal), FETCH_TIMEOUT_MS).catch(() => null);
      if (!nested) continue;
      pageUrls.push(
        ...extractSitemapLocs(nested).filter((loc) => !loc.endsWith(".xml")),
      );
    }

    for (const loc of pageUrls) {
      if (!isSameOrigin(loc, source.url)) continue;
      const path = new URL(loc).pathname;
      const relevant =
        isLikelyProductUrl(loc) ||
        path.includes("/collections/") ||
        path.includes("/c/") ||
        path.includes("/3x3") ||
        path.includes("/moyu") ||
        path.includes("/gan") ||
        path.includes("/qiyi") ||
        path.includes("/dayan") ||
        path.includes("/yj");
      if (relevant && !queue.includes(loc)) queue.push(loc);
    }
  }

  while (queue.length && pageCount < CRAWL_LIMIT) {
    const url = queue.shift();
    if (!url || visited.has(url) || !isSameOrigin(url, source.url)) continue;
    visited.add(url);
    pageCount += 1;

    const html = await withTimeout((signal) => fetchText(url, signal), FETCH_TIMEOUT_MS).catch(() => null);
    if (!html) continue;

    const product = productFromHtml(html, url, source);
    if (product) mergeProduct(products, product);

    const extractedLinks = extractLinks(html, url)
      .filter((link) => isSameOrigin(link, source.url))
      .filter((link) => !/\.(png|jpg|jpeg|gif|webp|svg|css|js|ico)$/i.test(new URL(link).pathname));

    for (const link of extractedLinks) {
      if (visited.has(link) || queue.includes(link)) continue;
      if (!isLikelyProductUrl(link) && source.kind === "crawl") {
        const path = new URL(link).pathname;
        const looksRelevant =
          path === "/" ||
          path.includes("/collections/") ||
          path.includes("/products") ||
          path.includes("/c/") ||
          path.includes("/item/") ||
          path.includes("/3x3") ||
          path.includes("/moyu") ||
          path.includes("/gan") ||
          path.includes("/qiyi") ||
          path.includes("/yj") ||
          path.includes("/dayan");
        if (!looksRelevant) continue;
      }
      queue.push(link);
    }
  }

  return [...products.values()];
}

function summarizeCatalog(storeProducts) {
  const stores = new Map();
  let productCount = 0;
  let offerCount = 0;
  const products = [];

  for (const [storeId, productList] of Object.entries(storeProducts)) {
    const store = SOURCES.find((entry) => entry.id === storeId);
    const storeOfferCount = productList.reduce((sum, product) => sum + product.offers.length, 0);
    stores.set(storeId, {
      id: storeId,
      name: store?.name || storeId,
      url: store?.url || "",
      region: store?.kind === "shopify" ? "Catalog source" : "Catalog source",
      currency: store?.currency || "USD",
      productCount: productList.length,
      offerCount: storeOfferCount,
    });

    productCount += productList.length;
    offerCount += storeOfferCount;
    products.push(...productList);
  }

  return {
    generatedAt: new Date().toISOString(),
    stores: [...stores.values()],
    products,
    filters: {
      brands: [...new Map(products.map((product) => [product.brandKey || "OTHER", product.brandLabel || "Other"])).entries()].map(
        ([value, label]) => ({ value, label }),
      ),
      sizes: [...new Set(products.map((product) => product.size || product.shape || "other"))].sort(),
      shapes: [...new Set(products.map((product) => product.shape || "other"))].sort(),
      categories: [...new Set(products.map((product) => product.category || "cubes"))].sort(),
    },
    stats: {
      productCount,
      offerCount,
      storeCount: stores.size,
    },
  };
}

async function buildCatalog() {
  const storeProducts = {};
  const results = await Promise.all(
    SOURCES.map(async (source) => {
      try {
        if (source.kind === "shopify") {
          return [source.id, await crawlShopify(source)];
        }
        return [source.id, await crawlGeneric(source)];
      } catch {
        return [source.id, []];
      }
    }),
  );

  for (const [storeId, list] of results) {
    storeProducts[storeId] = list;
  }

  return summarizeCatalog(storeProducts);
}

async function handleCatalog(request, env, ctx) {
  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";
  const cache = caches.default;
  const cacheRequest = new Request(`${url.origin}/api/catalog?${CACHE_KEY}`, { method: "GET" });

  if (!refresh) {
    const cached = await cache.match(cacheRequest);
    if (cached) return cached;
  }

  const catalog = await buildCatalog();
  const response = new Response(JSON.stringify(catalog), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${CATALOG_TTL_SECONDS}`,
    },
  });

  ctx.waitUntil(cache.put(cacheRequest, response.clone()));
  return response;
}

async function handleAsset(request, env) {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404) return response;

  const url = new URL(request.url);
  if (url.pathname.includes(".")) return response;

  const indexRequest = new Request(new URL("/index.html", url).toString(), {
    method: request.method,
    headers: request.headers,
  });
  return env.ASSETS.fetch(indexRequest);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/catalog") {
      return handleCatalog(request, env, ctx);
    }
    return handleAsset(request, env);
  },
};
