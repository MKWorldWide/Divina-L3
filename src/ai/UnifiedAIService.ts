/**
 * @file UnifiedAIService.ts
 * @description Unified AI service combining NovaSanctum and AthenaMist AI
 * @dev Provides comprehensive gaming intelligence, fraud detection, and strategic analysis
 * @dev Orchestrates both AI services for optimal results
 */

import { NovaSanctumAI, NovaSanctumConfig } from './NovaSanctumAI';
import { AthenaMistAI, AthenaMistConfig } from './AthenaMistAI';
import { AIAnalytics, AIRequestType, PlayerStats, GameState } from '../types/gaming';
import { Logger } from '../utils/Logger';
import { DatabaseService } from '../database/DatabaseService';
import { BlockchainService } from '../blockchain/BlockchainService';

/**
 * @interface UnifiedAIConfig
 * @description Unified AI service configuration
 */
export interface UnifiedAIConfig {
    novaSanctum: NovaSanctumConfig;
    athenaMist: AthenaMistConfig;
    databaseConfig: any;
    blockchainConfig: any;
    orchestration: {
        enableNovaSanctum: boolean;
        enableAthenaMist: boolean;
        primaryService: 'novaSanctum' | 'athenaMist' | 'hybrid';
        fallbackService: 'novaSanctum' | 'athenaMist';
        consensusThreshold: number;
        maxResponseTime: number;
        enableCaching: boolean;
        cacheDuration: number;
    };
}

/**
 * @interface UnifiedAnalysisResult
 * @description Unified analysis result combining both AI services
 */
export interface UnifiedAnalysisResult {
    playerId: string;
    gameId: string;
    timestamp: number;
    novaSanctumResult?: AIAnalytics;
    athenaMistResult?: AIAnalytics;
    unifiedResult: AIAnalytics;
    consensus: {
        fraudScore: number;
        skillLevel: number;
        riskAssessment: number;
        predictedOutcome: number;
        confidence: number;
        agreement: number;
    };
    serviceStatus: {
        novaSanctum: boolean;
        athenaMist: boolean;
        responseTimes: { [key: string]: number };
    };
    metadata: {
        processingTime: number;
        servicesUsed: string[];
        consensusMethod: string;
        dataQuality: number;
    };
}

/**
 * @interface ServiceMetrics
 * @description Service performance metrics
 */
export interface ServiceMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    consensusAccuracy: number;
    serviceAvailability: { [key: string]: number };
    cacheHitRate: number;
    errorRate: number;
}

/**
 * @class UnifiedAIService
 * @description Unified AI service orchestrating NovaSanctum and AthenaMist
 */
export class UnifiedAIService {
    private config: UnifiedAIConfig;
    private novaSanctum: NovaSanctumAI;
    private athenaMist: AthenaMistAI;
    private logger: Logger;
    private database: DatabaseService;
    private blockchain: BlockchainService;
    private isInitialized: boolean = false;
    private analysisCache: Map<string, UnifiedAnalysisResult> = new Map();
    
