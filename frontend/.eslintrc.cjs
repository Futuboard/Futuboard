module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs", "jest.config.js", "__tests__", "vite-env.d.ts"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh", "unicorn", "import", "react"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "quotes": ["error", "double"], // Enforce double quotes
    "jsx-quotes": ["error", "prefer-double"], // Enforce double quotes in JSX
    "react/jsx-props-no-spreading": "off", // Allow props spreading in JSX
    "react/jsx-curly-spacing": ["error", "never"],
    "react/jsx-equals-spacing": ["error", "never"], // Disallow spaces around equal signs in JSX attributes
    "semi": ["error", "always"], // Enforce semicolons
    "no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 1, "maxBOF": 0 }], // Enforce max 1 empty line
    "no-trailing-spaces": "error", // Disallow trailing spaces
    // File Naming and Folder Structure
    "unicorn/filename-case": [
      "error",
      {
        cases: {
          camelCase: true,
          pascalCase: true,
        },
      },
    ],
    // General
    "no-console": ["error", { allow: ["warn", "error"] }],
    "no-unused-vars": "off",
    "comma-spacing": ["error", { before: false, after: true }], // Ensure spacing after commas
    "object-curly-spacing": ["error", "always"], // Enforce spacing inside object literals
    "@typescript-eslint/no-unused-vars": ["error"],
    "import/order": [
      "error",
      {
        "groups": [
          "builtin", // Node.js built-in modules
          "external", // External modules
          "internal", // Internal/project modules
          "parent", // Parent directories
          "sibling", // Sibling files
          "index", // Index file
          "object", // Object members
        ],
        "pathGroups": [
          // Customize the order as needed
          {
            "pattern": "@/**", // Styles or other custom paths
            "group": "internal",
            "position": "after",
          },
        ],
        "pathGroupsExcludedImportTypes": ["builtin"], // Exclude built-in modules from path groups
        "newlines-between": "always", // Ensure newlines between different import groups
        "alphabetize": { order: "asc", caseInsensitive: true }, // Alphabetical order within groups
      },
    ],
  },
};
