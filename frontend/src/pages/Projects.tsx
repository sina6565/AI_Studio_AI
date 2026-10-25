import React, { useCallback, useState, useEffect } from 'react';
import { Container, Grid, Paper, Button, Box, Typography, Dialog, TextField, Alert, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { parsePlayableGameDefinition } from '../games/playableGame';
import { Job, Project } from '../types';

const Projects: React.FC = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', type: 'mixed_media', description: '' });

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const [projectResponse, jobResponse] = await Promise.all([
        apiClient.listProjects(),
        apiClient.listJobs(),
      ]);
      if (projectResponse.success && projectResponse.data) {
        setProjects(projectResponse.data);
      }
      if (jobResponse.success && jobResponse.data) {
        setJobs(jobResponse.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      setError('Project name is required');
      return;
    }
    try {
      const res = await apiClient.createProject(newProject);
      if (res.success && res.data) {
        setProjects([...projects, res.data]);
        setOpenDialog(false);
        setNewProject({ name: '', type: 'mixed_media', description: '' });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create project');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">{t('pages.projects')}</Typography>
        <Button variant="contained" onClick={() => setOpenDialog(true)}>
          + {t('common.create')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <LinearProgress />
      ) : projects.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">No projects yet</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => {
            const projectId = project.id || project._id || '';
            const gameJobs = jobs.filter(
              (job) =>
                job.type === 'game_build' &&
                ((project.jobs || []).includes(job.id) || job.metadata?.projectId === projectId),
            );
            return (
              <Grid item xs={12} sm={6} md={4} key={projectId || project.name}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" noWrap>
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {project.type}
                  </Typography>
                  {project.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {project.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">{t('projects.gameBuilds')}</Typography>
                    {gameJobs.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        {t('projects.noGameBuilds')}
                      </Typography>
                    ) : (
                      gameJobs.map((job) => {
                        const playableGame = parsePlayableGameDefinition(
                          job.result?.metadata?.playableGame,
                        );
                        const canPlay = job.status === 'completed' && !!playableGame;
                        return (
                          <Box
                            key={job.id}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1 }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" noWrap>
                                {playableGame?.title || String(job.input.title || job.id)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {job.status}
                              </Typography>
                            </Box>
                            {canPlay && (
                              <Button
                                size="small"
                                component={Link}
                                to={`/play/${encodeURIComponent(job.id)}`}
                              >
                                {t('projects.playGame')}
                              </Button>
                            )}
                          </Box>
                        );
                      })
                    )}
                    <Button size="small" component={Link} to="/jobs" sx={{ mt: 1 }}>
                      {t('projects.openJobs')}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create Project
          </Typography>
          <TextField
            label="Project Name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            multiline
            rows={2}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleCreateProject}>
              {t('common.save')}
            </Button>
            <Button variant="outlined" onClick={() => setOpenDialog(false)}>
              {t('common.close')}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
};

export default Projects;
