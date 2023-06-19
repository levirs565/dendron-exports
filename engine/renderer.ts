import { mdast, yaml } from "../deps/mod.ts";
import { RefNode } from "../markdown/mdast/ref.ts";
import { WikiLinkNode } from "../markdown/mdast/wikilink.ts";
import { resolveRefNodes } from "../markdown/refResolver.ts";
import { Note } from "./note.ts";
import { parseRefSubpath } from "./ref.ts";
import { Vault } from "./vault.ts";
import { parseLink } from "./wikilink.ts";

export class Renderer {
  constructor(public vault: Vault) {}

  processFrontmatter(note: Note) {
    return {
      id: note.metadata.id,
      title: note.metadata.title,
    };
  }

  renderNote(note: Note) {
    const frontmatter = `---\n${yaml.stringify(
      this.processFrontmatter(note)
    )}---`;
    const content = this.renderDocument(note.document);
    return `${frontmatter}\n\n${content}`;
  }

  renderDocument(node: mdast.Root | mdast.Content) {
    return mdast.toMarkdown(node, {
      handlers: {
        wikiLink: this.wikiLinkHandler,
        ref: this.refHandler,
      } as unknown as mdast.ToMarkdown.Handlers,
    });
  }

  wikiLinkHandler = (node: WikiLinkNode) => {
    const { path, subpath } = parseLink(node.target);
    const note = this.vault.tree.get(path);
    const url = (note ? `/${note.metadata.id}` : path) + "#" + subpath;
    const title = note ? note.metadata.title : path;
    return `[${title}](${url})`;
  };

  refHandler = (node: RefNode) => {
    const { path, subpath } = parseLink(node.target);
    const note = this.vault.tree.get(path);
    let text: string;
    if (note) {
      const result = resolveRefNodes(parseRefSubpath(subpath), note.document);

      if (result.state === "success") text = this.renderDocument(result.root);
      else text = result.message;
    } else {
      text = "Could not find note";
    }

    return `{% comp "dendron-ref" %}
${text}
{% endcomp %}`;
  };
}
