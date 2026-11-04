import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, Container, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import './WebsiteBuilder.css';

type SiteKind = 'portfolio' | 'business' | 'product';
type Palette = 'midnight' | 'light' | 'ocean';

const copy: Record<string, Record<string, string>> = {
  en: {
    eyebrow: 'SINA WEBSITE BUILDER',
    title: 'Turn your idea into a website',
    subtitle: 'Describe the site, choose a direction, then edit and preview the generated starter page.',
    name: 'Website / brand name',
    tagline: 'Short headline',
    brief: 'What is this website about?',
    kind: 'Website type',
    palette: 'Visual theme',
    portfolio: 'Portfolio',
    business: 'Business',
    product: 'Product landing page',
    midnight: 'Midnight neon',
    light: 'Clean light',
    ocean: 'Ocean blue',
    generate: 'Build website draft',
    preview: 'Live preview',
    source: 'HTML source',
    download: 'Download HTML',
    editHint: 'You can edit the generated HTML directly. Download it as a standalone file.',
    draft: 'Starter draft',
    honest: 'This first builder creates an editable, self-contained HTML starter locally in your browser. AI copy generation and hosted publishing are not connected yet.',
  },
  fa: {
    eyebrow: 'سازنده وب‌سایت سینا',
    title: 'ایده‌ات را به وب‌سایت تبدیل کن',
    subtitle: 'موضوع سایت را توضیح بده، سبک را انتخاب کن، سپس خروجی را ویرایش و پیش‌نمایش کن.',
    name: 'نام وب‌سایت یا برند',
    tagline: 'تیتر اصلی کوتاه',
    brief: 'این وب‌سایت درباره چیست؟',
    kind: 'نوع وب‌سایت',
    palette: 'تم ظاهری',
    portfolio: 'نمونه‌کار',
    business: 'کسب‌وکار',
    product: 'صفحه معرفی محصول',
    midnight: 'نئون نیمه‌شب',
    light: 'روشن و مینیمال',
    ocean: 'آبی اقیانوسی',
    generate: 'ساخت پیش‌نویس سایت',
    preview: 'پیش‌نمایش زنده',
    source: 'کد HTML',
    download: 'دریافت فایل HTML',
    editHint: 'می‌توانی کد HTML تولیدشده را مستقیم ویرایش و به‌صورت یک فایل مستقل دریافت کنی.',
    draft: 'پیش‌نویس اولیه',
    honest: 'این نسخه نخست، یک قالب HTML مستقل و قابل ویرایش را داخل مرورگر می‌سازد. تولید متن با هوش مصنوعی و انتشار میزبانی‌شده هنوز متصل نشده‌اند.',
  },
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char] || char));

