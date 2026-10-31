import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from "electron";
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { randomUUID } from "node:crypto";

if (process.platform === "linux") {
  app.commandLine.appendSwitch("no-sandbox");
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

class PythonBackend {
  private child!: ChildProcessWithoutNullStreams;
  private pending = new Map<string, PendingRequest>();
  private projectRoot: string;
  private pythonScript: string;
  private backendArguments: string[];
  private executable: string;
  private operationQueue: Promise<void> = Promise.resolve();
  private status: { state: "starting" | "ready" | "error"; message: string } = {
    state: "starting", message: "Starting the Python analysis service",
  };
  private stopping = false;

  constructor() {
    this.projectRoot = app.isPackaged
      ? process.resourcesPath
      : path.resolve(__dirname, "../..");
    this.pythonScript = path.join(this.projectRoot, "backend", "src", "backend_orchestrator.py");
    this.backendArguments = app.isPackaged ? [] : [this.pythonScript];
    const configuredPython = process.env.DIRECTORY_ANALYZER_PYTHON
      || process.argv.find((argument) => argument.startsWith("--directory-analyzer-python="))?.split("=").slice(1).join("=");
    const venvPython = process.platform === "win32"
      ? path.join(this.projectRoot, "backend", "venv", "Scripts", "python.exe")
      : path.join(this.projectRoot, "backend", "venv", "bin", "python");
    const packagedBackendName = process.platform === "win32"
      ? "backend_orchestrator.exe"
      : "backend_orchestrator";
    this.executable = app.isPackaged
      ? path.join(process.resourcesPath, "backend", packagedBackendName)
      : configuredPython || (existsSync(venvPython)
        ? venvPython
        : process.platform === "win32" ? "python" : "python3");
    
    this.stopping = false;
    this.start(this.executable, this.backendArguments);
  }

  private start(command: string, args: string[]) {
    this.updateStatus("starting", "Starting the Python analysis service");
    const child = spawn(command, args, {
      cwd: this.projectRoot,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    this.child = child;
    const lines = readline.createInterface({ input: child.stdout });
    lines.on("line", (line) => this.handleLine(line, child));
    child.stderr.on("data", (data: Buffer) => console.error(`[python] ${data.toString().trimEnd()}`));
    child.on("error", (error) => {
      if (this.child !== child) return;
      this.rejectAll(error);
      this.updateStatus("error", error.message);
    });
    child.on("exit", (code, signal) => {
      if (this.child !== child) return;
      const message = `Python backend stopped (${signal || code})`;
      this.rejectAll(new Error(message));
      if (!this.stopping) this.updateStatus("error", message);
    });
  }

  getStatus() {
    return this.status;
  }

  request<T>(operation: string, payload: unknown): Promise<T> {
    const execute = () => {
      const id = randomUUID();
      return new Promise<T>((resolve, reject) => {
        this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
        this.child.stdin.write(`${JSON.stringify({ id, operation, payload })}\n`, (error) => {
          if (error) {
            this.pending.delete(id);
            reject(error);
          }
        });
      });
    };
    const result = this.operationQueue.then(execute, execute);
    this.operationQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  stop() {
    this.stopping = true;
    this.child.kill();
  }

  private handleLine(line: string, source: ChildProcessWithoutNullStreams) {
    if (this.child !== source) return;
    let message: { id?: string; type?: string; payload?: unknown; error?: string };
    try {
      message = JSON.parse(line);
    } catch {
      console.error(`Invalid backend message: ${line}`);
      return;
    }
    if (message.type === "progress") {
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send("analysis:progress", message.payload);
      }
      return;
    }
    if (message.type === "ready") {
      this.updateStatus("ready", "Python analysis service is ready");
      return;
    }
    if (!message.id) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.type === "error") pending.reject(new Error(message.error || "Backend operation failed"));
    else pending.resolve(message.payload);
  }

  private rejectAll(error: Error) {
    for (const request of this.pending.values()) request.reject(error);
    this.pending.clear();
  }

  private updateStatus(state: "starting" | "ready" | "error", message: string) {
    this.status = { state, message };
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send("backend:status", this.status);
    }
  }
}

let mainWindow: BrowserWindow | null = null;
let backend: PythonBackend;

function getAppIconPath() {
  return process.platform === "win32"
    ? path.join(app.isPackaged ? process.resourcesPath : app.getAppPath(), "icon.ico")
    : path.join(app.getAppPath(), "assets", "icon.png");
}

function createWindow() {
  const iconPath = getAppIconPath();
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 850,
    minHeight: 620,
    icon: existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Setup IPC handlers
function setupIpcHandlers() {
  const backend = new PythonBackend();

  // Operações de análise
  ipcMain.handle("list-server-shares", async (_, host: string) => {
    return backend.request("list_server_shares", { host });
  });

  ipcMain.handle("analyze-directory", async (_, options) => {
    return backend.request("analyze_directory", options);
  });

  ipcMain.handle("expand-node", async (_, nodeId: string, depth?: number) => {
    return backend.request("expand_node", { node_id: nodeId, depth });
  });

  ipcMain.handle("cancel-operation", async () => {
    return backend.request("cancel_operation", {});
  });

  ipcMain.handle("get-status", async () => {
    return backend.request("get_status", {});
  });

  ipcMain.handle("get-backend-status", async () => {
    return backend.getStatus();
  });

  ipcMain.handle("choose-directory", async () => {
    const window = mainWindow;
    if (!window || window.isDestroyed()) {
      throw new Error("A janela principal não está disponível para selecionar uma pasta.");
    }

    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();

    const result = await dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
    });

    if (!window.isDestroyed()) {
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    }

    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("open-directory", async (_, path: string) => {
    shell.openPath(path);
  });
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  // Clean up Python backend
  if (backend) {
    backend.stop();
  }
});