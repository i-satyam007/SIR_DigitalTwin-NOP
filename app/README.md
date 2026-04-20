# From People to Parameters — SIR Digital Twin

An interactive single-page React app that visualizes numerical-optimization algorithms calibrating the SIR epidemic model against India's second COVID wave (1 March – 15 June 2021, JHU CSSE data).

Companion piece to the NOP course project at IIM Indore.

---

## One-line runbook

```bash
cd app && python3 -m http.server 8000
```

Then open **http://localhost:8000** in any modern browser (Chrome, Firefox, Safari, Edge).

That's it. No `npm install`, no build step, no internet required at runtime — everything is bundled locally.

---

## What you'll see

1. **Hero** — title, project-at-a-glance strip with the headline R₀ = 2.387
2. **The Model** — an animated 320-agent population driven by fitted SIR proportions, next to the three governing ODEs
3. **The Data** — pipeline from raw JHU series to model-ready compartments
4. **Calibration Lab** — the centerpiece. Pick any of the 6 optimizers, press play, and watch the fit curve bend toward the data while parameter cards, convergence chart, and β-γ trajectory update in sync
5. **All Methods Overlaid** — convergence of all 6 methods on one log-scale chart
6. **Failures & Robustness** — 3 failure-mode cases and 3 time-window variants
7. **Findings** — honest limitations and what we learned

---

## Data sources

- **JHU CSSE COVID-19 Data Repository** — confirmed, recovered, deaths time series
- **Our World in Data** — India vaccination data (used for limitations discussion)
- **World Bank** — India 2021 population as an upper-bound sanity check for N_eff

All five JSON data files in `data/` were **precomputed** from our from-scratch Python optimizer suite (`code/optimizers.py` in the parent project). The app consumes them as a static asset layer.

---

## How it was built

- **Vendor bundles** in `vendor/` — React 18.3.1 (UMD), ReactDOM, PropTypes, Recharts 2.13.3, all served as plain `<script>` tags. Tailwind CSS is precompiled to `vendor/tailwind.css` with only the utilities this app actually uses (~13 KB minified).
- **`app.jsx`** — the source. Around 930 lines of React components.
- **`app.js`** — precompiled with Babel preset-react. Loaded directly by the browser.
- **No runtime transpilation.** No bundler. No build tools needed to run it.

---

## To regenerate data

If you change the optimizers or the window:

```bash
cd ../code        # parent project's code directory
python3 experiments.py    # (re)runs all 7 experiments
python3 export_for_app.py # rebuilds the 5 JSON files into app/data/
```

Then refresh the browser.

---

## To modify the UI

Edit `app.jsx`, then run Babel to recompile:

```bash
npx babel app.jsx --presets=@babel/preset-react -o app.js
```

Or just edit `app.js` directly — it's plain React.createElement() output, fully readable.

---

## File overview

```
app/
├── index.html           # Entry point (loads vendor/ + app.js)
├── app.jsx              # Source (React + JSX)
├── app.js               # Babel-compiled (what the browser runs)
├── vendor/              # Local bundles (no CDN needed)
│   ├── react.min.js
│   ├── react-dom.min.js
│   ├── prop-types.min.js
│   ├── recharts.min.js
│   └── tailwind.css
├── data/                # Precomputed optimizer trajectories (JSON)
│   ├── wave_series.json
│   ├── optimizer_paths.json
│   ├── summary_metrics.json
│   ├── failure_cases.json
│   └── window_variants.json
└── README.md            # This file
```

Total size: ~1.3 MB. Fully offline-capable.

---

## Why precomputed?

Because the project is a **demo artifact** for presentations and vivas, not a live computation engine. Precomputing the optimizer trajectories once in Python (where the numerics are solid and verified against SciPy to 8.5 × 10⁻⁶ agreement) and animating them in the browser gives you three big wins over running optimizers live in JavaScript:

1. **Presentation-safe** — nothing numerical can fail mid-demo
2. **Fast** — the entire wave of calibration plays in seconds, not minutes
3. **Academically honest** — the visualization is explicitly a UI layer on top of the report's real outputs
