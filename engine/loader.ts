import { frontMatter, mdast, micromark, path, unist } from "../deps/mod.ts";
import { Note } from "./note.ts";
import { generateNoteId, getNoteTitle } from "./metadata.ts";
import { wikiLinkMicromark } from "../markdown/micromark/wikilink.ts";
import { refMicromark } from "../markdown/micromark/ref.ts";
import {
  WikiLinkNode,
  wikiLinkFromMarkdown,
} from "../markdown/mdast/wikilink.ts";
import { refFromMarkdown } from "../markdown/mdast/ref.ts";
import { Vault } from "./vault.ts";
import { blockAnchorMicromark } from "../markdown/micromark/blockAnchor.ts";
import { blockAnchorFromMarkdown } from "../markdown/mdast/blockAnchor.ts";

export class Loader {
  async loadNote(note: Note, vault: Vault) {
    const metadata = note.metadata;
    if (note.filePath) {
      note.content = await Deno.readTextFile(path.format(note.filePath));
      if (frontMatter.test(note.content)) {
        const { body, attrs } = frontMatter.extract(note.content);
        metadata.frontmatter = attrs;
        note.content = body;
      }

      note.document = mdast.fromMarkdown(note.content, "utf8", {
        extensions: [
          micromark.math(),
          refMicromark,
          wikiLinkMicromark,
          blockAnchorMicromark,
        ],
        mdastExtensions: [
          mdast.mathFromMarkdown(),
          refFromMarkdown,
          wikiLinkFromMarkdown,
          blockAnchorFromMarkdown,
        ],
      });

      unist.visit(note.document, "wikiLink", (node: WikiLinkNode) => {
        metadata.links.push({
          target: node.target,
          title: node.title,
        });
      });
    }

    if (metadata.frontmatter.id) metadata.id = String(metadata.frontmatter.id);
    else metadata.id = await generateNoteId(vault.config.name, note.getPath());
    metadata.title = getNoteTitle(note, metadata);
  }

  async loadVault(vault: Vault) {
    const promises: Promise<void>[] = [];
    for (const note of vault.tree.walk())
      promises.push(this.loadNote(note, vault));
    await Promise.all(promises);
  }
}
