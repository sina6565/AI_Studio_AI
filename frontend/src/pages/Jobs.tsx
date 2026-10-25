import React, { useState, useEffect } from 'react';
import { Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Box, Typography, Chip, LinearProgress, Alert, Card, CardMedia } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { parsePlayableGameDefinition } from '../games/playableGame';
import { Job } from '../types';
import SceneViewerPreviewDialog, {
  isSceneViewerPreviewManifest,
  safePreviewImageUrl,
  SceneViewerPreviewManifest,
} from '../components/games/SceneViewerPreviewDialog';

function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined;
  const response = error.response;
  if (!response || typeof response !== 'object' || !('data' in response)) return undefined;
  const data = response.data;
  if (!data || typeof data !== 'object' || !('error' in data)) return undefined;
  const payload = data.error;
  if (!payload || typeof payload !== 'object' || !('message' in payload)) return undefined;
  return typeof payload.message === 'string' ? payload.message : undefined;
}

const Jobs: React.FC = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildNotice, setBuildNotice] = useState<string | null>(null);
  const [buildingJobId, setBuildingJobId] = useState<string | null>(null);
  const [previewManifest, setPreviewManifest] = useState<SceneViewerPreviewManifest | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const res = await apiClient.listJobs();
        if (res.success && res.data) {
          setJobs(res.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
    const interval = setInterval(loadJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (jobId: string) => {
    try {
      await apiClient.cancelJob(jobId);
      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: 'cancelled' } : j)));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to cancel job');
    }
  };

  const handleBuildPlayableGame = async (
    sourceJob: Job,
    manifest: SceneViewerPreviewManifest,
  ) => {
    setError(null);
    setBuildNotice(null);
    setBuildingJobId(sourceJob.id);
    try {
      const projectId = typeof sourceJob.metadata?.projectId === 'string'
        ? sourceJob.metadata.projectId
        : undefined;
      const response = await apiClient.buildGameJob(manifest, projectId);
      if (response.success && response.data) {
        setBuildNotice(t('jobs.playableBuildQueued', { jobId: response.data.jobId }));
      } else {
        setError(t('creation.gameQueuedFailed'));
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || t('creation.gameQueuedFailed'));
    } finally {
      setBuildingJobId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'info';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        {t('pages.jobs')}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {buildNotice && <Alert severity="success" sx={{ mb: 2 }}>{buildNotice}</Alert>}
      {loading ? (
        <LinearProgress />
      ) : jobs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">No jobs yet</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>{t('job.status')}</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>{t('job.progress')}</TableCell>
                <TableCell>{t('job.created')}</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => {
                const manifestCandidate = job.result?.metadata?.manifest;
                const manifest = isSceneViewerPreviewManifest(manifestCandidate)
                  ? manifestCandidate
                  : null;
                const previewableManifest = job.type === 'game_build' ? manifest : null;
                const playableGame = job.type === 'game_build'
                  ? parsePlayableGameDefinition(job.result?.metadata?.playableGame)
                  : null;
                const artifact = job.result?.metadata?.artifact;
                return (
                <React.Fragment key={job.id}>
                <TableRow key={job.id}>
                  <TableCell>
                    <Chip
                      label={job.status}
                      color={getStatusColor(job.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{job.type}</TableCell>
                  <TableCell>
                    {job.progress && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={job.progress.percentage}
                          sx={{ flex: 1 }}
                        />
                        <Typography variant="body2">{job.progress.percentage}%</Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {['processing', 'pending', 'queued'].includes(job.status) && (
                      <Button size="small" color="error" onClick={() => handleCancel(job.id)}>
                        {t('common.cancel')}
                      </Button>
                    )}
                    {job.status === 'completed' && job.result?.contentUrl && (
                      <Button size="small" href={job.result.contentUrl} target="_blank">
                        {t('job.download')}
                      </Button>
                    )}
                    {job.status === 'completed' && playableGame && (
                      <Button
                        size="small"
                        component={Link}
                        to={`/play/${encodeURIComponent(job.id)}`}
                      >
                        {t('jobs.playGame')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {(job.error?.message || manifest) && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ bgcolor: '#fafafa' }}>
                      {job.error?.message && (
                        <Alert severity="error" sx={{ mb: manifest ? 1 : 0 }}>
                          {job.error.code}: {job.error.message}
                        </Alert>
                      )}
                      {manifest && (
                        <Box>
                          <Typography variant="subtitle2">
                            {t('game.manifest')}: {manifest.title} — {manifest.assetCount}{' '}
                            {t('game.assets')}, {manifest.scenes?.length || 0}{' '}
                            {t('game.scenes')}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {manifest.scenes.map((scene) => {
                              const imageUrl = safePreviewImageUrl(scene.imageUrl);
                              return imageUrl ? (
                                <Card key={scene.id || scene.name} sx={{ width: 120 }}>
                                  <CardMedia
                                    component="img"
                                    height="80"
                                    image={imageUrl}
                                    alt={scene.name}
                                  />
                                  <Box sx={{ p: 0.5 }}>
                                    <Typography variant="caption">{scene.name}</Typography>
                                  </Box>
                                </Card>
                              ) : null;
                            })}
                          </Box>
                          {job.type === 'game_creation' && job.status === 'completed' && (
                            <Button
                              size="small"
                              variant="contained"
                              sx={{ mt: 1 }}
                              disabled={buildingJobId === job.id}
                              onClick={() => handleBuildPlayableGame(job, manifest)}
                            >
                              {buildingJobId === job.id
                                ? t('common.loading')
                                : t('jobs.buildPlayableGame')}
                            </Button>
                          )}
                        </Box>
                      )}
                      {artifact && (
                        <Box sx={{ mt: manifest ? 2 : 0 }}>
                          <Typography variant="subtitle2">{t('jobs.artifact')}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {artifact.filename} &middot; {artifact.format} &middot;{' '}
                            {artifact.sceneCount} {t('game.scenes')}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              component="a"
                              href={job.result?.contentUrl}
                              download={artifact.filename}
                            >
                              {t('jobs.downloadArtifact')}
                            </Button>
                            {previewableManifest && (
                              <Button
                                size="small"
                                variant="outlined"
                                aria-label={t('jobs.previewSceneViewer')}
                                onClick={() => setPreviewManifest(previewableManifest)}
                              >
                                {t('jobs.previewSceneViewer')}
                              </Button>
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 1 }}
                          >
                            {t('jobs.artifactHint')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {t('jobs.gameplayNote')}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                )}
                </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {previewManifest && (
        <SceneViewerPreviewDialog
          open
          manifest={previewManifest}
          onClose={() => setPreviewManifest(null)}
        />
      )}
    </Container>
  );
};

export default Jobs;
