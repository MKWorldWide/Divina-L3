#!/bin/bash

# GameDin L3 + AthenaMist Integration
# Complete integration between GameDin L3 gaming blockchain and AthenaMist AI framework

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🌟 GameDin L3 + AthenaMist Integration${NC}"
echo -e "${PURPLE}========================================${NC}"

# Create AthenaMist integration structure
create_athenamist_integration() {
    echo -e "${YELLOW}🔮 Creating AthenaMist integration...${NC}"
    
    mkdir -p integrations/athenamist/{src,config,services,adapters}
    
    # AthenaMist Integration Service
    cat > integrations/athenamist/src/AthenaMistIntegration.ts << 'EOF'
import { ethers } from 'ethers';
import axios from 'axios';

export interface AthenaMistAIData {
  playerId: string;
  aiAnalysis: {
    behaviorScore: number;
    trustLevel: number;
    riskAssessment: number;
    playerInsights: any;
  };
  recommendations: string[];
  fraudDetection: {
    isSuspicious: boolean;
    riskScore: number;
    reasons: string[];
  };
}

export class AthenaMistIntegration {
  private apiKey: string;
  private apiUrl: string;
  private provider: ethers.providers.Provider;
  
  constructor(apiKey: string, provider: ethers.providers.Provider) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.athenamist.ai/v1';
    this.provider = provider;
  }
  
  // Get AI analysis for player using AthenaMist
  async analyzePlayer(playerId: string, gameData: any): Promise<AthenaMistAIData> {
    try {
      const response = await axios.post(`${this.apiUrl}/analyze-player`, {
        playerId,
        gameData,
        includeInsights: true,
        includeFraudDetection: true
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-GameDin-Integration': 'v1.0'
        }
      });
      
      return this.processAthenaMistResponse(response.data);
    } catch (error) {
      console.error('AthenaMist AI analysis failed:', error);
      throw error;
    }
  }
  
  // Real-time fraud detection with AthenaMist
  async detectFraud(playerId: string, transactionData: any): Promise<{
    isFraud: boolean;
    riskScore: number;
    reasons: string[];
    actionRecommended: string;
  }> {
    const response = await axios.post(`${this.apiUrl}/fraud-detection`, {
      playerId,
      transactionData,
      realTime: true
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Priority': 'high'
      }
    });
    
    return response.data;
  }
  
  // Process AthenaMist response
  private processAthenaMistResponse(data: any): AthenaMistAIData {
    return {
      playerId: data.playerId,
      aiAnalysis: {
        behaviorScore: Math.min(100, Math.max(0, data.behaviorScore)),
        trustLevel: data.trustLevel,
        riskAssessment: data.riskAssessment,
        playerInsights: data.insights
      },
      recommendations: data.recommendations || [],
      fraudDetection: data.fraudDetection
    };
  }
  
  // Encode data for smart contract
  encodeForContract(aiData: AthenaMistAIData): string {
    return ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'uint256', 'uint256', 'bytes32'],
      [
        aiData.aiAnalysis.behaviorScore,
        aiData.aiAnalysis.trustLevel,
        aiData.aiAnalysis.riskAssessment,
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(aiData.aiAnalysis.playerInsights)))
      ]
    );
  }
}

export default AthenaMistIntegration;
EOF

    # AthenaMist Gaming Adapter
    cat > integrations/athenamist/src/GamingAdapter.ts << 'EOF'
import { AthenaMistIntegration } from './AthenaMistIntegration';
import { ethers } from 'ethers';

export class AthenaMistGamingAdapter {
  private athenaMist: AthenaMistIntegration;
  private gameDinContract: ethers.Contract;
  
  constructor(athenaMist: AthenaMistIntegration, gameDinContract: ethers.Contract) {
    this.athenaMist = athenaMist;
    this.gameDinContract = gameDinContract;
  }
  
