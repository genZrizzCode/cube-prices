const API_URL = "/api/catalog";
const DEFAULT_HKD_TO_USD = 0.128;
const DEFAULT_GBP_TO_USD = 1.27;
const FALLBACK_LIMIT = 80;

const embeddedFallback = {
  generatedAt: null,
  stores: [
    {
      id: "speedcubeshop",
      name: "SpeedCubeShop",
      url: "https://speedcubeshop.com/",
      region: "United States",
      currency: "USD",
      productCount: 0,
      offerCount: 0,
    },
    {
      id: "thecubicle",
      name: "TheCubicle",
      url: "https://www.thecubicle.com/",
      region: "United States",
      currency: "USD",
      productCount: 0,
      offerCount: 0,
    },
    {
      id: "cubershk",
      name: "Cubers Shop HK",
      url: "https://www.cubersshophk.store/",
      region: "Hong Kong",
      currency: "HKD",
      productCount: 0,
      offerCount: 0,
    },
    {
      id: "ziicube",
      name: "ZiiCube",
      url: "https://www.ziicube.com/",
      region: "Global / Asia",
      currency: "USD",
      productCount: 0,
      offerCount: 0,
    },
    {
      id: "picubeshop",
      name: "PicubeShop",
      url: "https://www.picubeshop.com/",
      region: "China / Global",
      currency: "USD",
      productCount: 0,
      offerCount: 0,
    },
    {
      id: "gancube",
      name: "GANCUBE",
      url: "https://www.gancube.com/",
      region: "Global",
      currency: "USD",
      productCount: 0,
      offerCount: 0,
    },
    {
      id: "cubezz",
      name: "Cubezz",
      url: "https://cubezz.com/",
      region: "Global",
      currency: "USD",
      productCount: 0,
      offerCount: 0,
    },
    {
      id: "mastercubestore",
      name: "MasterCubeStore",
      url: "https://mastercubestore.com/",
      region: "Europe",
      currency: "EUR",
      productCount: 0,
      offerCount: 0,
    },
  ],
  products: [
    {
      key: "gan-v100-3x3",
      name: "GAN V100 3x3",
      category: "Featured",
      brandKey: "GAN",
      brandLabel: "GAN",
      shape: "3x3",
      size: "3x3",
      tags: ["gan", "3x3", "flagship"],
      offers: [
        {
          storeId: "speedcubeshop",
          storeName: "SpeedCubeShop",
          title: "GAN V100 3x3 (Magnetic, MagLev, Core Magnets, UV Coated)",
          price: 39.95,
          currency: "USD",
          url: "https://speedcubeshop.com/products/gan-v100-3x3-magnetic-maglev-core-magnets",
          source: "manual",
        },
        {
          storeId: "thecubicle",
          storeName: "TheCubicle",
          title: "GAN V100 MagLev UV 3x3",
          price: 39.99,
          currency: "USD",
          url: "https://www.thecubicle.com/products/gan-v100-maglev-uv-3x3",
          source: "manual",
        },
      ],
    },
  ],
  filters: {
    brands: [
      { value: "GAN", label: "GAN" },
    ],
    sizes: ["3x3"],
    shapes: ["3x3"],
    categories: ["Featured"],
  },
  stats: {
    productCount: 1,
    offerCount: 2,
    storeCount: 5,
  },
};

const state = {
  catalog: embeddedFallback,
  loading: true,
  error: null,
  filters: {
    search: "",
    store: "all",
    brand: "all",
    size: "all",
    shape: "all",
    category: "all",
  },
};

