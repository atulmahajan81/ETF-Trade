# ETF Trading Mobile App

A React Native/Expo mobile application converted from the web-based ETF Trading platform. This mobile app maintains the same business logic, data flow, and API endpoints as the original web version while providing an optimized mobile user experience.

## 🚀 Features

- **Identical Business Logic**: All trading algorithms, profit calculations, and decision-making logic preserved from web version
- **Same API Endpoints**: Uses the exact same backend APIs and data fetching logic
- **Mobile-Optimized UI**: Responsive design with touch-friendly interfaces
- **Real-time Data**: Live price updates and market status
- **Portfolio Management**: View holdings, track profits, and manage positions
- **Trading Actions**: Place buy/sell orders with mobile-optimized workflows
- **Authentication**: Secure login/signup with persistent sessions
- **Data Persistence**: Local storage for offline functionality

## 📱 Mobile-Specific Features

- **Bottom Tab Navigation**: Quick access to main features
- **Drawer Navigation**: Additional screens and settings
- **Pull-to-Refresh**: Update data with intuitive gestures
- **Touch-Optimized**: Large touch targets and swipe gestures
- **Dark Theme**: Consistent with web version's dark theme
- **Responsive Design**: Adapts to different screen sizes

## 🛠️ Technology Stack

- **React Native**: 0.72.6
- **Expo**: 49.0.15
- **Navigation**: React Navigation v6
- **State Management**: React Context + useReducer
- **Storage**: AsyncStorage + Expo SecureStore
- **UI Components**: React Native Paper + Custom Components
- **Icons**: React Native Vector Icons (Feather)
- **Charts**: React Native Chart Kit
- **Styling**: StyleSheet (React Native)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Install Expo CLI (if not already installed)

```bash
npm install -g @expo/cli
```

### 3. Start the Development Server

```bash
npm start
```

### 4. Run on Device/Simulator

- **iOS**: Press `i` in the terminal or scan QR code with Expo Go app
- **Android**: Press `a` in the terminal or scan QR code with Expo Go app
- **Web**: Press `w` in the terminal

## 🔧 Configuration

### API Configuration

Update the API endpoints in `src/services/mstocksApi.js`:

```javascript
const API_BASE_URL = 'https://your-api-domain.com';
const PROXY_URL = 'http://localhost:3001';
```

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-api-domain.com
EXPO_PUBLIC_PROXY_URL=http://localhost:3001
```

## 📁 Project Structure

```
mobile-app/
├── App.js                          # Main app entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── CustomTabBar.js        # Bottom tab navigation
│   │   └── CustomDrawerContent.js # Side drawer navigation
│   ├── context/                   # State management
│   │   └── ETFTradingContext.js   # Main app context
│   ├── screens/                   # Screen components
│   │   ├── UserAuthScreen.js      # Login/Signup
│   │   ├── DashboardScreen.js     # Main dashboard
│   │   ├── HoldingsScreen.js      # Portfolio holdings
│   │   ├── SoldItemsScreen.js     # Sold items history
│   │   ├── ETFRankingScreen.js    # ETF rankings
│   │   ├── StrategyScreen.js      # Trading strategy
│   │   ├── MoneyManagementScreen.js # Capital management
│   │   ├── ProfileScreen.js       # User profile
│   │   ├── UserSetupScreen.js     # Initial setup
│   │   └── DataImportScreen.js    # Data import
│   └── services/                  # API services
│       └── mstocksApi.js          # Trading API integration
```

## 🔄 Migration from Web to Mobile

### Key Changes Made

1. **Navigation**: Replaced React Router with React Navigation
2. **Storage**: Replaced localStorage with AsyncStorage + SecureStore
3. **UI Components**: Converted HTML elements to React Native components
4. **Styling**: Converted CSS/Tailwind to StyleSheet
5. **Icons**: Replaced Lucide React with React Native Vector Icons
6. **Charts**: Replaced Chart.js with React Native Chart Kit

### Component Mapping

| Web Component | Mobile Component | Notes |
|---------------|------------------|-------|
| `<div>` | `<View>` | Container element |
| `<span>` | `<Text>` | Text element |
| `<button>` | `<TouchableOpacity>` | Interactive button |
| `<input>` | `<TextInput>` | Form input |
| `<img>` | `<Image>` | Image display |
| `<Link>` | `navigation.navigate()` | Navigation |

### Styling Conversion

```javascript
// Web (CSS/Tailwind)
<div className="bg-gray-800 rounded-lg p-4 flex items-center">

// Mobile (StyleSheet)
<View style={styles.container}>
```

```javascript
// StyleSheet definition
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
```

## 🔌 API Integration

The mobile app uses the same API endpoints as the web version:

- **Authentication**: `/auth/login`, `/auth/signup`
- **ETF Data**: `/etfs/list`, `/prices/live`
- **Holdings**: `/holdings/list`
- **Trading**: `/orders/place`, `/orders/status`
- **Market Data**: `/market/status`

## 📱 Mobile-Specific Considerations

### Performance
- Implemented virtual scrolling for large lists
- Optimized image loading and caching
- Efficient state management with useReducer

### User Experience
- Touch-friendly button sizes (minimum 44px)
- Proper keyboard handling
- Pull-to-refresh functionality
- Loading states and error handling

### Security
- Secure storage for sensitive data
- Token-based authentication
- Input validation and sanitization

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual Testing Checklist
- [ ] Authentication flow (login/signup)
- [ ] Navigation between screens
- [ ] Data refresh and updates
- [ ] Trading actions
- [ ] Offline functionality
- [ ] Different screen sizes

## 📦 Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### Web Build
```bash
expo build:web
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo start -c`
2. **Dependencies conflicts**: Delete node_modules and reinstall
3. **iOS build issues**: Ensure Xcode is properly configured
4. **Android build issues**: Check Android Studio setup

### Debug Mode
```bash
expo start --dev-client
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

---

**Note**: This mobile app maintains 100% compatibility with the web version's business logic and API endpoints while providing an optimized mobile experience.

