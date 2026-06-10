import { useState, useEffect, useRef} from "react";

const API_BASE = import.meta.env.VITE_API_URL;

const COLORS = {
  black: "#000000",
  navy: "#14213d",
  gold: "#fca311",
  light: "#e5e5e5",
  white: "#ffffff",
};

const RESIDENCE_TYPES = ["Owned", "Rented", "Mortgage"];
const LOAN_PURPOSES = ["Education", "Home", "Personal", "Auto"];
const LOAN_TYPES = ["Secured", "Unsecured"];

const ANALYSIS_STAGES = [
  "Analyzing Applicant Profile",
  "Evaluating Financial Indicators",
  "Assessing Credit History",
  "Calculating Risk Metrics",
  "Generating Credit Score",
  "Finalizing Assessment",
];

const FEATURES = [
  {
    icon: "📊",
    title: "Default Probability Engine",
    desc: "XGBoost-powered model with 98.34% AUC accuracy predicting credit default probability across multi-dimensional risk vectors.",
    stat: "98.34% AUC",
  },
  {
    icon: "🎯",
    title: "Credit Score Generation",
    desc: "Proprietary scoring algorithm mapping logit-space probabilities to a 300–900 financial-grade credit score with non-linear calibration.",
    stat: "300–900 Scale",
  },
  {
    icon: "⚡",
    title: "Risk Classification",
    desc: "Four-tier rating system (Excellent / Good / Average / Poor) aligned with institutional lending standards and Basel III frameworks.",
    stat: "4-Tier Rating",
  },
  {
    icon: "🔬",
    title: "ML-Powered Analysis",
    desc: "Gradient boosting with 96.68% Gini coefficient trained on real-world lending portfolios with 14,996 validated samples.",
    stat: "0.9668 Gini",
  },
  {
    icon: "📈",
    title: "Portfolio Risk Assessment",
    desc: "Aggregate risk scoring across applicant cohorts with delinquency ratio normalization and DPD-weighted default signals.",
    stat: "Multi-Factor",
  },
];

const WORKFLOW_STEPS = [
  { label: "Applicant Data", sub: "Demographics & Financials" },
  { label: "Risk Engine", sub: "Feature Engineering" },
  { label: "ML Analysis", sub: "XGBoost Inference" },
  { label: "Probability", sub: "Default Assessment" },
  { label: "Credit Score", sub: "300–900 Mapping" },
  { label: "Final Rating", sub: "Excellent → Poor" },
];

// ─── Utility ──────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function useCounter(target, duration = 1800, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return val;
}

function getRatingColor(rating) {
  if (!rating) return COLORS.light;
  const r = rating.toLowerCase();
  if (r === "excellent") return "#22c55e";
  if (r === "good") return "#84cc16";
  if (r === "average") return COLORS.gold;
  return "#ef4444";
}

function getRiskColor(prob) {
  if (prob < 0.2) return "#22c55e";
  if (prob < 0.4) return "#84cc16";
  if (prob < 0.6) return COLORS.gold;
  return "#ef4444";
}

