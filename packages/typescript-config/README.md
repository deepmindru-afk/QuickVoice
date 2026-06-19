# `@repo/typescript-config`

Shared TypeScript presets for QuickVoice packages.

## Presets

### Base

```json
{
  "extends": "@repo/typescript-config/base.json"
}
```

Runtime-neutral defaults for shared TypeScript packages. This preset does not
include browser or Node globals.

### Browser

```json
{
  "extends": "@repo/typescript-config/browser.json"
}
```

Adds DOM libraries for browser-focused packages.

### Node

```json
{
  "extends": "@repo/typescript-config/node.json"
}
```

Adds Node types without DOM libraries for server packages.

### Next.js

```json
{
  "extends": "@repo/typescript-config/nextjs.json"
}
```

Browser runtime defaults plus the Next TypeScript plugin and bundler module
resolution.

### React Library

```json
{
  "extends": "@repo/typescript-config/react-library.json"
}
```

Browser runtime defaults plus `react-jsx` JSX emit for shared React libraries.

### Strict

```json
{
  "extends": "@repo/typescript-config/strict.json"
}
```

Optional stricter checks for unused code, missing returns, fallthrough switches,
and exact optional property types.

## Consumer Dependencies

Consumers should depend on this package with `workspace:*`. Node consumers need
`@types/node` available in the consuming package when extending the Node preset.
