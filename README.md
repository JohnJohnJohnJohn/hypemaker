# Hyperliquid HYPE Valuation Dashboard

This is a lightweight static site that shows realtime Hyperliquid exchange
stats and a customizable valuation model for the HYPE token.

## How to use

Open `index.html` in a browser or serve the directory with a simple static
server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Notes

- Data comes from the Hyperliquid public API (`/info` endpoint).
- The valuation model is assumption-driven. Adjust inputs to reflect your
  own hypothesis.
