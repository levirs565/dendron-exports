import { assertEquals } from "std/testing/asserts.ts";
import { SimplifiedEvent, parseAsSimplifiedEvents } from "./utils.ts";
import { refMicromark } from "./ref.ts";

function micromarkEvents(md: string) {
  return parseAsSimplifiedEvents(
    {
      extensions: [refMicromark],
    },
    md
  );
}

Deno.test("parse ref", () => {
  const content = "![[Dendron Ref]]";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "ref", content],
    ["enter", "refMarker", "![["],
    ["exit", "refMarker", "![["],
    ["enter", "refData", "Dendron Ref"],
    ["exit", "refData", "Dendron Ref"],
    ["enter", "refMarker", "]]"],
    ["exit", "refMarker", "]]"],
    ["exit", "ref", content],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("handle open ref", () => {
  const content = "t![[\nt";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "data", "t"],
    ["exit", "data", "t"],
    ["enter", "data", "!["],
    ["exit", "data", "!["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "lineEnding", "\n"],
    ["exit", "lineEnding", "\n"],
    ["enter", "data", "t"],
    ["exit", "data", "t"],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("handles open ref links at end of file", () => {
  const content = "t ![[";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "data", "t "],
    ["exit", "data", "t "],
    ["enter", "data", "!["],
    ["exit", "data", "!["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("handles open ref with partial data", () => {
  const content = "t ![[tt\nt";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "data", "t "],
    ["exit", "data", "t "],
    ["enter", "data", "!["],
    ["exit", "data", "!["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "tt"],
    ["exit", "data", "tt"],
    ["enter", "lineEnding", "\n"],
    ["exit", "lineEnding", "\n"],
    ["enter", "data", "t"],
    ["exit", "data", "t"],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("handle invalid ref with blank data", () => {
  const content = "![[]]";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "data", "!["],
    ["exit", "data", "!["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "]]"],
    ["exit", "data", "]]"],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});
