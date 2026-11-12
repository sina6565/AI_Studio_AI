import React, { useEffect, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  LinearProgress,
  Card,
  CardMedia,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import type { Project } from '../types';

type ContentType = 'image' | 'video' | 'audio' | 'speech' | 'game';

interface SceneDraft {
  name: string;
  description: string;
}

const MAX_SCENES = 12;

const Studio: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [contentType, setContentType] = useState<ContentType>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Game creation state
  const [gamePrompt, setGamePrompt] = useState('');
  const [playableGameReady, setPlayableGameReady] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [artStyle, setArtStyle] = useState('');
  const [scenes, setScenes] = useState<SceneDraft[]>([{ name: '', description: '' }]);
  const [gameMode, setGameMode] = useState<'create' | 'build'>('create');
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [queuedJobId, setQueuedJobId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);

  // Deep-link from the cinematic landing page: /studio?prompt=...&type=...
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const promptParam = searchParams.get('prompt');
    if (typeParam && ['image', 'video', 'audio', 'speech', 'game'].includes(typeParam)) {
      setContentType(typeParam as ContentType);
    }
    if (promptParam) {
      setPrompt(promptParam);
      if (typeParam === 'game') {
        setGamePrompt(promptParam);
        setGameDescription(promptParam);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (contentType !== 'game') return;
    let active = true;
    void apiClient.listProjects()
      .then((response) => {
        if (active && response.success && response.data) {
          setAvailableProjects(response.data);
        }
      })
      .catch(() => {
        if (active) setAvailableProjects([]);
      });
    return () => {
      active = false;
    };
  }, [contentType]);

  const updateScene = (index: number, patch: Partial<SceneDraft>) => {
    setScenes((current) =>
      current.map((scene, i) => (i === index ? { ...scene, ...patch } : scene)),
    );
  };

  const addScene = () => {
    if (scenes.length >= MAX_SCENES) {
      return;
    }
    setScenes((current) => [...current, { name: '', description: '' }]);
  };

  const removeScene = (index: number) => {
    setScenes((current) => current.filter((_, i) => i !== index));
  };

  const validateGame = (): string | null => {
    if (!gameTitle.trim()) return t('creation.gameTitleRequired');
    if (!gameDescription.trim()) return t('creation.gameDescriptionRequired');
    if (scenes.length === 0) return t('creation.sceneRequired');
    for (let i = 0; i < scenes.length; i += 1) {
      if (!scenes[i].name.trim()) return `${t('creation.sceneName')} ${i + 1}: ${t('creation.sceneNameRequired')}`;
      if (!scenes[i].description.trim()) {
        return `${t('creation.sceneDescription')} ${i + 1}: ${t('creation.sceneDescriptionRequired')}`;
      }
    }
    return null;
  };

  const handleGenerateGame = async () => {
    setError(null);
    setSuccess(null);
    setQueuedJobId(null);
    setPlayableGameReady(false);

    if (gameMode === 'build') {
      if (gamePrompt.trim().length < 12) {
        setError(i18n.language.startsWith('fa')
          ? 'توضیح بازی باید حداقل ۱۲ نویسه باشد.'
          : 'Describe your game in at least 12 characters.');
        return;
      }
      setLoading(true);
      setGenerationStatus('submitting');
      try {
        const res = await apiClient.createPromptGameJob(gamePrompt.trim(), selectedProjectId || undefined);
        const nextJobId = res?.data?.jobId;
        if (!res?.success || !nextJobId) throw new Error(res?.error?.message || t('creation.gameQueuedFailed'));
        setQueuedJobId(nextJobId);
        setGenerationStatus('queued');
        const deadline = Date.now() + 120000;
        while (Date.now() < deadline) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
          const polled = await apiClient.getJobStatus(nextJobId);
          if (!polled.success || !polled.data) throw new Error(polled.error?.message || 'Could not check game build status.');
          setGenerationStatus(polled.data.status);
          if (polled.data.status === 'completed') {
            if (!polled.data.result?.metadata?.playableGame) throw new Error('The game job completed without a playable game definition.');
            setPlayableGameReady(true);
            setSuccess(i18n.language.startsWith('fa') ? 'بازی قابل اجرا ساخته شد.' : 'Your playable browser game is ready.');
            return;
          }
          if (polled.data.status === 'failed' || polled.data.status === 'cancelled') {
            throw new Error(polled.data.error?.message || 'The game build did not complete.');
          }
        }
        setSuccess(i18n.language.startsWith('fa')
          ? 'ساخت ادامه دارد؛ وضعیت را در صفحه وظایف دنبال کن.'
          : 'The build is still running. Track it on the Jobs page.');
      } catch (err: any) {
        setGenerationStatus(null);
        setError(err.response?.data?.error?.message || err.message || t('creation.gameQueuedFailed'));
      } finally {
        setLoading(false);
      }
      return;
    }

    const validationError = validateGame();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.createGameJob(
        {
          title: gameTitle.trim(),
          description: gameDescription.trim(),
          genre: genre.trim() || undefined,
          artStyle: artStyle.trim() || undefined,
          scenes: scenes.map((scene) => ({
            name: scene.name.trim(),
            description: scene.description.trim(),
          })),
        },
        'create',
        selectedProjectId || undefined,
      );

      if (res?.success && res.data) {
        setQueuedJobId(res.data.jobId);
        setSuccess(t('creation.gameQueued'));
      } else {
        setError(t('creation.gameQueuedFailed'));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          t('creation.gameQueuedFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setSuccess(null);

    if (contentType === 'game') {
      await handleGenerateGame();
      return;
    }

    if (!prompt.trim()) {
      setError('Prompt is required');
      return;
    }

    const jobTypes: Record<Exclude<ContentType, 'game'>, string> = {
      image: 'image_generation',
      video: 'video_generation',
      audio: 'audio_generation',
      speech: 'text_to_speech',
    };
    const input = contentType === 'speech'
      ? { text: prompt.trim(), language: 'en' }
      : contentType === 'image'
        ? { prompt: prompt.trim(), size: '1024x1024', quality: 'standard' }
        : contentType === 'video'
          ? { prompt: prompt.trim(), duration: 10, fps: 24 }
          : { prompt: prompt.trim(), duration: 30 };

    setLoading(true);
    setResult(null);
    setGenerationStatus('submitting');

    try {
      const created = await apiClient.createJob({
        type: jobTypes[contentType as Exclude<ContentType, 'game'>],
        input,
      });
      const createdJob = created.data as (typeof created.data & { jobId?: string }) | undefined;
      const jobId = createdJob?.jobId || createdJob?.id;
      if (!created.success || !jobId) {
        throw new Error(created.error?.message || 'The generation job could not be created.');
      }

      const deadline = Date.now() + 5 * 60 * 1000;
      let completedJob: import('../types').Job | null = null;
      setGenerationStatus('queued');

      while (Date.now() < deadline) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        const polled = await apiClient.getJobStatus(jobId);
        if (!polled.success || !polled.data) {
          throw new Error(polled.error?.message || 'Could not check generation status.');
        }

        const job = polled.data;
        setGenerationStatus(job.status);
        if (job.status === 'completed') {
          completedJob = job;
          break;
        }
        if (job.status === 'failed' || job.status === 'cancelled') {
          throw new Error(job.error?.message || `Generation ${job.status}.`);
        }
      }

      if (!completedJob) {
        throw new Error('Generation is taking longer than expected. Check the Jobs page for its status.');
      }

      const output = completedJob.output || {};
      const metadata = completedJob.result?.metadata || output.metadata || {};
      const mediaUrl = completedJob.result?.contentUrl
        || output.url
        || output.contentUrl
        || metadata.image_url
        || metadata.video_url
        || metadata.audio_url;

      if (!mediaUrl) {
        throw new Error('The job completed, but the provider did not return a playable media URL.');
      }

      setResult({
        ...metadata,
        image_url: contentType === 'image' ? mediaUrl : undefined,
        video_url: contentType === 'video' ? mediaUrl : undefined,
        audio_url: contentType === 'audio' || contentType === 'speech' ? mediaUrl : undefined,
        contentUrl: mediaUrl,
        format: completedJob.result?.format || output.format,
      });
      setSuccess('Content generated successfully!');
      setPrompt('');
    } catch (err: any) {
      setGenerationStatus(null);
      setError(
        err.response?.data?.error?.message || err.message || `Failed to generate ${contentType}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const isGame = contentType === 'game';
  const canSubmit = isGame
    ? (gameMode === 'build' ? gamePrompt.trim().length >= 12 : Boolean(gameTitle.trim() && gameDescription.trim()))
    : Boolean(prompt.trim());

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        {t('pages.studio')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={isGame ? 12 : 6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('creation.selectType')}
            </Typography>
            <div style={{ marginBottom: 24 }}>
              <ToggleButtonGroup
                value={contentType}
                exclusive
                onChange={(_, v) => v && setContentType(v)}
                fullWidth
              >
                <ToggleButton value="image">{t('creation.image')}</ToggleButton>
                <ToggleButton value="video">{t('creation.video')}</ToggleButton>
                <ToggleButton value="audio">{t('creation.audio')}</ToggleButton>
                <ToggleButton value="speech">TTS</ToggleButton>
                <ToggleButton value="game">{t('creation.game')}</ToggleButton>
              </ToggleButtonGroup>
            </div>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {generationStatus && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Job status: <strong>{generationStatus}</strong>
              </Alert>
            )}
            {queuedJobId && (
              <Alert severity={playableGameReady ? 'success' : 'info'} sx={{ mb: 2 }}>
                {t('creation.jobId')}: <strong>{queuedJobId}</strong>.{' '}
                {playableGameReady ? (
                  <Button component={RouterLink} to={`/play/${queuedJobId}`} size="small" color="inherit">
                    {i18n.language.startsWith('fa') ? 'اجرای بازی' : 'Play game'}
                  </Button>
                ) : <Button component={RouterLink} to="/jobs" size="small" color="inherit">{t('creation.viewJobs')}</Button>}
              </Alert>
            )}

            {isGame ? (
              <Stack spacing={2}>
                <ToggleButtonGroup
                  value={gameMode}
                  exclusive
                  onChange={(_event, value) => value && setGameMode(value)}
                  size="small"
                  disabled={loading}
                >
                  <ToggleButton value="create">{t('creation.gameModeCreate')}</ToggleButton>
                  <ToggleButton value="build">{t('creation.gameModeBuild')}</ToggleButton>
                </ToggleButtonGroup>
                <Button component={RouterLink} to="/studio/3d" variant="outlined" color="secondary" fullWidth>
                  {t('creation.open3DBuilder')}
                </Button>
                <FormControl fullWidth disabled={loading}>
                  <InputLabel id="game-project-label">{t('creation.attachProject')}</InputLabel>
                  <Select
                    labelId="game-project-label"
                    value={selectedProjectId}
                    label={t('creation.attachProject')}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                  >
                    <MenuItem value=""><em>{t('creation.noProject')}</em></MenuItem>
                    {availableProjects.map((project) => {
                      const projectId = project.id || project._id;
                      return projectId ? <MenuItem key={projectId} value={projectId}>{project.name}</MenuItem> : null;
                    })}
                  </Select>
                </FormControl>
                {gameMode === 'build' ? (
                  <>
                    <TextField
                      label={i18n.language.startsWith('fa') ? 'پرامپت ساخت بازی' : 'Describe your game in one prompt'}
                      placeholder={i18n.language.startsWith('fa')
                        ? 'مثلاً: یک بازی ماجراجویی دوبعدی در خرابه‌های باستانی بساز؛ بازیکن جواهرها را جمع کند، از تله‌ها دوری کند و به دروازه خروج برسد.'
                        : 'Example: Build a 2D adventure in ancient ruins. The player collects gems, avoids traps and reaches an exit portal.'}
                      value={gamePrompt}
                      onChange={(event) => setGamePrompt(event.target.value)}
                      multiline
                      minRows={5}
                      maxRows={10}
                      fullWidth
                      disabled={loading}
                      inputProps={{ maxLength: 4000 }}
                    />
                    <Alert severity="info">
                      {i18n.language.startsWith('fa')
                        ? 'این مسیر یک بازی دوبعدی قابل اجرا در مرورگر با موتور Phaser می‌سازد؛ تولید محلی است و به API پولی نیاز ندارد. ساخت بازی سه‌بعدی UE5 مسیر جداگانه‌ای دارد.'
                        : 'This creates a playable browser-based 2D Phaser prototype locally, without paid APIs. Unreal Engine 5 builds use the separate 3D workflow.'}
                    </Alert>
                  </>
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      {t('creation.gameModeCreateHint')}
                    </Typography>
                    <TextField
                      label={t('creation.gameTitle')}
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      fullWidth
                      disabled={loading}
                      inputProps={{ maxLength: 120 }}
                    />
                    <TextField
                      label={t('creation.gameDescription')}
                      value={gameDescription}
                      onChange={(e) => setGameDescription(e.target.value)}
                      multiline
                      rows={3}
                      fullWidth
                      disabled={loading}
                      inputProps={{ maxLength: 4000 }}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label={t('creation.genre')}
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        fullWidth
                        disabled={loading}
                        inputProps={{ maxLength: 60 }}
                      />
                      <TextField
                        label={t('creation.artStyle')}
                        value={artStyle}
                        onChange={(e) => setArtStyle(e.target.value)}
                        fullWidth
                        disabled={loading}
                        inputProps={{ maxLength: 200 }}
                      />
                    </Stack>
                    <Typography variant="h6">
                      {t('creation.scenes')} ({scenes.length}/{MAX_SCENES})
                    </Typography>
                    {scenes.map((scene, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                          <TextField
                            label={`${t('creation.sceneName')} ${index + 1}`}
                            value={scene.name}
                            onChange={(e) => updateScene(index, { name: e.target.value })}
                            fullWidth
                            disabled={loading}
                            inputProps={{ maxLength: 120 }}
                          />
                          <TextField
                            label={`${t('creation.sceneDescription')} ${index + 1}`}
                            value={scene.description}
                            onChange={(e) => updateScene(index, { description: e.target.value })}
                            multiline
                            rows={2}
                            fullWidth
                            disabled={loading}
                            inputProps={{ maxLength: 2000 }}
                          />
                          {scenes.length > 1 && (
                            <div>
                              <Button size="small" color="error" onClick={() => removeScene(index)} disabled={loading}>
                                {t('creation.removeScene')}
                              </Button>
                            </div>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                    <div>
                      <Button onClick={addScene} disabled={loading || scenes.length >= MAX_SCENES}>
                        {t('creation.addScene')}
                      </Button>
                    </div>
                  </>
                )}
              </Stack>
            ) : (
              <TextField
                label={t('creation.describe')}
                placeholder="Describe what you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                multiline
                rows={4}
                fullWidth
                disabled={loading}
                sx={{ mb: 2 }}
              />
            )}

            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              onClick={handleGenerate}
              disabled={loading || !canSubmit}
            >
              {loading ? t('common.loading') : (isGame && gameMode === 'build' ? (i18n.language.startsWith('fa') ? 'ساخت بازی قابل اجرا' : 'Build playable game') : t('creation.generate'))}
            </Button>

            {loading && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>
        </Grid>

        {result && !isGame && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Result
              </Typography>
              {contentType === 'image' && result.image_url && (
                <Card>
                  <CardMedia component="img" image={result.image_url} alt="Generated" />
                </Card>
              )}
              {contentType === 'video' && result.video_url && (
                <video width="100%" controls>
                  <source src={result.video_url} />
                </video>
              )}
              {(contentType === 'audio' || contentType === 'speech') && (
                <audio controls style={{ width: '100%' }}>
                  <source src={result.audio_url || result.video_url} />
                </audio>
              )}
              <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                {t('common.save')}
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Studio;
