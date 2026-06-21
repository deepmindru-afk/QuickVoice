# `@repo/eslint-config`

Collection of internal eslint configurations.

## Presets

### Base

```js
import { config } from "@repo/eslint-config/base";

export default config;
```

The base preset is runtime-neutral, includes TypeScript and Prettier
compatibility rules, and treats `turbo/no-undeclared-env-vars` as an error.

### Next.js

```js
import { defineConfig } from "eslint/config";
import { nextJsConfig } from "@repo/eslint-config/next-js";

export default defineConfig(nextJsConfig);
```

The Next.js preset composes the base preset with
`eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` so app
consumers keep the same React, hooks, import, accessibility, and Next coverage.

### React Library

```js
import { config } from "@repo/eslint-config/react-library";

export default config;
```

The React library preset composes the base preset with React, React Hooks, and
browser globals for shared UI packages.

### Type Checked

```js
import { defineConfig } from "eslint/config";
import { typeCheckedConfig } from "@repo/eslint-config/type-checked";

export default defineConfig(typeCheckedConfig);
```

This opt-in preset adds TypeScript rules that need type information, including
async and data-flow checks such as
`@typescript-eslint/no-floating-promises`. It is slower than the base preset and
should run from a workspace where ESLint can discover the package
`tsconfig.json`.

## Preset Naming

| Purpose               | Preferred subpath                   | Backwards-compatible alias           |
| --------------------- | ----------------------------------- | ------------------------------------ |
| Base                  | `@repo/eslint-config/base`          |                                      |
| Next.js app           | `@repo/eslint-config/next-js`       | `@repo/eslint-config/nextjs`         |
| React library         | `@repo/eslint-config/react-library` | `@repo/eslint-config/react-internal` |
| Type-aware TypeScript | `@repo/eslint-config/type-checked`  |                                      |

## Consumer Dependencies

Consumers should depend on this package with `workspace:*`.

Next.js consumers should also keep `eslint-config-next` aligned with their
installed `next` version. CI lint commands should run ESLint with
`--max-warnings=0` when warning-level framework rules must block merges.

## Troubleshooting

- `ERR_PACKAGE_PATH_NOT_EXPORTED`: use one of the subpaths in the preset naming
  table. Old `react-internal` imports still work, but new React library configs
  should use `react-library`.
- Next version skew: keep `next`, app-local `eslint-config-next`, and this
  package's `eslint-config-next` dependency on the same version so shared lint
  feedback matches app framework behavior.
- Type-aware parser errors or slow lint runs: use `type-checked` only in
  workspaces with a local `tsconfig.json`, and keep fast CI paths on `base` or
  `next-js` when type-aware feedback is not needed.
