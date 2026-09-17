import { load as yamlLoad } from 'js-yaml';
import tagConfig from '../content/tags.json';

const parseFrontmatter = (raw: string): { data: Record<string, unknown>; content: string } => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, content: raw };
  const data = (yamlLoad(match[1]) || {}) as Record<string, unknown>;
  return { data, content: raw.slice(match[0].length) };
};

export type ArtifactStatus = 'live' | 'prototype' | 'in-progress' | 'planned';

export interface Artifact {
  slug: string;
  title: string;
  oneLiner: string;
  url?: string;
  tags: string[];
  status: ArtifactStatus;
  featured: boolean;
  order: number;
  cover?: string;
  date?: string;
  body: string;
}

const files = import.meta.glob('/content/artifacts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const toDate = (value: unknown): string | undefined => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value == null) return undefined;
  return String(value);
};

export const artifacts: Artifact[] = Object.entries(files)
  .map(([path, raw]) => {
    const { data, content } = parseFrontmatter(raw);
    const slug = path.split('/').pop()!.replace(/\.md$/, '');
    return {
      slug,
      title: data.title || slug,
      oneLiner: data.oneLiner || '',
      url: data.url,
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status || 'planned',
      featured: Boolean(data.featured),
      order: typeof data.order === 'number' ? data.order : 100,
      cover: data.cover,
      date: toDate(data.date),
      body: content.trim(),
    } as Artifact;
  })
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

export const tagOrder: string[] = Object.keys(tagConfig);

export const tagLabel = (id: string): string =>
  (tagConfig as Record<string, { label: string }>)[id]?.label || id;
