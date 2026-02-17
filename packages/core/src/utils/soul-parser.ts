import { parse as parseYaml } from 'yaml';

export interface ParsedSoul {
  name: string;
  role: string;
  skills: string[];
  personality: string[];
  communication: string;
  rules: string[];
  backstory: string;
}

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

  const rules: string[] = [];
  let backstory = '';

  const sections = markdownBody.split(/^#\s+/m).filter(Boolean);
  for (const section of sections) {
    const [heading, ...lines] = section.split('\n');
    const normalizedHeading = heading.trim().toLowerCase();
    const body = lines.join('\n').trim();

    if (normalizedHeading === 'rules') {
      const bulletLines = body.split('\n').filter(l => l.trim().startsWith('-'));
      for (const line of bulletLines) {
        rules.push(line.replace(/^-\s*/, '').trim());
      }
    } else if (normalizedHeading === 'background') {
      backstory = body;
    }
  }

  return {
    name: frontmatter.name as string,
    role: frontmatter.role as string,
    skills: toStringArray(frontmatter.skills),
    personality: toStringArray(frontmatter.personality),
    communication: typeof frontmatter.communication === 'string' ? frontmatter.communication : '',
    rules,
    backstory,
  };
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string');
  if (typeof value === 'string') return [value];
  return [];
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

  if (soul.rules.length > 0) {
    parts.push('Rules you must follow:');
    for (const rule of soul.rules) {
      parts.push(`- ${rule}`);
    }
  }

  if (soul.backstory) {
    parts.push(`\nBackground:\n${soul.backstory}`);
  }

  return parts.join('\n');
}
