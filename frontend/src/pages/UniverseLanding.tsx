import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './UniverseLanding.css';
import { HeroScene } from "../components/universe";
import { remap } from "../components/universe/progress";

const worlds = [
  { number: '01', title: 'AI STUDIO', detail: 'Images, ideas and intelligent creation.', className: 'world-cyan', tag: 'CREATE' },
  { number: '02', title: 'GAMES', detail: 'Characters, scenes and playable worlds.', className: 'world-purple', tag: 'PLAY' },
  { number: '03', title: 'WEB', detail: 'Digital products shaped from a prompt.', className: 'world-blue', tag: 'BUILD' },
  { number: '04', title: 'MOTION', detail: 'Video, animation and moving stories.', className: 'world-pink', tag: 'MOVE' },
  { number: '05', title: 'AUDIO', detail: 'Voice, sound and original music.', className: 'world-gold', tag: 'LISTEN' },
  { number: '06', title: 'MARKETPLACE', detail: 'Discover and share digital assets.', className: 'world-mint', tag: 'DISCOVER' },
];

const UniverseLanding: React.FC = () => {
  const { i18n } = useTranslation();
  const { progress, updateProgress } = useUniverseProgress();
  const isPersian = i18n.language.startsWith('fa');
  const worldsVisible = remap(progress, 0.75, 1.0);

  const toggleLanguage = () => {
    const next = isPersian ? 'en' : 'fa';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr';
  };

  return (
    <main className={`universe-landing ${isPersian ? 'is-persian' : ''}`} data-universe-progress={progress.toFixed(3)}>
      <ScrollController onProgress={updateProgress} />
      <header className="universe-nav">
        <a className="brand-lockup" href="#top" aria-label="Sina Studio AI home">
          <span className="brand-mark">S</span>
          <span className="brand-name">SINA <b>STUDIO</b><small>ARTIFICIAL INTELLIGENCE</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#worlds">THE WORLDS</a>
          <a href="#creation">HOW IT WORKS</a>
          <a href="#founders">FOUNDERS</a>
        </nav>
        <div className="nav-actions">
          <button className="language-toggle" type="button" onClick={toggleLanguage} aria-label="Toggle language">
            {isPersian ? 'EN' : 'FA'} <span>↗</span>
          </button>
          <Link className="nav-cta" to="/login">ENTER STUDIO <span>↗</span></Link>
        </div>
      </header>

      <section className="universe-hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-nebula nebula-violet" aria-hidden="true" />
        <div className="hero-nebula nebula-cyan" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> A NEW CREATIVE DIMENSION</div>
          <h1>FROM A SINGLE IDEA <span>TO AN ENTIRE UNIVERSE</span></h1>
          <p className="hero-description">One idea. Infinite ways to bring it to life.<br />Create images, worlds, games, motion and sound — in one connected studio.</p>
          <div className="hero-buttons">
            <a className="button-primary" href="#worlds">EXPLORE THE UNIVERSE <span>↗</span></a>
            <a className="button-secondary" href="#founders">GET EARLY ACCESS</a>
          </div>
          <div className="hero-proof"><span className="proof-line" /> ONE STUDIO. MULTIPLE WORLDS. YOUR IMAGINATION.</div>
        </div>

        <div
          className="hero-orbit"
          style={{ width: "100%", height: "620px" }}
          aria-label="Animated three-dimensional cinematic planet and SINA AI core"
        >
          <HeroScene progress={progress} />
        </div>
        <div className="hero-bottomline"><span>01 / THE BEGINNING</span><span>SCROLL TO EXPLORE <b>↓</b></span><span>BUILT FOR WHAT'S NEXT</span></div>
      </section>

      <section className="intro-section" id="creation">
        <div className="section-kicker">THE UNIVERSE IS YOUR CANVAS <span>— 001</span></div>
        <div className="intro-layout">
          <h2>WE DON’T JUST<br /><em>MAKE TOOLS.</em><br />WE BUILD WORLDS.</h2>
          <div className="intro-copy">
            <p>SINA STUDIO AI is a connected creative universe for turning an idea into digital experiences — from the first image to an entire game world.</p>
            <div className="capability-list"><span>01 / IMAGINE</span><span>02 / GENERATE</span><span>03 / BUILD</span><span>04 / SHARE</span></div>
          </div>
        </div>
      </section>

      <section className="worlds-section" id="worlds">
        <div className="section-heading-row">
          <div><div className="section-kicker">SIX WORLDS. ONE UNIVERSE <span>— 002</span></div><h2>CHOOSE YOUR <em>DIMENSION.</em></h2></div>
          <p>Different creative paths.<br />One place to bring them together.</p>
        </div>
        <div className="worlds-grid" style={{ opacity: worldsVisible, transform: `translateY(${(1 - worldsVisible) * 32}px)`, pointerEvents: worldsVisible > 0.98 ? "auto" : "none" }}>
          {worlds.map((world) => (
            <article className={`world-card ${world.className}`} key={world.number}>
              <div className="world-card-top"><span>{world.number} / WORLD</span><span className="world-tag">{world.tag} ↗</span></div>
              <div className="world-art" aria-hidden="true"><div className="world-art-orb" /><div className="world-art-ring" /><div className="world-art-spark" /></div>
              <div className="world-card-copy"><h3>{world.title}</h3><p>{world.detail}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="creation-section">
        <div className="creation-visual" aria-hidden="true">
          <div className="reactor-ring reactor-ring-a" /><div className="reactor-ring reactor-ring-b" />
          <div className="reactor-core"><span>S</span></div>
          <div className="reactor-label reactor-label-a">PROMPT RECEIVED</div><div className="reactor-label reactor-label-b">WORLD GENERATION 68%</div>
          <div className="reactor-beam" />
        </div>
        <div className="creation-copy">
          <div className="section-kicker">FROM PROMPT TO POSSIBILITY <span>— 003</span></div>
          <h2>YOUR IDEA IS<br />THE <em>STARTING POINT.</em></h2>
          <p>Start with a thought. Shape it with AI. Build across creative mediums without losing the thread that connects them.</p>
          <div className="creation-steps"><div><b>01</b><span><strong>Describe your vision</strong><small>Start with words, references or a spark.</small></span></div><div><b>02</b><span><strong>Make it real</strong><small>Explore visual, audio and interactive outputs.</small></span></div><div><b>03</b><span><strong>Take it further</strong><small>Refine, connect and share your creation.</small></span></div></div>
        </div>
      </section>

      <section className="founders-section" id="founders">
        <div className="founders-stars" aria-hidden="true" />
        <div className="section-kicker">BE THERE AT THE BEGINNING <span>— 004</span></div>
        <div className="founders-content">
          <div><div className="founder-badge"><span className="status-dot" /> FOUNDING ACCESS</div><h2>THE NEXT UNIVERSE<br />IS <em>UNDER CONSTRUCTION.</em></h2><p>Join the early-access list and follow the evolution of SINA STUDIO AI as the universe comes online.</p></div>
          <div className="founders-card"><span className="founders-card-label">SINA STUDIO AI / ACCESS</span><div className="founders-card-symbol">S<span>✳</span></div><h3>GET IN EARLY.</h3><p>Be part of the first wave of creators.</p><Link to="/login" className="button-primary full-button">REQUEST EARLY ACCESS <span>↗</span></Link><small>Early access availability and pricing will be announced.</small></div>
        </div>
      </section>

      <footer className="universe-footer"><a className="brand-lockup" href="#top"><span className="brand-mark">S</span><span className="brand-name">SINA <b>STUDIO</b><small>ARTIFICIAL INTELLIGENCE</small></span></a><p>WE DON’T BUILD PRODUCTS. WE BUILD WORLDS.</p><a href="#top" className="back-top">BACK TO ORBIT ↑</a><span className="footer-copyright">© SINA STUDIO AI</span></footer>
    </main>
  );
};

export default UniverseLanding;
