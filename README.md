# News Article Compiler - Firebase Firestore Version

This version saves articles permanently in Firebase Firestore.

## Features

- Paste article URL
- Upload PDF
- Generate readable full article text
- AI fills title, source, publication date, summary and keywords
- Saves full article to Firebase Firestore
- Display page with quick search by publication date and keyword
- Download full database as JSON
- Import JSON backup into Firestore

## Files

- index.html
- api/summarize.js
- package.json

## Step 1: Firebase Setup

1. Go to Firebase Console.
2. Create a new project.
3. Add a Web App.
4. Copy your Firebase config.
5. In `index.html`, replace:

```js
const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_APP_ID"
};
```

with your real Firebase config.

## Step 2: Enable Firestore

1. Firebase Console > Build > Firestore Database
2. Create database
3. Start in test mode first
4. Choose region

For testing, rules can be:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /newsArticles/{document=**} {
      allow read, write: if true;
    }
  }
}
```

Later you should secure it with login.

## Step 3: Vercel Environment Variable

In Vercel, add:

```txt
OPENROUTER_API_KEY
```

Optional:

```txt
OPENROUTER_MODEL = openai/gpt-4o-mini
```

## Step 4: Redeploy

After changing Firebase config or Vercel environment variables, redeploy on Vercel.

## Database Backup

Click:

Download Database JSON

This downloads all articles currently in Firestore as a JSON backup.
