/**
 * Builds the design tokens exported from Tokens Studio (the /tokens folder).
 *
 * Output — never edit these by hand, run `npm run tokens` instead:
 *   src/tokens/generated/tokens.css  CSS custom properties. The default theme (Light) sits on
 *                                    :root; every other theme only overrides what it changes,
 *                                    under [data-theme="<id>"], e.g. [data-theme="dark"].
 *   src/tokens/generated/tokens.ts   The same tokens as typed data, used by the Storybook docs.
 *
 * Which files are read, and in which order, comes from tokens/$metadata.json (Tokens Studio
 * keeps it up to date), so new token sets from Figma are picked up automatically.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import StyleDictionary from 'style-dictionary';
import type { TransformedToken } from 'style-dictionary/types';
import { expandTypesMap, register } from '@tokens-studio/sd-transforms';

const TOKENS_DIR = 'tokens';
const OUT_DIR = path.join('src', 'tokens', 'generated');
/** Token sets inside this folder are alternative themes of each other (Light, Dark, …). */
const THEME_FOLDER = 'material-theme';
/** The theme that holds every token and is applied on :root. */
const DEFAULT_THEME = 'Light';

interface Theme {
  id: string;
  name: string;
  selector: string;
}

interface TokenData {
  path: string[];
  cssVar: string;
  type: string;
  value: string;
  description?: string;
}

// Tokens Studio writes line heights as plain numbers and means pixels, like Figma does.
// CSS reads a unitless line-height as a multiplier (64 → 64 × font size), so add the unit.
StyleDictionary.registerTransform({
  name: 'family-planner/line-height/px',
  type: 'value',
  filter: (token) => token.$type === 'lineHeight' && typeof token.$value === 'number',
  transform: (token) => `${token.$value}px`,
});

await register(StyleDictionary);

const metadata = JSON.parse(await readFile(path.join(TOKENS_DIR, '$metadata.json'), 'utf8')) as {
  tokenSetOrder: string[];
};
const setFile = (set: string) => path.join(TOKENS_DIR, `${set}.json`);
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
 */
async function buildTheme(themeSet: string): Promise<TransformedToken[]> {
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

function toData(token: TransformedToken): TokenData {
  const value: unknown = token.$value;
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(
      `Token "${token.path.join('.')}" (${token.$type}) has no CSS value: ${JSON.stringify(value)}. ` +
        'Add a transform for this token type in scripts/build-tokens.ts.',
    );
  }
  return {
    path: token.path,
    cssVar: `--${token.name}`,
    type: token.$type ?? 'other',
    value: String(value),
    ...(token.$description ? { description: token.$description } : {}),
  };
}

function cssBlock(selector: string, tokens: TokenData[]): string {
  const lines = tokens.map((token) => {
    const comment = token.description ? ` /* ${token.description.replaceAll('*/', '* /')} */` : '';
    return `  ${token.cssVar}: ${token.value};${comment}`;
  });
  return `${selector} {\n${lines.join('\n')}\n}\n`;
}

const themes: (Theme & { tokens: TokenData[] })[] = [];
for (const set of themeSets) {
  const name = set.slice(THEME_FOLDER.length + 1);
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const selector = set === defaultSet ? `:root,\n[data-theme="${id}"]` : `[data-theme="${id}"]`;
  themes.push({ id, name, selector, tokens: (await buildTheme(set)).map(toData) });
}
const defaultTheme = themes.find((theme) => theme.name === DEFAULT_THEME)!;
// Default theme first in the CSS, so the other themes' rules win when both match.
const orderedThemes = [defaultTheme, ...themes.filter((theme) => theme !== defaultTheme)];

// Tokens that change between themes, with their value in each theme.
const themedVars = new Set(
  themes.filter((theme) => theme !== defaultTheme).flatMap((theme) => theme.tokens.map((t) => t.cssVar)),
);
const themeValues = Object.fromEntries(
  themes.map((theme) => {
    const source = theme === defaultTheme ? theme.tokens.filter((t) => themedVars.has(t.cssVar)) : theme.tokens;
    return [theme.id, Object.fromEntries(source.map((t) => [t.cssVar, t.value]))];
  }),
);

const header = (comment: string) =>
  `${comment} Generated by scripts/build-tokens.ts from the Tokens Studio export in /tokens.\n` +
  `${comment} Do not edit by hand. Run \`npm run tokens\` instead.\n`;

const css =
  `/*\n${header(' *')} */\n\n` + orderedThemes.map((theme) => cssBlock(theme.selector, theme.tokens)).join('\n');

const ts = `${header('//')}
export interface DesignToken {
  /** Token path as named in Tokens Studio / Figma, e.g. ["Schemes", "On Primary"]. */
  path: string[];
  /** CSS custom property defined in tokens.css, e.g. "--schemes-on-primary". */
  cssVar: string;
  /** Token type, e.g. "color", "shadow", "fontSize", "lineHeight". */
  type: string;
  /** Value in the default theme, ready to use in CSS. */
  value: string;
  description?: string;
}

export interface Theme {
  /** Value for the data-theme attribute, e.g. <html data-theme="dark">. */
  id: string;
  /** Name of the token set in Tokens Studio. */
  name: string;
}

export const defaultThemeId = ${JSON.stringify(defaultTheme.id)};

export const themes: Theme[] = ${JSON.stringify(
  orderedThemes.map(({ id, name }) => ({ id, name })),
  null,
  2,
)};

/** Every token, with its value in the default theme. */
export const tokens: DesignToken[] = [
${defaultTheme.tokens.map((token) => `  ${JSON.stringify(token)},`).join('\n')}
];

/** Tokens that change between themes: themeValues[themeId][cssVar] → value. */
export const themeValues: Record<string, Record<string, string>> = ${JSON.stringify(themeValues, null, 2)};
`;

await mkdir(OUT_DIR, { recursive: true });
await writeFile(path.join(OUT_DIR, 'tokens.css'), css);
await writeFile(path.join(OUT_DIR, 'tokens.ts'), ts);

console.log(
  `✔ ${defaultTheme.tokens.length} tokens, ${themes.length} themes (${themedVars.size} tokens vary per theme) → ${OUT_DIR}/tokens.{css,ts}`,
);
