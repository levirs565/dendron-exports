import { GithubSlugger, mdast, unist } from "../deps/mod.ts";
import { RefAnchor, RefSubpath, serializeRefAnchor } from "../engine/ref.ts";
import { BlockAnchorNode } from "./mdast/blockAnchor.ts";

type RefAnchorNode =
  | {
      type: "direct";
      node: unist.Node;
      index: number;
    }
  | {
      type: "in-list";
      node: unist.Node;
      index: number;
      ancestors: unist.Parent[];
    };

function findHeaderNode(
  root: mdast.Root,
  { name, minDepth }: {
    name?: string;
    minDepth?: number;
  },
  fromIndex = 0
): RefAnchorNode | null {
  const slugger = new GithubSlugger();
  let fn: (node: mdast.Heading) => boolean;
  if (name)
    fn = (node) => slugger.slug(mdast.toString(node)) === name;
  else if (minDepth) fn = (node) => node.depth <= minDepth;
  else fn = () => true;
  const index = root.children.findIndex(
    (node, index) => index >= fromIndex && node.type === "heading" && fn(node)
  );
  if (index < 0) return null;
  return {
    type: "direct",
    index,
    node: root.children[index],
  };
}

function findBlockNode(root: mdast.Root, name: string): RefAnchorNode | null {
  let foundNode: BlockAnchorNode | null = null;
  let foundAncestors: unist.Parent[] = [];
  unist.visitParents(
    root,
    "blockAnchor",
    (node: BlockAnchorNode, ancestors) => {
      if (node.value === name) {
        foundNode = node;
        foundAncestors = ancestors;
        return unist.EXIT;
      }
      return unist.CONTINUE;
    }
  );

  if (!foundNode) return null;

  const foundIndex = root.children.indexOf(
    // deno-lint-ignore no-explicit-any
    foundAncestors.length > 1 ? (foundAncestors[1] as any) : foundNode
  );
  if (foundAncestors.length > 1) {
    if (
      foundAncestors[1].children.length === 1 &&
      foundAncestors[1].children[0] === foundNode
    ) {
      return {
        type: "direct",
        index: foundIndex - 1,
        node: root.children[foundIndex - 1],
      };
    }
    if (foundAncestors[1].type === "list") {
      return {
        type: "in-list",
        index: foundIndex,
        node: foundNode,
        ancestors: foundAncestors,
      };
    }
  }

  return {
    type: "direct",
    index: foundIndex,
    node: root.children[foundIndex],
  };
}

function findBeginNode(root: mdast.Root): RefAnchorNode {
  return {
    type: "direct",
    index: 0,
    node: root.children[0],
  };
}

function findEndNode(root: mdast.Root): RefAnchorNode {
  return {
    type: "direct",
    index: root.children.length - 1,
    node: root.children[root.children.length - 1],
  };
}

function findAnchorNode(
  root: mdast.Root,
  anchor: RefAnchor
): RefAnchorNode | null {
  if (anchor.type === "header") {
    return findHeaderNode(root, { name: anchor.name });
  } else if (anchor.type === "wildcard") {
    return findHeaderNode(root, {}, 1);
  } else if (anchor.type === "block") {
    return findBlockNode(root, anchor.name);
  } else if (anchor.type === "begin") {
    return findBeginNode(root);
  } else if (anchor.type === "end") {
    return findEndNode(root);
  }
  return null;
}

function mapAncestors(root: mdast.Root, ancestors: unist.Parent[]) {
  let parent: unist.Parent = root;
  for (let i = 1; i < ancestors.length; i++) {
    const oldChild = ancestors[i];
    if (oldChild.data && oldChild.data.isMapped) {
      parent = oldChild;
      continue;
    }

    // deno-lint-ignore no-explicit-any
    const childIndex = parent.children.indexOf(oldChild as any);
    const child: unist.Parent = {
      ...oldChild,
      children: [...oldChild.children],
    };
    if (!child.data) child.data = {};
    child.data.isMapped = true;
    ancestors[i] = child;
    // deno-lint-ignore no-explicit-any
    parent.children[childIndex] = child as any;
    parent = child;
  }
}

