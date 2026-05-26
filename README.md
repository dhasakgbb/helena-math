# Helena's Math Practice

A small math practice app — part of the Helena learning platform.

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

This is a **vanilla JS** consumer — no build step, no framework, no zod. The same JSON contract from `helena-learner-profile` is validated by a hand-rolled `validate()` in `profile.js`. The platform's portability claim is proven by this consumer existing.

## Stack

- Zero build tools — open `index.html` in a browser
- ~5 KB of `app.js` for gameplay
- ~6 KB of `profile.js` for platform integration
- 1 stylesheet, vanilla CSS

## Architecture references

- `profile.js` mirrors the schema from `helena-learner-profile/src/lib/profile/schema.ts`
- Same `module_overrides.<module>.*` namespace as `helena-spelling` and `helena-states`
- Same URL-fragment auto-import + scrub pattern
