import { describe, it, expect } from 'vitest';
import { calculateMatchScore } from '../src/services/matchingService';

describe('Lost & Found Matching Algorithm', () => {
  it('should assign maximum category score (30) when category IDs match', () => {
    const reportLost: any = {
      id: 'rep-1',
      reportType: 'LOST',
      title: 'Sony Headphones',
      description: 'Black noise cancelling headphones',
      categoryId: 'cat-elec',
      location: 'Library 2nd Floor',
      dateEvent: new Date('2026-09-01'),
      distinguishingAttributes: 'Octocat sticker',
    };

    const reportFound: any = {
      id: 'rep-2',
      reportType: 'FOUND',
      title: 'Sony Wireless Headphones',
      description: 'Found black headphones in case',
      categoryId: 'cat-elec',
      location: 'Library 2nd Floor',
      dateEvent: new Date('2026-09-01'),
      visibleAttributes: 'Octocat sticker',
    };

    const result = calculateMatchScore(reportLost, reportFound);
    expect(result.factors.categoryMatch).toBe(30);
    expect(result.factors.locationSimilarity).toBe(25);
    expect(result.factors.dateSimilarity).toBe(20);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.details.length).toBeGreaterThan(0);
  });

  it('should calculate partial location and keyword match correctly', () => {
    const reportLost: any = {
      id: 'rep-1',
      reportType: 'LOST',
      title: 'Calculus Textbook 3rd Ed',
      description: 'Hardcover blue math book',
      categoryId: 'cat-books',
      location: 'Science Library Hall',
      dateEvent: new Date('2026-09-01'),
    };

    const reportFound: any = {
      id: 'rep-2',
      reportType: 'FOUND',
      title: 'Calculus Math Book',
      description: 'Found blue book left on desk',
      categoryId: 'cat-books',
      location: 'Science Library Reading Room',
      dateEvent: new Date('2026-09-03'),
    };

    const result = calculateMatchScore(reportLost, reportFound);
    expect(result.factors.categoryMatch).toBe(30);
    expect(result.factors.locationSimilarity).toBeGreaterThan(0);
    expect(result.factors.keywordOverlap).toBeGreaterThan(0);
  });
});
