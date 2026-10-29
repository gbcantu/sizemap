from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class DirectoryNodeDto:
    """Representa um nó na árvore de diretórios."""
    id: str
    path: str
    name: str
    is_directory: bool
    size_bytes: int
    file_count: int
    has_children: bool
    parent_id: Optional[str]
    children: List[str]  # IDs dos filhos

    def to_dict(self):
        # camelCase para o frontend TypeScript
        return {
            "id": self.id,
            "path": self.path,
            "name": self.name,
            "isDirectory": self.is_directory,
            "sizeBytes": self.size_bytes,
            "fileCount": self.file_count,
            "hasChildren": self.has_children,
            "parentId": self.parent_id,
            "children": self.children,
        }


@dataclass(frozen=True)
class DirectoryAnalysisRequestDto:
    """Request para análise de diretório."""
    path: str
    throttle_ms: int = 0  # Delay entre operações (para proteção de rede)
    max_depth: int = 1    # Profundidade inicial (lazy loading)
    
    @classmethod
    def from_payload(cls, payload: Dict[str, Any]):
        if not isinstance(payload.get("path"), str):
            raise ValueError("path must be a string")
        return cls(
            path=payload["path"],
            throttle_ms=payload.get("throttle_ms", 0),
            max_depth=payload.get("max_depth", 1),
        )


@dataclass(frozen=True)
class ServerAnalysisRequestDto:
    """Request para análise de servidor (listar shares)."""
    host: str
    
    @classmethod
    def from_payload(cls, payload: Dict[str, Any]):
        if not isinstance(payload.get("host"), str):
            raise ValueError("host must be a string")
        return cls(host=payload["host"])


@dataclass(frozen=True)
class DirectoryAnalysisResultDto:
    """Resultado da análise de diretório."""
    root_node: DirectoryNodeDto
    child_nodes: List[DirectoryNodeDto]  # filhos diretos do root, prontos para exibir
    total_size_bytes: int
    total_file_count: int
    analyzed_paths: List[str]

    def to_dict(self):
        # camelCase para o frontend TypeScript
        return {
            "rootNode": self.root_node.to_dict(),
            "childNodes": [n.to_dict() for n in self.child_nodes],
            "totalSizeBytes": self.total_size_bytes,
            "totalFileCount": self.total_file_count,
            "analyzedPaths": self.analyzed_paths,
        }


@dataclass(frozen=True)
class ServerSharesResultDto:
    """Resultado da listagem de shares de um servidor."""
    host: str
    shares: List[Dict[str, Any]]  # Lista de shares com nome e status
    
    def to_dict(self):
        return {
            "host": self.host,
            "shares": self.shares,
        }


@dataclass(frozen=True)
class ExpandNodeRequestDto:
    """Request para expandir um nó (lazy loading)."""
    node_id: str
    depth: int = 1
    
    @classmethod
    def from_payload(cls, payload: Dict[str, Any]):
        if not isinstance(payload.get("node_id"), str):
            raise ValueError("node_id must be a string")
        return cls(
            node_id=payload["node_id"],
            depth=payload.get("depth", 1),
        )


@dataclass(frozen=True)
class ExpandNodeResultDto:
    """Resultado da expansão de um nó."""
    node_id: str
    children: List[DirectoryNodeDto]

    def to_dict(self):
        # camelCase para o frontend TypeScript
        return {
            "nodeId": self.node_id,
            "children": [child.to_dict() for child in self.children],
        }