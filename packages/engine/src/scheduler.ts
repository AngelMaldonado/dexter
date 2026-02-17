import type { Entity, Task } from '@dexter/core';

export class Scheduler {
  /**
   * Find the best entity to handle a task based on skill match and availability.
   * Returns null if no suitable entity is available.
   */
  findBestEntity(task: Task, entities: Entity[]): Entity | null {
    const available = entities.filter(
      e => e.state === 'idle' && e.energy > 10,
    );

    if (available.length === 0) return null;

    // Score each entity by skill match
    const scored = available.map(entity => ({
      entity,
      score: this.scoreMatch(task, entity),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Return the best match, or null if no skills match at all
    const best = scored[0];
    return best.score > 0 ? best.entity : (available[0] ?? null);
  }

  private scoreMatch(task: Task, entity: Entity): number {
    if (task.skills.length === 0) return 1; // no skill requirement, anyone can do it

    let matched = 0;
    for (const skill of task.skills) {
      if (entity.skills.includes(skill)) matched++;
    }

    const skillScore = matched / task.skills.length;
    const energyBonus = entity.energy / 100 * 0.2;
    const moodBonus = entity.mood === 'happy' || entity.mood === 'excited' ? 0.1 : 0;

    return skillScore + energyBonus + moodBonus;
  }
}
