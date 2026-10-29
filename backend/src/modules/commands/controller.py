from modules.commands.dto import CommandRequestDto, CommandResultDto, CommandErrorDto, ProgressEventDto
from modules.directory_analysis.dto import (
    DirectoryAnalysisRequestDto,
    ServerAnalysisRequestDto,
    ExpandNodeRequestDto,
)
from modules.directory_analysis.service import DirectoryAnalysisService
from threading import Event


class DirectoryCommandHandler:
    """Validate commands, invoke directory analysis services and map stable response DTOs."""

    def __init__(self, directory_service: DirectoryAnalysisService = None):
        self.directory_service = directory_service if directory_service is not None else DirectoryAnalysisService()
        self._stop_event = Event()
        self._current_operation: str | None = None

    def handle(self, message, emit):
        request_id = message.get("id") if isinstance(message, dict) else None
        try:
            request = CommandRequestDto.from_message(message)
            payload = self.dispatch(request.operation, request.payload, emit)
            emit(CommandResultDto(request.request_id, payload).to_dict())
        except Exception as exc:
            emit(CommandErrorDto(request_id, str(exc), type(exc).__name__).to_dict())

    def dispatch(self, operation, payload, emit):
        def progress_callback(stage, completed, total, message):
            emit(ProgressEventDto(stage, completed, total, message).to_dict())

        if operation == "analyze_directory":
            # Resetar stop_event antes de cada nova análise
            self._stop_event.clear()
            self._current_operation = "analyze_directory"
            try:
                request = DirectoryAnalysisRequestDto.from_payload(payload)
                result = self.directory_service.analyze_directory(
                    request,
                    stop_event=self._stop_event,
                    progress_callback=progress_callback,
                )
                return result
            finally:
                self._current_operation = None

        elif operation == "list_server_shares":
            self._stop_event.clear()
            self._current_operation = "list_server_shares"
            try:
                request = ServerAnalysisRequestDto.from_payload(payload)
                result = self.directory_service.list_server_shares(
                    request,
                    stop_event=self._stop_event,
                    progress_callback=progress_callback,
                )
                return result
            finally:
                self._current_operation = None

        elif operation == "expand_node":
            request = ExpandNodeRequestDto.from_payload(payload)
            return self.directory_service.expand_node(request)

        elif operation == "cancel_operation":
            self._stop_event.set()
            self._current_operation = None
            return {"cancelled": True, "message": "Operação cancelada"}

        elif operation == "get_status":
            return {
                "status": "running" if self._current_operation else "idle",
                "current_operation": self._current_operation,
                "service": "directory_analysis",
            }

        else:
            raise ValueError(f"Unknown operation: {operation}")
