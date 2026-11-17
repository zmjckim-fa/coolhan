// Test support for the per-screen static contract tests. Not a test file.
//
// It reads the files of one screen as text: the HTML, the scripts the HTML loads and every web/
// file those scripts import. Each assert function below compares that text with a part of the
// contract. The expected keys and paths are written in the screen's own test file.
// A file that cannot be read fails the test, so no check passes by reading nothing.
// These checks see what the files say. Whether a button really calls its API and whether the
// screen draws is for the browser check.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_WEB_ROOT = path.join(import.meta.dirname, '..', 'web');
const DICTIONARY_FILE = 'text/ko.json';

const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'<>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>=`]+))?)*)\s*\/?>/g;
const ATTRIBUTE = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>=`]+)))?/g;
const IMPORT = /\bimport\s*(?:[^'"()]*?\bfrom\s*)?\(?\s*['"]([^'"]+)['"]/g;
const QUOTED = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const TEMPLATE_SLOT = /\$\{[^}]*\}/g;
const TEXT_CALL = /\btext\(\s*['"]([^'"]+)['"]/g;
const HEAD_TEXT = /\{\{text:([^}]+)\}\}/g;
const INLINE_HANDLER = /^on[a-z]+$/;
const TEXT_ATTRIBUTE = 'data-text';
const NAME_ATTRIBUTE = 'data-text-aria';
const VALUE_ATTRIBUTE_PREFIX = 'data-value-';
const API_PREFIX = '/api/';
const PATH_VARIABLE = '{id}';
const UNLABELLED_INPUT_TYPES = new Set(['hidden', 'submit', 'button', 'reset']);
const FORM_CONTROLS = new Set(['input', 'select', 'textarea']);

/**
 * A source file without its comments, so that checks read code and not remarks.
 * HTML loses <!-- -->. CSS loses block comments. JS loses block and line comments.
 * Quoted text is kept as it is. A quote left open at the end of a line is closed there.
 * @param {string} source
 * @param {string} fileName decides the comment syntax by its extension
 * @returns {string}
 */
export function withoutComments(source, fileName) {
  if (fileName.endsWith('.html')) return source.replace(HTML_COMMENT, '');
  const isScript = fileName.endsWith('.js');
  let kept = '';
  let quote = null;
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (quote !== null) {
      kept += char;
      if (char === '\\' && next !== undefined) {
        kept += next;
        index += 2;
        continue;
      }
      if (char === quote || (char === '\n' && quote !== '`')) quote = null;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      index = end === -1 ? source.length : end + 2;
      kept += ' ';
      continue;
    }
    if (isScript && char === '/' && next === '/') {
      const end = source.indexOf('\n', index);
      index = end === -1 ? source.length : end;
      continue;
    }
    if (char === '"' || char === "'" || (isScript && char === '`')) quote = char;
    kept += char;
    index += 1;
  }
  return kept;
}

/**
 * @typedef {object} Tag
 * @property {string} name
 * @property {Map<string, string>} attributes
 * @property {number} end offset just after the opening tag
 */

/**
 * @typedef {object} Screen
 * @property {string} htmlFile
 * @property {string} html             the HTML without comments
 * @property {Tag[]} tags              every opening tag, template content included
 * @property {string[]} entryScripts   the scripts the HTML loads, as paths under web/
 * @property {Map<string, string>} scripts  every script read: path under web/ to its text without comments
 * @property {Record<string, string>} dictionary
 */

/**
 * @param {string} webRoot
 * @param {string} file path under web/
 */
function readWebFile(webRoot, file) {
  try {
    return readFileSync(path.join(webRoot, file), 'utf8');
  } catch (error) {
    return assert.fail(`cannot read web/${file}: ${error.code ?? error.message}`);
  }
}

/**
 * @param {string} html
 * @returns {Tag[]}
 */
function parseTags(html) {
  return [...html.matchAll(TAG)].map((match) => {
    const attributes = new Map();
    for (const [, name, double, single, bare] of match[2].matchAll(ATTRIBUTE)) {
      attributes.set(name.toLowerCase(), double ?? single ?? bare ?? '');
    }
    return { name: match[1].toLowerCase(), attributes, end: match.index + match[0].length };
  });
}

/**
 * The script and every web/ file it imports, depth first. Imports of other places are not followed.
 * @param {string} webRoot
 * @param {string} file
 * @param {Map<string, string>} scripts
 */
function readScriptTree(webRoot, file, scripts) {
  if (scripts.has(file)) return;
  const source = withoutComments(readWebFile(webRoot, file), file);
  scripts.set(file, source);
  for (const [, specifier] of source.matchAll(IMPORT)) {
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) continue;
    const imported = specifier.startsWith('/')
      ? specifier.slice(1)
      : path.posix.join(path.posix.dirname(file), specifier);
    assert.ok(!imported.startsWith('..'), `web/${file} imports ${specifier}, which is outside web/`);
    readScriptTree(webRoot, imported, scripts);
  }
}

