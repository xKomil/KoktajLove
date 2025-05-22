import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.es2020 } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  { 
    ...pluginReactConfig, 
    settings: { react: { version: "detect" } } 
  },
  { 
    plugins: {
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
      'jsx-a11y': eslintPluginJsxA11y,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
      "react/prop-types": "off", // Using TypeScript for prop types
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      // Example: Add specific jsx-a11y rules if needed
      // "jsx-a11y/anchor-is-valid": "warn", 
    }
  },
  {
    // Ignores for config files
    ignores: ["dist/", "node_modules/", "vite.config.ts", "eslint.config.js", ".prettierrc.json"],
  }
];