function makeSite(name: string, tagline: string, brief: string, kind: SiteKind, palette: Palette, language: string) {
  const safeName = escapeHtml(name.trim() || 'Your Brand');
  const safeTagline = escapeHtml(tagline.trim() || 'A better idea starts here.');
  const safeBrief = escapeHtml(brief.trim() || 'A new digital experience, thoughtfully made for you.');
  const isFa = language === 'fa';
  const dir = isFa ? 'rtl' : 'ltr';
  const colors = {
    midnight: ['#080b18', '#111a31', '#66e7ff', '#f6f8ff'],
    light: ['#f6f7fb', '#ffffff', '#5b5ce2', '#17182b'],
    ocean: ['#061c2b', '#0c3448', '#55d6be', '#f1fbff'],
  }[palette];
  const labels = isFa
    ? { nav: 'بخش‌ها', about: 'درباره ما', services: 'خدمات', contact: 'ارتباط با ما', cta: 'شروع گفتگو', service1: 'طراحی هدفمند', service2: 'تجربه ساده', service3: 'رشد هوشمند', aboutTitle: 'داستان ما', serviceTitle: 'چه کاری انجام می‌دهیم؟', contactTitle: 'بیایید چیزی بسازیم', footer: 'ساخته‌شده با ایده‌ای بزرگ' }
    : { nav: 'Explore', about: 'About', services: 'Services', contact: 'Contact', cta: 'Let’s talk', service1: 'Thoughtful strategy', service2: 'Simple experience', service3: 'Built to grow', aboutTitle: 'Our story', serviceTitle: 'What we do', contactTitle: 'Let’s build something', footer: 'Made from a bold idea' };
  const cards = [labels.service1, labels.service2, labels.service3];
  return `<!doctype html>
<html lang="${isFa ? 'fa' : 'en'}" dir="${dir}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeName}</title>
<meta name="description" content="${safeBrief}">
<style>
:root{color-scheme:${palette === 'light' ? 'light' : 'dark'};--bg:${colors[0]};--panel:${colors[1]};--accent:${colors[2]};--text:${colors[3]}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.65}
a{color:inherit;text-decoration:none}.wrap{width:min(1100px,90%);margin:auto}.nav{height:76px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid color-mix(in srgb,var(--text) 12%,transparent)}.brand{font-weight:800;letter-spacing:.04em}.links{display:flex;gap:24px;font-size:14px;opacity:.82}.button{display:inline-block;background:var(--accent);color:#07101a;padding:12px 20px;border-radius:999px;font-weight:800}.hero{padding:110px 0 100px;max-width:850px}.pill{display:inline-block;border:1px solid var(--accent);color:var(--accent);padding:5px 12px;border-radius:99px;font-size:12px;font-weight:800;letter-spacing:.12em}.hero h1{font-size:clamp(42px,8vw,86px);line-height:1.04;letter-spacing:-.055em;margin:24px 0}.hero p,.section p{font-size:18px;opacity:.78;max-width:680px}.section{padding:72px 0;border-top:1px solid color-mix(in srgb,var(--text) 12%,transparent)}.section h2{font-size:clamp(30px,5vw,48px);line-height:1.1;margin:0 0 18px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}.card{background:var(--panel);border:1px solid color-mix(in srgb,var(--text) 12%,transparent);padding:26px;border-radius:20px;min-height:150px}.card b{color:var(--accent);font-size:18px}footer{padding:30px 0;opacity:.6;font-size:13px}@media(max-width:650px){.links{gap:10px;font-size:12px}.hero{padding:76px 0}.cards{grid-template-columns:1fr}.nav{height:64px}}
</style></head>
<body><header class="wrap nav"><a class="brand" href="#">${safeName}</a><nav class="links"><a href="#about">${labels.about}</a><a href="#services">${labels.services}</a><a href="#contact">${labels.contact}</a></nav></header>
<main><section class="wrap hero"><span class="pill">${kind === 'portfolio' ? 'CREATIVE PORTFOLIO' : kind === 'business' ? 'BUSINESS' : 'PRODUCT'}</span><h1>${safeTagline}</h1><p>${safeBrief}</p><a class="button" href="#contact">${labels.cta}</a></section>
<section class="section" id="about"><div class="wrap"><h2>${labels.aboutTitle}</h2><p>${safeBrief}</p></div></section>
<section class="section" id="services"><div class="wrap"><h2>${labels.serviceTitle}</h2><div class="cards">${cards.map((card, index) => `<article class="card"><b>0${index + 1}</b><h3>${card}</h3><p>${safeBrief}</p></article>`).join('')}</div></div></section>
<section class="section" id="contact"><div class="wrap"><h2>${labels.contactTitle}</h2><p>${safeTagline}</p><a class="button" href="mailto:hello@example.com">${labels.cta}</a></div></section></main>
<footer class="wrap">${labels.footer} · © ${new Date().getFullYear()} ${safeName}</footer></body></html>`;
}

