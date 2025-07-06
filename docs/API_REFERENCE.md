# GameDin L3 + AthenaMist AI API Reference

## 🌐 API Overview

The GameDin L3 API provides comprehensive endpoints for gaming, AI services, blockchain interactions, and user management. All endpoints are RESTful and support JSON request/response formats.

### Base URLs
- **Development**: `https://dev-api.gamedin-l3.com`
- **Staging**: `https://staging-api.gamedin-l3.com`
- **Production**: `https://api.gamedin-l3.com`

### Authentication
All API requests require authentication using JWT tokens in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting
- **Standard**: 1000 requests per hour
- **AI Services**: 100 requests per hour
- **Blockchain**: 500 requests per hour

## 🔐 Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "wallet_address": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "string",
    "username": "string",
    "email": "string",
    "wallet_address": "string",
    "token": "string"
  }
}
```

### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "string",
    "username": "string",
    "token": "string",
    "refresh_token": "string"
  }
}
```

### POST /auth/refresh
Refresh JWT token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "refresh_token": "string"
  }
}
```

### POST /auth/logout
Logout user and invalidate tokens.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 🎮 Gaming Endpoints

### GET /games
Get list of available games.

**Query Parameters:**
- `category` (string): Filter by game category
- `status` (string): Filter by game status (active, inactive)
- `limit` (number): Number of games to return (default: 20)
- `offset` (number): Number of games to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "games": [
      {
        "game_id": "string",
        "name": "string",
        "description": "string",
        "category": "string",
        "status": "string",
        "min_players": "number",
        "max_players": "number",
        "entry_fee": "string",
        "prize_pool": "string",
        "created_at": "string"
      }
    ],
    "total": "number",
    "limit": "number",
    "offset": "number"
  }
}
```

### POST /games
Create a new game.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "min_players": "number",
  "max_players": "number",
  "entry_fee": "string",
  "rules": "object"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "game_id": "string",
    "name": "string",
    "status": "string",
    "created_at": "string"
  }
}
```

### GET /games/{game_id}
Get detailed information about a specific game.

**Response:**
```json
{
  "success": true,
  "data": {
    "game_id": "string",
    "name": "string",
    "description": "string",
    "category": "string",
    "status": "string",
    "min_players": "number",
    "max_players": "number",
    "current_players": "number",
    "entry_fee": "string",
    "prize_pool": "string",
    "rules": "object",
    "ai_insights": "object",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

### POST /games/{game_id}/join
Join a game.

**Request Body:**
```json
{
  "wallet_address": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "string",
    "game_id": "string",
    "player_id": "string",
    "status": "string",
    "websocket_url": "string"
  }
}
```

### POST /games/{game_id}/leave
Leave a game.

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "string",
    "refund_amount": "string"
  }
}
```

### GET /games/{game_id}/players
Get list of players in a game.

**Response:**
```json
{
  "success": true,
  "data": {
    "players": [
      {
        "player_id": "string",
        "username": "string",
        "wallet_address": "string",
        "joined_at": "string",
        "status": "string"
      }
    ]
  }
}
```

### GET /games/{game_id}/results
Get game results and leaderboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "game_id": "string",
    "status": "string",
    "results": [
      {
        "player_id": "string",
        "username": "string",
        "rank": "number",
        "score": "number",
        "reward": "string",
        "ai_analysis": "object"
      }
    ],
    "prize_distribution": "object"
  }
}
```

## 🤖 AI Services Endpoints

### POST /ai/nova-sanctum/analyze
Analyze player behavior and detect fraud using NovaSanctum AI.

**Request Body:**
```json
{
  "player_id": "string",
  "game_data": {
    "game_id": "string",
    "actions": "array",
    "timing": "object",
    "patterns": "object"
  },
  "historical_data": "object"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fraud_score": "number",
    "risk_level": "string",
    "anomalies": [
      {
        "type": "string",
        "description": "string",
        "confidence": "number"
      }
    ],
    "recommendations": [
      {
        "action": "string",
        "reason": "string",
        "priority": "string"
      }
    ],
    "analysis_metadata": "object"
  }
}
```

### POST /ai/athena-mist/strategize
Get strategic recommendations using AthenaMist AI.

**Request Body:**
```json
{
  "player_id": "string",
  "game_context": {
    "game_id": "string",
    "current_state": "object",
    "available_actions": "array",
    "opponent_data": "object"
  },
  "player_profile": "object"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "strategies": [
      {
        "strategy_id": "string",
        "name": "string",
        "description": "string",
        "confidence": "number",
        "expected_outcome": "object",
        "actions": "array"
      }
    ],
    "optimization_suggestions": [
      {
        "category": "string",
        "suggestion": "string",
        "impact": "string"
      }
    ],
    "performance_prediction": "object"
  }
}
```

