// GDIService.ts
// Quantum-detailed: Core service for GDI wallet balance, tier, and access logic.
// Provides methods for querying balances, calculating tiers, and verifying access gates.
//
// Dependencies: GDITier.ts, mockData.json
//
// Usage Example:
//   const balance = await GDIService.getBalance('0xuser1');
//   const tier = await GDIService.getTier('0xuser1');
//   const canAccess = await GDIService.canAccess('0xuser1', GDITier.CELESTIAL);

import { GDITier, getTierForBalance } from './GDITier';
import mockData from './mockData.json';

/**
 * GDIService provides static methods to interact with GDI wallet data.
 * In production, this would connect to a real blockchain or database.
 *
 * Security: In production, all methods should validate caller auth and sanitize inputs.
 * Performance: For mock/dev, all data is in-memory; production should use caching and efficient DB queries.
 */
export class GDIService {
  /**
   * Returns the GDI token balance for a given wallet address.
   * @param address Wallet address (string)
   * @returns Balance (number) or 0 if not found
   */
  static async getBalance(address: string): Promise<number> {
    // In production, replace with DB or blockchain query
    return Number((mockData as Record<string, number>)[address] || 0);
  }

  /**
   * Returns the GDI tier for a given wallet address.
   * @param address Wallet address (string)
   * @returns GDITier enum value
   */
  static async getTier(address: string): Promise<GDITier> {
    const balance = await this.getBalance(address);
    return getTierForBalance(balance);
  }

  /**
   * Checks if a wallet address meets or exceeds the required GDI tier.
   * @param address Wallet address (string)
   * @param requiredTier GDITier enum value
   * @returns true if address meets/exceeds required tier, false otherwise
   */
  static async canAccess(address: string, requiredTier: GDITier): Promise<boolean> {
    const userTier = await this.getTier(address);
    // Compare tier order by threshold
    const thresholds = Object.values(GDITier).map(t => getTierForBalance((mockData as Record<string, number>)[address] || 0));
    const requiredThreshold = getTierForBalance((mockData as Record<string, number>)[address] || 0);
    // Simple comparison: user must be >= required tier
    const tierOrder = [GDITier.MORTAL, GDITier.ASCENDANT, GDITier.CELESTIAL, GDITier.DIVINE];
    return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
  }
}

export default GDIService; 