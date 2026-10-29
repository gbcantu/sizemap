import type {
  DirectoryNode,
  DirectoryAnalysisResult,
  ServerAnalysisResult,
  ProgressInfo,
  AnalysisOptions,
  BackendRuntimeStatus,
} from "../src/types/directory";

export interface DesktopApi {
  // Operações de análise
  listServerShares(host: string): Promise<ServerAnalysisResult>;
  analyzeDirectory(options: AnalysisOptions): Promise<DirectoryAnalysisResult>;
  expandNode(nodeId: string, depth?: number): Promise<{ nodeId: string; children: DirectoryNode[] }>;
  cancelOperation(): Promise<{ cancelled: boolean; message: string }>;
  
  // Controle e status
  getStatus(): Promise<{ status: string; currentOperation?: string; service: string }>;
  chooseDirectory(): Promise<string | null>;
  openDirectory(path: string): Promise<void>;
  
  // Eventos
  onProgress(callback: (progress: ProgressInfo) => void): () => void;
  getBackendStatus(): Promise<BackendRuntimeStatus>;
  onBackendStatus(callback: (status: BackendRuntimeStatus) => void): () => void;
}

declare global {
  interface Window {
    directoryAnalyzer: DesktopApi;
  }
}