const dom = {
  searchInput: document.getElementById("searchInput"),
  storeFilter: document.getElementById("storeFilter"),
  brandFilter: document.getElementById("brandFilter"),
  sizeFilter: document.getElementById("sizeFilter"),
  shapeFilter: document.getElementById("shapeFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  refreshButton: document.getElementById("refreshButton"),
  comparisonGrid: document.getElementById("comparisonGrid"),
  storeGrid: document.getElementById("storeGrid"),
  metrics: document.getElementById("metrics"),
  spotlightPrice: document.getElementById("spotlightPrice"),
  spotlightMeta: document.getElementById("spotlightMeta"),
  rateHkd: document.getElementById("rateHkd"),
  rateGbp: document.getElementById("rateGbp"),
};

const DEFAULT_SELECT_OPTION = (label = "All") => ({ value: "all", label });

function inferBrandFromTitle(title) {
  const text = String(title || "").toLowerCase();
  if (/\bgan\b|\bgancube\b/.test(text)) return { value: "GAN", label: "GAN" };
  if (/\bqiyi\b|\bmofangge\b|\bwarrior\b/.test(text)) return { value: "QY", label: "QiYi (QY)" };
  if (/\bx[- ]?man\b|\bxmd\b/.test(text)) return { value: "XMD", label: "X-Man (XMD)" };
  if (/\bmoyu\b|\bweilong\b|\brs3\b|\bwrm\b/.test(text)) return { value: "MY", label: "MoYu (MY)" };
  if (/\bdayan\b/.test(text)) return { value: "DY", label: "DaYan (DY)" };
  if (/\byuxin\b|\byx\b|\blittle magic\b/.test(text)) return { value: "YX", label: "YuXin (YX)" };
  if (/\byj\b|\byulong\b|\byupo\b/.test(text)) return { value: "YJ", label: "YJ" };
  if (/\bshengshou\b/.test(text)) return { value: "SS", label: "ShengShou (SS)" };
  if (/\brubik'?s\b|\brubik\b/.test(text)) return { value: "RUBIKS", label: "Rubik's" };
  if (/\bmastercubestore\b/.test(text)) return { value: "MSC", label: "MasterCubeStore" };
  if (/\bcubezz\b/.test(text)) return { value: "CUBEZZ", label: "Cubezz" };
  if (/\bpicube\b/.test(text)) return { value: "PICUBE", label: "PicubeShop" };
  return { value: "OTHER", label: "Other" };
}

function inferShapeFromTitle(title) {
  const text = String(title || "").toLowerCase();
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

function inferCategoryFromTitle(title) {
  const text = String(title || "").toLowerCase();
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

function normalizeProduct(product) {
  const title = product.name || "";
  const inferredBrand = product.brandKey
    ? { value: product.brandKey, label: product.brandLabel || product.brandKey }
    : inferBrandFromTitle(title);
  const inferredShape = product.shape || inferShapeFromTitle(title);
  const inferredCategory = product.category || inferCategoryFromTitle(title);

  return {
    ...product,
    brandKey: inferredBrand.value,
    brandLabel: inferredBrand.label,
    shape: inferredShape,
    size: product.size || inferredShape,
    category: inferredCategory,
  };
}

function formatMoney(value, currency) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: value < 10 ? 2 : 2,
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
}

function getRates() {
  return {
    USD: 1,
    HKD: Number(dom.rateHkd.value || DEFAULT_HKD_TO_USD),
    GBP: Number(dom.rateGbp.value || DEFAULT_GBP_TO_USD),
  };
}

function toUsd(price, currency, rates) {
  const rate = rates[currency] || 1;
  return Number(price) * rate;
}

function getBestOffer(offers, rates) {
  return offers.reduce((best, offer) => {
    const usd = toUsd(offer.price, offer.currency, rates);
    if (!best || usd < best.usd) {
      return { ...offer, usd };
    }
    return best;
  }, null);
}

function renderOptions(select, options, currentValue, fallbackLabel) {
  const previousValue = currentValue || "all";
  select.innerHTML = [
    DEFAULT_SELECT_OPTION(fallbackLabel),
    ...options,
  ]
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");
  select.value = options.some((option) => option.value === previousValue) ? previousValue : "all";
}

function collectFilterValues(catalog) {
  const products = (catalog.products || []).map((product) => normalizeProduct(product));
  const filterData = catalog.filters || {};

  const brands = new Map();
  for (const brand of filterData.brands || []) {
    if (brand?.value) brands.set(brand.value, brand.label || brand.value);
  }
  for (const product of products) {
    if (product.brandKey) brands.set(product.brandKey, product.brandLabel || product.brandKey);
  }

  const sizes = new Set(filterData.sizes || []);
  const shapes = new Set(filterData.shapes || []);
  const categories = new Set(filterData.categories || []);

  for (const product of products) {
    if (product.size) sizes.add(product.size);
    if (product.shape) shapes.add(product.shape);
    if (product.category) categories.add(product.category);
  }

  return {
    brands: [...brands.entries()].map(([value, label]) => ({ value, label })),
    sizes: [...sizes].filter(Boolean),
    shapes: [...shapes].filter(Boolean),
    categories: [...categories].filter(Boolean),
  };
}

function renderFilterOptions(catalog) {
  const stores = (catalog.stores || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  renderOptions(
    dom.storeFilter,
    stores.map((store) => ({ value: store.id, label: store.name })),
    state.filters.store,
    "All stores",
  );

  const filterData = collectFilterValues(catalog);
  const brandOptions = filterData.brands
    .slice()
    .sort((a, b) => String(a.label).localeCompare(String(b.label)))
    .map((brand) => ({ value: brand.value, label: brand.label }));
  const sizeOptions = filterData.sizes
    .slice()
    .sort()
    .map((size) => ({ value: size, label: size }));
  const shapeOptions = filterData.shapes
    .slice()
    .sort()
    .map((shape) => ({ value: shape, label: shape }));
  const categoryOptions = filterData.categories
    .slice()
    .sort()
    .map((category) => ({ value: category, label: category }));

  renderOptions(dom.brandFilter, brandOptions, state.filters.brand, "All brands");
  renderOptions(dom.sizeFilter, sizeOptions, state.filters.size, "All sizes");
  renderOptions(dom.shapeFilter, shapeOptions, state.filters.shape, "All shapes");
  renderOptions(dom.categoryFilter, categoryOptions, state.filters.category, "All categories");
}

function renderStoreGrid(stores) {
  dom.storeGrid.innerHTML = stores
    .slice()
    .sort((a, b) => b.productCount - a.productCount)
    .map(
      (store) => `
        <article class="store-card">
          <div class="store-top">
            <div>
              <h3>${store.name}</h3>
              <p class="spotlight-label" style="margin-top: 6px;">${store.region || "Store"}</p>
            </div>
            <div class="store-badge">${(store.name || "").slice(0, 2).toUpperCase()}</div>
          </div>
          <p class="store-desc">${store.productCount || 0} products · ${store.offerCount || 0} offers tracked</p>
          <div class="store-meta">
            <span class="meta-pill">${store.currency || "USD"}</span>
          </div>
          <a class="store-link" href="${store.url}" target="_blank" rel="noreferrer">Visit store</a>
        </article>
      `,
    )
    .join("");
}

function getFilteredProducts(catalog) {
  const query = state.filters.search.trim().toLowerCase();

  const filtered = catalog.products.filter((product) => {
    const normalized = normalizeProduct(product);
    const haystack = [
      normalized.name,
      normalized.category,
      normalized.brandLabel,
      normalized.shape,
      normalized.size,
      ...(normalized.tags || []),
      ...(normalized.offers || []).map((offer) => offer.title),
      ...(normalized.offers || []).map((offer) => offer.storeName),
    ]
      .join(" ")
      .toLowerCase();

    if (query && !haystack.includes(query)) return false;
    if (state.filters.store !== "all" && !normalized.offers.some((offer) => offer.storeId === state.filters.store)) {
      return false;
    }
    if (state.filters.brand !== "all" && normalized.brandKey !== state.filters.brand) {
      return false;
    }
    if (state.filters.size !== "all" && normalized.size !== state.filters.size) {
      return false;
    }
    if (state.filters.shape !== "all" && normalized.shape !== state.filters.shape) {
      return false;
    }
    if (state.filters.category !== "all" && normalized.category !== state.filters.category) {
      return false;
    }
    return true;
  });

  return filtered
    .map((product) => {
      const normalized = normalizeProduct(product);
      return {
        ...normalized,
        bestOffer: getBestOffer(normalized.offers, getRates()),
      };
    })
    .sort((a, b) => a.bestOffer.usd - b.bestOffer.usd);
}

function renderMetrics(catalog, filteredProducts) {
  const offers = filteredProducts.flatMap((product) => product.offers);
  const storeCount = new Set(offers.map((offer) => offer.storeId)).size;
  const cheapest = offers.reduce((best, offer) => {
    const usd = toUsd(offer.price, offer.currency, getRates());
    if (!best || usd < best.usd) return { ...offer, usd };
    return best;
  }, null);

  dom.metrics.innerHTML = [
    {
      value: `${catalog.stats?.productCount ?? catalog.products.length}`,
      label: "products in catalog",
    },
    {
      value: `${catalog.stats?.storeCount ?? catalog.stores.length}`,
      label: "stores connected",
    },
    {
      value: `${offers.length}`,
      label: "offers in this view",
    },
    {
      value: `${storeCount}`,
      label: "stores in this view",
    },
    {
      value: cheapest ? formatMoney(cheapest.usd, "USD") : "—",
      label: "lowest normalized price",
    },
  ]
    .map(
      (metric) => `
        <div class="metric">
          <span class="metric-value">${metric.value}</span>
          <span class="metric-label">${metric.label}</span>
        </div>
      `,
    )
    .join("");
}

function renderSpotlight(filteredProducts) {
  const best = filteredProducts[0];
  if (!best || !best.bestOffer) {
    dom.spotlightPrice.textContent = state.loading ? "Loading..." : "No matches";
    dom.spotlightMeta.textContent = state.loading
      ? "Building the live catalog from public store pages."
      : "Try a broader search or switch the store filter.";
    return;
  }

  dom.spotlightPrice.textContent = formatMoney(best.bestOffer.usd, "USD");
  dom.spotlightMeta.textContent = `${best.name} at ${best.bestOffer.storeName}. ${best.bestOffer.title}`;
}

function renderComparison(filteredProducts) {
  const query = state.filters.search.trim();
  const hasHardFilter =
    query.length > 0 ||
    state.filters.store !== "all" ||
    state.filters.brand !== "all" ||
    state.filters.size !== "all" ||
    state.filters.shape !== "all" ||
    state.filters.category !== "all";
  const visible = hasHardFilter ? filteredProducts : filteredProducts.slice(0, FALLBACK_LIMIT);

  if (!visible.length) {
    dom.comparisonGrid.innerHTML = `
      <div class="glass-card">
        <p class="spotlight-label">No matches</p>
        <h2 style="margin-top: 10px;">No products matched your current filter.</h2>
        <p class="rate-note">Try a store name, a model like V100 or RS3M, or clear the filters.</p>
      </div>
    `;
    return;
  }

  const hiddenCount = filteredProducts.length - visible.length;
  const cards = visible.map((product) => {
    const offers = product.offers
      .slice()
      .sort((a, b) => toUsd(a.price, a.currency, getRates()) - toUsd(b.price, b.currency, getRates()));

    const tags = (product.tags || [])
      .slice(0, 4)
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join("");

    return `
      <article class="comparison-card">
        <div class="card-top">
          <div class="title-wrap">
            <p class="spotlight-label">${product.category || "Puzzle"}</p>
            <h3>${product.name}</h3>
            <p class="subtitle">${offers.length} store offer${offers.length === 1 ? "" : "s"} tracked</p>
            <div class="tag-row">${tags}</div>
          </div>
          <div class="best-chip">
            Best: ${formatMoney(product.bestOffer.usd, "USD")}
          </div>
        </div>
        <div class="vendor-grid">
          ${offers
            .map((offer, index) => {
              const isBest = index === 0;
              return `
                <article class="offer${isBest ? " best" : ""}">
                  <div class="offer-head">
                    <div>
                      <div class="vendor-name">${offer.storeName}</div>
                      <div class="vendor-meta">${offer.source || "catalog"}</div>
                    </div>
                    <div class="price">${formatMoney(offer.price, offer.currency)}</div>
                  </div>
                  <div class="price-usd">≈ ${formatMoney(toUsd(offer.price, offer.currency, getRates()), "USD")} normalized</div>
                  <a class="product-link" href="${offer.url}" target="_blank" rel="noreferrer">
                    <span>${offer.title}</span>
                  </a>
                </article>
              `;
            })
            .join("")}
        </div>
      </article>
    `;
  });

  if (hiddenCount > 0) {
    cards.push(`
      <div class="glass-card">
        <p class="spotlight-label">More results</p>
        <h2 style="margin-top: 10px;">${hiddenCount} more product groups are hidden by the default view.</h2>
        <p class="rate-note">Use search or choose a store to focus the catalog, or add a pagination control later if you want to browse everything manually.</p>
      </div>
    `);
  }

  dom.comparisonGrid.innerHTML = cards.join("");
}

function renderCatalog(catalog) {
  const filtered = getFilteredProducts(catalog);
  renderFilterOptions(catalog);
  renderStoreGrid(catalog.stores || []);
  renderMetrics(catalog, filtered);
  renderSpotlight(filtered);
  renderComparison(filtered);
}

async function fetchCatalog(forceRefresh = false) {
  state.loading = true;
  state.error = null;
  renderCatalog(state.catalog);

  try {
    const response = await fetch(`${API_URL}${forceRefresh ? "?refresh=1" : ""}`, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Catalog API returned ${response.status}`);
    }
    state.catalog = await response.json();
  } catch (error) {
    state.error = error;
  } finally {
    state.loading = false;
    if (dom.refreshButton) {
      dom.refreshButton.disabled = false;
      dom.refreshButton.textContent = "Refresh prices";
    }
    renderCatalog(state.catalog);
    if (state.error) {
      dom.spotlightMeta.textContent =
        "Live catalog unavailable right now, so the page is showing the embedded fallback data.";
    }
  }
}

function attachListeners() {
  dom.searchInput.addEventListener("input", () => {
    state.filters.search = dom.searchInput.value;
    renderCatalog(state.catalog);
  });
  dom.storeFilter.addEventListener("change", () => {
    state.filters.store = dom.storeFilter.value;
    renderCatalog(state.catalog);
  });
  dom.brandFilter.addEventListener("change", () => {
    state.filters.brand = dom.brandFilter.value;
    renderCatalog(state.catalog);
  });
  dom.sizeFilter.addEventListener("change", () => {
    state.filters.size = dom.sizeFilter.value;
    renderCatalog(state.catalog);
  });
  dom.shapeFilter.addEventListener("change", () => {
    state.filters.shape = dom.shapeFilter.value;
    renderCatalog(state.catalog);
  });
  dom.categoryFilter.addEventListener("change", () => {
    state.filters.category = dom.categoryFilter.value;
    renderCatalog(state.catalog);
  });
  [dom.rateHkd, dom.rateGbp].forEach((element) => {
    element.addEventListener("input", () => renderCatalog(state.catalog));
  });
  dom.refreshButton.addEventListener("click", async () => {
    dom.refreshButton.disabled = true;
    dom.refreshButton.textContent = "Refreshing...";
    await fetchCatalog(true);
  });
}

attachListeners();
fetchCatalog();
