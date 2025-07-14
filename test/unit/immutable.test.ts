/**
 * 🧪 TDD Tests for Immutable Framework
 * 
 * This test suite implements Test-Driven Development principles for the
 * Celestial Genesis Collective immutable framework:
 * - Red: Write failing tests first
 * - Green: Implement minimal code to pass tests
 * - Refactor: Improve code while maintaining test coverage
 */

import { describe, it, beforeEach, expect } from 'vitest';
import {
  // Immutable data creation
  createImmutableArray,
  createImmutableObject,
  createDeepImmutable,
  
  // Array operations
  addToImmutableArray,
  removeFromImmutableArray,
  updateImmutableArray,
  mapImmutableArray,
  filterImmutableArray,
  
  // Object operations
  setImmutableProperty,
  removeImmutableProperty,
  mergeImmutableObjects,
  
  // Collective intelligence
  createCollectiveDecision,
  addVoteToDecision,
  createEmergentBehavior,
  
  // Gaming utilities
  createImmutableGameState,
  updatePlayerScore,
  
  // AI utilities
  createImmutableAIModelState,
  
  // Result utilities
  createSuccess,
  createFailure,
  mapResult,
  mapError,
  
  // Event utilities
  createImmutableEvent,
  
  // Utility functions
  generateId,
  deepClone,
  validateImmutable,
} from '../../src/utils/immutable.js';

import type {
  ImmutableArray,
  ImmutableObject,
  CollectiveDecision,
  EmergentBehavior,
  ImmutableGameState,
  ImmutableAIModelState,
  Result,
  ImmutableEvent,
} from '../../src/types/immutable.js';

