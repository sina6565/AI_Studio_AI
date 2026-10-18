import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './UniverseLanding.css';

const worlds = [
  { number: '01', title: 'AI STUDIO', faTitle: 'استودیوی هوش مصنوعی', detail: 'Images, ideas and intelligent creation.', faDetail: 'تصویر، ایده و خلق هوشمندانه.', className: 'world-cyan', tag: 'CREATE', faTag: 'خلق' },
  { number: '02', title: 'GAMES', faTitle: 'بازی‌ها', detail: 'Characters, scenes and playable worlds.', faDetail: 'شخصیت‌ها، صحنه‌ها و دنیاهای قابل‌بازی.', className: 'world-purple', tag: 'PLAY', faTag: 'بازی' },
  { number: '03', title: 'WEB', faTitle: 'وب', detail: 'Digital products shaped from a prompt.', faDetail: 'محصولات دیجیتال از دل یک ایده.', className: 'world-blue', tag: 'BUILD', faTag: 'ساخت' },
  { number: '04', title: 'MOTION', faTitle: 'موشن', detail: 'Video, animation and moving stories.', faDetail: 'ویدئو، انیمیشن و روایت‌های متحرک.', className: 'world-pink', tag: 'MOVE', faTag: 'حرکت' },
  { number: '05', title: 'AUDIO', faTitle: 'صوت', detail: 'Voice, sound and original music.', faDetail: 'صدا، گویندگی و موسیقی اختصاصی.', className: 'world-gold', tag: 'LISTEN', faTag: 'شنیدن' },
  { number: '06', title: 'MARKETPLACE', faTitle: 'بازارگاه', detail: 'Discover and share digital assets.', faDetail: 'کشف و اشتراک‌گذاری دارایی‌های دیجیتال.', className: 'world-mint', tag: 'DISCOVER', faTag: 'کشف' },
];

