import type { Entity, Task } from '@dexter/core';

export class Scheduler {
  findBestEntity(task: Task, entities: Entity[]): Entity | null {
    const available = entities.filter(
      e => e.state === 'idle' && e.energy > 10,
    );

    if (available.length === 0) return null;

    const scored = available.map(entity => ({
      entity,
      score: this.scoreEntity(task, entity),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored[0]?.entity ?? null;
  }

  private scoreEntity(task: Task, entity: Entity): number {
    const skillOverlap = this.calculateSkillOverlap(task, entity);
    const energyScore = entity.energy / 100;
    const moodBonus = this.getMoodBonus(entity);
    const workloadScore = 1; // TODO: factor in current task count vs maxConcurrentTasks

    return (
      skillOverlap * 0.6 +
      energyScore * 0.2 +
      moodBonus * 0.1 +
      workloadScore * 0.1
    );
  }

  private calculateSkillOverlap(task: Task, entity: Entity): number {
    if (task.requiredSkills.length === 0) return 1;

    const entitySkills = entity.parsedSoul.skills;
    let matched = 0;
    for (const skill of task.requiredSkills) {
      if (entitySkills.includes(skill)) matched++;
    }

    return matched / task.requiredSkills.length;
  }

  private getMoodBonus(entity: Entity): number {
    switch (entity.mood) {
      case 'happy':
      case 'excited':
        return 1;
      case 'neutral':
        return 0.5;
      case 'frustrated':
        return 0.2;
      case 'tired':
        return 0.1;
      default:
        return 0.5;
    }
  }
}
