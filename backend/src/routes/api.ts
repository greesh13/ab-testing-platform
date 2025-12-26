import { Router } from 'express';
import { experimentService } from '../services/experimentService';

const router = Router();

// Create experiment
router.post('/experiments', async (req, res) => {
  try {
    const experiment = await experimentService.createExperiment(req.body);
    res.status(201).json(experiment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get all experiments
router.get('/experiments', async (req, res) => {
  try {
    const experiments = await experimentService.getExperiments();
    res.json(experiments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single experiment
router.get('/experiments/:id', async (req, res) => {
  try {
    const experiment = await experimentService.getExperiment(parseInt(req.params.id));
    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }
    res.json(experiment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update experiment status
router.patch('/experiments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const experiment = await experimentService.updateExperimentStatus(
      parseInt(req.params.id),
      status
    );
    res.json(experiment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Assign user to variant
router.post('/experiments/:id/assign', async (req, res) => {
  try {
    const { userId } = req.body;
    const variant = await experimentService.assignUserToVariant(
      parseInt(req.params.id),
      userId
    );
    res.json({ variant });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Track event
router.post('/events', async (req, res) => {
  try {
    await experimentService.trackEvent(req.body);
    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get experiment results
router.get('/experiments/:id/results', async (req, res) => {
  try {
    const results = await experimentService.getResults(parseInt(req.params.id));
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;