### POST /ai/unified/consensus
Get consensus analysis from both AI services.

**Request Body:**
```json
{
  "player_id": "string",
  "game_data": "object",
  "analysis_type": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "consensus_score": "number",
    "nova_sanctum_analysis": "object",
    "athena_mist_analysis": "object",
    "unified_recommendation": "object",
    "confidence_metrics": "object"
  }
}
```

### GET /ai/insights/{player_id}
Get AI insights for a specific player.

**Response:**
```json
{
  "success": true,
  "data": {
    "player_id": "string",
    "behavior_analysis": "object",
    "performance_trends": "object",
    "risk_assessment": "object",
    "optimization_opportunities": "array",
    "ai_recommendations": "array"
  }
}
```

### POST /ai/models/update
Update AI models (admin only).

**Request Body:**
```json
{
  "model_type": "string",
  "model_version": "string",
  "model_url": "string",
  "parameters": "object"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model_id": "string",
    "status": "string",
    "update_time": "string"
  }
}
```

## ⛓️ Blockchain Endpoints

### GET /blockchain/status
Get blockchain network status.

**Response:**
```json
{
  "success": true,
  "data": {
    "network": "string",
    "block_height": "number",
    "gas_price": "string",
    "pending_transactions": "number",
    "last_block_time": "string"
  }
}
```

### POST /blockchain/transactions
Submit a blockchain transaction.

**Request Body:**
```json
{
  "contract_address": "string",
  "function_name": "string",
  "parameters": "array",
  "gas_limit": "number",
  "gas_price": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction_hash": "string",
    "status": "string",
    "gas_used": "number",
    "block_number": "number"
  }
}
```

### GET /blockchain/transactions/{tx_hash}
Get transaction details.

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction_hash": "string",
    "block_number": "number",
    "from": "string",
    "to": "string",
    "value": "string",
    "gas_used": "number",
    "status": "string",
    "timestamp": "string"
  }
}
```

### GET /blockchain/balance/{address}
Get token balance for an address.

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "string",
    "gdi_balance": "string",
    "eth_balance": "string",
    "nft_count": "number"
  }
}
```

### POST /blockchain/bridge/transfer
Initiate cross-chain transfer.

**Request Body:**
```json
{
  "source_chain": "string",
  "destination_chain": "string",
  "token_address": "string",
  "amount": "string",
  "recipient": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bridge_id": "string",
    "source_tx_hash": "string",
    "status": "string",
    "estimated_completion": "string"
  }
}
```

### GET /blockchain/bridge/status/{bridge_id}
Get bridge transfer status.

**Response:**
```json
{
  "success": true,
  "data": {
    "bridge_id": "string",
    "source_chain": "string",
    "destination_chain": "string",
    "status": "string",
    "source_tx_hash": "string",
    "destination_tx_hash": "string",
    "created_at": "string",
    "completed_at": "string"
  }
}
```

## 🎨 NFT Marketplace Endpoints

### GET /nft/collections
Get list of NFT collections.

**Query Parameters:**
- `category` (string): Filter by category
- `creator` (string): Filter by creator address
- `limit` (number): Number of collections to return
- `offset` (number): Number of collections to skip

**Response:**
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "collection_id": "string",
        "name": "string",
        "description": "string",
        "creator": "string",
        "total_supply": "number",
        "floor_price": "string",
        "volume_24h": "string"
      }
    ],
    "total": "number"
  }
}
```

### POST /nft/mint
Mint a new NFT.

**Request Body:**
```json
{
  "collection_id": "string",
  "name": "string",
  "description": "string",
  "metadata": "object",
  "royalties": "number"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token_id": "string",
    "transaction_hash": "string",
    "metadata_uri": "string"
  }
}
```

### GET /nft/{token_id}
Get NFT details.

**Response:**
```json
{
  "success": true,
  "data": {
    "token_id": "string",
    "collection_id": "string",
    "name": "string",
    "description": "string",
    "owner": "string",
    "creator": "string",
    "metadata": "object",
    "price_history": "array",
    "ai_valuation": "object"
  }
}
```

### POST /nft/{token_id}/list
List NFT for sale.

**Request Body:**
```json
{
  "price": "string",
  "auction_duration": "number",
  "reserve_price": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listing_id": "string",
    "status": "string",
    "transaction_hash": "string"
  }
}
```

### POST /nft/{token_id}/bid
Place bid on NFT auction.

**Request Body:**
```json
{
  "bid_amount": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bid_id": "string",
    "status": "string",
    "transaction_hash": "string"
  }
}
```

## 👤 User Management Endpoints

### GET /users/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "string",
    "username": "string",
    "email": "string",
    "wallet_address": "string",
    "avatar": "string",
    "stats": {
      "games_played": "number",
      "games_won": "number",
      "total_earnings": "string",
      "rank": "string"
    },
    "preferences": "object",
    "created_at": "string"
  }
}
```

