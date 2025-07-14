/**
 * 🌌 Celestial Genesis Collective - Immutable Utilities
 * 
 * This module provides utility functions for working with immutable data structures
 * and implementing the principles of the Celestial Genesis Collective:
 * - Pure functions with no side effects
 * - Immutable data transformations
 * - Type-safe operations
 * - Collective intelligence patterns
 */

import type {
  ImmutableArray,
  ImmutableObject,
  DeepImmutable,
  Result,
  Optional,
  ImmutableEvent,
  CollectiveNode,
  CollectiveDecision,
  EmergentBehavior,
  ImmutableGameState,
  ImmutablePlayerProfile,
  ImmutableAIModelState,
  ImmutableTransactionState,
} from '../types/immutable.js';

// ============================================================================
// IMMUTABLE DATA CREATION
// ============================================================================

/**
 * Creates an immutable array from a regular array
 * @param array - The array to make immutable
 * @returns An immutable array
 */
export const createImmutableArray = <T>(array: T[]): ImmutableArray<T> => {
  return Object.freeze([...array]) as ImmutableArray<T>;
};

/**
 * Creates an immutable object from a regular object
 * @param obj - The object to make immutable
 * @returns An immutable object
 */
export const createImmutableObject = <T extends Record<string, unknown>>(obj: T): ImmutableObject<T> => {
  return Object.freeze({ ...obj }) as ImmutableObject<T>;
};

/**
 * Creates a deep immutable structure
 * @param data - The data to make deeply immutable
 * @returns A deeply immutable structure
 */
export const createDeepImmutable = <T>(data: T): DeepImmutable<T> => {
  if (Array.isArray(data)) {
    return Object.freeze(data.map(createDeepImmutable)) as DeepImmutable<T>;
  }
  
  if (data !== null && typeof data === 'object') {
    const frozenObj = Object.freeze(
      Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, createDeepImmutable(value)])
      )
    );
    return frozenObj as DeepImmutable<T>;
  }
  
  return data as DeepImmutable<T>;
};

// ============================================================================
// IMMUTABLE ARRAY OPERATIONS
// ============================================================================

/**
 * Adds an element to an immutable array (creates new array)
 * @param array - The immutable array
 * @param element - The element to add
 * @returns A new immutable array with the element added
 */
export const addToImmutableArray = <T>(
  array: ImmutableArray<T>,
  element: T
): ImmutableArray<T> => {
  return createImmutableArray([...array, element]);
};

/**
 * Removes an element from an immutable array by index
 * @param array - The immutable array
 * @param index - The index to remove
 * @returns A new immutable array with the element removed
 */
export const removeFromImmutableArray = <T>(
  array: ImmutableArray<T>,
  index: number
): ImmutableArray<T> => {
  if (index < 0 || index >= array.length) {
    return array;
  }
  return createImmutableArray(array.filter((_, i) => i !== index));
};

/**
 * Updates an element in an immutable array by index
 * @param array - The immutable array
 * @param index - The index to update
 * @param element - The new element
 * @returns A new immutable array with the element updated
 */
export const updateImmutableArray = <T>(
  array: ImmutableArray<T>,
  index: number,
  element: T
): ImmutableArray<T> => {
  if (index < 0 || index >= array.length) {
    return array;
  }
  const newArray = [...array];
  newArray[index] = element;
  return createImmutableArray(newArray);
};

/**
 * Maps over an immutable array
 * @param array - The immutable array
 * @param mapper - The mapping function
 * @returns A new immutable array with mapped elements
 */
export const mapImmutableArray = <T, U>(
  array: ImmutableArray<T>,
  mapper: (element: T, index: number) => U
): ImmutableArray<U> => {
  return createImmutableArray(array.map(mapper));
};

/**
 * Filters an immutable array
 * @param array - The immutable array
 * @param predicate - The filter predicate
 * @returns A new immutable array with filtered elements
 */
export const filterImmutableArray = <T>(
  array: ImmutableArray<T>,
  predicate: (element: T, index: number) => boolean
): ImmutableArray<T> => {
  return createImmutableArray(array.filter(predicate));
};

// ============================================================================
// IMMUTABLE OBJECT OPERATIONS
// ============================================================================

