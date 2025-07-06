import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Get AI service status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const aiService = req.app.locals.aiService;
    const status = await aiService.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error fetching AI status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI status',
    });
  }
});

// Analyze player behavior
router.post('/analyze',
  body('playerId').isString().notEmpty(),
  body('gameId').optional().isString(),
  body('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: errors.array(),
      });
    }

    try {
      const { playerId, gameId, timeframe = 'week' } = req.body;
      const aiService = req.app.locals.aiService;
      
      const analysis = await aiService.analyzePlayer(playerId, gameId, timeframe);
      
      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error('Error analyzing player:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze player',
      });
    }
  }
);

// Get AI recommendations
router.post('/recommendations',
  body('playerId').isString().notEmpty(),
  body('gameId').optional().isString(),
  body('type').optional().isIn(['strategy', 'betting', 'timing', 'risk-management']),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: errors.array(),
      });
    }

    try {
      const { playerId, gameId, type } = req.body;
      const aiService = req.app.locals.aiService;
      
      const recommendations = await aiService.getRecommendations(playerId, gameId, type);
      
      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get recommendations',
      });
    }
  }
);

// Predict game outcome
router.post('/predict',
  body('gameId').isString().notEmpty(),
  body('playerId').optional().isString(),
  body('factors').optional().isArray(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: errors.array(),
      });
    }

    try {
      const { gameId, playerId, factors } = req.body;
      const aiService = req.app.locals.aiService;
      
      const prediction = await aiService.predictOutcome(gameId, playerId, factors);
      
      res.json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      console.error('Error predicting outcome:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to predict outcome',
      });
    }
  }
);

// Detect fraud
router.post('/fraud-detect',
  body('gameId').isString().notEmpty(),
  body('playerId').isString().notEmpty(),
  body('data').isObject(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: errors.array(),
      });
    }

    try {
      const { gameId, playerId, data } = req.body;
      const aiService = req.app.locals.aiService;
      
      const fraudScore = await aiService.detectFraud(gameId, playerId, data);
      
      res.json({
        success: true,
        data: { fraudScore },
      });
    } catch (error) {
      console.error('Error detecting fraud:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to detect fraud',
      });
    }
  }
);

// Optimize strategy
router.post('/optimize',
  body('playerId').isString().notEmpty(),
  body('gameType').isString().notEmpty(),
  body('constraints').optional().isObject(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: errors.array(),
      });
    }

    try {
      const { playerId, gameType, constraints } = req.body;
      const aiService = req.app.locals.aiService;
      
      const strategies = await aiService.optimizeStrategy(playerId, gameType, constraints);
      
      res.json({
        success: true,
        data: strategies,
      });
    } catch (error) {
      console.error('Error optimizing strategy:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to optimize strategy',
      });
    }
  }
);

// Get AI insights
router.get('/insights',
  query('type').optional().isIn(['fraud', 'behavior', 'prediction', 'optimization']),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: errors.array(),
      });
    }

    try {
      const { type, limit = 10 } = req.query;
      const aiService = req.app.locals.aiService;
      
      const insights = await aiService.getInsights(type as string, parseInt(limit as string));
      
      res.json({
        success: true,
        data: insights,
        count: insights.length,
      });
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI insights',
      });
    }
  }
);

// Get AI model performance
router.get('/performance',
  query('model').optional().isIn(['novaSanctum', 'athenaMist', 'unified']),
  query('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: errors.array(),
      });
    }

    try {
      const { model, timeframe = 'day' } = req.query;
      const aiService = req.app.locals.aiService;
      
      const performance = await aiService.getModelPerformance(model as string, timeframe as string);
      
      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      console.error('Error fetching AI performance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI performance',
      });
    }
  }
);

// Enable/disable AI feature
router.post('/features/:featureId',
  param('featureId').isString().notEmpty(),
  body('enabled').isBoolean(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: errors.array(),
      });
    }

    try {
      const { featureId } = req.params;
      const { enabled } = req.body;
      const aiService = req.app.locals.aiService;
      
      if (enabled) {
        await aiService.enableFeature(featureId);
      } else {
        await aiService.disableFeature(featureId);
      }
      
      res.json({
        success: true,
        message: `Feature ${featureId} ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling AI feature:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to toggle AI feature',
      });
    }
  }
);

// Get available AI features
router.get('/features', async (req: Request, res: Response) => {
  try {
    const aiService = req.app.locals.aiService;
    const features = await aiService.getFeatures();
    
    res.json({
      success: true,
      data: features,
    });
  } catch (error) {
    console.error('Error fetching AI features:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI features',
    });
  }
});

// Get AI service metrics
router.get('/metrics',
  query('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: errors.array(),
      });
    }

    try {
      const { timeframe = 'day' } = req.query;
      const aiService = req.app.locals.aiService;
      
      const metrics = await aiService.getMetrics(timeframe as string);
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Error fetching AI metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI metrics',
      });
    }
  }
);

// Get AI service logs
router.get('/logs',
  query('level').optional().isIn(['debug', 'info', 'warn', 'error']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: errors.array(),
      });
    }

    try {
      const { level, limit = 50, offset = 0 } = req.query;
      const aiService = req.app.locals.aiService;
      
      const logs = await aiService.getLogs(
        level as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json({
        success: true,
        data: logs,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: logs.length,
        },
      });
    } catch (error) {
      console.error('Error fetching AI logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI logs',
      });
    }
  }
);

// Test AI service connection
router.post('/test', async (req: Request, res: Response) => {
  try {
    const aiService = req.app.locals.aiService;
    const testResult = await aiService.testConnection();
    
    res.json({
      success: true,
      data: testResult,
    });
  } catch (error) {
    console.error('Error testing AI service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test AI service',
    });
  }
});

export default router; 