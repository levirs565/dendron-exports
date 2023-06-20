import { path } from "../deps/mod.ts";
import { NoteTree } from "./tree.ts";

export interface VaultConfig {
  path: string;
  name: string;
}

export class Vault {
  tree = new NoteTree();

  constructor(public config: VaultConfig) {}

  isNote(name: string) {
    return path.extname(name) === ".md";
  }

  async index() {
    for await (const file of Deno.readDir(this.config.path)) {
      if (!file.isFile || !this.isNote(file.name)) continue;
      const notePath = path.parse(path.join(this.config.path, file.name));
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
