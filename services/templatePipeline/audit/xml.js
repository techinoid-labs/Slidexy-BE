/**
 * Minimal XML parser for Office Open XML parts. OOXML is well formed and
 * has no DTDs, so a tokenizer is enough. Nodes are { name, attrs, children };
 * text nodes are { name: "#text", text }.
 */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'" };

function decode(value) {
  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-z]+);/g, (match, code) => {
    if (code[0] === "#") {
      const point = code[1] === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : match;
    }
    return ENTITIES[code] !== undefined ? ENTITIES[code] : match;
  });
}

function parseAttrs(source) {
  const attrs = {};
  const re = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = re.exec(source))) {
    attrs[match[1]] = decode(match[2] !== undefined ? match[2] : match[3]);
  }
  return attrs;
}

const TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/([^\s>]+)\s*>|<([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;

function parseXml(source) {
  const root = { name: "#root", attrs: {}, children: [] };
  const stack = [root];
  TOKEN.lastIndex = 0;
  let match;
  while ((match = TOKEN.exec(source))) {
    const top = stack[stack.length - 1];
    if (match[1] !== undefined) {
      top.children.push({ name: "#text", text: match[1] });
    } else if (match[2]) {
      if (stack.length > 1) stack.pop();
    } else if (match[3]) {
      const node = { name: match[3], attrs: parseAttrs(match[4] || ""), children: [] };
      top.children.push(node);
      if (!match[5]) stack.push(node);
    } else if (match[6] !== undefined) {
      const text = decode(match[6]);
      if (text.trim() || top.name.endsWith(":t") || top.name === "t") top.children.push({ name: "#text", text });
    }
  }
  return root;
}

function child(node, name) {
  if (!node) return null;
  return node.children.find((item) => item.name === name) || null;
}

function children(node, name) {
  if (!node) return [];
  return node.children.filter((item) => item.name === name);
}

function path(node, ...names) {
  let current = node;
  for (const name of names) {
    current = child(current, name);
    if (!current) return null;
  }
  return current;
}

function descendants(node, name, out = []) {
  if (!node || !node.children) return out;
  for (const item of node.children) {
    if (item.name === name) out.push(item);
    if (item.children) descendants(item, name, out);
  }
  return out;
}

function textOf(node) {
  if (!node) return "";
  if (node.name === "#text") return node.text;
  return (node.children || []).map(textOf).join("");
}

module.exports = { parseXml, child, children, path, descendants, textOf };
