module.exports = {
  devDependencies: {
    "@types/jest": "^29.5.12",
    cypress: "^13.0.0",
  },

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  retries: process.env.RETRY_COUNT ? Number(process.env.RETRY_COUNT) : 0,
};
