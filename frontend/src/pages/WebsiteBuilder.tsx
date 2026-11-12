import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert, Button, Chip, Container, Paper, Stack, TextField, Typography,
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import apiClient from '../services/api';
import './WebsiteBuilder.css';

const copy = {
  en: {
    eyebrow: 'SINA WEBSITE BUILDER',
    title: 'One prompt. Your website.',
    subtitle: 'Describe the website you want in plain language. SINA creates a responsive HTML draft you can preview, edit and download.',
    prompt: 'Describe the website you want',
    placeholder: 'Example: Create a modern bilingual website for a handmade ceramics studio. Include an introduction, product highlights, workshop information and contact details. Use an elegant dark blue and gold visual style.',
    generate: 'Build my website',
    preview: 'Live preview',
    source: 'HTML source',
    download: 'Download HTML',
    editHint: 'Edit the generated HTML directly, preview it in the sandbox, or download it as a standalone file.',
    draft: 'Your website preview will appear here.',
    promptRequired: 'Describe your website in at least 12 characters.',
    failed: 'Website generation failed.',
    submitting: 'Submitting website build...',
    queued: 'Website build queued...',
    processing: 'Building your website...',
    completed: 'Website draft generated successfully.',
    timeout: 'The build is taking longer than expected. Check the Jobs page for its status.',
    job: 'Job',
    honest: 'With your own Ollama server enabled, SINA can write the page content locally; if it is unavailable, a deterministic offline interpreter is used. No paid API is required. This release creates a responsive single-page HTML draft; multi-page routing, saved revisions and hosted publishing are not connected yet.',
  },
  fa: {
    eyebrow: 'سایت‌ساز SINA',
    title: 'یک پرامپت؛ وب‌سایت تو',
    subtitle: 'با زبان ساده توضیح بده چه وب‌سایتی می‌خواهی. سینا یک پیش‌نویس HTML واکنش‌گرا می‌سازد تا آن را ببینی، ویرایش و دریافت کنی.',
    prompt: 'وب‌سایت موردنظرت را توضیح بده',
    placeholder: 'مثال: یک وب‌سایت مدرن دوزبانه برای کارگاه سفال‌گری دست‌ساز بساز. معرفی مجموعه، محصولات شاخص، اطلاعات کارگاه و راه‌های تماس را داشته باشد. طراحی سرمه‌ای تیره و طلایی و ظاهری شیک داشته باشد.',
    generate: 'ساخت وب‌سایت من',
    preview: 'پیش‌نمایش زنده',
    source: 'کد HTML',
    download: 'دریافت HTML',
    editHint: 'کد HTML را مستقیم ویرایش کن، در محیط ایزوله ببین یا به‌صورت فایل مستقل دریافت کن.',
    draft: 'پیش‌نمایش وب‌سایت اینجا نمایش داده می‌شود.',
    promptRequired: 'توضیح وب‌سایت باید حداقل ۱۲ نویسه داشته باشد.',
    failed: 'ساخت وب‌سایت ناموفق بود.',
    submitting: 'در حال ثبت درخواست ساخت وب‌سایت...',
    queued: 'درخواست ساخت وب‌سایت در صف قرار گرفت...',
    processing: 'در حال ساخت وب‌سایت...',
    completed: 'پیش‌نویس وب‌سایت با موفقیت ساخته شد.',
    timeout: 'ساخت بیش از حد معمول طول کشید؛ وضعیت را در صفحه وظایف بررسی کن.',
    job: 'شناسه کار',
    honest: 'اگر سرور Ollama خودت را فعال کنی، سینا متن صفحه را با مدل محلی تولید می‌کند؛ در غیر این صورت از تفسیرگر آفلاین استفاده می‌شود. API پولی لازم نیست. نسخه فعلی یک صفحه HTML واکنش‌گرا می‌سازد؛ چندصفحه‌ای، تاریخچه نسخه‌ها و انتشار میزبانی‌شده هنوز متصل نیست.',
  },
};