  // Process game reward with AthenaMist AI
  async processGameReward(player: string, amount: string, reason: string): Promise<void> {
    try {
      // Get game data
      const gameData = await this.collectGameData(player);
      
      // Get AthenaMist AI analysis
      const aiData = await this.athenaMist.analyzePlayer(player, gameData);
      
      // Check for fraud
      const fraudCheck = await this.athenaMist.detectFraud(player, {
        amount,
        reason,
        timestamp: Date.now()
      });
      
      if (fraudCheck.isFraud) {
        console.warn(`🚨 AthenaMist fraud detected for player ${player}:`, fraudCheck.reasons);
        return;
      }
      
      // Encode AI data for smart contract
      const encodedData = this.athenaMist.encodeForContract(aiData);
      
      // Reward player with AI-enhanced calculation
      await this.gameDinContract.rewardPlayer(player, amount, reason, encodedData);
      
      console.log('🧠 AthenaMist AI Analysis:', {
        player,
        behaviorScore: aiData.aiAnalysis.behaviorScore,
        trustLevel: aiData.aiAnalysis.trustLevel,
        recommendations: aiData.recommendations
      });
      
    } catch (error) {
      console.error('Error processing game reward with AthenaMist:', error);
    }
  }
  
  // Collect game data for AI analysis
  private async collectGameData(player: string): Promise<any> {
    const profile = await this.gameDinContract.getPlayerProfile(player);
    
    return {
      playerAddress: player,
      profile: {
        xp: profile.xp.toString(),
        level: profile.level.toString(),
        prestige: profile.prestige.toString(),
        lastActivity: profile.lastActivity.toString()
      },
      timestamp: Date.now()
    };
  }
}

export default AthenaMistGamingAdapter;
EOF

    echo -e "${GREEN}✅ AthenaMist integration created${NC}"
}

# Create unified AI service
create_unified_ai_service() {
    echo -e "${YELLOW}🤖 Creating unified AI service...${NC}"
    
    cat > integrations/athenamist/src/UnifiedAIService.ts << 'EOF'
import { NovaSanctumOracle } from '../novasanctum/src/NovaSanctumOracle';
import { AthenaMistIntegration } from './AthenaMistIntegration';
import { ethers } from 'ethers';

export class UnifiedAIService {
  private novaSanctum: NovaSanctumOracle;
  private athenaMist: AthenaMistIntegration;
  private gameDinContract: ethers.Contract;
  
  constructor(
    novaSanctum: NovaSanctumOracle,
    athenaMist: AthenaMistIntegration,
    gameDinContract: ethers.Contract
  ) {
    this.novaSanctum = novaSanctum;
    this.athenaMist = athenaMist;
    this.gameDinContract = gameDinContract;
  }
  
  // Get combined AI analysis from both services
  async getCombinedAIAnalysis(playerId: string, gameData: any): Promise<{
    novaSanctum: any;
    athenaMist: any;
    combined: {
      behaviorScore: number;
      trustLevel: number;
      riskAssessment: number;
      recommendations: string[];
    };
  }> {
    try {
      // Get analysis from both AI services
      const [novaSanctumData, athenaMistData] = await Promise.all([
        this.novaSanctum.getPlayerAIAnalysis(playerId, gameData),
        this.athenaMist.analyzePlayer(playerId, gameData)
      ]);
      
      // Combine and weight the results
      const combined = this.combineAIResults(novaSanctumData, athenaMistData);
      
      return {
        novaSanctum: novaSanctumData,
        athenaMist: athenaMistData,
        combined
      };
    } catch (error) {
      console.error('Combined AI analysis failed:', error);
      throw error;
    }
  }
  
  // Combine results from both AI services
  private combineAIResults(novaSanctum: any, athenaMist: any): any {
    // Weight NovaSanctum at 60% and AthenaMist at 40%
    const novaSanctumWeight = 0.6;
    const athenaMistWeight = 0.4;
    
    const behaviorScore = Math.round(
      (novaSanctum.aiScore * novaSanctumWeight) + 
      (athenaMist.aiAnalysis.behaviorScore * athenaMistWeight)
    );
    
    const trustLevel = Math.round(
      (novaSanctum.trustLevel * novaSanctumWeight) + 
      (athenaMist.aiAnalysis.trustLevel * athenaMistWeight)
    );
    
    const riskAssessment = Math.round(
      (novaSanctum.riskAssessment * novaSanctumWeight) + 
      (athenaMist.aiAnalysis.riskAssessment * athenaMistWeight)
    );
    
    // Combine recommendations
    const recommendations = [
      ...novaSanctum.recommendations,
      ...athenaMist.recommendations
    ].filter((rec, index, arr) => arr.indexOf(rec) === index); // Remove duplicates
    
    return {
      behaviorScore,
      trustLevel,
      riskAssessment,
      recommendations
    };
  }
  
  // Process game reward with unified AI
  async processGameReward(player: string, amount: string, reason: string): Promise<void> {
    try {
      const gameData = await this.collectGameData(player);
      const aiAnalysis = await this.getCombinedAIAnalysis(player, gameData);
      
      // Check fraud detection from both services
      const [novaSanctumFraud, athenaMistFraud] = await Promise.all([
        this.novaSanctum.detectFraud(player, { amount, reason, timestamp: Date.now() }),
        this.athenaMist.detectFraud(player, { amount, reason, timestamp: Date.now() })
      ]);
      
      // If either service detects fraud, block the transaction
      if (novaSanctumFraud.isFraud || athenaMistFraud.isFraud) {
        console.warn(`🚨 Fraud detected for player ${player}:`, {
          novaSanctum: novaSanctumFraud.reasons,
          athenaMist: athenaMistFraud.reasons
        });
        return;
      }
      
      // Encode combined AI data
      const encodedData = this.encodeCombinedData(aiAnalysis.combined);
      
      // Reward player
      await this.gameDinContract.rewardPlayer(player, amount, reason, encodedData);
      
      console.log('🤖 Unified AI Analysis:', {
        player,
        behaviorScore: aiAnalysis.combined.behaviorScore,
        trustLevel: aiAnalysis.combined.trustLevel,
        recommendations: aiAnalysis.combined.recommendations
      });
      
    } catch (error) {
      console.error('Error processing game reward with unified AI:', error);
    }
  }
  
  // Collect game data
  private async collectGameData(player: string): Promise<any> {
    const profile = await this.gameDinContract.getPlayerProfile(player);
    
    return {
      playerAddress: player,
      profile: {
        xp: profile.xp.toString(),
        level: profile.level.toString(),
        prestige: profile.prestige.toString(),
        lastActivity: profile.lastActivity.toString()
      },
      timestamp: Date.now()
    };
  }
  
  // Encode combined AI data for smart contract
  private encodeCombinedData(combinedData: any): string {
    return ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'uint256', 'uint256', 'bytes32'],
      [
        combinedData.behaviorScore,
        combinedData.trustLevel,
        combinedData.riskAssessment,
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(combinedData)))
      ]
    );
  }
}

