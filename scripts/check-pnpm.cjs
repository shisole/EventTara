const agent = process.env.npm_config_user_agent || "";
if (!/pnpm/.test(agent)) {
  const cmd = process.env.npm_lifecycle_event || "install";
  console.error("\x1b[33m⚠  This project uses pnpm. Please use:\x1b[0m\n" + `   pnpm ${cmd}\n`);
  process.exit(1);
}
