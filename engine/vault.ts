import { path } from "../deps/mod.ts";
import { NoteTree } from "./tree.ts";

export class Vault {
  tree = new NoteTree();

  constructor(public folder: string) {}

  isNote(name: string) {
    return path.extname(name) === ".md";
  }

  async index() {
    for await (const file of Deno.readDir(this.folder)) {
      if (!file.isFile || !this.isNote(file.name)) continue;
      const notePath = path.parse(path.join(this.folder, file.name));
      const note = this.tree.add(notePath.name, false);
      note.filePath = notePath;
    }

    this.tree.sort();
  }

  buildBacklinks() {
    for (const note of this.tree.walk()) {
      for (const link of note.metadata.links) {
        const target = this.tree.get(link.target);
        if (!target) continue;

        target.metadata.backlinks.push(note);
      }
    }
  }
}
