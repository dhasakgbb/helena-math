# Astrid's Number Garden

A small math practice app — part of the **Astrid** learning platform.

**Live:** https://helena-math.vercel.app

## What it does

Three modes, all 10 questions each:

| Mode | What it is | VARK affinity |
| --- | --- | --- |
| **Times Tables** | Multiplication facts, type the answer | read / write |
| **Speed Add** | Web Speech reads the problem; type the sum | auditory |
| **Number Sort** | Drag tiles into Even / Odd / Prime bins | visual + kinesthetic |

## Profile awareness

If the user arrives via the platform hub (`helena-learner-profile.vercel.app/hub`), the URL `#profile=…` fragment is decoded, validated, persisted to `localStorage`, and the matching mode gets a **RECOMMENDED** pip. Every 4th session the pip rotates to the secondary preference (comfort + stretch cadence). Telemetry is written back to `module_overrides.math.*` inside the profile JSON. Profile can be re-exported with the play data baked in.

The platform's portability claim is proven by the **pure vanilla `states/` app** (no build, no framework, no dependencies). Math was originally also a vanilla consumer; it has since been ported to Svelte 5 while still using the exact same `ExportedProfile` contract from `profile-schema`.

## Stack

- Svelte 5 + Vite (modern implementation)
- The original vanilla JS version has been archived to `archive/math-legacy-vanilla/`
- Platform integration lives in `src/lib/profile.svelte.ts` + `src/lib/recommender.ts`
- The **portability proof** for the profile contract is now carried by the pure-vanilla `states/` app (no build, no framework, works from `python -m http.server`).

## Develop (pnpm monorepo)

```bash
# from repo root
pnpm install
pnpm --filter math dev
pnpm --filter math check
pnpm --filter math test:run
# Root: pnpm lint / pnpm test / pnpm build
```

## Architecture references (current reality)

- Canonical contract + helpers (`readTelemetry`, `recordModuleLaunch`, `recommendedMathMode`, fragment codec) live in `profile-schema/` (one source of truth for all consumers).
- `math/src/lib/profile.svelte.ts` owns only the Svelte store + localStorage + launch recording for this app (delegates to package).
- Same `module_overrides.math.*` telemetry shape as spelling + states.
- Same `#profile=` URL-fragment handoff from the hub (`learner-profile`).
- The **portability proof** remains the zero-dep `states/` vanilla app (and its `profile.js` mirror of the contract for browser-only use).
- See root README + `learner-profile/docs/PLATFORM.md` for full cross-module hub view and design direction.

## Design Tokens Adoption (DR-05 starter)
`astrid-tokens` is now imported in `src/styles/app.css` (additive, non-breaking). This enables `--astrid-*` CSS vars (spacing scale, radii, cyan/glow accents, motion, reduced-motion) for future unifying elements (e.g. focus states, any profile-related UI, "Astrid rooms" cards) **while 100% preserving** the twilight garden aesthetic and local `--color-*` / glow variables.

See `astrid-tokens/README.md` "Per-Room Theming Rules" for guidance. Math should map or use selectively for platform-coherent cross-room patterns only. Further adoption (mode tiles, etc.) encouraged in follow-up work.