export default UnifiedAIService;
EOF

    echo -e "${GREEN}✅ Unified AI service created${NC}"
}

# Create integration configuration
create_integration_config() {
    echo -e "${YELLOW}⚙️ Creating integration configuration...${NC}"
    
    cat > integrations/athenamist/config.js << 'EOF'
module.exports = {
  // AthenaMist Configuration
  athenaMist: {
    apiKey: process.env.ATHENAMIST_API_KEY,
    apiUrl: process.env.ATHENAMIST_API_URL || 'https://api.athenamist.ai/v1',
    features: {
      aiAnalysis: process.env.ENABLE_ATHENAMIST_ANALYSIS === 'true',
      fraudDetection: process.env.ENABLE_ATHENAMIST_FRAUD === 'true',
      realtimeUpdates: true
    }
  },
  
  // NovaSanctum Configuration
  novaSanctum: {
    apiKey: process.env.NOVASANCTUM_API_KEY,
    apiUrl: process.env.NOVASANCTUM_API_URL || 'https://api.novasanctum.com/v2',
    features: {
      aiAnalysis: process.env.ENABLE_NOVASANCTUM_ANALYSIS === 'true',
      fraudDetection: process.env.ENABLE_NOVASANCTUM_FRAUD === 'true',
      realtimeUpdates: true
    }
  },
  
  // Unified AI Configuration
  unified: {
    enableCombinedAnalysis: process.env.ENABLE_UNIFIED_AI === 'true',
    novaSanctumWeight: 0.6,
    athenaMistWeight: 0.4,
    fallbackToSingle: true
  },
  
  // Limits and Rate Limiting
  limits: {
    requestsPerMinute: 100,
    batchSize: 50,
    retryAttempts: 3,
    timeoutMs: 10000
  }
};
EOF

    echo -e "${GREEN}✅ Integration configuration created${NC}"
}

