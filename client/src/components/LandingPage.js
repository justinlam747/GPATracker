import React, { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  Target,
  CalendarDays,
  Plus,
} from "lucide-react";
import "./LandingPage.css";

gsap.registerPlugin(ScrollTrigger);

const gradePoints = {
  "A+": 4,
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2,
  "C-": 1.7,
  D: 1,
  F: 0,
};
const initialCourses = [
  {
    name: "Computer Science",
    code: "CS 101",
    credits: 3,
    grade: "A",
    color: "violet",
  },
  {
    name: "Calculus II",
    code: "MATH 201",
    credits: 4,
    grade: "B+",
    color: "blue",
  },
  {
    name: "English Literature",
    code: "ENG 102",
    credits: 3,
    grade: "A-",
    color: "orange",
  },
];
const benefits = [
  {
    icon: BookOpen,
    title: "Everything in its place.",
    text: "Keep courses, assignments, and grades together. Your semester, organized.",
  },
  {
    icon: BarChart3,
    title: "Know where you stand.",
    text: "See your GPA update as your grades change. No spreadsheets or mental math.",
  },
  {
    icon: Target,
    title: "Make your next move.",
    text: "Track your progress and keep your academic goals within reach.",
  },
];

function GPAPreview() {
  const [courses, setCourses] = useState(initialCourses);
  const credits = courses.reduce((sum, course) => sum + course.credits, 0);
  const gpa = (
    courses.reduce(
      (sum, course) => sum + gradePoints[course.grade] * course.credits,
      0,
    ) / credits
  ).toFixed(2);
  return (
    <div className="gp-preview" id="demo">
      <div className="gp-window-bar">
        <span className="gp-window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>YOUR SEMESTER, AT A GLANCE</span>
        <span className="gp-demo-label">Live preview</span>
      </div>
      <div className="gp-preview-layout">
        <aside
          className="gp-preview-sidebar"
          aria-label="Sample dashboard navigation"
        >
          <div className="gp-preview-brand">
            <GraduationCap size={23} />
            <span>GPAConnect</span>
          </div>
          <div className="gp-sidebar-item selected">
            <LayoutDashboard size={16} /> Overview
          </div>
          <div className="gp-sidebar-item">
            <BookOpen size={16} /> My courses
          </div>
          <div className="gp-sidebar-item">
            <CalendarDays size={16} /> Calendar
          </div>
          <div className="gp-sidebar-bottom">
            <span className="gp-student-avatar">J</span>
            <div>
              Jamie Parker<small>Sample student</small>
            </div>
          </div>
        </aside>
        <div className="gp-preview-content">
          <div className="gp-preview-heading">
            <div>
              <span className="gp-eyebrow">LET’S MAKE THIS SEMESTER COUNT</span>
              <h3>Your academic overview</h3>
            </div>
            <span className="gp-semester">Fall semester</span>
          </div>
          <div className="gp-metrics">
            <div className="gp-metric gp-metric-primary">
              <span>
                Cumulative GPA <BarChart3 size={16} />
              </span>
              <strong aria-live="polite">
                {gpa}
                <small>/ 4.00</small>
              </strong>
              <p>
                <span className="gp-status-dot" /> Calculated from your courses
              </p>
            </div>
            <div className="gp-metric">
              <span>
                Credits this semester <BookOpen size={16} />
              </span>
              <strong>
                {credits}
                <small>credits</small>
              </strong>
              <p>Across {courses.length} courses</p>
            </div>
            <div className="gp-metric gp-goal">
              <span>
                Your next milestone <Target size={16} />
              </span>
              <strong>
                3.80<small>GPA</small>
              </strong>
              <p>A little progress, every day.</p>
            </div>
          </div>
          <div className="gp-course-heading">
            <h4>Your courses</h4>
            <Link to="/register">
              <Plus size={14} /> Add your own
            </Link>
          </div>
          <div
            className="gp-course-table"
            role="table"
            aria-label="Sample courses and grades"
          >
            <div className="gp-table-labels" role="row">
              <span role="columnheader">COURSE</span>
              <span role="columnheader">CREDITS</span>
              <span role="columnheader">GRADE</span>
            </div>
            {courses.map((course, index) => (
              <div className="gp-course" role="row" key={course.code}>
                <div className="gp-course-name" role="cell">
                  <span className={`gp-course-icon ${course.color}`}>
                    <BookOpen size={17} />
                  </span>
                  <div>
                    {course.name}
                    <small>{course.code}</small>
                  </div>
                </div>
                <span className="gp-course-credits" role="cell">
                  {course.credits}
                </span>
                <div role="cell">
                  <select
                    aria-label={`${course.name} grade`}
                    value={course.grade}
                    onChange={(event) => {
                      const grade = event.target.value;
                      setCourses((previous) =>
                        previous.map((item, i) =>
                          i === index ? { ...item, grade } : item,
                        ),
                      );
                    }}
                  >
                    {Object.keys(gradePoints).map((grade) => (
                      <option key={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <p className="gp-preview-hint">
            Sample courses. Change a grade to see your GPA update.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const landingRef = useRef(null);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const reveal = (elements, options = {}) => gsap.from(elements, {
        opacity: 0,
        y: 24,
        duration: 0.75,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "opacity,transform",
        ...options,
      });
      reveal(".gp-nav > *", { y: -14 });
      reveal(".gp-announcement, .gp-hero h1, .gp-hero-description, .gp-hero-actions", { delay: 0.15 });

      const select = gsap.utils.selector(landingRef);
      [".gp-preview", ".gp-feature-intro", ".gp-feature-grid article", ".gp-final-cta", ".gp-footer"].forEach(selector => {
        select(selector).forEach(element => {
          const children = selector === ".gp-preview"
            ? element.querySelectorAll(".gp-window-bar, .gp-preview-sidebar, .gp-preview-heading, .gp-metric, .gp-course-heading, .gp-course-table, .gp-preview-hint")
            : element.children;
          reveal(children, {
            scrollTrigger: { trigger: element, start: "top 90%", once: true },
          });
        });
      });
    }, landingRef);
    return () => media.revert();
  }, []);

  return (
    <div className="gp-landing" ref={landingRef}>
      <Helmet>
        <title>GPAConnect — A clearer view of your semester</title>
        <meta
          name="description"
          content="Track your courses, calculate your GPA, and plan your next move. Your academic life, in one simple place."
        />
      </Helmet>
      <main>
        <div className="gp-hero-shell">
          <header className="gp-nav">
            <Link to="/" className="gp-logo" aria-label="GPAConnect home">
              <GraduationCap size={29} strokeWidth={2.3} />
              GPAConnect<span className="gp-logo-dot">.</span>
            </Link>
            <nav aria-label="Main navigation">
              <a href="#features">Why GPAConnect</a>
              <a href="#demo">
                Try the demo <ArrowUpRight size={13} />
              </a>
            </nav>
            <div className="gp-nav-actions">
              <Link to="/login" className="gp-login">
                Log in
              </Link>
              <Link to="/register" className="gp-button gp-button-blue">
                Get started free <ArrowRight size={15} />
              </Link>
            </div>
          </header>
          <section className="gp-hero" aria-labelledby="gp-title">
            <a className="gp-announcement" href="#demo">
              <span className="gp-status-dot" /> Less guesswork. More clarity.
              <span>
                Meet GPAConnect <ArrowRight size={13} />
              </span>
            </a>
            <h1 id="gp-title">
              Big goals.
              <br />A clearer path there.
            </h1>
            <p className="gp-hero-description">
              Your semester. All in one place.
            </p>
            <div className="gp-hero-actions">
              <Link to="/register" className="gp-button gp-button-dark">
                Get started free <ArrowRight size={17} />
              </Link>
              <a href="#demo" className="gp-button gp-button-white">
                Explore the demo <ArrowUpRight size={17} />
              </a>
            </div>
            <GPAPreview />
          </section>
        </div>
        <section
          className="gp-features"
          id="features"
          aria-labelledby="gp-features-title"
        >
          <div className="gp-feature-intro">
            <span className="gp-eyebrow">
              A LITTLE ORGANIZATION. A LOT OF CLARITY.
            </span>
            <h2 id="gp-features-title">
              Less juggling.
              <br />
              More moving forward.
            </h2>
            <p>Keep the big picture in focus, without losing the details.</p>
          </div>
          <div className="gp-feature-grid">
            {benefits.map(({ icon: Icon, title, text }, index) => (
              <article key={title}>
                <div className="gp-feature-top">
                  <Icon size={24} strokeWidth={1.6} />
                  <span>0{index + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="gp-final-cta">
          <span className="gp-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h2>
            Give your goals
            <br />a place to grow.
          </h2>
          <Link to="/register" className="gp-button gp-button-dark">
            Create your free account <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <footer className="gp-footer">
        <Link to="/" className="gp-logo">
          <GraduationCap size={23} />
          GPAConnect<span className="gp-logo-dot">.</span>
        </Link>
        <span>Made for your next chapter.</span>
        <div>
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/terms-of-service">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
