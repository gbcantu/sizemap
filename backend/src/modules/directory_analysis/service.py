import os
import re
import time
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
        self._results_cache: Dict[str, Dict] = {}  # cache de resultados
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
        """Analisa um diretório recursivamente."""
        caminho_raiz = request.path
        throttle_ms = request.throttle_ms
        max_depth = request.max_depth

        if not os.path.isdir(caminho_raiz):
            raise ValueError(f"Caminho não existe ou não é um diretório: {caminho_raiz}")

        resultados: Dict = {}

        # Calcular tamanho recursivo
        total_size, total_files = self._calcular_tamanho_recursivo(
            caminho_raiz, resultados, throttle_ms, stop_event, progress_callback, 0, max_depth
        )

        # Armazenar no cache
        self._results_cache[caminho_raiz] = resultados

        # Gerar todos os nós e mapear id por caminho
        id_map: Dict[str, str] = {}  # caminho -> id
        for caminho in resultados:
            node_id = self._gerar_id()
            id_map[caminho] = node_id

        # Construir rootNode com filhos populados
        root_node = self._criar_no_com_filhos(caminho_raiz, resultados, id_map, caminho_raiz)

        # Construir todos os nós filhos diretos e populá-los no cache
        # para que o frontend possa resolver os IDs
        child_nodes = []
        for caminho_filho in resultados.get(caminho_raiz, {}).get("filhos", []):
            if caminho_filho in resultados and caminho_filho in id_map:
                child_nodes.append(
                    self._criar_no_com_filhos(caminho_filho, resultados, id_map, caminho_raiz)
                )

        return DirectoryAnalysisResultDto(
            root_node=root_node,
            child_nodes=child_nodes,
            total_size_bytes=total_size,
            total_file_count=total_files,
            analyzed_paths=list(resultados.keys()),
        )
    
    def expand_node(self, request: ExpandNodeRequestDto) -> ExpandNodeResultDto:
        """Expande um nó (carrega subdiretórios)."""
        # TODO: Implementar lazy loading baseado no cache
        # Por enquanto retorna lista vazia
        return ExpandNodeResultDto(
            node_id=request.node_id,
            children=[]
        )
    
    def _calcular_tamanho_recursivo(self, caminho: str, resultados: Dict, throttle_ms: int,
                                   stop_event: Optional[Event], progress_callback: Optional[Callable],
                                   nivel: int, max_depth: int) -> Tuple[int, int]:
        """Calcula tamanho total de um diretório."""
        tamanho_total = 0
        total_arquivos = 0
        filhos = []
        
        if stop_event and stop_event.is_set():
            return 0, 0
        
        try:
            with os.scandir(caminho) as entradas:
                entradas_list = list(entradas)
                total_entradas = len(entradas_list)
                
                for i, entrada in enumerate(entradas_list):
                    if stop_event and stop_event.is_set():
                        return tamanho_total, total_arquivos
                    
                    # Throttling: pausa entre operações
                    if throttle_ms > 0:
                        time.sleep(throttle_ms / 1000.0)
                    
                    try:
                        if entrada.is_file(follow_symlinks=False):
                            tamanho = entrada.stat(follow_symlinks=False).st_size
                            tamanho_total += tamanho
                            total_arquivos += 1
                            
                            if nivel == 0:  # Primeiro nível
                                resultados[entrada.path] = {
                                    "tamanho": tamanho,
                                    "arquivos": 1,
                                    "filhos": [],
                                    "is_file": True,
                                }
                                filhos.append(entrada.path)
                                
                        elif entrada.is_dir(follow_symlinks=False):
                            if nivel < max_depth:
                                # Calcular recursivamente até a profundidade máxima
                                tam_filho, arquivos_filho = self._calcular_tamanho_recursivo(
                                    entrada.path, resultados, throttle_ms, stop_event,
                                    progress_callback, nivel + 1, max_depth
                                )
                                tamanho_total += tam_filho
                                total_arquivos += arquivos_filho
                                
                                if nivel == 0:  # Primeiro nível
                                    resultados[entrada.path] = {
                                        "tamanho": tam_filho,
                                        "arquivos": arquivos_filho,
                                        "filhos": [],
                                        "is_file": False,
                                    }
                                    filhos.append(entrada.path)
                            else:
                                # Apenas soma tamanho sem detalhar
                                tam_filho = self._tamanho_raso(entrada.path)
                                tamanho_total += tam_filho
                                resultados[entrada.path] = {
                                    "tamanho": tam_filho,
                                    "arquivos": 0,
                                    "filhos": [],
                                    "is_file": False,
                                }
                                filhos.append(entrada.path)
                                
                    except (PermissionError, OSError):
                        # Ignorar arquivos/pastas sem permissão
                        continue
                    
                    # Reportar progresso a cada 100 entradas
                    if progress_callback and i % 100 == 0:
                        progress_callback(
                            stage="analyze_directory",
                            completed=i,
                            total=total_entradas,
                            message=f"Analisando: {Path(caminho).name}"
                        )
                        
        except (PermissionError, OSError):
            pass
        
        resultados[caminho] = {
            "tamanho": tamanho_total,
            "arquivos": total_arquivos,
            "filhos": filhos,
            "is_file": False,
        }
        
        if progress_callback:
            progress_callback(
                stage="analyze_directory",
                completed=1,
                total=1,
                message=f"Concluído: {Path(caminho).name}"
            )
        
        return tamanho_total, total_arquivos
    
    def _tamanho_raso(self, caminho: str) -> int:
        """Soma tamanho de todos os arquivos recursivamente sem guardar estrutura."""
        tamanho = 0
        try:
            with os.scandir(caminho) as entradas:
                for entrada in entradas:
                    try:
                        if entrada.is_file(follow_symlinks=False):
                            tamanho += entrada.stat(follow_symlinks=False).st_size
                        elif entrada.is_dir(follow_symlinks=False):
                            tamanho += self._tamanho_raso(entrada.path)
                    except (PermissionError, OSError):
                        continue
        except (PermissionError, OSError):
            pass
        return tamanho
    
    def _criar_no_com_filhos(self, caminho: str, resultados: Dict,
                             id_map: Dict[str, str], caminho_raiz: str) -> DirectoryNodeDto:
        """Cria um nó DTO com children populados a partir dos resultados já calculados."""
        info = resultados.get(caminho, {"tamanho": 0, "arquivos": 0, "filhos": [], "is_file": False})
        nome = Path(caminho).name or caminho
        node_id = id_map[caminho]

        parent_id = None
        if caminho != caminho_raiz:
            parent_path = str(Path(caminho).parent)
            parent_id = id_map.get(parent_path)

        # IDs dos filhos diretos
        children_ids = [id_map[f] for f in info.get("filhos", []) if f in id_map]

        return DirectoryNodeDto(
            id=node_id,
            path=caminho,
            name=nome,
            is_directory=not info.get("is_file", False),
            size_bytes=info["tamanho"],
            file_count=info["arquivos"],
            has_children=bool(info.get("filhos")),
            parent_id=parent_id,
            children=children_ids,
        )

