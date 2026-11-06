import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  Alert, Box, Button, Checkbox, Container, FormControlLabel, Grid, LinearProgress,
  MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import { submitUE5RoomBuild, submitUE5RoomPreview } from '../services/ue5Game';
import type { Job } from '../types';

type Platform = 'windows' | 'linux' | 'mac' | 'android' | 'ios';

function Block({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>;
}

function Column({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0, 4.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 9, 24]} />
        <meshStandardMaterial color="#9b784f" metalness={0.55} roughness={0.38} />
      </mesh>
      <Block position={[0, 0, 0.28]} size={[1.44, 1.44, 0.42]} color="#252b38" />
      <Block position={[0, 0, 8.65]} size={[1.36, 1.36, 0.42]} color="#252b38" />
    </group>
  );
}

function RoomPreview() {
  const columns = useMemo(() => [-8.5, -4.5, 4.5, 8.5].flatMap((x) => [-5.5, 5.5].map((y) => [x, y] as [number, number])), []);
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, -6, 12]} intensity={2.4} />
      <pointLight position={[0, 3.4, 4.1]} color="#16c6ee" intensity={85} distance={13} />
      <Block position={[0, 0, -0.25]} size={[24, 18, 0.5]} color="#3a414e" />
      <Block position={[0, 0, 9.25]} size={[24, 18, 0.5]} color="#151a28" />
      <Block position={[-11.75, 0, 4.5]} size={[0.5, 18, 9]} color="#202b40" />
      <Block position={[11.75, 0, 4.5]} size={[0.5, 18, 9]} color="#202b40" />
      <Block position={[0, -8.75, 4.5]} size={[24, 0.5, 9]} color="#202b40" />
      <Block position={[-6.8, 8.75, 4.5]} size={[10.4, 0.5, 9]} color="#202b40" />
      <Block position={[6.8, 8.75, 4.5]} size={[10.4, 0.5, 9]} color="#202b40" />
      <Block position={[0, 8.75, 6.6]} size={[3.2, 0.5, 4.8]} color="#202b40" />
      <Block position={[-1.8, 8.25, 2.1]} size={[0.42, 0.7, 4.2]} color="#ba8a4c" />
      <Block position={[1.8, 8.25, 2.1]} size={[0.42, 0.7, 4.2]} color="#ba8a4c" />
      <Block position={[0, 8.25, 4.25]} size={[4.2, 0.7, 0.35]} color="#ba8a4c" />
      <mesh position={[0, 3.5, 4.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.15, 0.16, 16, 64]} />
        <meshStandardMaterial color="#b98a4c" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 3.48, 4.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.92, 0.055, 12, 64]} />
        <meshStandardMaterial color="#20d9ff" emissive="#087baf" emissiveIntensity={2.2} />
      </mesh>
      {columns.map(([x, y], index) => <Column key={index} x={x} y={y} />)}
      {[-3, 0, 3].flatMap((y) => [-8.5, 8.5].map((x) => (
        <Block key={x + ':' + y} position={[x, y, 0.65]} size={[1.8, 1.4, 1.3]} color="#252b38" />
      )))}
      {[-6, -3, 0, 3, 6].map((y) => <Block key={y} position={[0, y, 0.025]} size={[0.12, 1.8, 0.025]} color="#16c6ee" />)}
      <OrbitControls makeDefault target={[0, 0, 4]} minDistance={12} maxDistance={55} />
    </>
  );
}

