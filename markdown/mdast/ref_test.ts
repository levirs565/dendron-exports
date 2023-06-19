import { asserts, mdast, unist } from "../../deps/mod.ts";
import { refMicromark } from "../micromark/ref.ts";
import { RefNode, refFromMarkdown } from "./ref.ts";

function collectWikiLink(md: string) {
  const ast = mdast.fromMarkdown(md, "utf8", {
    extensions: [refMicromark],
    mdastExtensions: [refFromMarkdown],
  });
  const nodes: string[] = [];
  unist.visit(ast, "ref", (node: RefNode) => {
    nodes.push(node.target);
  });
  return nodes;
}

Deno.test("can parse ref", () => {
  asserts.assertEquals(collectWikiLink("![[Ref Target]]"), ["Ref Target"]);
});
