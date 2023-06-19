import { mdast, yaml } from "../deps/mod.ts";
import { Note } from "./note.ts";

export class Renderer {
  processFrontmatter(note: Note) {
    return {
      id: note.metadata.id,
      title: note.metadata.title,
    };
  }
  renderNote(note: Note) {
    const frontmatter = `---\n${yaml.stringify(
      this.processFrontmatter(note)
    )}\n---`;
    const content = this.renderDocument(note.document);
    return `${frontmatter}\n${content}`;
  }
  renderDocument(node: mdast.Root | mdast.Content) {
    return mdast.toMarkdown(node);
  }
}
