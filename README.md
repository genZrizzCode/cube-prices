# Cube Price Compass

Cube Price Compass is a simple static website for comparing speed cube prices across major stores.

## What it does

- Compares cube listings across stores like Cubers Shop HK, SpeedCubeShop, TheCubicle, ZiiCube, PicubeShop, KewbzUK, and GANCUBE
- Normalizes prices into USD for easier comparison
- Lets you search by cube name or store
- Highlights the lowest normalized price in the current view

## Files

- `index.html` - page structure
- `styles.css` - visual design and responsive layout
- `main.js` - frontend rendering and catalog filtering
- `worker.js` - Cloudflare Worker that scrapes public catalogs and serves `/api/catalog`
- `wrangler.toml` - Cloudflare deployment config
- `LICENSE` - MIT license

## Run locally

For local static preview, open `index.html` directly in a browser.

Example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes

- The catalog is built automatically from public store pages and cached at the edge.
- Cloudflare Workers can refresh the catalog from public pages without needing each store to provide a custom API.
- Always verify stock, shipping, and final checkout totals on the official store before buying.
- To force a rebuild after deploy, hit `/api/catalog?refresh=1`.
