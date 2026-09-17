# Wheel UI

Wheel is a React workspace mounted by [app/page.tsx](../../app/page.tsx). [wheel-app.tsx](wheel-app.tsx) composes the header, dock, active screen, shared dialogs, and [wheel-provider.tsx](wheel-provider.tsx), which manages authentication, API-loaded data, drafts, progress, and navigation state.

## Screens and navigation

The workspace opens on Due Dates Radar after authentication. [navigation.ts](../helpers/navigation.ts) defines eight workspace screens: Create Quest, Chapters, Chronicles, Canon, Hall of Emblems, Chapter Detail, Quest Detail, and Due Dates Radar. The dock uses five of these entries; the app also supports a side-by-side view. Chapter and chronicle creation forms open within their respective flows.

- **Quests and Canon:** Create, browse, and edit quests with tags, status, dates, chapter assignments, side quests, and optional reflection components.
- **Chapters and Chronicles:** Organize quests into focused chapters and broader date-based chronicles.
- **Due Dates Radar:** Group deadlines into urgent, next seven days, and later horizons, with filters and an option to show completed items.
- **Hall of Emblems:** Render API-loaded emblems and derive their status from workspace data.

## Component map

| File | Responsibility |
| --- | --- |
| `ui.tsx` | Shared buttons, badges, cards, progress bars, and screen frames |
| `header.tsx`, `dock.tsx` | Navigation and workspace actions |
| `auth-form.tsx` | Sign-in, registration, password reset, and account linking |
| `quest-controls.tsx`, `sub-quest-fields.tsx` | Quest editing, selection, and side-quest fields |
| `quest-summary.tsx` | Quest summaries |
| `rich-text-editor.tsx` | Rich-text editing |
| `modal.tsx` | Shared native dialog |
| `emblem-card.tsx`, `deadline-card.tsx` | Emblem and deadline cards |
| `chronicle-dossier.tsx`, `chapter-celebration.tsx` | Chronicle detail and chapter celebration views |
| `theme-toggle.tsx` | Theme selection |
| `screens/` | Workspace screens and creation forms |

Shared helpers live in [components/helpers](../helpers): API requests, configuration constants, interfaces, date conversion, deadline calculations, emblem state, navigation definitions, quest types, and workspace fixtures. Firebase initialization and server REST access remain in `lib/`. Global styles live in [app/globals.css](../../app/globals.css).

## Data and persistence

The provider loads profiles, quests, chapters, chronicles, emblems, and lore through the shared API client. Registered-account changes use Firestore-backed API routes; guest mutations through that client are session-only. The current app is not the earlier sample-only frontend, and emblems no longer come from a static `emblems.ts` file.

See [FIREBASE.md](../../FIREBASE.md) for the current schema, guest behavior, and checked-in rules limitations that affect reads and writes.

## Development

From the repository root, run `npm run dev` for a preview, `npm run lint` and `npx tsc --noEmit` for source checks, and `npm run build` for a production build. See the [root README](../../README.md) for environment setup.
