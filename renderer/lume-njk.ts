import { mdast } from "../deps/mod.ts";
import { Note } from "../mod.ts";
import { Renderer, RendererRefContext } from "./abstract.ts";

function wrapRaw(orig: mdast.ToMarkdown.Handle): mdast.ToMarkdown.Handle {
  return (node: any, parent: any, state: any, info: any) => {
    const raw = orig(node, parent, state, info);
    return `{% raw %}${raw.trim()}{% endraw %}`;
  };
}

export class LumeNjkRenderer extends Renderer {
  constructor() {
    super();
    this.toMarkdownOptions.unsafe = [
      {
        character: "{",
      },
      {
        character: "}",
      },
    ];

    const extenstionHandler = this.toMarkdownOptions.extensions!.reduce(
      (result, current) => ({
        ...result,
        ...current.handlers,
      }),
      {} as any
    );

    const handlers = this.toMarkdownOptions.handlers as any;

    handlers.math = wrapRaw(extenstionHandler.math);
    handlers.inlineMath = wrapRaw(extenstionHandler.inlineMath);
    handlers.code = wrapRaw(mdast.ToMarkdown.defaultHandlers.code);
    handlers.inlineCode = wrapRaw(mdast.ToMarkdown.defaultHandlers.inlineCode);
  }

  processFrontmatter(note: Note): Record<string, unknown> {
    return {
      ...super.processFrontmatter(note),
      layout: "layouts/note.njk",
      templateEngine: ["njk", "md"],
    };
  }

  getRefText(ref: RendererRefContext): string {
    const props: Record<string, string> = {};
    if (ref.targetNote) {
      props["targetId"] = ref.targetNote.metadata.id;
      props["targetTitle"] = ref.targetNote.metadata.title;
    }
    if (ref.targetUrl) props["targetUrl"] = ref.targetUrl;
    const componentInfo = [
      `comp "ref"`,
      ...Object.entries(props).map(([key, value]) => `${key}="${value}"`),
    ].join(", ");
    return `{% ${componentInfo} %}
${ref.content}
{% endcomp %}`;
  }

  getWikiLinkText(url: string, title: string): string {
    return `[${title}](${url})`;
  }

  getBlockAnchorText(name: string): string {
    return `{{ comp.block_anchor({ name: "${name}" }) }}`;
  }
}