# Create integration sync script
create_integration_sync() {
    echo -e "${YELLOW}🔄 Creating integration sync script...${NC}"
    
    cat > integrations/athenamist/sync.js << 'EOF'
const { UnifiedAIService } = require('./src/UnifiedAIService');
const { NovaSanctumOracle } = require('../novasanctum/src/NovaSanctumOracle');
const { AthenaMistIntegration } = require('./src/AthenaMistIntegration');
const { ethers } = require('ethers');
const config = require('./config');

async function syncAthenaMistIntegration() {
    console.log('🔮 Starting AthenaMist + NovaSanctum integration...');
    
    try {
        // Initialize provider
        const provider = new ethers.providers.JsonRpcProvider(
            process.env.L3_RPC_URL || 'http://localhost:8545'
        );
        
        // Initialize AI services
        const novaSanctum = new NovaSanctumOracle(config.novaSanctum.apiKey, provider);
        const athenaMist = new AthenaMistIntegration(config.athenaMist.apiKey, provider);
        
        // Test connections
        console.log('🔍 Testing AI service connections...');
        
        // Test NovaSanctum
        try {
            const novaSanctumTest = await novaSanctum.getPlayerAIAnalysis('test', {});
            console.log('✅ NovaSanctum connection successful');
        } catch (error) {
            console.warn('⚠️ NovaSanctum connection failed:', error.message);
        }
        
        // Test AthenaMist
        try {
            const athenaMistTest = await athenaMist.analyzePlayer('test', {});
            console.log('✅ AthenaMist connection successful');
        } catch (error) {
            console.warn('⚠️ AthenaMist connection failed:', error.message);
        }
        
        console.log('🎉 AthenaMist + NovaSanctum integration ready!');
        
    } catch (error) {
        console.error('💥 AthenaMist integration failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    syncAthenaMistIntegration();
}

module.exports = { syncAthenaMistIntegration };
EOF

    echo -e "${GREEN}✅ Integration sync script created${NC}"
}

# Update environment configuration
update_environment() {
    echo -e "${YELLOW}📝 Updating environment configuration...${NC}"
    
    # Add AthenaMist configuration to .env
    cat >> .env << 'EOF'

# AthenaMist Integration
ATHENAMIST_API_KEY=your_athenamist_api_key_here
ATHENAMIST_API_URL=https://api.athenamist.ai/v1
ENABLE_ATHENAMIST_ANALYSIS=true
ENABLE_ATHENAMIST_FRAUD=true

# Unified AI Configuration
ENABLE_UNIFIED_AI=true
NOVA_SANCTUM_WEIGHT=0.6
ATHENAMIST_WEIGHT=0.4
EOF

    echo -e "${GREEN}✅ Environment configuration updated${NC}"
}

# Main execution
main() {
    echo -e "${PURPLE}🚀 Setting up AthenaMist integration...${NC}"
    
    create_athenamist_integration
    create_unified_ai_service
    create_integration_config
    create_integration_sync
    update_environment
    
    echo ""
    echo -e "${GREEN}🎉 AthenaMist Integration Complete!${NC}"
    echo ""
    echo -e "${CYAN}🔮 AI Services Integrated:${NC}"
    echo -e "• ${GREEN}NovaSanctum AI${NC} - Advanced player analytics"
    echo -e "• ${GREEN}AthenaMist AI${NC} - Behavioral pattern recognition"
    echo -e "• ${GREEN}Unified AI Service${NC} - Combined analysis"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo -e "1. ${YELLOW}Update .env with AthenaMist API key${NC}"
    echo -e "2. ${YELLOW}Run: node integrations/athenamist/sync.js${NC}"
    echo -e "3. ${YELLOW}Test unified AI: npm run test:ai${NC}"
    echo -e "4. ${YELLOW}Deploy: ./GameDin_Complete_Launch.sh development${NC}"
}

# Run the integration
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 