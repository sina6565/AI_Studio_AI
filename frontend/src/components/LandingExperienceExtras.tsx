import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LandingExperienceExtras.css';

/**
 * Brand details that complement the WebGL landing page without coupling them
 * to its render loop. The phone preview is intentionally a small HTML scene,
 * so it remains crisp and battery-friendly on desktop.
 */
const LandingExperienceExtras: React.FC = () => {
  const { i18n } = useTranslation();
  const isPersian = i18n.language.startsWith('fa');
  const [showPhone, setShowPhone] = useState(true);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setShowPhone(window.scrollY < window.innerHeight * 0.82);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <>
      <aside className={`mobile-world-preview ${showPhone ? 'is-visible' : ''}`} aria-label={isPersian ? 'پیش‌نمایش نسخه موبایل' : 'Mobile version preview'}>
        <div className="mobile-preview-topline"><span /> SINA AI STUDIO <span className="mobile-preview-menu">···</span></div>
        <div className="mobile-preview-cosmos" aria-hidden="true">
          <span className="mobile-preview-orbit orbit-a" />
          <span className="mobile-preview-orbit orbit-b" />
          <span className="mobile-preview-planet"><img src="/assets/logo-mark-256.png" alt="" /></span>
          <i className="mobile-world-dot dot-a" /><i className="mobile-world-dot dot-b" /><i className="mobile-world-dot dot-c" />
        </div>
        <strong>{isPersian ? 'جهان خلاقیت، در جیب شما' : 'A creative universe in your pocket'}</strong>
        <p>{isPersian ? 'تجربهٔ موبایل SINA AI STUDIO' : 'The SINA AI STUDIO mobile experience'}</p>
        <div className="mobile-preview-worlds" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <Link to="/login" className="mobile-preview-link">{isPersian ? 'ورود به استودیو' : 'OPEN THE STUDIO'} <span>↗</span></Link>
        <span className="mobile-preview-caption">MOBILE EXPERIENCE</span>
      </aside>

      <footer className="brand-legal-footer" dir={isPersian ? 'rtl' : 'ltr'}>
        <div className="brand-legal-inner">
          <div className="brand-footer-identity">
            <img src="/assets/logo-mark-256.png" alt="SINA AI STUDIO" />
            <div><strong>SINA AI STUDIO</strong><span>{isPersian ? 'از یک ایده تا یک جهان کامل' : 'FROM ONE IDEA TO AN ENTIRE UNIVERSE'}</span></div>
          </div>
          <div className="brand-footer-founder">
            <span>{isPersian ? 'بنیان‌گذار' : 'FOUNDER'}</span>
            <strong>M. Safarpour</strong>
          </div>
          <nav className="brand-footer-links" aria-label={isPersian ? 'پیوندهای پایانی' : 'Footer links'}>
            <a href="#worlds">{isPersian ? 'جهان‌ها' : 'Worlds'}</a>
            <Link to="/preorder">{isPersian ? 'دسترسی بنیان‌گذاران' : 'Founder access'}</Link>
            <a href="https://github.com/sina6565/AI_Studio_AI/discussions" target="_blank" rel="noreferrer">{isPersian ? 'تماس با ما' : 'Contact'}</a>
            <a href="https://github.com/sina6565/AI_Studio_AI/discussions" target="_blank" rel="noreferrer">{isPersian ? 'همکاری و مشارکت' : 'Partnerships'}</a>
            <a href="https://github.com/sina6565/AI_Studio_AI/discussions" target="_blank" rel="noreferrer">{isPersian ? 'سرمایه‌گذاران' : 'Investors'}</a>
            <a href="#brand-terms">{isPersian ? 'شرایط خدمات' : 'Terms of service'}</a>
            <a href="#brand-privacy">{isPersian ? 'حریم خصوصی' : 'Privacy'}</a>
          </nav>
        </div>
        <div className="brand-footer-legal" id="brand-terms">
          <details>
            <summary>{isPersian ? 'درباره شرایط خدمات' : 'Terms of service'}</summary>
            <p>{isPersian
              ? 'این صفحه معرفی نسخهٔ بتای SINA AI STUDIO است. قابلیت‌ها ممکن است تغییر کنند؛ شرایط کامل خدمات پیش از عرضهٔ عمومی در همین بخش منتشر می‌شود.'
              : 'This page introduces the SINA AI STUDIO beta. Features may change; the complete terms of service will be published here before public launch.'}</p>
          </details>
          <details id="brand-privacy">
            <summary>{isPersian ? 'درباره حریم خصوصی' : 'Privacy policy'}</summary>
            <p>{isPersian
              ? 'اطلاعات و تنظیمات حساب در صفحهٔ ورود توضیح داده می‌شود. سیاست کامل حریم خصوصی پیش از عرضهٔ عمومی در همین بخش منتشر خواهد شد.'
              : 'Account information and settings are described on the sign-in flow. The complete privacy policy will be published here before public launch.'}</p>
          </details>
          <span>© {new Date().getFullYear()} SINA AI STUDIO · {isPersian ? 'تمامی حقوق محفوظ است' : 'All rights reserved'}</span>
        </div>
      </footer>
    </>
  );
};

export default LandingExperienceExtras;
