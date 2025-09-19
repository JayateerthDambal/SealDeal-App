import tseslint from "typescript-eslint";

/**
 * This is the modern, flat ESLint configuration file.
 * It replaces the need for older formats like .eslintrc.js.
 */
export default [
  {
    // Ignore the compiled output and node_modules directories.
    ignores: ["lib/", "node_modules/"],
  },
  
  // Apply TypeScript-ESLint's recommended settings.
  ...tseslint.configs.recommended,
  
  {
    // Further customize rules here.
    rules: {
      // It's good practice to turn off the base 'no-unused-vars'
      // and use the more powerful TypeScript-aware version.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      
      // Add other custom rules as needed.
      "@typescript-eslint/no-explicit-any": "warn",
      "quotes": ["error", "double"],
    },
  },
];
