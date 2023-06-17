import { assertEquals } from "std/testing/asserts.ts";
import { parseAsSimplifiedEvents } from "./utils.ts";
import { blockAnchorMicromark } from "./blockAnchor.ts";

function micromarkEvents(md: string) {
  return parseAsSimplifiedEvents(
    {
      extensions: [blockAnchorMicromark],
    },
    md
  );
}

Deno.test("parse block anchor", () => {
  assertEquals(micromarkEvents("begin ^block-anchor"), [
    ["enter", "content", "begin ^block-anchor"],
    ["enter", "paragraph", "begin ^block-anchor"],
    ["enter", "data", "begin "],
    ["exit", "data", "begin "],
    ["enter", "blockAnchor", "^block-anchor"],
    ["enter", "blockAnchorMarker", "^"],
    ["exit", "blockAnchorMarker", "^"],
    ["enter", "blockAnchorData", "block-anchor"],
    ["exit", "blockAnchorData", "block-anchor"],
    ["exit", "blockAnchor", "^block-anchor"],
    ["exit", "paragraph", "begin ^block-anchor"],
    ["exit", "content", "begin ^block-anchor"],
  ]);
});

Deno.test("parse block anchor at end of line", () => {
  assertEquals(micromarkEvents("begin ^block-anchor\n\n"), [
    ["enter", "content", "begin ^block-anchor"],
    ["enter", "paragraph", "begin ^block-anchor"],
    ["enter", "data", "begin "],
    ["exit", "data", "begin "],
    ["enter", "blockAnchor", "^block-anchor"],
    ["enter", "blockAnchorMarker", "^"],
    ["exit", "blockAnchorMarker", "^"],
    ["enter", "blockAnchorData", "block-anchor"],
    ["exit", "blockAnchorData", "block-anchor"],
    ["exit", "blockAnchor", "^block-anchor"],
    ["exit", "paragraph", "begin ^block-anchor"],
    ["exit", "content", "begin ^block-anchor"],
    ["enter", "lineEnding", "\n"],
    ["exit", "lineEnding", "\n"],
    ["enter", "lineEndingBlank", "\n"],
    ["exit", "lineEndingBlank", "\n"],
  ]);
});

Deno.test("parse anchor with all variation", () => {
  assertEquals(micromarkEvents("begin ^abd_ABC-19495-"), [
    ["enter", "content", "begin ^abd_ABC-19495-"],
    ["enter", "paragraph", "begin ^abd_ABC-19495-"],
    ["enter", "data", "begin "],
    ["exit", "data", "begin "],
    ["enter", "blockAnchor", "^abd_ABC-19495-"],
    ["enter", "blockAnchorMarker", "^"],
    ["exit", "blockAnchorMarker", "^"],
    ["enter", "blockAnchorData", "abd_ABC-19495-"],
    ["exit", "blockAnchorData", "abd_ABC-19495-"],
    ["exit", "blockAnchor", "^abd_ABC-19495-"],
    ["exit", "paragraph", "begin ^abd_ABC-19495-"],
    ["exit", "content", "begin ^abd_ABC-19495-"],
  ]);
});

Deno.test("do not parse anchor at middle", () => {
  assertEquals(micromarkEvents("begin ^block-anchor end"), [
    ["enter", "content", "begin ^block-anchor end"],
    ["enter", "paragraph", "begin ^block-anchor end"],
    ["enter", "data", "begin ^block-anchor end"],
    ["exit", "data", "begin ^block-anchor end"],
    ["exit", "paragraph", "begin ^block-anchor end"],
    ["exit", "content", "begin ^block-anchor end"],
  ]);
});

Deno.test("do not parse anchor caret at end", () => {
  assertEquals(micromarkEvents("begin ^block-anchor^"), [
    ["enter", "content", "begin ^block-anchor^"],
    ["enter", "paragraph", "begin ^block-anchor^"],
    ["enter", "data", "begin ^block-anchor^"],
    ["exit", "data", "begin ^block-anchor^"],
    ["exit", "paragraph", "begin ^block-anchor^"],
    ["exit", "content", "begin ^block-anchor^"],
  ]);
});

Deno.test("do not parse blank anchor", () => {
  assertEquals(
    micromarkEvents("begin ^"),

    [
      ["enter", "content", "begin ^"],
      ["enter", "paragraph", "begin ^"],
      ["enter", "data", "begin ^"],
      ["exit", "data", "begin ^"],
      ["exit", "paragraph", "begin ^"],
      ["exit", "content", "begin ^"],
    ]
  );
});
