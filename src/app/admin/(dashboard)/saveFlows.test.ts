import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const savePages = ['home', 'about', 'music', 'contact', 'link', 'archive'] as const;

describe('admin CMS save flows', () => {
  it.each(savePages)('%s routes saving through the shared success boundary', async (page) => {
    const source = await readFile(new URL(`./${page}/page.tsx`, import.meta.url), 'utf8');

    expect(source).toMatch(/import \{ runSave \} from ['"]@\/utils\/saveResult['"];/);
    expect(source).toContain('await runSave(');
  });
});
