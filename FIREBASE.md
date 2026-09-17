# Firebase integration

## Configuration

Wheel requires these Firebase web app settings in `.env.local` or `.env`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Optional settings are `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`. Configuration is read in [constants.ts](components/helpers/constants.ts) and used by [lib/firebase.ts](lib/firebase.ts). Restart the development server after changing it. Use web app configuration values, never service-account private keys.

## Project setup

1. Create the default Cloud Firestore database in Firebase Console.
2. Enable Email/Password, Google, and Anonymous under Authentication → Sign-in method for the login options you intend to offer.
3. Add `localhost` and the deployed domain under Authentication → Settings → Authorized domains.
4. Review the rules limitations below and publish the required rules through Firebase Console or the Firebase CLI:

   ```bash
   firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
   ```

5. Start Wheel and register or sign in. The API resolves the Wheel profile by its `authUid`; registration creates a profile through `/api/user`. The current API does not seed a sample workspace on first login.

## API and stored data

The browser API client is [endpoints.ts](components/helpers/endpoints.ts). It sends the signed-in user's Firebase ID token as a bearer token to same-origin Next.js API routes. [server-rest.ts](lib/firebase/server-rest.ts) forwards that authorization to Firestore REST requests, which are subject to the deployed security rules.

| Data | Firestore path |
| --- | --- |
| Profile | `users/{wheelUserDocumentId}`; matched by `authUid` |
| Quests | `users/{wheelUserDocumentId}/quests/{questId}` |
| Quest components | Subcollections `subquests`, `images`, `artifacts`, and `keepsakes` beneath a quest |
| Chapters, chronicles, emblems, lore | Corresponding subcollections beneath the user document |
| Feedback | Root `feedback` collection |

`/api/user` handles profile reads, creation, and updates. Collection and item routes handle workspace records. Quest reads also load their component subcollections. Feedback submissions store the profile name and email, message, and creation timestamp. Emblem mutations have an additional editor restriction in the server helper.

Saves use individual POST and PATCH requests. Related quest components and chapter assignments can require multiple requests, so a failure can leave a partial save. The current API does not implement the earlier single-document workspace, debounced revision writes, or cross-device conflict detection. Workspace fixtures remain in [workspace-data.ts](components/helpers/workspace-data.ts), but do not describe the current persistence schema.

## Guest access and accounts

The welcome screen supports email sign-in, registration, password reset, Google, and anonymous access. Anonymous mutations through the shared API client prompt the user to sign in or continue for the session. Continuing returns session records without writing them to Firestore; those edits are not durable.

The authentication form includes linking an unused email or Google credential to a guest identity. Linking does not itself persist session edits or merge workspaces. Credentials already belonging to another account require switching accounts. The header offers **Logout / Switch Account**.

## Checked-in rules limitations

[firestore.rules](firestore.rules) currently allows owner profile reads and updates, profile creation tied to the authenticated UID, owner reads of direct user subcollections and quest subquests, and authenticated feedback creation. It also retains rules for the legacy versioned workspace document.

The rules do **not** currently grant the create/update permissions used by the quest, chapter, chronicle, lore, and emblem APIs. They also do not grant reads of nested quest images, artifacts, or keepsakes. Deploying these rules unchanged can therefore cause workspace reads and saves to fail. Align the rules with the current collection paths and ownership requirements before relying on persistence.

Rules are not deployed automatically by the app. The actual project's enabled providers and deployed rules must be checked separately.

## Verification

Run `npm run lint` and `npx tsc --noEmit` for local source checks. Once Firebase permissions are configured, register or sign in, create a quest with a side quest and chapter assignment, wait for the save operation to finish, and reload to confirm persistence. Verify that a second account cannot read the first account's records. Check guest session behavior separately.
