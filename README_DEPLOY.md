Testing and Deployment

Local test (static server):

```bash
# from workspace root (/workspaces/Att)
python3 -m http.server 8000 --directory .
# then open http://localhost:8000
```

Firebase Hosting deploy:

1. Install Firebase CLI:

```bash
curl -sL https://firebase.tools | bash
# or: npm install -g firebase-tools
```

2. Login & init:

```bash
firebase login
firebase use --add
# replace project id in .firebaserc or run `firebase init hosting` to reconfigure
```

3. Deploy:

```bash
firebase deploy --only hosting
```

GitHub Pages (simple):

1. Ensure repo is on GitHub and push branch `gh-pages` with compiled static files (root allowed).
2. In repository settings enable GitHub Pages to serve from `gh-pages` branch or `main`/`docs` folder.

Notes:
- Fill `js/firebase-config.js` with your Firebase project's config before testing Firestore features.
- Service worker requires serving over HTTP(S); local `http.server` works for testing.

GitHub Actions (Automated Firebase Hosting deploy)

This repository includes a GitHub Actions workflow at `.github/workflows/firebase-hosting-deploy.yml` that will deploy on pushes to `main`.

Required secrets (set in GitHub repo Settings → Secrets → Actions):
- `FIREBASE_SERVICE_ACCOUNT`: The JSON contents of a Firebase service account (choose a service account with `Firebase Hosting Admin` or appropriate privileges). Store the raw JSON value.
- `FIREBASE_PROJECT_ID`: Your Firebase project id (string).

How to create the service account JSON:
1. Open Google Cloud Console → IAM & Admin → Service Accounts.
2. Create a service account (e.g., `github-actions-deployer`).
3. Grant the role: `Firebase Hosting Admin` (and `Cloud Build Editor` if needed).
4. Create a JSON key for the service account and download it.
5. Copy the full JSON and add it as the `FIREBASE_SERVICE_ACCOUNT` secret in GitHub (do NOT commit the JSON to the repo).

When the secrets are configured, every push to `main` will trigger the workflow and deploy the site to Firebase Hosting.

Sample data
-----------

To quickly populate sample students into your Firestore `students` collection, use the Node script in `scripts/populate_sample_students.js`.

Steps:

```bash
# install dependency
npm install firebase-admin

# set service account path (or pass it as first arg)
export SERVICE_ACCOUNT_FILE="/path/to/serviceAccount.json"

# run the script
node scripts/populate_sample_students.js
```

The script will skip students with existing `rollNo` values and will add the rest.
