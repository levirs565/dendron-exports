import { mdast, yaml } from "../deps/mod.ts";
import { RefNode } from "../markdown/mdast/ref.ts";
import { WikiLinkNode } from "../markdown/mdast/wikilink.ts";
import { resolveRefNodes } from "../markdown/refResolver.ts";
import { Note } from "../engine/note.ts";
import { parseRefSubpath } from "../engine/ref.ts";
import { Vault } from "../engine/vault.ts";
import { parseLink } from "../engine/wikilink.ts";
import { NotePathBuilder } from "../mod.ts";
import { BlockAnchorNode } from "../markdown/mdast/blockAnchor.ts";

export interface RendererContext {
  vault: Vault;
  pathBuilder: NotePathBuilder;
}

export abstract class Renderer {
  protected context!: RendererContext;

  constructor() {}

  setContext(context: RendererContext) {
    this.context = context;
  }

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
        wikiLink: this.createWikiLinkHandler,
        ref: this.refHandler,
        blockAnchor: this.blockAnchor,
      } as unknown as mdast.ToMarkdown.Handlers,
    });
  }

  createWikiLinkHandler = (node: WikiLinkNode) => {
    const { path, subpath } = parseLink(node.target);
    const note = this.context.vault.tree.get(path);
    const url =
      (note ? `/${this.context.pathBuilder(note)}` : path) +
      (subpath.length > 0 ? "#" + subpath : "");
    const title = note ? note.metadata.title : path;
    return this.getWikiLinkText(url, title);
  };

  refHandler = (node: RefNode) => {
    const { path, subpath } = parseLink(node.target);
    const note = this.context.vault.tree.get(path);
    let text: string;
    if (note) {
      const result = resolveRefNodes(parseRefSubpath(subpath), note.document);

      if (result.state === "success") text = this.renderDocument(result.root);
      else text = result.message;
    } else {
      text = "Could not find note";
    }

    return this.getRefText(text);
  };

  blockAnchor = (node: BlockAnchorNode) => this.getBlockAnchorText(node.value);

  abstract getRefText(content: string): string;
  abstract getWikiLinkText(url: string, title: string): string;
  abstract getBlockAnchorText(name: string): string;
}
