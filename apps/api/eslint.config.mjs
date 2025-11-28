import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import unusedImports from 'eslint-plugin-unused-imports'
import prettier from 'eslint-config-prettier'

export default [
    {
        files: ['**/*.ts'],
        ignores: ['dist/**', 'node_modules/**', 'prisma/migrations/**'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'unused-imports': unusedImports,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-imports': 'warn',

            'unused-imports/no-unused-imports': 'warn',
            'no-console': 'off',
        },
    },
    prettier, // disable formatting-related lint rules
]
