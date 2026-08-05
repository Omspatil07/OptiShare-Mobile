/**
 * ESLint configuration for OptiShare.
 *
 * Extends the React Native community config with additional rules
 * for import ordering, cycle detection, and strict TypeScript checks.
 *
 * @see docs/07-tech-stack.md
 * @see docs/09-coding-guidelines.md
 */
module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // Import ordering per docs/09-coding-guidelines.md
    'import/order': [
      'error',
      {
        groups: [
          ['builtin', 'external'],
          'internal',
          ['parent', 'sibling', 'index'],
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'react-native',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@app/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@core/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@features/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@shared/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['react', 'react-native'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    // Prevent circular dependencies
    'import/no-cycle': 'error',

    // No default exports per docs/09-coding-guidelines.md
    'import/no-default-export': 'warn',

    // Prevent console.log in production code
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // TypeScript strict rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],

    // React Native specific
    'react/react-in-jsx-scope': 'off',
    'react-native/no-inline-styles': 'warn',
  },
  overrides: [
    {
      // Allow default exports in entry files and screen files (React Navigation requirement)
      files: ['index.js', 'App.tsx', 'src/index.ts', 'metro.config.js'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
    {
      // Relax rules for test files
      files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
};
