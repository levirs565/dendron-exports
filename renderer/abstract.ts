import { mdast, yaml } from "../deps/mod.ts";
import { RefNode } from "../markdown/mdast/ref.ts";
import { WikiLinkNode } from "../markdown/mdast/wikilink.ts";
import { resolveRefNodes } from "../markdown/refResolver.ts";
import { Note } from "../engine/note.ts";
import { anchorToLinkSubpath, parseRefSubpath } from "../engine/ref.ts";
import { Vault } from "../engine/vault.ts";
import { parseLink } from "../engine/wikilink.ts";
import { NotePathBuilder } from "../mod.ts";
import { BlockAnchorNode } from "../markdown/mdast/blockAnchor.ts";
import { makeRawContent } from "../engine/utils.ts";

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
    const { id, title, ...rest } = note.metadata.frontmatter;
    const supernotes = note.getPathNotes();

    supernotes.pop();
    if (supernotes.length > 0 && supernotes[0].name === "root")
      supernotes.shift();

    return {
      id: note.metadata.id,
      title: note.metadata.title,
      subnotes: note.children.map((child) => child.metadata.id),
      supernotes: supernotes.map((sup) => sup.metadata.id),
      backlinks: note.metadata.backlinks.map((child) => child.metadata.id),
      ...rest,
    };
  }

  renderNote(note: Note) {
    return makeRawContent(
      this.processFrontmatter(note),
      this.renderDocument(note.document)
    );
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
      targetUrl: "",
      content: "",
    };
    if (note) {
      const refSubpath = parseRefSubpath(subpath);
      const result = resolveRefNodes(refSubpath, note.document);
      context.targetUrl = this.buildNoteUrl(
        note,
        path,
        refSubpath.start ? anchorToLinkSubpath(refSubpath.start) : ""
      );

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