function makeManifest(input: {
  title: string; description: string; genre: string; platform: Platform;
  functionApproved: boolean; formApproval?: { approvedBy: string; approvedAt: string; evidence: string[] };
}) {
  const now = new Date().toISOString();
  return {
    manifest: {
      schemaVersion: 1,
      project: {
        title: input.title.trim(),
        description: input.description.trim(),
        genre: input.genre.trim() || 'adventure',
        targetPlatforms: [input.platform],
      },
      engine: { id: 'unreal_engine_5', majorVersion: 5, minimumMinorVersion: 0 },
      room: {
        id: 'sina-gateway-room-v1',
        purpose: input.description.trim(),
        boundsMeters: [24, 18, 9],
        heroObjectId: 'hero-portal',
        primaryArrivalId: 'main-arrival',
        surfaces: [
          { id: 'north-wall', kind: 'wall', dimensionsMeters: [24, 0.5, 9], transform: { location: [0, 8.75, 4.5], rotationDegrees: [0, 0, 0] } },
          { id: 'south-wall', kind: 'wall', dimensionsMeters: [24, 0.5, 9], transform: { location: [0, -8.75, 4.5], rotationDegrees: [0, 0, 0] } },
          { id: 'west-wall', kind: 'wall', dimensionsMeters: [0.5, 18, 9], transform: { location: [-11.75, 0, 4.5], rotationDegrees: [0, 0, 0] } },
          { id: 'east-wall', kind: 'wall', dimensionsMeters: [0.5, 18, 9], transform: { location: [11.75, 0, 4.5], rotationDegrees: [0, 0, 0] } },
          { id: 'floor', kind: 'floor', dimensionsMeters: [24, 18, 0.5], transform: { location: [0, 0, -0.25], rotationDegrees: [0, 0, 0] } },
          { id: 'ceiling', kind: 'ceiling', dimensionsMeters: [24, 18, 0.5], transform: { location: [0, 0, 9.25], rotationDegrees: [0, 0, 0] } },
        ],
        playerSpawn: [0, -6, 0.1],
        productionCamera: { location: [0, -21, 12], target: [0, 1, 3.5], verticalFovDegrees: 65 },
        symmetry: { mode: 'bilateral', order: 2, exceptions: ['north-arrival-opening'] },
      },
      assets: [
        { id: 'hero-portal', role: 'Hero energy portal ring', dimensionsMeters: [4.3, 0.45, 4.3], attachment: 'freestanding', semanticFront: 'positive_y', reusable: false, source: 'procedural_blender', transform: { location: [0, 3.5, 4.1], rotationDegrees: [90, 0, 0], scale: [1, 1, 1] } },
        { id: 'arrival-left-pilaster', role: 'Left arrival frame pillar', dimensionsMeters: [0.42, 0.7, 4.2], attachment: 'floor', semanticFront: 'positive_y', source: 'procedural_blender', transform: { location: [-1.8, 8.25, 2.1], rotationDegrees: [0, 0, 0], scale: [1, 1, 1] } },
        { id: 'arrival-right-pilaster', role: 'Right arrival frame pillar', dimensionsMeters: [0.42, 0.7, 4.2], attachment: 'floor', semanticFront: 'positive_y', source: 'procedural_blender', transform: { location: [1.8, 8.25, 2.1], rotationDegrees: [0, 0, 0], scale: [1, 1, 1] } },
      ],
      openings: [{
        id: 'main-arrival', kind: 'door', wallId: 'north-wall',
        widthMeters: 3.2, heightMeters: 4.2, destination: 'north-approach',
        traversable: true, collisionEnabled: true, navigationEnabled: true,
      }],
      gameplay: {
        movement: 'third_person', collisionRequired: true, navigationRequired: true,
        respawnPoints: [[0, -6, 0.1]],
        interactions: [{ id: 'inspect-portal', action: 'inspect', targetId: 'hero-portal' }],
      },
      pipeline: {
        roomAuthoring: 'blender', runtime: 'unreal_engine_5',
        meshGeneration: 'procedural_first', paidServicesAllowed: false,
        gates: {
          functionApproved: input.functionApproved,
          ...(input.functionApproved ? {
            functionApproval: {
              approvedBy: 'project-owner',
              approvedAt: now,
              evidence: ['studio:function-brief-approved:v1'],
            },
          } : {}),
          formApproved: Boolean(input.formApproval),
          ...(input.formApproval ? { formApproval: input.formApproval } : {}),
          runtimeApproved: false,
        },
      },
    },
  };
}

async function waitForJob(jobId: string, timeoutMs: number, onStatus: (status: string) => void): Promise<Job> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 2500));
    const response = await apiClient.getJobStatus(jobId);
    if (!response.success || !response.data) throw new Error(response.error?.message || 'Could not retrieve job status.');
    const job = response.data;
    onStatus(job.progress?.stage || job.status);
    if (job.status === 'completed') return job;
    if (job.status === 'failed' || job.status === 'cancelled') throw new Error(job.error?.message || 'The job did not complete.');
  }
  throw new Error('This job is still running. You can continue tracking it on the Jobs page.');
}