    // Performance metrics
    private metrics: ServiceMetrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        consensusAccuracy: 0.95,
        serviceAvailability: {
            novaSanctum: 1.0,
            athenaMist: 1.0
        },
        cacheHitRate: 0,
        errorRate: 0
    };

    constructor(config: UnifiedAIConfig) {
        this.config = config;
        this.logger = new Logger('UnifiedAIService');
        this.database = new DatabaseService(config.databaseConfig);
        this.blockchain = new BlockchainService(config.blockchainConfig);
        
        // Initialize AI services
        this.novaSanctum = new NovaSanctumAI(config.novaSanctum);
        this.athenaMist = new AthenaMistAI(config.athenaMist);
    }

    /**
     * @method initialize
     * @description Initialize unified AI service
     */
    async initialize(): Promise<void> {
        try {
            this.logger.info('Initializing Unified AI Service...');
            
            // Initialize both AI services
            const initPromises: Promise<void>[] = [];
            
            if (this.config.orchestration.enableNovaSanctum) {
                initPromises.push(this.novaSanctum.initialize());
            }
            
            if (this.config.orchestration.enableAthenaMist) {
                initPromises.push(this.athenaMist.initialize());
            }
            
            await Promise.all(initPromises);
            
            // Verify services are ready
            await this.verifyServices();
            
            this.isInitialized = true;
            this.logger.info('Unified AI Service initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Unified AI Service:', error);
            throw error;
        }
    }

    /**
     * @method analyzePlayer
     * @description Perform comprehensive player analysis using both AI services
     * @param playerId Player ID
     * @param gameId Game ID
     * @param requestType Analysis request type
     * @returns Unified analysis result
     */
    async analyzePlayer(
        playerId: string,
        gameId: string,
        requestType: AIRequestType = 'comprehensive'
    ): Promise<UnifiedAnalysisResult> {
        try {
            this.metrics.totalRequests++;
            const startTime = Date.now();
            
            // Check cache first
            const cacheKey = `${playerId}_${gameId}_${requestType}`;
            if (this.config.orchestration.enableCaching && this.analysisCache.has(cacheKey)) {
                const cached = this.analysisCache.get(cacheKey)!;
                if (Date.now() - cached.timestamp < this.config.orchestration.cacheDuration) {
                    this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2;
                    return cached;
                }
            }
            
            // Determine which services to use based on request type
            const servicesToUse = this.determineServicesToUse(requestType);
            
            // Execute analysis in parallel
            const analysisPromises: Promise<AIAnalytics | null>[] = [];
            const serviceStartTimes: { [key: string]: number } = {};
            
            if (servicesToUse.novaSanctum && this.config.orchestration.enableNovaSanctum) {
                serviceStartTimes.novaSanctum = Date.now();
                analysisPromises.push(
                    this.executeWithTimeout(
                        this.novaSanctum.analyzePlayer(playerId, gameId),
                        this.config.orchestration.maxResponseTime,
                        'novaSanctum'
                    )
                );
            } else {
                analysisPromises.push(Promise.resolve(null));
            }
            
            if (servicesToUse.athenaMist && this.config.orchestration.enableAthenaMist) {
                serviceStartTimes.athenaMist = Date.now();
                analysisPromises.push(
                    this.executeWithTimeout(
                        this.athenaMist.analyzePlayer(playerId, gameId),
                        this.config.orchestration.maxResponseTime,
                        'athenaMist'
                    )
                );
            } else {
                analysisPromises.push(Promise.resolve(null));
            }
            
            // Wait for results
            const [novaSanctumResult, athenaMistResult] = await Promise.all(analysisPromises);
            
            // Calculate response times
            const responseTimes: { [key: string]: number } = {};
            if (novaSanctumResult) {
                responseTimes.novaSanctum = Date.now() - serviceStartTimes.novaSanctum;
            }
            if (athenaMistResult) {
                responseTimes.athenaMist = Date.now() - serviceStartTimes.athenaMist;
            }
            
            // Generate unified result
            const unifiedResult = await this.generateUnifiedResult(
                novaSanctumResult,
                athenaMistResult,
                playerId,
                gameId,
                requestType
            );
            
            // Calculate consensus
            const consensus = this.calculateConsensus(novaSanctumResult, athenaMistResult);
            
            // Create final result
            const result: UnifiedAnalysisResult = {
                playerId,
                gameId,
                timestamp: Date.now(),
                novaSanctumResult: novaSanctumResult || undefined,
                athenaMistResult: athenaMistResult || undefined,
                unifiedResult,
                consensus,
                serviceStatus: {
                    novaSanctum: !!novaSanctumResult,
                    athenaMist: !!athenaMistResult,
                    responseTimes
                },
                metadata: {
                    processingTime: Date.now() - startTime,
                    servicesUsed: Object.keys(responseTimes),
                    consensusMethod: this.config.orchestration.primaryService,
                    dataQuality: this.calculateDataQuality(novaSanctumResult, athenaMistResult)
                }
            };
            
            // Cache result
            if (this.config.orchestration.enableCaching) {
                this.analysisCache.set(cacheKey, result);
            }
            
            // Update metrics
            this.updateMetrics(result, Date.now() - startTime);
            
            this.logger.info(`Unified analysis completed for ${playerId} in ${Date.now() - startTime}ms`);
            
            return result;
            
        } catch (error) {
            this.metrics.failedRequests++;
            this.metrics.errorRate = (this.metrics.errorRate + 1) / 2;
            this.logger.error(`Error in unified analysis for player ${playerId}:`, error);
            throw error;
        }
    }

    /**
     * @method executeWithTimeout
     * @description Execute promise with timeout
     * @param promise Promise to execute
     * @param timeout Timeout in milliseconds
     * @param serviceName Service name for logging
     * @returns Promise result or null if timeout
     */
    private async executeWithTimeout<T>(
        promise: Promise<T>,
        timeout: number,
        serviceName: string
    ): Promise<T | null> {
        try {
            const result = await Promise.race([
                promise,
                new Promise<null>((_, reject) => 
                    setTimeout(() => reject(new Error(`Timeout for ${serviceName}`)), timeout)
                )
            ]);
            return result;
        } catch (error) {
            this.logger.warn(`${serviceName} analysis failed or timed out:`, error);
            return null;
        }
    }

    /**
     * @method determineServicesToUse
     * @description Determine which services to use based on request type
     * @param requestType Request type
     * @returns Services to use
     */
    private determineServicesToUse(requestType: AIRequestType): { novaSanctum: boolean; athenaMist: boolean } {
        switch (requestType) {
            case 'fraud_detection':
                return { novaSanctum: true, athenaMist: false };
            case 'strategic_analysis':
                return { novaSanctum: false, athenaMist: true };
            case 'comprehensive':
            default:
                return { novaSanctum: true, athenaMist: true };
        }
    }

    /**
     * @method generateUnifiedResult
     * @description Generate unified result from both AI services
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @param playerId Player ID
     * @param gameId Game ID
     * @param requestType Request type
     * @returns Unified AI analytics
     */
    private async generateUnifiedResult(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null,
        playerId: string,
        gameId: string,
        requestType: AIRequestType
    ): Promise<AIAnalytics> {
        const timestamp = Date.now();
        
        // Determine primary service based on configuration
        let primaryResult: AIAnalytics | null = null;
        let secondaryResult: AIAnalytics | null = null;
        
        switch (this.config.orchestration.primaryService) {
            case 'novaSanctum':
                primaryResult = novaSanctumResult;
                secondaryResult = athenaMistResult;
                break;
            case 'athenaMist':
                primaryResult = athenaMistResult;
                secondaryResult = novaSanctumResult;
                break;
            case 'hybrid':
                // Use the service with higher confidence
                if (novaSanctumResult && athenaMistResult) {
                    primaryResult = novaSanctumResult.confidence > athenaMistResult.confidence 
                        ? novaSanctumResult 
                        : athenaMistResult;
                    secondaryResult = primaryResult === novaSanctumResult ? athenaMistResult : novaSanctumResult;
                } else {
                    primaryResult = novaSanctumResult || athenaMistResult;
                }
                break;
        }
        
        // If no primary result, use fallback
        if (!primaryResult) {
            if (this.config.orchestration.fallbackService === 'novaSanctum' && novaSanctumResult) {
                primaryResult = novaSanctumResult;
            } else if (this.config.orchestration.fallbackService === 'athenaMist' && athenaMistResult) {
                primaryResult = athenaMistResult;
            } else {
                throw new Error('No AI service results available');
            }
        }
        
        // Generate unified analytics
        const unifiedAnalytics: AIAnalytics = {
            playerId,
            gameId,
            timestamp,
            fraudScore: this.calculateUnifiedFraudScore(novaSanctumResult, athenaMistResult),
            skillLevel: this.calculateUnifiedSkillLevel(novaSanctumResult, athenaMistResult),
            riskAssessment: this.calculateUnifiedRiskAssessment(novaSanctumResult, athenaMistResult),
            predictedOutcome: this.calculateUnifiedPredictedOutcome(novaSanctumResult, athenaMistResult),
            confidence: this.calculateUnifiedConfidence(novaSanctumResult, athenaMistResult),
            behaviorPatterns: this.mergeBehaviorPatterns(novaSanctumResult, athenaMistResult),
            analysisHash: this.generateUnifiedAnalysisHash(playerId, gameId, timestamp),
            serviceType: 'unified',
            analysisType: requestType,
            recommendations: this.mergeRecommendations(novaSanctumResult, athenaMistResult),
            flags: this.mergeFlags(novaSanctumResult, athenaMistResult),
            metadata: {
                modelVersion: `${primaryResult.metadata.modelVersion}_unified`,
                processingTime: timestamp - primaryResult.timestamp,
                dataPoints: this.calculateTotalDataPoints(novaSanctumResult, athenaMistResult),
                accuracy: this.calculateUnifiedAccuracy(novaSanctumResult, athenaMistResult),
                lastTraining: timestamp,
                features: this.mergeFeatures(novaSanctumResult, athenaMistResult),
                servicesUsed: this.getServicesUsed(novaSanctumResult, athenaMistResult)
            }
        };
        
        return unifiedAnalytics;
    }

    /**
     * @method calculateConsensus
     * @description Calculate consensus between AI services
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Consensus data
     */
    private calculateConsensus(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): any {
        if (!novaSanctumResult && !athenaMistResult) {
            return {
                fraudScore: 0,
                skillLevel: 0,
                riskAssessment: 0,
                predictedOutcome: 0,
                confidence: 0,
                agreement: 0
            };
        }
        
        if (!novaSanctumResult || !athenaMistResult) {
            const result = novaSanctumResult || athenaMistResult!;
            return {
                fraudScore: result.fraudScore,
                skillLevel: result.skillLevel,
                riskAssessment: result.riskAssessment,
                predictedOutcome: result.predictedOutcome,
                confidence: result.confidence,
                agreement: 1.0
            };
        }
        
        // Calculate consensus values
        const fraudScore = (novaSanctumResult.fraudScore + athenaMistResult.fraudScore) / 2;
        const skillLevel = (novaSanctumResult.skillLevel + athenaMistResult.skillLevel) / 2;
        const riskAssessment = (novaSanctumResult.riskAssessment + athenaMistResult.riskAssessment) / 2;
        const predictedOutcome = (novaSanctumResult.predictedOutcome + athenaMistResult.predictedOutcome) / 2;
        const confidence = (novaSanctumResult.confidence + athenaMistResult.confidence) / 2;
        
        // Calculate agreement level
        const agreement = this.calculateAgreement(novaSanctumResult, athenaMistResult);
        
        return {
            fraudScore,
            skillLevel,
            riskAssessment,
            predictedOutcome,
            confidence,
            agreement
        };
    }

    /**
     * @method calculateAgreement
     * @description Calculate agreement level between services
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Agreement level (0-1)
     */
    private calculateAgreement(novaSanctumResult: AIAnalytics, athenaMistResult: AIAnalytics): number {
        const metrics = [
            'fraudScore',
            'skillLevel',
            'riskAssessment',
            'predictedOutcome'
        ];
        
        let totalAgreement = 0;
        
        for (const metric of metrics) {
            const diff = Math.abs(novaSanctumResult[metric] - athenaMistResult[metric]);
            const maxValue = Math.max(novaSanctumResult[metric], athenaMistResult[metric]);
            const agreement = maxValue > 0 ? 1 - (diff / maxValue) : 1;
            totalAgreement += agreement;
        }
        
        return totalAgreement / metrics.length;
    }

    // ============ UNIFIED CALCULATION METHODS ============
    
    /**
     * @method calculateUnifiedFraudScore
     * @description Calculate unified fraud score
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Unified fraud score
     */
    private calculateUnifiedFraudScore(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): number {
        if (!novaSanctumResult && !athenaMistResult) return 0;
        if (!novaSanctumResult) return athenaMistResult!.fraudScore;
        if (!athenaMistResult) return novaSanctumResult.fraudScore;
        
        // Weight NovaSanctum more heavily for fraud detection
        return (novaSanctumResult.fraudScore * 0.7) + (athenaMistResult.fraudScore * 0.3);
    }
    
    /**
     * @method calculateUnifiedSkillLevel
     * @description Calculate unified skill level
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Unified skill level
     */
    private calculateUnifiedSkillLevel(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): number {
        if (!novaSanctumResult && !athenaMistResult) return 0;
        if (!novaSanctumResult) return athenaMistResult!.skillLevel;
        if (!athenaMistResult) return novaSanctumResult.skillLevel;
        
        // Weight AthenaMist more heavily for skill assessment
        return (novaSanctumResult.skillLevel * 0.3) + (athenaMistResult.skillLevel * 0.7);
    }
    
    /**
     * @method calculateUnifiedRiskAssessment
     * @description Calculate unified risk assessment
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Unified risk assessment
     */
    private calculateUnifiedRiskAssessment(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): number {
        if (!novaSanctumResult && !athenaMistResult) return 0;
        if (!novaSanctumResult) return athenaMistResult!.riskAssessment;
        if (!athenaMistResult) return novaSanctumResult.riskAssessment;
        
        // Use weighted average
        return (novaSanctumResult.riskAssessment * 0.5) + (athenaMistResult.riskAssessment * 0.5);
    }
    
    /**
     * @method calculateUnifiedPredictedOutcome
     * @description Calculate unified predicted outcome
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Unified predicted outcome
     */
    private calculateUnifiedPredictedOutcome(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): number {
        if (!novaSanctumResult && !athenaMistResult) return 0;
        if (!novaSanctumResult) return athenaMistResult!.predictedOutcome;
        if (!athenaMistResult) return novaSanctumResult.predictedOutcome;
        
        // Weight AthenaMist more heavily for outcome prediction
        return (novaSanctumResult.predictedOutcome * 0.4) + (athenaMistResult.predictedOutcome * 0.6);
    }
    
    /**
     * @method calculateUnifiedConfidence
     * @description Calculate unified confidence
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Unified confidence
     */
    private calculateUnifiedConfidence(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): number {
        if (!novaSanctumResult && !athenaMistResult) return 0;
        if (!novaSanctumResult) return athenaMistResult!.confidence;
        if (!athenaMistResult) return novaSanctumResult.confidence;
        
        // Use the higher confidence as base and add bonus for agreement
        const baseConfidence = Math.max(novaSanctumResult.confidence, athenaMistResult.confidence);
        const agreement = this.calculateAgreement(novaSanctumResult, athenaMistResult);
        const agreementBonus = agreement * 10;
        
        return Math.min(95, baseConfidence + agreementBonus);
    }
    
    /**
     * @method mergeBehaviorPatterns
     * @description Merge behavior patterns from both services
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Merged behavior patterns
     */
    private mergeBehaviorPatterns(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): number[] {
        if (!novaSanctumResult && !athenaMistResult) return [];
        if (!novaSanctumResult) return athenaMistResult!.behaviorPatterns;
        if (!athenaMistResult) return novaSanctumResult.behaviorPatterns;
        
        // Merge patterns, taking the longer array and filling with averages
        const maxLength = Math.max(novaSanctumResult.behaviorPatterns.length, athenaMistResult.behaviorPatterns.length);
        const merged: number[] = [];
        
        for (let i = 0; i < maxLength; i++) {
            const novaValue = novaSanctumResult.behaviorPatterns[i] || 0;
            const athenaValue = athenaMistResult.behaviorPatterns[i] || 0;
            merged.push((novaValue + athenaValue) / 2);
        }
        
        return merged;
    }
    
    /**
     * @method mergeRecommendations
     * @description Merge recommendations from both services
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Merged recommendations
     */
    private mergeRecommendations(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): string[] {
        const recommendations: string[] = [];
        
        if (novaSanctumResult) {
            recommendations.push(...novaSanctumResult.recommendations);
        }
        
        if (athenaMistResult) {
            recommendations.push(...athenaMistResult.recommendations);
        }
        
        // Remove duplicates and limit to top recommendations
        return [...new Set(recommendations)].slice(0, 10);
    }
    
    /**
     * @method mergeFlags
     * @description Merge flags from both services
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Merged flags
     */
    private mergeFlags(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): any[] {
        const flags: any[] = [];
        
        if (novaSanctumResult) {
            flags.push(...novaSanctumResult.flags);
        }
        
        if (athenaMistResult) {
            flags.push(...athenaMistResult.flags);
        }
        
        return flags;
    }
    
    /**
     * @method calculateTotalDataPoints
     * @description Calculate total data points used
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Total data points
     */
    private calculateTotalDataPoints(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): number {
        let total = 0;
        
        if (novaSanctumResult) {
            total += novaSanctumResult.metadata.dataPoints;
        }
        
        if (athenaMistResult) {
            total += athenaMistResult.metadata.dataPoints;
        }
        
        return total;
    }
    
    /**
     * @method calculateUnifiedAccuracy
     * @description Calculate unified accuracy
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Unified accuracy
     */
    private calculateUnifiedAccuracy(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): number {
        if (!novaSanctumResult && !athenaMistResult) return 0;
        if (!novaSanctumResult) return athenaMistResult!.metadata.accuracy;
        if (!athenaMistResult) return novaSanctumResult.metadata.accuracy;
        
        return (novaSanctumResult.metadata.accuracy + athenaMistResult.metadata.accuracy) / 2;
    }
    
    /**
     * @method mergeFeatures
     * @description Merge features from both services
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Merged features
     */
    private mergeFeatures(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): string[] {
        const features: string[] = [];
        
        if (novaSanctumResult?.metadata.features) {
            features.push(...novaSanctumResult.metadata.features);
        }
        
        if (athenaMistResult?.metadata.features) {
            features.push(...athenaMistResult.metadata.features);
        }
        
        return [...new Set(features)];
    }
    
    /**
     * @method getServicesUsed
     * @description Get list of services used
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Services used
     */
    private getServicesUsed(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): string[] {
        const services: string[] = [];
        
        if (novaSanctumResult) services.push('novaSanctum');
        if (athenaMistResult) services.push('athenaMist');
        
        return services;
    }
    
    /**
     * @method calculateDataQuality
     * @description Calculate data quality score
     * @param novaSanctumResult NovaSanctum result
     * @param athenaMistResult AthenaMist result
     * @returns Data quality score
     */
    private calculateDataQuality(
        novaSanctumResult: AIAnalytics | null,
        athenaMistResult: AIAnalytics | null
    ): number {
        let quality = 0;
        let count = 0;
        
        if (novaSanctumResult) {
            quality += novaSanctumResult.metadata.accuracy;
            count++;
        }
        
        if (athenaMistResult) {
            quality += athenaMistResult.metadata.accuracy;
            count++;
        }
        
        return count > 0 ? quality / count : 0;
    }

    // ============ UTILITY METHODS ============
    
    /**
     * @method verifyServices
     * @description Verify that services are ready
     */
    private async verifyServices(): Promise<void> {
        const checks: Promise<boolean>[] = [];
        
        if (this.config.orchestration.enableNovaSanctum) {
            checks.push(Promise.resolve(this.novaSanctum.isReady()));
        }
        
        if (this.config.orchestration.enableAthenaMist) {
            checks.push(Promise.resolve(this.athenaMist.isReady()));
        }
        
        const results = await Promise.all(checks);
        const allReady = results.every(ready => ready);
        
        if (!allReady) {
            throw new Error('Not all AI services are ready');
        }
    }
    
    /**
     * @method updateMetrics
     * @description Update performance metrics
     * @param result Analysis result
     * @param processingTime Processing time
     */
    private updateMetrics(result: UnifiedAnalysisResult, processingTime: number): void {
        this.metrics.successfulRequests++;
        this.metrics.averageResponseTime = (this.metrics.averageResponseTime + processingTime) / 2;
        
        // Update service availability
        if (result.serviceStatus.novaSanctum) {
            this.metrics.serviceAvailability.novaSanctum = 1.0;
        }
        if (result.serviceStatus.athenaMist) {
            this.metrics.serviceAvailability.athenaMist = 1.0;
        }
        
        // Update consensus accuracy
        this.metrics.consensusAccuracy = (this.metrics.consensusAccuracy + result.consensus.agreement) / 2;
    }
    
    /**
     * @method generateUnifiedAnalysisHash
     * @description Generate unified analysis hash
     * @param playerId Player ID
     * @param gameId Game ID
     * @param timestamp Timestamp
     * @returns Analysis hash
     */
    private generateUnifiedAnalysisHash(playerId: string, gameId: string, timestamp: number): string {
        const data = `${playerId}_${gameId}_${timestamp}_unified`;
        return require('crypto').createHash('sha256').update(data).digest('hex');
    }
    
    /**
     * @method getMetrics
     * @description Get performance metrics
     * @returns Performance metrics
     */
    getMetrics(): ServiceMetrics {
        return { ...this.metrics };
    }
    
    /**
     * @method getServiceMetrics
     * @description Get individual service metrics
     * @returns Service metrics
     */
    getServiceMetrics(): { novaSanctum: any; athenaMist: any } {
        return {
            novaSanctum: this.novaSanctum.getMetrics(),
            athenaMist: this.athenaMist.getMetrics()
        };
    }
    
    /**
     * @method isReady
     * @description Check if service is ready
     * @returns True if ready
     */
    isReady(): boolean {
        return this.isInitialized;
    }
    
    /**
     * @method clearCache
     * @description Clear analysis cache
     */
    clearCache(): void {
        this.analysisCache.clear();
    }
    
    /**
     * @method getCacheStats
     * @description Get cache statistics
     * @returns Cache statistics
     */
    getCacheStats(): { size: number; hitRate: number } {
        return {
            size: this.analysisCache.size,
            hitRate: this.metrics.cacheHitRate
        };
    }
} 