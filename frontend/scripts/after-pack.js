const fs = require("node:fs");
const path = require("node:path");

const REAL_BINARY_SUFFIX = "-bin";

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== "linux") {
    return;
  }

  const executableName = context.packager.executableName;
  const executablePath = path.join(context.appOutDir, executableName);
  const realBinaryName = `${executableName}${REAL_BINARY_SUFFIX}`;
  const realBinaryPath = path.join(context.appOutDir, realBinaryName);

  if (!fs.existsSync(executablePath)) {
    throw new Error(`Linux executable not found: ${executablePath}`);
  }

  if (fs.existsSync(realBinaryPath)) {
    fs.rmSync(realBinaryPath, { force: true });
  }
  fs.renameSync(executablePath, realBinaryPath);

  const launcher = [
    "#!/bin/sh",
    "# Launcher wrapper: AppImages cannot keep the root-owned SUID sandbox helper,",
    "# so always start Chromium without the setuid sandbox.",
    "SELF=\"$(readlink -f \"$0\")\"",
    "DIR=\"$(dirname \"$SELF\")\"",
    `exec \"$DIR/${realBinaryName}\" --no-sandbox \"$@\"`,
    "",
  ].join("\n");

  fs.writeFileSync(executablePath, launcher, { mode: 0o755 });
  fs.chmodSync(executablePath, 0o755);

  console.log(`Wrapped ${executableName} to always launch with --no-sandbox`);
};
