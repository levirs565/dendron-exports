import { Renderer } from "./abstract.ts";

export class LumeNjkRenderer extends Renderer {
  getRefText(content: string): string {
    return `{% comp "dendron-ref" %}
${content}
{% endcomp %}`;
  }

  getWikiLinkText(url: string, title: string): string {
    return `[${title}](${url})`;
  }

  getBlockAnchorText(name: string): string {
    return `{{ comp.block-anchor({ name: "${name}" }) }}`;
  }
}
