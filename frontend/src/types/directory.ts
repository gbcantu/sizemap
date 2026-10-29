export interface DirectoryNode {
  id: string;
  path: string;
  name: string;
  isDirectory: boolean;
  sizeBytes: number;
  fileCount: number;
  hasChildren: boolean;
  parentId?: string | null;
  children: string[];
}

export interface DirectoryAnalysisResult {
  rootNode: DirectoryNode;
  childNodes: DirectoryNode[];   // filhos diretos do root, já resolvidos
  totalSizeBytes: number;
  totalFileCount: number;
  analyzedPaths: string[];
}

export interface ServerShare {
  name: string;
  accessible: boolean;
  path?: string;
}

export interface ServerAnalysisResult {
  host: string;
  shares: ServerShare[];
}

export interface ProgressInfo {
  stage: string;
  completed: number;
  total: number;
  message: string;
}

export interface AnalysisOptions {
  path: string;
  throttleMs?: number;
  maxDepth?: number;
}

export interface BackendRuntimeStatus {
  state: "starting" | "ready" | "error";
  message: string;
}

export interface DirectoryAnalysisApi {
  // Operações principais
  listServerShares(host: string): Promise<ServerAnalysisResult>;
  analyzeDirectory(options: AnalysisOptions): Promise<DirectoryAnalysisResult>;
  expandNode(nodeId: string, depth?: number): Promise<{ nodeId: string; children: DirectoryNode[] }>;
  cancelOperation(): Promise<{ cancelled: boolean; message: string }>;
  
  // Controle
  getStatus(): Promise<{ status: string; currentOperation?: string; service: string }>;
  onProgress(callback: (progress: ProgressInfo) => void): () => void;
  getBackendStatus(): Promise<BackendRuntimeStatus>;
  onBackendStatus(callback: (status: BackendRuntimeStatus) => void): () => void;
}