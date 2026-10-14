import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  LinearProgress,
  Card,
  CardMedia,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';

type ContentType = 'image' | 'video' | 'audio' | 'speech' | 'game';

interface SceneDraft {
  name: string;
  description: string;
}

const MAX_SCENES = 12;

const Studio: React.FC = () => {
  const { t } = useTranslation();
  const [contentType, setContentType] = useState<ContentType>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Game creation state
  const [gameTitle, setGameTitle] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [artStyle, setArtStyle] = useState('');
  const [scenes, setScenes] = useState<SceneDraft[]>([{ name: '', description: '' }]);
  const [queuedJobId, setQueuedJobId] = useState<string | null>(null);

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

    const validationError = validateGame();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.createGameJob({
        title: gameTitle.trim(),
        description: gameDescription.trim(),
        genre: genre.trim() || undefined,
        artStyle: artStyle.trim() || undefined,
        scenes: scenes.map((scene) => ({
          name: scene.name.trim(),
          description: scene.description.trim(),
        })),
      });

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

    setLoading(true);
    try {
      let res: any = undefined;
      if (contentType === 'image') {
        res = await apiClient.generateImage(prompt, '1024x1024', 'standard');
      } else if (contentType === 'video') {
        res = await apiClient.generateVideo(prompt, 10, 24);
      } else if (contentType === 'audio') {
        res = await apiClient.generateAudio(prompt, 30);
      } else if (contentType === 'speech') {
        res = await apiClient.generateSpeech(prompt, 'en');
      }

      if (res?.success && res.data) {
        setResult(res.data);
        setSuccess('Content generated successfully!');
        setPrompt('');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || `Failed to generate ${contentType}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const isGame = contentType === 'game';
  const canSubmit = isGame
    ? Boolean(gameTitle.trim() && gameDescription.trim())
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
            <Box sx={{ mb: 3 }}>
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
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {queuedJobId && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('creation.jobId')}: <strong>{queuedJobId}</strong>.{' '}
                {t('creation.viewJobs')}
              </Alert>
            )}

            {isGame ? (
              <Stack spacing={2}>
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
                        onChange={(e) =>
                          updateScene(index, { description: e.target.value })
                        }
                        multiline
                        rows={2}
                        fullWidth
                        disabled={loading}
                        inputProps={{ maxLength: 2000 }}
                      />
                      {scenes.length > 1 && (
                        <Box>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => removeScene(index)}
                            disabled={loading}
                          >
                            {t('creation.removeScene')}
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                ))}

                <Box>
                  <Button onClick={addScene} disabled={loading || scenes.length >= MAX_SCENES}>
                    {t('creation.addScene')}
                  </Button>
                </Box>
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
              {loading ? t('common.loading') : t('creation.generate')}
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