const Game3DBuilder: React.FC = () => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('Ancient Gateway');
  const [description, setDescription] = useState('A third-person exploration room with a central energy portal, an open 3.2 meter entrance, and a clear traversal path.');
  const [genre, setGenre] = useState('adventure');
  const [platform, setPlatform] = useState<Platform>('windows');
  const [functionApproved, setFunctionApproved] = useState(false);
  const [formApproved, setFormApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [buildUrl, setBuildUrl] = useState('');
  const [jobId, setJobId] = useState('');

  const runPreview = async () => {
    setError(''); setStatus('submitting_preview'); setPreviewUrl(''); setBuildUrl(''); setJobId('');
    if (!title.trim() || !description.trim()) { setError(t('game3d.required')); return; }
    if (!functionApproved) { setError(t('game3d.approveFunction')); return; }
    setBusy(true);
    try {
      const request = makeManifest({ title, description, genre, platform, functionApproved: true });
      const created = await submitUE5RoomPreview(request);
      const id = (created.data as any)?.jobId || (created.data as any)?.id;
      if (!created.success || !id) throw new Error(created.error?.message || 'Could not queue the Blender preview.');
      setJobId(id);
      const completed = await waitForJob(id, 15 * 60 * 1000, setStatus);
      const url = completed.result?.contentUrl || completed.output?.url;
      if (!url) throw new Error('The preview job completed without a review image URL.');
      setPreviewUrl(url);
      setStatus('preview_ready');
      setFormApproved(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Preview failed.');
      setStatus('failed');
    } finally { setBusy(false); }
  };

  const reviseBrief = () => { setPreviewUrl(''); setBuildUrl(''); setFormApproved(false); setFunctionApproved(false); setJobId(''); setStatus(''); setError(''); };

  const runBuild = async () => {
    setError(''); setBuildUrl(''); setStatus('submitting_ue5_build');
    if (!previewUrl || !formApproved) { setError(t('game3d.approveForm')); return; }
    setBusy(true);
    try {
      const formApproval = {
        approvedBy: 'project-owner',
        approvedAt: new Date().toISOString(),
        evidence: [previewUrl, 'studio:form-review-approved:v1'],
      };
      const request = makeManifest({ title, description, genre, platform, functionApproved: true, formApproval });
      const created = await submitUE5RoomBuild(request);
      const id = (created.data as any)?.jobId || (created.data as any)?.id;
      if (!created.success || !id) throw new Error(created.error?.message || 'Could not queue the UE5 build.');
      setJobId(id);
      const completed = await waitForJob(id, 30 * 60 * 1000, setStatus);
      const url = completed.result?.contentUrl || completed.output?.url;
      if (!url) throw new Error('The UE5 build completed without a project artifact URL.');
      setBuildUrl(url);
      setStatus('ue5_project_ready');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'UE5 build failed.');
      setStatus('failed');
    } finally { setBusy(false); }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h3" fontWeight={800}>{t('game3d.title')}</Typography>
        <Typography color="text.secondary">{t('game3d.subtitle')}</Typography>
        <Alert severity="info">{t('game3d.freeNotice')}</Alert>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {status && <Alert severity="info" sx={{ mb: 2 }}>{t('game3d.status')}: {status}</Alert>}
      {busy && <LinearProgress sx={{ mb: 2 }} />}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField label={t('game3d.projectName')} value={title} onChange={(e) => setTitle(e.target.value)} fullWidth inputProps={{ maxLength: 120 }} disabled={busy} />
              <TextField label={t('game3d.description')} value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={4} fullWidth inputProps={{ maxLength: 4000 }} disabled={busy || Boolean(previewUrl)} />
              <TextField label={t('game3d.genre')} value={genre} onChange={(e) => setGenre(e.target.value)} fullWidth disabled={busy || Boolean(previewUrl)} />
              <TextField select label={t('game3d.platform')} value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} fullWidth disabled={busy || Boolean(previewUrl)}>
                <MenuItem value="windows">Windows</MenuItem>
                <MenuItem value="linux">Linux</MenuItem>
                <MenuItem value="mac">macOS</MenuItem>
                <MenuItem value="android">Android</MenuItem>
                <MenuItem value="ios">iOS</MenuItem>
              </TextField>
              <FormControlLabel control={<Checkbox checked={functionApproved} onChange={(e) => setFunctionApproved(e.target.checked)} disabled={busy || Boolean(previewUrl)} />} label={t('game3d.functionApproval')} />
              <Button variant="contained" onClick={runPreview} disabled={busy || !functionApproved}>{t('game3d.generatePreview')}</Button>
              {previewUrl && <Button variant="text" color="inherit" onClick={reviseBrief} disabled={busy}>{t('game3d.reviseBrief')}</Button>}
              <FormControlLabel control={<Checkbox checked={formApproved} onChange={(e) => setFormApproved(e.target.checked)} disabled={busy || !previewUrl} />} label={t('game3d.formApproval')} />
              <Button variant="contained" color="secondary" onClick={runBuild} disabled={busy || !previewUrl || !formApproved}>{t('game3d.buildUE5')}</Button>
              {jobId && <Typography variant="caption" color="text.secondary">{t('game3d.jobId')}: {jobId}</Typography>}
              <Button component={RouterLink} to="/jobs" variant="outlined">{t('game3d.viewJobs')}</Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ height: 430, bgcolor: '#07101e' }}>
              <Canvas camera={{ position: [28, -30, 22], up: [0, 0, 1], fov: 48 }}>
                <color attach="background" args={['#07101e']} />
                <RoomPreview />
              </Canvas>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>{t('game3d.previewTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('game3d.previewHint')}</Typography>
              {previewUrl && <Box component="img" src={previewUrl} alt={t('game3d.blenderPreview')} sx={{ width: '100%', maxHeight: 460, objectFit: 'contain', mt: 2, borderRadius: 2, bgcolor: '#101827' }} />}
              {buildUrl && <Alert severity="success" sx={{ mt: 2 }}>{t('game3d.buildReady')} <a href={buildUrl} target="_blank" rel="noreferrer">{t('game3d.downloadProject')}</a></Alert>}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Game3DBuilder;