describe('🌌 Celestial Genesis Collective - Immutable Framework Tests', () => {
  
  describe('📦 Immutable Data Creation', () => {
    
    describe('RED: createImmutableArray should create frozen arrays', () => {
      it('should create an immutable array from a regular array', () => {
        const originalArray = [1, 2, 3, 4, 5];
        const immutableArray = createImmutableArray(originalArray);
        
        // Test that the array is frozen
        expect(Object.isFrozen(immutableArray)).to.be.true;
        
        // Test that the array contains the same elements
        expect(immutableArray).to.deep.equal(originalArray);
        
        // Test that modifying the original doesn't affect the immutable
        originalArray.push(6);
        expect(immutableArray).to.deep.equal([1, 2, 3, 4, 5]);
      });
      
      it('should prevent modification of immutable arrays', () => {
        const immutableArray = createImmutableArray([1, 2, 3]);
        
        // Attempting to modify should throw an error
        expect(() => {
          (immutableArray as any).push(4);
        }).to.throw();
        
        expect(() => {
          (immutableArray as any)[0] = 10;
        }).to.throw();
      });
    });
    
    describe('RED: createImmutableObject should create frozen objects', () => {
      it('should create an immutable object from a regular object', () => {
        const originalObject = { name: 'Test', value: 42 };
        const immutableObject = createImmutableObject(originalObject);
        
        // Test that the object is frozen
        expect(Object.isFrozen(immutableObject)).to.be.true;
        
        // Test that the object contains the same properties
        expect(immutableObject).to.deep.equal(originalObject);
        
        // Test that modifying the original doesn't affect the immutable
        originalObject.newProp = 'test';
        expect(immutableObject).to.not.have.property('newProp');
      });
      
      it('should prevent modification of immutable objects', () => {
        const immutableObject = createImmutableObject({ name: 'Test' });
        
        // Attempting to modify should throw an error
        expect(() => {
          (immutableObject as any).name = 'Modified';
        }).to.throw();
        
        expect(() => {
          (immutableObject as any).newProp = 'value';
        }).to.throw();
      });
    });
    
    describe('RED: createDeepImmutable should create deeply frozen structures', () => {
      it('should create deeply immutable nested objects', () => {
        const originalData = {
          name: 'Test',
          config: {
            enabled: true,
            settings: {
              timeout: 5000,
              retries: [1, 2, 3]
            }
          }
        };
        
        const deepImmutable = createDeepImmutable(originalData);
        
        // Test that all levels are frozen
        expect(Object.isFrozen(deepImmutable)).to.be.true;
        expect(Object.isFrozen(deepImmutable.config)).to.be.true;
        expect(Object.isFrozen(deepImmutable.config.settings)).to.be.true;
        expect(Object.isFrozen(deepImmutable.config.settings.retries)).to.be.true;
      });
      
      it('should create deeply immutable arrays with nested objects', () => {
        const originalData = [
          { id: 1, data: { value: 'test' } },
          { id: 2, data: { value: 'test2' } }
        ];
        
        const deepImmutable = createDeepImmutable(originalData);
        
        // Test that all levels are frozen
        expect(Object.isFrozen(deepImmutable)).to.be.true;
        expect(Object.isFrozen(deepImmutable[0])).to.be.true;
        expect(Object.isFrozen(deepImmutable[0].data)).to.be.true;
      });
    });
  });
  
  describe('🔄 Immutable Array Operations', () => {
    
    describe('RED: addToImmutableArray should create new arrays with added elements', () => {
      it('should add an element to an immutable array', () => {
        const originalArray = createImmutableArray([1, 2, 3]);
        const newArray = addToImmutableArray(originalArray, 4);
        
        // Test that a new array is created
        expect(newArray).to.not.equal(originalArray);
        
        // Test that the new array contains the added element
        expect(newArray).to.deep.equal([1, 2, 3, 4]);
        
        // Test that the original array is unchanged
        expect(originalArray).to.deep.equal([1, 2, 3]);
      });
      
      it('should maintain immutability of the new array', () => {
        const originalArray = createImmutableArray([1, 2, 3]);
        const newArray = addToImmutableArray(originalArray, 4);
        
        expect(Object.isFrozen(newArray)).to.be.true;
      });
    });
    
    describe('RED: removeFromImmutableArray should create new arrays with removed elements', () => {
      it('should remove an element by index', () => {
        const originalArray = createImmutableArray([1, 2, 3, 4, 5]);
        const newArray = removeFromImmutableArray(originalArray, 2);
        
        // Test that a new array is created
        expect(newArray).to.not.equal(originalArray);
        
        // Test that the element is removed
        expect(newArray).to.deep.equal([1, 2, 4, 5]);
        
        // Test that the original array is unchanged
        expect(originalArray).to.deep.equal([1, 2, 3, 4, 5]);
      });
      
      it('should handle invalid indices gracefully', () => {
        const originalArray = createImmutableArray([1, 2, 3]);
        const newArray1 = removeFromImmutableArray(originalArray, -1);
        const newArray2 = removeFromImmutableArray(originalArray, 10);
        
        // Should return the original array unchanged
        expect(newArray1).to.equal(originalArray);
        expect(newArray2).to.equal(originalArray);
      });
    });
    
    describe('RED: updateImmutableArray should create new arrays with updated elements', () => {
      it('should update an element by index', () => {
        const originalArray = createImmutableArray([1, 2, 3, 4, 5]);
        const newArray = updateImmutableArray(originalArray, 2, 10);
        
        // Test that a new array is created
        expect(newArray).to.not.equal(originalArray);
        
        // Test that the element is updated
        expect(newArray).to.deep.equal([1, 2, 10, 4, 5]);
        
        // Test that the original array is unchanged
        expect(originalArray).to.deep.equal([1, 2, 3, 4, 5]);
      });
      
      it('should handle invalid indices gracefully', () => {
        const originalArray = createImmutableArray([1, 2, 3]);
        const newArray1 = updateImmutableArray(originalArray, -1, 10);
        const newArray2 = updateImmutableArray(originalArray, 10, 10);
        
        // Should return the original array unchanged
        expect(newArray1).to.equal(originalArray);
        expect(newArray2).to.equal(originalArray);
      });
    });
    
    describe('RED: mapImmutableArray should create new arrays with mapped elements', () => {
      it('should map over immutable array elements', () => {
        const originalArray = createImmutableArray([1, 2, 3, 4, 5]);
        const newArray = mapImmutableArray(originalArray, x => x * 2);
        
        // Test that a new array is created
        expect(newArray).to.not.equal(originalArray);
        
        // Test that elements are mapped
        expect(newArray).to.deep.equal([2, 4, 6, 8, 10]);
        
        // Test that the original array is unchanged
        expect(originalArray).to.deep.equal([1, 2, 3, 4, 5]);
      });
      
      it('should maintain immutability of mapped array', () => {
        const originalArray = createImmutableArray([1, 2, 3]);
        const newArray = mapImmutableArray(originalArray, x => x * 2);
        
        expect(Object.isFrozen(newArray)).to.be.true;
      });
    });
    
    describe('RED: filterImmutableArray should create new arrays with filtered elements', () => {
      it('should filter immutable array elements', () => {
        const originalArray = createImmutableArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        const newArray = filterImmutableArray(originalArray, x => x % 2 === 0);
        
        // Test that a new array is created
        expect(newArray).to.not.equal(originalArray);
        
        // Test that elements are filtered
        expect(newArray).to.deep.equal([2, 4, 6, 8, 10]);
        
        // Test that the original array is unchanged
        expect(originalArray).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });
      
      it('should maintain immutability of filtered array', () => {
        const originalArray = createImmutableArray([1, 2, 3, 4, 5]);
        const newArray = filterImmutableArray(originalArray, x => x > 2);
        
        expect(Object.isFrozen(newArray)).to.be.true;
      });
    });
  });
  
  describe('🏛️ Collective Intelligence Operations', () => {
    
    describe('RED: createCollectiveDecision should create immutable decisions', () => {
      it('should create a collective decision with initial state', () => {
        const decision = createCollectiveDecision('Test proposal', 100);
        
        // Test that the decision is immutable
        expect(Object.isFrozen(decision)).to.be.true;
        
        // Test initial state
        expect(decision.proposal).to.equal('Test proposal');
        expect(decision.threshold).to.equal(100);
        expect(decision.outcome).to.equal('pending');
        expect(decision.votes).to.deep.equal([]);
        expect(decision.id).to.be.a('string');
        expect(decision.createdAt).to.be.instanceOf(Date);
      });
      
      it('should prevent modification of decision properties', () => {
        const decision = createCollectiveDecision('Test', 100);
        
        expect(() => {
          (decision as any).proposal = 'Modified';
        }).to.throw();
        
        expect(() => {
          (decision as any).votes.push({});
        }).to.throw();
      });
    });
    
    describe('RED: addVoteToDecision should create new decisions with votes', () => {
      it('should add a vote to a decision', () => {
        const decision = createCollectiveDecision('Test proposal', 100);
        const newDecision = addVoteToDecision(decision, 'node1', 'approve', 50);
        
        // Test that a new decision is created
        expect(newDecision).to.not.equal(decision);
        
        // Test that the vote is added
        expect(newDecision.votes).to.have.length(1);
        expect(newDecision.votes[0].nodeId).to.equal('node1');
        expect(newDecision.votes[0].vote).to.equal('approve');
        expect(newDecision.votes[0].weight).to.equal(50);
        
        // Test that the original decision is unchanged
        expect(decision.votes).to.deep.equal([]);
      });
      
      it('should calculate outcome correctly when threshold is met', () => {
        const decision = createCollectiveDecision('Test proposal', 100);
        const decision1 = addVoteToDecision(decision, 'node1', 'approve', 60);
        const decision2 = addVoteToDecision(decision1, 'node2', 'approve', 50);
        
        expect(decision2.outcome).to.equal('approved');
      });
      
      it('should maintain pending status when threshold is not met', () => {
        const decision = createCollectiveDecision('Test proposal', 100);
        const decision1 = addVoteToDecision(decision, 'node1', 'approve', 30);
        const decision2 = addVoteToDecision(decision1, 'node2', 'reject', 20);
        
        expect(decision2.outcome).to.equal('pending');
      });
    });
    
    describe('RED: createEmergentBehavior should create immutable behavior patterns', () => {
      it('should create an emergent behavior with all properties', () => {
        const behavior = createEmergentBehavior(
          'cooperation',
          ['node1', 'node2', 'node3'],
          0.8,
          0.9
        );
        
        // Test that the behavior is immutable
        expect(Object.isFrozen(behavior)).to.be.true;
        
        // Test properties
        expect(behavior.pattern).to.equal('cooperation');
        expect(behavior.participants).to.deep.equal(['node1', 'node2', 'node3']);
        expect(behavior.strength).to.equal(0.8);
        expect(behavior.stability).to.equal(0.9);
        expect(behavior.id).to.be.a('string');
        expect(behavior.lastObserved).to.be.instanceOf(Date);
        expect(behavior.metadata).to.deep.equal({});
      });
    });
  });
  
  describe('🎮 Gaming Immutable Operations', () => {
    
    describe('RED: createImmutableGameState should create immutable game states', () => {
      it('should create a game state with initial players', () => {
        const players = [
          { address: '0x123', score: 0 },
          { address: '0x456', score: 0 }
        ];
        
        const gameState = createImmutableGameState('game1', players);
        
        // Test that the game state is immutable
        expect(Object.isFrozen(gameState)).to.be.true;
        
        // Test initial state
        expect(gameState.gameId).to.equal('game1');
        expect(gameState.status).to.equal('waiting');
        expect(gameState.players).to.have.length(2);
        expect(gameState.version).to.equal(1);
        expect(gameState.createdAt).to.be.instanceOf(Date);
        expect(gameState.updatedAt).to.be.instanceOf(Date);
        
        // Test that players are immutable
        expect(Object.isFrozen(gameState.players[0])).to.be.true;
        expect(Object.isFrozen(gameState.players[1])).to.be.true;
      });
    });
    
    describe('RED: updatePlayerScore should create new game states with updated scores', () => {
      it('should update a player score', () => {
        const players = [
          { address: '0x123', score: 0 },
          { address: '0x456', score: 0 }
        ];
        
        const gameState = createImmutableGameState('game1', players);
        const newGameState = updatePlayerScore(gameState, '0x123', 100);
        
        // Test that a new game state is created
        expect(newGameState).to.not.equal(gameState);
        
        // Test that the score is updated
        const updatedPlayer = newGameState.players.find(p => p.address === '0x123');
        expect(updatedPlayer?.score).to.equal(100);
        
        // Test that version is incremented
        expect(newGameState.version).to.equal(2);
        
        // Test that the original game state is unchanged
        const originalPlayer = gameState.players.find(p => p.address === '0x123');
        expect(originalPlayer?.score).to.equal(0);
      });
      
      it('should handle non-existent player addresses', () => {
        const players = [
          { address: '0x123', score: 0 }
        ];
        
        const gameState = createImmutableGameState('game1', players);
        const newGameState = updatePlayerScore(gameState, '0x999', 100);
        
        // Should return the original game state unchanged
        expect(newGameState).to.equal(gameState);
      });
    });
  });
  
  describe('🤖 AI Immutable Operations', () => {
    
    describe('RED: createImmutableAIModelState should create immutable AI model states', () => {
      it('should create an AI model state with all properties', () => {
        const parameters = {
          learningRate: 0.001,
          batchSize: 32,
          epochs: 100
        };
        
        const modelState = createImmutableAIModelState(
          'model1',
          'Test Model',
          'novasanctum',
          parameters
        );
        
        // Test that the model state is immutable
        expect(Object.isFrozen(modelState)).to.be.true;
        
        // Test properties
        expect(modelState.modelId).to.equal('model1');
        expect(modelState.name).to.equal('Test Model');
        expect(modelState.type).to.equal('novasanctum');
        expect(modelState.parameters).to.deep.equal(parameters);
        expect(modelState.isActive).to.be.true;
        expect(modelState.createdAt).to.be.instanceOf(Date);
        
        // Test that nested objects are immutable
        expect(Object.isFrozen(modelState.parameters)).to.be.true;
        expect(Object.isFrozen(modelState.performance)).to.be.true;
      });
    });
  });
  
  describe('📊 Result Operations', () => {
    
    describe('RED: createSuccess should create immutable success results', () => {
      it('should create a success result', () => {
        const result = createSuccess('test data');
        
        // Test that the result is immutable
        expect(Object.isFrozen(result)).to.be.true;
        
        // Test properties
        expect(result.success).to.be.true;
        expect(result.data).to.equal('test data');
      });
    });
    
    describe('RED: createFailure should create immutable failure results', () => {
      it('should create a failure result', () => {
        const error = new Error('Test error');
        const result = createFailure(error);
        
        // Test that the result is immutable
        expect(Object.isFrozen(result)).to.be.true;
        
        // Test properties
        expect(result.success).to.be.false;
        expect(result.error).to.equal(error);
      });
    });
    
    describe('RED: mapResult should transform success values', () => {
      it('should map success values', () => {
        const result = createSuccess(5);
        const mappedResult = mapResult(result, x => x * 2);
        
        expect(mappedResult.success).to.be.true;
        expect(mappedResult.data).to.equal(10);
      });
      
      it('should not map failure results', () => {
        const error = new Error('Test error');
        const result = createFailure(error);
        const mappedResult = mapResult(result, (x: number) => x * 2);
        
        expect(mappedResult).to.equal(result);
      });
    });
    
    describe('RED: mapError should transform error values', () => {
      it('should map error values', () => {
        const error = new Error('Original error');
        const result = createFailure(error);
        const mappedResult = mapError(result, err => new Error(`Modified: ${err.message}`));
        
        expect(mappedResult.success).to.be.false;
        expect(mappedResult.error.message).to.equal('Modified: Original error');
      });
      
      it('should not map success results', () => {
        const result = createSuccess('test');
        const mappedResult = mapError(result, (err: Error) => new Error('Modified'));
        
        expect(mappedResult).to.equal(result);
      });
    });
  });
  
  describe('📅 Event Operations', () => {
    
    describe('RED: createImmutableEvent should create immutable events', () => {
      it('should create an event with all properties', () => {
        const eventData = { action: 'test', value: 42 };
        const event = createImmutableEvent('test_event', eventData, 'test_source');
        
        // Test that the event is immutable
        expect(Object.isFrozen(event)).to.be.true;
        
        // Test properties
        expect(event.type).to.equal('test_event');
        expect(event.data).to.deep.equal(eventData);
        expect(event.source).to.equal('test_source');
        expect(event.id).to.be.a('string');
        expect(event.timestamp).to.be.instanceOf(Date);
        expect(event.metadata).to.deep.equal({});
      });
    });
  });
  
  describe('🔧 Utility Functions', () => {
    
    describe('RED: generateId should create unique IDs', () => {
      it('should generate unique IDs', () => {
        const id1 = generateId();
        const id2 = generateId();
        
        expect(id1).to.be.a('string');
        expect(id2).to.be.a('string');
        expect(id1).to.not.equal(id2);
      });
      
      it('should generate IDs with timestamp and random components', () => {
        const id = generateId();
        const parts = id.split('-');
        
        expect(parts).to.have.length(2);
        expect(parseInt(parts[0])).to.be.a('number');
        expect(parts[1]).to.be.a('string');
        expect(parts[1].length).to.be.greaterThan(0);
      });
    });
    
    describe('RED: deepClone should create deep copies', () => {
      it('should clone primitive values', () => {
        expect(deepClone(42)).to.equal(42);
        expect(deepClone('test')).to.equal('test');
        expect(deepClone(true)).to.equal(true);
        expect(deepClone(null)).to.equal(null);
      });
      
      it('should clone arrays', () => {
        const original = [1, 2, [3, 4], { a: 5 }];
        const cloned = deepClone(original);
        
        expect(cloned).to.deep.equal(original);
        expect(cloned).to.not.equal(original);
        expect(cloned[2]).to.not.equal(original[2]);
        expect(cloned[3]).to.not.equal(original[3]);
      });
      
      it('should clone objects', () => {
        const original = { a: 1, b: { c: 2, d: [3, 4] } };
        const cloned = deepClone(original);
        
        expect(cloned).to.deep.equal(original);
        expect(cloned).to.not.equal(original);
        expect(cloned.b).to.not.equal(original.b);
        expect(cloned.b.d).to.not.equal(original.b.d);
      });
    });
    
    describe('RED: validateImmutable should validate immutable structures', () => {
      it('should validate primitive values', () => {
        expect(validateImmutable(42)).to.be.true;
        expect(validateImmutable('test')).to.be.true;
        expect(validateImmutable(true)).to.be.true;
        expect(validateImmutable(null)).to.be.true;
      });
      
      it('should validate immutable arrays', () => {
        const immutableArray = createImmutableArray([1, 2, 3]);
        expect(validateImmutable(immutableArray)).to.be.true;
      });
      
      it('should validate immutable objects', () => {
        const immutableObject = createImmutableObject({ a: 1, b: 2 });
        expect(validateImmutable(immutableObject)).to.be.true;
      });
      
      it('should reject mutable arrays', () => {
        const mutableArray = [1, 2, 3];
        expect(validateImmutable(mutableArray)).to.be.false;
      });
      
      it('should reject mutable objects', () => {
        const mutableObject = { a: 1, b: 2 };
        expect(validateImmutable(mutableObject)).to.be.false;
      });
      
      it('should validate deeply immutable structures', () => {
        const deepImmutable = createDeepImmutable({
          a: [1, 2, { b: 3, c: [4, 5] }],
          d: { e: 6, f: [7, 8] }
        });
        expect(validateImmutable(deepImmutable)).to.be.true;
      });
    });
  });
}); 