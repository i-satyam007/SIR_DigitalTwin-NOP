"use strict";

// React / ReactDOM / Recharts come from UMD globals
const React = window.React;
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;
const {
  createRoot
} = window.ReactDOM;
const {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} = window.Recharts;

/* ═══════════════════════════════════════════════════════════════════
   DATA LOADING
   ═══════════════════════════════════════════════════════════════════ */
const DATA_URLS = {
  wave: "./data/wave_series.json",
  paths: "./data/optimizer_paths.json",
  summary: "./data/summary_metrics.json",
  failures: "./data/failure_cases.json",
  windows: "./data/window_variants.json"
};
async function fetchAllData() {
  const keys = Object.keys(DATA_URLS);
  const results = await Promise.all(keys.map(k => fetch(DATA_URLS[k]).then(r => {
    if (!r.ok) throw new Error(`Failed to fetch ${k}: ${r.status}`);
    return r.json();
  })));
  return Object.fromEntries(keys.map((k, i) => [k, results[i]]));
}

/* ═══════════════════════════════════════════════════════════════════
   COLOR + HELPERS
   ═══════════════════════════════════════════════════════════════════ */
const METHOD_COLORS = {
  GD: "#f97316",
  Newton: "#ef4444",
  BFGS: "#34d399",
  GN: "#a78bfa",
  Penalty: "#facc15",
  Barrier: "#ec4899"
};
const METHOD_FULL = {
  GD: "Gradient Descent",
  Newton: "Newton's Method",
  BFGS: "BFGS Quasi-Newton",
  GN: "Gauss-Newton",
  Penalty: "Quadratic Penalty",
  Barrier: "Log-Barrier"
};
const fmt = (x, d = 4) => x == null ? "—" : Number(x).toFixed(d);
const fmtInt = x => x == null ? "—" : Math.round(x).toLocaleString();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDateShort = dStr => {
  if (!dStr) return '';
  const [y, m, d] = dStr.split('-');
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]}`;
};
const formatDateFull = dStr => {
  if (!dStr) return '';
  const [y, m, d] = dStr.split('-');
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]} ${y}`;
};
const Tex = ({
  math
}) => /*#__PURE__*/React.createElement("span", {
  dangerouslySetInnerHTML: {
    __html: window.katex.renderToString(math, {
      throwOnError: false
    })
  }
});
const fmtSciTex = num => {
  if (num == null) return '';
  const [base, exp] = Number(num).toExponential(1).split('e');
  return `${base} \\times 10^{${parseInt(exp, 10)}}`;
};
const fmtMil = x => x == null ? "—" : (x / 1e6).toFixed(2) + " M";

