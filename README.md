# URL Checker (TypeScript)

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` to type-check and create a production bundle.

## Test URLs

- `https://example.com/docs/` — folder
- `https://example.com/docs/readme.pdf` — file
- `https://example.com/images/logo.png` — file
- `https://example.com/missing` — does not exist
- `example.com/docs` — invalid URL (missing scheme)

The server is deliberately mocked, and the URL values are checked against a fixed in-memory map, **not** against the live internet. Requests are asynchronous (350 ms latency). Valid input is checked with a 700 ms leading/trailing throttle. A revision counter suppresses stale results.
