import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LanguageIcon from '@mui/icons-material/Language';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import './UniverseLanding.css';

const TIERS = ['explorer', 'creator', 'studio'] as const;
type Tier = (typeof TIERS)[number];
const STORAGE_KEY = 'sina-preorder-reservation';

/**
 * Founder pre-order (پیش‌فروش) page: pick a tier, reserve a founder seat.
 * No payment is taken today — the reservation is stored locally and locked
 * to the account the visitor creates for launch.
 */
const PreOrder: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const isPersian = i18n.language.startsWith('fa');

  const initialPlan = ((): Tier => {
    const p = searchParams.get('plan');
    return TIERS.includes(p as Tier) ? (p as Tier) : 'creator';
  })();

  const [plan, setPlan] = useState<Tier>(initialPlan);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const toggleLanguage = () => {
    const next = isPersian ? 'en' : 'fa';
    void i18n.changeLanguage(next);
    localStorage.setItem('language', next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr';
  };

  const tierFeatures = (tier: string): string[] => {
    const v = t(`landing.preorder.tiers.${tier}.features`, { returnObjects: true });
    return Array.isArray(v) ? (v as string[]) : [];
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEmail = /\S+@\S+\.\S+/.test(email.trim());
    if (name.trim().length < 2 || !validEmail) {
      setError(t('preorderPage.form.invalid'));
      return;
    }
    setError('');
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        plan,
        reservedAt: new Date().toISOString(),
      }),
    );
    setDone(true);
  };

  return (
    <main className={`universe-landing preorder-page ${isPersian ? 'is-persian' : ''}`}>
      <header className="universe-nav scrolled">
        <div className="nav-inner">
          <Link className="brand-lockup" to="/" aria-label="SINA STUDIO AI">
            <img className="brand-logo-img" src="/assets/logo-mark-256.png" alt="" style={{ mixBlendMode: 'screen' }} />
            <span className="brand-name">
              SINA STUDIO<small>AI UNIVERSE</small>
            </span>
          </Link>
          <div className="nav-actions" style={{ marginInlineStart: 'auto' }}>
            <button type="button" className="language-toggle" onClick={toggleLanguage} aria-label="Switch language / تغییر زبان">
              <LanguageIcon />
              {isPersian ? 'EN' : 'FA'}
            </button>
            <Link className="nav-cta" to="/">
              {t('preorderPage.form.backHome')}
            </Link>
          </div>
        </div>
      </header>

      <div className="preorder-shell">
        <img
          className="preorder-hero-logo"
          src="/assets/logo-sina-cropped.png"
          alt="SINA STUDIO AI"
          style={{ mixBlendMode: 'screen' }}
        />
        <h1 className="preorder-title">{t('preorderPage.title')}</h1>
        <p className="preorder-subtitle">{t('preorderPage.subtitle')}</p>

        <div className="plan-picker" role="radiogroup" aria-label={t('preorderPage.form.plan')}>
          {TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              role="radio"
              aria-checked={plan === tier}
              className={`plan-option ${plan === tier ? 'selected' : ''}`}
              onClick={() => setPlan(tier)}
            >
              <span className="tier-name" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {t(`landing.preorder.tiers.${tier}.name`)}
                {plan === tier && <CheckIcon style={{ fontSize: 18 }} />}
              </span>
              <span className="tier-tag" style={{ display: 'block' }}>{t(`landing.preorder.tiers.${tier}.tag`)}</span>
              <span className="tier-price" style={{ display: 'block' }}>{t(`landing.preorder.tiers.${tier}.price`)}</span>
              <ul className="tier-features" style={{ margin: '14px 0 0' }}>
                {tierFeatures(tier).slice(0, 3).map((feature) => (
                  <li key={feature}>
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {done ? (
          <div className="preorder-success" role="status">
            <CheckCircleIcon />
            <h3>{t('preorderPage.form.success')}</h3>
            <p>{t('preorderPage.form.successHint')}</p>
            <div className="success-actions">
              <Link className="start-btn" to="/login?mode=signup&redirect=%2Fdashboard">
                {t('preorderPage.form.createAccount')}
                <ArrowForwardIcon className="flip-rtl" style={{ fontSize: 17 }} />
              </Link>
              <Link className="ad-close-btn" to="/">
                {t('preorderPage.form.backHome')}
              </Link>
            </div>
          </div>
        ) : (
          <form className="preorder-form" onSubmit={submit} noValidate>
            <label>
              {t('preorderPage.form.name')}
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label>
              {t('preorderPage.form.email')}
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" dir="ltr" />
            </label>
            <button type="submit" className="start-btn">
              <WorkspacePremiumIcon />
              {t('preorderPage.form.submit')}
            </button>
            {error && <p className="preorder-error" role="alert">{error}</p>}
          </form>
        )}

        <p className="preorder-note">{t('landing.preorder.note')}</p>

        <div className="faq-block">
          <h2>{t('preorderPage.faq.title')}</h2>
          {[1, 2, 3].map((n) => (
            <div className="faq-item" key={n}>
              <h4>{t(`preorderPage.faq.q${n}`)}</h4>
              <p>{t(`preorderPage.faq.a${n}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default PreOrder;