// ─── Global Styles (injected once) ────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    background: #000000;
    color: #e5e5e5;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #000; }
  ::-webkit-scrollbar-thumb { background: #fca311; border-radius: 2px; }

  .mono { font-family: 'JetBrains Mono', monospace; }

  /* Fade-in animations */
  .fade-up {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
  }
  .fade-up.visible { opacity: 1; transform: translateY(0); }
  .fade-up.delay-1 { transition-delay: 0.1s; }
  .fade-up.delay-2 { transition-delay: 0.2s; }
  .fade-up.delay-3 { transition-delay: 0.3s; }
  .fade-up.delay-4 { transition-delay: 0.4s; }
  .fade-up.delay-5 { transition-delay: 0.5s; }

  .fade-in {
    opacity: 0;
    transition: opacity 0.6s ease;
  }
  .fade-in.visible { opacity: 1; }

  /* Gold glow */
  .gold-glow {
    box-shadow: 0 0 20px rgba(252,163,17,0.15), 0 0 40px rgba(252,163,17,0.05);
  }

  /* Input styles */
  .crp-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }
  .crp-input:focus {
    border-color: #fca311;
    background: rgba(252,163,17,0.04);
    box-shadow: 0 0 0 3px rgba(252,163,17,0.12);
  }
  .crp-input::placeholder { color: rgba(255,255,255,0.25); }
  .crp-input.error { border-color: #ef4444; }
  .crp-input option { background: #14213d; color: #fff; }

  /* Button */
  .btn-primary {
    background: #fca311;
    color: #000;
    border: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
    letter-spacing: 0.01em;
  }
  .btn-primary:hover {
    background: #ffb733;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(252,163,17,0.3);
  }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

  .btn-secondary {
    background: transparent;
    color: #e5e5e5;
    border: 1px solid rgba(255,255,255,0.15);
    padding: 14px 28px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 15px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }
  .btn-secondary:hover { border-color: rgba(255,255,255,0.4); color: #fff; }

  /* Nav */
  .crp-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: 64px;
    display: flex;
    align-items: center;
    padding: 0 40px;
    transition: background 0.3s, border-color 0.3s;
    border-bottom: 1px solid transparent;
  }
  .crp-nav.scrolled {
    background: rgba(0,0,0,0.92);
    border-bottom-color: rgba(255,255,255,0.06);
    backdrop-filter: blur(16px);
  }

  /* Divider */
  .gold-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, #fca311 30%, #fca311 70%, transparent);
    opacity: 0.3;
  }

  /* Chart ring */
  .ring-bg { stroke: rgba(255,255,255,0.06); }
  .ring-fill { transition: stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1); }

  /* Ticker animation */
  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .ticker-inner { animation: ticker 28s linear infinite; display: flex; gap: 64px; }
  .ticker-inner:hover { animation-play-state: paused; }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  @keyframes scan {
    0% { top: 0; }
    100% { top: 100%; }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ onAnalyze }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav className={`crp-nav${scrolled ? " scrolled" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        <div style={{
          width: 32, height: 32, background: COLORS.gold, borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 16, color: "#000", fontFamily: "JetBrains Mono, monospace"
        }}>R</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#fff", letterSpacing: "-0.01em" }}>
          RiskLens
        </span>
        <span style={{
          marginLeft: 8, fontSize: 10, color: COLORS.gold, background: "rgba(252,163,17,0.12)",
          padding: "2px 8px", borderRadius: 4, fontFamily: "JetBrains Mono, monospace",
          border: `1px solid rgba(252,163,17,0.2)`, letterSpacing: "0.08em"
        }}>CREDIT ANALYTICS</span>
      </div>
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <button className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}
          onClick={() => document.getElementById("predict")?.scrollIntoView({ behavior: "smooth" })}>
          Run Analysis
        </button>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroMetric({ label, value, sub, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`fade-up${inView ? " visible" : ""}`}
      style={{ transitionDelay: `${delay}s`, textAlign: "center" }}>
      <div style={{
        fontSize: 36, fontWeight: 900, color: COLORS.gold,
        fontFamily: "JetBrains Mono, monospace", letterSpacing: "-0.02em"
      }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function FloatingCard({ style, children }) {
  return (
    <div style={{
      background: "rgba(20,33,61,0.7)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "16px 20px",
      backdropFilter: "blur(12px)",
      animation: "float 4s ease-in-out infinite",
      ...style
    }}>
      {children}
    </div>
  );
}

function Hero() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  return (
    <section style={{
      minHeight: "100vh", background: "#000",
      display: "flex", flexDirection: "column", justifyContent: "center",
      alignItems: "center", position: "relative", overflow: "hidden",
      paddingTop: 80
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)`,
        backgroundSize: "48px 48px"
      }} />

      {/* Radial glow */}
      <div style={{
        position: "absolute", top: "40%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(252,163,17,0.07) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Floating data cards */}
      <FloatingCard style={{
        position: "absolute", top: "22%", left: "5%",
        opacity: loaded ? 1 : 0, transition: "opacity 1s 0.8s",
        animationDelay: "0s", minWidth: 160
      }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>AUC Score</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.gold, fontFamily: "JetBrains Mono, monospace" }}>0.9834</div>
        <div style={{ fontSize: 10, color: "#22c55e", marginTop: 4 }}>↑ Model Performance</div>
      </FloatingCard>

      <FloatingCard style={{
        position: "absolute", top: "30%", right: "5%",
        opacity: loaded ? 1 : 0, transition: "opacity 1s 1s",
        animationDelay: "1.5s", minWidth: 180
      }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>Gini Coefficient</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#e5e5e5", fontFamily: "JetBrains Mono, monospace" }}>0.9668</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Industry benchmark: 0.65</div>
      </FloatingCard>

      <FloatingCard style={{
        position: "absolute", bottom: "25%", left: "6%",
        opacity: loaded ? 1 : 0, transition: "opacity 1s 1.2s",
        animationDelay: "2s", minWidth: 160
      }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>F1 Score</div>
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>
          <span style={{ color: COLORS.gold }}>0.96</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}> weighted</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {["Precision 99%", "Recall 93%"].map(t => (
            <span key={t} style={{
              fontSize: 10, background: "rgba(255,255,255,0.05)",
              padding: "2px 6px", borderRadius: 3, color: "rgba(255,255,255,0.5)"
            }}>{t}</span>
          ))}
        </div>
      </FloatingCard>

      {/* Main content */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 2, maxWidth: 820, padding: "0 24px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(252,163,17,0.08)", border: "1px solid rgba(252,163,17,0.2)",
          borderRadius: 100, padding: "6px 16px", marginBottom: 32,
          opacity: loaded ? 1 : 0, transition: "opacity 0.6s 0.2s"
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.gold, display: "inline-block", animation: "pulse-dot 2s infinite" }} />
          <span style={{ fontSize: 12, color: COLORS.gold, letterSpacing: "0.08em", fontFamily: "JetBrains Mono, monospace" }}>
            CREDIT RISK INTELLIGENCE
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(40px, 6vw, 76px)", fontWeight: 900, lineHeight: 1.05,
          letterSpacing: "-0.03em", color: "#fff", marginBottom: 8,
          opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(24px)",
          transition: "opacity 0.8s 0.3s, transform 0.8s 0.3s"
        }}>
          Institutional-Grade
        </h1>
        <h1 style={{
          fontSize: "clamp(40px, 6vw, 76px)", fontWeight: 900, lineHeight: 1.05,
          letterSpacing: "-0.03em", color: COLORS.gold, marginBottom: 24,
          opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(24px)",
          transition: "opacity 0.8s 0.45s, transform 0.8s 0.45s"
        }}>
          Credit Default Risk
        </h1>

        <p style={{
          fontSize: "clamp(15px, 1.8vw, 19px)", color: "rgba(255,255,255,0.5)",
          lineHeight: 1.7, maxWidth: 620, margin: "0 auto 40px",
          opacity: loaded ? 1 : 0, transition: "opacity 0.8s 0.6s"
        }}>
          ML-powered probability engine with 98.34% AUC accuracy. 
          Assess applicant default risk, generate credit scores, and classify 
          portfolio exposure — in seconds.
        </p>

        <div style={{
          display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
          opacity: loaded ? 1 : 0, transition: "opacity 0.8s 0.75s"
        }}>
          <button className="btn-primary" style={{ padding: "16px 36px", fontSize: 15 }}
            onClick={() => document.getElementById("predict")?.scrollIntoView({ behavior: "smooth" })}>
            Assess Credit Risk →
          </button>
          <button className="btn-secondary" style={{ padding: "16px 36px", fontSize: 15 }}
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
            View Methodology
          </button>
        </div>

        {/* Metrics row */}
        <div style={{
          display: "flex", gap: 48, justifyContent: "center", marginTop: 64,
          borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40,
          flexWrap: "wrap"
        }}>
          <HeroMetric label="AUC Score" value="98.34%" delay={0.9} />
          <HeroMetric label="Accuracy" value="93.2%" sub="Test set" delay={1.0} />
          <HeroMetric label="Gini Coeff." value="0.9668" delay={1.1} />
          <HeroMetric label="Samples" value="14,996" sub="Training" delay={1.2} />
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
        opacity: loaded ? 0.4 : 0, transition: "opacity 1s 1.5s",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8
      }}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#fff", textTransform: "uppercase" }}>Scroll</div>
        <div style={{ width: 1, height: 32, background: "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)" }} />
      </div>
    </section>
  );
}

