/**
 * Building blocks for the "Design Tokens" pages in Storybook (the *.mdx files next to this one).
 *
 * Everything is drawn with the CSS variables from tokens.css — swatches use var(--…), not the
 * hex value — so the pages show what the app actually gets. The text values come from tokens.ts.
 */
import { useState, type CSSProperties } from 'react';
import { defaultThemeId, themes, themeValues, tokens, type DesignToken } from '../generated/tokens.ts';
import './TokenDocs.css';

const startsWith = (token: DesignToken, prefix: string[]) => prefix.every((segment, i) => token.path[i] === segment);

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return groups;
}

/** Every color role that changes between themes, side by side in all themes. */
export function ColorSchemes() {
  const themed = tokens.filter((token) => token.cssVar in themeValues[defaultThemeId]);
  return (
    <div className="td sb-unstyled">
      <div className="td-scroll">
        <table className="td-table td-schemes">
          <thead>
            <tr>
              <th scope="col">Token</th>
              {themes.map((theme) => (
                <th scope="col" key={theme.id}>
                  {theme.name}
                  <code>{theme.id}</code>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {themed.map((token) => (
              <tr key={token.cssVar}>
                <th scope="row">
                  <div className="td-name">{token.path.at(-1)}</div>
                  <code>{token.cssVar}</code>
                </th>
                {themes.map((theme) => (
                  // data-theme on the cell applies that theme's values to everything inside it.
                  <td key={theme.id} data-theme={theme.id} className="td-on-surface">
                    <span className="td-swatch" style={{ background: `var(${token.cssVar})` }} />
                    <code>{themeValues[theme.id][token.cssVar]}</code>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Tonal palettes: one row per palette under `prefix`, tones sorted from 0 (black) to 100 (white). */
export function TonalPalettes({ prefix }: { prefix: string[] }) {
  const tone = (token: DesignToken) => Number(token.path.at(-1)?.match(/\d+$/)?.[0] ?? 0);
  const palettes = groupBy(
    tokens.filter((token) => token.type === 'color' && startsWith(token, prefix)),
    (token) => token.path[prefix.length],
  );
  return (
    <div className="td sb-unstyled">
      {[...palettes].map(([name, tones]) => (
        <section key={name} className="td-palette">
          <div className="td-name">{name}</div>
          <div className="td-strip">
            {[...tones]
              .sort((a, b) => tone(a) - tone(b))
              .map((token) => (
                <div key={token.cssVar} className="td-tone" title={`${token.cssVar}: ${token.value}`}>
                  <span className="td-tone-swatch" style={{ background: `var(${token.cssVar})` }} />
                  <span className="td-tone-label">{tone(token)}</span>
                </div>
              ))}
          </div>
          <code>
            {tones[0].cssVar.replace(/\d+$/, '')}
            {'{tone}'}
          </code>
        </section>
      ))}
    </div>
  );
}

// Typography styles are split into one token per property by the build (see scripts/build-tokens.ts).
const typographyProperties: Record<string, keyof CSSProperties> = {
  fontFamily: 'fontFamily',
  fontWeight: 'fontWeight',
  fontSize: 'fontSize',
  lineHeight: 'lineHeight',
  letterSpacing: 'letterSpacing',
  textCase: 'textTransform',
  textDecoration: 'textDecoration',
  paragraphIndent: 'textIndent',
};

/** Every typography style (a group of fontFamily/fontSize/… tokens), rendered with its own variables. */
export function TypeScale({ sample = 'Family dinner at 18:00 — remember the groceries' }: { sample?: string }) {
  const isStyleProperty = (token: DesignToken) =>
    token.path.length > 1 && (token.path.at(-1)! in typographyProperties || token.path.at(-1) === 'paragraphSpacing');
  const styles = [...groupBy(tokens.filter(isStyleProperty), (token) => token.path.slice(0, -1).join('/'))].filter(
    ([, props]) => props.some((p) => p.path.at(-1) === 'fontSize') && props.some((p) => p.path.at(-1) === 'fontFamily'),
  );

  return (
    <div className="td sb-unstyled">
      <div className="td-scroll">
        <table className="td-table">
          <thead>
            <tr>
              <th scope="col">Style</th>
              <th scope="col">Sample</th>
              <th scope="col">Size / line height · weight · tracking</th>
            </tr>
          </thead>
          <tbody>
            {styles.map(([key, props]) => {
              const prop = (name: string) => props.find((p) => p.path.at(-1) === name);
              const style: CSSProperties = {};
              for (const p of props) {
                const cssProperty = typographyProperties[p.path.at(-1)!];
                if (cssProperty) Object.assign(style, { [cssProperty]: `var(${p.cssVar})` });
              }
              const varPrefix = prop('fontSize')!.cssVar.replace(/font-size$/, '');
              return (
                <tr key={key}>
                  <th scope="row">
                    <div className="td-name">{props[0].path.slice(-3, -1).join(' / ')}</div>
                    <code>{varPrefix}*</code>
                  </th>
                  <td>
                    <div className="td-type-sample" style={style}>
                      {sample}
                    </div>
                  </td>
                  <td className="td-nowrap">
                    <code>
                      {prop('fontSize')?.value} / {prop('lineHeight')?.value} · {prop('fontWeight')?.value} ·{' '}
                      {prop('letterSpacing')?.value}
                    </code>
                    <div className="td-muted">{prop('fontFamily')?.value}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Shadow tokens under `prefix`, each on a card. Pass `theme` to show them on that theme's surface. */
export function Elevation({ prefix, theme }: { prefix: string[]; theme?: string }) {
  const shadows = tokens.filter((token) => token.type === 'shadow' && startsWith(token, prefix));
  return (
    <div className="td sb-unstyled">
      <div className="td-elevation td-on-surface" data-theme={theme}>
        {shadows.map((token) => (
          <div key={token.cssVar} className="td-card" style={{ boxShadow: `var(${token.cssVar})` }}>
            <div className="td-name">Level {token.path.at(-1)}</div>
            <code>{token.cssVar}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function Preview({ token }: { token: DesignToken }) {
  if (token.type === 'color') return <span className="td-swatch" style={{ background: `var(${token.cssVar})` }} />;
  if (token.type === 'shadow') return <span className="td-swatch td-shadow" style={{ boxShadow: `var(${token.cssVar})` }} />;
  return null;
}

/** All tokens in one searchable table. */
export function TokenTable() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const rows = q
    ? tokens.filter((token) =>
        [token.cssVar, token.path.join(' / '), token.type, token.value].some((text) => text.toLowerCase().includes(q)),
      )
    : tokens;

  return (
    <div className="td sb-unstyled">
      <div className="td-filter">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name, Figma path, type or value…"
          aria-label="Filter tokens"
        />
        <span className="td-muted">
          {rows.length} of {tokens.length} tokens
        </span>
      </div>
      <div className="td-scroll">
        <table className="td-table">
          <thead>
            <tr>
              <th scope="col">
                <span className="td-visually-hidden">Preview</span>
              </th>
              <th scope="col">CSS variable</th>
              <th scope="col">Figma path</th>
              <th scope="col">Type</th>
              <th scope="col">Value ({themes.find((t) => t.id === defaultThemeId)?.name})</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((token) => (
              <tr key={token.cssVar}>
                <td>
                  <Preview token={token} />
                </td>
                <td>
                  <code>{token.cssVar}</code>
                </td>
                <td>{token.path.join(' / ')}</td>
                <td className="td-muted">{token.type}</td>
                <td>
                  <code>{token.value}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
