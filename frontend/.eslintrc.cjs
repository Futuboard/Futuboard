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
    "react/jsx-props-no-spreading": "off", // Allow props spreading in JSX
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
