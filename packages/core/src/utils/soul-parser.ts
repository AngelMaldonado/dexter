import { parse as parseYaml } from 'yaml';
import type { HierarchyRole, ParsedSoul } from '../types/entity.js';

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export function parseSoul(content: string): ParsedSoul {
  const match = content.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error('Invalid SOUL.md: missing YAML frontmatter');
  }

  const [, yamlStr, markdownBody] = match;
  const frontmatter = parseYaml(yamlStr) as Record<string, unknown>;

  if (!frontmatter.name || typeof frontmatter.name !== 'string') {
    throw new Error('Invalid SOUL.md: missing "name" in frontmatter');
  }
  if (!frontmatter.role || typeof frontmatter.role !== 'string') {
    throw new Error('Invalid SOUL.md: missing "role" in frontmatter');
  }

  const hierarchy = validateHierarchy(frontmatter.hierarchy);

  let rules = '';
  let background = '';

  const sections = markdownBody.split(/^#\s+/m).filter(Boolean);
  for (const section of sections) {
    const [heading, ...lines] = section.split('\n');
    const normalizedHeading = heading.trim().toLowerCase();
    const body = lines.join('\n').trim();

    if (normalizedHeading === 'rules') {
      rules = body;
    } else if (normalizedHeading === 'background') {
      background = body;
    }
  }

  return {
    name: frontmatter.name as string,
    role: frontmatter.role as string,
    hierarchy,
    skills: toStringArray(frontmatter.skills),
    personality: toStringArray(frontmatter.personality),
    communication: typeof frontmatter.communication === 'string' ? frontmatter.communication : '',
    mcpServers: parseMcpServers(frontmatter.mcp_servers ?? frontmatter.mcpServers),
    rules,
    background,
    rawMarkdown: content,
  };
}

function validateHierarchy(value: unknown): HierarchyRole {
  const valid: HierarchyRole[] = ['worker', 'lead', 'manager'];
  if (typeof value === 'string' && valid.includes(value as HierarchyRole)) {
    return value as HierarchyRole;
  }
  return 'worker';
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string');
  if (typeof value === 'string') return [value];
  return [];
}

function parseMcpServers(value: unknown): Record<string, Record<string, unknown>> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, Record<string, unknown>>;
  }
  return undefined;
}

export function soulToSystemPrompt(soul: ParsedSoul): string {
  const parts: string[] = [
    `You are ${soul.name}, a ${soul.role}.`,
  ];

  if (soul.personality.length > 0) {
    parts.push(`Personality: ${soul.personality.join(', ')}.`);
  }

  if (soul.communication) {
    parts.push(`Communication style: ${soul.communication}.`);
  }

  if (soul.rules) {
    parts.push(`\nRules you must follow:\n${soul.rules}`);
  }

  if (soul.background) {
    parts.push(`\nBackground:\n${soul.background}`);
  }

  return parts.join('\n');
}