/**
 * Sets a property in an immutable object (creates new object)
 * @param obj - The immutable object
 * @param key - The property key
 * @param value - The property value
 * @returns A new immutable object with the property set
 */
export const setImmutableProperty = <T extends Record<string, unknown>, K extends keyof T>(
  obj: ImmutableObject<T>,
  key: K,
  value: T[K]
): ImmutableObject<T> => {
  return createImmutableObject({ ...obj, [key]: value });
};

/**
 * Removes a property from an immutable object
 * @param obj - The immutable object
 * @param key - The property key to remove
 * @returns A new immutable object with the property removed
 */
export const removeImmutableProperty = <T extends Record<string, unknown>, K extends keyof T>(
  obj: ImmutableObject<T>,
  key: K
): ImmutableObject<Omit<T, K>> => {
  const { [key]: _, ...rest } = obj;
  return createImmutableObject(rest) as ImmutableObject<Omit<T, K>>;
};

/**
 * Merges two immutable objects
 * @param obj1 - The first immutable object
 * @param obj2 - The second immutable object
 * @returns A new immutable object with merged properties
 */
export const mergeImmutableObjects = <T extends Record<string, unknown>, U extends Record<string, unknown>>(
  obj1: ImmutableObject<T>,
  obj2: ImmutableObject<U>
): ImmutableObject<T & U> => {
  return createImmutableObject({ ...obj1, ...obj2 }) as ImmutableObject<T & U>;
};

// ============================================================================
// COLLECTIVE INTELLIGENCE UTILITIES
// ============================================================================

/**
 * Creates a collective decision
 * @param proposal - The proposal text
 * @param threshold - The approval threshold
 * @returns A new collective decision
 */
export const createCollectiveDecision = (
  proposal: string,
  threshold: number
): CollectiveDecision => {
  return createImmutableObject({
    id: generateId(),
    proposal,
    votes: createImmutableArray([]),
    outcome: 'pending' as const,
    threshold,
    createdAt: new Date(),
  });
};

/**
 * Adds a vote to a collective decision
 * @param decision - The collective decision
 * @param nodeId - The voting node ID
 * @param vote - The vote value
 * @param weight - The vote weight
 * @returns A new collective decision with the vote added
 */
export const addVoteToDecision = (
  decision: CollectiveDecision,
  nodeId: string,
  vote: 'approve' | 'reject' | 'abstain',
  weight: number
): CollectiveDecision => {
  const newVote = createImmutableObject({
    nodeId,
    vote,
    weight,
    timestamp: new Date(),
  });
  
  const newVotes = addToImmutableArray(decision.votes, newVote);
  
  // Calculate outcome
  const totalWeight = newVotes.reduce((sum, v) => sum + v.weight, 0);
  const approveWeight = newVotes
    .filter(v => v.vote === 'approve')
    .reduce((sum, v) => sum + v.weight, 0);
  
  const outcome = approveWeight >= decision.threshold ? 'approved' : 'pending';
  
  return createImmutableObject({
    ...decision,
    votes: newVotes,
    outcome,
  });
};

/**
 * Creates an emergent behavior pattern
 * @param pattern - The behavior pattern
 * @param participants - The participant IDs
 * @param strength - The pattern strength
 * @param stability - The pattern stability
 * @returns A new emergent behavior
 */
export const createEmergentBehavior = (
  pattern: string,
  participants: string[],
  strength: number,
  stability: number
): EmergentBehavior => {
  return createImmutableObject({
    id: generateId(),
    pattern,
    participants: createImmutableArray(participants),
    strength,
    stability,
    lastObserved: new Date(),
    metadata: createImmutableObject({}),
  });
};

// ============================================================================
// GAMING IMMUTABLE UTILITIES
// ============================================================================

/**
 * Creates an immutable game state
 * @param gameId - The game ID
 * @param players - The initial players
 * @returns A new immutable game state
 */
export const createImmutableGameState = (
  gameId: string,
  players: Array<{ address: string; score: number }>
): ImmutableGameState => {
  return createImmutableObject({
    gameId,
    status: 'waiting' as const,
    players: createImmutableArray(
      players.map(player => createImmutableObject({
        ...player,
        isActive: true,
        joinedAt: new Date(),
      }))
    ),
    gameData: createImmutableObject({}),
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  });
};

