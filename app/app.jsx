"use strict";
// React / ReactDOM / Recharts come from UMD globals
const React = window.React;
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const { createRoot } = window.ReactDOM;
const {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Area, AreaChart,
  ScatterChart, Scatter, ZAxis, Cell
} = window.Recharts;

/* ═══════════════════════════════════════════════════════════════════
   DATA LOADING
   ═══════════════════════════════════════════════════════════════════ */
const DATA_URLS = {
  wave: "./data/wave_series.json",
  paths: "./data/optimizer_paths.json",
  summary: "./data/summary_metrics.json",
  failures: "./data/failure_cases.json",
  windows: "./data/window_variants.json",
};

async function fetchAllData() {
  const keys = Object.keys(DATA_URLS);
  const results = await Promise.all(
    keys.map(k => fetch(DATA_URLS[k]).then(r => {
      if (!r.ok) throw new Error(`Failed to fetch ${k}: ${r.status}`);
      return r.json();
    }))
  );
  return Object.fromEntries(keys.map((k, i) => [k, results[i]]));
}

/* ═══════════════════════════════════════════════════════════════════
   COLOR + HELPERS
   ═══════════════════════════════════════════════════════════════════ */
const METHOD_COLORS = {
  GD: "#f97316", Newton: "#ef4444", BFGS: "#34d399",
  GN: "#a78bfa", Penalty: "#facc15", Barrier: "#ec4899",
};
const METHOD_FULL = {
  GD: "Gradient Descent", Newton: "Newton's Method",
  BFGS: "BFGS Quasi-Newton", GN: "Gauss-Newton",
  Penalty: "Quadratic Penalty", Barrier: "Log-Barrier",
};
const fmt = (x, d = 4) => (x == null ? "—" : Number(x).toFixed(d));
const fmtInt = (x) => (x == null ? "—" : Math.round(x).toLocaleString());
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const formatDateShort = (dStr) => {
  if (!dStr) return '';
  const [y, m, d] = dStr.split('-');
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10)-1]}`;
};
const formatDateFull = (dStr) => {
  if (!dStr) return '';
  const [y, m, d] = dStr.split('-');
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10)-1]} ${y}`;
};
const Tex = ({ math }) => <span dangerouslySetInnerHTML={{ __html: window.katex.renderToString(math, { throwOnError: false }) }} />;
const fmtSciTex = (num) => {
  if (num == null) return '';
  const [base, exp] = Number(num).toExponential(1).split('e');
  return `${base} \\times 10^{${parseInt(exp, 10)}}`;
};
const fmtMil = (x) => (x == null ? "—" : (x/1e6).toFixed(2) + " M");