function decodeHtmlDataUrl(value?: string): string {
  const prefix = 'data:text/html;charset=utf-8;base64,';
  if (!value || !value.startsWith(prefix)) return '';
  try {
    const binary = window.atob(value.slice(prefix.length));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

const WebsiteBuilder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const language = (localStorage.getItem('language') || 'en').startsWith('fa') ? 'fa' : 'en';
  const t = copy[language];
  const [prompt, setPrompt] = useState(() => searchParams.get('prompt') || '');
  const [html, setHtml] = useState('');
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [jobId, setJobId] = useState('');
  const direction = language === 'fa' ? 'rtl' : 'ltr';

  const previewDocument = useMemo(
    () => html || '<!doctype html><html><body style="font-family:system-ui;padding:40px;background:#080b18;color:white"><h1>SINA Website Builder</h1><p>Describe your website to build a first draft.</p></body></html>',
    [html],
  );

  const build = async () => {
    setError('');
    setStatus('');
    setJobId('');
    if (prompt.trim().length < 12) { setError(t.promptRequired); return; }

    setLoading(true);
    setStatus(t.submitting);
    try {
      const created = await apiClient.createWebsiteJob({ prompt: prompt.trim(), language });
      const nextJobId = created.data?.jobId;
      if (!created.success || !nextJobId) {
        throw new Error(created.error?.message || t.failed);
      }
      setJobId(nextJobId);
      setStatus(t.queued);

      const deadline = Date.now() + 120000;
      let firstPoll = true;
      while (Date.now() < deadline) {
        if (!firstPoll) await new Promise((resolve) => window.setTimeout(resolve, 1200));
        firstPoll = false;
        const polled = await apiClient.getJobStatus(nextJobId);
        const job = polled.data;
        if (!polled.success || !job) throw new Error(polled.error?.message || t.failed);
        if (job.status === 'completed') {
          const generatedHtml = String(
            job.result?.metadata?.html
            || job.output?.metadata?.html
            || decodeHtmlDataUrl(job.result?.contentUrl || job.output?.url)
            || '',
          );
          if (!generatedHtml.toLowerCase().startsWith('<!doctype html>')) {
            throw new Error('The job completed but no valid HTML artifact was returned.');
          }
          setHtml(generatedHtml);
          setTab('preview');
          setStatus(t.completed);
          return;
        }
        if (job.status === 'failed' || job.status === 'cancelled') {
          throw new Error(job.error?.message || t.failed);
        }
        setStatus(job.status === 'processing' ? t.processing : t.queued);
      }
      throw new Error(t.timeout);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failed);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sina-website.html';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Container maxWidth="xl" className="website-builder" dir={direction} sx={{ py: { xs: 2, md: 4 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Chip label={t.eyebrow} color="info" variant="outlined" sx={{ alignSelf: 'flex-start', letterSpacing: 1 }} />
        <Typography variant="h3" fontWeight={800}>{t.title}</Typography>
        <Typography color="text.secondary">{t.subtitle}</Typography>
      </Stack>
      <Alert severity="info" sx={{ mb: 3 }}>{t.honest}</Alert>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {status && (
        <Alert severity={status === t.completed ? 'success' : 'info'} sx={{ mb: 2 }}>
          {status}{jobId ? ' · ' + t.job + ': ' + jobId : ''}
        </Alert>
      )}
      <Stack spacing={3}>
        <Paper className="website-builder-panel" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <TextField
              label={t.prompt}
              placeholder={t.placeholder}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              fullWidth
              multiline
              minRows={5}
              maxRows={12}
              disabled={loading}
              inputProps={{ maxLength: 4000 }}
            />
            <Button variant="contained" size="large" onClick={() => void build()} disabled={loading || prompt.trim().length < 12} startIcon={<CodeRoundedIcon />}>
              {loading ? t.processing : t.generate}
            </Button>
          </Stack>
        </Paper>
        <Paper className="website-builder-preview" sx={{ overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant={tab === 'preview' ? 'contained' : 'text'} onClick={() => setTab('preview')} startIcon={<VisibilityRoundedIcon />}>{t.preview}</Button>
              <Button size="small" variant={tab === 'code' ? 'contained' : 'text'} onClick={() => setTab('code')} startIcon={<CodeRoundedIcon />}>{t.source}</Button>
            </Stack>
            <Button size="small" variant="outlined" disabled={!html} onClick={download} startIcon={<DownloadRoundedIcon />}>{t.download}</Button>
          </Stack>
          {tab === 'preview'
            ? <div className="website-builder-frame"><iframe title="Website live preview" srcDoc={previewDocument} sandbox="" /></div>
            : <div style={{ padding: 16 }}><Typography variant="caption" color="text.secondary">{t.editHint}</Typography><TextField value={html} onChange={(event) => setHtml(event.target.value)} multiline minRows={24} fullWidth dir="ltr" sx={{ mt: 2, '& textarea': { fontFamily: 'monospace', fontSize: 12 } }} /></div>}
          {!html && <Typography color="text.secondary" sx={{ p: 3 }}>{t.draft}</Typography>}
        </Paper>
      </Stack>
    </Container>
  );
};

export default WebsiteBuilder;
