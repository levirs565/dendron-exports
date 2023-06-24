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

  async exportVaultNotes(vault: Vault) {
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

  async exportVaultAssets(vault: Vault) {
    const srcDir = path.join(vault.config.path, "assets");
    const destDir = path.join(this.config.dest, "assets");

    if (!fs.exists(srcDir)) return;

    await fs.ensureDir(destDir);
    await fs.copy(srcDir, destDir, {
      overwrite: true,
    });
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
