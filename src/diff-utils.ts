export interface ParsedStat {
  files: number;
  insertions: number;
  deletions: number;
}

export function parseStat(statText: string): ParsedStat {
  if (!statText) {
    return { files: 0, insertions: 0, deletions: 0 };
  }

  const filesMatch = statText.match(/(\d+)\s+file/);
  const insertionsMatch = statText.match(/(\d+)\s+insertion/);
  const deletionsMatch = statText.match(/(\d+)\s+deletion/);

  return {
    files: filesMatch ? parseInt(filesMatch[1], 10) : 0,
    insertions: insertionsMatch ? parseInt(insertionsMatch[1], 10) : 0,
    deletions: deletionsMatch ? parseInt(deletionsMatch[1], 10) : 0,
  };
}

export function truncateDiff(
  diff: string,
  maxChars: number,
  strategy: 'truncate' | 'fail' = 'truncate'
): { text: string; truncated: boolean } {
  if (diff.length <= maxChars) {
    return { text: diff, truncated: false };
  }

  if (strategy === 'fail') {
    throw new Error(
      `Staged diff exceeds maxDiffCharacters (${diff.length} > ${maxChars}) — commit in smaller batches or raise the limit.`
    );
  }

  const marker = `\n... [diff truncated: ${diff.length} chars total] ...\n`;
  const availableChars = Math.max(0, maxChars - marker.length);
  const head = Math.floor(availableChars * 0.6);
  const tail = availableChars - head;

  return {
    text: diff.slice(0, head) + marker + diff.slice(-tail),
    truncated: true,
  };
}
