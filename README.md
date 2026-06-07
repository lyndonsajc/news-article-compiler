# News Article Compiler - Firebase + Passcode Version

Changes:
- Passcode lock: 7728
- Saves full article to Firestore
- Save/display date uses article publication date, not today's date
- Firestore save has timeout/error messages instead of hanging silently
- Download Database JSON button remains

Important:
Replace the Firebase config in `index.html` with your own Firebase config.

Firestore rules for testing:

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

Later, secure this properly with Firebase Authentication.
