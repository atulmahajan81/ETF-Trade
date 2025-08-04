# Firebase Setup Guide for ETF Trading App

## 🔥 Setting Up Firebase Authentication

### Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Create a project"
   - Name it: `ETF Trading App`
   - Enable Google Analytics (optional)
   - Click "Create project"

### Step 2: Add Your App

1. **Add Web App**
   - Click the web icon (</>) to add a web app
   - Register app with nickname: `ETF Trading Web App`
   - Click "Register app"

2. **Get Configuration**
   - Copy the Firebase config object
   - It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

### Step 3: Enable Authentication

1. **Go to Authentication**
   - In Firebase Console, click "Authentication" in the left sidebar
   - Click "Get started"

2. **Enable Sign-in Methods**
   - Click "Sign-in method" tab
   - Enable "Email/Password"
   - Enable "Google"
   - For Google, add your authorized domain (localhost for development)

### Step 4: Update Your App

1. **Replace Firebase Config**
   - Open `src/firebase/config.js`
   - Replace the placeholder values with your actual Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

2. **Test the Integration**
   - Start your app: `npm start`
   - Try signing up with email/password
   - Try signing in with Google
   - Check the browser console for any errors

## 🚀 Features Implemented

### ✅ Firebase Authentication
- **Email/Password**: Traditional signup and login
- **Google Sign-In**: One-click Google authentication
- **Secure**: Firebase handles all security
- **Real-time**: Instant authentication state updates

### ✅ User Management
- **Firebase UID**: Unique user identification
- **Data Isolation**: Each user has their own data
- **Session Persistence**: Login state maintained
- **Profile Information**: Display name and photo

### ✅ Security Features
- **Firebase Security**: Enterprise-grade security
- **Password Hashing**: Automatic password security
- **Token Management**: Secure session tokens
- **Data Protection**: User data isolation

## 🔧 Configuration Options

### Authentication Methods

You can enable additional sign-in methods in Firebase Console:

1. **Email/Password** ✅ (Enabled)
2. **Google** ✅ (Enabled)
3. **Facebook** (Optional)
4. **Twitter** (Optional)
5. **GitHub** (Optional)
6. **Phone** (Optional)

### Security Rules

For production, consider setting up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"Firebase App not initialized" Error**
   - Make sure you've replaced the Firebase config
   - Check that all config values are correct
   - Verify the Firebase project is active

2. **"Permission denied" Error**
   - Check that Authentication is enabled in Firebase Console
   - Verify the sign-in methods are enabled
   - Check browser console for detailed error messages

3. **"Popup blocked" Error**
   - Allow popups for your domain
   - Try using redirect instead of popup
   - Check browser settings

4. **"Invalid API key" Error**
   - Verify your API key is correct
   - Check that your domain is authorized
   - Ensure the Firebase project is active

### Debug Mode

To enable debug logging, check the browser console for:
- Firebase initialization logs
- Authentication success/error messages
- User data processing logs

## 📱 Production Deployment

### Before Going Live

1. **Update Authorized Domains**
   - Add your production domain to Firebase Console
   - Remove localhost if not needed for production

2. **Security Considerations**
   - Set up proper Firestore security rules
   - Configure authentication providers properly
   - Set up proper error handling

3. **Environment Variables**
   ```javascript
   // Create .env file
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   
   // Update config.js
   const firebaseConfig = {
     apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
     authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
     storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.REACT_APP_FIREBASE_APP_ID
   };
   ```

## 🎉 Success!

Once configured, users can:
- Sign up with email/password
- Sign in with Google (one-click)
- Have their data automatically saved and isolated
- See their profile information in the app
- Seamlessly switch between devices

Firebase Authentication provides a modern, secure, and scalable authentication experience for your ETF Trading App! 