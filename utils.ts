// Combined regex for Markdown list bullets (unordered and ordered)
export const LIST_BULLET_REGEX = /^\s*([-*+]|\d+[\.\)])\s+/;
// Combined regex for Markdown task list items (unordered and ordered)
export const LIST_TASK_REGEX = /^\s*([-*+]|\d+[\.\)])\s+\[[^\]]*\]\s/;

// Returns true if the line is a Markdown list item (unordered or ordered)
export function isCursorInListLine(line: string): boolean {
    return LIST_BULLET_REGEX.test(line);
}

// Returns true if the line is a Markdown task list item (unordered or ordered)
export function isListLineTask(line: string): boolean {
    return LIST_TASK_REGEX.test(line);
}

// Returns the position after the list bullet (unordered or ordered), or -1 if not a list line
export function getInsertPositionAfterBullet(line: string): number {
    const bulletMatch = line.match(LIST_BULLET_REGEX);
    if (bulletMatch) {
        return bulletMatch.index! + bulletMatch[0].length;
    }
    return -1;
}