const copy = {
  en: {
    navWorlds: 'THE WORLDS', navHow: 'HOW IT WORKS', navFounders: 'FOUNDERS', enter: 'ENTER STUDIO',
    eyebrow: 'A NEW CREATIVE DIMENSION', heroA: 'FROM A SINGLE IDEA', heroB: 'TO AN ENTIRE UNIVERSE',
    heroDescription: 'One idea. Infinite ways to bring it to life. Create images, worlds, games, motion and sound — in one connected studio.',
    explore: 'EXPLORE THE UNIVERSE', early: 'EARLY ACCESS', proof: 'ONE STUDIO. MULTIPLE WORLDS. YOUR IMAGINATION.',
    beginning: '01 / THE BEGINNING', scroll: 'SCROLL TO EXPLORE', future: 'BUILT FOR WHAT’S NEXT',
    introKicker: 'THE UNIVERSE IS YOUR CANVAS', introA: 'WE DON’T JUST', introB: 'MAKE TOOLS.', introC: 'WE BUILD WORLDS.',
    introText: 'SINA STUDIO AI is a connected creative universe for turning an idea into digital experiences — from the first image to an entire game world.',
    steps: ['01 / IMAGINE', '02 / GENERATE', '03 / BUILD', '04 / SHARE'],
    worldsKicker: 'SIX WORLDS. ONE UNIVERSE', worldsTitleA: 'CHOOSE YOUR', worldsTitleB: 'DIMENSION.', worldsDesc: 'Different creative paths. One place to bring them together.',
    creationKicker: 'FROM PROMPT TO POSSIBILITY', creationTitleA: 'YOUR IDEA IS', creationTitleB: 'THE STARTING POINT.',
    creationText: 'Start with a thought. Shape it with AI. Build across creative mediums without losing the thread that connects them.',
    createSteps: [['Describe your vision', 'Start with words, references or a spark.'], ['Make it real', 'Explore visual, audio and interactive outputs.'], ['Take it further', 'Refine, connect and share your creation.']],
    concept: 'CREATIVE CORE / CONCEPT', conceptLabel: 'CREATIVE ENGINE / CONCEPT',
    founderKicker: 'BE THERE AT THE BEGINNING', founderBadge: 'FOUNDING ACCESS',
    founderTitleA: 'THE NEXT UNIVERSE', founderTitleB: 'IS UNDER CONSTRUCTION.',
    founderText: 'Explore the current studio access options and follow the evolution of SINA STUDIO AI as the universe comes together.',
    cardLabel: 'SINA STUDIO AI / ACCESS', cardTitle: 'GET IN EARLY.', cardText: 'Start by entering the studio.', cardButton: 'CONTINUE TO STUDIO',
    cardNote: 'Access options and availability are shown in the studio.',
    footerLine: 'WE DON’T BUILD PRODUCTS. WE BUILD WORLDS.', backTop: 'BACK TO ORBIT',
  },
  fa: {
    navWorlds: 'دنیاها', navHow: 'چطور کار می‌کند', navFounders: 'بنیان‌گذاران', enter: 'ورود به استودیو',
    eyebrow: 'یک بُعد تازه برای خلاقیت', heroA: 'از یک ایده', heroB: 'تا یک جهان کامل',
    heroDescription: 'یک ایده؛ بی‌نهایت راه برای جان‌دادن به آن. تصویر، دنیا، بازی، حرکت و صدا را در یک استودیوی یکپارچه خلق کنید.',
    explore: 'کاوش در جهان', early: 'دسترسی زودهنگام', proof: 'یک استودیو؛ دنیاهای گوناگون؛ تخیل شما.',
    beginning: '۰۱ / آغاز', scroll: 'برای کاوش اسکرول کنید', future: 'برای آینده ساخته شده',
    introKicker: 'جهان، بوم نقاشی شماست', introA: 'ما فقط', introB: 'ابزار نمی‌سازیم؛', introC: 'دنیا می‌سازیم.',
    introText: 'SINA STUDIO AI یک جهان خلاق یکپارچه است؛ برای تبدیل ایده به تجربه‌های دیجیتال، از نخستین تصویر تا یک دنیای کامل بازی.',
    steps: ['۰۱ / تصور', '۰۲ / تولید', '۰۳ / ساخت', '۰۴ / اشتراک'],
    worldsKicker: 'شش دنیا؛ یک جهان', worldsTitleA: 'بُعد خود را', worldsTitleB: 'انتخاب کنید.',
    worldsDesc: 'مسیرهای متفاوت خلاقیت؛ در یک فضای مشترک.',
    creationKicker: 'از پرامپت تا امکان', creationTitleA: 'ایده شما', creationTitleB: 'نقطه شروع است.',
    creationText: 'با یک فکر آغاز کنید و با کمک هوش مصنوعی به آن شکل بدهید. در رسانه‌های گوناگون بسازید و پیوند میان ایده‌ها را حفظ کنید.',
    createSteps: [['چشم‌اندازتان را توصیف کنید', 'با کلمات، نمونه‌ها یا یک جرقه شروع کنید.'], ['ایده را واقعی کنید', 'خروجی‌های تصویری، صوتی و تعاملی را بررسی کنید.'], ['یک قدم فراتر بروید', 'اثر خود را اصلاح، ترکیب و به اشتراک بگذارید.']],
    concept: 'هسته خلاقیت / طرح مفهومی', conceptLabel: 'موتور خلاقیت / طرح مفهومی',
    founderKicker: 'از آغاز همراه باشید', founderBadge: 'دسترسی بنیان‌گذاران',
    founderTitleA: 'جهان بعدی', founderTitleB: 'در حال ساخته‌شدن است.',
    founderText: 'گزینه‌های فعلی ورود به استودیو را بررسی کنید و مسیر تکامل SINA STUDIO AI را دنبال کنید.',
    cardLabel: 'SINA STUDIO AI / دسترسی', cardTitle: 'از ابتدا همراه شوید.', cardText: 'برای شروع وارد استودیو شوید.', cardButton: 'ادامه به استودیو',
    cardNote: 'گزینه‌ها و وضعیت دسترسی در خود استودیو نمایش داده می‌شود.',
    footerLine: 'ما محصول نمی‌سازیم؛ دنیا می‌سازیم.', backTop: 'بازگشت به مدار',
  },
};

