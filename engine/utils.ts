import { yaml } from "../deps/mod.ts";

export function makeRawContent(frontMatter: Record<string, unknown>, body: string) {
  return `---
${yaml.stringify(frontMatter)}
---

${body}`;
}
