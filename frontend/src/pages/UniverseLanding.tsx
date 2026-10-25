import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import WebIcon from '@mui/icons-material/Web';
import MovieCreationIcon from '@mui/icons-material/MovieCreation';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PersonIcon from '@mui/icons-material/Person';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import LanguageIcon from '@mui/icons-material/Language';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import GroupsIcon from '@mui/icons-material/Groups';
import BoltIcon from '@mui/icons-material/Bolt';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import './UniverseLanding.css';
import apiClient from '../services/api';
import { INTRO, WORLD_COLORS } from '../components/universe/introTimeline';
import { useUniverseStore } from '../components/universe/universeStore';

const HeroScene = React.lazy(() => import('@/components/universe/HeroScene'));

const INTRO_SEEN_KEY = 'sina-universe-intro';

/* The six worlds, in the same birth order as the 3D orbs. */
const WORLDS = [
  { key: 'games', icon: SportsEsportsIcon, studioType: 'game', examplePrompt: 'An epic adventure game world of floating islands, ancient ruins and a hero with a glowing blade' },
  { key: 'websites', icon: WebIcon, studioType: 'image', examplePrompt: 'A sleek futuristic portfolio website with neon glass interface for a digital artist' },
  { key: 'videos', icon: MovieCreationIcon, studioType: 'video', examplePrompt: 'A cinematic sci-fi trailer of a colossal mechanical citadel city at dusk' },
  { key: 'audio', icon: MusicNoteIcon, studioType: 'audio', examplePrompt: 'An epic orchestral-electronic soundtrack for a space adventure film trailer' },
  { key: 'characters', icon: PersonIcon, studioType: 'image', examplePrompt: 'A heroic cyborg explorer character with chrome armor and a glowing blue core, AAA game concept art' },
  { key: 'assets3d', icon: ViewInArIcon, studioType: 'image', examplePrompt: 'A futuristic 3D floating city asset with neon energy rings, game-ready environment' },
] as const;

const FEATURED = [
  { key: 'game', img: '/assets/featured-game.jpg' },
  { key: 'web', img: '/assets/featured-web.jpg' },
  { key: 'scifi', img: '/assets/featured-scifi.jpg' },
] as const;

const ADS = [
  { key: 'neon', img: '/assets/ad-neon-drive.jpg', credits: 5 },
  { key: 'gold', img: '/assets/ad-gold-essence.jpg', credits: 5 },
  { key: 'orbit', img: '/assets/ad-orbit.jpg', credits: 10 },
  { key: 'velocity', img: '/assets/ad-velocity.jpg', credits: 5 },
] as const;

const TIERS = ['explorer', 'creator', 'studio'] as const;
const WORKFLOW = ['idea', 'prompt', 'generate', 'universe'] as const;

