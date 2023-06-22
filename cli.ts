import { cliffy, path } from "./deps/mod.ts";
import { Exporter } from "./engine/exporter.ts";
import { Loader } from "./engine/loader.ts";
import { Vault } from "./engine/vault.ts";
import { Options } from "./mod.ts";

async function runExport(args: { config?: string }) {
  console.log("Loading config");

  let configPath: string;
  if (args.config) {
    configPath = await Deno.realPath(args.config);
  } else {
    configPath = await Deno.realPath("dendron-exports.config.ts");
  }

  const mod = await import(configPath);
  const options: Options = mod.options;

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

  console.log("Exporting vault notes");
  const exporter = new Exporter({
    dest: path.join(options.baseDir, options.noteDest),
    renderer: options.noteRenderer,
    pathBuilder: options.notePathBuilder,
  });

  await exporter.exportVault(vault);
}

await new cliffy.Command()
  .name("dendron-exports")
  .description("Export dendron vault into markdown for SSG")
  .version("v0.1.0")
  .option("--config <config:string>", "The config file path")
  .action(runExport)
  .parse();