function removeListItems(
  ancestors: unist.Parent[],
  removeBefore: boolean
): void {
  for (let i = 1; i < ancestors.length; i++) {
    const parent = ancestors[i];
    if (parent.type !== "list") continue;
    const child = ancestors[i + 1];

    const childIndex = parent.children.indexOf(child);
    if (!removeBefore) {
      parent.children = parent.children.slice(0, childIndex + 1);
    } else {
      parent.children = parent.children.slice(childIndex);
    }
  }
}

function removeExceptSingleItem(ancestors: unist.Parent[]) {
  const closestListItem = ancestors.findLast(
    (node) => node.type === "listItem"
  );
  if (!closestListItem) return;
  closestListItem.children = closestListItem.children.filter(
    (node) => node.type !== "list"
  );
}

function messageInvalidStart(name: string) {
  return `The "${name}" cannot be used as starting anchor`;
}

function removeSingleItemNestedList(ancestors: unist.Parent[]) {
  let outerList: unist.Parent | null = null;
  for (let i = 1; i < ancestors.length; i++) {
    const parent = ancestors[i];
    if (parent.type !== "list") continue;

    if (outerList) {
      outerList.children = parent.children;
    }

    outerList = parent;
    if (outerList.children.length > 1) break;
  }
}

export type ResolveRefResult =
  | { state: "success"; root: mdast.Root }
  | { state: "fail"; message: string };

export function resolveRefNodes(
  subpath: RefSubpath,
  root: mdast.Root
): ResolveRefResult {
  const { start, end } = subpath;

  if (!start)
    return {
      state: "success",
      root,
    };

  if (start.type === "end")
    return {
      state: "fail",
      message: messageInvalidStart("^end"),
    };

  if (start.type === "wildcard") {
    return {
      state: "fail",
      message: messageInvalidStart("*"),
    };
  }
  const startNode = findAnchorNode(root, start);
  if (!startNode)
    return {
      state: "fail",
      message: `Start anchor ${serializeRefAnchor(start)} found`,
    };

  const newRoot: mdast.Root = {
    type: "root",
    children: root.children.slice(startNode.index),
  };

  if (startNode.type === "in-list") {
    mapAncestors(newRoot, startNode.ancestors);
    removeListItems(startNode.ancestors, true);
  }

  let endNode: RefAnchorNode | null = null;
  if (end) endNode = findAnchorNode(newRoot, end);
  else if (start.type === "block") endNode = findBlockNode(newRoot, start.name);
  else if (start.type === "begin") endNode = findHeaderNode(newRoot, {}, 0);
  else if (start.type === "header")
    endNode =
      findHeaderNode(
        newRoot,
        { minDepth: (startNode.node as mdast.Heading).depth },
        1
      ) ?? findEndNode(newRoot);

  if (!endNode)
    if (end)
      return {
        state: "fail",
        message: `End anchor ${serializeRefAnchor(end)} found`,
      };
    else
      throw Error("resolveRefNodes unexcepted error. Could not find endNodes.");

  if (endNode.node.type === "heading") {
    endNode.index--;
  }

  newRoot.children = newRoot.children.slice(0, endNode.index + 1);
  if (endNode.type === "in-list") {
    if (startNode.node !== endNode.node)
      mapAncestors(newRoot, endNode.ancestors);
    removeListItems(endNode.ancestors, false);

    if (end && startNode.type === "in-list" && startNode.node === endNode.node)
      removeExceptSingleItem(endNode.ancestors);
  }

  if (startNode.type === "in-list")
    removeSingleItemNestedList(startNode.ancestors);
  if (endNode.type === "in-list") removeSingleItemNestedList(endNode.ancestors);

  return {
    state: "success",
    root: newRoot,
  };
}
