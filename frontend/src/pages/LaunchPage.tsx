import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import './LaunchPage.css';

type Copy = {
  nav: { product: string; capabilities: string; roadmap: string; enter: string };
  eyebrow: string; title: string; subtitle: string; primary: string; secondary: string;
  proof: string; currentTitle: string; currentIntro: string; available: string;
  conditional: string; roadmapTitle: string; roadmapIntro: string; research: string;
  principlesTitle: string; principles: string[]; ctaTitle: string; ctaText: string;
  footer: string; items: { title: string; body: string; status: string; kind: 'ready' | 'conditional' | 'roadmap' }[];
  future: { title: string; body: string }[];
};

const copy: Record<'en' | 'fa', Copy> = {
  en: {
    nav: { product: 'Product', capabilities: 'Capabilities', roadmap: 'Roadmap', enter: 'Open SINA' },
    eyebrow: 'OFFICIAL PRODUCT SHOWCASE',
    title: 'FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE.',
    subtitle: 'SINA AI STUDIO brings creative workflows into one workspace — from media and web experiences to game concepts and 3D room design.',
    primary: 'Explore the studio', secondary: 'See what is available',
    proof: 'A working product with clearly marked boundaries — not a promise that every research idea is already live.',
    currentTitle: 'What you can use today',
    currentIntro: 'These capabilities have an implemented workflow in the current repository. Some generation paths still depend on provider credentials or an owner-operated worker.',
    available: 'IMPLEMENTED',
    conditional: 'CONFIGURATION-DEPENDENT',
    roadmapTitle: 'What comes next',
    roadmapIntro: 'The roadmap is shown separately from current product functionality. These items are not presented as released features.',
    research: 'RESEARCH & ROADMAP',
    principlesTitle: 'Built around control, not lock-in',
    principles: [
      'One SINA-owned orchestration layer coordinates requests and jobs.',
      'Provider adapters stay replaceable; optional cloud services are not mandatory.',
      'Generated websites can be previewed, edited and downloaded as standalone HTML.',
      'Native 3D output is clearly separated from browser previews and unverified engine runs.',
    ],
    ctaTitle: 'Your next idea starts here.',
    ctaText: 'Open the current SINA workspace and explore the implemented creation flows.',
    footer: 'SINA AI STUDIO · Official launch showcase',
    items: [
      { title: 'AI Creation Studio', body: 'Submit image, video, audio and speech jobs through the existing Studio workflow. Actual generation depends on a compatible provider being configured and healthy.', status: 'Provider-dependent', kind: 'conditional' },
      { title: 'Website Builder', body: 'Create a responsive standalone HTML website from your content, preview it in an isolated frame, edit its source and download the result. AI-written copy and hosted publishing are not included yet.', status: 'Implemented', kind: 'ready' },
      { title: 'Game Concepts & Scene Viewer', body: 'Create a game brief, scene manifest and provider-generated scene artwork, then inspect or download a standalone visual scene viewer. This is not a playable game runtime.', status: 'Implemented workflow', kind: 'ready' },
      { title: '3D Game Lab · Unreal Engine 5', body: 'Configure a procedural room, inspect the browser concept and playtest prototype, then request a UE5 source-project handoff. A real Blender/UE5 worker and engine runtime must be configured; packaged gameplay is not verified.', status: 'Worker-dependent', kind: 'conditional' },
      { title: 'Projects & Job Tracking', body: 'Keep creation projects and asynchronous job status in the existing application workflow, subject to the configured backend and storage services.', status: 'Implemented', kind: 'ready' },
    ],
    future: [
      { title: 'Computer Use & Desktop Agents', body: 'Researching agents that can understand screens, plan actions and operate browser or desktop software under user approval.' },
      { title: 'SINA AI POOL NETWORK', body: 'A proposed shared network for compatible compute, models, APIs, tools and agent capabilities. It is a separate research/implementation track, not a live marketplace.' },
      { title: 'SINA NEXUS · R&D', body: 'An isolated research program for evaluating emerging models, 3D workflows, agent systems and hybrid infrastructure before approved integration.' },
      { title: 'Expanded 2D/3D Game Creation', body: 'The longer-term direction includes richer gameplay logic, characters, animation, engine validation and export workflows. These are not implied by the current room or scene previews.' },
    ],
  },
  fa: {
    nav: { product: 'محصول', capabilities: 'قابلیت‌ها', roadmap: 'نقشه راه', enter: 'ورود به سینا' },
    eyebrow: 'صفحه رسمی معرفی محصول',
    title: 'از یک ایده تا یک جهان کامل.',
    subtitle: 'SINA AI STUDIO مسیرهای آفرینش دیجیتال را در یک فضای کاری گرد هم می‌آورد؛ از رسانه و وب‌سایت تا کانسپت بازی و طراحی اتاق سه‌بعدی.',
    primary: 'ورود به استودیو', secondary: 'مشاهده قابلیت‌ها',
    proof: 'یک محصول در حال توسعه با مرزبندی شفاف؛ نه وعده‌ای مبنی بر فعال بودن تمام ایده‌های تحقیقاتی.',
    currentTitle: 'اکنون چه چیزهایی در محصول وجود دارد؟',
    currentIntro: 'موارد زیر دارای گردش‌کار پیاده‌سازی‌شده در مخزن فعلی هستند. بعضی مسیرهای تولید به ارائه‌دهنده دارای اعتبارنامه یا Worker تحت مدیریت مالک وابسته‌اند.',
    available: 'پیاده‌سازی‌شده',
    conditional: 'وابسته به پیکربندی',
    roadmapTitle: 'مسیر توسعه بعدی',
    roadmapIntro: 'قابلیت‌های آینده جدا از امکانات فعلی نمایش داده شده‌اند و به‌عنوان امکانات منتشرشده معرفی نمی‌شوند.',
    research: 'تحقیق و نقشه راه',
    principlesTitle: 'معماری مستقل و تحت کنترل SINA',
    principles: [
      'لایه هماهنگ‌سازی و مدیریت وظایف تحت مالکیت خود SINA باقی می‌ماند.',
      'اتصال‌دهنده ارائه‌دهندگان قابل‌جایگزینی است و سرویس ابری پولی اجباری نیست.',
      'وب‌سایت ساخته‌شده را می‌توان پیش‌نمایش، ویرایش و به‌صورت HTML مستقل دریافت کرد.',
      'خروجی بومی موتور سه‌بعدی از پیش‌نمایش مرورگر و اجرای تأییدنشده موتور جدا نگه داشته می‌شود.',
    ],
    ctaTitle: 'ایده بعدی تو از اینجا شروع می‌شود.',
    ctaText: 'وارد فضای کاری فعلی SINA شو و مسیرهای آفرینش پیاده‌سازی‌شده را بررسی کن.',
    footer: 'SINA AI STUDIO · صفحه رسمی رونمایی',
    items: [
      { title: 'استودیوی آفرینش هوش مصنوعی', body: 'ثبت درخواست‌های تصویر، ویدیو، صوت و گفتار از مسیر موجود Studio. تولید واقعی به پیکربندی و سلامت ارائه‌دهنده سازگار وابسته است.', status: 'وابسته به ارائه‌دهنده', kind: 'conditional' },
      { title: 'سازنده وب‌سایت', body: 'ساخت وب‌سایت HTML واکنش‌گرا بر اساس محتوای کاربر، پیش‌نمایش ایزوله، ویرایش کد و دریافت فایل مستقل. تولید متن با AI و انتشار میزبانی‌شده هنوز فعال نیست.', status: 'پیاده‌سازی‌شده', kind: 'ready' },
      { title: 'کانسپت بازی و نمایشگر صحنه', body: 'تعریف بازی، ساخت مانیفست صحنه و دریافت تصویر صحنه از ارائه‌دهنده، سپس مشاهده یا دانلود نمایشگر بصری مستقل. این مسیر موتور بازی قابل‌بازی نیست.', status: 'گردش‌کار پیاده‌سازی‌شده', kind: 'ready' },
      { title: 'آزمایشگاه بازی سه‌بعدی · Unreal Engine 5', body: 'تنظیم اتاق رویه‌ای، مشاهده کانسپت مرورگر و نمونه آزمایشی قابل‌بازی، سپس درخواست تحویل پروژه منبع UE5. اجرای واقعی به Worker پیکربندی‌شده Blender/UE5 نیاز دارد و خروجی نهایی بازی تأیید نشده است.', status: 'وابسته به Worker', kind: 'conditional' },
      { title: 'پروژه‌ها و پیگیری وظایف', body: 'مدیریت پروژه‌های آفرینش و وضعیت کارهای غیرهم‌زمان در گردش‌کار فعلی، با وابستگی به سرویس‌های Backend و ذخیره‌سازی پیکربندی‌شده.', status: 'پیاده‌سازی‌شده', kind: 'ready' },
    ],
    future: [
      { title: 'Computer Use و دستیارهای دسکتاپ', body: 'تحقیق روی عامل‌هایی که صفحه را درک کنند، اقدام برنامه‌ریزی کنند و با تأیید کاربر در مرورگر یا نرم‌افزار دسکتاپ کار کنند.' },
      { title: 'SINA AI POOL NETWORK', body: 'طرح یک شبکه مشترک برای اتصال توان پردازشی، مدل‌ها، APIها، ابزارها و قابلیت‌های عامل‌ها؛ این بخش هنوز بازارگاه فعال نیست.' },
      { title: 'SINA NEXUS · تحقیق و توسعه', body: 'برنامه تحقیقاتی مستقل برای ارزیابی مدل‌های نو، گردش‌کارهای سه‌بعدی، عامل‌ها و زیرساخت ترکیبی پیش از انتقال تأییدشده به محصول.' },
      { title: 'گسترش ساخت بازی دوبعدی و سه‌بعدی', body: 'چشم‌انداز بلندمدت شامل منطق کامل بازی، کاراکتر، انیمیشن، اعتبارسنجی موتور و خروجی قابل انتشار است؛ این موارد از پیش‌نمایش فعلی صحنه یا اتاق نتیجه نمی‌شوند.' },
    ],
  },
};

