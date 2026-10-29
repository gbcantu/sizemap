"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var import_node_child_process = require("node:child_process");
var import_node_fs = require("node:fs");
var import_node_path = __toESM(require("node:path"));
var import_node_readline = __toESM(require("node:readline"));
var import_node_crypto = require("node:crypto");
var PythonBackend = class {
  child;
  pending = /* @__PURE__ */ new Map();
  projectRoot;
  pythonScript;
  backendArguments;
  executable;
  operationQueue = Promise.resolve();
  status = {
    state: "starting",
    message: "Starting the Python analysis service"
  };
  stopping = false;
  constructor() {
    this.projectRoot = import_electron.app.isPackaged ? process.resourcesPath : import_node_path.default.resolve(__dirname, "../..");
    this.pythonScript = import_node_path.default.join(this.projectRoot, "backend", "src", "backend_orchestrator.py");
    this.backendArguments = import_electron.app.isPackaged ? [] : [this.pythonScript];
    const configuredPython = process.env.DIRECTORY_ANALYZER_PYTHON || process.argv.find((argument) => argument.startsWith("--directory-analyzer-python="))?.split("=").slice(1).join("=");
    const venvPython = process.platform === "win32" ? import_node_path.default.join(this.projectRoot, "backend", "venv", "Scripts", "python.exe") : import_node_path.default.join(this.projectRoot, "backend", "venv", "bin", "python");
    this.executable = import_electron.app.isPackaged ? import_node_path.default.join(process.resourcesPath, "backend", "backend_orchestrator.exe") : configuredPython || ((0, import_node_fs.existsSync)(venvPython) ? venvPython : process.platform === "win32" ? "python" : "python3");
    this.stopping = false;
    this.start(this.executable, this.backendArguments);
  }
  start(command, args) {
    this.updateStatus("starting", "Starting the Python analysis service");
    const child = (0, import_node_child_process.spawn)(command, args, {
      cwd: this.projectRoot,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });
    this.child = child;
    const lines = import_node_readline.default.createInterface({ input: child.stdout });
    lines.on("line", (line) => this.handleLine(line, child));
    child.stderr.on("data", (data) => console.error(`[python] ${data.toString().trimEnd()}`));
    child.on("error", (error) => {
      if (this.child !== child)
        return;
      this.rejectAll(error);
      this.updateStatus("error", error.message);
    });
    child.on("exit", (code, signal) => {
      if (this.child !== child)
        return;
      const message = `Python backend stopped (${signal || code})`;
      this.rejectAll(new Error(message));
      if (!this.stopping)
        this.updateStatus("error", message);
    });
  }
  getStatus() {
    return this.status;
  }
  request(operation, payload) {
    const execute = () => {
      const id = (0, import_node_crypto.randomUUID)();
      return new Promise((resolve, reject) => {
        this.pending.set(id, { resolve, reject });
        this.child.stdin.write(`${JSON.stringify({ id, operation, payload })}
`, (error) => {
          if (error) {
            this.pending.delete(id);
            reject(error);
          }
        });
      });
    };
    const result = this.operationQueue.then(execute, execute);
    this.operationQueue = result.then(() => void 0, () => void 0);
    return result;
  }
  stop() {
    this.stopping = true;
    this.child.kill();
  }
  handleLine(line, source) {
    if (this.child !== source)
      return;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      console.error(`Invalid backend message: ${line}`);
      return;
    }
    if (message.type === "progress") {
      for (const window of import_electron.BrowserWindow.getAllWindows()) {
        window.webContents.send("analysis:progress", message.payload);
      }
      return;
    }
    if (message.type === "ready") {
      this.updateStatus("ready", "Python analysis service is ready");
      return;
    }
    if (!message.id)
      return;
    const pending = this.pending.get(message.id);
    if (!pending)
      return;
    this.pending.delete(message.id);
    if (message.type === "error")
      pending.reject(new Error(message.error || "Backend operation failed"));
    else
      pending.resolve(message.payload);
  }
  rejectAll(error) {
    for (const request of this.pending.values())
      request.reject(error);
    this.pending.clear();
  }
  updateStatus(state, message) {
    this.status = { state, message };
    for (const window of import_electron.BrowserWindow.getAllWindows()) {
      window.webContents.send("backend:status", this.status);
    }
  }
};
var mainWindow = null;
var backend;
function getAppIconPath() {
  return process.platform === "win32" ? import_node_path.default.join(import_electron.app.isPackaged ? process.resourcesPath : import_electron.app.getAppPath(), "icon.ico") : import_node_path.default.join(import_electron.app.getAppPath(), "assets", "icon.png");
}
function createWindow() {
  const iconPath = getAppIconPath();
  mainWindow = new import_electron.BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 850,
    minHeight: 620,
    icon: (0, import_node_fs.existsSync)(iconPath) ? iconPath : void 0,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: import_node_path.default.join(__dirname, "preload.js")
    }
  });
  if (import_electron.app.isPackaged) {
    mainWindow.loadFile(import_node_path.default.join(import_electron.app.getAppPath(), "dist", "index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function setupIpcHandlers() {
  const backend2 = new PythonBackend();
  import_electron.ipcMain.handle("list-server-shares", async (_, host) => {
    return backend2.request("list_server_shares", { host });
  });
  import_electron.ipcMain.handle("analyze-directory", async (_, options) => {
    return backend2.request("analyze_directory", options);
  });
  import_electron.ipcMain.handle("expand-node", async (_, nodeId, depth) => {
    return backend2.request("expand_node", { node_id: nodeId, depth });
  });
  import_electron.ipcMain.handle("cancel-operation", async () => {
    return backend2.request("cancel_operation", {});
  });
  import_electron.ipcMain.handle("get-status", async () => {
    return backend2.request("get_status", {});
  });
  import_electron.ipcMain.handle("get-backend-status", async () => {
    return backend2.getStatus();
  });
  import_electron.ipcMain.handle("choose-directory", async () => {
    const result = await import_electron.dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"]
    });
    return result.canceled ? null : result.filePaths[0];
  });
  import_electron.ipcMain.handle("open-directory", async (_, path2) => {
    import_electron.shell.openPath(path2);
  });
}
import_electron.app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.app.on("before-quit", () => {
  if (backend) {
    backend.stop();
  }
});
//# sourceMappingURL=main.js.map
