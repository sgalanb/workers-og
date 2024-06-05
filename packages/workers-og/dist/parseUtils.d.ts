export declare const sanitizeJSON: (unsanitized: string) => string;
export declare const getAttributes: (element: Element) => string;
export declare const maybeRemoveTrailingComma: (str: string) => string;
type JsonNode = {
    type: string;
    props: {
        style?: object;
        children?: (JsonNode | string)[];
    };
};
export declare function simplifyChildren(node: JsonNode): void;
export {};
