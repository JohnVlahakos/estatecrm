# TestFlight Setup Guide (Free - No Developer Account Required)

Your data will be preserved! All your CRM data is stored in AsyncStorage on your device and will remain intact.

## Prerequisites
- Apple ID (free)
- Expo account (free)
- Your Mac

## Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

## Step 2: Login to Expo
```bash
eas login
```
Enter your Expo credentials (create account at expo.dev if needed)

## Step 3: Configure Your Project

Create `eas.json` in your project root:
```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 4: Update app.json

Make sure your `app.json` has:
```json
{
  "expo": {
    "name": "Real Estate CRM",
    "slug": "real-estate-crm",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourname.realestatecrm",
      "buildNumber": "1"
    }
  }
}
```

## Step 5: Build for TestFlight
```bash
eas build --platform ios --profile production
```

This will:
- Ask you to create a bundle identifier (accept defaults)
- Set up your iOS credentials automatically
- Build your app in the cloud (takes 10-20 minutes)
- Provide you with a download link when complete

## Step 6: Submit to TestFlight
After build completes:
```bash
eas submit --platform ios --latest
```

Enter your Apple ID credentials when prompted.

## Step 7: Accept TestFlight Agreement
1. Go to App Store Connect (appstoreconnect.apple.com)
2. Sign in with your Apple ID
3. Accept any pending agreements
4. Your app will appear in TestFlight within 15-30 minutes

## Step 8: Install via TestFlight
1. Download "TestFlight" app from App Store on your iPhone
2. Sign in with the same Apple ID
3. Your app will appear in TestFlight
4. Tap "Install"

## Important Notes
- **Your data is safe**: AsyncStorage data persists between app updates
- **Free forever**: No Apple Developer Account ($99/year) needed for TestFlight
- **Easy updates**: Run `eas build` and `eas submit` again anytime to update
- **100 testers**: You can invite up to 100 beta testers
- **90-day builds**: Each TestFlight build expires after 90 days, but you can submit updates

## Troubleshooting

### If build fails:
1. Make sure bundle identifier is unique (use your name/company)
2. Check that all required fields in app.json are filled

### If submit fails:
1. Accept all agreements in App Store Connect
2. Make sure you're using the correct Apple ID
3. Enable 2-factor authentication on your Apple ID if needed

### If app doesn't appear in TestFlight:
1. Wait 30 minutes (Apple processing time)
2. Check email for any issues from Apple
3. Verify you accepted all agreements in App Store Connect

## Need Help?
Visit: https://docs.expo.dev/build/introduction/
