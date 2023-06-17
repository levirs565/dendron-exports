import { format } from "std/path/mod.ts";
import { fromMarkdown } from "mdast-util-from-markdown";
import { extract, test } from "std/front_matter/any.ts";
import { Note } from "./note.ts";
import { getNoteTitle } from "./metadata.ts";
import { wikiLinkMicromark } from "../markdown/micromark/wikilink.ts";
import { refMicromark } from "../markdown/micromark/ref.ts";
import {
  WikiLinkNode,
  wikiLinkFromMarkdown,
} from "../markdown/mdast/wikilink.ts";
import { refFromMarkdown } from "../markdown/mdast/ref.ts";
import { visit } from "unist-util-visit";

export class Loader {
  async load(note: Note) {
    const metadata = note.metadata;
    if (note.filePath) {
      note.content = await Deno.readTextFile(format(note.filePath));
      if (test(note.content)) {
        const { body, attrs } = extract(note.content);
        metadata.frontmatter = attrs;
        note.content = body;
      }

      note.document = fromMarkdown(note.content, "utf8", {
        extensions: [refMicromark, wikiLinkMicromark],
        mdastExtensions: [refFromMarkdown, wikiLinkFromMarkdown],
      });

      visit(note.document, "wikiLink", (node: WikiLinkNode) => {
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
