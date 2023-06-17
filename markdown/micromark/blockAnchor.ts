import {
  Code,
  Effects,
  Extension,
  State,
  TokenizeContext,
} from "micromark-util-types";
import { codes, markdownLineEnding } from "./utils.ts";

declare module "micromark-util-types" {
  export interface TokenTypeMap {
    blockAnchor: "blockAnchor";
    blockAnchorMarker: "blockAnchorMarker";
    blockAnchorData: "blockAnchorData";
  }
}

const startMarkerCode = "^".charCodeAt(0);
const firstUpperCode = "A".charCodeAt(0);
const lastUpperCode = "Z".charCodeAt(0);
const firstLowerCode = "a".charCodeAt(0);
const lastLowerCode = "z".charCodeAt(0);
const firstNumberCode = "0".charCodeAt(0);
const lastNumberCode = "9".charCodeAt(0);
const underscoreCode = "_".charCodeAt(0);
const hypenCode = "-".charCodeAt(0);

function isCodeAllowed(code: Code) {
  return (
    code &&
    ((code >= firstUpperCode && code <= lastUpperCode) ||
      (code >= firstLowerCode && code <= lastLowerCode) ||
      (code >= firstNumberCode && code <= lastNumberCode) ||
      code === underscoreCode ||
      code === hypenCode)
  );
}

function blockAnchorTokenize(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  let length = 0;
  return start;

  function start(code: Code): State | void {
    effects.enter("blockAnchor");
    effects.enter("blockAnchorMarker");
    return consumeStartMarker(code);
  }

  function consumeStartMarker(code: Code): State | void {
    if (code !== startMarkerCode) {
      return nok(code);
    }

    effects.consume(code);
    effects.exit("blockAnchorMarker");
    effects.enter("blockAnchorData");
    return consumeData;
  }

  function consumeData(code: Code): void | State {
    if (markdownLineEnding(code) || code === codes.eof) {
      if (length === 0) {
        return nok(code);
      }

      effects.exit("blockAnchorData");
      effects.exit("blockAnchor");
      return ok;
    }
    if (!isCodeAllowed(code)) {
      return nok(code);
    }

    effects.consume(code);
    length++;
    return consumeData;
  }
}

export const blockAnchorMicromark: Extension = {
  text: {
    [startMarkerCode]: {
      name: "blockAnchor",
      tokenize: blockAnchorTokenize,
    },
  },
};
