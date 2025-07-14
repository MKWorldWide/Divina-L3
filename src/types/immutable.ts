/**
 * 🌌 Celestial Genesis Collective - Immutable Framework Types
 * 
 * This module defines immutable data structures and types that enforce
 * the principles of the Celestial Genesis Collective:
 * - Immutable state management
 * - Pure functions
 * - Type safety
 * - Collective intelligence patterns
 */

// ============================================================================
// IMMUTABLE BASE TYPES
// ============================================================================

/**
 * Immutable array type - readonly array that cannot be modified
 */
export type ImmutableArray<T> = readonly T[];

/**
 * Immutable object type - readonly object that cannot be modified
 */
export type ImmutableObject<T> = {
  readonly [K in keyof T]: T[K];
};

/**
 * Deep immutable type - recursively makes all nested objects and arrays readonly
 */
export type DeepImmutable<T> = T extends (infer U)[]
  ? readonly DeepImmutable<U>[]
  : T extends object
  ? {
      readonly [K in keyof T]: DeepImmutable<T[K]>;
    }
  : T;

// ============================================================================
// CELESTIAL GENESIS COLLECTIVE TYPES
// ============================================================================

/**
 * Collective Intelligence Node - represents a participant in the collective
 */
export interface CollectiveNode {
  readonly id: string;
  readonly address: string;
  readonly weight: number;
  readonly reputation: number;
  readonly isActive: boolean;
  readonly lastSeen: Date;
  readonly capabilities: readonly string[];
}

/**
 * Collective Decision - immutable decision made by the collective
 */
export interface CollectiveDecision {
  readonly id: string;
  readonly proposal: string;
  readonly votes: ImmutableArray<{
    readonly nodeId: string;
    readonly vote: 'approve' | 'reject' | 'abstain';
    readonly weight: number;
    readonly timestamp: Date;
  }>;
  readonly outcome: 'approved' | 'rejected' | 'pending';
  readonly threshold: number;
  readonly createdAt: Date;
  readonly executedAt?: Date;
}

/**
 * Emergent Behavior Pattern - represents self-organizing system behavior
 */
export interface EmergentBehavior {
  readonly id: string;
  readonly pattern: string;
  readonly participants: ImmutableArray<string>;
  readonly strength: number;
  readonly stability: number;
  readonly lastObserved: Date;
  readonly metadata: ImmutableObject<Record<string, unknown>>;
}

// ============================================================================
// GAMING IMMUTABLE TYPES
// ============================================================================

/**
 * Immutable Game State - represents the current state of a game
 */
export interface ImmutableGameState {
  readonly gameId: string;
  readonly status: 'waiting' | 'active' | 'completed' | 'cancelled';
  readonly players: ImmutableArray<{
    readonly address: string;
    readonly score: number;
    readonly isActive: boolean;
    readonly joinedAt: Date;
  }>;
  readonly gameData: ImmutableObject<Record<string, unknown>>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly version: number;
}

/**
 * Immutable Player Profile - represents a player's immutable profile
 */
export interface ImmutablePlayerProfile {
  readonly address: string;
  readonly username: string;
  readonly reputation: number;
  readonly totalGames: number;
  readonly winRate: number;
  readonly totalWinnings: number;
  readonly achievements: ImmutableArray<string>;
  readonly createdAt: Date;
  readonly lastActive: Date;
}

/**
 * Immutable Tournament State - represents tournament immutable state
 */
export interface ImmutableTournamentState {
  readonly tournamentId: string;
  readonly name: string;
  readonly status: 'registration' | 'active' | 'completed';
  readonly participants: ImmutableArray<{
    readonly address: string;
    readonly rank: number;
    readonly score: number;
    readonly isEliminated: boolean;
  }>;
  readonly prizePool: number;
  readonly entryFee: number;
  readonly maxParticipants: number;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly rules: ImmutableObject<Record<string, unknown>>;
}

// ============================================================================
// AI IMMUTABLE TYPES
// ============================================================================

/**
 * Immutable AI Model State - represents AI model immutable state
 */
export interface ImmutableAIModelState {
  readonly modelId: string;
  readonly name: string;
  readonly version: string;
  readonly type: 'novasanctum' | 'athenamist' | 'unified';
  readonly parameters: ImmutableObject<Record<string, unknown>>;
  readonly performance: {
    readonly accuracy: number;
    readonly latency: number;
    readonly throughput: number;
    readonly lastUpdated: Date;
  };
  readonly isActive: boolean;
  readonly createdAt: Date;
}

/**
 * Immutable AI Decision - represents AI decision immutable state
 */
export interface ImmutableAIDecision {
  readonly decisionId: string;
  readonly modelId: string;
  readonly input: ImmutableObject<Record<string, unknown>>;
  readonly output: ImmutableObject<Record<string, unknown>>;
  readonly confidence: number;
  readonly reasoning: string;
  readonly timestamp: Date;
  readonly metadata: ImmutableObject<Record<string, unknown>>;
}

// ============================================================================
// BLOCKCHAIN IMMUTABLE TYPES
// ============================================================================

/**
 * Immutable Transaction State - represents blockchain transaction immutable state
 */
export interface ImmutableTransactionState {
  readonly txHash: string;
  readonly from: string;
  readonly to: string;
  readonly value: string;
  readonly gasUsed: number;
  readonly gasPrice: string;
  readonly status: 'pending' | 'confirmed' | 'failed';
  readonly blockNumber?: number;
  readonly timestamp: Date;
  readonly metadata: ImmutableObject<Record<string, unknown>>;
}

/**
 * Immutable Smart Contract State - represents smart contract immutable state
 */
export interface ImmutableSmartContractState {
  readonly contractAddress: string;
  readonly contractName: string;
  readonly abi: ImmutableArray<Record<string, unknown>>;
  readonly bytecode: string;
  readonly deployedAt: Date;
  readonly network: string;
  readonly owner: string;
  readonly state: ImmutableObject<Record<string, unknown>>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Result type for operations that can succeed or fail
 */
export type Result<T, E = Error> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Optional type for nullable values
 */
export type Optional<T> = T | null | undefined;

/**
 * Event type for immutable events
 */
export interface ImmutableEvent<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly data: T;
  readonly timestamp: Date;
  readonly source: string;
  readonly metadata: ImmutableObject<Record<string, unknown>>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is an immutable array
 */
export const isImmutableArray = <T>(value: unknown): value is ImmutableArray<T> => {
  return Array.isArray(value) && Object.isFrozen(value);
};

/**
 * Type guard to check if a value is an immutable object
 */
export const isImmutableObject = <T>(value: unknown): value is ImmutableObject<T> => {
  return typeof value === 'object' && value !== null && Object.isFrozen(value);
};

/**
 * Type guard to check if a result is successful
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is { readonly success: true; readonly data: T } => {
  return result.success;
};

/**
 * Type guard to check if a result is a failure
 */
export const isFailure = <T, E>(result: Result<T, E>): result is { readonly success: false; readonly error: E } => {
  return !result.success;
}; 