const UniverseLanding: React.FC = () => {
  const { i18n } = useTranslation();
  const isPersian = i18n.language.toLowerCase().startsWith('fa');
  const t = isPersian ? copy.fa : copy.en;

  const toggleLanguage = () => {
    const next = isPersian ? 'en' : 'fa';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr';
  };

  return (
    <main className={`universe-landing ${isPersian ? 'is-persian' : ''}`} dir={isPersian ? 'rtl' : 'ltr'}>
      <header className="universe-nav">
        <a className="brand-lockup" href="#top" aria-label="Sina Studio AI home">
          <span className="brand-mark">S</span>
          <span className="brand-name">SINA <b>STUDIO</b><small>ARTIFICIAL INTELLIGENCE</small></span>
        </a>
        <nav className="desktop-nav" aria-label={isPersian ? 'پیمایش اصلی' : 'Main navigation'}>
          <a href="#worlds">{t.navWorlds}</a><a href="#creation">{t.navHow}</a><a href="#founders">{t.navFounders}</a>
        </nav>
        <div className="nav-actions">
          <button className="language-toggle" type="button" onClick={toggleLanguage} aria-label={isPersian ? 'Switch to English' : 'تغییر زبان به فارسی'}>{isPersian ? 'EN' : 'FA'} <span>↗</span></button>
          <Link className="nav-cta" to="/login">{t.enter} <span>↗</span></Link>
        </div>
      </header>

      <section className="universe-hero" id="top">
        <div className="hero-grid" aria-hidden="true" /><div className="hero-nebula nebula-violet" aria-hidden="true" /><div className="hero-nebula nebula-cyan" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> {t.eyebrow}</div>
          <h1>{t.heroA}<span>{t.heroB}</span></h1>
          <p className="hero-description">{t.heroDescription}</p>
          <div className="hero-buttons"><a className="button-primary" href="#worlds">{t.explore} <span>↗</span></a><a className="button-secondary" href="#founders">{t.early}</a></div>
          <div className="hero-proof"><span className="proof-line" /> {t.proof}</div>
        </div>

        <div className="hero-orbit" role="img" aria-label={isPersian ? 'تصویر مفهومی سیاره و هسته خلاقیت' : 'Concept illustration of a planet and creative core'}>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><div className="planet-halo" />
          <div className="hero-planet"><div className="planet-shade" /><div className="planet-continent continent-one" /><div className="planet-continent continent-two" /><div className="planet-atmosphere" /></div>
          <div className="energy-ring" /><div className="core-logo"><span>S</span><i>AI CORE</i></div>
          <div className="orbit-label label-top"><span /> {t.concept}</div><div className="orbit-label label-bottom">{t.conceptLabel}</div>
          <span className="floating-particle particle-one" /><span className="floating-particle particle-two" /><span className="floating-particle particle-three" />
        </div>
        <div className="hero-bottomline"><span>{t.beginning}</span><span>{t.scroll} <b>↓</b></span><span>{t.future}</span></div>
      </section>

      <section className="intro-section" id="creation">
        <div className="section-kicker">{t.introKicker} <span>— 001</span></div>
        <div className="intro-layout"><h2>{t.introA}<br /><em>{t.introB}</em><br />{t.introC}</h2>
          <div className="intro-copy"><p>{t.introText}</p><div className="capability-list">{t.steps.map(step => <span key={step}>{step}</span>)}</div></div>
        </div>
      </section>

      <section className="worlds-section" id="worlds">
        <div className="section-heading-row"><div><div className="section-kicker">{t.worldsKicker} <span>— 002</span></div><h2>{t.worldsTitleA} <em>{t.worldsTitleB}</em></h2></div><p>{t.worldsDesc}</p></div>
        <div className="worlds-grid">{worlds.map(world => <article className={`world-card ${world.className}`} key={world.number}>
          <div className="world-card-top"><span>{world.number} / {isPersian ? 'دنیا' : 'WORLD'}</span><span className="world-tag">{isPersian ? world.faTag : world.tag} ↗</span></div>
          <div className="world-art" aria-hidden="true"><div className="world-art-orb" /><div className="world-art-ring" /><div className="world-art-spark" /></div>
          <div className="world-card-copy"><h3>{isPersian ? world.faTitle : world.title}</h3><p>{isPersian ? world.faDetail : world.detail}</p></div>
        </article>)}</div>
      </section>

      <section className="creation-section">
        <div className="creation-visual" role="img" aria-label={isPersian ? 'تصویر مفهومی هسته خلاقیت دیجیتال' : 'Concept illustration of a digital creative core'}>
          <div className="reactor-ring reactor-ring-a" /><div className="reactor-ring reactor-ring-b" /><div className="reactor-core"><span>S</span></div>
          <div className="reactor-label reactor-label-a">{isPersian ? 'ایده دریافت شد' : 'IDEA / CONCEPT'}</div><div className="reactor-label reactor-label-b">{isPersian ? 'تصویرسازی مفهومی' : 'CREATIVE ENGINE / CONCEPT'}</div><div className="reactor-beam" />
        </div>
        <div className="creation-copy"><div className="section-kicker">{t.creationKicker} <span>— 003</span></div><h2>{t.creationTitleA}<br /><em>{t.creationTitleB}</em></h2><p>{t.creationText}</p>
          <div className="creation-steps">{t.createSteps.map((step, index) => <div key={step[0]}><b>{String(index + 1).padStart(2, '0')}</b><span><strong>{step[0]}</strong><small>{step[1]}</small></span></div>)}</div>
        </div>
      </section>

      <section className="founders-section" id="founders">
        <div className="founders-stars" aria-hidden="true" /><div className="section-kicker">{t.founderKicker} <span>— 004</span></div>
        <div className="founders-content"><div><div className="founder-badge"><span className="status-dot" /> {t.founderBadge}</div><h2>{t.founderTitleA}<br /><em>{t.founderTitleB}</em></h2><p>{t.founderText}</p></div>
          <div className="founders-card"><span className="founders-card-label">{t.cardLabel}</span><div className="founders-card-symbol">S<span>✳</span></div><h3>{t.cardTitle}</h3><p>{t.cardText}</p><Link to="/login" className="button-primary full-button">{t.cardButton} <span>↗</span></Link><small>{t.cardNote}</small></div>
        </div>
      </section>

      <footer className="universe-footer"><a className="brand-lockup" href="#top"><span className="brand-mark">S</span><span className="brand-name">SINA <b>STUDIO</b><small>ARTIFICIAL INTELLIGENCE</small></span></a><p>{t.footerLine}</p><a href="#top" className="back-top">{t.backTop} ↑</a><span className="footer-copyright">© SINA STUDIO AI</span></footer>
    </main>
  );
};

export default UniverseLanding;
