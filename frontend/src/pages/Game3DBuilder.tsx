import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  Alert, Button, Checkbox, Container, FormControlLabel, Grid, LinearProgress,
  MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import { submitUE5RoomBuild, submitUE5RoomPreview } from '../services/ue5Game';
import Playable3DGame from '../components/games/Playable3DGame';
import type { Job } from '../types';

type Platform = 'windows' | 'linux' | 'mac' | 'android' | 'ios';

function Block({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>;
}

function Column({ x, y, height }: { x: number; y: number; height: number }) {
  const radius = Math.max(0.24, Math.min(0.42, height * 0.047));
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0, height / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, height, 24]} />
        <meshStandardMaterial color="#9b784f" metalness={0.55} roughness={0.38} />
      </mesh>
      <Block position={[0, 0, 0.22]} size={[radius * 3.2, radius * 3.2, 0.35]} color="#252b38" />
      <Block position={[0, 0, height - 0.22]} size={[radius * 3, radius * 3, 0.35]} color="#252b38" />
    </group>
  );
}

interface RoomPreviewProps {
  width: number;
  depth: number;
  height: number;
  doorwayWidth: number;
  doorwayHeight: number;
  portalDiameter: number;
}

function RoomPreview({ width, depth, height, doorwayWidth, doorwayHeight, portalDiameter }: RoomPreviewProps) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallT = 0.5;
  const safeDoorW = Math.min(doorwayWidth, width - 2);
  const safeDoorH = Math.min(doorwayHeight, height - 1);
  const sideW = Math.max(0, (width - safeDoorW) / 2);
  const sideCenter = safeDoorW / 2 + sideW / 2;
  const portalR = Math.max(0.8, Math.min(portalDiameter / 2, height * 0.32));
  const portalY = depth * 0.18;
  const portalZ = height * 0.48;
  const columns = useMemo(
    () => [-0.34, -0.17, 0.17, 0.34].flatMap((xf) => [-0.31, 0.31].map((yf) => [width * xf, depth * yf] as [number, number])),
    [width, depth],
  );
  const inlayY = [-0.3, -0.15, 0, 0.15, 0.3].map((v) => depth * v);
  const plinths = [-1, 1].flatMap((side) => [-0.16, 0, 0.16].map((yf) => [side * width * 0.34, depth * yf] as [number, number]));
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[width * 0.18, -depth * 0.35, height * 1.3]} intensity={2.4} />
      <pointLight position={[0, portalY, portalZ]} color="#16c6ee" intensity={85} distance={Math.max(width, depth)} />
      <Block position={[0, 0, -wallT / 2]} size={[width, depth, wallT]} color="#3a414e" />
      <Block position={[0, 0, height + wallT / 2]} size={[width, depth, wallT]} color="#151a28" />
      <Block position={[-halfW + wallT / 2, 0, height / 2]} size={[wallT, depth, height]} color="#202b40" />
      <Block position={[halfW - wallT / 2, 0, height / 2]} size={[wallT, depth, height]} color="#202b40" />
      <Block position={[0, -halfD + wallT / 2, height / 2]} size={[width, wallT, height]} color="#202b40" />
      {sideW > 0.1 && <>
        <Block position={[-sideCenter, halfD - wallT / 2, height / 2]} size={[sideW, wallT, height]} color="#202b40" />
        <Block position={[sideCenter, halfD - wallT / 2, height / 2]} size={[sideW, wallT, height]} color="#202b40" />
      </>}
      {height - safeDoorH > 0.1 && (
        <Block position={[0, halfD - wallT / 2, (height + safeDoorH) / 2]} size={[safeDoorW, wallT, height - safeDoorH]} color="#202b40" />
      )}
      <Block position={[-safeDoorW / 2 - 0.25, halfD - 0.6, safeDoorH / 2]} size={[0.42, 0.7, safeDoorH]} color="#ba8a4c" />
      <Block position={[safeDoorW / 2 + 0.25, halfD - 0.6, safeDoorH / 2]} size={[0.42, 0.7, safeDoorH]} color="#ba8a4c" />
      <Block position={[0, halfD - 0.6, safeDoorH - 0.12]} size={[safeDoorW + 0.92, 0.7, 0.24]} color="#ba8a4c" />
      <mesh position={[0, portalY, portalZ]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[portalR, 0.16, 16, 64]} />
        <meshStandardMaterial color="#b98a4c" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, portalY - 0.02, portalZ]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[Math.max(0.5, portalR - 0.23), 0.055, 12, 64]} />
        <meshStandardMaterial color="#20d9ff" emissive="#087baf" emissiveIntensity={2.2} />
      </mesh>
      {columns.map(([x, y], index) => <Column key={index} x={x} y={y} height={height} />)}
      {plinths.map(([x, y], index) => (
        <Block key={index} position={[x, y, 0.65]} size={[Math.min(1.8, width * 0.1), Math.min(1.4, depth * 0.1), 1.3]} color="#252b38" />
      ))}
      {inlayY.map((y) => <Block key={y} position={[0, y, 0.025]} size={[0.12, Math.min(1.8, depth * 0.1), 0.025]} color="#16c6ee" />)}
      <OrbitControls makeDefault target={[0, 0, height * 0.45]} minDistance={Math.min(width, depth) * 0.55} maxDistance={Math.max(width, depth) * 2.3} />
    </>
  );
}

