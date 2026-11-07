import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhaserPlayableGameCanvas from '../components/games/PhaserPlayableGameCanvas';
import { GameSession, GameSnapshot, parsePlayableGameDefinition } from '../games/playableGame';
import apiClient from '../services/api';

const PlayableGamePage: React.FC = () => {
  const { t } = useTranslation();
  const { jobId = '' } = useParams();
  const [definition, setDefinition] = useState<ReturnType<typeof parsePlayableGameDefinition>>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    let active = true;
    const loadGame = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await apiClient.getJobStatus(jobId);
        const job = response.data;
        if (!response.success || !job) throw new Error(t('playGame.jobNotFound'));
        if (job.type !== 'game_build' || job.status !== 'completed') {
          throw new Error(t('playGame.jobNotPlayable'));
        }
        const playableDefinition = parsePlayableGameDefinition(
          job.result?.metadata?.playableGame,
        );
        if (!playableDefinition) throw new Error(t('playGame.invalidDefinition'));
        if (active) setDefinition(playableDefinition);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : t('playGame.loadFailed'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (jobId) void loadGame();
    else {
      setLoadError(t('playGame.jobNotFound'));
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [jobId, t]);

  const handleSnapshot = useCallback((nextSnapshot: GameSnapshot) => {
    setSnapshot(nextSnapshot);
  }, []);
  const handleRuntimeError = useCallback((message: string) => {
    setRuntimeError(message);
  }, []);

  const restartGame = () => {
    setRuntimeError(null);
    setSnapshot(null);
    setRunId((value) => value + 1);
  };

  const initialSnapshot = useMemo(
    () => (definition ? new GameSession(definition).snapshot() : null),
    [definition],
  );
  const visibleSnapshot = snapshot || initialSnapshot;

  const endMessage = visibleSnapshot?.status === 'won'
    ? t('playGame.won')
    : visibleSnapshot?.status === 'lost'
      ? t(visibleSnapshot.endReason === 'timeout' ? 'playGame.lostTimeout' : 'playGame.lostLives')
      : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h3" component="h1">
            {definition?.title || t('playGame.title')}
          </Typography>
          {definition && (
            <Typography variant="body2" color="text.secondary">
              {definition.description}
            </Typography>
          )}
        </Box>
        <Button component={Link} to="/jobs" variant="outlined">
          {t('playGame.backToJobs')}
        </Button>
      </Stack>

      {loading && <Alert severity="info">{t('common.loading')}</Alert>}
      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}
      {runtimeError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('playGame.runtimeFailed')}: {runtimeError}
        </Alert>
      )}

      {definition && !loadError && (
        <Paper sx={{ p: { xs: 1, sm: 2 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
            <Chip label={`${t('playGame.score')}: ${visibleSnapshot?.score ?? 0}`} color="primary" />
            <Chip label={`${t('playGame.crystals')}: ${visibleSnapshot?.collectedCrystals ?? 0}/${visibleSnapshot?.totalCrystals ?? 0}`} />
            <Chip label={`${t('playGame.lives')}: ${visibleSnapshot?.lives ?? definition.rules.startingLives}`} color="error" />
            <Chip label={`${t('playGame.time')}: ${visibleSnapshot?.secondsRemaining ?? definition.rules.timeLimitSeconds}s`} />
            <Box sx={{ flex: 1 }} />
            <Button variant="outlined" onClick={restartGame}>
              {t('playGame.restart')}
            </Button>
          </Stack>

          {endMessage && (
            <Alert severity={visibleSnapshot?.status === 'won' ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {endMessage} {t('playGame.finalScore')}: {visibleSnapshot?.score ?? 0}
            </Alert>
          )}

          <PhaserPlayableGameCanvas
            key={runId}
            definition={definition}
            onSnapshot={handleSnapshot}
            onError={handleRuntimeError}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('playGame.instructions')}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default PlayableGamePage;
