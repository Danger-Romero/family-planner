/**
 * Builds the design tokens exported from Tokens Studio (the /tokens folder).
 *
 * Output — never edit it by hand, run `npm run tokens` instead:
 *   src/tokens/generated/tokens.css  CSS custom properties. The default theme (Light) sits on
 *                                    :root; every other theme only overrides what it changes,
 *                                    under [data-theme="<id>"], e.g. [data-theme="dark"].
 *
 * Which files are read, and in which order, comes from tokens/$metadata.json (Tokens Studio
 * keeps it up to date), so new token sets from Figma are picked up automatically.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import StyleDictionary from 'style-dictionary';
import { expandTypesMap, register } from '@tokens-studio/sd-transforms';

const TOKENS_DIR = 'tokens';
const OUT_DIR = path.join('src', 'tokens', 'generated');
/** Token sets inside this folder are alternative themes of each other (Light, Dark, …). */
const THEME_FOLDER = 'material-theme';
/** The theme that holds every token and is applied on :root. */
const DEFAULT_THEME = 'Light';

/**
 * A token as written to tokens.css.
 * @typedef {object} TokenData
 * @property {string} cssVar
 * @property {string} value
 * @property {string} [description]
 */

/** @typedef {import('style-dictionary/types').TransformedToken} TransformedToken */

// Tokens Studio writes line heights as plain numbers and means pixels, like Figma does.
// CSS reads a unitless line-height as a multiplier (64 → 64 × font size), so add the unit.
StyleDictionary.registerTransform({
  name: 'family-planner/line-height/px',
  type: 'value',
  filter: (token) => token.$type === 'lineHeight' && typeof token.$value === 'number',
  transform: (token) => `${token.$value}px`,
});

await register(StyleDictionary);

/** @type {{ tokenSetOrder: string[] }} */
const metadata = JSON.parse(await readFile(path.join(TOKENS_DIR, '$metadata.json'), 'utf8'));
const setFile = (set) => path.join(TOKENS_DIR, `${set}.json`);
const themeSets = metadata.tokenSetOrder.filter((set) => set.startsWith(`${THEME_FOLDER}/`));
const sharedSets = metadata.tokenSetOrder.filter((set) => !themeSets.includes(set));
const defaultSet = `${THEME_FOLDER}/${DEFAULT_THEME}`;
if (!themeSets.includes(defaultSet)) {
  throw new Error(`Default theme "${defaultSet}" is not listed in ${TOKENS_DIR}/$metadata.json`);
}
const baseFiles = [...sharedSets, defaultSet].map(setFile);

/**
 * The default theme returns every token. Any other theme returns only the tokens its own file
 * defines; the base files are still loaded so that its values may reference base tokens.
 * @param {string} themeSet
 * @returns {Promise<TransformedToken[]>}
 */
async function buildTheme(themeSet) {
  const isDefault = themeSet === defaultSet;
  const sd = new StyleDictionary({
    // Tokens Studio exports the W3C/DTCG format ($value, $type). Say so explicitly: the
    // auto-detection gives up when the first file is an empty set ({}).
    usesDtcg: true,
    include: isDefault ? [] : baseFiles,
    source: isDefault ? baseFiles : [setFile(themeSet)],
    preprocessors: ['tokens-studio'],
    // Split typography styles into one variable per property. The CSS `font` shorthand
    // cannot carry letter-spacing, text-case or text-decoration.
    expand: { include: ['typography'], typesMap: expandTypesMap },
    platforms: {
      css: {
        transformGroup: 'tokens-studio',
        transforms: ['name/kebab', 'family-planner/line-height/px'],
      },
    },
  });
  const { allTokens } = await sd.getPlatformTokens('css');
  return isDefault ? allTokens : allTokens.filter((token) => token.isSource);
}

/**
 * Material Theme Builder exports extra tones in each reference palette (Ref / Primary / Primary4,
 * Primary12, Primary99, …). We only keep the tones divisible by 5: 0, 5, 10 … 95, 100.
 * Other tokens with numbers in their name, like the state-layer opacities, are not tones.
 * @param {TransformedToken} token
 */
function isKeptTone(token) {
  if (token.$type !== 'color' || token.path[1] !== 'ref') return true;
  const tone = token.path.at(-1)?.match(/(\d+)$/)?.[1];
  return tone === undefined || Number(tone) % 5 === 0;
}

/**
 * @param {TransformedToken} token
 * @returns {TokenData}
 */
function toData(token) {
  const value = token.$value;
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(
      `Token "${token.path.join('.')}" (${token.$type}) has no CSS value: ${JSON.stringify(value)}. ` +
        'Add a transform for this token type in scripts/build-tokens.js.',
    );
  }
  return {
    cssVar: `--${token.name}`,
    value: String(value),
    ...(token.$description ? { description: token.$description } : {}),
  };
}

/**
 * @param {string} selector
 * @param {TokenData[]} tokens
 */
function cssBlock(selector, tokens) {
  const lines = tokens.map((token) => {
    const comment = token.description ? ` /* ${token.description.replaceAll('*/', '* /')} */` : '';
    return `  ${token.cssVar}: ${token.value};${comment}`;
  });
  return `${selector} {\n${lines.join('\n')}\n}\n`;
}

/** @type {{ id: string, name: string, selector: string, tokens: TokenData[] }[]} */
const themes = [];
for (const set of themeSets) {
  const name = set.slice(THEME_FOLDER.length + 1);
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const selector = set === defaultSet ? `:root,\n[data-theme="${id}"]` : `[data-theme="${id}"]`;
  themes.push({ id, name, selector, tokens: (await buildTheme(set)).filter(isKeptTone).map(toData) });
}
const defaultTheme = themes.find((theme) => theme.name === DEFAULT_THEME);
// Default theme first in the CSS, so the other themes' rules win when both match.
const orderedThemes = [defaultTheme, ...themes.filter((theme) => theme !== defaultTheme)];

const header = (comment) =>
  `${comment} Generated by scripts/build-tokens.js from the Tokens Studio export in /tokens.\n` +
  `${comment} Do not edit by hand. Run \`npm run tokens\` instead.\n`;

const css =
  `/*\n${header(' *')} */\n\n` + orderedThemes.map((theme) => cssBlock(theme.selector, theme.tokens)).join('\n');

await mkdir(OUT_DIR, { recursive: true });
await writeFile(path.join(OUT_DIR, 'tokens.css'), css);

console.log(`✔ ${defaultTheme.tokens.length} tokens, ${themes.length} themes → ${OUT_DIR}/tokens.css`);
