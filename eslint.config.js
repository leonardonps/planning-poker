// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = tseslint.config(
	// Global ignores
	{
		ignores: ['dist/**', 'node_modules/**', '.angular/**', '**/*.spec.ts'],
	},

	// Base ESLint recommended config
	eslint.configs.recommended,

	// TypeScript and Angular rules
	{
		files: ['**/*.ts'],
		extends: [
			...tseslint.configs.recommended,
			...tseslint.configs.stylistic,
			...angular.configs.tsRecommended,
		],
		processor: angular.processInlineTemplates,
		rules: {
			// Angular-specific rules
			'@angular-eslint/directive-selector': [
				'error',
				{
					type: 'attribute',
					prefix: 'app',
					style: 'camelCase',
				},
			],
			'@angular-eslint/component-selector': [
				'error',
				{
					type: 'element',
					prefix: 'app',
					style: 'kebab-case',
				},
			],
		},
	},

	// Angular template rules
	{
		files: ['**/*.html'],
		extends: [
			...angular.configs.templateRecommended,
			...angular.configs.templateAccessibility,
		],
		rules: {
			// Customize template rules here
		},
	},

	// Prettier integration - MUST be last to override other formatting rules
	eslintConfigPrettier,
);
