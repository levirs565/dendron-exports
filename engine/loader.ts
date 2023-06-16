import { format } from "std/path/mod.ts";
import { extract, test } from "std/front_matter/any.ts";
import { parseMarkdown } from "../markdown/utils.ts";
import { wikiLinkExtension, WikiLinkHandler } from "../markdown/wikilink.ts";
import { Note } from "./note.ts";
import { getNoteTitle } from "./metadata.ts";
import { refExtension } from "../markdown/ref.ts";

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

      note.document = parseMarkdown(
        {
          extensions: [refExtension, wikiLinkExtension],
        },
        note.content
      );

      const linkHandler = new WikiLinkHandler();
      for (const event of note.document) {
        if (linkHandler.on(event)) {
          if (linkHandler.link) metadata.links.push(linkHandler.link);
        }
      }
    }

    if (metadata.frontmatter.id) metadata.id = String(metadata.frontmatter.id);
    metadata.title = getNoteTitle(note, metadata);
  }
}
