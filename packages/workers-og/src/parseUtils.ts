import camelCase from "just-camel-case";

export const sanitizeJSON = (unsanitized: string) => {
  return unsanitized
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\f/g, "\\f")
    .replace(/"/g, '\\"');
};

export const getAttributes = (element: Element) => {
  let attrs = "";

  const style = element.getAttribute("style");

  if (style) {
    const cleanStyle = style.replace(/\n/g, "").replace(/\s\s+/g, " ");

    // Split by semicolon, but not semicolon inside ()
    let styleStr = cleanStyle
      .split(/;(?![^(]*\))/)
      .reduce<string>((acc, cur) => {
        // Split only the first colon
        const [k, v] = cur.split(/:(.+)/);
        if (k && v) {
          acc += `"${camelCase(k.trim())}": "${sanitizeJSON(v.trim())}",`;
        }
        return acc;
      }, "");

    if (styleStr.endsWith(",")) {
      styleStr = styleStr.slice(0, -1);
    }

    if (styleStr) {
      attrs += `"style":{${styleStr}},`;
    }
  }

  const src = element.getAttribute("src");

  if (src) {
    const width = element.getAttribute("width");
    const height = element.getAttribute("height");

    if (width && height) {
      attrs += `"src":"${sanitizeJSON(
        src
      )}", "width":"${width}", "height":"${height}",`;
    } else {
      console.warn(
        "Image missing width or height attribute as required by Satori"
      );
      attrs += `"src":"${sanitizeJSON(src)}",`;
    }
  }

  return attrs;
};

export const maybeRemoveTrailingComma = (str: string) => {
  if (str.endsWith(",")) {
    return str.slice(0, -1);
  }
  return str;
};

type JsonNode = {
  type: string;
  props: {
      style?: object;
      children?: (JsonNode | string)[];
  };
};

export function simplifyChildren(node: JsonNode): void {
  if (node.props && node.props.children) {
      // Process children recursively
      node.props.children = node.props.children.map(child => {
          if (typeof child === 'object') {
              simplifyChildren(child);
              return child;
          }
          return child;
      });

      // Check if children array has only one element and it's a string
      if (node.props.children.length === 1 && typeof node.props.children[0] === 'string') {
          node.props.children = `${node.props.children[0]}` as any;
      }
  }
}