import { frontMatter, mdast, path, unist } from "../deps/mod.ts";
import { Note } from "./note.ts";
import { getNoteTitle } from "./metadata.ts";
import { wikiLinkMicromark } from "../markdown/micromark/wikilink.ts";
import { refMicromark } from "../markdown/micromark/ref.ts";
import {
  WikiLinkNode,
  wikiLinkFromMarkdown,
} from "../markdown/mdast/wikilink.ts";
import { refFromMarkdown } from "../markdown/mdast/ref.ts";

export class Loader {
  async load(note: Note) {
    const metadata = note.metadata;
    if (note.filePath) {
      note.content = await Deno.readTextFile(path.format(note.filePath));
      if (frontMatter.test(note.content)) {
        const { body, attrs } = frontMatter.extract(note.content);
        metadata.frontmatter = attrs;
        note.content = body;
      }

      note.document = mdast.fromMarkdown(note.content, "utf8", {
        extensions: [refMicromark, wikiLinkMicromark],
        mdastExtensions: [refFromMarkdown, wikiLinkFromMarkdown],
      });

      unist.visit(note.document, "wikiLink", (node: WikiLinkNode) => {
        metadata.links.push({
          target: node.target,
          title: node.title,
        });
      });
    }

    if (metadata.frontmatter.id) metadata.id = String(metadata.frontmatter.id);
    metadata.title = getNoteTitle(note, metadata);
  }
}
