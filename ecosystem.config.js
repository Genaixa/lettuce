module.exports = {
  apps: [
    {
      name: "danskys",
      script: "node_modules/.bin/next",
      args: "start --port 3003",
      cwd: "/root/lettuce",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
