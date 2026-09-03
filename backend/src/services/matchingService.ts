import { LostFoundReport, Category } from '@prisma/client';

export interface MatchScoreResult {
  report: LostFoundReport & { category?: Category };
  score: number;
  factors: {
    categoryMatch: number;
    locationSimilarity: number;
    dateSimilarity: number;
    keywordOverlap: number;
    attributeOverlap: number;
  };
  details: string[];
}

export function calculateMatchScore(
  reportA: LostFoundReport & { category?: Category },
  reportB: LostFoundReport & { category?: Category }
): MatchScoreResult {
  let score = 0;
  const factors = {
    categoryMatch: 0,
    locationSimilarity: 0,
    dateSimilarity: 0,
    keywordOverlap: 0,
    attributeOverlap: 0,
  };
  const details: string[] = [];

  // 1. Category match (30 points)
  if (reportA.categoryId === reportB.categoryId) {
    factors.categoryMatch = 30;
    details.push('Matching category (+30)');
  }

  // 2. Location similarity (25 points)
  const locA = reportA.location.toLowerCase();
  const locB = reportB.location.toLowerCase();
  if (locA === locB) {
    factors.locationSimilarity = 25;
    details.push('Exact location match (+25)');
  } else if (locA.includes(locB) || locB.includes(locA)) {
    factors.locationSimilarity = 18;
    details.push('Partial location match (+18)');
  } else {
    // Check shared words
    const wordsA = new Set(locA.split(/\s+/).filter(w => w.length > 2));
    const wordsB = locB.split(/\s+/).filter(w => w.length > 2);
    const sharedLocWords = wordsB.filter(w => wordsA.has(w));
    if (sharedLocWords.length > 0) {
      factors.locationSimilarity = 12;
      details.push(`Shared location keywords (${sharedLocWords.join(', ')}) (+12)`);
    }
  }

  // 3. Date similarity (20 points)
  const dateA = new Date(reportA.dateEvent).getTime();
  const dateB = new Date(reportB.dateEvent).getTime();
  const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) {
    factors.dateSimilarity = 20;
    details.push('Event date within 24 hours (+20)');
  } else if (diffDays <= 3) {
    factors.dateSimilarity = 15;
    details.push('Event date within 3 days (+15)');
  } else if (diffDays <= 7) {
    factors.dateSimilarity = 10;
    details.push('Event date within 7 days (+10)');
  } else if (diffDays <= 14) {
    factors.dateSimilarity = 5;
    details.push('Event date within 14 days (+5)');
  }

  // 4. Keyword overlap in Title & Description (15 points)
  const textA = `${reportA.title} ${reportA.description}`.toLowerCase();
  const textB = `${reportB.title} ${reportB.description}`.toLowerCase();

  const stopWords = new Set(['the', 'and', 'is', 'in', 'at', 'of', 'for', 'with', 'a', 'an', 'to', 'on', 'it', 'my', 'lost', 'found']);
  const tokensA = new Set(textA.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w)));
  const tokensB = textB.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));

  const matchedKeywords = Array.from(new Set(tokensB.filter(w => tokensA.has(w))));
  if (matchedKeywords.length >= 3) {
    factors.keywordOverlap = 15;
    details.push(`Strong text keyword overlap (${matchedKeywords.slice(0, 4).join(', ')}) (+15)`);
  } else if (matchedKeywords.length > 0) {
    factors.keywordOverlap = matchedKeywords.length * 5;
    details.push(`Keyword overlap (${matchedKeywords.join(', ')}) (+${factors.keywordOverlap})`);
  }

  // 5. Attribute overlap (10 points)
  const attrA = `${reportA.distinguishingAttributes || ''} ${reportA.visibleAttributes || ''}`.toLowerCase();
  const attrB = `${reportB.distinguishingAttributes || ''} ${reportB.visibleAttributes || ''}`.toLowerCase();

  const attrTokensA = new Set(attrA.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w)));
  const attrTokensB = attrB.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
  const matchedAttrs = Array.from(new Set(attrTokensB.filter(w => attrTokensA.has(w))));

  if (matchedAttrs.length > 0) {
    factors.attributeOverlap = Math.min(10, matchedAttrs.length * 5);
    details.push(`Attribute overlap (${matchedAttrs.join(', ')}) (+${factors.attributeOverlap})`);
  }

  score =
    factors.categoryMatch +
    factors.locationSimilarity +
    factors.dateSimilarity +
    factors.keywordOverlap +
    factors.attributeOverlap;

  return {
    report: reportB,
    score,
    factors,
    details,
  };
}
