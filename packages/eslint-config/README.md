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
import { config } from "@repo/eslint-config/react-internal";

export default config;
```

The React library preset composes the base preset with React, React Hooks, and
browser globals for shared UI packages.

## Consumer Dependencies

Consumers should depend on this package with `workspace:*`.

Next.js consumers should also keep `eslint-config-next` aligned with their
installed `next` version. CI lint commands should run ESLint with
`--max-warnings=0` when warning-level framework rules must block merges.
