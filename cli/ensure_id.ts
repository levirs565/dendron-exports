import { path } from "../deps/mod.ts";
import { Loader } from "../engine/loader.ts";
import { generateUUID } from "../engine/metadata.ts";
import { makeRawContent } from "../engine/utils.ts";
import { Vault } from "../engine/vault.ts";
import { BaseCommandArgs, loadConfig } from "./base.ts";

export async function runEnsureId(args: BaseCommandArgs) {
  console.log("Loading config");

  const options = await loadConfig(args.config);

  if (!options) {
    console.log("Options is empty");
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

  for (const note of vault.tree.walk()) {
    if (note.metadata.frontmatter.id) continue;

    const notePath = note.getPath();
    note.metadata.frontmatter.id = generateUUID();

    let fsPath: string;
    if (!note.filePath) {
      const date = Date.now();
      note.metadata.frontmatter.desc = "";
      note.metadata.frontmatter.title = note.metadata.title;
      note.metadata.frontmatter.updated = date;
      note.metadata.frontmatter.created = date;
      fsPath = path.join(vault.config.path, `${notePath}.md`);
      console.log(`Creating note ${notePath}`);
    } else {
      fsPath = path.format(note.filePath);
      console.log(`Add id to ${notePath}`);
    }

    await Deno.writeTextFile(
      fsPath,
      makeRawContent(note.metadata.frontmatter, note.content ?? "")
    );
  }
}
