from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CommandRequestDto:
    request_id: str
    operation: str
    payload: dict[str, Any]

    @classmethod
    def from_message(cls, message):
        if not isinstance(message, dict):
            raise ValueError("Request must be a JSON object")
        request_id, operation = message.get("id"), message.get("operation")
        payload = message.get("payload", {})
        if payload is None:
            payload = {}
        if not isinstance(request_id, str) or not request_id:
            raise ValueError("Request id must be a non-empty string")
        if not isinstance(operation, str) or not operation:
            raise ValueError("Request operation must be a non-empty string")
        if not isinstance(payload, dict):
            raise ValueError("Request payload must be a JSON object")
        return cls(request_id, operation, payload)


@dataclass(frozen=True)
class CommandResultDto:
    request_id: str
    payload: Any

    def to_dict(self):
        payload = self.payload.to_dict() if hasattr(self.payload, "to_dict") else self.payload
        return {"id": self.request_id, "type": "result", "payload": payload}


@dataclass(frozen=True)
class CommandErrorDto:
    request_id: str | None
    error: str
    error_type: str

    def to_dict(self):
        return {"id": self.request_id, "type": "error", "error": self.error, "errorType": self.error_type}


@dataclass(frozen=True)
class ProgressEventDto:
    stage: str
    completed: int
    total: int
    message: str

    def to_dict(self):
        return {
            "type": "progress",
            "payload": {
                "stage": self.stage,
                "completed": self.completed,
                "total": self.total,
                "message": self.message,
            },
        }