/* ═══════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════ */
function Hero({
  summary,
  onCta
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "relative pt-16 pb-10 px-8 md:px-14 fade-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-accent mb-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-block w-2 h-2 rounded-full bg-accent animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: "section-label"
  }, "Numerical Optimization \xB7 IIM Indore")), /*#__PURE__*/React.createElement("h1", {
    className: "font-sans font-semibold tracking-tight text-5xl md:text-7xl leading-[1.05] mb-4"
  }, "From ", /*#__PURE__*/React.createElement("span", {
    className: "text-accent"
  }, "People"), " to ", /*#__PURE__*/React.createElement("span", {
    className: "text-accent2"
  }, "Parameters")), /*#__PURE__*/React.createElement("p", {
    className: "text-dim text-xl md:text-2xl font-light mb-2"
  }, "An interactive SIR Digital Twin of India's second COVID wave."), /*#__PURE__*/React.createElement("p", {
    className: "text-faint text-sm md:text-base max-w-3xl"
  }, "Watch numerical optimization algorithms calibrate an epidemic model against real Johns Hopkins data \u2014 not as abstract iterations, but as a living population that learns the shape of a pandemic."), summary && /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-5 gap-3 mt-10"
  }, /*#__PURE__*/React.createElement(GlanceCard, {
    label: "Window",
    value: `${summary.window.start} → ${summary.window.end}`,
    sub: `${summary.window.T} days`
  }), /*#__PURE__*/React.createElement(GlanceCard, {
    label: "Data Source",
    value: "JHU CSSE",
    sub: "+ OWID + World Bank"
  }), /*#__PURE__*/React.createElement(GlanceCard, {
    label: "Best Optimizer",
    value: "Gauss-Newton",
    sub: `Converged in ${summary.headline.iters} iters`
  }), /*#__PURE__*/React.createElement(GlanceCard, {
    label: /*#__PURE__*/React.createElement("span", null, "Fitted ", /*#__PURE__*/React.createElement(Tex, {
      math: "R_0"
    })),
    value: fmt(summary.headline.R0, 3),
    sub: /*#__PURE__*/React.createElement("span", null, "(", /*#__PURE__*/React.createElement(Tex, {
      math: "\\\\Delta"
    }), ": 1.5 \u2013 2.8)"),
    highlight: true
  }), /*#__PURE__*/React.createElement(GlanceCard, {
    label: "SciPy Agreement",
    value: /*#__PURE__*/React.createElement(Tex, {
      math: fmtSciTex(summary.scipy.agreement_rel)
    }),
    sub: "relative error"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-3 mt-10"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => onCta('calibration')
  }, "\u2699 Open the Calibration Lab"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => onCta('model')
  }, "\uD83D\uDD2C Explore the SIR model"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => onCta('failures')
  }, "\u26A0 See where methods fail"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => onCta('takeaways')
  }, "\uD83D\uDCD8 Jump to findings"))));
}
function GlanceCard({
  label,
  value,
  sub,
  highlight
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `glass px-4 py-3 smooth-appear ${highlight ? 'ring-1 ring-accent/40' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider mb-1"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: `font-semibold text-lg ${highlight ? 'text-accent2' : 'text-ink'} mono`
  }, value), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-dim mt-0.5"
  }, sub));
}

/* ═══════════════════════════════════════════════════════════════════
   SIR EXPLAINER — animated agents + equations
   ═══════════════════════════════════════════════════════════════════ */
function SirExplainer({
  wave
}) {
  // Animate a stylized population of ~300 agents through the S->I->R trajectory
  // using the Gauss-Newton fitted curves to drive proportions each frame.
  const canvasRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [dayIdx, setDayIdx] = useState(0);
  const rafRef = useRef();
  const dayIdxRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Agent state: positions, velocities, state markers
  const agentsRef = useRef([]);
  useEffect(() => {
    const N = 320;
    agentsRef.current = Array.from({
      length: N
    }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0008,
      vy: (Math.random() - 0.5) * 0.0008,
      state: 'S'
      // Each agent has a slot; we reassign which slot is I/R based on proportions per frame
    }));
  }, []);
  const gnFit = wave?.fitted?.GN;
  const totalDays = wave?.I_data?.length ?? 0;
  useEffect(() => {
    if (!gnFit || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const W = canvasRef.current.width,
      H = canvasRef.current.height;
    function tick(ts) {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min(50, ts - lastTimeRef.current);
      lastTimeRef.current = ts;

      // Advance day index at ~8 days/sec when playing
      if (playing && gnFit) {
        dayIdxRef.current = (dayIdxRef.current + dt * 0.008) % totalDays;
        setDayIdx(Math.floor(dayIdxRef.current));
      }
      const di = Math.floor(dayIdxRef.current);
      const N_eff = gnFit.N_eff;
      const I_now = gnFit.I_pred[di] || 0;
      const R_now = gnFit.R_pred[di] || 0;
      const S_now = Math.max(0, N_eff - I_now - R_now);
      const total = S_now + I_now + R_now;
      const pI = total > 0 ? I_now / total : 0;
      const pR = total > 0 ? R_now / total : 0;

      // Reassign states by sorted order (stable-ish visual)
      const agents = agentsRef.current;
      const nA = agents.length;
      const nI = Math.round(pI * nA);
      const nR = Math.round(pR * nA);
      // For a smooth visual: assign the first nI agents as I, next nR as R, rest S
      // To avoid flicker, we sort agents by a stable index: just use array order.
      for (let i = 0; i < nA; i++) {
        if (i < nI) agents[i].state = 'I';else if (i < nI + nR) agents[i].state = 'R';else agents[i].state = 'S';
      }

      // Move agents (slight random walk)
      for (const a of agents) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.x < 0.02 || a.x > 0.98) {
          a.vx = -a.vx;
          a.x = Math.max(0.02, Math.min(0.98, a.x));
        }
        if (a.y < 0.02 || a.y > 0.98) {
          a.vy = -a.vy;
          a.y = Math.max(0.02, Math.min(0.98, a.y));
        }
        if (Math.random() < 0.002) {
          a.vx = (Math.random() - 0.5) * 0.0012;
          a.vy = (Math.random() - 0.5) * 0.0012;
        }
      }

      // Render
      ctx.clearRect(0, 0, W, H);
      // Subtle grid
      ctx.strokeStyle = 'rgba(30,47,85,0.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(i * W / 6, 0);
        ctx.lineTo(i * W / 6, H);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * H / 6);
        ctx.lineTo(W, i * H / 6);
        ctx.stroke();
      }
      const pulse = 1 + 0.15 * Math.sin(ts * 0.006);
      for (const a of agents) {
        const x = a.x * W,
          y = a.y * H;
        if (a.state === 'I') {
          // Glow aura
          const g = ctx.createRadialGradient(x, y, 0, x, y, 10 * pulse);
          g.addColorStop(0, 'rgba(239,68,68,0.9)');
          g.addColorStop(1, 'rgba(239,68,68,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, 10 * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (a.state === 'R') {
          ctx.fillStyle = 'rgba(52,211,153,0.55)';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(96,165,250,0.8)';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gnFit, playing, totalDays]);
  if (!gnFit) return null;

  // Current proportions for the readouts
  const di = Math.floor(dayIdx);
  const total = gnFit.N_eff;
  const I_now = gnFit.I_pred[di] || 0;
  const R_now = gnFit.R_pred[di] || 0;
  const S_now = Math.max(0, total - I_now - R_now);
  return /*#__PURE__*/React.createElement("section", {
    id: "model",
    className: "px-8 md:px-14 py-14 fade-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label mb-2"
  }, "01 \xB7 The Model"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl md:text-4xl font-semibold mb-2"
  }, "Susceptible, Infected, Removed."), /*#__PURE__*/React.createElement("p", {
    className: "text-dim max-w-2xl"
  }, "The SIR model (Kermack & McKendrick, 1927) sorts every person in a population into one of three states and describes how they flow between them. Two parameters govern the entire trajectory: the infection rate \u03B2 and the recovery rate \u03B3.")), /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass overflow-hidden relative p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider"
  }, "Stylized population"), /*#__PURE__*/React.createElement("div", {
    className: "text-ink font-medium"
  }, "Day ", di + 1, " / ", totalDays, " \xB7 ", formatDateFull(wave.dates[di]))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    className: `btn ${playing ? 'btn-active' : 'btn-ghost'}`,
    onClick: () => setPlaying(p => !p)
  }, playing ? '⏸ Pause' : '▶ Play'), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => {
      dayIdxRef.current = 0;
      setDayIdx(0);
    }
  }, "\u21BA Reset"))), /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    width: 640,
    height: 360,
    className: "rounded-lg bg-bg/40 w-full"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex h-2 rounded-full overflow-hidden bg-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-susc",
    style: {
      width: `${100 * S_now / total}%`
    },
    title: `S = ${fmtInt(S_now)}`
  }), /*#__PURE__*/React.createElement("div", {
    className: "bg-infc",
    style: {
      width: `${100 * I_now / total}%`
    },
    title: `I = ${fmtInt(I_now)}`
  }), /*#__PURE__*/React.createElement("div", {
    className: "bg-remv",
    style: {
      width: `${100 * R_now / total}%`
    },
    title: `R = ${fmtInt(R_now)}`
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2 mt-2 text-[11px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-susc"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-dim"
  }, "Susceptible"), /*#__PURE__*/React.createElement("span", {
    className: "mono ml-auto text-ink"
  }, fmtMil(S_now))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-infc"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-dim"
  }, "Infected"), /*#__PURE__*/React.createElement("span", {
    className: "mono ml-auto text-ink"
  }, fmtMil(I_now))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-remv"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-dim"
  }, "Removed"), /*#__PURE__*/React.createElement("span", {
    className: "mono ml-auto text-ink"
  }, fmtMil(R_now))))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint mt-2 italic"
  }, "The animation is a visual expression of the fitted SIR proportions. It is not a separate scientific simulation.")), /*#__PURE__*/React.createElement("div", {
    className: "glass p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label mb-3"
  }, "The equations"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 mono text-lg"
  }, /*#__PURE__*/React.createElement(EqLine, {
    lhs: /*#__PURE__*/React.createElement(Tex, {
      math: "\\\\frac{dS}{dt}"
    }),
    rhs: /*#__PURE__*/React.createElement(Tex, {
      math: "-\\\\frac{\\\\beta S I}{N}"
    }),
    note: "Susceptible individuals decrease as they get infected"
  }), /*#__PURE__*/React.createElement(EqLine, {
    lhs: /*#__PURE__*/React.createElement(Tex, {
      math: "\\\\frac{dI}{dt}"
    }),
    rhs: /*#__PURE__*/React.createElement(Tex, {
      math: "+\\\\frac{\\\\beta S I}{N} - \\\\gamma I"
    }),
    note: "Infected count rises with new infections and falls with recoveries"
  }), /*#__PURE__*/React.createElement(EqLine, {
    lhs: /*#__PURE__*/React.createElement(Tex, {
      math: "\\\\frac{dR}{dt}"
    }),
    rhs: /*#__PURE__*/React.createElement(Tex, {
      math: "+\\\\gamma I"
    }),
    note: "Removed (recovered + deceased) grows monotonically"
  })), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-edge my-5"
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(Badge, {
    label: /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Tex, {
      math: "\\\\beta"
    }), " (infection rate)"),
    value: fmt(gnFit.beta, 4),
    color: "#ef4444"
  }), /*#__PURE__*/React.createElement(Badge, {
    label: /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Tex, {
      math: "\\\\gamma"
    }), " (recovery rate)"),
    value: fmt(gnFit.gamma, 4),
    color: "#34d399"
  }), /*#__PURE__*/React.createElement(Badge, {
    label: /*#__PURE__*/React.createElement(Tex, {
      math: "R_0 = \\\\beta/\\\\gamma"
    }),
    value: fmt(gnFit.R0, 3),
    color: "#38bdf8",
    big: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-dim mt-4"
  }, "The basic reproduction number ", /*#__PURE__*/React.createElement("span", {
    className: "text-ink mono"
  }, /*#__PURE__*/React.createElement(Tex, {
    math: `R_0 = \\beta/\\gamma \\approx ${fmt(gnFit.R0, 2)}`
  })), " means each infected person transmits to ", /*#__PURE__*/React.createElement("span", {
    className: "text-ink mono"
  }, "~", fmt(gnFit.R0, 1)), " others on average. This matches published estimates for the ", /*#__PURE__*/React.createElement(Tex, {
    math: "\\\\Delta"
  }), " variant (1.5 \u2013 2.8).")))));
}
function EqLine({
  lhs,
  rhs,
  note
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-accent"
  }, lhs), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-dim"
  }, "="), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-ink"
  }, rhs)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint ml-1 mt-0.5 font-sans"
  }, note));
}
function Badge({
  label,
  value,
  color,
  big
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "glass-hard px-3 py-2.5",
    style: {
      borderColor: color + '30'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider mb-1"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: `mono font-semibold ${big ? 'text-2xl' : 'text-lg'}`,
    style: {
      color
    }
  }, value));
}

/* ═══════════════════════════════════════════════════════════════════
   DATA PIPELINE (Screen 3) — compact, information-dense
   ═══════════════════════════════════════════════════════════════════ */
function DataPipeline({
  wave
}) {
  const chartData = useMemo(() => {
    if (!wave) return [];
    return wave.dates.map((d, i) => ({
      date: d,
      I: wave.I_data[i],
      R: wave.R_data[i]
    }));
  }, [wave]);
  return /*#__PURE__*/React.createElement("section", {
    id: "data",
    className: "px-8 md:px-14 py-14 fade-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label mb-2"
  }, "02 \xB7 The Data"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl md:text-4xl font-semibold mb-2"
  }, "Raw counts \u2192 Model-ready compartments."), /*#__PURE__*/React.createElement("p", {
    className: "text-dim max-w-2xl"
  }, "JHU CSSE provides three cumulative series. We map them to SIR compartments and apply a 7-day rolling mean to suppress weekday reporting artifacts.")), /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-5 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-2 space-y-3"
  }, /*#__PURE__*/React.createElement(PipelineStep, {
    n: "1",
    title: "Raw JHU series",
    body: "Confirmed(t), Recovered(t), Deaths(t) \u2014 all cumulative, daily, per country"
  }), /*#__PURE__*/React.createElement(PipelineStep, {
    n: "2",
    title: "Compartment mapping",
    body: "I(t) = Confirmed \u2212 Recovered \u2212 Deaths   |   R(t) = Recovered + Deaths"
  }), /*#__PURE__*/React.createElement(PipelineStep, {
    n: "3",
    title: "7-day smoothing",
    body: "Rolling mean removes weekday reporting artifacts without affecting the wave's shape"
  }), /*#__PURE__*/React.createElement(PipelineStep, {
    n: "4",
    title: "Residual normalization",
    body: "Residuals scaled by max(I), max(R) so the removed curve doesn't dominate the fit"
  })), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-3 glass p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider"
  }, "India second wave \xB7 1 Mar \u2013 15 Jun 2021"), /*#__PURE__*/React.createElement("div", {
    className: "text-ink font-medium"
  }, "Peak active: ", fmtMil(wave?.peak_I), " on ", formatDateFull(wave?.peak_I_date))), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-dim"
  }, "T = ", wave?.dates?.length, " days")), /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 280
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: chartData,
    margin: {
      top: 5,
      right: 5,
      left: 0,
      bottom: 5
    }
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#1e2f55",
    opacity: 0.6
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "date",
    stroke: "#4d5f82",
    tick: {
      fontSize: 10,
      fill: '#8ea2c6'
    },
    tickFormatter: d => formatDateShort(d)
  }), /*#__PURE__*/React.createElement(YAxis, {
    yAxisId: "L",
    stroke: "#4d5f82",
    tick: {
      fontSize: 10,
      fill: '#8ea2c6'
    },
    tickFormatter: v => (v / 1e6).toFixed(1) + 'M'
  }), /*#__PURE__*/React.createElement(YAxis, {
    yAxisId: "R",
    orientation: "right",
    stroke: "#4d5f82",
    tick: {
      fontSize: 10,
      fill: '#8ea2c6'
    },
    tickFormatter: v => (v / 1e6).toFixed(0) + 'M'
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      background: '#0b1730',
      border: '1px solid #1e2f55',
      borderRadius: 8,
      fontSize: 12
    },
    formatter: v => fmtMil(v)
  }), /*#__PURE__*/React.createElement(Line, {
    yAxisId: "L",
    dataKey: "I",
    name: "I(t) active",
    stroke: "#ef4444",
    strokeWidth: 2,
    dot: false
  }), /*#__PURE__*/React.createElement(Line, {
    yAxisId: "R",
    dataKey: "R",
    name: "R(t) removed",
    stroke: "#34d399",
    strokeWidth: 2,
    dot: false
  })))))));
}
function PipelineStep({
  n,
  title,
  body
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "glass p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center mono text-xs font-semibold border border-accent/30 shrink-0"
  }, n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-ink font-medium text-sm"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "text-dim text-xs mt-0.5 mono"
  }, body))));
}

/* ═══════════════════════════════════════════════════════════════════
   CALIBRATION LAB (Screen 4) — the centerpiece
   ═══════════════════════════════════════════════════════════════════ */
function CalibrationLab({
  wave,
  paths,
  summary
}) {
  const methods = Object.keys(paths || {});
  const [method, setMethod] = useState("GN");
  const [playing, setPlaying] = useState(false);
  const [iterIdx, setIterIdx] = useState(0);
  const rafRef = useRef();
  const lastTsRef = useRef(0);
  const path = paths?.[method];
  const frames = path?.frames || [];
  const nFrames = frames.length;

  // Animate through frames
  useEffect(() => {
    if (!playing || nFrames === 0) return;
    function tick(ts) {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      if (dt > 180) {
        setIterIdx(i => {
          const nxt = i + 1;
          if (nxt >= nFrames) {
            setPlaying(false);
            return i;
          }
          return nxt;
        });
        lastTsRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, nFrames]);
  useEffect(() => {
    setIterIdx(0);
    setPlaying(false);
  }, [method]);
  const currentFrame = frames[iterIdx] || frames[0];

  // Build current fit curve: use last frame with I_pred attached up to this point
  const fitAtFrame = useMemo(() => {
    if (!frames?.length || !wave) return null;
    // Walk backward from iterIdx to find the most recent frame with I_pred populated
    for (let k = iterIdx; k >= 0; k--) {
      if (frames[k]?.I_pred) return {
        I_pred: frames[k].I_pred,
        R_pred: frames[k].R_pred,
        iter: frames[k].iter
      };
    }
    return null;
  }, [iterIdx, frames, wave]);

  // Chart data: observed + fitted (at current iteration)
  const fitData = useMemo(() => {
    if (!wave) return [];
    return wave.dates.map((d, i) => ({
      date: d,
      I_obs: wave.I_data[i],
      R_obs: wave.R_data[i],
      I_fit: fitAtFrame?.I_pred?.[i] ?? null,
      R_fit: fitAtFrame?.R_pred?.[i] ?? null
    }));
  }, [wave, fitAtFrame]);

  // Convergence line data
  const convData = useMemo(() => {
    if (!path) return [];
    return path.f_history.map((v, i) => ({
      iter: i,
      f: Math.max(v, 1e-6),
      gn: path.grad_norm_history[i]
    }));
  }, [path]);

  // Visualize the param-space path projected to (beta, gamma)
  const pathProjection = useMemo(() => {
    if (!path) return [];
    return path.x_history.map((x, i) => ({
      beta: x[0],
      gamma: x[1],
      N: x[2],
      i
    }));
  }, [path]);
  return /*#__PURE__*/React.createElement("section", {
    id: "calibration",
    className: "px-8 md:px-14 py-14 fade-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-8 flex items-end justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "section-label mb-2"
  }, "03 \xB7 The Calibration Lab"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl md:text-4xl font-semibold mb-2"
  }, "Watch the model learn."), /*#__PURE__*/React.createElement("p", {
    className: "text-dim max-w-3xl"
  }, "Pick an optimizer. Press play. The fit curve bends toward the data, the parameter cards update, and the convergence chart draws \u2014 in the same order the algorithm actually did it.")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    className: `btn ${playing ? 'btn-active' : 'btn-primary'}`,
    onClick: () => setPlaying(p => !p)
  }, playing ? '⏸ Pause' : '▶ Play'), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => {
      setIterIdx(0);
      setPlaying(false);
    }
  }, "\u21BA Reset"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => {
      setIterIdx(nFrames - 1);
      setPlaying(false);
    }
  }, "\u23ED Jump to end"))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 flex-wrap mb-6"
  }, methods.map(m => /*#__PURE__*/React.createElement("button", {
    key: m,
    className: `btn ${method === m ? 'btn-active' : 'btn-ghost'}`,
    onClick: () => setMethod(m),
    style: method === m ? {
      background: METHOD_COLORS[m],
      color: '#061220'
    } : {}
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full",
    style: {
      background: METHOD_COLORS[m]
    }
  }), METHOD_FULL[m], /*#__PURE__*/React.createElement("span", {
    className: "mono text-xs opacity-70 ml-1"
  }, "(", paths[m].n_iters, " iter)")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-12 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-8 glass p-5 relative"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider"
  }, "Fit vs observed"), /*#__PURE__*/React.createElement("div", {
    className: "text-ink font-medium"
  }, METHOD_FULL[method], /*#__PURE__*/React.createElement("span", {
    className: "text-dim text-sm ml-2"
  }, "iter ", currentFrame?.iter ?? 0))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-dim"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mr-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-block w-3 h-0.5 bg-accent align-middle mr-1"
  }), "Observed"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "inline-block w-3 h-0.5 align-middle mr-1",
    style: {
      background: METHOD_COLORS[method]
    }
  }), "Fitted"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-dim mb-1"
  }, "Active infected I(t)"), /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 220
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: fitData,
    margin: {
      top: 5,
      right: 5,
      left: 0,
      bottom: 5
    }
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#1e2f55"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "date",
    stroke: "#4d5f82",
    tick: {
      fontSize: 9,
      fill: '#8ea2c6'
    },
    tickFormatter: d => formatDateShort(d),
    interval: 15
  }), /*#__PURE__*/React.createElement(YAxis, {
    stroke: "#4d5f82",
    tick: {
      fontSize: 9,
      fill: '#8ea2c6'
    },
    tickFormatter: v => (v / 1e6).toFixed(1) + 'M'
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      background: '#0b1730',
      border: '1px solid #1e2f55',
      borderRadius: 8,
      fontSize: 11
    },
    formatter: v => v == null ? '—' : fmtMil(v)
  }), /*#__PURE__*/React.createElement(Line, {
    dataKey: "I_obs",
    stroke: "#38bdf8",
    strokeWidth: 2,
    dot: false,
    isAnimationActive: false,
    name: "I observed"
  }), /*#__PURE__*/React.createElement(Line, {
    dataKey: "I_fit",
    stroke: METHOD_COLORS[method],
    strokeWidth: 2.5,
    dot: false,
    isAnimationActive: false,
    name: "I fit"
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-dim mb-1"
  }, "Removed R(t)"), /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 220
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: fitData,
    margin: {
      top: 5,
      right: 5,
      left: 0,
      bottom: 5
    }
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#1e2f55"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "date",
    stroke: "#4d5f82",
    tick: {
      fontSize: 9,
      fill: '#8ea2c6'
    },
    tickFormatter: d => formatDateShort(d),
    interval: 15
  }), /*#__PURE__*/React.createElement(YAxis, {
    stroke: "#4d5f82",
    tick: {
      fontSize: 9,
      fill: '#8ea2c6'
    },
    tickFormatter: v => (v / 1e6).toFixed(0) + 'M'
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      background: '#0b1730',
      border: '1px solid #1e2f55',
      borderRadius: 8,
      fontSize: 11
    },
    formatter: v => v == null ? '—' : fmtMil(v)
  }), /*#__PURE__*/React.createElement(Line, {
    dataKey: "R_obs",
    stroke: "#38bdf8",
    strokeWidth: 2,
    dot: false,
    isAnimationActive: false,
    name: "R observed"
  }), /*#__PURE__*/React.createElement(Line, {
    dataKey: "R_fit",
    stroke: METHOD_COLORS[method],
    strokeWidth: 2.5,
    dot: false,
    isAnimationActive: false,
    name: "R fit"
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 0,
    max: Math.max(0, nFrames - 1),
    value: iterIdx,
    onChange: e => {
      setIterIdx(Number(e.target.value));
      setPlaying(false);
    },
    className: "w-full accent-accent"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-xs text-faint mt-1"
  }, /*#__PURE__*/React.createElement("span", null, "iter 0"), /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "Frame ", iterIdx + 1, " / ", nFrames), /*#__PURE__*/React.createElement("span", null, "iter ", path.n_iters)))), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-4 space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider mb-3"
  }, "Live parameter estimates"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Badge, {
    label: /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Tex, {
      math: "\\\\beta"
    }), " (infection)"),
    value: fmt(currentFrame?.beta, 4),
    color: "#ef4444"
  }), /*#__PURE__*/React.createElement(Badge, {
    label: /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Tex, {
      math: "\\\\gamma"
    }), " (recovery)"),
    value: fmt(currentFrame?.gamma, 4),
    color: "#34d399"
  }), /*#__PURE__*/React.createElement(Badge, {
    label: /*#__PURE__*/React.createElement(Tex, {
      math: "N_{\\\\text{eff}}"
    }),
    value: currentFrame?.N_eff ? fmtMil(currentFrame.N_eff) : '—',
    color: "#60a5fa"
  }), /*#__PURE__*/React.createElement(Badge, {
    label: /*#__PURE__*/React.createElement(Tex, {
      math: "R_0 = \\\\beta/\\\\gamma"
    }),
    value: fmt(currentFrame?.R0, 3),
    color: "#38bdf8",
    big: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-dim mt-3 mono"
  }, "f(x) = ", /*#__PURE__*/React.createElement("span", {
    className: "text-ink"
  }, fmt(currentFrame?.f, 4)))), /*#__PURE__*/React.createElement("div", {
    className: "glass p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider mb-2"
  }, "Convergence"), /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 140
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: convData.slice(0, Math.max(2, Math.round(iterIdx / (nFrames - 1 || 1) * convData.length)))
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#1e2f55"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "iter",
    stroke: "#4d5f82",
    tick: {
      fontSize: 9,
      fill: '#8ea2c6'
    }
  }), /*#__PURE__*/React.createElement(YAxis, {
    scale: "log",
    domain: ['auto', 'auto'],
    stroke: "#4d5f82",
    tick: {
      fontSize: 9,
      fill: '#8ea2c6'
    }
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      background: '#0b1730',
      border: '1px solid #1e2f55',
      borderRadius: 8,
      fontSize: 11
    }
  }), /*#__PURE__*/React.createElement(Line, {
    dataKey: "f",
    stroke: METHOD_COLORS[method],
    strokeWidth: 2,
    dot: false,
    isAnimationActive: false,
    name: "f(x)"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-dim mt-1 mono"
  }, "Objective value vs iteration (log scale)"))), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-12 glass p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider"
  }, "Parameter-space trajectory"), /*#__PURE__*/React.createElement("div", {
    className: "text-ink font-medium"
  }, "\u03B2 \u2013 \u03B3 plane (all methods overlaid)")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-dim"
  }, "\u2605 = current position \xB7 \u25CF = start \xB7 ", /*#__PURE__*/React.createElement("span", {
    className: "text-accent"
  }, "published R\u2080 range dashed"))), /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 260
  }, /*#__PURE__*/React.createElement(ScatterChart, {
    margin: {
      top: 5,
      right: 5,
      bottom: 5,
      left: 0
    }
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#1e2f55"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "beta",
    type: "number",
    domain: [0.05, 0.5],
    allowDataOverflow: true,
    stroke: "#4d5f82",
    tick: {
      fontSize: 10,
      fill: '#8ea2c6'
    },
    label: {
      value: 'β',
      position: 'insideBottom',
      offset: -5,
      fill: '#8ea2c6'
    }
  }), /*#__PURE__*/React.createElement(YAxis, {
    dataKey: "gamma",
    type: "number",
    domain: [0.02, 0.3],
    allowDataOverflow: true,
    stroke: "#4d5f82",
    tick: {
      fontSize: 10,
      fill: '#8ea2c6'
    },
    label: {
      value: 'γ',
      angle: -90,
      position: 'insideLeft',
      fill: '#8ea2c6'
    }
  }), /*#__PURE__*/React.createElement(ZAxis, {
    range: [20, 20]
  }), /*#__PURE__*/React.createElement(Tooltip, {
    content: ({
      active,
      payload
    }) => {
      if (!active || !payload?.length) return null;
      const d = payload[0].payload;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          background: '#0b1730',
          border: '1px solid #1e2f55',
          padding: 8,
          borderRadius: 6,
          fontSize: 11
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "mono"
      }, "\u03B2 = ", fmt(d.beta, 4), /*#__PURE__*/React.createElement("br", null), "\u03B3 = ", fmt(d.gamma, 4), /*#__PURE__*/React.createElement("br", null), "iter ", d.i));
    }
  }), /*#__PURE__*/React.createElement(ReferenceLine, {
    segment: [{
      x: 0.03,
      y: 0.02
    }, {
      x: 0.5,
      y: 0.5 / 1.5
    }],
    stroke: "#38bdf8",
    strokeDasharray: "4 4",
    strokeOpacity: 0.4
  }), /*#__PURE__*/React.createElement(ReferenceLine, {
    segment: [{
      x: 0.056,
      y: 0.02
    }, {
      x: 0.5,
      y: 0.5 / 2.8
    }],
    stroke: "#38bdf8",
    strokeDasharray: "4 4",
    strokeOpacity: 0.4
  }), methods.map(m => {
    const data = paths[m].x_history.map((x, i) => ({
      beta: x[0],
      gamma: x[1],
      i,
      m
    })).filter(d => d.beta >= 0.03 && d.beta <= 0.55 && d.gamma >= 0.01 && d.gamma <= 0.32);
    return /*#__PURE__*/React.createElement(Scatter, {
      key: m,
      data: data,
      fill: METHOD_COLORS[m],
      line: {
        stroke: METHOD_COLORS[m],
        strokeWidth: 1.5,
        strokeOpacity: m === method ? 0.9 : 0.2
      },
      shape: props => {
        const {
          cx,
          cy,
          payload
        } = props;
        if (payload.m !== method) return null;
        return /*#__PURE__*/React.createElement("circle", {
          cx: cx,
          cy: cy,
          r: 1.5,
          fill: METHOD_COLORS[m],
          opacity: 0.6
        });
      }
    });
  }), currentFrame && /*#__PURE__*/React.createElement(Scatter, {
    data: [{
      beta: currentFrame.beta,
      gamma: currentFrame.gamma,
      i: currentFrame.iter,
      m: method
    }],
    fill: METHOD_COLORS[method],
    shape: "star"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-dim mt-2"
  }, "Each optimizer leaves a trail in parameter space. First-order methods zigzag; second-order methods take long confident strides; Gauss-Newton cuts almost straight to the optimum.")))));
}

/* ═══════════════════════════════════════════════════════════════════
   FAILURE + ROBUSTNESS
   ═══════════════════════════════════════════════════════════════════ */
function FailureExplorer({
  failures,
  windows
}) {
  const cases = Object.keys(failures || {});
  const [caseKey, setCaseKey] = useState(cases[0]);
  const [windowIdx, setWindowIdx] = useState(0);
  const activeCase = failures?.[caseKey];
  const activeWin = windows?.[windowIdx];
  const failData = useMemo(() => {
    if (!activeCase) return [];
    return activeCase.frames.map(f => ({
      iter: f.iter,
      f: f.f != null ? Math.min(Math.max(f.f, 1e-3), 1e16) : null,
      beta: f.beta,
      gamma: f.gamma,
      N_eff: f.N_eff
    }));
  }, [activeCase]);
  const winData = useMemo(() => {
    if (!activeWin) return [];
    return activeWin.dates.map((d, i) => ({
      date: d,
      I_obs: activeWin.I_data[i],
      I_fit: activeWin.I_pred[i],
      R_obs: activeWin.R_data[i],
      R_fit: activeWin.R_pred[i]
    }));
  }, [activeWin]);
  return /*#__PURE__*/React.createElement("section", {
    id: "failures",
    className: "px-8 md:px-14 py-14 fade-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label mb-2"
  }, "04 \xB7 Where things break"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl md:text-4xl font-semibold mb-2"
  }, "Failure modes & robustness."), /*#__PURE__*/React.createElement("p", {
    className: "text-dim max-w-3xl"
  }, "A project that shows only successful runs is suspicious. Here are the adversarial cases where methods blow up, drift, or disagree \u2014 and why constraints and line-search matter in practice.")), /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider mb-3"
  }, "Failure case explorer"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-3"
  }, cases.map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: `btn ${k === caseKey ? 'btn-active' : 'btn-ghost'}`,
    onClick: () => setCaseKey(k)
  }, failures[k].label))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-dim mb-2"
  }, activeCase?.description), /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 220
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: failData,
    margin: {
      top: 5,
      right: 5,
      left: 0,
      bottom: 5
    }
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#1e2f55"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "iter",
    stroke: "#4d5f82",
    tick: {
      fontSize: 10,
      fill: '#8ea2c6'
    }
  }), /*#__PURE__*/React.createElement(YAxis, {
    scale: "log",
    domain: ['auto', 'auto'],
    stroke: "#4d5f82",
    tick: {
      fontSize: 10,
      fill: '#8ea2c6'
    },
    tickFormatter: v => v.toExponential(0)
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      background: '#0b1730',
      border: '1px solid #1e2f55',
      borderRadius: 8,
      fontSize: 11
    }
  }), /*#__PURE__*/React.createElement(Line, {
    dataKey: "f",
    stroke: "#ef4444",
    strokeWidth: 2,
    dot: {
      r: 2.5,
      fill: '#ef4444'
    },
    isAnimationActive: false,
    name: "f(x)"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2 mt-3 text-[11px]"
  }, activeCase?.frames?.length && (() => {
    const last = activeCase.frames[activeCase.frames.length - 1];
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "mono"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-faint"
    }, "\u03B2 \u2192"), " ", /*#__PURE__*/React.createElement("span", {
      className: Math.abs(last.beta) > 1 ? 'text-infc' : 'text-ink'
    }, fmt(last.beta, 3))), /*#__PURE__*/React.createElement("div", {
      className: "mono"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-faint"
    }, "\u03B3 \u2192"), " ", /*#__PURE__*/React.createElement("span", {
      className: Math.abs(last.gamma) > 1 ? 'text-infc' : 'text-ink'
    }, fmt(last.gamma, 3))), /*#__PURE__*/React.createElement("div", {
      className: "mono"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-faint"
    }, "N \u2192"), " ", /*#__PURE__*/React.createElement("span", {
      className: Math.abs(last.N_eff) > 2e8 || last.N_eff < 0 ? 'text-infc' : 'text-ink'
    }, last.N_eff ? fmtMil(last.N_eff) : '—')));
  })())), /*#__PURE__*/React.createElement("div", {
    className: "glass p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider mb-3"
  }, "Time-window robustness"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-3"
  }, windows?.map((w, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: `btn ${i === windowIdx ? 'btn-active' : 'btn-ghost'}`,
    onClick: () => setWindowIdx(i)
  }, w.label.split(':')[0]))), activeWin && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-dim mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, activeWin.start, " \u2192 ", activeWin.end), " \xB7 T = ", activeWin.T, " days"), /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 220
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: winData,
    margin: {
      top: 5,
      right: 5,
      left: 0,
      bottom: 5
    }
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#1e2f55"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "date",
    stroke: "#4d5f82",
    tick: {
      fontSize: 9,
      fill: '#8ea2c6'
    },
    tickFormatter: d => formatDateShort(d),
    interval: 15
  }), /*#__PURE__*/React.createElement(YAxis, {
    stroke: "#4d5f82",
    tick: {
      fontSize: 9,
      fill: '#8ea2c6'
    },
    tickFormatter: v => (v / 1e6).toFixed(1) + 'M'
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      background: '#0b1730',
      border: '1px solid #1e2f55',
      borderRadius: 8,
      fontSize: 11
    },
    formatter: v => fmtMil(v)
  }), /*#__PURE__*/React.createElement(Line, {
    dataKey: "I_obs",
    stroke: "#38bdf8",
    strokeWidth: 2,
    dot: false,
    isAnimationActive: false,
    name: "Observed I"
  }), /*#__PURE__*/React.createElement(Line, {
    dataKey: "I_fit",
    stroke: "#a78bfa",
    strokeWidth: 2.5,
    dot: false,
    isAnimationActive: false,
    name: "Fitted I"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4 gap-2 mt-3 text-[11px] mono"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-faint"
  }, "\u03B2"), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-ink"
  }, fmt(activeWin.beta, 4))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-faint"
  }, "\u03B3"), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-ink"
  }, fmt(activeWin.gamma, 4))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-faint"
  }, "N_eff"), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-ink"
  }, fmtMil(activeWin.N_eff))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-faint"
  }, /*#__PURE__*/React.createElement(Tex, {
    math: "R_0"
  })), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-accent2"
  }, fmt(activeWin.R0, 3)))))))));
}

/* ═══════════════════════════════════════════════════════════════════
   ALL-METHODS COMPARISON CHART
   ═══════════════════════════════════════════════════════════════════ */
function AllMethodsConvergence({
  paths
}) {
  const methods = Object.keys(paths || {});
  // Normalize to same iteration axis length
  const data = useMemo(() => {
    const maxLen = Math.max(...methods.map(m => paths[m].f_history.length));
    const rows = [];
    for (let i = 0; i < maxLen; i++) {
      const row = {
        iter: i
      };
      methods.forEach(m => {
        const v = paths[m].f_history[i];
        row[m] = v != null && isFinite(v) ? Math.max(v, 1e-6) : null;
      });
      rows.push(row);
    }
    return rows;
  }, [paths, methods]);
  return /*#__PURE__*/React.createElement("section", {
    className: "px-8 md:px-14 py-6 fade-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto glass p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-faint uppercase tracking-wider"
  }, "All methods overlaid"), /*#__PURE__*/React.createElement("div", {
    className: "text-ink font-medium"
  }, "Objective f(x) vs iteration \u2014 same start, same data")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-dim"
  }, "log scale \xB7 fewer iterations = faster convergence")), /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 260
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: data,
    margin: {
      top: 5,
      right: 20,
      left: 0,
      bottom: 5
    }
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#1e2f55"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "iter",
    stroke: "#4d5f82",
    tick: {
      fontSize: 10,
      fill: '#8ea2c6'
    }
  }), /*#__PURE__*/React.createElement(YAxis, {
    scale: "log",
    domain: ['auto', 'auto'],
    stroke: "#4d5f82",
    tick: {
      fontSize: 10,
      fill: '#8ea2c6'
    }
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      background: '#0b1730',
      border: '1px solid #1e2f55',
      borderRadius: 8,
      fontSize: 11
    }
  }), /*#__PURE__*/React.createElement(Legend, {
    wrapperStyle: {
      fontSize: 11
    }
  }), methods.map(m => /*#__PURE__*/React.createElement(Line, {
    key: m,
    dataKey: m,
    stroke: METHOD_COLORS[m],
    strokeWidth: 2,
    dot: false,
    isAnimationActive: false,
    connectNulls: true
  }))))));
}

/* ═══════════════════════════════════════════════════════════════════
   FINDINGS / TAKEAWAYS
   ═══════════════════════════════════════════════════════════════════ */
function Findings({
  summary
}) {
  if (!summary) return null;
  return /*#__PURE__*/React.createElement("section", {
    id: "takeaways",
    className: "px-8 md:px-14 py-14 fade-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label mb-2"
  }, "05 \xB7 What we learned"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl md:text-4xl font-semibold mb-2"
  }, "Findings & honest limitations.")), /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-3 gap-5"
  }, /*#__PURE__*/React.createElement(FindingCard, {
    title: "Gauss-Newton wins for LS structure",
    body: `Converged to R₀ = ${fmt(summary.headline.R0, 3)} in ${summary.headline.iters} iterations. Newton matched it but needed full Hessians; BFGS got close using only gradients.`
  }), /*#__PURE__*/React.createElement(FindingCard, {
    title: "R\u2080 lands in the published range",
    body: `Our estimate of ${fmt(summary.headline.R0, 3)} falls within the Delta-variant range of 1.5–2.8 reported in the literature. Independent validation of the fit.`,
    highlight: true
  }), /*#__PURE__*/React.createElement(FindingCard, {
    title: "Matches SciPy to 6 decimals",
    body: `Our from-scratch Gauss-Newton agrees with scipy.optimize.least_squares (Trust Region Reflective) to a relative error of ${summary.scipy.agreement_rel.toExponential(1)}.`
  }), /*#__PURE__*/React.createElement(FindingCard, {
    title: "Step size isn't optional",
    body: "Fixed-\u03B1 Gradient Descent with \u03B1=0.5 diverges in a single step (f jumps to 10\xB9\u2074). Armijo backtracking converges, but still lands in a different local minimum."
  }), /*#__PURE__*/React.createElement(FindingCard, {
    title: "Constraints prevent absurdity",
    body: "Without bounds on N_eff, BFGS drifts to 437 million \u2014 above India's total urban population. Penalty/Barrier methods keep the optimizer inside the physically meaningful region."
  }), /*#__PURE__*/React.createElement(FindingCard, {
    title: "The SIR model underestimates the peak by ~15%",
    body: "Constant \u03B2, \u03B3 cannot represent intervention effects (lockdowns), age structure, or changing test capacity. This is a known, documented limitation of the base SIR model."
  })), /*#__PURE__*/React.createElement("div", {
    className: "glass-hard p-6 mt-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label mb-2"
  }, "Limitations (we own these)"), /*#__PURE__*/React.createElement("ul", {
    className: "text-sm text-dim space-y-1.5 list-disc pl-5"
  }, /*#__PURE__*/React.createElement("li", null, "Homogeneous mixing assumption; real contact networks have age and geography structure."), /*#__PURE__*/React.createElement("li", null, "\u03B2 and \u03B3 are held constant over 107 days; interventions and healthcare changes mean they aren't."), /*#__PURE__*/React.createElement("li", null, "Vaccination is implicitly lumped into Removed; a full SVIR model would be more accurate."), /*#__PURE__*/React.createElement("li", null, "Confirmed cases under-count true infections (testing limits); recovery data has known delays."), /*#__PURE__*/React.createElement("li", null, "N_eff is a model construct, not a directly observable quantity \u2014 sensitivity analysis shows the fit tolerates 37M \u2013 80M across windows.")))));
}
function FindingCard({
  title,
  body,
  highlight
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `glass p-5 ${highlight ? 'ring-1 ring-accent/40' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: `font-medium mb-1 ${highlight ? 'text-accent2' : 'text-ink'}`
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-dim"
  }, body));
}

