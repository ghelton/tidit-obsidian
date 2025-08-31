import { describe, it, expect } from 'vitest';
// Import regex constants and functions from main.ts
import { LIST_BULLET_REGEX, LIST_TASK_REGEX, isCursorInListLine, isListLineTask, getInsertPositionAfterBullet } from './utils';

// Helper: test cases for list bullets
const bulletCases = [
  { line: '- item', match: true },
  { line: '* item', match: true },
  { line: '+ item', match: true },
  { line: '1. item', match: true },
  { line: '2) item', match: true },
  { line: '  3. item', match: true },
  { line: 'no bullet', match: false },
  { line: ' -notalist', match: false },
];

// Helper: test cases for task list items
const taskCases = [
  { line: '- [ ] task', match: true },
  { line: '* [x] done', match: true },
  { line: '+ [custom] custom', match: true },
  { line: '1. [ ] numbered', match: true },
  { line: '2) [x] numbered done', match: true },
  { line: '3. not a task', match: false },
  { line: '- not a task', match: false },
];

describe('LIST_BULLET_REGEX', () => {
  bulletCases.forEach(({ line, match }) => {
    it(`should${match ? '' : ' not'} match: "${line}"`, () => {
      expect(LIST_BULLET_REGEX.test(line)).toBe(match);
    });
  });
});

describe('LIST_TASK_REGEX', () => {
  taskCases.forEach(({ line, match }) => {
    it(`should${match ? '' : ' not'} match: "${line}"`, () => {
      expect(LIST_TASK_REGEX.test(line)).toBe(match);
    });
  });
});

describe('isCursorInListLine', () => {
  it('matches unordered list bullets', () => {
    expect(isCursorInListLine('- item')).toBe(true);
    expect(isCursorInListLine('* item')).toBe(true);
    expect(isCursorInListLine('+ item')).toBe(true);
  });
  it('matches ordered list bullets', () => {
    expect(isCursorInListLine('1. item')).toBe(true);
    expect(isCursorInListLine('2) item')).toBe(true);
    expect(isCursorInListLine('  3. item')).toBe(true);
  });
  it('does not match non-list lines', () => {
    expect(isCursorInListLine('no bullet')).toBe(false);
    expect(isCursorInListLine(' -notalist')).toBe(false);
  });
});

describe('isListLineTask', () => {
  it('matches unordered task list items', () => {
    expect(isListLineTask('- [ ] task')).toBe(true);
    expect(isListLineTask('* [x] done')).toBe(true);
    expect(isListLineTask('+ [custom] custom')).toBe(true);
  });
  it('matches ordered task list items', () => {
    expect(isListLineTask('1. [ ] numbered')).toBe(true);
    expect(isListLineTask('2) [x] numbered done')).toBe(true);
  });
  it('does not match non-task list lines', () => {
    expect(isListLineTask('3. not a task')).toBe(false);
    expect(isListLineTask('- not a task')).toBe(false);
    expect(isListLineTask('plain text')).toBe(false);
  });
});

describe('getInsertPositionAfterBullet', () => {
  it('returns correct position for unordered list bullets', () => {
    expect(getInsertPositionAfterBullet('- item')).toBe(2);
    expect(getInsertPositionAfterBullet('* item')).toBe(2);
    expect(getInsertPositionAfterBullet('+ item')).toBe(2);
  });
  it('returns correct position for ordered list bullets', () => {
    expect(getInsertPositionAfterBullet('1. item')).toBe(3);
    expect(getInsertPositionAfterBullet('2) item')).toBe(3);
    expect(getInsertPositionAfterBullet('  3. item')).toBe(5);
  });
  it('returns -1 for non-list lines', () => {
    expect(getInsertPositionAfterBullet('no bullet')).toBe(-1);
    expect(getInsertPositionAfterBullet(' -notalist')).toBe(-1);
  });
});
