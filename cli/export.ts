import { path } from "../deps/mod.ts";
import { Exporter } from "../engine/exporter.ts";
import { Loader } from "../engine/loader.ts";
import { Vault } from "../engine/vault.ts";
import { BaseCommandArgs, loadConfig } from "./base.ts";

export async function runExport(args: BaseCommandArgs) {
  console.log("Loading config");

  const options = await loadConfig(args.config);

  if (!options) {
    console.log("Option is empty");
    return;
  }

  console.log("Indexing vault");

  const vault = new Vault({
    name: options.vaultName,
    path: path.join(options.baseDir, options.vaultPath),
  });
  await vault.index();

  console.log("Load vault notes");
  const loader = new Loader();
  await loader.loadVault(vault);
  vault.buildBacklinks();

  console.log("Checking notes id");
  for (const note of vault.tree.walk()) {
    if (note.metadata.id.length > 0) continue;

    const red = "color: red";
    const yellow = "color: yellow";
    console.log(
      `%cError: Note %c${note.getPath()}%c does not have id`,
      red,
      yellow,
      red
    );
    console.error(
      `%cTo fix this you can run %cdeno task dendron_exports ensureId"`,
      red,
      yellow
    );
    return;
  }

  console.log("Exporting vault notes");
  const exporter = new Exporter({
    dest: path.join(options.baseDir, options.noteDest),
    renderer: options.noteRenderer,
    pathBuilder: options.notePathBuilder,
  });
  await exporter.exportVaultNotes(vault);

  console.log("Exporting vault assets");
  await exporter.exportVaultAssets(vault);
}