/**
 * Updates a player's score in a game state
 * @param gameState - The current game state
 * @param playerAddress - The player's address
 * @param newScore - The new score
 * @returns A new game state with updated score
 */
export const updatePlayerScore = (
  gameState: ImmutableGameState,
  playerAddress: string,
  newScore: number
): ImmutableGameState => {
  // Check if player exists
  const playerExists = gameState.players.some(player => player.address === playerAddress);
  
  if (!playerExists) {
    // Return original state unchanged if player doesn't exist
    return gameState;
  }
  
  const updatedPlayers = mapImmutableArray(gameState.players, player => {
    if (player.address === playerAddress) {
      return createImmutableObject({
        ...player,
        score: newScore,
      });
    }
    return player;
  });
  
  return createImmutableObject({
    ...gameState,
    players: updatedPlayers,
    updatedAt: new Date(),
    version: gameState.version + 1,
  });
};

// ============================================================================
// AI IMMUTABLE UTILITIES
// ============================================================================

/**
 * Creates an immutable AI model state
 * @param modelId - The model ID
 * @param name - The model name
 * @param type - The model type
 * @param parameters - The model parameters
 * @returns A new immutable AI model state
 */
export const createImmutableAIModelState = (
  modelId: string,
  name: string,
  type: 'novasanctum' | 'athenamist' | 'unified',
  parameters: Record<string, unknown>
): ImmutableAIModelState => {
  return createImmutableObject({
    modelId,
    name,
    version: '1.0.0',
    type,
    parameters: createImmutableObject(parameters),
    performance: createImmutableObject({
      accuracy: 0,
      latency: 0,
      throughput: 0,
      lastUpdated: new Date(),
    }),
    isActive: true,
    createdAt: new Date(),
  });
};

// ============================================================================
// RESULT UTILITIES
// ============================================================================

/**
 * Creates a successful result
 * @param data - The success data
 * @returns A success result
 */
export const createSuccess = <T>(data: T): Result<T> => {
  return createImmutableObject({
    success: true,
    data,
  });
};

/**
 * Creates a failure result
 * @param error - The error
 * @returns A failure result
 */
export const createFailure = <E>(error: E): Result<never, E> => {
  return createImmutableObject({
    success: false,
    error,
  });
};

/**
 * Maps a result's success value
 * @param result - The result to map
 * @param mapper - The mapping function
 * @returns A new result with mapped success value
 */
export const mapResult = <T, U, E>(
  result: Result<T, E>,
  mapper: (data: T) => U
): Result<U, E> => {
  if (result.success) {
    return createSuccess(mapper(result.data));
  }
  return result;
};

/**
 * Maps a result's error value
 * @param result - The result to map
 * @param mapper - The error mapping function
 * @returns A new result with mapped error value
 */
export const mapError = <T, E, F>(
  result: Result<T, E>,
  mapper: (error: E) => F
): Result<T, F> => {
  if (!result.success) {
    return createFailure(mapper(result.error));
  }
  return result;
};

// ============================================================================
// EVENT UTILITIES
// ============================================================================

/**
 * Creates an immutable event
 * @param type - The event type
 * @param data - The event data
 * @param source - The event source
 * @returns A new immutable event
 */
export const createImmutableEvent = <T>(
  type: string,
  data: T,
  source: string
): ImmutableEvent<T> => {
  return createImmutableObject({
    id: generateId(),
    type,
    data,
    timestamp: new Date(),
    source,
    metadata: createImmutableObject({}),
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a unique ID
 * @returns A unique ID string
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Deep clones an object (for testing purposes)
 * @param obj - The object to clone
 * @returns A deep clone of the object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(deepClone) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

/**
 * Validates that an object is immutable
 * @param obj - The object to validate
 * @returns True if the object is immutable
 */
export const validateImmutable = (obj: unknown): boolean => {
  if (obj === null || typeof obj !== 'object') {
    return true;
  }
  
  if (!Object.isFrozen(obj)) {
    return false;
  }
  
  if (Array.isArray(obj)) {
    return obj.every(validateImmutable);
  }
  
  return Object.values(obj).every(validateImmutable);
}; 