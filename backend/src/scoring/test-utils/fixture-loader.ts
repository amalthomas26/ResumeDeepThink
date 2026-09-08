import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads a text fixture file for unit testing.
 * These are pre-extracted text representations of the 5 fixture types.
 */
export function loadFixture(filename: string): string {
  const fixturePath = path.join(__dirname, '..', '..', '..', 'test', 'fixtures', filename);
  return fs.readFileSync(fixturePath, 'utf-8');
}

/**
 * Fixture filenames mapped to their purpose.
 */
export const FIXTURES = {
  CLEAN: 'clean-resume.txt',
  TWO_COLUMN: 'two-column-resume.txt',
  SCANNED_IMAGE: 'scanned-image-resume.txt',
  EMPTY: 'empty-resume.txt',
  KEYWORD_STUFFED: 'keyword-stuffed-resume.txt',
} as const;