/* ═══════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════ */
function Hero({ summary, onCta }) {
  return (
    <section className="relative pt-16 pb-10 px-8 md:px-14 fade-up">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-accent mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse"/>
          <span className="section-label">Numerical Optimization · IIM Indore</span>
        </div>

        <h1 className="font-sans font-semibold tracking-tight text-5xl md:text-7xl leading-[1.05] mb-4">
          From <span className="text-accent">People</span> to <span className="text-accent2">Parameters</span>
        </h1>
        <p className="text-dim text-xl md:text-2xl font-light mb-2">
          An interactive SIR Digital Twin of India's second COVID wave.
        </p>
        <p className="text-faint text-sm md:text-base max-w-3xl">
          Watch numerical optimization algorithms calibrate an epidemic model against real Johns Hopkins data —
          not as abstract iterations, but as a living population that learns the shape of a pandemic.
        </p>

        {/* Project-at-a-glance strip */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-10">
            <GlanceCard label="Window" value={`${formatDateShort(summary.window.start)} → ${formatDateShort(summary.window.end)}`} sub={`${summary.window.T} days`}/>
            <GlanceCard label="Data Source" value="JHU CSSE" sub="+ OWID + World Bank"/>
            <GlanceCard label="Best Optimizer" value="Gauss-Newton" sub={`Converged in ${summary.headline.iters} iters`}/>
            <GlanceCard label={<span>Fitted <Tex math="R_0"/></span>} value={fmt(summary.headline.R0, 3)} sub={<span className="whitespace-nowrap">(<Tex math={String.raw`\Delta`} />: 1.5 – 2.8)</span>} highlight/>
            <GlanceCard label="SciPy Agreement" value={<Tex math={fmtSciTex(summary.scipy.agreement_rel)} />} sub="relative error"/>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-10">
          <button className="btn btn-primary" onClick={()=>onCta('calibration')}>
            ⚙ Open the Calibration Lab
          </button>
          <button className="btn btn-ghost" onClick={()=>onCta('model')}>
            🔬 Explore the SIR model
          </button>
          <button className="btn btn-ghost" onClick={()=>onCta('failures')}>
            ⚠ See where methods fail
          </button>
          <button className="btn btn-ghost" onClick={()=>onCta('takeaways')}>
            📘 Jump to findings
          </button>
        </div>
      </div>
    </section>
  );
}

function GlanceCard({ label, value, sub, highlight }) {
  return (
    <div className={`glass px-4 py-3 smooth-appear ${highlight ? 'ring-1 ring-accent/40' : ''}`}>
      <div className="text-xs text-faint uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-semibold text-lg ${highlight ? 'text-accent2' : 'text-ink'} mono`}>{value}</div>
      <div className="text-[11px] text-dim mt-0.5">{sub}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SIR EXPLAINER — animated agents + equations
   ═══════════════════════════════════════════════════════════════════ */
function SirExplainer({ wave }) {
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
  useEffect(()=>{
    const N = 320;
    agentsRef.current = Array.from({length:N},()=>({
      x: Math.random(), y: Math.random(),
      vx: (Math.random()-0.5)*0.0008, vy: (Math.random()-0.5)*0.0008,
      state: 'S',
      // Each agent has a slot; we reassign which slot is I/R based on proportions per frame
    }));
  },[]);

  const gnFit = wave?.fitted?.GN;
  const totalDays = wave?.I_data?.length ?? 0;

  useEffect(()=>{
    if (!gnFit || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const W = canvasRef.current.width, H = canvasRef.current.height;

    function tick(ts){
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min(50, ts - lastTimeRef.current);
      lastTimeRef.current = ts;

      // Advance day index at ~8 days/sec when playing
      if (playing && gnFit){
        dayIdxRef.current = (dayIdxRef.current + dt*0.008) % totalDays;
        setDayIdx(Math.floor(dayIdxRef.current));
      }
      const di = Math.floor(dayIdxRef.current);
      const N_eff = gnFit.N_eff;
      const I_now = gnFit.I_pred[di] || 0;
      const R_now = gnFit.R_pred[di] || 0;
      const S_now = Math.max(0, N_eff - I_now - R_now);

      const total = S_now + I_now + R_now;
      const pI = total>0 ? I_now/total : 0;
      const pR = total>0 ? R_now/total : 0;

      // Reassign states by sorted order (stable-ish visual)
      const agents = agentsRef.current;
      const nA = agents.length;
      const nI = Math.round(pI * nA);
      const nR = Math.round(pR * nA);
      // For a smooth visual: assign the first nI agents as I, next nR as R, rest S
      // To avoid flicker, we sort agents by a stable index: just use array order.
      for (let i = 0; i < nA; i++){
        if (i < nI) agents[i].state = 'I';
        else if (i < nI + nR) agents[i].state = 'R';
        else agents[i].state = 'S';
      }

      // Move agents (slight random walk)
      for (const a of agents){
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (a.x < 0.02 || a.x > 0.98){ a.vx = -a.vx; a.x = Math.max(0.02, Math.min(0.98, a.x)); }
        if (a.y < 0.02 || a.y > 0.98){ a.vy = -a.vy; a.y = Math.max(0.02, Math.min(0.98, a.y)); }
        if (Math.random() < 0.002){ a.vx = (Math.random()-0.5)*0.0012; a.vy = (Math.random()-0.5)*0.0012; }
      }

      // Render
      ctx.clearRect(0,0,W,H);
      // Subtle grid
      ctx.strokeStyle = 'rgba(30,47,85,0.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++){
        ctx.beginPath(); ctx.moveTo(i*W/6, 0); ctx.lineTo(i*W/6, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i*H/6); ctx.lineTo(W, i*H/6); ctx.stroke();
      }

      const pulse = 1 + 0.15*Math.sin(ts * 0.006);
      for (const a of agents){
        const x = a.x * W, y = a.y * H;
        if (a.state === 'I'){
          // Glow aura
          const g = ctx.createRadialGradient(x,y,0,x,y,10*pulse);
          g.addColorStop(0,'rgba(239,68,68,0.9)'); g.addColorStop(1,'rgba(239,68,68,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(x,y,10*pulse,0,Math.PI*2); ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2); ctx.fill();
        } else if (a.state === 'R'){
          ctx.fillStyle = 'rgba(52,211,153,0.55)';
          ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(96,165,250,0.8)';
          ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[gnFit, playing, totalDays]);

  if (!gnFit) return null;

  // Current proportions for the readouts
  const di = Math.floor(dayIdx);
  const total = gnFit.N_eff;
  const I_now = gnFit.I_pred[di] || 0;
  const R_now = gnFit.R_pred[di] || 0;
  const S_now = Math.max(0, total - I_now - R_now);

  return (
    <section id="model" className="px-8 md:px-14 py-14 fade-up">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="section-label mb-2">01 · The Model</div>
          <h2 className="text-3xl md:text-4xl font-semibold mb-2">Susceptible, Infected, Removed.</h2>
          <p className="text-dim max-w-2xl">
            The SIR model (Kermack & McKendrick, 1927) sorts every person in a population into one of three states and
            describes how they flow between them. Two parameters govern the entire trajectory: the infection rate β and the recovery rate γ.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass overflow-hidden relative p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-faint uppercase tracking-wider">Stylized population</div>
                <div className="text-ink font-medium">Day {di+1} / {totalDays} · {formatDateFull(wave.dates[di])}</div>
              </div>
              <div className="flex gap-2">
                <button className={`btn ${playing?'btn-active':'btn-ghost'}`} onClick={()=>setPlaying(p=>!p)}>
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <button className="btn btn-ghost" onClick={()=>{dayIdxRef.current=0; setDayIdx(0);}}>
                  ↺ Reset
                </button>
              </div>
            </div>
            <canvas ref={canvasRef} width={640} height={360} className="rounded-lg bg-bg/40 w-full"/>

            {/* Proportion bar */}
            <div className="mt-3">
              <div className="flex h-2 rounded-full overflow-hidden bg-soft">
                <div className="bg-susc" style={{width: `${100*S_now/total}%`}} title={`S = ${fmtInt(S_now)}`}/>
                <div className="bg-infc" style={{width: `${100*I_now/total}%`}} title={`I = ${fmtInt(I_now)}`}/>
                <div className="bg-remv" style={{width: `${100*R_now/total}%`}} title={`R = ${fmtInt(R_now)}`}/>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-susc"/><span className="text-dim">Susceptible</span><span className="mono ml-auto text-ink">{fmtMil(S_now)}</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-infc"/><span className="text-dim">Infected</span><span className="mono ml-auto text-ink">{fmtMil(I_now)}</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-remv"/><span className="text-dim">Removed</span><span className="mono ml-auto text-ink">{fmtMil(R_now)}</span></div>
              </div>
            </div>
            <div className="text-xs text-faint mt-2 italic">The animation is a visual expression of the fitted SIR proportions. It is not a separate scientific simulation.</div>
          </div>

          {/* Equations panel */}
          <div className="glass p-6">
            <div className="section-label mb-3">The equations</div>
            <div className="space-y-3 mono text-lg">
              <EqLine lhs={<Tex math={String.raw`\frac{dS}{dt}`}/>} rhs={<Tex math={String.raw`-\frac{\beta S I}{N}`}/>} note="Susceptible individuals decrease as they get infected"/>
              <EqLine lhs={<Tex math={String.raw`\frac{dI}{dt}`}/>} rhs={<Tex math={String.raw`+\frac{\beta S I}{N} - \gamma I`}/>} note="Infected count rises with new infections and falls with recoveries"/>
              <EqLine lhs={<Tex math={String.raw`\frac{dR}{dt}`}/>} rhs={<Tex math={String.raw`+\gamma I`}/>} note="Removed (recovered + deceased) grows monotonically"/>
            </div>

            <div className="border-t border-edge my-5"/>

            <div className="grid grid-cols-3 gap-3">
              <Badge label={<span><Tex math={String.raw`\beta`}/> (infection rate)</span>} value={fmt(gnFit.beta,4)} color="#ef4444"/>
              <Badge label={<span><Tex math={String.raw`\gamma`}/> (recovery rate)</span>} value={fmt(gnFit.gamma,4)} color="#34d399"/>
              <Badge label={<Tex math={String.raw`R_0 = \beta/\gamma`} />} value={fmt(gnFit.R0,3)} color="#38bdf8" big/>
            </div>
            <div className="text-xs text-dim mt-4">
              The basic reproduction number <span className="text-ink mono"><Tex math={`R_0 = \\beta/\\gamma \\approx ${fmt(gnFit.R0,2)}`} /></span> means
              each infected person transmits to <span className="text-ink mono">~{fmt(gnFit.R0,1)}</span> others on average.
              This matches published estimates for the <Tex math={String.raw`\Delta`}/> variant (1.5 – 2.8).
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function EqLine({lhs,rhs,note}){
  return (
    <div>
      <div><span className="text-accent">{lhs}</span> <span className="text-dim">=</span> <span className="text-ink">{rhs}</span></div>
      <div className="text-xs text-faint ml-1 mt-0.5 font-sans">{note}</div>
    </div>
  );
}
function Badge({label,value,color,big}){
  return (
    <div className="glass-hard px-3 py-2.5" style={{borderColor: color+'30'}}>
      <div className="text-xs text-faint uppercase tracking-wider mb-1">{label}</div>
      <div className={`mono font-semibold ${big?'text-2xl':'text-lg'}`} style={{color}}>{value}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DATA PIPELINE (Screen 3) — compact, information-dense
   ═══════════════════════════════════════════════════════════════════ */
function DataPipeline({ wave }) {
  const chartData = useMemo(()=>{
    if (!wave) return [];
    return wave.dates.map((d, i) => ({
      date: d, I: wave.I_data[i], R: wave.R_data[i],
    }));
  }, [wave]);

  return (
    <section id="data" className="px-8 md:px-14 py-14 fade-up">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="section-label mb-2">02 · The Data</div>
          <h2 className="text-3xl md:text-4xl font-semibold mb-2">Raw counts → Model-ready compartments.</h2>
          <p className="text-dim max-w-2xl">
            JHU CSSE provides three cumulative series. We map them to SIR compartments and apply a 7-day rolling mean
            to suppress weekday reporting artifacts.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <PipelineStep n="1" title="Raw JHU series" body="Confirmed(t), Recovered(t), Deaths(t) — all cumulative, daily, per country"/>
            <PipelineStep n="2" title="Compartment mapping" body="I(t) = Confirmed − Recovered − Deaths   |   R(t) = Recovered + Deaths"/>
            <PipelineStep n="3" title="7-day smoothing" body="Rolling mean removes weekday reporting artifacts without affecting the wave's shape"/>
            <PipelineStep n="4" title="Residual normalization" body="Residuals scaled by max(I), max(R) so the removed curve doesn't dominate the fit"/>
          </div>

          <div className="lg:col-span-3 glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-faint uppercase tracking-wider">India second wave · 1 Mar – 15 Jun 2021</div>
                <div className="text-ink font-medium">Peak active: {fmtMil(wave?.peak_I)} on {formatDateFull(wave?.peak_I_date)}</div>
              </div>
              <div className="text-[11px] text-dim">T = {wave?.dates?.length} days</div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{top:5,right:5,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2f55" opacity={0.6}/>
                <XAxis dataKey="date" stroke="#4d5f82" tick={{fontSize:10,fill:'#8ea2c6'}} tickFormatter={(d)=>formatDateShort(d)}/>
                <YAxis yAxisId="L" stroke="#4d5f82" tick={{fontSize:10,fill:'#8ea2c6'}} tickFormatter={(v)=>(v/1e6).toFixed(1)+'M'}/>
                <YAxis yAxisId="R" orientation="right" stroke="#4d5f82" tick={{fontSize:10,fill:'#8ea2c6'}} tickFormatter={(v)=>(v/1e6).toFixed(0)+'M'}/>
                <Tooltip contentStyle={{background:'#0b1730',border:'1px solid #1e2f55',borderRadius:8,fontSize:12}}
                  formatter={(v)=>fmtMil(v)}/>
                <Line yAxisId="L" dataKey="I" name="I(t) active" stroke="#ef4444" strokeWidth={2} dot={false}/>
                <Line yAxisId="R" dataKey="R" name="R(t) removed" stroke="#34d399" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
function PipelineStep({n, title, body}){
  return (
    <div className="glass p-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center mono text-xs font-semibold border border-accent/30 shrink-0">{n}</div>
        <div>
          <div className="text-ink font-medium text-sm">{title}</div>
          <div className="text-dim text-xs mt-0.5 mono">{body}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CALIBRATION LAB (Screen 4) — the centerpiece
   ═══════════════════════════════════════════════════════════════════ */
function CalibrationLab({ wave, paths, summary }){
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
  useEffect(()=>{
    if (!playing || nFrames === 0) return;
    function tick(ts){
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      if (dt > 180){
        setIterIdx(i => {
          const nxt = i + 1;
          if (nxt >= nFrames){ setPlaying(false); return i; }
          return nxt;
        });
        lastTsRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[playing, nFrames]);

  useEffect(()=>{ setIterIdx(0); setPlaying(false); }, [method]);

  const currentFrame = frames[iterIdx] || frames[0];

  // Build current fit curve: use last frame with I_pred attached up to this point
  const fitAtFrame = useMemo(()=>{
    if (!frames?.length || !wave) return null;
    // Walk backward from iterIdx to find the most recent frame with I_pred populated
    for (let k = iterIdx; k >= 0; k--){
      if (frames[k]?.I_pred) return { I_pred: frames[k].I_pred, R_pred: frames[k].R_pred, iter: frames[k].iter };
    }
    return null;
  }, [iterIdx, frames, wave]);

  // Chart data: observed + fitted (at current iteration)
  const fitData = useMemo(()=>{
    if (!wave) return [];
    return wave.dates.map((d,i) => ({
      date: d, I_obs: wave.I_data[i], R_obs: wave.R_data[i],
      I_fit: fitAtFrame?.I_pred?.[i] ?? null,
      R_fit: fitAtFrame?.R_pred?.[i] ?? null,
    }));
  }, [wave, fitAtFrame]);

  // Convergence line data
  const convData = useMemo(()=>{
    if (!path) return [];
    return path.f_history.map((v, i) => ({ iter: i, f: Math.max(v, 1e-6), gn: path.grad_norm_history[i] }));
  }, [path]);

  // Visualize the param-space path projected to (beta, gamma)
  const pathProjection = useMemo(()=>{
    if (!path) return [];
    return path.x_history.map((x, i) => ({ beta: x[0], gamma: x[1], N: x[2], i }));
  }, [path]);

  return (
    <section id="calibration" className="px-8 md:px-14 py-14 fade-up">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="section-label mb-2">03 · The Calibration Lab</div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-2">Watch the model learn.</h2>
            <p className="text-dim max-w-3xl">
              Pick an optimizer. Press play. The fit curve bends toward the data, the parameter cards update,
              and the convergence chart draws — in the same order the algorithm actually did it.
            </p>
          </div>
          <div className="flex gap-2">
            <button className={`btn ${playing?'btn-active':'btn-primary'}`} onClick={()=>setPlaying(p=>!p)}>
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
            <button className="btn btn-ghost" onClick={()=>{setIterIdx(0); setPlaying(false);}}>↺ Reset</button>
            <button className="btn btn-ghost" onClick={()=>{setIterIdx(nFrames-1); setPlaying(false);}}>⏭ Jump to end</button>
          </div>
        </div>

        {/* Method selector row */}
        <div className="flex gap-2 flex-wrap mb-6">
          {methods.map(m => (
            <button key={m}
              className={`btn ${method===m ? 'btn-active' : 'btn-ghost'}`}
              onClick={()=>setMethod(m)}
              style={method===m ? {background:METHOD_COLORS[m], color:'#061220'} : {}}>
              <span className="w-2 h-2 rounded-full" style={{background:METHOD_COLORS[m]}}/>
              {METHOD_FULL[m]}
              <span className="mono text-xs opacity-70 ml-1">({paths[m].n_iters} iter)</span>
            </button>
          ))}
        </div>

        {/* Grid: 8 units wide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: the fit chart (main visual) */}
          <div className="lg:col-span-8 glass p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-faint uppercase tracking-wider">Fit vs observed</div>
                <div className="text-ink font-medium">
                  {METHOD_FULL[method]}
                  <span className="text-dim text-sm ml-2">iter {currentFrame?.iter ?? 0}</span>
                </div>
              </div>
              <div className="text-xs text-dim">
                <span className="mr-4"><span className="inline-block w-3 h-0.5 bg-accent align-middle mr-1"/>Observed</span>
                <span><span className="inline-block w-3 h-0.5 align-middle mr-1" style={{background:METHOD_COLORS[method]}}/>Fitted</span>
              </div>
            </div>

            {/* Two stacked charts: I(t) then R(t) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-dim mb-1">Active infected I(t)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={fitData} margin={{top:5,right:5,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2f55"/>
                    <XAxis dataKey="date" stroke="#4d5f82" tick={{fontSize:9,fill:'#8ea2c6'}} tickFormatter={(d)=>formatDateShort(d)} interval={15}/>
                    <YAxis stroke="#4d5f82" tick={{fontSize:9,fill:'#8ea2c6'}} tickFormatter={(v)=>(v/1e6).toFixed(1)+'M'}/>
                    <Tooltip contentStyle={{background:'#0b1730',border:'1px solid #1e2f55',borderRadius:8,fontSize:11}} formatter={(v)=>v==null?'—':fmtMil(v)}/>
                    <Line dataKey="I_obs" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} name="I observed"/>
                    <Line dataKey="I_fit" stroke={METHOD_COLORS[method]} strokeWidth={2.5} dot={false} isAnimationActive={false} name="I fit"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div className="text-[11px] text-dim mb-1">Removed R(t)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={fitData} margin={{top:5,right:5,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2f55"/>
                    <XAxis dataKey="date" stroke="#4d5f82" tick={{fontSize:9,fill:'#8ea2c6'}} tickFormatter={(d)=>formatDateShort(d)} interval={15}/>
                    <YAxis stroke="#4d5f82" tick={{fontSize:9,fill:'#8ea2c6'}} tickFormatter={(v)=>(v/1e6).toFixed(0)+'M'}/>
                    <Tooltip contentStyle={{background:'#0b1730',border:'1px solid #1e2f55',borderRadius:8,fontSize:11}} formatter={(v)=>v==null?'—':fmtMil(v)}/>
                    <Line dataKey="R_obs" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} name="R observed"/>
                    <Line dataKey="R_fit" stroke={METHOD_COLORS[method]} strokeWidth={2.5} dot={false} isAnimationActive={false} name="R fit"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Iter scrubber */}
            <div className="mt-3">
              <input
                type="range" min={0} max={Math.max(0,nFrames-1)} value={iterIdx}
                onChange={(e)=>{setIterIdx(Number(e.target.value)); setPlaying(false);}}
                className="w-full accent-accent"/>
              <div className="flex justify-between text-xs text-faint mt-1">
                <span>iter 0</span>
                <span className="mono">Frame {iterIdx+1} / {nFrames}</span>
                <span>iter {path.n_iters}</span>
              </div>
            </div>
          </div>

          {/* RIGHT TOP: parameter cards */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass p-5">
              <div className="text-xs text-faint uppercase tracking-wider mb-3">Live parameter estimates</div>
              <div className="grid grid-cols-2 gap-3">
                <Badge label={<span><Tex math={"\\beta"}/> (infection)</span>} value={fmt(currentFrame?.beta,4)} color="#ef4444"/>
                <Badge label={<span><Tex math={"\\gamma"}/> (recovery)</span>} value={fmt(currentFrame?.gamma,4)} color="#34d399"/>
                <Badge label={<Tex math="N_{\\text{eff}}"/>} value={currentFrame?.N_eff ? fmtMil(currentFrame.N_eff) : '—'} color="#60a5fa"/>
                <Badge label={<Tex math="R_0 = \\beta/\\gamma" />} value={fmt(currentFrame?.R0,3)} color="#38bdf8" big/>
              </div>
              <div className="text-xs text-dim mt-3 mono">
                f(x) = <span className="text-ink">{fmt(currentFrame?.f,4)}</span>
              </div>
            </div>

            {/* Convergence */}
            <div className="glass p-5">
              <div className="text-xs text-faint uppercase tracking-wider mb-2">Convergence</div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={convData.slice(0, Math.max(2, Math.round((iterIdx/(nFrames-1 || 1)) * convData.length)))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2f55"/>
                  <XAxis dataKey="iter" stroke="#4d5f82" tick={{fontSize:9,fill:'#8ea2c6'}}/>
                  <YAxis scale="log" domain={['auto','auto']} stroke="#4d5f82" tick={{fontSize:9,fill:'#8ea2c6'}}/>
                  <Tooltip contentStyle={{background:'#0b1730',border:'1px solid #1e2f55',borderRadius:8,fontSize:11}}/>
                  <Line dataKey="f" stroke={METHOD_COLORS[method]} strokeWidth={2} dot={false} isAnimationActive={false} name="f(x)"/>
                </LineChart>
              </ResponsiveContainer>
              <div className="text-[11px] text-dim mt-1 mono">Objective value vs iteration (log scale)</div>
            </div>
          </div>

          {/* FULL WIDTH: parameter-space path */}
          <div className="lg:col-span-12 glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-faint uppercase tracking-wider">Parameter-space trajectory</div>
                <div className="text-ink font-medium">β – γ plane (all methods overlaid)</div>
              </div>
              <div className="text-xs text-dim">
                ★ = current position · ● = start · <span className="text-accent">published R₀ range dashed</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{top:5,right:5,bottom:5,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2f55"/>
                <XAxis dataKey="beta" type="number" domain={[0.05, 0.5]} allowDataOverflow={true} stroke="#4d5f82" tick={{fontSize:10,fill:'#8ea2c6'}} label={{value:'β',position:'insideBottom',offset:-5,fill:'#8ea2c6'}}/>
                <YAxis dataKey="gamma" type="number" domain={[0.02, 0.3]} allowDataOverflow={true} stroke="#4d5f82" tick={{fontSize:10,fill:'#8ea2c6'}} label={{value:'γ',angle:-90,position:'insideLeft',fill:'#8ea2c6'}}/>
                <ZAxis range={[20,20]}/>
                <Tooltip content={({active,payload})=>{
                  if (!active||!payload?.length) return null;
                  const d=payload[0].payload;
                  return <div style={{background:'#0b1730',border:'1px solid #1e2f55',padding:8,borderRadius:6,fontSize:11}}>
                    <div className="mono">β = {fmt(d.beta,4)}<br/>γ = {fmt(d.gamma,4)}<br/>iter {d.i}</div>
                  </div>;
                }}/>
                {/* Published-R0 band lines: R0 = beta/gamma, so beta = R0*gamma. At gamma=0.3, beta_hi=0.3*2.8=0.84 clipped; at gamma=0.02, beta_lo=0.02*1.5=0.03 */}
                <ReferenceLine segment={[{x:0.03, y:0.02}, {x:0.5, y:0.5/1.5}]} stroke="#38bdf8" strokeDasharray="4 4" strokeOpacity={0.4}/>
                <ReferenceLine segment={[{x:0.056, y:0.02}, {x:0.5, y:0.5/2.8}]} stroke="#38bdf8" strokeDasharray="4 4" strokeOpacity={0.4}/>
                {/* Draw paths for all methods, clipped to visible box */}
                {methods.map(m=>{
                  const data = paths[m].x_history
                    .map((x,i)=>({beta:x[0], gamma:x[1], i, m}))
                    .filter(d => d.beta >= 0.03 && d.beta <= 0.55 && d.gamma >= 0.01 && d.gamma <= 0.32);
                  return <Scatter key={m} data={data} fill={METHOD_COLORS[m]} line={{stroke:METHOD_COLORS[m], strokeWidth:1.5, strokeOpacity: m===method ? 0.9 : 0.2}} shape={(props)=>{
                    const {cx,cy,payload} = props;
                    if (payload.m !== method) return null;
                    return <circle cx={cx} cy={cy} r={1.5} fill={METHOD_COLORS[m]} opacity={0.6}/>;
                  }}/>;
                })}
                {/* Current position star */}
                {currentFrame && <Scatter data={[{beta:currentFrame.beta, gamma:currentFrame.gamma, i:currentFrame.iter, m:method}]} fill={METHOD_COLORS[method]} shape="star"/>}
              </ScatterChart>
            </ResponsiveContainer>
            <div className="text-[11px] text-dim mt-2">
              Each optimizer leaves a trail in parameter space. First-order methods zigzag; second-order methods take long confident strides; Gauss-Newton cuts almost straight to the optimum.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FAILURE + ROBUSTNESS
   ═══════════════════════════════════════════════════════════════════ */
function FailureExplorer({ failures, windows }){
  const cases = Object.keys(failures || {});
  const [caseKey, setCaseKey] = useState(cases[0]);
  const [windowIdx, setWindowIdx] = useState(0);

  const activeCase = failures?.[caseKey];
  const activeWin = windows?.[windowIdx];

  const failData = useMemo(()=>{
    if (!activeCase) return [];
    return activeCase.frames.map(f=>({
      iter: f.iter,
      f: f.f!=null ? Math.min(Math.max(f.f, 1e-3), 1e16) : null,
      beta: f.beta, gamma: f.gamma, N_eff: f.N_eff,
    }));
  }, [activeCase]);

  const winData = useMemo(()=>{
    if (!activeWin) return [];
    return activeWin.dates.map((d,i)=>({
      date: d, I_obs: activeWin.I_data[i], I_fit: activeWin.I_pred[i],
      R_obs: activeWin.R_data[i], R_fit: activeWin.R_pred[i],
    }));
  }, [activeWin]);

  return (
    <section id="failures" className="px-8 md:px-14 py-14 fade-up">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="section-label mb-2">04 · Where things break</div>
          <h2 className="text-3xl md:text-4xl font-semibold mb-2">Failure modes & robustness.</h2>
          <p className="text-dim max-w-3xl">
            A project that shows only successful runs is suspicious. Here are the adversarial cases where methods blow up,
            drift, or disagree — and why constraints and line-search matter in practice.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Failure cases */}
          <div className="glass p-5">
            <div className="text-xs text-faint uppercase tracking-wider mb-3">Failure case explorer</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {cases.map(k=>(
                <button key={k} className={`btn ${k===caseKey?'btn-active':'btn-ghost'}`} onClick={()=>setCaseKey(k)}>
                  {failures[k].label}
                </button>
              ))}
            </div>
            <div className="text-xs text-dim mb-2">{activeCase?.description}</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={failData} margin={{top:5,right:5,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2f55"/>
                <XAxis dataKey="iter" stroke="#4d5f82" tick={{fontSize:10,fill:'#8ea2c6'}}/>
                <YAxis scale="log" domain={['auto','auto']} stroke="#4d5f82" tick={{fontSize:10,fill:'#8ea2c6'}} tickFormatter={(v)=>v.toExponential(0)}/>
                <Tooltip contentStyle={{background:'#0b1730',border:'1px solid #1e2f55',borderRadius:8,fontSize:11}}/>
                <Line dataKey="f" stroke="#ef4444" strokeWidth={2} dot={{r:2.5,fill:'#ef4444'}} isAnimationActive={false} name="f(x)"/>
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
              {activeCase?.frames?.length && (()=>{
                const last = activeCase.frames[activeCase.frames.length-1];
                return <>
                  <div className="mono"><span className="text-faint">β →</span> <span className={Math.abs(last.beta)>1?'text-infc':'text-ink'}>{fmt(last.beta,3)}</span></div>
                  <div className="mono"><span className="text-faint">γ →</span> <span className={Math.abs(last.gamma)>1?'text-infc':'text-ink'}>{fmt(last.gamma,3)}</span></div>
                  <div className="mono"><span className="text-faint">N →</span> <span className={Math.abs(last.N_eff)>2e8||last.N_eff<0?'text-infc':'text-ink'}>{last.N_eff?fmtMil(last.N_eff):'—'}</span></div>
                </>;
              })()}
            </div>
          </div>

          {/* Window robustness */}
          <div className="glass p-5">
            <div className="text-xs text-faint uppercase tracking-wider mb-3">Time-window robustness</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {windows?.map((w,i)=>(
                <button key={i} className={`btn ${i===windowIdx?'btn-active':'btn-ghost'}`} onClick={()=>setWindowIdx(i)}>
                  {w.label.split(':')[0]}
                </button>
              ))}
            </div>
            {activeWin && (
              <>
                <div className="text-xs text-dim mb-2">
                  <span className="mono">{activeWin.start} → {activeWin.end}</span> · T = {activeWin.T} days
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={winData} margin={{top:5,right:5,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2f55"/>
                    <XAxis dataKey="date" stroke="#4d5f82" tick={{fontSize:9,fill:'#8ea2c6'}} tickFormatter={(d)=>formatDateShort(d)} interval={15}/>
                    <YAxis stroke="#4d5f82" tick={{fontSize:9,fill:'#8ea2c6'}} tickFormatter={(v)=>(v/1e6).toFixed(1)+'M'}/>
                    <Tooltip contentStyle={{background:'#0b1730',border:'1px solid #1e2f55',borderRadius:8,fontSize:11}} formatter={(v)=>fmtMil(v)}/>
                    <Line dataKey="I_obs" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} name="Observed I"/>
                    <Line dataKey="I_fit" stroke="#a78bfa" strokeWidth={2.5} dot={false} isAnimationActive={false} name="Fitted I"/>
                  </LineChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-4 gap-2 mt-3 text-[11px] mono">
                  <div><span className="text-faint">β</span> <span className="text-ink">{fmt(activeWin.beta,4)}</span></div>
                  <div><span className="text-faint">γ</span> <span className="text-ink">{fmt(activeWin.gamma,4)}</span></div>
                  <div><span className="text-faint">N_eff</span> <span className="text-ink">{fmtMil(activeWin.N_eff)}</span></div>
                  <div><span className="text-faint"><Tex math="R_0" /></span> <span className="text-accent2">{fmt(activeWin.R0,3)}</span></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ALL-METHODS COMPARISON CHART
   ═══════════════════════════════════════════════════════════════════ */
function AllMethodsConvergence({ paths }){
  const methods = Object.keys(paths || {});
  // Normalize to same iteration axis length
  const data = useMemo(()=>{
    const maxLen = Math.max(...methods.map(m=>paths[m].f_history.length));
    const rows = [];
    for (let i = 0; i < maxLen; i++){
      const row = {iter: i};
      methods.forEach(m=>{
        const v = paths[m].f_history[i];
        row[m] = v != null && isFinite(v) ? Math.max(v, 1e-6) : null;
      });
      rows.push(row);
    }
    return rows;
  }, [paths, methods]);

  return (
    <section className="px-8 md:px-14 py-6 fade-up">
      <div className="max-w-7xl mx-auto glass p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-faint uppercase tracking-wider">All methods overlaid</div>
            <div className="text-ink font-medium">Objective f(x) vs iteration — same start, same data</div>
          </div>
          <div className="text-xs text-dim">log scale · fewer iterations = faster convergence</div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{top:5,right:20,left:0,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2f55"/>
            <XAxis dataKey="iter" stroke="#4d5f82" tick={{fontSize:10,fill:'#8ea2c6'}}/>
            <YAxis scale="log" domain={['auto','auto']} stroke="#4d5f82" tick={{fontSize:10,fill:'#8ea2c6'}}/>
            <Tooltip contentStyle={{background:'#0b1730',border:'1px solid #1e2f55',borderRadius:8,fontSize:11}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            {methods.map(m=><Line key={m} dataKey={m} stroke={METHOD_COLORS[m]} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls/>)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FINDINGS / TAKEAWAYS
   ═══════════════════════════════════════════════════════════════════ */
function Findings({ summary }){
  if (!summary) return null;
  return (
    <section id="takeaways" className="px-8 md:px-14 py-14 fade-up">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="section-label mb-2">05 · What we learned</div>
          <h2 className="text-3xl md:text-4xl font-semibold mb-2">Findings & honest limitations.</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <FindingCard title="Gauss-Newton wins for LS structure"
            body={`Converged to R₀ = ${fmt(summary.headline.R0,3)} in ${summary.headline.iters} iterations. Newton matched it but needed full Hessians; BFGS got close using only gradients.`}/>
          <FindingCard title="R₀ lands in the published range"
            body={`Our estimate of ${fmt(summary.headline.R0,3)} falls within the Delta-variant range of 1.5–2.8 reported in the literature. Independent validation of the fit.`} highlight/>
          <FindingCard title="Matches SciPy to 6 decimals"
            body={`Our from-scratch Gauss-Newton agrees with scipy.optimize.least_squares (Trust Region Reflective) to a relative error of ${summary.scipy.agreement_rel.toExponential(1)}.`}/>
          <FindingCard title="Step size isn't optional"
            body="Fixed-α Gradient Descent with α=0.5 diverges in a single step (f jumps to 10¹⁴). Armijo backtracking converges, but still lands in a different local minimum."/>
          <FindingCard title="Constraints prevent absurdity"
            body="Without bounds on N_eff, BFGS drifts to 437 million — above India's total urban population. Penalty/Barrier methods keep the optimizer inside the physically meaningful region."/>
          <FindingCard title="The SIR model underestimates the peak by ~15%"
            body="Constant β, γ cannot represent intervention effects (lockdowns), age structure, or changing test capacity. This is a known, documented limitation of the base SIR model."/>
        </div>

        <div className="glass-hard p-6 mt-6">
          <div className="section-label mb-2">Limitations (we own these)</div>
          <ul className="text-sm text-dim space-y-1.5 list-disc pl-5">
            <li>Homogeneous mixing assumption; real contact networks have age and geography structure.</li>
            <li>β and γ are held constant over 107 days; interventions and healthcare changes mean they aren't.</li>
            <li>Vaccination is implicitly lumped into Removed; a full SVIR model would be more accurate.</li>
            <li>Confirmed cases under-count true infections (testing limits); recovery data has known delays.</li>
            <li>N_eff is a model construct, not a directly observable quantity — sensitivity analysis shows the fit tolerates 37M – 80M across windows.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
function FindingCard({title,body,highlight}){
  return (
    <div className={`glass p-5 ${highlight?'ring-1 ring-accent/40':''}`}>
      <div className={`font-medium mb-1 ${highlight?'text-accent2':'text-ink'}`}>{title}</div>
      <div className="text-sm text-dim">{body}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NAV + FOOTER
   ═══════════════════════════════════════════════════════════════════ */
function Nav({ onJump }){
  return (
    <nav className="sticky top-0 z-30 px-6 md:px-12 py-3 backdrop-blur-xl bg-bg/70 border-b border-edge/60">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-infc"/>
          <span className="font-semibold tracking-tight">From People to Parameters</span>
        </div>
        <div className="ml-auto flex gap-1 text-[12px] overflow-x-auto">
          <NavLink onClick={()=>onJump('model')}>Model</NavLink>
          <NavLink onClick={()=>onJump('data')}>Data</NavLink>
          <NavLink onClick={()=>onJump('calibration')}>Calibration</NavLink>
          <NavLink onClick={()=>onJump('failures')}>Failures</NavLink>
          <NavLink onClick={()=>onJump('takeaways')}>Findings</NavLink>
        </div>
      </div>
    </nav>
  );
}
function NavLink({children, onClick}){
  return <button onClick={onClick} className="px-3 py-1.5 rounded-md text-dim hover:text-ink hover:bg-soft transition">{children}</button>;
}

function Footer(){
  return (
    <footer className="px-8 md:px-14 py-10 text-center text-[12px] text-faint border-t border-edge/40 mt-6">
      <div className="mono">Numerical Optimization · IIM Indore · SIR Digital Twin of India's second COVID wave</div>
      <div className="mt-2">Data: JHU CSSE · OWID · World Bank · All trajectories precomputed from the from-scratch optimizer suite.</div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APP ROOT
   ═══════════════════════════════════════════════════════════════════ */
function App(){
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(()=>{
    fetchAllData().then(setData).catch(e=>{
      console.error(e);
      setError(e.message);
    });
  },[]);

  const jump = useCallback((id)=>{
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
  },[]);

  if (error) return <div className="p-10 text-infc">
    <div className="font-semibold text-lg mb-2">Data failed to load</div>
    <div className="text-sm mono">{error}</div>
    <div className="text-sm text-dim mt-4">
      This app must be served over HTTP (not opened directly via file://) because it fetches JSON.<br/>
      Run: <span className="mono text-accent">python3 -m http.server</span> in this folder, then open <span className="mono">http://localhost:8000</span>.
    </div>
  </div>;

  if (!data) return <div className="p-10 text-dim">
    <div className="animate-pulse">Loading optimization trajectories…</div>
  </div>;

  return (
    <div className="relative z-10">
      <Nav onJump={jump}/>
      <Hero summary={data.summary} onCta={jump}/>
      <SirExplainer wave={data.wave}/>
      <DataPipeline wave={data.wave}/>
      <CalibrationLab wave={data.wave} paths={data.paths} summary={data.summary}/>
      <AllMethodsConvergence paths={data.paths}/>
      <FailureExplorer failures={data.failures} windows={data.windows}/>
      <Findings summary={data.summary}/>
      <Footer/>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
