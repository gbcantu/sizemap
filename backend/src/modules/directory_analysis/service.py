import os
import re
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Callable
from threading import Event

from .dto import DirectoryNodeDto, DirectoryAnalysisRequestDto, ServerAnalysisRequestDto
from .dto import DirectoryAnalysisResultDto, ServerSharesResultDto, ExpandNodeRequestDto, ExpandNodeResultDto


def formatar_tamanho(tamanho_bytes: int) -> str:
    """Converte bytes para formato legível em MB.
    
    Usa o mesmo cálculo do Windows: bytes -> KB (÷1024) -> MB (÷1024).
    Exibe o valor em KB dividido por 1000 para manter consistência visual
    com o valor mostrado nas propriedades do Windows.
    """
    if tamanho_bytes < 1024:
        return f"{tamanho_bytes} B"
    elif tamanho_bytes < 1024 * 1000:
        kb = tamanho_bytes / 1024
        return f"{kb:,.0f} KB".replace(",", ".")
    else:
        # KB dividido por 1000 (como o Windows apresenta visualmente)
        kb = tamanho_bytes / 1024
        mb = kb / 1000
        return f"{mb:,.0f} MB".replace(",", ".")


class DirectoryAnalysisService:
    """Serviço para análise de tamanho de diretórios."""
    
    def __init__(self):
        self._results_cache: Dict[str, Dict[str, Dict[str, int | bool]]] = {}
        self._node_index: Dict[str, Tuple[str, str]] = {}
        self._path_ids: Dict[Tuple[str, str], str] = {}
        self._node_counter = 0
        
    def _gerar_id(self) -> str:
        """Gera um ID único para um nó."""
        self._node_counter += 1
        return f"node-{self._node_counter}"
    
    def list_server_shares(self, request: ServerAnalysisRequestDto, 
                          stop_event: Optional[Event] = None,
                          progress_callback: Optional[Callable] = None) -> ServerSharesResultDto:
        """Lista shares disponíveis em um host via 'net view'."""
        host = request.host
        
        if progress_callback:
            progress_callback(stage="list_shares", completed=0, total=1, 
                            message=f"Listando shares em {host}...")
        
        try:
            resultado = subprocess.run(
                ["net", "view", host],
                capture_output=True,
                text=True,
                timeout=15,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
            shares = []
            for linha in resultado.stdout.splitlines():
                # Linhas de share começam com o nome e têm "Disco" ou "Disk" na descrição
                match = re.match(r"^(\S+)\s+Dis[ck]", linha, re.IGNORECASE)
                if match:
                    shares.append(match.group(1))
            
            if progress_callback:
                progress_callback(stage="list_shares", completed=1, total=1,
                                message=f"Encontrados {len(shares)} shares")
            
            return ServerSharesResultDto(
                host=host,
                shares=[{"name": share, "accessible": True} for share in shares]
            )
            
        except (subprocess.TimeoutExpired, OSError) as e:
            if progress_callback:
                progress_callback(stage="list_shares", completed=1, total=1,
                                message=f"Erro ao listar shares: {e}")
            return ServerSharesResultDto(host=host, shares=[])
    
    def analyze_directory(self, request: DirectoryAnalysisRequestDto,
                         stop_event: Optional[Event] = None,
                         progress_callback: Optional[Callable] = None) -> DirectoryAnalysisResultDto:
        """Calcula os resumos e prepara o primeiro nível da árvore."""
        caminho_raiz = os.path.abspath(request.path)
        if not os.path.isdir(caminho_raiz):
            raise ValueError(f"Caminho não existe ou não é um diretório: {caminho_raiz}")

        self._node_index.clear()
        self._path_ids.clear()
        self._results_cache.clear()
        resultados: Dict[str, Dict[str, int | bool]] = {}
        total_size, total_files = self._calcular_resumos(
            caminho_raiz, resultados, stop_event, progress_callback
        )
        self._results_cache[caminho_raiz] = resultados

        root_id = self._get_node_id(caminho_raiz, caminho_raiz)
        child_nodes = self._list_child_nodes(caminho_raiz, caminho_raiz, root_id)
        root_node = DirectoryNodeDto(
            id=root_id,
            path=caminho_raiz,
            name=Path(caminho_raiz).name or caminho_raiz,
            is_directory=True,
            size_bytes=total_size,
            file_count=total_files,
            has_children=bool(child_nodes),
            parent_id=None,
            children=[node.id for node in child_nodes],
        )

        return DirectoryAnalysisResultDto(
            root_node=root_node,
            child_nodes=child_nodes,
            total_size_bytes=total_size,
            total_file_count=total_files,
            analyzed_paths=list(resultados.keys()),
        )

    def expand_node(self, request: ExpandNodeRequestDto) -> ExpandNodeResultDto:
        """Retorna os filhos diretos de um diretório já analisado."""
        indexed_node = self._node_index.get(request.node_id)
        if indexed_node is None:
            raise ValueError("Diretório não encontrado; analise a pasta novamente.")
        root_path, node_path = indexed_node
        if not os.path.isdir(node_path):
            raise ValueError("O caminho não existe mais ou não é um diretório.")

        return ExpandNodeResultDto(
            node_id=request.node_id,
            children=self._list_child_nodes(node_path, root_path, request.node_id),
        )

    def _calcular_resumos(self, caminho: str, resultados: Dict[str, Dict[str, int | bool]],
                         stop_event: Optional[Event],
                         progress_callback: Optional[Callable]) -> Tuple[int, int]:
        """Percorre a árvore uma vez e guarda o resumo de cada diretório."""
        tamanho_total = 0
        total_arquivos = 0
        if stop_event and stop_event.is_set():
            return 0, 0

        try:
            with os.scandir(caminho) as entradas:
                entradas_list = list(entradas)
                has_children = False
                for i, entrada in enumerate(entradas_list):
                    if stop_event and stop_event.is_set():
                        break
                    try:
                        if entrada.is_file(follow_symlinks=False):
                            has_children = True
                            tamanho = entrada.stat(follow_symlinks=False).st_size
                            tamanho_total += tamanho
                            total_arquivos += 1
                        elif entrada.is_dir(follow_symlinks=False):
                            has_children = True
                            child_size, child_files = self._calcular_resumos(
                                entrada.path, resultados, stop_event, progress_callback
                            )
                            tamanho_total += child_size
                            total_arquivos += child_files
                    except (PermissionError, OSError):
                        continue
                    if progress_callback and i % 100 == 0:
                        progress_callback(
                            stage="analyze_directory",
                            completed=i,
                            total=len(entradas_list),
                            message=f"Analisando: {Path(caminho).name}"
                        )
        except (PermissionError, OSError):
            has_children = False

        resultados[caminho] = {
            "tamanho": tamanho_total,
            "arquivos": total_arquivos,
            "has_children": has_children,
        }
        if progress_callback:
            progress_callback(
                stage="analyze_directory",
                completed=1,
                total=1,
                message=f"Concluído: {Path(caminho).name}"
            )
        return tamanho_total, total_arquivos

    def _get_node_id(self, root_path: str, node_path: str) -> str:
        key = (root_path, node_path)
        node_id = self._path_ids.get(key)
        if node_id is None:
            node_id = self._gerar_id()
            self._path_ids[key] = node_id
            self._node_index[node_id] = key
        return node_id

    def _list_child_nodes(self, parent_path: str, root_path: str,
                          parent_id: str) -> List[DirectoryNodeDto]:
        children = []
        try:
            with os.scandir(parent_path) as entries:
                for entry in entries:
                    try:
                        if entry.is_file(follow_symlinks=False):
                            is_directory = False
                            size = entry.stat(follow_symlinks=False).st_size
                            file_count = 1
                            has_children = False
                        elif entry.is_dir(follow_symlinks=False):
                            is_directory = True
                            summary = self._results_cache[root_path].get(entry.path, {})
                            size = int(summary.get("tamanho", 0))
                            file_count = int(summary.get("arquivos", 0))
                            has_children = bool(summary.get("has_children", False))
                        else:
                            continue
                    except (PermissionError, OSError):
                        continue

                    node_id = self._get_node_id(root_path, entry.path)
                    children.append(DirectoryNodeDto(
                        id=node_id,
                        path=entry.path,
                        name=entry.name,
                        is_directory=is_directory,
                        size_bytes=size,
                        file_count=file_count,
                        has_children=has_children,
                        parent_id=parent_id,
                        children=[],
                    ))
        except (PermissionError, OSError):
            return children
        return children
