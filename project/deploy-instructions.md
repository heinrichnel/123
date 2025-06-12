# Deployment Instructions for Matanuska Transport Application

This document provides step-by-step instructions for deploying the Matanuska Transport application to Firebase Hosting with Firestore real-time database.

## Prerequisites

1. Node.js and npm installed
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. A Firebase project created at [https://console.firebase.google.com/](https://console.firebase.google.com/)

## Step 1: Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Firestore Database:
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Start in production mode or test mode (you can change this later)
   - Choose a location close to your users

## Step 2: Update Firebase Configuration

1. In the Firebase console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click the web app icon (</>) to register a web app if you haven't already
4. Copy the Firebase configuration object
5. Update the `firebaseConfig` object in `src/firebase.ts` with your configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 3: Set Up Firestore Security Rules

1. In the Firebase console, go to "Firestore Database" in the left sidebar
2. Click on the "Rules" tab
3. Update the rules to match the ones in your `firestore.rules` file
4. Click "Publish" to apply the rules

## Step 4: Set Up Firestore Indexes

1. In the Firebase console, go to "Firestore Database" in the left sidebar
2. Click on the "Indexes" tab
3. Add the indexes defined in your `firestore.indexes.json` file
4. Wait for the indexes to be created (this may take a few minutes)

## Step 5: Build the Application

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

## Step 6: Deploy to Firebase

```bash
# Login to Firebase (if not already logged in)
npm run firebase:login

# Initialize Firebase in your project (if not already initialized)
firebase init

# Select Hosting and Firestore
# Select your Firebase project
# Use "dist" as your public directory
# Configure as a single-page app: Yes
# Set up automatic builds and deploys with GitHub: No (unless you want to)

# Deploy to Firebase
npm run deploy
```

## Step 7: Access Your Deployed Application

After successful deployment, you'll see a URL where your application is hosted, typically in the format:

```
https://your-project-id.web.app
```

Visit this URL to access your deployed application.

## Updating the Application

When you make changes to the application:

1. Build the application again: `npm run build`
2. Deploy the updated build: `npm run deploy`

## Setting Up Continuous Deployment (Optional)

For automatic deployment when you push to GitHub:

1. Connect your GitHub repository to Firebase in the Firebase console
2. Set up GitHub Actions for continuous deployment
3. Use the provided GitHub workflow files in `.github/workflows/`

## Firestore Security Rules

The current security rules allow read and write access to anyone. For production, you should update the rules in `firestore.rules` to restrict access based on authentication and authorization.

## Troubleshooting

- If you encounter deployment errors, check the Firebase CLI output for specific error messages
- Ensure your Firebase project has the necessary services enabled (Hosting, Firestore)
- Verify that your Firebase configuration in `src/firebase.ts` is correct
- Check that your build process completed successfully before deploying
- If Firestore indexes are missing, Firebase will provide a link to create them automatically

## Offline Support

The application includes offline support through Firestore's persistence capabilities:

- Users can continue working when offline
- Changes made offline will automatically sync when the connection is restored
- A connection status indicator will show when the app is working offline