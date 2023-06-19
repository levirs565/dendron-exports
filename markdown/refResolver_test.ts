import { asserts, mdast } from "../deps/mod.ts";
import { resolveRefNodes } from "./refResolver.ts";
import {
  BlockAnchorNode,
  blockAnchorFromMarkdown,
} from "../markdown/mdast/blockAnchor.ts";
import { blockAnchorMicromark } from "../markdown/micromark/blockAnchor.ts";
import { RefSubpath } from "../engine/ref.ts";

const dendronExample = `
This is a sample page to demonstrate note references

## Header 1

Header 1 Content

### Header 1.1 

Header 1.1 Content ^1f1egthix10t

## Header 2

Header 2 Content

### Header 2.2

Header 2.1 Content 
`;

function deepFreeze(object: any) {
  // Retrieve the property names defined on object
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];

    if ((value && typeof value === "object") || typeof value === "function") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}

function getRef(content: string, subpath: RefSubpath) {
  const contentAst = deepFreeze(
    mdast.fromMarkdown(content, "utf8", {
      extensions: [blockAnchorMicromark],
      mdastExtensions: [blockAnchorFromMarkdown],
    })
  );
  const refAst = resolveRefNodes(subpath, contentAst);
  if (refAst.state === "fail") return refAst.message;
  return refAst
    ? mdast.toMarkdown(refAst.root, {
        handlers: {
          blockAnchor: (node: BlockAnchorNode) => "^" + node.value,
        } as Partial<mdast.ToMarkdown.Handlers>,
      })
    : null;
}

Deno.test("resolve full note ref", () => {
  asserts.assertEquals(
    getRef(dendronExample, {
      text: "",
    }),
    `This is a sample page to demonstrate note references

## Header 1

Header 1 Content

### Header 1.1

Header 1.1 Content ^1f1egthix10t

## Header 2

Header 2 Content

### Header 2.2

Header 2.1 Content
`
  );
});

Deno.test("resolve header ref", () => {
  asserts.assertEquals(
    getRef(dendronExample, {
      start: {
        type: "header",
        name: "header-1",
        lineOffset: 0,
      },
      text: "",
    }),
    `## Header 1

Header 1 Content

### Header 1.1

Header 1.1 Content ^1f1egthix10t\n`
  );
});

Deno.test("resolve header at end", () => {
  asserts.assertEquals(
    getRef(dendronExample, {
      start: {
        type: "header",
        name: "header-2",
        lineOffset: 0,
      },
      text: "",
    }),
    `## Header 2

Header 2 Content

### Header 2.2

Header 2.1 Content
`
  );
});

Deno.test("resolve block ref", () => {
  asserts.assertEquals(
    getRef(dendronExample, {
      start: {
        type: "block",
        name: "1f1egthix10t",
      },
      text: "",
    }),
    "Header 1.1 Content ^1f1egthix10t\n"
  );
});

Deno.test("resolve begin ref", () => {
  asserts.assertEquals(
    getRef(dendronExample, {
      start: {
        type: "begin",
      },
      text: "",
    }),
    "This is a sample page to demonstrate note references\n"
  );
});

Deno.test("resolve range ref header to end", () => {
  asserts.assertEquals(
    getRef(dendronExample, {
      start: {
        type: "header",
        name: "header-1",
        lineOffset: 0,
      },
      end: {
        type: "end",
      },
      text: "",
    }),
    `## Header 1

Header 1 Content

### Header 1.1

Header 1.1 Content ^1f1egthix10t

## Header 2

Header 2 Content

### Header 2.2

Header 2.1 Content
`
  );
});

Deno.test("resolve range ref header to header", () => {
  asserts.assertEquals(
    getRef(dendronExample, {
      start: {
        type: "header",
        name: "header-1",
        lineOffset: 0,
      },
      end: {
        type: "header",
        name: "header-22",
        lineOffset: 0,
      },
      text: "",
    }),
    `## Header 1

Header 1 Content

### Header 1.1

Header 1.1 Content ^1f1egthix10t

## Header 2

Header 2 Content
`
  );
});

