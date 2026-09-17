# Wheel — Life Operating System

Keep track of everything you’re becoming. Wheel is a personal workspace for organizing goals, experiences, and reflections into chronicles, chapters, and quests.

## Features

- **Chronicles:** Define seasons of life with date ranges and descriptions, and connect them with chapters.
- **Chapters:** Plan a focused period, choose quests, set an intention, and review progress.
- **Quests and Canon:** Create and browse quests with tags, status, dates, and optional chapter assignments. Add side quests, lore, notes, pros and cons, moral values, and lessons learned.
- **Due Dates Radar:** See upcoming and overdue work, with completed items separated from active deadlines. Radar is the default workspace screen.
- **Hall of Emblems:** Browse collectibles and achievement progress.
- **Accounts and appearance:** Use email/password, Google, or guest access, switch accounts, and choose a light or dark theme.

Registered accounts use Firebase Authentication and Cloud Firestore through the app’s API routes. Guest quest and chapter edits are session-only; the app prompts guests to sign in or continue for the session before making changes.

## Tech stack

Next.js 16.3.4 (App Router), React 19, TypeScript, Tailwind CSS 4, and Firebase.

## Local setup

Use Node.js 20.9 or later and npm.

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create `.env.local` in the project root with your Firebase web app configuration:

   ```dotenv
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

   The app also reads `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` if provided. Use web app configuration values, never service-account private keys. Environment files are ignored by Git.

3. Configure the Firebase project:

   - Create the default Cloud Firestore database.
   - Enable Email/Password, Google, and Anonymous authentication for the sign-in options you want to use.
   - Add `localhost` and your deployed domain to Authentication’s authorized domains.
   - Publish [firestore.rules](firestore.rules) using the Firebase Console or Firebase CLI. The app does not deploy rules automatically.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open [localhost:3000](http://localhost:3000) and sign in. Restart the server after changing environment variables. Firebase configuration is required to open the workspace.

See [FIREBASE.md](FIREBASE.md) for additional Firebase setup and account guidance. It also documents the permissions missing from the checked-in Firestore rules that must be addressed for persistence to work.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Check TypeScript types |

For a production deployment, configure the Firebase environment variables before building, authorize the deployment domain in Firebase, and deploy the Firestore rules. Use a host that supports Next.js server routes.

## Project structure

```text
app/                    App entry point, layout, global styles, and API routes
components/wheel/       Workspace state, shared UI, and screens
components/helpers/     API client, shared utilities, constants, and data types
lib/firebase.ts         Firebase client initialization
lib/firebase/           Server-side Firestore REST helpers
firestore.rules         Firestore access rules
firebase.json           Firebase CLI configuration
```

The main page mounts `WheelApp`; screen selection is managed inside `components/wheel/`, with navigation definitions in `components/helpers/navigation.ts`. API routes handle user profiles, chronicles, chapters, quests and their components, emblems, and feedback.
