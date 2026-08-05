# OptiShare Mobile — Agent Rules

## CI Quality Gate Order

Always run the quality gate in this exact order before every commit:

1. `npm run format` — Prettier rewrites code first
2. `npm run typecheck` — TypeScript check AFTER Prettier (not before)
3. `npm run lint` — ESLint check
4. `npm run format:check` — Confirm Prettier is satisfied
5. `npm run test:coverage` — All tests must pass

Never run `typecheck` alone before `format`. Prettier can silently introduce TypeScript errors after the fact.

---

## Prettier ↔ TypeScript Index Signature Conflict

This project has `noPropertyAccessFromIndexSignature: true` in `tsconfig.json`.
Prettier automatically rewrites bracket notation `obj['KEY']` → dot notation `obj.KEY`.
This breaks TypeScript on CI with **TS4111** even if local typecheck passed.

**Always** use an `any` cast for dynamic or optional native module property access:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SAFE = sourceObj as any;
const value = SAFE.DYNAMIC_KEY as string | undefined;
```

---

## Test File Extensions

Any test file that contains JSX syntax (e.g., `ReactTestRenderer.create(<Component />)`)
must use the `.tsx` extension, **not** `.ts`. Using `.ts` causes a parse error on CI.

---

## Jest Native Module Mocks

When installing any `react-native-*` package, immediately add a **complete** mock to
`jest.setup.js` covering **all** exported methods and properties the codebase will call.
Incomplete mocks cause `TypeError: X is not a function` on CI.

Also update `transformIgnorePatterns` in `jest.config.js` to include every new native package.

---

## Never Commit Markdown Files

Never stage or commit `.md` files from:
- `.claude/`
- `.prompts/`
- `docs/`
- `implementation_plan.md`
- `walkthrough.md`
