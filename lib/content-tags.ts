/**
 * Events and announcements carry no category column yet, so tags are derived
 * from their copy. Replace with a real field when editors need control.
 */
const RULES: Array<{ tag: string; pattern: RegExp }> = [
  { tag: "Opening", pattern: /\bopening\b/i },
  { tag: "Talk", pattern: /\b(talk|conversation|panel)\b/i },
  { tag: "Exhibition", pattern: /\b(exhibition|hang|gallery show)\b/i },
  { tag: "Studio", pattern: /\bstudio\b/i },
  { tag: "Music", pattern: /\b(music|single|album|ep|song|sound|listening)\b/i },
  { tag: "Release", pattern: /\b(release|single|album|ep)\b/i },
  { tag: "Art", pattern: /\b(art|painting|works?|series|canvas)\b/i },
];

export function deriveTags(...parts: Array<string | null | undefined>): string[] {
  const text = parts.filter(Boolean).join(" ");
  return RULES.filter((r) => r.pattern.test(text))
    .map((r) => r.tag)
    .slice(0, 3);
}