### PUT /users/profile
Update user profile.

**Request Body:**
```json
{
  "username": "string",
  "avatar": "string",
  "preferences": "object"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "string",
    "updated_fields": "array"
  }
}
```

### GET /users/{user_id}/stats
Get user statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "string",
    "game_stats": {
      "total_games": "number",
      "wins": "number",
      "losses": "number",
      "win_rate": "number"
    },
    "earnings": {
      "total_earned": "string",
      "total_spent": "string",
      "net_profit": "string"
    },
    "achievements": "array",
    "rankings": "array"
  }
}
```

### GET /users/{user_id}/history
Get user game history.

**Query Parameters:**
- `limit` (number): Number of games to return
- `offset` (number): Number of games to skip
- `status` (string): Filter by game status

**Response:**
```json
{
  "success": true,
  "data": {
    "games": [
      {
        "game_id": "string",
        "name": "string",
        "result": "string",
        "earnings": "string",
        "played_at": "string"
      }
    ],
    "total": "number"
  }
}
```

## 📊 Analytics Endpoints

### GET /analytics/overview
Get platform overview statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": "number",
    "active_users_24h": "number",
    "total_games": "number",
    "games_24h": "number",
    "total_volume": "string",
    "volume_24h": "string",
    "ai_accuracy": "number",
    "fraud_detection_rate": "number"
  }
}
```

### GET /analytics/games
Get game analytics.

**Query Parameters:**
- `timeframe` (string): Time period (24h, 7d, 30d, all)
- `category` (string): Filter by game category

**Response:**
```json
{
  "success": true,
  "data": {
    "popular_games": "array",
    "revenue_by_game": "array",
    "player_engagement": "object",
    "ai_performance": "object"
  }
}
```

### GET /analytics/ai
Get AI service analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "nova_sanctum": {
      "requests_24h": "number",
      "accuracy": "number",
      "fraud_detected": "number"
    },
    "athena_mist": {
      "requests_24h": "number",
      "accuracy": "number",
      "strategies_generated": "number"
    },
    "unified_service": {
      "consensus_rate": "number",
      "performance": "object"
    }
  }
}
```

## 🔧 System Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "string",
  "version": "string",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "blockchain": "healthy",
    "ai_services": "healthy"
  }
}
```

### GET /metrics
Get system metrics (admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "system": {
      "cpu_usage": "number",
      "memory_usage": "number",
      "disk_usage": "number"
    },
    "application": {
      "requests_per_second": "number",
      "response_time": "number",
      "error_rate": "number"
    },
    "database": {
      "connections": "number",
      "query_time": "number"
    }
  }
}
```

## 🚨 Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": "array"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "retry_after": "number"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```

## 📝 WebSocket API

### Connection
Connect to WebSocket for real-time updates:
```
wss://api.gamedin-l3.com/ws
```

### Authentication
Send authentication message:
```json
{
  "type": "auth",
  "token": "your-jwt-token"
}
```

### Game Events
Receive real-time game updates:
```json
{
  "type": "game_update",
  "game_id": "string",
  "event": "string",
  "data": "object"
}
```

### AI Insights
Receive real-time AI insights:
```json
{
  "type": "ai_insight",
  "player_id": "string",
  "insight_type": "string",
  "data": "object"
}
```

## 🔗 SDKs and Libraries

### JavaScript/TypeScript SDK
```bash
npm install @gamedin-l3/sdk
```

```javascript
import { GameDinL3 } from '@gamedin-l3/sdk';

const client = new GameDinL3({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Use the client
const games = await client.games.list();
const aiAnalysis = await client.ai.novaSanctum.analyze(data);
```

### Python SDK
```bash
pip install gamedin-l3-sdk
```

```python
from gamedin_l3 import GameDinL3

client = GameDinL3(
    api_key='your-api-key',
    environment='production'
)

# Use the client
games = client.games.list()
ai_analysis = client.ai.nova_sanctum.analyze(data)
```

---

This API reference provides comprehensive documentation for all GameDin L3 + AthenaMist AI endpoints. For additional support, please refer to the developer documentation or contact the development team. 