import { runEnsureId } from "./cli/ensure_id.ts";
import { runExport } from "./cli/export.ts";
import { cliffy } from "./deps/mod.ts";

await new cliffy.Command()
  .name("dendron-exports")
  .description("Export dendron vault into markdown for SSG")
  .version("v0.1.0")
  .globalOption("--config <config:string>", "The config file path")
  .action(runExport)
  .command("ensureId")
  .action(runEnsureId)
  .parse();
