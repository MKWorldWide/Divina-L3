// GDITier.ts
// Quantum-detailed: Enum for GDI user tiers and their thresholds.
// Used by GDIService to determine user access and privileges.
//
// Tiers:
// - DIVINE: 1000+
// - CELESTIAL: 500-999
// - ASCENDANT: 100-499
// - MORTAL: <100
//
// Usage: import { GDITier, getTierForBalance } from './GDITier';

/**
 * Enum representing the GDI user tier levels.
 * Each tier corresponds to a minimum GDI token balance threshold.
 *
 * Tiers are used for access gating, rewards, and status display across all GDI-powered games and realms.
 */
export enum GDITier {
  DIVINE = 'Divine',
  CELESTIAL = 'Celestial',
  ASCENDANT = 'Ascendant',
  MORTAL = 'Mortal',
}

/**
 * Mapping of GDI tiers to their minimum balance thresholds.
 * Used for tier calculation logic in GDIService.
 */
export const GDITierThresholds: Record<GDITier, number> = {
  [GDITier.DIVINE]: 1000,
  [GDITier.CELESTIAL]: 500,
  [GDITier.ASCENDANT]: 100,
  [GDITier.MORTAL]: 0,
};

/**
 * Returns the GDITier for a given balance.
 * @param balance GDI token balance
 * @returns GDITier enum value
 *
 * Example:
 *   getTierForBalance(1200) // GDITier.DIVINE
 *   getTierForBalance(600)  // GDITier.CELESTIAL
 *   getTierForBalance(200)  // GDITier.ASCENDANT
 *   getTierForBalance(50)   // GDITier.MORTAL
 */
export function getTierForBalance(balance: number): GDITier {
  if (balance >= GDITierThresholds[GDITier.DIVINE]) return GDITier.DIVINE;
  if (balance >= GDITierThresholds[GDITier.CELESTIAL]) return GDITier.CELESTIAL;
  if (balance >= GDITierThresholds[GDITier.ASCENDANT]) return GDITier.ASCENDANT;
  return GDITier.MORTAL;
} 