import { Loader } from "./engine/loader.ts";
import { Vault } from "./engine/vault.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const vault = new Vault("/home/levirs565/GitHub/notes/vault");
  console.log("Indexing");
  await vault.index();
  const loader = new Loader();
  console.log("Parsing");
  await Promise.all(vault.tree.flatten().map((note) => loader.load(note)));
  console.log(vault.tree.get("fisika.listrik-dinamis")?.metadata?.links);
  vault.buildBacklinks();
  console.log(
    vault.tree.get("matematika.asimtot")?.metadata.backlinks[0].getPath()
  );
}
