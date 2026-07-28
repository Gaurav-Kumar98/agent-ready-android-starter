/** @type {import('jest').Config} */
// Packages listed here ship untranspiled ESM and must go through Babel.
// gluestack v5 and its @react-aria / @react-stately / @internationalized
// dependencies are ESM-only; without them a test that imports any gluestack
// primitive fails with "SyntaxError: Unexpected token 'export'".
const esmPackages = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  'expo(nent)?',
  '@expo(nent)?/.*',
  '@expo-google-fonts/.*',
  'react-navigation',
  '@react-navigation/.*',
  '@sentry/react-native',
  'native-base',
  'nativewind',
  'react-native-css-interop',
  '@gluestack-ui/.*',
  '@react-aria/.*',
  '@react-stately/.*',
  '@internationalized/.*',
  '@swc/helpers',
];

module.exports = {
  preset: 'jest-expo',
  // Reanimated 4 reaches for react-native-worklets' native module at import
  // time, which does not exist under Jest ("Cannot read properties of
  // undefined (reading 'loadUnpackers')"). The resolver worklets ships drops
  // the `.native` extensions so Jest picks the JS implementation instead.
  resolver: 'react-native-worklets/jest/resolver.js',
  transformIgnorePatterns: [`node_modules/(?!(${esmPackages.join('|')}))`],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  // Jest's 5s default is not enough on a cold cache: the first suite to touch
  // gluestack pays for transforming the whole @react-aria / @react-stately
  // tree, and parallel workers starve each other. CI always runs cold.
  testTimeout: 15000,
};
