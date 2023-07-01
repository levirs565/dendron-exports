import { path } from "../deps/mod.ts";
import { Options } from "../mod.ts";

export interface BaseCommandArgs {
  config?: string;
}

export async function loadConfig(config: string | undefined) {
  let configPath: string;
  if (config) {
    configPath = await Deno.realPath(config);
  } else {
    configPath = await Deno.realPath("dendron-exports.config.ts");
  }
  const configURL = path.toFileUrl(configPath);

  const mod = await import(configURL.href);
  return mod.options as Options | undefined;
}
