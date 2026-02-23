import type { EntityState, Mood } from '../../../types.js';

export const STATE_COLORS: Record<EntityState, number> = {
  idle: 0x6b7280,
  working: 0x22c55e,
  thinking: 0xf59e0b,
  blocked: 0xef4444,
  on_break: 0x3b82f6,
  collaborating: 0x8b5cf6,
};

export const STATE_CSS_COLORS: Record<EntityState, string> = {
  idle: '#6b7280',
  working: '#22c55e',
  thinking: '#f59e0b',
  blocked: '#ef4444',
  on_break: '#3b82f6',
  collaborating: '#8b5cf6',
};

export const MOOD_EMOJIS: Record<Mood, string> = {
  happy: '\u{1F60A}',
  neutral: '\u{1F610}',
  frustrated: '\u{1F624}',
  tired: '\u{1F634}',
  excited: '\u{1F929}',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getEnergyColor(energy: number): number {
  if (energy > 50) return 0x22c55e;
  if (energy > 20) return 0xf59e0b;
  return 0xef4444;
}

export function getEnergyColorCSS(energy: number): string {
  if (energy > 50) return '#22c55e';
  if (energy > 20) return '#f59e0b';
  return '#ef4444';
}

export function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

export function xpProgress(xp: number): number {
  const level = levelFromXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  if (nextLevelXp === currentLevelXp) return 0;
  return (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
}
