import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Per-app identity lives here. When starting a new app from this template,
 * change: name, slug, scheme, android.package — nothing else should need
 * to move.
 */
const APP_NAME = 'Expo Android Template';
const APP_SLUG = 'expo-android-template';
const APP_SCHEME = 'expoandroidtemplate';
const ANDROID_PACKAGE = 'com.example.expoandroidtemplate';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: APP_SLUG,
  version: '1.0.0',
  scheme: APP_SCHEME,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: ANDROID_PACKAGE,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  // `fingerprint` derives the runtime version from the native dependency tree,
  // so an OTA update can never land on a build with incompatible native code.
  // `eas init` fills in updates.url + extra.eas.projectId on first link.
  runtimeVersion: { policy: 'fingerprint' },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    'expo-updates',
    // Pins every native module to one NDK — see the file for why.
    './plugins/with-android-native-build',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    // Sentry sourcemap upload only activates on builds where SENTRY_ORG /
    // SENTRY_PROJECT / SENTRY_AUTH_TOKEN are present (EAS Secrets).
    ...(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
      ? [
          [
            '@sentry/react-native/expo',
            {
              organization: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
            },
          ] as [string, object],
        ]
      : []),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
