// Deterministic checks — no AI involved. Per the "About Voxiis" context doc:
// "Some parts of localization are deterministic — tag integrity, variable
// preservation, glossary compliance — and a well-built pipeline can get
// those right every time." This is that part of the pipeline.

// Matches {{variable}}, {variable}, %s, %1$s, and {0}-style placeholders —
// the common patterns across i18n frameworks (i18next, ICU, printf-style).
const PLACEHOLDER_PATTERNS = [
  /\{\{[^}]+\}\}/g, // {{count}}
  /\{[^}]+\}/g, // {count} or {0}
  /%\d*\$?[sd]/g, // %s, %1$s, %d
];

export interface IntegrityCheckResult {
  passed: boolean;
  sourcePlaceholders: string[];
  translationPlaceholders: string[];
  missing: string[];
  extra: string[];
}

function extractPlaceholders(text: string): string[] {
  const found: string[] = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) found.push(...matches);
  }
  return found;
}

export function checkIntegrity(
  source: string,
  translation: string
): IntegrityCheckResult {
  const sourcePlaceholders = extractPlaceholders(source);
  const translationPlaceholders = extractPlaceholders(translation);

  const missing = sourcePlaceholders.filter(
    (p) => !translationPlaceholders.includes(p)
  );
  const extra = translationPlaceholders.filter(
    (p) => !sourcePlaceholders.includes(p)
  );

  return {
    passed: missing.length === 0 && extra.length === 0,
    sourcePlaceholders,
    translationPlaceholders,
    missing,
    extra,
  };
}
