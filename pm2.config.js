module.exports = {
  apps: [
    {
      name: "passwordManager",
      script: "./dist/index.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      watch: false,
    },
  ],
};
