# Relief Valve

A one-thumb smash loop for lying in bed. No scores, no fail states. Just a heavy press, a soft crunch, and the next object sliding in.

Source lives in this folder. Live URL: [https://labs.nitishchauhan.com/relief-valve/](https://labs.nitishchauhan.com/relief-valve/).

## Run locally

```bash
cd apps/hydraulic-crumble
npm install
npx vite --port=5174 --strictPort
```

Then open [http://localhost:5174/relief-valve/](http://localhost:5174/relief-valve/).

## Play

Tap anywhere once to unlock audio. Press **CRUSH**. The press slams, the object crumbles, debris fades, and a new block arrives.

## Deploy

Vite `base` is `/relief-valve/`. `npm run build` writes into `labs/relief-valve`. Publish with `npm run deploy:labs` from the repo root.