const UniverseLanding: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isPersian = i18n.language.startsWith('fa');

  const begin = useUniverseStore((s) => s.begin);
  const skip = useUniverseStore((s) => s.skip);
  const introDone = useUniverseStore((s) => s.introDone);
  const setScrollProgress = useUniverseStore((s) => s.setScrollProgress);
  const activeWorld = useUniverseStore((s) => s.activeWorld);
  const setActiveWorld = useUniverseStore((s) => s.setActiveWorld);

  const [phase, setPhase] = useState<'intro' | 'logo' | 'ready'>('intro');
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [prompt, setPrompt] = useState('');
  const promptRef = useRef<HTMLInputElement>(null);

  const [activeAd, setActiveAd] = useState<number | null>(null);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [earnedAds, setEarnedAds] = useState<ReadonlySet<string>>(new Set());


  /* ---- Intro orchestration: HTML beats locked to the WebGL timeline ---- */
  useEffect(() => {
    const seen = sessionStorage.getItem(INTRO_SEEN_KEY) === 'seen';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const instant = seen || reduced;
    begin(instant);
    if (instant) {
      setPhase('ready');
      return;
    }
    const logoTimer = window.setTimeout(() => setPhase('logo'), INTRO.logoStart * 1000);
    const readyTimer = window.setTimeout(() => setPhase('ready'), (INTRO.total + 0.25) * 1000);
    return () => {
      window.clearTimeout(logoTimer);
      window.clearTimeout(readyTimer);
    };
  }, [begin]);

  useEffect(() => {
    if (introDone) {
      sessionStorage.setItem(INTRO_SEEN_KEY, 'seen');
      setPhase('ready');
    }
  }, [introDone]);

  /* ---- Scroll: drive the 3D parallax + nav state ---- */
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = Math.max(1, doc.scrollHeight - window.innerHeight);
        setScrollProgress(Math.min(1, Math.max(0, window.scrollY / max)));
        setNavScrolled(window.scrollY > 40);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [setScrollProgress]);

  /* ---- Scroll-reveal for section content ---- */
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.universe-landing .reveal'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('inview'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('inview');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* ---- Ads theater playback simulation ---- */
  useEffect(() => {
    if (activeAd === null || !adPlaying) return;
    const id = window.setInterval(() => {
      setAdProgress((p) => Math.min(100, p + 1.25));
    }, 100);
    return () => window.clearInterval(id);
  }, [activeAd, adPlaying]);

  useEffect(() => {
    if (activeAd !== null && adProgress >= 100) {
      setAdPlaying(false);
      setEarnedAds((prev) => new Set(prev).add(ADS[activeAd].key));
    }
  }, [adProgress, activeAd]);

  useEffect(() => {
    if (activeAd === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveAd(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [activeAd]);

  /* ---- Helpers ---- */
  const toggleLanguage = () => {
    const next = isPersian ? 'en' : 'fa';
    void i18n.changeLanguage(next);
    localStorage.setItem('language', next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr';
  };

  const scrollToId = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const focusPrompt = () => {
    scrollToId('top');
    window.setTimeout(() => promptRef.current?.focus(), 650);
  };

  const goCreate = (promptText: string, type?: string) => {
    const params = new URLSearchParams();
    if (promptText.trim()) params.set('prompt', promptText.trim());
    if (type) params.set('type', type);
    const qs = params.toString();
    const dest = `/studio${qs ? `?${qs}` : ''}`;
    navigate(apiClient.getToken() ? dest : `/login?redirect=${encodeURIComponent(dest)}`);
  };

  const enterStudio = () =>
    navigate(apiClient.getToken() ? '/dashboard' : '/login?redirect=%2Fdashboard');

  const selectWorld = (index: number) => {
    setActiveWorld(index);
    scrollToId('worlds');
  };

  const openAd = (index: number) => {
    setActiveAd(index);
    setAdProgress(0);
    setAdPlaying(true);
  };

  // Use verifiable beta facts instead of fabricated user, asset, or generation counts.
  const stats = [
    { icon: GroupsIcon, value: isPersian ? 'بتا' : 'BETA', label: isPersian ? 'نسخهٔ آزمایشی دعوتی' : 'Invite-led testing' },
    { icon: ViewInArIcon, value: '6', label: isPersian ? 'جهان خلاق' : 'Creative worlds' },
    { icon: BoltIcon, value: isPersian ? 'بازخورد' : 'FEEDBACK', label: isPersian ? 'بهبود با کمک کاربران' : 'Shaped by testers' },
  ];

  const tierFeatures = (tier: string): string[] => {
    const v = t(`landing.preorder.tiers.${tier}.features`, { returnObjects: true });
    return Array.isArray(v) ? (v as string[]) : [];
  };

  return (
    <main className={`universe-landing phase-${phase} ${isPersian ? 'is-persian' : ''}`}>
      {/* Persistent cinematic universe */}
      <div className="scene-layer" aria-hidden="true">
        <Suspense fallback={<div className="hero-scene-fallback" />}>
          <HeroScene onSelectWorld={selectWorld} />
        </Suspense>
        <div className="scene-vignette" />
      </div>

      {phase !== 'ready' && (
        <button type="button" className="skip-intro" onClick={skip}>
          {t('landing.skipIntro')}
        </button>
      )}

      <div className="page-content">
        {/* ---------- Navigation ---------- */}
        <header className={`universe-nav ${navScrolled ? 'scrolled' : ''}`}>
          <div className="nav-inner">
            <button type="button" className="brand-lockup" onClick={() => scrollToId('top')} aria-label="SINA STUDIO AI">
              <img className="brand-logo-img" src="/assets/logo-mark-256.png" alt="" style={{ mixBlendMode: 'screen' }} />
              <span className="brand-name">
                SINA STUDIO<small>AI UNIVERSE</small>
              </span>
            </button>
            <nav className="desktop-nav" aria-label="Main">
              <button type="button" onClick={() => scrollToId('worlds')}>{t('landing.nav.worlds')}</button>
              <button type="button" onClick={focusPrompt}>{t('landing.nav.create')}</button>
              <button type="button" onClick={() => scrollToId('featured')}>{t('landing.nav.featured')}</button>
              <button type="button" onClick={() => scrollToId('ads')}>{t('landing.nav.ads')}</button>
              <button type="button" onClick={() => scrollToId('preorder')}>{t('landing.nav.preorder')}</button>
            </nav>
            <div className="nav-actions">
              <button type="button" className="language-toggle" onClick={toggleLanguage} aria-label="Switch language / تغییر زبان">
                <LanguageIcon />
                {isPersian ? 'EN' : 'FA'}
                <KeyboardArrowDownIcon style={{ fontSize: 15, opacity: 0.7 }} />
              </button>
              <button type="button" className="nav-cta" onClick={enterStudio}>
                {t('landing.nav.enterStudio')}
                <ArrowForwardIcon className="flip-rtl" style={{ fontSize: 15 }} />
              </button>
              <button type="button" className="menu-button" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}>
                <MenuIcon />
              </button>
            </div>
          </div>
          <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
            <button type="button" onClick={() => scrollToId('worlds')}>{t('landing.nav.worlds')}</button>
            <button type="button" onClick={focusPrompt}>{t('landing.nav.create')}</button>
            <button type="button" onClick={() => scrollToId('featured')}>{t('landing.nav.featured')}</button>
            <button type="button" onClick={() => scrollToId('ads')}>{t('landing.nav.ads')}</button>
            <button type="button" onClick={() => scrollToId('preorder')}>{t('landing.nav.preorder')}</button>
            <button type="button" onClick={enterStudio}>{t('landing.nav.enterStudio')}</button>
          </div>
        </header>

        {/* ---------- Hero: the newborn universe ---------- */}
        <section className="universe-hero" id="top">
          <div className="hero-stage" aria-hidden="true" />
          <div className="hero-content">
            <div className="hero-titles" style={{ display: 'contents' }}>
              <span className="hero-kicker">
                <span className="status-dot" />
                {t('landing.hero.kicker')}
              </span>
              <h1 className="hero-title" dir="ltr">
                SINA STUDIO <span className="ai-grad">AI</span>
              </h1>
              <div className="hero-slogan1">{t('landing.hero.slogan1')}</div>
              <div className="hero-slogan2">{t('landing.hero.slogan2')}</div>
              <p className="hero-subtitle">{t('landing.hero.subtitle')}</p>
            </div>

            <div className="hero-ui" style={{ display: 'contents' }}>
              <form
                className="prompt-box"
                onSubmit={(e) => {
                  e.preventDefault();
                  goCreate(prompt);
                }}
              >
                <input
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('landing.hero.promptPlaceholder')}
                  aria-label={t('landing.hero.promptPlaceholder')}
                />
                <button type="submit" className="start-btn">
                  <RocketLaunchIcon />
                  {t('landing.hero.startCreating')}
                  <ArrowForwardIcon className="flip-rtl" style={{ fontSize: 17 }} />
                </button>
              </form>

              <div className="hero-actions">
                <Link className="preorder-btn" to="/preorder">
                  <WorkspacePremiumIcon />
                  {t('landing.hero.preorderNow')}
                  <span className="arrow-chip">
                    <ArrowForwardIcon className="flip-rtl" style={{ fontSize: 17 }} />
                  </span>
                </Link>
              </div>

              <div className="hero-tiles" role="list">
                {WORLDS.map((world, i) => {
                  const Icon = world.icon;
                  return (
                    <button
                      key={world.key}
                      type="button"
                      role="listitem"
                      className={`hero-tile ${activeWorld === i ? 'is-active' : ''}`}
                      style={{ '--wc': WORLD_COLORS[i] } as React.CSSProperties}
                      onMouseEnter={() => setActiveWorld(i)}
                      onMouseLeave={() => setActiveWorld(-1)}
                      onClick={() => selectWorld(i)}
                    >
                      <Icon />
                      {t(`landing.worlds.items.${world.key}.name`)}
                    </button>
                  );
                })}
              </div>

              <div className="hero-stats">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div className="hero-stat" key={stat.label}>
                      <Icon />
                      <div>
                        <div className="stat-value" dir="ltr">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="scroll-cue" aria-hidden="true">
            {t('landing.hero.scroll')}
            <KeyboardArrowDownIcon />
          </div>
        </section>

        {/* ---------- Six Worlds ---------- */}
        <section className="landing-section" id="worlds">
          <div className="section-shade" aria-hidden="true" />
          <div className="section-inner">
            <div className="section-header reveal">
              <div className="section-kicker">{t('landing.worlds.kicker')}</div>
              <h2 className="section-title">{t('landing.worlds.title')}</h2>
              <p className="section-subtitle">{t('landing.worlds.subtitle')}</p>
            </div>
            <div className="worlds-grid">
              {WORLDS.map((world, i) => {
                const Icon = world.icon;
                return (
                  <button
                    key={world.key}
                    type="button"
                    className={`world-card reveal ${activeWorld === i ? 'is-active' : ''}`}
                    style={{ '--wc': WORLD_COLORS[i], '--rd': `${i * 0.08}s` } as React.CSSProperties}
                    onMouseEnter={() => setActiveWorld(i)}
                    onMouseLeave={() => setActiveWorld(-1)}
                    onClick={() => goCreate(world.examplePrompt, world.studioType)}
                  >
                    <span className="world-tag">{t(`landing.worlds.items.${world.key}.tag`)}</span>
                    <span className="world-orb">
                      <Icon />
                    </span>
                    <h3 className="world-name">{t(`landing.worlds.items.${world.key}.name`)}</h3>
                    <p className="world-desc">{t(`landing.worlds.items.${world.key}.desc`)}</p>
                    <span className="world-enter">
                      {t('landing.worlds.enter')}
                      <ArrowForwardIcon className="flip-rtl" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- Featured creations ---------- */}
        <section className="landing-section" id="featured">
          <div className="section-shade" aria-hidden="true" />
          <div className="section-inner">
            <div className="section-header reveal">
              <div className="section-kicker">{t('landing.featured.kicker')}</div>
              <h2 className="section-title">{t('landing.featured.title')}</h2>
              <p className="section-subtitle">{t('landing.featured.subtitle')}</p>
            </div>
            <div className="featured-grid">
              {FEATURED.map((item, i) => (
                <article className="featured-card reveal" key={item.key} style={{ '--rd': `${i * 0.1}s` } as React.CSSProperties}>
                  <div className="featured-media">
                    <img src={item.img} alt={t(`landing.featured.items.${item.key}.title`)} loading="lazy" />
                    <div className="featured-title">{t(`landing.featured.items.${item.key}.title`)}</div>
                  </div>
                  <div className="featured-body">
                    <p className="featured-prompt" dir="ltr">{t(`landing.featured.items.${item.key}.prompt`)}</p>
                    <button
                      type="button"
                      className="try-prompt-btn"
                      onClick={() => goCreate(t(`landing.featured.items.${item.key}.prompt`))}
                    >
                      <PlayArrowIcon style={{ fontSize: 16 }} />
                      {t('landing.featured.tryPrompt')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Workflow ---------- */}
        <section className="landing-section" id="create">
          <div className="section-shade" aria-hidden="true" />
          <div className="section-inner">
            <div className="section-header reveal">
              <div className="section-kicker">{t('landing.workflow.kicker')}</div>
              <h2 className="section-title">{t('landing.workflow.title')}</h2>
            </div>
            <div className="workflow-grid">
              {WORKFLOW.map((step, i) => (
                <div className="workflow-step reveal" key={step} style={{ '--rd': `${i * 0.12}s` } as React.CSSProperties}>
                  <div className="workflow-num">{String(i + 1).padStart(2, '0')}</div>
                  <h3>{t(`landing.workflow.steps.${step}.title`)}</h3>
                  <p>{t(`landing.workflow.steps.${step}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Global Ads Theater ---------- */}
        <section className="landing-section" id="ads">
          <div className="section-shade" aria-hidden="true" />
          <div className="section-inner">
            <div className="section-header reveal">
              <div className="section-kicker">{t('landing.ads.kicker')}</div>
              <h2 className="section-title">{t('landing.ads.title')}</h2>
              <p className="section-subtitle">{t('landing.ads.subtitle')}</p>
            </div>
            <div className="ads-grid">
              {ADS.map((ad, i) => (
                <button
                  key={ad.key}
                  type="button"
                  className="ad-card reveal"
                  style={{ '--rd': `${i * 0.08}s` } as React.CSSProperties}
                  onClick={() => openAd(i)}
                  aria-label={`${t('landing.ads.watch')}: ${t(`landing.ads.items.${ad.key}.title`)}`}
                >
                  <span className="ad-media">
                    <img src={ad.img} alt="" loading="lazy" />
                    <span className="ad-reward">
                      <MonetizationOnIcon style={{ fontSize: 14 }} />
                      {earnedAds.has(ad.key) ? <CheckIcon style={{ fontSize: 14 }} /> : t('landing.ads.reward', { count: ad.credits })}
                    </span>
                    <span className="ad-duration">{t(`landing.ads.items.${ad.key}.duration`)}</span>
                    <span className="ad-play">
                      <PlayArrowIcon />
                    </span>
                  </span>
                  <span className="ad-body" style={{ display: 'block' }}>
                    <span className="ad-title" style={{ display: 'block' }}>{t(`landing.ads.items.${ad.key}.title`)}</span>
                    <span className="ad-region" style={{ display: 'block' }}>{t(`landing.ads.items.${ad.key}.region`)}</span>
                    <span className="ad-watch">
                      <PlayArrowIcon style={{ fontSize: 15 }} />
                      {t('landing.ads.watch')}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <p className="ads-note reveal">{t('landing.ads.note')}</p>
          </div>
        </section>

        {/* ---------- Founder pre-order ---------- */}
        <section className="landing-section" id="preorder">
          <div className="section-shade" aria-hidden="true" />
          <div className="section-inner">
            <div className="section-header reveal">
              <div className="section-kicker">{t('landing.preorder.kicker')}</div>
              <h2 className="section-title">{t('landing.preorder.title')}</h2>
              <p className="section-subtitle">{t('landing.preorder.subtitle')}</p>
            </div>
            <div className="tiers-grid">
              {TIERS.map((tier, i) => (
                <div
                  key={tier}
                  className={`tier-card reveal ${tier === 'creator' ? 'is-popular' : ''}`}
                  style={{ '--rd': `${i * 0.1}s` } as React.CSSProperties}
                >
                  {tier === 'creator' && <span className="tier-badge">{t('landing.preorder.mostPopular')}</span>}
                  <div className="tier-name">{t(`landing.preorder.tiers.${tier}.name`)}</div>
                  <div className="tier-tag">{t(`landing.preorder.tiers.${tier}.tag`)}</div>
                  <div className="tier-price">{t(`landing.preorder.tiers.${tier}.price`)}</div>
                  <ul className="tier-features">
                    {tierFeatures(tier).map((feature) => (
                      <li key={feature}>
                        <CheckIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link className="tier-cta" to={`/preorder?plan=${tier}`}>
                    <WorkspacePremiumIcon style={{ fontSize: 18 }} />
                    {t('landing.preorder.reserve')}
                  </Link>
                </div>
              ))}
            </div>
            <p className="preorder-note reveal">{t('landing.preorder.note')}</p>
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <section className="final-cta">
          <div className="reveal">
            <h2>{t('landing.finalCta.title')}</h2>
            <p>{t('landing.finalCta.subtitle')}</p>
            <button type="button" className="final-cta-btn" onClick={focusPrompt}>
              <RocketLaunchIcon />
              {t('landing.finalCta.button')}
            </button>
          </div>
        </section>

        {/* ---------- Footer ---------- */}
        <footer className="universe-footer">
          <div className="footer-inner">
            <div>
              <span className="brand-lockup">
                <img className="brand-logo-img" src="/assets/logo-mark-256.png" alt="" style={{ mixBlendMode: 'screen' }} />
                <span className="brand-name">
                  SINA STUDIO<small>AI UNIVERSE</small>
                </span>
              </span>
              <div className="footer-tagline">{t('landing.footer.tagline')}</div>
            </div>
            <nav className="footer-links" aria-label="Footer">
              <button type="button" onClick={() => scrollToId('worlds')}>{t('landing.footer.about')}</button>
              <button type="button" onClick={() => scrollToId('featured')}>{t('landing.footer.blog')}</button>
              <button type="button" onClick={() => scrollToId('preorder')}>{t('landing.footer.support')}</button>
            </nav>
          </div>
          <div className="footer-bottom">
            <span>{t('landing.footer.rights', { year: new Date().getFullYear() })}</span>
            <span className="footer-creator">{t('landing.footer.creator')}</span>
          </div>
        </footer>
      </div>

      {/* ---------- Ads player modal ---------- */}
      {activeAd !== null && (
        <div className="ad-modal-backdrop" onClick={() => setActiveAd(null)} role="presentation">
          <div
            className="ad-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t(`landing.ads.items.${ADS[activeAd].key}.title`)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`ad-screen ${adPlaying ? 'playing' : ''}`}>
              <img src={ADS[activeAd].img} alt="" />
              <div className="ad-screen-shade" />
              <div className="ad-now-showing">{t('landing.ads.nowShowing')}</div>
              <button
                type="button"
                className="ad-big-play"
                onClick={() => {
                  if (adProgress >= 100) setAdProgress(0);
                  setAdPlaying((p) => !p);
                }}
                aria-label={adPlaying ? 'Pause' : 'Play'}
              >
                {adPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </button>
              <div className="ad-progress">
                <div className="ad-progress-bar" style={{ width: `${adProgress}%` }} />
              </div>
            </div>
            <div className="ad-modal-body">
              <div>
                <div className="ad-modal-title">{t(`landing.ads.items.${ADS[activeAd].key}.title`)}</div>
                <div className="ad-modal-region">{t(`landing.ads.items.${ADS[activeAd].key}.region`)} · {t(`landing.ads.items.${ADS[activeAd].key}.duration`)}</div>
              </div>
              {earnedAds.has(ADS[activeAd].key) && adProgress >= 100 && (
                <span className="ad-earned">
                  <CheckIcon style={{ fontSize: 16 }} />
                  {t('landing.ads.reward', { count: ADS[activeAd].credits })}
                </span>
              )}
              <button type="button" className="ad-close-btn" onClick={() => setActiveAd(null)}>
                <CloseIcon style={{ fontSize: 16 }} />
                {t('landing.ads.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default UniverseLanding;