// ─── Ticker ────────────────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    "AUC: 0.9834", "Gini: 0.9668", "F1: 0.96", "Precision: 0.99",
    "Recall: 0.94", "Accuracy: 93.2%", "14,996 Samples", "XGBoost Model",
    "Real-time Inference", "Basel III Aligned", "Credit Score: 300–900",
    "AUC: 0.9834", "Gini: 0.9668", "F1: 0.96", "Precision: 0.99",
    "Recall: 0.94", "Accuracy: 93.2%", "14,996 Samples", "XGBoost Model",
  ];
  return (
    <div style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "14px 0", overflow: "hidden", background: "rgba(20,33,61,0.2)"
    }}>
      <div className="ticker-inner" style={{ whiteSpace: "nowrap" }}>
        {items.concat(items).map((item, i) => (
          <span key={i} style={{
            fontSize: 12, color: "rgba(255,255,255,0.35)",
            fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.04em"
          }}>
            <span style={{ color: COLORS.gold, marginRight: 8 }}>◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function FeatureCard({ feature, index }) {
  const [ref, inView] = useInView();
  const [hovered, setHovered] = useState(false);
  return (
    <div ref={ref}
      className={`fade-up delay-${index % 5 + 1}${inView ? " visible" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(20,33,61,0.9)" : "rgba(20,33,61,0.4)",
        border: `1px solid ${hovered ? "rgba(252,163,17,0.3)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16, padding: "28px 24px",
        transition: "all 0.3s ease",
        cursor: "default",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 20px 48px rgba(0,0,0,0.4)" : "none"
      }}>
      <div style={{
        fontSize: 28, marginBottom: 16,
        filter: hovered ? "none" : "grayscale(0.3)"
      }}>{feature.icon}</div>
      <div style={{
        display: "inline-block", background: "rgba(252,163,17,0.1)",
        border: "1px solid rgba(252,163,17,0.2)", borderRadius: 4,
        padding: "2px 8px", fontSize: 10, color: COLORS.gold,
        fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em", marginBottom: 12
      }}>{feature.stat}</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-0.01em" }}>
        {feature.title}
      </h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
        {feature.desc}
      </p>
    </div>
  );
}

function Features() {
  const [ref, inView] = useInView();
  return (
    <section id="features" style={{ background: "#000", padding: "100px 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div ref={ref} style={{ textAlign: "center", marginBottom: 64 }}>
          <div className={`fade-in${inView ? " visible" : ""}`}
            style={{ fontSize: 11, color: COLORS.gold, letterSpacing: "0.15em", marginBottom: 16, textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>
            Platform Capabilities
          </div>
          <h2 className={`fade-up${inView ? " visible" : ""}`}
            style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 16 }}>
            Enterprise Risk Intelligence
          </h2>
          <p className={`fade-up delay-1${inView ? " visible" : ""}`}
            style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 520, margin: "0 auto" }}>
            Production ML model validated on real lending data with industry-leading discrimination metrics.
          </p>
        </div>
        <div style={{
          display: "grid", gap: 20,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
        }}>
          {FEATURES.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const [ref, inView] = useInView(0.1);
  return (
    <section id="how-it-works" style={{ background: "#000", padding: "100px 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 11, color: COLORS.gold, letterSpacing: "0.15em", marginBottom: 16, textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>
            Analytical Workflow
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            From Data to Decision
          </h2>
        </div>

        <div ref={ref} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 0, flexWrap: "wrap", gap: 0
        }}>
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div className={`fade-up delay-${i + 1}${inView ? " visible" : ""}`}
                style={{ textAlign: "center", minWidth: 120 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: i === 0 || i === WORKFLOW_STEPS.length - 1
                    ? "rgba(252,163,17,0.12)"
                    : "rgba(20,33,61,0.8)",
                  border: `1px solid ${i === 0 || i === WORKFLOW_STEPS.length - 1 ? "rgba(252,163,17,0.4)" : "rgba(255,255,255,0.1)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px",
                  color: i === 0 || i === WORKFLOW_STEPS.length - 1 ? COLORS.gold : "rgba(255,255,255,0.4)",
                  fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 14
                }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{step.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{step.sub}</div>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className={`fade-in delay-${i + 1}${inView ? " visible" : ""}`}
                  style={{ width: 32, textAlign: "center", color: "rgba(252,163,17,0.4)", fontSize: 18, marginBottom: 24, flexShrink: 0 }}>→</div>
              )}
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1,
          marginTop: 64, background: "rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden"
        }}>
          {[
            { label: "True Positive Rate", val: "94%", sub: "Recall on defaults" },
            { label: "False Positive Rate", val: "7%", sub: "Non-default misclass." },
            { label: "Weighted F1", val: "0.94", sub: "Balanced performance" },
            { label: "KS Statistic", val: "~0.87", sub: "Discriminatory power" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "28px 24px", background: "#000", textAlign: "center",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none"
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.gold, fontFamily: "JetBrains Mono, monospace", letterSpacing: "-0.02em" }}>{s.val}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "6px 0 4px" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────
const FORM_STEPS = [
  { title: "Personal", sub: "Applicant demographics" },
  { title: "Financial", sub: "Income & loan details" },
  { title: "Credit History", sub: "Past credit behavior" },
  { title: "Loan Details", sub: "Purpose & structure" },
];

function FieldGroup({ label, hint, error, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)",
        marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase"
      }}>{label}</label>
      {children}
      {hint && !error && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 5 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 5 }}>⚠ {error}</div>}
    </div>
  );
}

function CInput({ value, onChange, type = "number", placeholder, min, max, step, error }) {
  return (
    <input
      className={`crp-input${error ? " error" : ""}`}
      type={type}
      value={value}
      onChange={e => onChange(type === "number" ? e.target.value : e.target.value)}
      placeholder={placeholder}
      min={min} max={max} step={step}
    />
  );
}

function CSelect({ value, onChange, options, placeholder, error }) {
  return (
    <select className={`crp-input${error ? " error" : ""}`} value={value}
      onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder || "Select..."}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

const INIT_FORM = {
  age: "", income: "", loan_amount: "", loan_tenure_months: "",
  credit_utilization_ratio: "", total_loan_months: "", delinquent_months: "",
  total_dpd: "", num_open_accounts: "", residence_type: "",
  loan_purpose: "", loan_type: ""
};

function validateStep(step, form) {
  const errs = {};
  if (step === 0) {
    if (!form.age || form.age < 18 || form.age > 99) errs.age = "Age must be 18–99";
    if (!form.residence_type) errs.residence_type = "Required";
  }
  if (step === 1) {
    if (!form.income || form.income <= 0) errs.income = "Enter a valid income";
    if (!form.loan_amount || form.loan_amount <= 0) errs.loan_amount = "Enter loan amount";
    if (!form.loan_tenure_months || form.loan_tenure_months <= 0) errs.loan_tenure_months = "Enter tenure";
    if (!form.num_open_accounts || form.num_open_accounts < 0) errs.num_open_accounts = "Required";
  }
  if (step === 2) {
    if (form.credit_utilization_ratio === "" || form.credit_utilization_ratio < 0 || form.credit_utilization_ratio > 100)
      errs.credit_utilization_ratio = "Enter 0–100";
    if (!form.total_loan_months || form.total_loan_months <= 0) errs.total_loan_months = "Required";
    if (form.delinquent_months === "" || form.delinquent_months < 0) errs.delinquent_months = "Required";
    if (form.total_dpd === "" || form.total_dpd < 0) errs.total_dpd = "Required";
  }
  if (step === 3) {
    if (!form.loan_purpose) errs.loan_purpose = "Required";
    if (!form.loan_type) errs.loan_type = "Required";
  }
  return errs;
}

function StepProgress({ current, total }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        {FORM_STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: i < current ? COLORS.gold : i === current ? "rgba(252,163,17,0.2)" : "rgba(255,255,255,0.06)",
              border: `2px solid ${i <= current ? COLORS.gold : "rgba(255,255,255,0.1)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
              color: i < current ? "#000" : i === current ? COLORS.gold : "rgba(255,255,255,0.3)",
              transition: "all 0.3s",
              fontFamily: "JetBrains Mono, monospace"
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: 11, color: i <= current ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: i === current ? 600 : 400, textAlign: "center" }}>
              {s.title}
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${(current / (total - 1)) * 100}%`,
          background: COLORS.gold, borderRadius: 2,
          transition: "width 0.4s cubic-bezier(.4,0,.2,1)"
        }} />
      </div>
    </div>
  );
}

function FormStep0({ form, set, errs }) {
  return (
    <div>
      <FieldGroup label="Age" hint="Applicant must be 18 or older" error={errs.age}>
        <CInput value={form.age} onChange={v => set("age", v)} placeholder="e.g. 34" min={18} max={99} error={errs.age} />
      </FieldGroup>
      <FieldGroup label="Residence Type" hint="Current living arrangement" error={errs.residence_type}>
        <CSelect value={form.residence_type} onChange={v => set("residence_type", v)}
          options={RESIDENCE_TYPES} placeholder="Select residence type" error={errs.residence_type} />
      </FieldGroup>
    </div>
  );
}

function FormStep1({ form, set, errs }) {
  return (
    <div>
      <FieldGroup label="Annual Income (₹)" hint="Gross yearly income before tax" error={errs.income}>
        <CInput value={form.income} onChange={v => set("income", v)} placeholder="e.g. 600000" min={0} error={errs.income} />
      </FieldGroup>
      <FieldGroup label="Loan Amount (₹)" hint="Requested principal amount" error={errs.loan_amount}>
        <CInput value={form.loan_amount} onChange={v => set("loan_amount", v)} placeholder="e.g. 250000" min={0} error={errs.loan_amount} />
      </FieldGroup>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FieldGroup label="Tenure (Months)" hint="Repayment period" error={errs.loan_tenure_months}>
          <CInput value={form.loan_tenure_months} onChange={v => set("loan_tenure_months", v)} placeholder="e.g. 36" min={1} error={errs.loan_tenure_months} />
        </FieldGroup>
        <FieldGroup label="Open Accounts" hint="Active credit accounts" error={errs.num_open_accounts}>
          <CInput value={form.num_open_accounts} onChange={v => set("num_open_accounts", v)} placeholder="e.g. 3" min={0} error={errs.num_open_accounts} />
        </FieldGroup>
      </div>
    </div>
  );
}

function FormStep2({ form, set, errs }) {
  return (
    <div>
      <FieldGroup label="Credit Utilization Ratio (%)" hint="Percentage of available credit currently used" error={errs.credit_utilization_ratio}>
        <CInput value={form.credit_utilization_ratio} onChange={v => set("credit_utilization_ratio", v)} placeholder="e.g. 42" min={0} max={100} step={0.1} error={errs.credit_utilization_ratio} />
      </FieldGroup>
      <FieldGroup label="Total Loan Months" hint="Cumulative months of all loan histories" error={errs.total_loan_months}>
        <CInput value={form.total_loan_months} onChange={v => set("total_loan_months", v)} placeholder="e.g. 60" min={1} error={errs.total_loan_months} />
      </FieldGroup>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FieldGroup label="Delinquent Months" hint="Months with missed payments" error={errs.delinquent_months}>
          <CInput value={form.delinquent_months} onChange={v => set("delinquent_months", v)} placeholder="e.g. 2" min={0} error={errs.delinquent_months} />
        </FieldGroup>
        <FieldGroup label="Total DPD" hint="Sum of days past due" error={errs.total_dpd}>
          <CInput value={form.total_dpd} onChange={v => set("total_dpd", v)} placeholder="e.g. 15" min={0} error={errs.total_dpd} />
        </FieldGroup>
      </div>
    </div>
  );
}

function FormStep3({ form, set, errs }) {
  return (
    <div>
      <FieldGroup label="Loan Purpose" hint="Primary reason for borrowing" error={errs.loan_purpose}>
        <CSelect value={form.loan_purpose} onChange={v => set("loan_purpose", v)}
          options={LOAN_PURPOSES} placeholder="Select purpose" error={errs.loan_purpose} />
      </FieldGroup>
      <FieldGroup label="Loan Type" hint="Collateralized vs uncollateralized" error={errs.loan_type}>
        <CSelect value={form.loan_type} onChange={v => set("loan_type", v)}
          options={LOAN_TYPES} placeholder="Select loan type" error={errs.loan_type} />
      </FieldGroup>
    </div>
  );
}

function PredictionForm({ onResult }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INIT_FORM);
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [apiError, setApiError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const next = () => {
    const e = validateStep(step, form);
    if (Object.keys(e).length) { setErrs(e); return; }
    setErrs({});
    setStep(s => Math.min(s + 1, 3));
  };

  const submit = async () => {
    const e = validateStep(3, form);
    if (Object.keys(e).length) { setErrs(e); return; }
    setErrs({});
    setLoading(true);
    setApiError(null);
    setStage(0);

    // Animate through stages
    for (let i = 0; i < ANALYSIS_STAGES.length; i++) {
      setStage(i);
      await new Promise(r => setTimeout(r, 700 + Math.random() * 400));
    }

    try {
      const body = {
        age: Number(form.age),
        income: Number(form.income),
        loan_amount: Number(form.loan_amount),
        loan_tenure_months: Number(form.loan_tenure_months),
        credit_utilization_ratio: Number(form.credit_utilization_ratio),
        total_loan_months: Number(form.total_loan_months),
        delinquent_months: Number(form.delinquent_months),
        total_dpd: Number(form.total_dpd),
        num_open_accounts: Number(form.num_open_accounts),
        residence_type: form.residence_type,
        loan_purpose: form.loan_purpose,
        loan_type: form.loan_type,
      };
      const res = await fetch(`${API_BASE}/predict_credit_risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      onResult(data, form);
    } catch (err) {
      setApiError(err.message || "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const STEP_COMPONENTS = [
    <FormStep0 form={form} set={set} errs={errs} />,
    <FormStep1 form={form} set={set} errs={errs} />,
    <FormStep2 form={form} set={set} errs={errs} />,
    <FormStep3 form={form} set={set} errs={errs} />,
  ];

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        {/* Scanning animation */}
        <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 32px" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            border: "2px solid rgba(252,163,17,0.2)",
            position: "absolute"
          }} />
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: COLORS.gold,
            position: "absolute",
            animation: "spin 1s linear infinite"
          }} />
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 28
          }}>🔬</div>
        </div>

        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em", marginBottom: 24 }}>
          PROCESSING
        </div>

        <div style={{ maxWidth: 340, margin: "0 auto" }}>
          {ANALYSIS_STAGES.map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "8px 0",
              opacity: i <= stage ? 1 : 0.2,
              transition: "opacity 0.4s, color 0.4s"
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                background: i < stage ? COLORS.gold : i === stage ? "rgba(252,163,17,0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${i <= stage ? COLORS.gold : "rgba(255,255,255,0.1)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10
              }}>
                {i < stage ? "✓" : i === stage ? <span style={{ animation: "pulse-dot 1s infinite", display: "block", width: 6, height: 6, borderRadius: "50%", background: COLORS.gold }} /> : ""}
              </div>
              <span style={{ fontSize: 13, color: i <= stage ? "#fff" : "rgba(255,255,255,0.2)" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepProgress current={step} total={4} />

      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12, padding: "8px 16px", marginBottom: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{FORM_STEPS[step].title}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{FORM_STEPS[step].sub}</div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.gold, fontFamily: "JetBrains Mono, monospace" }}>
          {step + 1} / 4
        </div>
      </div>

      <div style={{ minHeight: 260 }}>
        {STEP_COMPONENTS[step]}
      </div>

      {apiError && (
        <div style={{
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8, padding: "12px 16px", marginBottom: 16,
          fontSize: 13, color: "#ef4444"
        }}>
          ⚠ {apiError}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        {step > 0 && (
          <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button className="btn-primary" onClick={next}>Continue →</button>
        ) : (
          <button className="btn-primary" onClick={submit}>
            Run Risk Analysis →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────
function RingChart({ probability, size = 160 }) {
  const [active, setActive] = useState(false);
  useEffect(() => { setTimeout(() => setActive(true), 200); }, []);

  const r = 56, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  const filled = active ? circ * (1 - probability) : circ;
  const color = getRiskColor(probability);
  const pct = Math.round(probability * 100);

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" className="ring-bg" strokeWidth={10} />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={filled}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          className="ring-fill"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        <div style={{
          fontSize: 28, fontWeight: 900, color,
          fontFamily: "JetBrains Mono, monospace", letterSpacing: "-0.02em"
        }}>{pct}%</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>DEFAULT</div>
      </div>
    </div>
  );
}

function AnimatedScore({ score }) {
  const [active, setActive] = useState(false);
  useEffect(() => { setTimeout(() => setActive(true), 300); }, []);
  const val = useCounter(score, 1600, active);
  return (
    <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{val}</span>
  );
}

function ResultsDashboard({ result, form, onReset }) {
  const [ref, inView] = useInView(0.05);
  const prob = result.default_probability;
  const score = result.credit_score;
  const rating = result.rating;
  const ratingColor = getRatingColor(rating);
  const riskColor = getRiskColor(prob);
  const probPct = Math.round(prob * 100);

  const scorePosition = ((score - 300) / 600) * 100;

  return (
    <div ref={ref} style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div className={`fade-up${inView ? " visible" : ""}`}
        style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 100, padding: "6px 16px", marginBottom: 16
        }}>
          <span style={{ color: "#22c55e", fontSize: 12, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em" }}>
            ✓ ANALYSIS COMPLETE
          </span>
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
          Credit Risk Assessment
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
          Applicant Age {form.age} · {form.residence_type} · {form.loan_purpose} Loan
        </p>
      </div>

      {/* Primary metrics */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20
      }}>
        {/* Default Probability */}
        <div className={`fade-up delay-1${inView ? " visible" : ""}`}
          style={{
            background: "rgba(20,33,61,0.6)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "28px 20px", textAlign: "center"
          }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20, fontFamily: "JetBrains Mono, monospace" }}>
            Default Probability
          </div>
          <RingChart probability={prob} />
          <div style={{
            marginTop: 16, padding: "8px 12px",
            background: `${riskColor}15`, borderRadius: 8,
            border: `1px solid ${riskColor}30`,
            fontSize: 12, color: riskColor, fontWeight: 600
          }}>
            {prob < 0.2 ? "Low Risk" : prob < 0.4 ? "Moderate Risk" : prob < 0.6 ? "Elevated Risk" : "High Risk"}
          </div>
        </div>

        {/* Credit Score */}
        <div className={`fade-up delay-2${inView ? " visible" : ""}`}
          style={{
            background: "rgba(20,33,61,0.6)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "28px 20px", textAlign: "center",
            display: "flex", flexDirection: "column", justifyContent: "center"
          }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20, fontFamily: "JetBrains Mono, monospace" }}>
            Credit Score
          </div>
          <div style={{
            fontSize: 68, fontWeight: 900, color: ratingColor,
            letterSpacing: "-0.04em", lineHeight: 1
          }}>
            <AnimatedScore score={score} />
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "8px 0 20px" }}>
            out of 900
          </div>
          {/* Score bar */}
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, position: "relative" }}>
            <div style={{
              position: "absolute", left: 0, top: 0, height: "100%",
              width: `${scorePosition}%`,
              background: `linear-gradient(to right, #ef4444, #fca311, #22c55e)`,
              borderRadius: 3, transition: "width 1.4s cubic-bezier(.4,0,.2,1) 0.3s"
            }} />
            <div style={{
              position: "absolute", top: "50%", transform: "translate(-50%,-50%)",
              left: `${scorePosition}%`,
              width: 12, height: 12, borderRadius: "50%",
              background: ratingColor, border: "2px solid #000",
              transition: "left 1.4s cubic-bezier(.4,0,.2,1) 0.3s",
              boxShadow: `0 0 8px ${ratingColor}`
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "JetBrains Mono, monospace" }}>
            <span>300 Poor</span><span>900 Excellent</span>
          </div>
        </div>

        {/* Rating */}
        <div className={`fade-up delay-3${inView ? " visible" : ""}`}
          style={{
            background: "rgba(20,33,61,0.6)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "28px 20px", textAlign: "center",
            display: "flex", flexDirection: "column", justifyContent: "center"
          }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20, fontFamily: "JetBrains Mono, monospace" }}>
            Risk Rating
          </div>
          <div style={{
            fontSize: 52, fontWeight: 900, color: ratingColor,
            letterSpacing: "-0.02em", marginBottom: 12
          }}>{rating}</div>
          <div style={{
            background: `${ratingColor}12`, border: `1px solid ${ratingColor}30`,
            borderRadius: 8, padding: "10px 16px"
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Classification</div>
            <div style={{ fontSize: 13, color: ratingColor, fontWeight: 600 }}>
              {rating === "Excellent" ? "Prime Borrower" :
               rating === "Good" ? "Near-Prime Borrower" :
               rating === "Average" ? "Sub-prime Risk" : "High Default Risk"}
            </div>
          </div>
          <div style={{
            marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8
          }}>
            {[
              { k: "Score Band", v: score > 750 ? "A" : score > 650 ? "B" : score > 500 ? "C" : "D" },
              { k: "Risk Tier", v: prob < 0.2 ? "Tier 1" : prob < 0.4 ? "Tier 2" : prob < 0.6 ? "Tier 3" : "Tier 4" },
            ].map(m => (
              <div key={m.k} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{m.k}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "JetBrains Mono, monospace" }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className={`fade-up delay-4${inView ? " visible" : ""}`}
        style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20
        }}>
        {[
          { label: "Loan-to-Income", val: (Number(form.loan_amount) / Number(form.income)).toFixed(2) + "×", sub: "Leverage Ratio" },
          { label: "Utilization", val: Number(form.credit_utilization_ratio).toFixed(1) + "%", sub: "Credit Usage" },
          { label: "Delinquency", val: (Number(form.delinquent_months) / Number(form.total_loan_months) * 100).toFixed(1) + "%", sub: "Default Rate" },
          { label: "Avg DPD", val: form.delinquent_months > 0 ? (Number(form.total_dpd) / Number(form.delinquent_months)).toFixed(1) : "0", sub: "Days Past Due" },
        ].map((m, i) => (
          <div key={i} style={{
            background: "rgba(20,33,61,0.4)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12, padding: "18px 16px"
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.gold, fontFamily: "JetBrains Mono, monospace" }}>{m.val}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Loan summary + actions */}
      <div className={`fade-up delay-5${inView ? " visible" : ""}`}
        style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
        <div style={{
          background: "rgba(20,33,61,0.4)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, padding: "20px 24px"
        }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Loan Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              { k: "Amount", v: `₹${Number(form.loan_amount).toLocaleString("en-IN")}` },
              { k: "Income", v: `₹${Number(form.income).toLocaleString("en-IN")}` },
              { k: "Tenure", v: `${form.loan_tenure_months} mo.` },
              { k: "Purpose", v: form.loan_purpose },
              { k: "Type", v: form.loan_type },
              { k: "Open Accts", v: form.num_open_accounts },
            ].map(m => (
              <div key={m.k}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{m.k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 2 }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="btn-primary" onClick={onReset} style={{ whiteSpace: "nowrap" }}>
            New Assessment
          </button>
          <button className="btn-secondary" style={{ whiteSpace: "nowrap" }}
            onClick={() => window.print()}>
            Export Report
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: 24, padding: "12px 16px",
        background: "rgba(255,255,255,0.02)", borderRadius: 8,
        fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.6
      }}>
        This assessment is generated by an ML model for analytical purposes only. Results should be used in conjunction with full underwriting review and do not constitute a lending decision.
      </div>
    </div>
  );
}

// ─── Predict Section ──────────────────────────────────────────────────────────
function PredictSection() {
  const [result, setResult] = useState(null);
  const [savedForm, setSavedForm] = useState(null);

  return (
    <section id="predict" style={{ background: "#000", padding: "100px 40px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {!result ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 11, color: COLORS.gold, letterSpacing: "0.15em", marginBottom: 16, textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>
                Risk Assessment Engine
              </div>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 16 }}>
                Predict Credit Default Risk
              </h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", maxWidth: 500, margin: "0 auto" }}>
                Complete the assessment form. Our ML model will analyze 12+ risk indicators and return a probability score, credit rating, and risk classification.
              </p>
            </div>

            <div style={{
              background: "rgba(20,33,61,0.3)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "40px",
              maxWidth: 600, margin: "0 auto"
            }} className="gold-glow">
              <PredictionForm onResult={(r, f) => { setResult(r); setSavedForm(f); }} />
            </div>
          </>
        ) : (
          <ResultsDashboard result={result} form={savedForm}
            onReset={() => { setResult(null); setSavedForm(null); }} />
        )}
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: "#000",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "48px 40px"
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, background: COLORS.gold, borderRadius: 5,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 14, color: "#000", fontFamily: "JetBrains Mono, monospace"
            }}>R</div>
            <span style={{ fontWeight: 700, color: "#fff" }}>RiskLens</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Credit Default Risk Prediction Platform
          </div>
        </div>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {["XGBoost Model", "AUC 0.9834", "14,996 Samples", "Basel III Aligned"].map(t => (
            <span key={t} style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "JetBrains Mono, monospace" }}>{t}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Inject global CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS + `
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Backend warm-up
  useEffect(() => {
    fetch(`${API_BASE}/model_status`).catch(() => {});
  }, []);

  return (
    <div>
      <Nav />
      <Hero />
      <Ticker />
      <Features />
      <div className="gold-line" />
      <HowItWorks />
      <div className="gold-line" />
      <PredictSection />
      <Footer />
    </div>
  );
}