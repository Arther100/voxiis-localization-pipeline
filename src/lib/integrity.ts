
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
