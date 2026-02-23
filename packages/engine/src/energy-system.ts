import type { Mood } from '@dexter/core';
import { EventBus } from './event-bus.js';
import { EntityManager } from './entity-manager.js';

export class EnergySystem {
  constructor(
    private eventBus: EventBus,
    private entityManager: EntityManager,
  ) {}

  drainEnergy(entityId: string, amount: number): void {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) return;

    const previousEnergy = entity.energy;
    const newEnergy = Math.max(0, entity.energy - amount);

    this.entityManager.updateEntity(entityId, { energy: newEnergy });

    this.eventBus.emit({
      type: 'entity:energy-updated',
      timestamp: new Date().toISOString(),
      payload: {
        entityId,
        previousEnergy,
        newEnergy,
        mood: entity.mood,
      },
    });
  }

  recoverEnergy(entityId: string): void {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) return;

    const previousEnergy = entity.energy;
    const newEnergy = Math.min(100, entity.energy + entity.energyRecoveryRate);

    if (newEnergy === previousEnergy) return;

    this.entityManager.updateEntity(entityId, { energy: newEnergy });

    this.eventBus.emit({
      type: 'entity:energy-updated',
      timestamp: new Date().toISOString(),
      payload: {
        entityId,
        previousEnergy,
        newEnergy,
        mood: entity.mood,
      },
    });
  }

  updateMood(entityId: string, taskOutcome: 'success' | 'failure'): void {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) return;

    let newMood: Mood;

    if (taskOutcome === 'success') {
      switch (entity.mood) {
        case 'neutral':
        case 'happy':
          newMood = 'happy';
          break;
        case 'frustrated':
          newMood = 'neutral';
          break;
        case 'tired':
          newMood = 'neutral';
          break;
        case 'excited':
          newMood = 'excited';
          break;
        default:
          newMood = 'happy';
      }
    } else {
      switch (entity.mood) {
        case 'happy':
        case 'excited':
          newMood = 'neutral';
          break;
        case 'neutral':
          newMood = 'frustrated';
          break;
        case 'frustrated':
          newMood = 'frustrated';
          break;
        case 'tired':
          newMood = 'frustrated';
          break;
        default:
          newMood = 'frustrated';
      }
    }

    if (newMood !== entity.mood) {
      this.entityManager.updateEntity(entityId, { mood: newMood });
    }
  }

  shouldTakeBreak(entityId: string): boolean {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) return false;
    return entity.energy < 20 || entity.mood === 'tired';
  }

  getMoodModifier(mood: Mood): string {
    switch (mood) {
      case 'happy':
        return 'You are feeling enthusiastic and positive today.';
      case 'frustrated':
        return 'You are feeling a bit frustrated. Try to stay focused and methodical.';
      case 'tired':
        return 'You are feeling tired. Keep responses concise and focused.';
      case 'excited':
        return 'You are feeling excited and energized about this work!';
      case 'neutral':
      default:
        return '';
    }
  }
}