const WebsiteBuilder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const language = (localStorage.getItem('language') || 'en').startsWith('fa') ? 'fa' : 'en';
  const t = copy[language];
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [brief, setBrief] = useState(() => searchParams.get('prompt') || '');
  const [kind, setKind] = useState<SiteKind>('business');
  const [palette, setPalette] = useState<Palette>('midnight');
  const [html, setHtml] = useState('');
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const direction = language === 'fa' ? 'rtl' : 'ltr';

  const previewDocument = useMemo(() => html || '<!doctype html><html><body style="font-family:system-ui;padding:40px;background:#080b18;color:white"><h1>SINA Website Builder</h1><p>Build your first website draft.</p></body></html>', [html]);

  const build = () => setHtml(makeSite(name, tagline, brief, kind, palette, language));
  const download = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(name.trim() || 'sina-website').toLowerCase().replace(/[^a-z0-9-]+/g, '-')}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return <Container maxWidth="xl" className="website-builder" dir={direction} sx={{ py: { xs: 2, md: 4 } }}>
    <Stack spacing={1} sx={{ mb: 3 }}>
      <Chip label={t.eyebrow} color="info" variant="outlined" sx={{ alignSelf: 'flex-start', letterSpacing: 1 }} />
      <Typography variant="h3" fontWeight={800}>{t.title}</Typography>
      <Typography color="text.secondary">{t.subtitle}</Typography>
    </Stack>
    <Alert severity="info" sx={{ mb: 3 }}>{t.honest}</Alert>
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper className="website-builder-panel" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <TextField label={t.name} value={name} onChange={(e) => setName(e.target.value)} fullWidth inputProps={{ maxLength: 70 }} />
            <TextField label={t.tagline} value={tagline} onChange={(e) => setTagline(e.target.value)} fullWidth inputProps={{ maxLength: 120 }} />
            <TextField label={t.brief} value={brief} onChange={(e) => setBrief(e.target.value)} fullWidth multiline minRows={4} inputProps={{ maxLength: 600 }} />
            <TextField select label={t.kind} value={kind} onChange={(e) => setKind(e.target.value as SiteKind)}>
              <MenuItem value="portfolio">{t.portfolio}</MenuItem><MenuItem value="business">{t.business}</MenuItem><MenuItem value="product">{t.product}</MenuItem>
            </TextField>
            <TextField select label={t.palette} value={palette} onChange={(e) => setPalette(e.target.value as Palette)}>
              <MenuItem value="midnight">{t.midnight}</MenuItem><MenuItem value="light">{t.light}</MenuItem><MenuItem value="ocean">{t.ocean}</MenuItem>
            </TextField>
            <Button variant="contained" size="large" onClick={build} startIcon={<CodeRoundedIcon />}>{t.generate}</Button>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={8}>
        <Paper className="website-builder-preview" sx={{ overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant={tab === 'preview' ? 'contained' : 'text'} onClick={() => setTab('preview')} startIcon={<VisibilityRoundedIcon />}>{t.preview}</Button>
              <Button size="small" variant={tab === 'code' ? 'contained' : 'text'} onClick={() => setTab('code')} startIcon={<CodeRoundedIcon />}>{t.source}</Button>
            </Stack>
            <Button size="small" variant="outlined" disabled={!html} onClick={download} startIcon={<DownloadRoundedIcon />}>{t.download}</Button>
          </Stack>
          {tab === 'preview'
            ? <Box className="website-builder-frame"><iframe title="Website live preview" srcDoc={previewDocument} sandbox="" /></Box>
            : <Box sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">{t.editHint}</Typography><TextField value={html} onChange={(e) => setHtml(e.target.value)} multiline minRows={24} fullWidth dir="ltr" sx={{ mt: 2, '& textarea': { fontFamily: 'monospace', fontSize: 12 } }} /></Box>}
          {!html && <Typography color="text.secondary" sx={{ p: 3 }}>{t.draft}</Typography>}
        </Paper>
      </Grid>
    </Grid>
  </Container>;
};

export default WebsiteBuilder;