const LaunchPage: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isPersian = i18n.language.startsWith('fa');
  const t = copy[isPersian ? 'fa' : 'en'];

  const switchLanguage = () => {
    const next = isPersian ? 'en' : 'fa';
    void i18n.changeLanguage(next);
    localStorage.setItem('language', next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr';
  };

  const openStudio = () => {
    const destination = '/dashboard';
    navigate(apiClient.getToken() ? destination : `/login?redirect=${encodeURIComponent(destination)}`);
  };

  return (
    <main className={`sina-launch ${isPersian ? 'is-fa' : 'is-en'}`} dir={isPersian ? 'rtl' : 'ltr'}>
      <div className="launch-ambient" aria-hidden="true"><span /><span /><span /></div>
      <header className="launch-nav">
        <Link className="launch-brand" to="/" aria-label="SINA AI STUDIO home">
          <span className="launch-mark">S</span>
          <span>SINA <b>AI STUDIO</b><small>FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE</small></span>
        </Link>
        <nav aria-label={isPersian ? 'ناوبری اصلی' : 'Main navigation'}>
          <a href="#product">{t.nav.product}</a>
          <a href="#capabilities">{t.nav.capabilities}</a>
          <a href="#roadmap">{t.nav.roadmap}</a>
        </nav>
        <div className="launch-nav-actions">
          <button className="launch-lang" type="button" onClick={switchLanguage}>{isPersian ? 'EN' : 'فا'}</button>
          <button className="launch-nav-cta" type="button" onClick={openStudio}>{t.nav.enter}</button>
        </div>
      </header>

      <section className="launch-hero" id="product">
        <div className="launch-hero-copy">
          <div className="launch-eyebrow"><i />{t.eyebrow}</div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
          <div className="launch-hero-actions">
            <button type="button" className="launch-primary" onClick={openStudio}>{t.primary}<span>↗</span></button>
            <a className="launch-secondary" href="#capabilities">{t.secondary}<span>↓</span></a>
          </div>
          <div className="launch-proof"><span>✦</span>{t.proof}</div>
        </div>
        <div className="launch-visual" aria-label="SINA AI STUDIO digital universe illustration">
          <div className="launch-orbit orbit-one" /><div className="launch-orbit orbit-two" />
          <div className="launch-core"><span>SINA</span><b>AI STUDIO</b><i>✦</i></div>
          <div className="launch-node node-one">IMAGE</div><div className="launch-node node-two">WEB</div>
          <div className="launch-node node-three">3D</div><div className="launch-node node-four">AUDIO</div>
          <div className="launch-glass-card"><small>CREATIVE WORKSPACE</small><strong>ONE IDEA.<br />MANY WORLDS.</strong><span><i /> ORCHESTRATED BY SINA</span></div>
        </div>
      </section>

      <section className="launch-section launch-capabilities" id="capabilities">
        <div className="launch-section-head">
          <span className="launch-section-kicker">01 / PRODUCT CAPABILITIES</span>
          <h2>{t.currentTitle}</h2><p>{t.currentIntro}</p>
        </div>
        <div className="launch-cap-grid">
          {t.items.map((item, index) => (
            <article className={`launch-cap-card ${item.kind}`} key={item.title}>
              <div className="launch-cap-top"><span>0{index + 1}</span><em>{item.kind === 'ready' ? t.available : t.conditional}</em></div>
              <h3>{item.title}</h3><p>{item.body}</p>
              <div className="launch-cap-status"><i />{item.status}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="launch-principles">
        <div><span className="launch-section-kicker">02 / PLATFORM PRINCIPLES</span><h2>{t.principlesTitle}</h2></div>
        <ul>{t.principles.map((principle) => <li key={principle}><span>✓</span>{principle}</li>)}</ul>
      </section>

      <section className="launch-section launch-roadmap" id="roadmap">
        <div className="launch-section-head">
          <span className="launch-section-kicker">03 / BEYOND TODAY</span>
          <h2>{t.roadmapTitle}</h2><p>{t.roadmapIntro}</p>
        </div>
        <div className="launch-roadmap-grid">
          {t.future.map((item, index) => (
            <article className="launch-roadmap-card" key={item.title}>
              <span>R&D · 0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p>
              <em>{t.research}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="launch-final">
        <div className="launch-final-ring" aria-hidden="true" />
        <span className="launch-section-kicker">SINA AI STUDIO</span>
        <h2>{t.ctaTitle}</h2><p>{t.ctaText}</p>
        <button type="button" className="launch-primary" onClick={openStudio}>{t.nav.enter}<span>↗</span></button>
      </section>
      <footer className="launch-footer"><span>SINA <b>AI STUDIO</b></span><span>{t.footer} · © {new Date().getFullYear()}</span><a href="#product">{isPersian ? 'بازگشت به بالا ↑' : 'Back to top ↑'}</a></footer>
    </main>
  );
};

export default LaunchPage;
