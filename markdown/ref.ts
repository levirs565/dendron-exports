import { Code, Effects, Extension, State } from "micromark-util-types";
import {
  codes,
  markdownLineEnding,
  markdownLineEndingOrSpace,
} from "./utils.ts";

declare module "micromark-util-types" {
  export interface TokenTypeMap {
    ref: "ref";
    refMarker: "refMarker";
    refData: "refData";
  }
}

const startMarker = "![[";
const endMarker = "]]";

function wikiLinkTokenize(effects: Effects, ok: State, nok: State): State {
  let startMarkerCursor = 0;
  let endMarkerCursor = 0;
  let dataLength = 0;

  return start;

  function start(code: Code): State {
    effects.enter("ref");
    effects.enter("refMarker");

    return consumerStartMarker(code);
  }

  function consumerStartMarker(code: Code): State {
    if (code !== startMarker.charCodeAt(startMarkerCursor)) {
      return nok(code) as State;
    }

    effects.consume(code);
    startMarkerCursor++;

    if (startMarkerCursor === startMarker.length) {
      effects.exit("refMarker");
      effects.enter("refData");
      return consumeData;
    }
    return consumerStartMarker;
  }

  function consumeData(code: Code): State {
    if (code === endMarker.charCodeAt(0)) {
      if (dataLength == 0) return nok(code) as State;
      effects.exit("refData");
      effects.enter("refMarker");
      return consumeEndMarker(code);
    }

    if (markdownLineEnding(code) || code === codes.eof) {
      return nok(code) as State;
    }

    if (!markdownLineEndingOrSpace(code)) {
      dataLength++;
    }

    effects.consume(code);
    return consumeData;
  }

  function consumeEndMarker(code: Code): State {
    if (code !== endMarker.charCodeAt(endMarkerCursor)) {
      return nok(code) as State;
    }

    effects.consume(code);
    endMarkerCursor++;

    if (endMarkerCursor === endMarker.length) {
      effects.exit("refMarker");
      effects.exit("ref");
      return ok;
    }
    return consumeEndMarker;
  }
}

export const refExtension: Extension = {
  text: {
    [startMarker.charCodeAt(0)]: {
      name: "ref",
      tokenize: wikiLinkTokenize,
    },
  },
};
