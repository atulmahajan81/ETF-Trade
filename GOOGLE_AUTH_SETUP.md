# Google OAuth Setup Guide for ETF Trading App

## 🔐 Setting Up Google OAuth Authentication

### Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Name it: `ETF Trading App`
   - Click "Create"

### Step 2: Enable Google+ API

1. **Navigate to APIs & Services**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click on "Google Identity" or "Google+ API"
   - Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type
   - Click "Create"

2. **Fill in App Information**
   ```
   App name: ETF Trading App
   User support email: your-email@gmail.com
   Developer contact information: your-email@gmail.com
   ```

3. **Add Scopes**
   - Click "Add or Remove Scopes"
   - Select these scopes:
     - `email`
     - `profile`
     - `openid`
   - Click "Update"

4. **Add Test Users** (Optional)
   - Add your email address as a test user
   - This allows you to test the app before publishing

### Step 4: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"

2. **Configure OAuth Client**
   - Application type: "Web application"
   - Name: "ETF Trading App Web Client"
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     http://localhost:3001
     https://your-domain.com (when deployed)
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000
     http://localhost:3000/
     https://your-domain.com (when deployed)
     ```

3. **Get Your Client ID**
   - Click "Create"
   - Copy the generated Client ID

### Step 5: Update Your App

1. **Replace the Client ID**
   - Open `src/App.js`
   - Replace the placeholder Client ID:
   ```javascript
   const GOOGLE_CLIENT_ID = "YOUR_ACTUAL_CLIENT_ID_HERE";
   ```

2. **Test the Integration**
   - Start your app: `npm start`
   - Try signing in with Google
   - Check the browser console for any errors

## 🚀 Features Implemented

### ✅ Google OAuth Integration
- **One-Click Sign In**: Users can sign in with their Google account
- **Automatic Account Creation**: New Google users get accounts automatically
- **Profile Pictures**: Google profile pictures are displayed in the navbar
- **Seamless Experience**: Existing Google users are logged in automatically

### ✅ User Management
- **Hybrid Authentication**: Supports both Google OAuth and traditional username/password
- **Data Isolation**: Each user has their own holdings and sold items
- **Session Persistence**: Login state is maintained across browser sessions
- **Profile Information**: Displays user's name and profile picture

### ✅ Security Features
- **JWT Token Validation**: Google tokens are properly decoded and validated
- **User Data Protection**: Each user's data is completely isolated
- **Secure Storage**: User data is stored locally with proper structure

## 🔧 Configuration Options

### Google Login Button Customization

You can customize the Google login button in `src/components/UserAuth.js`:

```javascript
<GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  disabled={isLoading}
  useOneTap={true}           // Shows one-tap sign-in
  theme="outline"            // Button theme
  size="large"              // Button size
  text="signin_with"        // Button text
  shape="rectangular"       // Button shape
  width="100%"              // Button width
/>
```

### Available Themes
- `outline` - Outlined button
- `filled_blue` - Blue filled button
- `filled_black` - Black filled button

### Available Sizes
- `large` - Large button
- `medium` - Medium button
- `small` - Small button

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid Client ID" Error**
   - Make sure you've replaced the placeholder Client ID
   - Verify the Client ID is correct
   - Check that the domain is authorized

2. **"Unauthorized Domain" Error**
   - Add your domain to authorized origins in Google Cloud Console
   - For development, make sure `http://localhost:3000` is added

3. **"OAuth Consent Screen" Error**
   - Make sure you've configured the OAuth consent screen
   - Add your email as a test user if in testing mode

4. **"API Not Enabled" Error**
   - Enable the Google Identity API in Google Cloud Console
   - Make sure the API is enabled for your project

### Debug Mode

To enable debug logging, check the browser console for:
- Google Auth success/error messages
- User data processing logs
- Authentication flow logs

## 📱 Production Deployment

### Before Going Live

1. **Update OAuth Consent Screen**
   - Change from "Testing" to "In production"
   - Add your production domain to authorized origins
   - Update privacy policy and terms of service URLs

2. **Security Considerations**
   - Use environment variables for Client ID
   - Implement proper error handling
   - Add rate limiting if needed
   - Consider implementing server-side token validation

3. **Environment Variables**
   ```javascript
   // Create .env file
   REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
   
   // Update App.js
   const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
   ```

## 🎉 Success!

Once configured, users can:
- Sign in with one click using their Google account
- Have their data automatically saved and isolated
- See their profile picture and name in the app
- Seamlessly switch between devices

The Google OAuth integration provides a modern, secure, and user-friendly authentication experience for your ETF Trading App! 