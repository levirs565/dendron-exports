export * from "https://esm.sh/micromark-util-types@1.1.0";
export { parse } from "https://esm.sh/micromark@3.2.0/lib/parse.js";
export { preprocess } from "https://esm.sh/micromark@3.2.0/lib/preprocess.js";
export { postprocess } from "https://esm.sh/micromark@3.2.0/lib/postprocess.js";
export { math } from "https://esm.sh/micromark-extension-math@2.1.2";

declare module "https://esm.sh/micromark-util-types@1.1.0" {
  export interface TokenTypeMap {
    ref: "ref";
    refMarker: "refMarker";
    blockAnchor: "blockAnchor";
    blockAnchorMarker: "blockAnchorMarker";
    blockAnchorData: "blockAnchorData";
    refData: "refData";
    wikiLink: "wikiLink";
    wikiLinkMarker: "wikiLinkMarker";
    wikiLinkData: "wikiLinkData";
    wikiLinkTitlePipe: "wikiLinkTitlePipe";
  }
}
