"use strict";

// electron/preload.ts
var import_electron = require("electron");
var api = {
  // Operações de análise
  listServerShares: (host) => import_electron.ipcRenderer.invoke("list-server-shares", host),
  analyzeDirectory: (options) => import_electron.ipcRenderer.invoke("analyze-directory", options),
  expandNode: (nodeId, depth) => import_electron.ipcRenderer.invoke("expand-node", nodeId, depth),
  cancelOperation: () => import_electron.ipcRenderer.invoke("cancel-operation"),
  // Controle e status
  getStatus: () => import_electron.ipcRenderer.invoke("get-status"),
  chooseDirectory: () => import_electron.ipcRenderer.invoke("choose-directory"),
  openDirectory: (path) => import_electron.ipcRenderer.invoke("open-directory", path),
  // Eventos
  onProgress: (callback) => {
    const listener = (_, progress) => callback(progress);
    import_electron.ipcRenderer.on("analysis:progress", listener);
    return () => import_electron.ipcRenderer.removeListener("analysis:progress", listener);
  },
  getBackendStatus: () => import_electron.ipcRenderer.invoke("get-backend-status"),
  onBackendStatus: (callback) => {
    const listener = (_, status) => callback(status);
    import_electron.ipcRenderer.on("backend:status", listener);
    return () => import_electron.ipcRenderer.removeListener("backend:status", listener);
  }
};
import_electron.contextBridge.exposeInMainWorld("directoryAnalyzer", api);
//# sourceMappingURL=preload.js.map
