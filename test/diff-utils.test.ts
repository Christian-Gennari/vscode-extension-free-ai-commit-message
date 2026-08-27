import { describe, it, expect } from 'vitest';
import { truncateDiff, parseStat } from '../src/diff-utils';

describe('diff-utils', () => {
  describe('truncateDiff', () => {
    it('returns unchanged diff when under maxChars limit', () => {
      const diff = 'diff --git a/test.ts b/test.ts\n+hello';
      const res = truncateDiff(diff, 100);
      expect(res.truncated).toBe(false);
      expect(res.text).toBe(diff);
    });

    it('returns unchanged diff at exact boundary', () => {
      const diff = 'a'.repeat(50);
      const res = truncateDiff(diff, 50);
      expect(res.truncated).toBe(false);
      expect(res.text).toBe(diff);
    });

    it('truncates head and tail with marker when over limit', () => {
      const diff = 'A'.repeat(50) + 'B'.repeat(50);
      const res = truncateDiff(diff, 40, 'truncate');
      expect(res.truncated).toBe(true);
      expect(res.text).toContain('... [diff truncated: 100 chars total] ...');
      expect(res.text.startsWith('A'.repeat(24))).toBe(true);
      expect(res.text.endsWith('B'.repeat(16))).toBe(true);
    });

    it('throws error when strategy is fail and limit exceeded', () => {
      const diff = 'A'.repeat(100);
      expect(() => truncateDiff(diff, 50, 'fail')).toThrow(/Staged diff exceeds maxDiffCharacters/);
    });
  });

  describe('parseStat', () => {
    it('parses standard stat output with files, insertions, deletions', () => {
      const stat = ' 3 files changed, 12 insertions(+), 4 deletions(-)';
      const parsed = parseStat(stat);
      expect(parsed).toEqual({ files: 3, insertions: 12, deletions: 4 });
    });

    it('parses singular counts', () => {
      const stat = ' 1 file changed, 1 insertion(+), 1 deletion(-)';
      const parsed = parseStat(stat);
      expect(parsed).toEqual({ files: 1, insertions: 1, deletions: 1 });
    });

    it('parses stat without deletions', () => {
      const stat = ' 2 files changed, 5 insertions(+)';
      const parsed = parseStat(stat);
      expect(parsed).toEqual({ files: 2, insertions: 5, deletions: 0 });
    });

    it('parses empty or invalid stat string gracefully', () => {
      expect(parseStat('')).toEqual({ files: 0, insertions: 0, deletions: 0 });
      expect(parseStat('nothing here')).toEqual({ files: 0, insertions: 0, deletions: 0 });
    });
  });
});