/* ═══════════════════════════════════════════════════════════════════
   NAV + FOOTER
   ═══════════════════════════════════════════════════════════════════ */
function Nav({
  onJump
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "sticky top-0 z-30 px-6 md:px-12 py-3 backdrop-blur-xl bg-bg/70 border-b border-edge/60"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-6 h-6 rounded-full bg-gradient-to-br from-accent to-infc"
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold tracking-tight"
  }, "From People to Parameters")), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-1 text-[12px] overflow-x-auto"
  }, /*#__PURE__*/React.createElement(NavLink, {
    onClick: () => onJump('model')
  }, "Model"), /*#__PURE__*/React.createElement(NavLink, {
    onClick: () => onJump('data')
  }, "Data"), /*#__PURE__*/React.createElement(NavLink, {
    onClick: () => onJump('calibration')
  }, "Calibration"), /*#__PURE__*/React.createElement(NavLink, {
    onClick: () => onJump('failures')
  }, "Failures"), /*#__PURE__*/React.createElement(NavLink, {
    onClick: () => onJump('takeaways')
  }, "Findings"))));
}
function NavLink({
  children,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    className: "px-3 py-1.5 rounded-md text-dim hover:text-ink hover:bg-soft transition"
  }, children);
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "px-8 md:px-14 py-10 text-center text-[12px] text-faint border-t border-edge/40 mt-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono"
  }, "Numerical Optimization \xB7 IIM Indore \xB7 SIR Digital Twin of India's second COVID wave"), /*#__PURE__*/React.createElement("div", {
    className: "mt-2"
  }, "Data: JHU CSSE \xB7 OWID \xB7 World Bank \xB7 All trajectories precomputed from the from-scratch optimizer suite."));
}

