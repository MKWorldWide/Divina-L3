import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { GameRequest } from '../../types/api';

const router = Router();

// Get all available games
router.get('/available', async (req: Request, res: Response) => {
  try {
    const { category, status, minBet, maxBet } = req.query;
    
    // Build filter object
    const filters: any = {};
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (minBet) filters.minBet = { $gte: parseFloat(minBet as string) };
    if (maxBet) filters.maxBet = { $lte: parseFloat(maxBet as string) };

    const games = await req.app.locals.databaseService.getGames(filters);
    
    res.json({
      success: true,
      data: games,
      count: games.length,
    });
  } catch (error) {
    console.error('Error fetching available games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available games',
    });
  }
});

// Get game by ID
router.get('/:gameId', 
  param('gameId').isString().notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game ID',
        details: errors.array(),
      });
    }

    try {
      const { gameId } = req.params;
      const game = await req.app.locals.databaseService.getGameById(gameId);
      
      if (!game) {
        return res.status(404).json({
          success: false,
          error: 'Game not found',
        });
      }

      res.json({
        success: true,
        data: game,
      });
    } catch (error) {
      console.error('Error fetching game:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game',
      });
    }
  }
);

// Create a new game
router.post('/create',
  body('name').isString().notEmpty(),
  body('type').isIn(['casino', 'esports', 'puzzle', 'tournament']),
  body('maxPlayers').isInt({ min: 2, max: 100 }),
  body('minBet').isFloat({ min: 0 }),
  body('maxBet').isFloat({ min: 0 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game data',
        details: errors.array(),
      });
    }

    try {
      const gameData = req.body;
      const creatorAddress = req.user?.address;

      if (!creatorAddress) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const gameId = await req.app.locals.gamingEngine.createGame(creatorAddress, gameData);
      
      res.status(201).json({
        success: true,
        data: { gameId },
        message: 'Game created successfully',
      });
    } catch (error) {
      console.error('Error creating game:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create game',
      });
    }
  }
);

// Join a game
router.post('/:gameId/join',
  param('gameId').isString().notEmpty(),
  body('bet').isFloat({ min: 0 }),
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
      const { gameId } = req.params;
      const { bet } = req.body;
      const playerAddress = req.user?.address;

      if (!playerAddress) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await req.app.locals.gamingEngine.joinGame(playerAddress, gameId, bet);
      
      res.json({
        success: true,
        message: 'Successfully joined game',
      });
    } catch (error) {
      console.error('Error joining game:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to join game',
      });
    }
  }
);

// Leave a game
router.post('/:gameId/leave',
  param('gameId').isString().notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game ID',
        details: errors.array(),
      });
    }

    try {
      const { gameId } = req.params;
      const playerAddress = req.user?.address;

      if (!playerAddress) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await req.app.locals.gamingEngine.leaveGame(playerAddress, gameId);
      
      res.json({
        success: true,
        message: 'Successfully left game',
      });
    } catch (error) {
      console.error('Error leaving game:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to leave game',
      });
    }
  }
);

// Make a move in a game
router.post('/:gameId/move',
  param('gameId').isString().notEmpty(),
  body('move').notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid move data',
        details: errors.array(),
      });
    }

    try {
      const { gameId } = req.params;
      const { move } = req.body;
      const playerAddress = req.user?.address;

      if (!playerAddress) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await req.app.locals.gamingEngine.makeMove(playerAddress, gameId, move);
      
      res.json({
        success: true,
        message: 'Move made successfully',
      });
    } catch (error) {
      console.error('Error making move:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to make move',
      });
    }
  }
);

// Place a bet in a game
router.post('/:gameId/bet',
  param('gameId').isString().notEmpty(),
  body('amount').isFloat({ min: 0 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bet data',
        details: errors.array(),
      });
    }

    try {
      const { gameId } = req.params;
      const { amount } = req.body;
      const playerAddress = req.user?.address;

      if (!playerAddress) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await req.app.locals.gamingEngine.placeBet(playerAddress, gameId, amount);
      
      res.json({
        success: true,
        message: 'Bet placed successfully',
      });
    } catch (error) {
      console.error('Error placing bet:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to place bet',
      });
    }
  }
);

// Get game history for a player
router.get('/history/:playerId',
  param('playerId').isString().notEmpty(),
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
      const { playerId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const games = await req.app.locals.databaseService.getPlayerGameHistory(
        playerId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json({
        success: true,
        data: games,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: games.length,
        },
      });
    } catch (error) {
      console.error('Error fetching game history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game history',
      });
    }
  }
);

// Get recent games
router.get('/recent',
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
      const { limit = 10 } = req.query;
      const games = await req.app.locals.databaseService.getRecentGames(parseInt(limit as string));
      
      res.json({
        success: true,
        data: games,
        count: games.length,
      });
    } catch (error) {
      console.error('Error fetching recent games:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recent games',
      });
    }
  }
);

// Get game statistics
router.get('/stats',
  query('timeframe').optional().isIn(['day', 'week', 'month', 'year']),
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
      const { timeframe = 'week' } = req.query;
      const stats = await req.app.locals.databaseService.getGameStats(timeframe as string);
      
      res.json({
        success: true,
        data: stats,
        timeframe,
      });
    } catch (error) {
      console.error('Error fetching game stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game statistics',
      });
    }
  }
);

// Get active games
router.get('/active',
  async (req: Request, res: Response) => {
    try {
      const activeGames = req.app.locals.gamingEngine.getActiveGames();
      
      res.json({
        success: true,
        data: activeGames,
        count: activeGames.length,
      });
    } catch (error) {
      console.error('Error fetching active games:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active games',
      });
    }
  }
);

// Get game leaderboard
router.get('/:gameId/leaderboard',
  param('gameId').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
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
      const { gameId } = req.params;
      const { limit = 20 } = req.query;
      
      const leaderboard = await req.app.locals.databaseService.getGameLeaderboard(
        gameId,
        parseInt(limit as string)
      );
      
      res.json({
        success: true,
        data: leaderboard,
        count: leaderboard.length,
      });
    } catch (error) {
      console.error('Error fetching game leaderboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game leaderboard',
      });
    }
  }
);

export default router; 