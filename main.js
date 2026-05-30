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
  ],
  products: [
    {
      key: "gan-v100-3x3",
      name: "GAN V100 3x3",
      category: "Featured",
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
};

const dom = {
  searchInput: document.getElementById("searchInput"),
  vendorFilter: document.getElementById("vendorFilter"),
  comparisonGrid: document.getElementById("comparisonGrid"),
  storeGrid: document.getElementById("storeGrid"),
  metrics: document.getElementById("metrics"),
  spotlightPrice: document.getElementById("spotlightPrice"),
  spotlightMeta: document.getElementById("spotlightMeta"),
  rateHkd: document.getElementById("rateHkd"),
  rateGbp: document.getElementById("rateGbp"),
};

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

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(uc|uv|maglev|magnetic|ball[- ]core|core magnets?|frosted|stickerless|robot box|smart cube|bluetooth|limited edition|special edition|new year edition|year of the horse|standard|premium|flagship|matte|glossy|black internals?)\b/g, " ")
    .replace(/3x3x3/g, "3x3")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function renderStoreOptions(stores) {
  const options = [
    { value: "all", label: "All stores" },
    ...stores
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((store) => ({ value: store.id, label: store.name })),
  ];

  dom.vendorFilter.innerHTML = options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");
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
  const query = dom.searchInput.value.trim().toLowerCase();
  const vendorFilter = dom.vendorFilter.value;

  const filtered = catalog.products.filter((product) => {
    const haystack = [
      product.name,
      product.category,
      ...(product.tags || []),
      ...(product.offers || []).map((offer) => offer.title),
      ...(product.offers || []).map((offer) => offer.storeName),
    ]
      .join(" ")
      .toLowerCase();

    if (query && !haystack.includes(query)) return false;
    if (vendorFilter !== "all" && !product.offers.some((offer) => offer.storeId === vendorFilter)) {
      return false;
    }
    return true;
  });

  return filtered
    .map((product) => ({
      ...product,
      bestOffer: getBestOffer(product.offers, getRates()),
    }))
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

  return storeCount;
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
  const query = dom.searchInput.value.trim();
  const hasHardFilter = query.length > 0 || dom.vendorFilter.value !== "all";
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
  renderStoreOptions(catalog.stores || []);
  renderStoreGrid(catalog.stores || []);
  renderMetrics(catalog, filtered);
  renderSpotlight(filtered);
  renderComparison(filtered);
}

async function fetchCatalog() {
  state.loading = true;
  state.error = null;
  renderCatalog(state.catalog);

  try {
    const response = await fetch(API_URL, {
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
    renderCatalog(state.catalog);
    if (state.error) {
      dom.spotlightMeta.textContent =
        "Live catalog unavailable right now, so the page is showing the embedded fallback data.";
    }
  }
}

function attachListeners() {
  [dom.searchInput, dom.vendorFilter, dom.rateHkd, dom.rateGbp].forEach((element) => {
    element.addEventListener("input", () => renderCatalog(state.catalog));
    element.addEventListener("change", () => renderCatalog(state.catalog));
  });
}

attachListeners();
fetchCatalog();
