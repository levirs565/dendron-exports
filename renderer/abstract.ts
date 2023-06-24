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

export interface RendererRefContext {
  targetNote?: Note;
  targetUrl?: string;
  content: string;
}

export abstract class Renderer {
  protected context!: RendererContext;
  protected toMarkdownOptions: mdast.ToMarkdown.Options;

  constructor() {
    this.toMarkdownOptions = {
      handlers: {
        wikiLink: this.createWikiLinkHandler,
        ref: this.refHandler,
        blockAnchor: this.blockAnchor,
      } as unknown as mdast.ToMarkdown.Handlers,
      extensions: [mdast.mathToMarkdown()],
    };
  }

  setContext(context: RendererContext) {
    this.context = context;
  }

  processFrontmatter(note: Note): Record<string, unknown> {
    return {
      id: note.metadata.id,
      title: note.metadata.title,
      subnotes: note.children.map((child) => child.metadata.id),
      backlinks: note.metadata.backlinks.map((child) => child.metadata.id),
    };
  }

  renderNote(note: Note) {
    const frontmatter = `---\n${yaml.stringify(
      this.processFrontmatter(note)
    )}---`;
    const content = this.renderDocument(note.document);
    return `${frontmatter}\n\n${content}`;
  }

  protected buildNoteUrl(
    note: Note | undefined,
    path: string,
    subpath: string
  ) {
    return (
      (note ? `/${this.context.pathBuilder(note)}` : path) +
      (subpath.length > 0 ? "#" + subpath : "")
    );
  }

  renderDocument(node: mdast.Root | mdast.Content) {
    return mdast.toMarkdown(node, this.toMarkdownOptions);
  }

  createWikiLinkHandler = (node: WikiLinkNode) => {
    const { path, subpath } = parseLink(node.target);
    const note = this.context.vault.tree.get(path);
    const url = this.buildNoteUrl(note, path, subpath);
    const title = note ? note.metadata.title : path;
    return this.getWikiLinkText(url, title);
  };

  refHandler = (node: RefNode) => {
    const { path, subpath } = parseLink(node.target);
    const note = this.context.vault.tree.get(path);
    const context: RendererRefContext = {
      targetNote: note,
      targetUrl: this.buildNoteUrl(note, path, subpath),
      content: "",
    };
    if (note) {
      const result = resolveRefNodes(parseRefSubpath(subpath), note.document);

      if (result.state === "success")
        context.content = this.renderDocument(result.root);
      else context.content = result.message;
    } else {
      context.content = `Could not find note "${path}"`;
    }

    return this.getRefText(context);
  };

  blockAnchor = (node: BlockAnchorNode) => this.getBlockAnchorText(node.value);

  abstract getRefText(context: RendererRefContext): string;
  abstract getWikiLinkText(url: string, title: string): string;
  abstract getBlockAnchorText(name: string): string;
}