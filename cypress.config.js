module.exports = {
  devDependencies: {
    "@types/jest": "^29.5.12",
    cypress: "^10.0.0",
  },

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  retries: 2,
};
