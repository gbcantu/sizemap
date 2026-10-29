import type {
  DirectoryAnalysisApi,
  DirectoryAnalysisResult,
  ServerAnalysisResult,
  AnalysisOptions,
  ProgressInfo,
  BackendRuntimeStatus,
} from "../types/directory";

function getApi(): DirectoryAnalysisApi {
  if (!window.directoryAnalyzer) {
    throw new Error("Electron bridge unavailable. Open this interface through the desktop application.");
  }
  return window.directoryAnalyzer;
}

export const directoryService: DirectoryAnalysisApi = {
  // Operações principais
  listServerShares: (host: string): Promise<ServerAnalysisResult> => getApi().listServerShares(host),
  analyzeDirectory: (options: AnalysisOptions): Promise<DirectoryAnalysisResult> => getApi().analyzeDirectory(options),
  expandNode: (nodeId: string, depth?: number) => getApi().expandNode(nodeId, depth),
  cancelOperation: () => getApi().cancelOperation(),
  
  // Controle
  getStatus: () => getApi().getStatus(),
  onProgress: (callback) => getApi().onProgress(callback),
  getBackendStatus: () => getApi().getBackendStatus(),
  onBackendStatus: (callback) => getApi().onBackendStatus(callback),
};