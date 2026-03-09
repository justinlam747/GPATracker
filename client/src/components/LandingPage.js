import React, { useEffect, useState, useCallback, useRef, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import {
  BookOpen,
  BarChart3,
  Zap,
  ArrowRight,
  GraduationCap,
  LogOut,
  X,
  ChevronDown,
  Eye,
  Calculator,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

const F = "'Satoshi', 'Inter', sans-serif";

/* ── Static data ── */
const GRADE_MAP = {
  "A+": 4.0, A: 4.0, "A-": 3.7,
  "B+": 3.3, B: 3.0, "B-": 2.7,
  "C+": 2.3, C: 2.0, "C-": 1.7,
  "D+": 1.3, D: 1.0, "D-": 0.7,
  F: 0.0,
};

/* ────────────────────────────────────────────────
   GPA helpers
   ──────────────────────────────────────────────── */
function calcGPA(courses) {
  if (!courses.length) return "0.00";
  let pts = 0, cr = 0;
  for (const c of courses) { pts += GRADE_MAP[c.grade] * c.credits; cr += c.credits; }
  return cr ? (pts / cr).toFixed(2) : "0.00";
}
function getGPAColor(gpa) {
  const n = parseFloat(gpa);
  if (n >= 3.7) return "text-blue-700";
  if (n >= 3.0) return "text-blue-600";
  if (n >= 2.0) return "text-blue-500";
  return "text-blue-400";
}

/* ────────────────────────────────────────────────
   Read-only Demo: Mini GPA Calculator
   ──────────────────────────────────────────────── */
const STATIC_COURSES = [
  { name: "Computer Science 101", credits: 3, grade: "A" },
  { name: "Calculus II", credits: 4, grade: "B+" },
  { name: "English Literature", credits: 3, grade: "A-" },
];
const STATIC_GPA = calcGPA(STATIC_COURSES);
const STATIC_CREDITS = STATIC_COURSES.reduce((s, c) => s + c.credits, 0);

const InteractiveGPA = memo(() => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-white">
        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1" style={{ fontFamily: F }}>Cumulative GPA</p>
          <div className={`text-4xl sm:text-5xl font-black tracking-tight ${getGPAColor(STATIC_GPA)}`} style={{ fontFamily: F, textShadow: "0 2px 4px rgba(37,99,235,0.08)" }}>
            {STATIC_GPA}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-blue-900" style={{ fontFamily: F }}>{STATIC_CREDITS}</div>
          <p className="text-xs font-medium text-blue-400" style={{ fontFamily: F }}>Total Credits</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="h-3 rounded-full gpa-track overflow-hidden">
          <div className="h-full rounded-full gpa-fill" style={{ width: `${Math.min((parseFloat(STATIC_GPA) / 4.0) * 100, 100)}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-medium text-blue-300" style={{ fontFamily: F }}>0.0</span>
          <span className="text-[10px] font-medium text-blue-300" style={{ fontFamily: F }}>4.0</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {STATIC_COURSES.map((course, i) => (
          <div key={i} className="course-row flex items-center gap-2.5 p-3 rounded-xl">
            <span className="flex-1 min-w-0 text-sm font-medium text-blue-900 truncate" style={{ fontFamily: F }}>
              {course.name}
            </span>
            <span className="text-xs font-medium text-blue-400 px-2.5 py-1.5 rounded-lg bg-white/60" style={{ fontFamily: F }}>
              {course.credits} cr
            </span>
            <span className="text-xs font-bold text-blue-600 px-2.5 py-1.5 rounded-lg bg-white/60" style={{ fontFamily: F }}>
              {course.grade}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ────────────────────────────────────────────────
   Scale Switcher Demo
   ──────────────────────────────────────────────── */
const SCALE_DATA = {
  "4.0": { value: "3.67", label: "Standard GPA Scale" },
  "4.3": { value: "3.85", label: "Extended GPA Scale" },
  "%": { value: "91.2%", label: "Percentage Grade" },
  "Letter": { value: "A-", label: "Letter Grade" },
};
const SCALE_KEYS = Object.keys(SCALE_DATA);

const ScaleDemo = memo(() => {
  const [scaleIdx, setScaleIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setScaleIdx((p) => (p + 1) % SCALE_KEYS.length), 3200);
    return () => clearInterval(timer);
  }, []);

  const scale = SCALE_KEYS[scaleIdx];
  const d = SCALE_DATA[scale];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-white">
        <div className="icon-3d w-10 h-10 rounded-xl flex items-center justify-center">
          <Eye className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-blue-900" style={{ fontFamily: F }}>Grade Scale Converter</h3>
          <p className="text-xs text-blue-400" style={{ fontFamily: F }}>Auto-cycles between grading formats</p>
        </div>
      </div>

      <div className="scale-tab-bar flex gap-1.5 mb-8 p-1.5 rounded-xl">
        {SCALE_KEYS.map((key) => (
          <div
            key={key}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold text-center ${scale === key ? "tab-3d-active text-blue-900" : "text-blue-400"}`}
            style={{ fontFamily: F, transition: "color 0.2s, background 0.2s" }}
          >
            {key}
          </div>
        ))}
      </div>

      <div className="scale-display text-center py-10 rounded-2xl">
        <div className="text-5xl sm:text-6xl font-black tracking-tight text-blue-600 mb-2" style={{ fontFamily: F, textShadow: "0 2px 8px rgba(37,99,235,0.15)" }}>
          {d.value}
        </div>
        <div className="text-sm font-medium text-blue-400" style={{ fontFamily: F }}>{d.label}</div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2">
        {SCALE_KEYS.map((key) => (
          <div
            key={key}
            className={`text-center py-3 rounded-xl ${scale === key ? "card-3d" : "scale-grid-item"}`}
            style={{ transition: "box-shadow 0.3s, background 0.3s" }}
          >
            <div className={`text-sm font-black ${scale === key ? "text-blue-600" : "text-blue-400"}`} style={{ fontFamily: F }}>{SCALE_DATA[key].value}</div>
            <div className="text-[10px] font-medium text-blue-300 mt-0.5" style={{ fontFamily: F }}>{key}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ────────────────────────────────────────────────
   Bento Demo: Course Checklist
   ──────────────────────────────────────────────── */
const CHECKLIST_COURSES = [
  { name: "Computer Science 101", grade: "A", credits: 3, done: true },
  { name: "Calculus II", grade: "B+", credits: 4, done: false },
  { name: "English Literature", grade: "A-", credits: 3, done: true },
  { name: "Physics I", grade: "B", credits: 4, done: false },
  { name: "Art History", grade: "A", credits: 3, done: true },
];
const CHECKLIST_DONE = CHECKLIST_COURSES.filter((c) => c.done).length;

const CourseChecklistDemo = memo(() => {
  return (
    <div className="h-full flex flex-col">
      <div className="space-y-2 flex-1">
        {CHECKLIST_COURSES.map((c, i) => (
          <div
            key={i}
            className={`checklist-row w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl ${c.done ? "is-done" : ""}`}
          >
            <div className={`checklist-check w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${c.done ? "is-done" : ""}`}>
              {c.done && <CheckCircle2 className="h-3 w-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-bold block ${c.done ? "text-blue-700 line-through opacity-50" : "text-blue-900"}`} style={{ fontFamily: F }}>
                {c.name}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${c.done ? "text-blue-500 bg-blue-100/60" : "text-blue-400 bg-blue-50/80"}`} style={{ fontFamily: F }}>
                {c.grade}
              </span>
              <span className="text-[10px] font-medium text-blue-300" style={{ fontFamily: F }}>{c.credits}cr</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-blue-400" style={{ fontFamily: F }}>
          {CHECKLIST_DONE}/{CHECKLIST_COURSES.length} completed
        </span>
        <div className="h-1.5 flex-1 mx-3 rounded-full overflow-hidden gpa-track">
          <div className="h-full rounded-full gpa-fill" style={{ width: `${(CHECKLIST_DONE / CHECKLIST_COURSES.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
});

/* ────────────────────────────────────────────────
   Bento Demo: Animated Bar Chart
   ──────────────────────────────────────────────── */
const SEMESTERS = [
  { short: "F22", gpa: 3.2 },
  { short: "S23", gpa: 3.4 },
  { short: "F23", gpa: 3.1 },
  { short: "S24", gpa: 3.6 },
  { short: "F24", gpa: 3.8 },
  { short: "S25", gpa: 3.9 },
];
const AVG_GPA = (SEMESTERS.reduce((s, sem) => s + sem.gpa, 0) / SEMESTERS.length).toFixed(2);

const AnalyticsDemo = memo(() => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimated(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full flex flex-col">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1" style={{ fontFamily: F }}>Cumulative</div>
          <div className="text-3xl sm:text-4xl font-black text-blue-700" style={{ fontFamily: F, textShadow: "0 2px 8px rgba(37,99,235,0.1)" }}>
            {animated ? AVG_GPA : "0.00"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1" style={{ fontFamily: F }}>Trend</div>
          <div className="text-lg font-black text-blue-500" style={{ fontFamily: F }}>+0.7</div>
        </div>
      </div>

      <div className="flex-1 flex items-end gap-2 sm:gap-3 min-h-[140px]">
        {SEMESTERS.map((sem, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="text-[10px] sm:text-xs font-black text-blue-600"
              style={{
                fontFamily: F,
                opacity: animated ? 1 : 0,
                transform: animated ? "translateY(0)" : "translateY(8px)",
                transition: `opacity 0.6s ${i * 120 + 400}ms, transform 0.6s ${i * 120 + 400}ms`,
              }}
            >
              {sem.gpa.toFixed(1)}
            </div>
            <div className="w-full flex-1 flex items-end">
              <div
                className="bar-3d w-full rounded-t-xl"
                style={{
                  height: animated ? `${(sem.gpa / 4.0) * 100}%` : "0%",
                  transition: `height 1s cubic-bezier(0.22,1,0.36,1) ${i * 120}ms`,
                }}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-blue-400" style={{ fontFamily: F }}>{sem.short}</span>
          </div>
        ))}
      </div>

      <div className="mt-1 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, rgba(37,99,235,0.05), rgba(37,99,235,0.15), rgba(37,99,235,0.05))" }} />
    </div>
  );
});

/* ────────────────────────────────────────────────
   Bento Demo: Insight Ticker
   ──────────────────────────────────────────────── */
const INSIGHTS = [
  { label: "Semester GPA", value: "3.85", sub: "+0.15 from last sem" },
  { label: "Best Course", value: "CS 201", sub: "A+ final grade" },
  { label: "Credits Done", value: "68/120", sub: "57% complete" },
  { label: "Class Rank", value: "Top 12%", sub: "Out of 840 students" },
];

const InsightsDemo = memo(() => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx((p) => (p + 1) % INSIGHTS.length), 2800);
    return () => clearInterval(timer);
  }, []);

  const current = INSIGHTS[idx];

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="insight-display text-center py-6 px-4 rounded-2xl flex-1 flex flex-col items-center justify-center">
        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.15em] mb-2 h-4" style={{ fontFamily: F }}>
          {current.label}
        </div>
        <div className="text-3xl sm:text-4xl font-black text-blue-700 mb-1 h-10 flex items-center justify-center" style={{ fontFamily: F, textShadow: "0 2px 8px rgba(37,99,235,0.1)" }}>
          {current.value}
        </div>
        <div className="text-xs font-medium text-blue-500/70 h-5" style={{ fontFamily: F }}>
          {current.sub}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {INSIGHTS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full insight-dot ${i === idx ? "is-active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
});

/* ────────────────────────────────────────────────
   Main Landing Page
   ──────────────────────────────────────────────── */
const LandingPage = () => {
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [demoTab, setDemoTab] = useState("calculator");
  const [visibleSections, setVisibleSections] = useState(new Set());

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (event) => {
      if (!event.target.closest("header")) setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const newIds = entries.filter((e) => e.isIntersecting).map((e) => e.target.id);
        if (newIds.length) setVisibleSections((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.add(id));
          return next;
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = useCallback((id) => visibleSections.has(id), [visibleSections]);

  const faqs = useMemo(() => [
    { q: "How accurate are the GPA calculations?", a: "GPAConnect uses industry-standard GPA calculation methods. We support multiple GPA scales (4.0, 4.3, letter grades, and percentages) and calculate your GPA based on weighted credit hours. Always verify with your institution as some schools may use custom grading scales." },
    { q: "Is my academic data secure and private?", a: "Yes! All data is encrypted in transit using HTTPS, passwords are hashed using industry-standard algorithms, and we never sell or share your personal information. You can delete your account and all associated data at any time." },
    { q: "Can I track multiple semesters?", a: "Absolutely! GPAConnect allows you to organize courses by semester, track progression over time, and view historical data. Add unlimited courses across multiple semesters and academic years." },
    { q: "How does grade prediction work?", a: "Our grade prediction tool analyzes your current performance, assignment weights, and remaining coursework to calculate what grades you need on future assignments to achieve your target final grade." },
    { q: "Is GPAConnect free to use?", a: "Yes! GPAConnect is completely free for all students. We believe every student should have access to tools that help them succeed academically." },
    { q: "What if my school uses a different scale?", a: "We support multiple GPA scales including 4.0, 4.3, letter grades, and percentage-based systems. Assignments are stored as percentages and converted to your chosen scale for display." },
  ], []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: F }}>
      <Helmet>
        <title>GPAConnect | GPA Calculator & Academic Progress Tracker</title>
        <meta name="description" content="Track your GPA, predict final grades, and manage your courses with GPAConnect. A real-time GPA calculator and academic progress tracker built for students." />
        <meta name="keywords" content="GPA calculator, GPA tracker, grade predictor, academic progress tracker, student GPA tool" />
        <meta property="og:title" content="GPAConnect - GPA Calculator & Tracker" />
        <meta property="og:description" content="Track GPA, manage courses, and predict final grades with GPAConnect." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Background layers */}
      <div className="landing-bg" aria-hidden="true" />
      <div className="vignette-overlay" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />

      {/* HEADER */}
      <header className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2.5">
              <div className="icon-3d w-9 h-9 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-lg font-black text-blue-900" style={{ fontFamily: F }}>GPAConnect</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              {[
                { label: "Features", target: "features" },
                { label: "Try It", target: "interactive-demo" },
                { label: "FAQ", target: "faq" },
              ].map((item) => (
                <button
                  key={item.target}
                  onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth" })}
                  className="text-sm font-medium text-blue-400 hover:text-blue-800"
                  style={{ transition: "color 0.15s" }}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="hidden sm:flex items-center gap-4">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="text-sm font-medium text-blue-500 hover:text-blue-800" style={{ transition: "color 0.15s" }}>Log in</Link>
                  <Link to="/register" className="btn-3d-primary text-sm px-5 py-2.5 rounded-full font-bold">Sign up for free</Link>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/courses" className="text-sm font-medium text-blue-500 hover:text-blue-800" style={{ transition: "color 0.15s" }}>My Courses</Link>
                  <Link to="/" className="btn-3d-primary text-sm px-5 py-2.5 rounded-full font-bold">Go to Dashboard</Link>
                  <button onClick={logout} className="text-blue-300 hover:text-blue-600" style={{ transition: "color 0.15s" }}><LogOut className="h-4 w-4" /></button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-blue-400 hover:text-blue-800"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden relative z-50 card-3d mx-4 rounded-2xl p-5 space-y-3 animate-scale-in">
          <nav className="space-y-1">
            {["features", "interactive-demo", "faq"].map((target) => (
              <button
                key={target}
                onClick={() => { document.getElementById(target)?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-blue-500 hover:text-blue-800 rounded-xl capitalize"
              >
                {target === "interactive-demo" ? "Try It" : target}
              </button>
            ))}
          </nav>
          <div className="pt-3 border-t-2 border-white/80 space-y-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-3d-secondary block text-center px-4 py-3 text-sm font-bold rounded-xl">Log in</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-3d-primary block text-center px-4 py-3 text-sm font-bold rounded-xl">Sign up for free</Link>
              </>
            ) : (
              <>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="btn-3d-primary block text-center px-4 py-3 text-sm font-bold rounded-xl">Dashboard</Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn-3d-secondary block w-full text-center px-4 py-3 text-sm font-bold rounded-xl">Logout</button>
              </>
            )}
          </div>
        </div>
      )}

      <main className="relative z-10">
        {/* HERO */}
        <section className="relative pt-16 sm:pt-24 md:pt-32 pb-16 sm:pb-20 text-center" aria-labelledby="hero-title">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-rise mb-8 sm:mb-10">
              <div className="badge-3d inline-flex items-center gap-2 px-5 py-2.5 rounded-full">
                <span className="text-sm font-medium text-blue-500">Free for all students</span>
                <span className="text-sm font-bold text-blue-600 flex items-center gap-0.5">
                  Get started
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            <h1
              id="hero-title"
              className="animate-rise delay-100 font-black text-white tracking-tight leading-[1.06]
                text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 sm:mb-8 mx-auto max-w-4xl"
              style={{ fontFamily: F, textShadow: '-1px -1px 0 rgba(255,255,255,0.4), 1px 1px 0 rgba(30,64,175,0.35), 2px 2px 4px rgba(30,64,175,0.2), 0 4px 16px rgba(37,99,235,0.12)' }}
            >
              Stop guessing your grades. Start knowing them.
            </h1>

            <p className="animate-rise delay-200 text-base sm:text-lg md:text-xl text-blue-900/50 font-medium max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Track your GPA in real time, predict final grades, and manage courses. All in one beautiful tool built for students.
            </p>

            <div className="animate-rise delay-300 flex flex-wrap gap-3 sm:gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="btn-3d-primary group px-7 py-3.5 rounded-full font-bold text-sm sm:text-base flex items-center gap-2">
                    Get started for free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5" style={{ transition: "transform 0.15s" }} />
                  </Link>
                  <button
                    onClick={() => document.getElementById("interactive-demo")?.scrollIntoView({ behavior: "smooth" })}
                    className="btn-3d-secondary px-7 py-3.5 rounded-full font-bold text-sm sm:text-base flex items-center gap-2"
                  >
                    Try the demo
                  </button>
                </>
              ) : (
                <Link to="/courses" className="btn-3d-primary group px-7 py-3.5 rounded-full font-bold text-sm sm:text-base flex items-center gap-2">
                  View My GPA Tracker
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5" style={{ transition: "transform 0.15s" }} />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* PRODUCT PREVIEW */}
        <section id="interactive-demo" data-animate className="relative pb-20 sm:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={isVisible("interactive-demo") ? "animate-rise" : "opacity-0"}>
              <div className="showcase-3d rounded-2xl sm:rounded-3xl">
                {/* Tab bar */}
                <div className="showcase-tab-bar flex items-center gap-1 px-4 sm:px-6 py-3">
                  <button
                    onClick={() => setDemoTab("calculator")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${demoTab === "calculator" ? "tab-3d-active text-blue-900" : "text-blue-300 hover:text-blue-600"}`}
                    style={{ transition: "color 0.15s" }}
                  >
                    <Calculator className="h-4 w-4" />
                    GPA Calculator
                  </button>
                  <button
                    onClick={() => setDemoTab("scales")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${demoTab === "scales" ? "tab-3d-active text-blue-900" : "text-blue-300 hover:text-blue-600"}`}
                    style={{ transition: "color 0.15s" }}
                  >
                    <Eye className="h-4 w-4" />
                    Grade Scales
                  </button>
                  <div className="flex-1" />
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-blue-300">
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </div>
                </div>

                {/* Demo — fixed min-height prevents layout shift on tab switch */}
                <div className="p-6 sm:p-10 md:p-12 max-w-2xl mx-auto" style={{ minHeight: "460px" }}>
                  <div style={{ display: demoTab === "calculator" ? "block" : "none" }}>
                    <InteractiveGPA />
                  </div>
                  <div style={{ display: demoTab === "scales" ? "block" : "none" }}>
                    <ScaleDemo />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES — Bento Grid */}
        <section id="features" data-animate className="relative py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className={`text-center mb-14 sm:mb-20 ${isVisible("features") ? "animate-rise" : "opacity-0"}`}>
              <h2
                className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight"
                style={{ textShadow: '-1px -1px 0 rgba(255,255,255,0.4), 1px 1px 0 rgba(30,64,175,0.35), 2px 2px 4px rgba(30,64,175,0.2), 0 4px 12px rgba(37,99,235,0.1)' }}
              >
                Everything you need to excel.
              </h2>
              <p className="text-base sm:text-lg text-blue-600/60 font-medium max-w-2xl mx-auto">
                Powerful tools in a beautiful interface. Go ahead — try them out.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
              <article className={`card-3d-static lg:col-span-3 p-6 sm:p-8 rounded-2xl flex flex-col ${isVisible("features") ? "animate-rise delay-100" : "opacity-0"}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="icon-3d w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-blue-900">Visual Analytics</h3>
                    <p className="text-[10px] font-medium text-blue-400 mt-0.5" style={{ fontFamily: F }}>GPA progression across semesters</p>
                  </div>
                </div>
                <div className="flex-1 min-h-[200px]">
                  <AnalyticsDemo />
                </div>
              </article>

              <article className={`card-3d-static lg:col-span-2 p-6 sm:p-8 rounded-2xl flex flex-col ${isVisible("features") ? "animate-rise delay-200" : "opacity-0"}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="icon-3d w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-blue-900">Instant Insights</h3>
                    <p className="text-[10px] font-medium text-blue-400 mt-0.5" style={{ fontFamily: F }}>
                      Live stats at a glance
                    </p>
                  </div>
                </div>
                <div className="flex-1">
                  <InsightsDemo />
                </div>
              </article>

              <article className={`card-3d-static lg:col-span-5 p-6 sm:p-8 rounded-2xl flex flex-col ${isVisible("features") ? "animate-rise delay-300" : "opacity-0"}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="icon-3d w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-blue-900">Course Management</h3>
                    <p className="text-[10px] font-medium text-blue-400 mt-0.5" style={{ fontFamily: F }}>
                      Track your semester courses
                    </p>
                  </div>
                </div>
                <div className="flex-1">
                  <CourseChecklistDemo />
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" data-animate className="relative py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className={`text-center mb-14 sm:mb-20 ${isVisible("how-it-works") ? "animate-rise" : "opacity-0"}`}>
              <h2
                className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight"
                style={{ textShadow: '-1px -1px 0 rgba(255,255,255,0.4), 1px 1px 0 rgba(30,64,175,0.35), 2px 2px 4px rgba(30,64,175,0.2), 0 4px 12px rgba(37,99,235,0.1)' }}
              >
                Get started in 3 steps.
              </h2>
              <p className="text-base sm:text-lg text-blue-600/60 font-medium max-w-xl mx-auto">
                No setup, no complexity, no cost. Under a minute.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                { step: "01", title: "Create Account", desc: "Sign up free with just an email. No credit card, no strings attached." },
                { step: "02", title: "Add Your Courses", desc: "Enter your current courses, credits, and grades. Import or add manually." },
                { step: "03", title: "Track & Predict", desc: "Watch your GPA update in real time. Use predictions to plan your path." },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`card-3d relative p-8 sm:p-10 rounded-2xl text-center ${isVisible("how-it-works") ? `animate-rise delay-${(i + 1) * 100}` : "opacity-0"}`}
                >
                  <div className="step-number text-7xl sm:text-8xl font-black mb-4 select-none" style={{ fontFamily: F }}>
                    {item.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-blue-600/50 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" data-animate className="relative py-20 sm:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-12 sm:mb-16 ${isVisible("faq") ? "animate-rise" : "opacity-0"}`}>
              <h2
                className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight"
                style={{ textShadow: '-1px -1px 0 rgba(255,255,255,0.4), 1px 1px 0 rgba(30,64,175,0.35), 2px 2px 4px rgba(30,64,175,0.2), 0 4px 12px rgba(37,99,235,0.1)' }}
              >
                Frequently asked questions.
              </h2>
              <p className="text-base sm:text-lg text-blue-500/60 font-medium">
                Everything you need to know about GPAConnect
              </p>
            </div>

            <div className={`space-y-3 ${isVisible("faq") ? "animate-rise delay-100" : "opacity-0"}`}>
              {faqs.map((faq, i) => (
                <div key={i} className="faq-3d rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                    className="w-full px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between text-left"
                  >
                    <span className="text-sm sm:text-base font-bold text-blue-900 pr-4">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-blue-400 flex-shrink-0 ${openFAQ === i ? "rotate-180" : ""}`} style={{ transition: "transform 0.3s" }} />
                  </button>
                  <div className={`overflow-hidden ${openFAQ === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`} style={{ transition: "max-height 0.3s, opacity 0.3s" }}>
                    <div className="px-6 sm:px-8 pb-6 text-sm text-blue-600/50 leading-relaxed font-medium">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section data-animate id="final-cta" className="relative py-20 sm:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
            <div className={`cta-3d rounded-3xl sm:rounded-[2rem] p-10 sm:p-16 ${isVisible("final-cta") ? "animate-scale-in" : "opacity-0"}`}>
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
              <div className="relative">
                <h2
                  className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight"
                  style={{ textShadow: '-1px -1px 0 rgba(255,255,255,0.25), 1px 1px 0 rgba(0,0,0,0.3), 2px 2px 4px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1)' }}
                >
                  Your GPA journey starts here.
                </h2>
                <p className="text-base sm:text-lg text-white/70 font-medium max-w-xl mx-auto mb-8 sm:mb-10">
                  Join thousands of students already tracking their academic progress. Free forever.
                </p>
                {!isAuthenticated ? (
                  <Link to="/register" className="btn-3d-invert group inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-sm sm:text-base">
                    Get started for free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5" style={{ transition: "transform 0.15s" }} />
                  </Link>
                ) : (
                  <Link to="/courses" className="btn-3d-invert group inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-sm sm:text-base">
                    Open Dashboard
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5" style={{ transition: "transform 0.15s" }} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/20 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10 mb-8 sm:mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="icon-3d w-8 h-8 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="text-base font-black text-blue-900">GPAConnect</span>
              </div>
              <p className="text-sm text-blue-400/60 leading-relaxed font-medium">
                Empowering students to take control of their academic journey.
              </p>
            </div>

            {[
              { title: "Product", links: [{ label: "Features", action: () => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }) }, { label: "Demo", action: () => document.getElementById("interactive-demo")?.scrollIntoView({ behavior: "smooth" }) }, { label: "Get Started", to: "/register" }] },
              { title: "Resources", links: [{ label: "Courses", to: "/courses" }, { label: "Calendar", to: "/calendar" }, { label: "Settings", to: "/settings" }] },
              { title: "Legal", links: [{ label: "Privacy Policy", to: "/privacy-policy" }, { label: "Terms of Service", to: "/terms-of-service" }] },
            ].map((col, i) => (
              <div key={i}>
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      {link.to ? (
                        <Link to={link.to} className="text-sm text-blue-400 hover:text-blue-800 font-medium" style={{ transition: "color 0.15s" }}>{link.label}</Link>
                      ) : (
                        <button onClick={link.action} className="text-sm text-blue-400 hover:text-blue-800 font-medium" style={{ transition: "color 0.15s" }}>{link.label}</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t-2 border-white/60">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-blue-400/60 font-medium">&copy; {new Date().getFullYear()} GPAConnect. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <Link to="/privacy-policy" className="text-xs text-blue-300 hover:text-blue-600 font-medium" style={{ transition: "color 0.15s" }}>Privacy</Link>
                <Link to="/terms-of-service" className="text-xs text-blue-300 hover:text-blue-600 font-medium" style={{ transition: "color 0.15s" }}>Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
