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

## Deploy to Vercel from GitHub

### 1. Push the project to GitHub

Create an empty GitHub repository. If this folder is not already a Git repository, run these commands from the project root, replacing the URL with your repository URL:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/wheel.git
git push -u origin main
```

If Git is already configured, commit and push to your existing repository instead. Keep `.env` and `.env.local` out of Git; the project's `.gitignore` excludes them, along with `node_modules` and `.next`.

### 2. Import the repository into Vercel

In Vercel, choose **Add New → Project**, connect your GitHub account, and import the repository. Use the **Next.js** framework preset, root directory `./`, and the default build settings (`npm run build`). Confirm that `main` is the production branch. See [Vercel's GitHub integration guide](https://vercel.com/docs/git/vercel-for-github).

### 3. Configure environment variables

Before deploying, add the following variables in the import form's **Environment Variables** section, using the values from your local Firebase configuration:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Include the optional Firebase variables listed under Local setup if used. Enable the values for **Production** and **Preview**, or configure separate Firebase projects for each environment. Preview deployments using the production Firebase project access the same database.

After import, manage these values under **Settings → Environment Variables**. Redeploy after changing them: `NEXT_PUBLIC_` values are included in the browser bundle at build time. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

### 4. Deploy and configure Firebase

Click **Deploy**. Once the build succeeds, update Firebase Authentication's authorized domains so login works on the deployed site:

1. Open **Firebase Console → Authentication → Settings → Authorized domains**.
2. Click **Add domain** and enter your Vercel production hostname, such as `wheel.vercel.app`, without `https://` or a path.
3. Add any custom domain or preview hostname where you intend to test login as well. Repeat this step whenever your login domain changes.
4. Open the deployed app and verify sign-in, including Google login if enabled. A missing authorized domain can cause an `auth/unauthorized-domain` error.

Resolve the checked-in Firestore rules limitations described in [FIREBASE.md](FIREBASE.md), then publish the corrected rules separately. Vercel deploys the Next.js app and API routes; it does not deploy Firebase rules. Verify sign-in, creating a quest, and persistence after reloading on the deployed site.

### 5. Publish updates

Run the local checks before pushing:

```bash
npm run lint
npm run build
git add .
git commit -m "Describe your changes"
git push
```

Pushes or merges to the configured production branch trigger production deployments. Other branches and pull requests normally receive preview deployments. Check the Vercel deployment logs if a build fails. See [Vercel deployment environments](https://vercel.com/docs/deployments/environments).

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
