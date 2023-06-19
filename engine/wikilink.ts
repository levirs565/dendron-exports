export interface WikiLink {
  title?: string;
  target: string;
}

export interface LinkPart {
  path: string;
  subpath: string;
}

export function parseLink(link: string): LinkPart {
  const [path, subpath] = link.split("#", 2);
  return {
    path,
    subpath: subpath ?? "",
  };
}