/**
 * Reads one screen. Fails when the HTML, a script it loads or a file a script imports is missing,
 * and when the HTML loads no script at all.
 * @param {string} htmlFile path under web/, for example 'home.html'
 * @param {{ webRoot?: string }} [options]
 * @returns {Screen}
 */
export function readScreen(htmlFile, { webRoot = DEFAULT_WEB_ROOT } = {}) {
  const html = withoutComments(readWebFile(webRoot, htmlFile), htmlFile);
  const tags = parseTags(html);
  const entryScripts = tags
    .filter((tag) => tag.name === 'script' && tag.attributes.has('src'))
    .map((tag) => tag.attributes.get('src').replace(/^\//, ''));
  assert.ok(entryScripts.length > 0, `web/${htmlFile} loads no script`);
  const scripts = new Map();
  for (const file of entryScripts) readScriptTree(webRoot, file, scripts);
  const dictionary = JSON.parse(readWebFile(webRoot, DICTIONARY_FILE));
  return { htmlFile, html, tags, entryScripts, scripts, dictionary };
}

/**
 * Every string and template literal of a script, with ${...} written as {id}.
 * @param {string} source
 * @returns {string[]}
 */
function literals(source) {
  return [...source.matchAll(QUOTED)].map((match) => match[2].replace(TEMPLATE_SLOT, PATH_VARIABLE));
}

/**
 * The API paths written in a script, in the notation of the API table (/api/admin/menu/{id}).
 * @param {string} source
 * @returns {string[]}
 */
export function apiPathsIn(source) {
  return [...new Set(literals(source).filter((literal) => literal.startsWith(API_PREFIX)))];
}

/**
 * @param {Screen} screen
 * @param {string} [file] one script, or every script of the screen when left out
 */
function scriptSources(screen, file) {
  if (file === undefined) return [...screen.scripts.values()];
  assert.ok(screen.scripts.has(file), `web/${screen.htmlFile} does not load or import web/${file}`);
  return [screen.scripts.get(file)];
}

/**
 * Each expected API path is written as a literal in the screen's scripts.
 * A path with a variable is expected as in the API table and written as a template literal:
 * `/api/admin/menu/${id}` is read as /api/admin/menu/{id}.
 * @param {Screen} screen
 * @param {string[]} expectedPaths
 * @param {{ file?: string }} [options] look in this script only
 */
export function assertApiPaths(screen, expectedPaths, { file } = {}) {
  assert.ok(expectedPaths.length > 0, 'no API path was expected, so nothing would be checked');
  const found = new Set(scriptSources(screen, file).flatMap(apiPathsIn));
  const where = file === undefined ? `the scripts of web/${screen.htmlFile}` : `web/${file}`;
  for (const expected of expectedPaths) {
    assert.ok(found.has(expected), `${where} does not name ${expected} (found: ${[...found].join(', ') || 'none'})`);
  }
}

/**
 * The screen's scripts import (or the HTML loads) the given web/ file.
 * @param {Screen} screen
 * @param {string} file for example 'admin-top-bar.js'
 */
export function assertImports(screen, file) {
  assert.ok(screen.scripts.has(file), `web/${screen.htmlFile} does not load or import web/${file}`);
}

/**
 * The dictionary keys the HTML names: data-text, data-text-aria, data-value-* and {{text:...}}.
 * @param {Screen} screen
 * @returns {string[]}
 */
function htmlTextKeys(screen) {
  const keys = [...screen.html.matchAll(HEAD_TEXT)].map((match) => match[1].trim());
  for (const tag of screen.tags) {
    for (const [name, value] of tag.attributes) {
      if (name === TEXT_ATTRIBUTE || name === NAME_ATTRIBUTE || name.startsWith(VALUE_ATTRIBUTE_PREFIX)) keys.push(value);
    }
  }
  return keys;
}

/**
 * Each expected key is in the dictionary and is named by the screen: in the HTML as a text
 * attribute or in a script as a string literal. Every key the HTML names and every key a script
 * passes to text() must also be in the dictionary.
 * Use it for the screen's text keys and for the text and reading-name keys of its buttons.
 * @param {Screen} screen
 * @param {string[]} expectedKeys
 */
export function assertTextKeys(screen, expectedKeys) {
  assert.ok(expectedKeys.length > 0, 'no text key was expected, so nothing would be checked');
  const inDictionary = (key) => Object.hasOwn(screen.dictionary, key);
  const inHtml = new Set(htmlTextKeys(screen));
  const sources = [...screen.scripts.values()];
  const inScripts = new Set(sources.flatMap(literals));
  for (const key of expectedKeys) {
    assert.ok(inDictionary(key), `${key} is not in the dictionary`);
    assert.ok(inHtml.has(key) || inScripts.has(key), `web/${screen.htmlFile} and its scripts do not name ${key}`);
  }
  for (const key of inHtml) {
    assert.ok(inDictionary(key), `web/${screen.htmlFile} names ${key}, which is not in the dictionary`);
  }
  for (const [file, source] of screen.scripts) {
    for (const [, key] of source.matchAll(TEXT_CALL)) {
      assert.ok(inDictionary(key), `web/${file} calls text('${key}'), which is not in the dictionary`);
    }
  }
}

/**
 * The HTML has no inline script, no style element, no style attribute, no on... attribute and
 * no javascript: address. The content security policy would block each of them.
 * @param {Screen} screen
 */
export function assertNoInlineCode(screen) {
  assert.ok(screen.tags.length > 0, `web/${screen.htmlFile} has no tags`);
  for (const tag of screen.tags) {
    assert.notEqual(tag.name, 'style', `web/${screen.htmlFile} has a style element`);
    if (tag.name === 'script') {
      assert.ok(tag.attributes.has('src'), `web/${screen.htmlFile} has an inline script`);
      const body = screen.html.slice(tag.end, screen.html.indexOf('</script', tag.end));
      assert.equal(body.trim(), '', `web/${screen.htmlFile} has a script element with code inside`);
    }
    for (const [name, value] of tag.attributes) {
      assert.notEqual(name, 'style', `web/${screen.htmlFile} has a style attribute on <${tag.name}>`);
      assert.ok(!INLINE_HANDLER.test(name), `web/${screen.htmlFile} has the ${name} attribute on <${tag.name}>`);
      assert.ok(!/^\s*javascript:/i.test(value), `web/${screen.htmlFile} has a javascript: address on <${tag.name}>`);
    }
  }
}

/**
 * @param {Screen} screen
 * @param {Tag} tag an opening tag
 * @returns {Tag[]} the opening tags between it and its closing tag
 */
function tagsInside(screen, tag) {
  const close = screen.html.indexOf(`</${tag.name}`, tag.end);
  assert.ok(close !== -1, `web/${screen.htmlFile} has a <${tag.name}> that is never closed`);
  return screen.tags.filter((other) => other.end > tag.end && other.end <= close);
}

/**
 * Every control has a label and every button has a name from the dictionary.
 * A control passes with a label element whose for attribute is its id, or with a reading name
 * key (data-text-aria) when its visible label is a column heading.
 * A button passes with a text key on itself or inside it, or with a reading name key.
 * @param {Screen} screen
 */
export function assertLabelsAndNames(screen) {
  const labelled = new Set(screen.tags.filter((tag) => tag.name === 'label').map((tag) => tag.attributes.get('for')));
  const describe = (tag) => `<${tag.name}${tag.attributes.has('id') ? ` id="${tag.attributes.get('id')}"` : ''}>`;
  for (const tag of screen.tags) {
    if (FORM_CONTROLS.has(tag.name) && !UNLABELLED_INPUT_TYPES.has(tag.attributes.get('type'))) {
      const hasLabel = tag.attributes.has('id') && labelled.has(tag.attributes.get('id'));
      assert.ok(
        hasLabel || tag.attributes.has(NAME_ATTRIBUTE),
        `web/${screen.htmlFile}: ${describe(tag)} has neither a label for it nor a ${NAME_ATTRIBUTE} key`,
      );
    }
    if (tag.name === 'button') {
      const named = tag.attributes.has(TEXT_ATTRIBUTE)
        || tag.attributes.has(NAME_ATTRIBUTE)
        || tagsInside(screen, tag).some((inner) => inner.attributes.has(TEXT_ATTRIBUTE));
      assert.ok(named, `web/${screen.htmlFile}: ${describe(tag)} has neither a ${TEXT_ATTRIBUTE} nor a ${NAME_ATTRIBUTE} key`);
    }
  }
}

/**
 * The html element names the language and the page has exactly one h1.
 * @param {Screen} screen
 * @param {string} [language]
 */
export function assertLanguageAndHeading(screen, language = 'ko') {
  const root = screen.tags.find((tag) => tag.name === 'html');
  assert.ok(root !== undefined, `web/${screen.htmlFile} has no html element`);
  assert.equal(root.attributes.get('lang'), language, `web/${screen.htmlFile}: lang`);
  const headings = screen.tags.filter((tag) => tag.name === 'h1');
  assert.equal(headings.length, 1, `web/${screen.htmlFile} must have exactly one h1`);
}
