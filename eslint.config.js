import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import lit from 'eslint-plugin-lit';
import wc from 'eslint-plugin-wc';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-lib/**',
      'node_modules/**',
      'public/**',
      'docs/**',
      'testpages/**',
      // Agent worktrees: full checkouts of other branches, each with its own
      // tsconfig, which made typescript-eslint refuse every file in the repo.
      '.claude/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  lit.configs['flat/recommended'],
  wc.configs['flat/recommended'],
  {
    files: ['**/*.{ts,js,mjs}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      // Pinned, so a nested checkout with its own tsconfig cannot make the
      // root ambiguous again.
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Unused code: report, but allow the _-prefix escape hatch.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Engine APIs (maplibre/ol/leaflet/cesium) are loosely typed; `any` is
      // pervasive at those boundaries and flagging it is noise.
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
);
