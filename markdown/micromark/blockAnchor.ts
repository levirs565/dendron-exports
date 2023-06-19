import { micromark } from "../../deps/mod.ts";
import { codes, markdownLineEnding } from "./utils.ts";

const startMarkerCode = "^".charCodeAt(0);
const firstUpperCode = "A".charCodeAt(0);
const lastUpperCode = "Z".charCodeAt(0);
const firstLowerCode = "a".charCodeAt(0);
const lastLowerCode = "z".charCodeAt(0);
const firstNumberCode = "0".charCodeAt(0);
const lastNumberCode = "9".charCodeAt(0);
const underscoreCode = "_".charCodeAt(0);
const hypenCode = "-".charCodeAt(0);

function isCodeAllowed(code: micromark.Code) {
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
  this: micromark.TokenizeContext,
  effects: micromark.Effects,
  ok: micromark.State,
  nok: micromark.State
): micromark.State {
  let length = 0;
  return start;

  function start(code: micromark.Code): micromark.State | void {
    effects.enter("blockAnchor");
    effects.enter("blockAnchorMarker");
    return consumeStartMarker(code);
  }

  function consumeStartMarker(code: micromark.Code): micromark.State | void {
    if (code !== startMarkerCode) {
      return nok(code);
    }

    effects.consume(code);
    effects.exit("blockAnchorMarker");
    effects.enter("blockAnchorData");
    return consumeData;
  }

  function consumeData(code: micromark.Code): micromark.State | void {
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

export const blockAnchorMicromark: micromark.Extension = {
  text: {
    [startMarkerCode]: {
      name: "blockAnchor",
      tokenize: blockAnchorTokenize,
    },
  },
};
