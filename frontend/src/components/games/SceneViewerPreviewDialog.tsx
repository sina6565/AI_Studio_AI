import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

export interface SceneViewerPreviewScene {
  id?: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface SceneViewerPreviewManifest {
  title: string;
  description: string;
  scenes: SceneViewerPreviewScene[];
  assetCount?: number;
}

/** Narrow the job metadata before displaying it as a scene preview. */
export function isSceneViewerPreviewManifest(
  value: unknown,
): value is SceneViewerPreviewManifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const manifest = value as Partial<SceneViewerPreviewManifest>;
  return (
    typeof manifest.title === 'string' &&
    typeof manifest.description === 'string' &&
    Array.isArray(manifest.scenes) &&
    manifest.scenes.length > 0 &&
    manifest.scenes.every(
      (scene) =>
        !!scene &&
        typeof scene.name === 'string' &&
        typeof scene.description === 'string' &&
        (scene.id === undefined || typeof scene.id === 'string') &&
        (scene.imageUrl === undefined || typeof scene.imageUrl === 'string'),
    )
  );
}

/** Only render HTTP(S) images or raster data URLs in the preview. */
export function safePreviewImageUrl(value?: string): string | undefined {
  if (!value) return undefined;

  if (/^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);base64,/i.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : undefined;
  } catch {
    return undefined;
  }
}

interface SceneViewerPreviewDialogProps {
  open: boolean;
  manifest: SceneViewerPreviewManifest;
  onClose: () => void;
}

const SceneViewerPreviewDialog: React.FC<SceneViewerPreviewDialogProps> = ({
  open,
  manifest,
  onClose,
}) => {
  const { t } = useTranslation();
  const [sceneIndex, setSceneIndex] = useState(0);
  const scenes = manifest.scenes;
  const currentScene = scenes[Math.min(sceneIndex, scenes.length - 1)];
  const imageUrl = safePreviewImageUrl(currentScene?.imageUrl);

  useEffect(() => {
    if (open) setSceneIndex(0);
  }, [open]);

  if (!currentScene) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="scene-viewer-preview-title"
      aria-describedby="scene-viewer-preview-description"
    >
      <DialogTitle component="div" sx={{ pr: 6, position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography id="scene-viewer-preview-title" variant="h6" component="h2">
              {manifest.title}
            </Typography>
            <Typography id="scene-viewer-preview-description" variant="body2" color="text.secondary">
              {manifest.description}
            </Typography>
          </Box>
          <IconButton
            aria-label={t('common.close')}
            onClick={onClose}
            size="small"
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            minHeight: { xs: 220, sm: 360 },
            maxHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            bgcolor: 'background.default',
            borderRadius: 1,
          }}
        >
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={currentScene.name}
              sx={{ display: 'block', maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
            />
          ) : (
            <Typography color="text.secondary">{currentScene.name}</Typography>
          )}
        </Box>

        <Typography variant="h6" sx={{ mt: 2 }}>
          {currentScene.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {currentScene.description}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
          {t('jobs.gameplayNote')}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Button
          onClick={() => setSceneIndex((index) => Math.max(0, index - 1))}
          disabled={sceneIndex === 0}
        >
          {t('jobs.previousScene')}
        </Button>
        <Typography variant="body2" aria-live="polite">
          {t('jobs.sceneCounter', { current: sceneIndex + 1, total: scenes.length })}
        </Typography>
        <Button
          onClick={() => setSceneIndex((index) => Math.min(scenes.length - 1, index + 1))}
          disabled={sceneIndex >= scenes.length - 1}
        >
          {t('jobs.nextScene')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SceneViewerPreviewDialog;
