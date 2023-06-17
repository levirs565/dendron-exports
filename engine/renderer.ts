import { stringify } from "std/yaml/mod.ts";
import { Note } from "./note.ts";
import { toMarkdown } from "mdast-util-to-markdown";
import { Root, Content } from "mdast";

export class Renderer {
  processFrontmatter(note: Note) {
    return {
      id: note.metadata.id,
      title: note.metadata.title,
    };
  }
  renderNote(note: Note) {
    const frontmatter = `---\n${stringify(this.processFrontmatter(note))}\n---`;
    const content = this.renderDocument(note.document);
    return `${frontmatter}\n${content}`;
  }
  renderDocument(node: Root | Content) {
    return toMarkdown(node);
  }
}
