/**
 * Language Detection Utility
 *
 * Deterministic detection of non-English resumes per edge-cases.md:
 * "Decide and state a v1 policy rather than silently mis-scoring — either detect
 * language and show 'currently optimized for English-language resumes, results
 * may be less accurate' or explicitly restrict uploads to English for v1. Silently
 * running the English-tuned rules/keyword taxonomy against, say, a Hindi resume
 * and returning a confident-looking low score is actively misleading."
 */

export interface LanguageDetectionResult {
  /** True if the resume text appears to be in English */
  readonly isEnglish: boolean;
  /** Estimated confidence between 0.0 and 1.0 */
  readonly confidence: number;
  /** Name of detected non-English script or language family if detected */
  readonly detectedLanguageOrScript?: string;
  /** Advisory notice for user display */
  readonly warningMessage?: string;
}

// Common non-Latin script ranges
const SCRIPT_RANGES: ReadonlyArray<{ name: string; regex: RegExp }> = [
  { name: 'Devanagari / Hindi', regex: /[\u0900-\u097F]/g },
  { name: 'Arabic / Urdu', regex: /[\u0600-\u06FF\u0750-\u077F]/g },
  { name: 'East Asian (CJK)', regex: /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g },
  { name: 'Cyrillic', regex: /[\u0400-\u04FF]/g },
  { name: 'Indic script (Tamil/Telugu/Bengali/Malayalam)', regex: /[\u0980-\u0D7F]/g },
  { name: 'Greek', regex: /[\u0370-\u03FF]/g },
  { name: 'Hebrew', regex: /[\u0590-\u05FF]/g },
  { name: 'Thai', regex: /[\u0E00-\u0E7F]/g },
];

// Core English functional/stop words commonly present across all resume types
const ENGLISH_FUNCTION_WORDS = new Set([
  'the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this',
  'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your',
  'all', 'have', 'new', 'more', 'an', 'was', 'we', 'will', 'can', 'us', 'about',
  'if', 'my', 'has', 'but', 'our', 'one', 'other', 'do', 'no', 'time', 'they',
  'he', 'up', 'may', 'what', 'which', 'their', 'out', 'use', 'any', 'there',
  'see', 'only', 'so', 'his', 'when', 'who', 'also', 'now', 'help', 'get',
  'first', 'been', 'would', 'how', 'were', 'me', 'some', 'these', 'its', 'like',
  'than', 'find', 'had', 'over', 'year', 'years', 'into', 'under', 'such', 'between',
  'experience', 'education', 'skills', 'projects', 'summary', 'university', 'college',
  'responsibilities', 'responsible', 'developed', 'managed', 'led', 'created',
]);

// Distinct non-English Latin stop words for Spanish, French, German
const SPANISH_STOPWORDS = new Set(['de', 'la', 'en', 'el', 'los', 'las', 'del', 'por', 'con', 'para', 'una', 'experiencia', 'educacion', 'habilidades', 'trabajo']);
const FRENCH_STOPWORDS = new Set(['de', 'la', 'le', 'les', 'des', 'en', 'pour', 'avec', 'dans', 'sur', 'formation', 'competences', 'experience', 'etudes']);
const GERMAN_STOPWORDS = new Set(['und', 'der', 'die', 'das', 'den', 'dem', 'mit', 'von', 'für', 'fuer', 'im', 'ausbildung', 'kenntnisse', 'berufserfahrung']);

/**
 * Detects whether the provided text is in English or a non-English language.
 *
 * Evaluation steps:
 * 1. Non-Latin script detection (Devanagari, Arabic, CJK, Cyrillic, etc.).
 * 2. Latin script evaluation: checks density of English function words vs foreign stop words.
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return { isEnglish: true, confidence: 1.0 };
  }

  // 1. Check for non-Latin script presence
  const latinMatches = text.match(/[a-zA-Z]/g) || [];
  const latinCount = latinMatches.length;

  for (const script of SCRIPT_RANGES) {
    const matches = text.match(script.regex) || [];
    const scriptCount = matches.length;

    // If script characters exceed 20 and represent a significant proportion of letters (> 15%)
    if (scriptCount >= 20 && (scriptCount / (latinCount + scriptCount)) > 0.15) {
      return {
        isEnglish: false,
        confidence: Math.min(0.98, 0.7 + (scriptCount / (latinCount + scriptCount)) * 0.3),
        detectedLanguageOrScript: script.name,
        warningMessage: `Resume appears to be in a non-English script (${script.name}). Our ATS rubrics and keyword taxonomies are currently calibrated for English-language resumes; results may be less accurate.`,
      };
    }
  }

  // 2. Tokenize Latin words
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const totalWords = words.length;

  // For very short snippets (< 30 words), avoid false positives on sparse English documents
  if (totalWords < 30) {
    return { isEnglish: true, confidence: 0.8 };
  }

  let englishWordMatches = 0;
  let spanishMatches = 0;
  let frenchMatches = 0;
  let germanMatches = 0;

  for (const word of words) {
    if (ENGLISH_FUNCTION_WORDS.has(word)) englishWordMatches++;
    if (SPANISH_STOPWORDS.has(word)) spanishMatches++;
    if (FRENCH_STOPWORDS.has(word)) frenchMatches++;
    if (GERMAN_STOPWORDS.has(word)) germanMatches++;
  }

  const englishRatio = englishWordMatches / totalWords;

  // Check for distinct European Latin languages
  if (spanishMatches >= 6 && spanishMatches > englishWordMatches) {
    return {
      isEnglish: false,
      confidence: 0.9,
      detectedLanguageOrScript: 'Spanish',
      warningMessage: 'Resume appears to be written in Spanish. Our ATS rubrics and keyword taxonomies are currently calibrated for English-language resumes; results may be less accurate.',
    };
  }

  if (frenchMatches >= 6 && frenchMatches > englishWordMatches) {
    return {
      isEnglish: false,
      confidence: 0.9,
      detectedLanguageOrScript: 'French',
      warningMessage: 'Resume appears to be written in French. Our ATS rubrics and keyword taxonomies are currently calibrated for English-language resumes; results may be less accurate.',
    };
  }

  if (germanMatches >= 6 && germanMatches > englishWordMatches) {
    return {
      isEnglish: false,
      confidence: 0.9,
      detectedLanguageOrScript: 'German',
      warningMessage: 'Resume appears to be written in German. Our ATS rubrics and keyword taxonomies are currently calibrated for English-language resumes; results may be less accurate.',
    };
  }

  // If the document has over 60 words, but essentially 0 English function words (< 3%),
  // and has foreign markers, flag as non-English
  if (totalWords >= 60 && englishRatio < 0.03 && (spanishMatches >= 3 || frenchMatches >= 3 || germanMatches >= 3)) {
    return {
      isEnglish: false,
      confidence: 0.85,
      detectedLanguageOrScript: 'Non-English (Latin script)',
      warningMessage: 'Resume appears to be in a non-English language. Our ATS rubrics and keyword taxonomies are currently calibrated for English-language resumes; results may be less accurate.',
    };
  }

  return {
    isEnglish: true,
    confidence: Math.min(1.0, 0.5 + englishRatio * 2),
  };
}
