import { fs, path } from "../deps/mod.ts";
import { NotePathBuilder, Renderer } from "../mod.ts";
import { Note } from "./note.ts";
import { Vault } from "./vault.ts";

export interface ExporterConfig {
  dest: string;
  renderer: Renderer;
  pathBuilder: NotePathBuilder;
}

export class Exporter {
  constructor(public config: ExporterConfig) {}

  async exportVault(vault: Vault) {
    await fs.ensureDir(this.config.dest);
    this.config.renderer.setContext({
      pathBuilder: this.config.pathBuilder,
      vault,
    });

    const promises: Promise<void>[] = [];
    for (const note of vault.tree.walk()) {
      promises.push(this.exportNote(note));
    }
    await Promise.all(promises);
  }

  async exportNote(note: Note) {
    const notePath = path.join(
      this.config.dest,
      this.config.pathBuilder(note) + ".md"
    );
    await fs.ensureDir(path.dirname(notePath));
    await Deno.writeTextFile(notePath, this.config.renderer.renderNote(note));
  }
}
