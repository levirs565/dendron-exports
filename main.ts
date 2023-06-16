import { Vault } from "./engine/vault.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const vault = new Vault("/home/levirs565/GitHub/notes/vault");
  await vault.index();
  console.log(vault.tree.flatten().map((note) => note.getPath()));
}