Deno.test("resolve range ref header to block", () => {
  asserts.assertEquals(
    getRef(dendronExample, {
      start: {
        type: "header",
        name: "header-1",
        lineOffset: 0,
      },
      end: {
        type: "block",
        name: "1f1egthix10t",
      },
      text: "",
    }),
    `## Header 1

Header 1 Content

### Header 1.1

Header 1.1 Content ^1f1egthix10t
`
  );
});

Deno.test("resolve header ref with wildcard", () => {
  asserts.assertEquals(
    getRef(dendronExample, {
      start: {
        type: "header",
        name: "header-1",
        lineOffset: 0,
      },
      end: {
        type: "wildcard",
      },
      text: "",
    }),
    `## Header 1

Header 1 Content
`
  );
});

const dendronBlockExample = `
Lorem ipsum dolor amet ^1234

* Item 1
* Item 2 ^second-item
  * Item 2a
  * Item 2b
* Item 3 ^third-item
* Item 4

^whole-list

| Sapiente | accusamus |
|----------|-----------|
| Laborum  | libero    |
| Ullam    | optio     |

^whole-table
`;

Deno.test("resolve block anchor in paragraph", () => {
  asserts.assertEquals(
    getRef(dendronBlockExample, {
      start: {
        type: "block",
        name: "1234",
      },
      text: "",
    }),
    "Lorem ipsum dolor amet ^1234\n"
  );
});

Deno.test("resolve block anchor after list for list", () => {
  asserts.assertEquals(
    getRef(dendronBlockExample, {
      start: {
        type: "block",
        name: "whole-list",
      },
      text: "",
    }),
    `*   Item 1
*   Item 2 ^second-item
    *   Item 2a
    *   Item 2b
*   Item 3 ^third-item
*   Item 4
`
  );
});

Deno.test("resolve block anchor list item", () => {
  asserts.assertEquals(
    getRef(dendronBlockExample, {
      start: {
        type: "block",
        name: "second-item",
      },
      text: "",
    }),
    `*   Item 2 ^second-item
    *   Item 2a
    *   Item 2b
`
  );
});

Deno.test("resolve ref anchor from list item to itself", () => {
  asserts.assertEquals(
    getRef(dendronBlockExample, {
      start: {
        type: "block",
        name: "second-item",
      },
      end: {
        type: "block",
        name: "second-item",
      },
      text: "",
    }),
    `*   Item 2 ^second-item
`
  );
});

Deno.test(
  "resolve ref anchor from list item to another item in same list",
  () => {
    asserts.assertEquals(
      getRef(dendronBlockExample, {
        start: {
          type: "block",
          name: "second-item",
        },
        end: {
          type: "block",
          name: "third-item",
        },
        text: "",
      }),
      `*   Item 2 ^second-item
    *   Item 2a
    *   Item 2b
*   Item 3 ^third-item
`
    );
  }
);

const nestedListExample = `

- Item 1
- Item 2 ^first-item
  - Item 2a ^first-nested-item
  - Item 2b
  - Item 3b ^second-nested-item
  - Item 4b
- Item 3 ^second-item
- Item 4

`;

Deno.test("resolve block nested list item", () => {
  asserts.assertEquals(
    getRef(nestedListExample, {
      start: {
        type: "block",
        name: "first-nested-item",
      },
      text: "",
    }),
    `*   Item 2a ^first-nested-item
`
  );
});

Deno.test(
  "resolve range ref from nested list item to another item in same list",
  () => {
    asserts.assertEquals(
      getRef(nestedListExample, {
        start: {
          type: "block",
          name: "first-nested-item",
        },
        end: {
          type: "block",
          name: "second-nested-item",
        },
        text: "",
      }),
      `*   Item 2a ^first-nested-item
*   Item 2b
*   Item 3b ^second-nested-item
`
    );
  }
);

Deno.test("resolve range ref from nested list item to upper level item", () => {
  asserts.assertEquals(
    getRef(nestedListExample, {
      start: {
        type: "block",
        name: "first-nested-item",
      },
      end: {
        type: "block",
        name: "second-item",
      },
      text: "",
    }),
    `*   Item 2 ^first-item
    *   Item 2a ^first-nested-item
    *   Item 2b
    *   Item 3b ^second-nested-item
    *   Item 4b
*   Item 3 ^second-item
`
  );
});
