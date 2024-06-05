import {
  getAttributes,
  maybeRemoveTrailingComma,
  sanitizeJSON,
  simplifyChildren,
} from "./parseUtils";

/**
 * Parses HTML into a ReactElementLike object
 * using Cloudflare Worker's own HTMLRewriter
 *
 * Given the ergonomics of HTMLRewriter, this
 * is the fastest way to transform HTML, but
 * is very error prone. So it might need more
 * hardening / testing in the future.
 *
 * Or use a different, more forgiving parser
 */
export async function parseHtml(html: string): Promise<React.ReactNode | null> {
  let vdomStr = ``;

  const rewriter = new HTMLRewriter()
    .on("*", {
      element(element: Element) {
        const attrs = getAttributes(element);
        vdomStr += `{"type":"${element.tagName}", "props":{${attrs}"children": [`;
        try {
          element.onEndTag(() => {
            vdomStr = maybeRemoveTrailingComma(vdomStr);
            vdomStr += `]}},`;
          });
        } catch (e) {
          vdomStr = maybeRemoveTrailingComma(vdomStr);
          vdomStr += `]}},`;
        }
      },
      text(text: Text) {
        if (text.text) {
          const sanitized = sanitizeJSON(text.text);
          if (sanitized) {
            vdomStr += `"${sanitized}",`;
          }
        }
      },
    })
    .transform(
      new Response(
        // Add a parent to ensure that we're only dealing
        // with a single root element
        `<div style="display: flex; flex-direction: column;">${html}</div>`
      )
    );

  await rewriter.text();

  vdomStr = maybeRemoveTrailingComma(vdomStr);

  console.log(JSON.parse(vdomStr));

  let finalJson = JSON.parse(vdomStr);
  // If an element has only one children and it is a string then
  // replace the children array with the string itself
  simplifyChildren(finalJson);

  console.log(finalJson);

  try {
    return finalJson;
  } catch (e) {
    console.error(e);
    return null;
  }
}
