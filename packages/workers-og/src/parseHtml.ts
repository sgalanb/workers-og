import {
  getAttributes,
  maybeRemoveTrailingComma,
  sanitizeJSON,
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
  let vdom = [];
  let currentElement = null;

  const rewriter = new HTMLRewriter()
    .on("*", {
      element(element: Element) {
        const attrs = getAttributes(element);
        currentElement = {
          type: element.tagName.toLowerCase(),
          props: {
            ...attrs,
            children: []
          }
        };

        element.onEndTag(() => {
          if (currentElement) {
            // If there's only one text child, set it directly
            if (currentElement.props.children.length === 1 && typeof currentElement.props.children[0] === "string") {
              currentElement.props.children = currentElement.props.children[0];
            }
            vdom.push(currentElement);
            currentElement = null;
          }
        });
      },
      text(text: Text) {
        if (text.text) {
          const sanitized = sanitizeJSON(text.text);
          if (sanitized && currentElement) {
            currentElement.props.children.push(sanitized);
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

  try {
    const vdomStr = JSON.stringify(vdom[0]); // Only take the root element
    console.log(JSON.parse(vdomStr));
    return JSON.parse(vdomStr);
  } catch (e) {
    console.error(e);
    return null;
  }
}