function makeManifest(input: {
  title: string; description: string; genre: string; platform: Platform;
  width: number; depth: number; height: number; doorwayWidth: number; doorwayHeight: number; portalDiameter: number;
  movement: 'third_person' | 'first_person' | 'top_down';
  functionApproved: boolean; formApproval?: { approvedBy: string; approvedAt: string; evidence: string[] };
}) {
  const now = new Date().toISOString();
  const width = input.width;
  const depth = input.depth;
  const height = input.height;
  const doorWidth = Math.min(input.doorwayWidth, width - 2);
  const doorHeight = Math.min(input.doorwayHeight, height - 1);
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallT = 0.5;
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
        boundsMeters: [width, depth, height],
        heroObjectId: 'hero-portal',
        primaryArrivalId: 'main-arrival',
        surfaces: [
          { id: 'north-wall', kind: 'wall', dimensionsMeters: [width, wallT, height], transform: { location: [0, halfD - wallT / 2, height / 2], rotationDegrees: [0, 0, 0] } },
          { id: 'south-wall', kind: 'wall', dimensionsMeters: [width, wallT, height], transform: { location: [0, -halfD + wallT / 2, height / 2], rotationDegrees: [0, 0, 0] } },
          { id: 'west-wall', kind: 'wall', dimensionsMeters: [wallT, depth, height], transform: { location: [-halfW + wallT / 2, 0, height / 2], rotationDegrees: [0, 0, 0] } },
          { id: 'east-wall', kind: 'wall', dimensionsMeters: [wallT, depth, height], transform: { location: [halfW - wallT / 2, 0, height / 2], rotationDegrees: [0, 0, 0] } },
          { id: 'floor', kind: 'floor', dimensionsMeters: [width, depth, wallT], transform: { location: [0, 0, -wallT / 2], rotationDegrees: [0, 0, 0] } },
          { id: 'ceiling', kind: 'ceiling', dimensionsMeters: [width, depth, wallT], transform: { location: [0, 0, height + wallT / 2], rotationDegrees: [0, 0, 0] } },
        ],
        playerSpawn: [0, -depth * 0.34, 0.1],
        productionCamera: { location: [0, -depth * 1.17, height * 1.33], target: [0, depth * 0.05, height * 0.39], verticalFovDegrees: 65 },
        symmetry: { mode: 'bilateral', order: 2, exceptions: ['north-arrival-opening'] },
      },
      assets: [
        { id: 'hero-portal', role: 'Hero energy portal ring', dimensionsMeters: [input.portalDiameter, 0.45, input.portalDiameter], attachment: 'freestanding', semanticFront: 'positive_y', reusable: false, source: 'procedural_blender', transform: { location: [0, depth * 0.18, height * 0.48], rotationDegrees: [90, 0, 0], scale: [1, 1, 1] } },
        { id: 'arrival-left-pilaster', role: 'Left arrival frame pillar', dimensionsMeters: [0.42, 0.7, doorHeight], attachment: 'floor', semanticFront: 'positive_y', source: 'procedural_blender', transform: { location: [-doorWidth / 2 - 0.25, halfD - 0.6, doorHeight / 2], rotationDegrees: [0, 0, 0], scale: [1, 1, 1] } },
        { id: 'arrival-right-pilaster', role: 'Right arrival frame pillar', dimensionsMeters: [0.42, 0.7, 4.2], attachment: 'floor', semanticFront: 'positive_y', source: 'procedural_blender', transform: { location: [doorWidth / 2 + 0.25, halfD - 0.6, doorHeight / 2], rotationDegrees: [0, 0, 0], scale: [1, 1, 1] } },
      ],
      openings: [{
        id: 'main-arrival', kind: 'door', wallId: 'north-wall',
        widthMeters: doorWidth, heightMeters: doorHeight, destination: 'north-approach',
        traversable: true, collisionEnabled: true, navigationEnabled: true,
      }],
      gameplay: {
        movement: input.movement, collisionRequired: true, navigationRequired: true,
        respawnPoints: [[0, -depth * 0.34, 0.1]],
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
  const [roomWidth, setRoomWidth] = useState(24);
  const [roomDepth, setRoomDepth] = useState(18);
  const [roomHeight, setRoomHeight] = useState(9);
  const [doorwayWidth, setDoorwayWidth] = useState(3.2);
  const [doorwayHeight, setDoorwayHeight] = useState(4.2);
  const [portalDiameter, setPortalDiameter] = useState(4.3);
  const [movement, setMovement] = useState<'third_person' | 'first_person' | 'top_down'>('third_person');
  const [functionApproved, setFunctionApproved] = useState(false);
  const [formApproved, setFormApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [reviewViews, setReviewViews] = useState<string[]>([]);
  const [auditReport, setAuditReport] = useState<Record<string, any> | null>(null);
  const [buildUrl, setBuildUrl] = useState('');
  const [jobId, setJobId] = useState('');
  const [playtestOpen, setPlaytestOpen] = useState(false);

  const validateRoomSettings = (): string | null => {
    const numericValues = [roomWidth, roomDepth, roomHeight, doorwayWidth, doorwayHeight, portalDiameter];
    if (!numericValues.every(Number.isFinite)) return t('game3d.invalidDimensions');
    if (roomWidth < 12 || roomWidth > 80 || roomDepth < 12 || roomDepth > 80 || roomHeight < 4 || roomHeight > 30) {
      return t('game3d.roomBounds');
    }
    if (doorwayWidth < 2.4 || doorwayWidth > roomWidth - 2) return t('game3d.doorWidthBounds');
    if (doorwayHeight < 2.5 || doorwayHeight > roomHeight - 1) return t('game3d.doorHeightBounds');
    if (portalDiameter < 2.5 || portalDiameter > Math.min(roomWidth, roomDepth) * 0.75) return t('game3d.portalBounds');
    return null;
  };

  const runPreview = async () => {
    setError(''); setStatus('submitting_preview'); setPreviewUrl(''); setReviewViews([]); setAuditReport(null); setBuildUrl(''); setJobId('');
    if (!title.trim() || !description.trim()) { setError(t('game3d.required')); return; }
    const roomError = validateRoomSettings();
    if (roomError) { setError(roomError); return; }
    if (!functionApproved) { setError(t('game3d.approveFunction')); return; }
    setBusy(true);
    try {
      const request = makeManifest({
        title, description, genre, platform,
        width: roomWidth, depth: roomDepth, height: roomHeight,
        doorwayWidth, doorwayHeight, portalDiameter, movement,
        functionApproved: true,
      });
      const created = await submitUE5RoomPreview(request);
      const id = (created.data as any)?.jobId || (created.data as any)?.id;
      if (!created.success || !id) throw new Error(created.error?.message || 'Could not queue the Blender preview.');
      setJobId(id);
      const completed = await waitForJob(id, 15 * 60 * 1000, setStatus);
      const url = completed.result?.contentUrl || completed.output?.url;
      if (!url) throw new Error('The preview job completed without a review image URL.');
      setPreviewUrl(url);
      const metadata = (completed.result?.metadata || completed.output?.metadata || {}) as Record<string, any>;
      const views = Array.isArray(metadata.reviewViews)
        ? metadata.reviewViews.filter((item: unknown): item is string => typeof item === 'string' && (item.startsWith('https://') || item.startsWith('http://localhost:') || item.startsWith('http://127.0.0.1:')))
        : [];
      setReviewViews(views);
      setAuditReport(metadata.audit && typeof metadata.audit === 'object' ? metadata.audit : null);
      setStatus('preview_ready');
      setFormApproved(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Preview failed.');
      setStatus('failed');
    } finally { setBusy(false); }
  };

  const reviseBrief = () => { setPreviewUrl(''); setReviewViews([]); setAuditReport(null); setBuildUrl(''); setFormApproved(false); setFunctionApproved(false); setJobId(''); setStatus(''); setError(''); };

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
      const request = makeManifest({
        title, description, genre, platform,
        width: roomWidth, depth: roomDepth, height: roomHeight,
        doorwayWidth, doorwayHeight, portalDiameter, movement,
        functionApproved: true, formApproval,
      });
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
              <TextField label={t('game3d.projectName')} value={title} onChange={(e) => setTitle(e.target.value)} fullWidth inputProps={{ maxLength: 120 }} disabled={busy || Boolean(previewUrl)} />
              <TextField label={t('game3d.description')} value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={4} fullWidth inputProps={{ maxLength: 4000 }} disabled={busy || Boolean(previewUrl)} />
              <TextField label={t('game3d.genre')} value={genre} onChange={(e) => setGenre(e.target.value)} fullWidth disabled={busy || Boolean(previewUrl)} />
              <TextField select label={t('game3d.platform')} value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} fullWidth disabled={busy || Boolean(previewUrl)}>
                <MenuItem value="windows">Windows</MenuItem>
                <MenuItem value="linux">Linux</MenuItem>
                <MenuItem value="mac">macOS</MenuItem>
                <MenuItem value="android">Android</MenuItem>
                <MenuItem value="ios">iOS</MenuItem>
              </TextField>
              <Typography variant="subtitle2">{t('game3d.roomDimensions')}</Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <TextField type="number" label={t('game3d.width')} value={roomWidth} onChange={(e) => setRoomWidth(Number(e.target.value))} inputProps={{ min: 12, max: 80, step: 1 }} fullWidth disabled={busy || Boolean(previewUrl)} />
                </Grid>
                <Grid item xs={4}>
                  <TextField type="number" label={t('game3d.depth')} value={roomDepth} onChange={(e) => setRoomDepth(Number(e.target.value))} inputProps={{ min: 12, max: 80, step: 1 }} fullWidth disabled={busy || Boolean(previewUrl)} />
                </Grid>
                <Grid item xs={4}>
                  <TextField type="number" label={t('game3d.height')} value={roomHeight} onChange={(e) => setRoomHeight(Number(e.target.value))} inputProps={{ min: 4, max: 30, step: 1 }} fullWidth disabled={busy || Boolean(previewUrl)} />
                </Grid>
              </Grid>
              <Typography variant="subtitle2">{t('game3d.openingAndHero')}</Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <TextField type="number" label={t('game3d.doorWidth')} value={doorwayWidth} onChange={(e) => setDoorwayWidth(Number(e.target.value))} inputProps={{ min: 2.4, max: 12, step: 0.1 }} fullWidth disabled={busy || Boolean(previewUrl)} />
                </Grid>
                <Grid item xs={4}>
                  <TextField type="number" label={t('game3d.doorHeight')} value={doorwayHeight} onChange={(e) => setDoorwayHeight(Number(e.target.value))} inputProps={{ min: 2.5, max: 20, step: 0.1 }} fullWidth disabled={busy || Boolean(previewUrl)} />
                </Grid>
                <Grid item xs={4}>
                  <TextField type="number" label={t('game3d.portalDiameter')} value={portalDiameter} onChange={(e) => setPortalDiameter(Number(e.target.value))} inputProps={{ min: 2.5, max: 15, step: 0.1 }} fullWidth disabled={busy || Boolean(previewUrl)} />
                </Grid>
              </Grid>
              <TextField select label={t('game3d.movement')} value={movement} onChange={(e) => setMovement(e.target.value as typeof movement)} fullWidth disabled={busy || Boolean(previewUrl)}>
                <MenuItem value="third_person">{t('game3d.thirdPerson')}</MenuItem>
                <MenuItem value="first_person">{t('game3d.firstPerson')}</MenuItem>
                <MenuItem value="top_down">{t('game3d.topDown')}</MenuItem>
              </TextField>
              <Alert severity="info">{t('game3d.movementModeNote')}</Alert>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: 12 }}>
              <Typography variant="subtitle1" fontWeight={700}>{playtestOpen ? t('game3d.playtestTitle') : t('game3d.previewTitle')}</Typography>
              <Button variant={playtestOpen ? 'outlined' : 'contained'} onClick={() => setPlaytestOpen((value) => !value)}>
                {playtestOpen ? t('game3d.playtestReturn') : t('game3d.playtestButton')}
              </Button>
            </div>
            {playtestOpen ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>{t('game3d.playtestHelp')}</Typography>
                <Playable3DGame
                  width={roomWidth}
                  depth={roomDepth}
                  height={roomHeight}
                  doorwayWidth={doorwayWidth}
                  doorwayHeight={doorwayHeight}
                  portalDiameter={portalDiameter}
                />
              </>
            ) : (
              <div style={{ height: 430, backgroundColor: '#07101e' }}>
                <Canvas camera={{ position: [roomWidth * 1.17, -roomDepth * 1.65, roomHeight * 2.45] as [number, number, number], up: [0, 0, 1], fov: 48 }}>
                  <color attach="background" args={['#07101e']} />
                  <RoomPreview width={roomWidth} depth={roomDepth} height={roomHeight} doorwayWidth={doorwayWidth} doorwayHeight={doorwayHeight} portalDiameter={portalDiameter} />
                </Canvas>
              </div>
            )}
            <div style={{ padding: 16 }}>
              <Typography variant="subtitle1" fontWeight={700}>{t('game3d.previewTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('game3d.previewHint')}</Typography>
              {previewUrl && <img src={previewUrl} alt={t('game3d.blenderPreview')} style={{ width: '100%', maxHeight: 460, objectFit: 'contain', marginTop: 16, borderRadius: 8, backgroundColor: '#101827' }} />}
              {auditReport && (
                <Alert severity={auditReport.status === 'passed' ? 'success' : 'warning'} sx={{ mt: 2 }}>
                  {t('game3d.auditSummary')}: {String(auditReport.status || 'unknown')} · {Array.isArray(auditReport.appliedBooleanOpenings) ? auditReport.appliedBooleanOpenings.length : 0} {t('game3d.openingsCut')}
                </Alert>
              )}
              {reviewViews.length > 0 && (
                <Grid container spacing={1.5} sx={{ mt: 1 }}>
                  {reviewViews.map((url, index) => (
                    <Grid item xs={6} md={4} key={url}>
                      <div style={{ backgroundColor: '#101827', borderRadius: 8, overflow: 'hidden', height: '100%' }}>
                        <img src={url} alt={url.split('/').pop() || t('game3d.reviewView')} loading="lazy" style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'contain' }} />
                        <Typography variant="caption" display="block" sx={{ p: 1, color: 'text.secondary' }}>
                          {url.split('/').pop() || (t('game3d.reviewView') + ' ' + (index + 1))}
                        </Typography>
                      </div>
                    </Grid>
                  ))}
                </Grid>
              )}
              {buildUrl && <Alert severity="success" sx={{ mt: 2 }}>{t('game3d.buildReady')} <a href={buildUrl} target="_blank" rel="noreferrer">{t('game3d.downloadProject')}</a></Alert>}
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Game3DBuilder;
