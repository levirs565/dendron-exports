import { asserts, mdast, unist } from "../../deps/mod.ts";
import { WikiLinkNode, wikiLinkFromMarkdown } from "./wikilink.ts";
import { wikiLinkMicromark } from "../micromark/wikilink.ts";

function collectWikiLink(md: string) {
  const ast = mdast.fromMarkdown(md, "utf8", {
    extensions: [wikiLinkMicromark],
    mdastExtensions: [wikiLinkFromMarkdown],
  });
  const nodes: (string | undefined)[][] = [];
  unist.visit(ast, "wikiLink", (node: WikiLinkNode) => {
    nodes.push([node.target, node.title]);
  });
  return nodes;
}

Deno.test("can parse wikilink without title", () => {
  asserts.assertEquals(collectWikiLink("[[Wiki Link]]"), [
    ["Wiki Link", undefined],
  ]);
});

Deno.test("parse wikilink with title", () => {
  asserts.assertEquals(collectWikiLink("[[Link Title|Wiki Link]]"), [
    ["Wiki Link", "Link Title"],
  ]);
});