/* ═══════════════════════════════════════════════════════════════════
   APP ROOT
   ═══════════════════════════════════════════════════════════════════ */
function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchAllData().then(setData).catch(e => {
      console.error(e);
      setError(e.message);
    });
  }, []);
  const jump = useCallback(id => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, []);
  if (error) return /*#__PURE__*/React.createElement("div", {
    className: "p-10 text-infc"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-lg mb-2"
  }, "Data failed to load"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm mono"
  }, error), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-dim mt-4"
  }, "This app must be served over HTTP (not opened directly via file://) because it fetches JSON.", /*#__PURE__*/React.createElement("br", null), "Run: ", /*#__PURE__*/React.createElement("span", {
    className: "mono text-accent"
  }, "python3 -m http.server"), " in this folder, then open ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "http://localhost:8000"), "."));
  if (!data) return /*#__PURE__*/React.createElement("div", {
    className: "p-10 text-dim"
  }, /*#__PURE__*/React.createElement("div", {
    className: "animate-pulse"
  }, "Loading optimization trajectories\u2026"));
  return /*#__PURE__*/React.createElement("div", {
    className: "relative z-10"
  }, /*#__PURE__*/React.createElement(Nav, {
    onJump: jump
  }), /*#__PURE__*/React.createElement(Hero, {
    summary: data.summary,
    onCta: jump
  }), /*#__PURE__*/React.createElement(SirExplainer, {
    wave: data.wave
  }), /*#__PURE__*/React.createElement(DataPipeline, {
    wave: data.wave
  }), /*#__PURE__*/React.createElement(CalibrationLab, {
    wave: data.wave,
    paths: data.paths,
    summary: data.summary
  }), /*#__PURE__*/React.createElement(AllMethodsConvergence, {
    paths: data.paths
  }), /*#__PURE__*/React.createElement(FailureExplorer, {
    failures: data.failures,
    windows: data.windows
  }), /*#__PURE__*/React.createElement(Findings, {
    summary: data.summary
  }), /*#__PURE__*/React.createElement(Footer, null));
}
createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
