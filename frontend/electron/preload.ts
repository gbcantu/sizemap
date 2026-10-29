import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi } from "./contracts";

const api: DesktopApi = {
  // Operações de análise
  listServerShares: (host: string) => ipcRenderer.invoke("list-server-shares", host),
  analyzeDirectory: (options) => ipcRenderer.invoke("analyze-directory", options),
  expandNode: (nodeId: string, depth?: number) => ipcRenderer.invoke("expand-node", nodeId, depth),
  cancelOperation: () => ipcRenderer.invoke("cancel-operation"),
  
  // Controle e status
  getStatus: () => ipcRenderer.invoke("get-status"),
  chooseDirectory: () => ipcRenderer.invoke("choose-directory"),
  openDirectory: (path: string) => ipcRenderer.invoke("open-directory", path),
  
  // Eventos
  onProgress: (callback) => {
    const listener = (_: any, progress: any) => callback(progress);
    ipcRenderer.on("analysis:progress", listener);
    return () => ipcRenderer.removeListener("analysis:progress", listener);
  },
  getBackendStatus: () => ipcRenderer.invoke("get-backend-status"),
  onBackendStatus: (callback) => {
    const listener = (_: any, status: any) => callback(status);
    ipcRenderer.on("backend:status", listener);
    return () => ipcRenderer.removeListener("backend:status", listener);
  },
};

contextBridge.exposeInMainWorld("directoryAnalyzer", api);