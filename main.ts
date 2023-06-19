import { fs, path } from "./deps/mod.ts";
import { Loader } from "./engine/loader.ts";
import { Renderer } from "./engine/renderer.ts";
import { Vault } from "./engine/vault.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const vault = new Vault("/home/levirs565/GitHub/notes/vault");
  console.log("Indexing");
  await vault.index();
  const loader = new Loader();
  console.log("Parsing");
  await Promise.all(vault.tree.flatten().map((note) => loader.load(note)));
  vault.buildBacklinks();
  console.log("Rendering");

  const target = "./target";
  const renderer = new Renderer();
  await fs.ensureDir(target);
  await Promise.all(
    vault.tree.flatten().map((note) =>
      (async () => {
        try {
          const text = renderer.renderNote(note);
          await Deno.writeTextFile(
            path.join(target, `${note.metadata.id}.md`),
            text
          );
        } catch (e) {
          console.log(e);
        }
      })()
    )
  );
}
