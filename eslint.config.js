const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*', 'coverage/*'],
  },
  {
    rules: {
      // The design system depends on these: raw RN Text bypasses typography
      // variants, StyleSheet bypasses the token system.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'StyleSheet'],
              message:
                'Use the <Text> primitive from src/components/ui (typography variants) and NativeWind classes instead of StyleSheet.',
            },
          ],
        },
      ],
    },
  },
  {
    // The design system itself is the one place allowed to touch RN Text.
    files: ['src/components/ui/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]);
