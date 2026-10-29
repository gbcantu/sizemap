from __future__ import annotations

import json
import os
import sys
import threading
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from modules.commands.controller import DirectoryCommandHandler


def create_handler():
    """Compose application services."""
    return DirectoryCommandHandler()


def main():
    """Main entry point for the JSON orchestrator."""
    handler = create_handler()
    write_lock = threading.Lock()
    operation_lock = threading.Lock()

    def emit(message):
        """Emit a JSON message to stdout."""
        with write_lock:
            sys.stdout.write(json.dumps(message, ensure_ascii=False) + "\n")
            sys.stdout.flush()

    # Signal that the service is ready
    emit({"type": "ready", "payload": {"message": "Directory analysis service is ready"}})

    # Main loop: read JSON lines from stdin
    for line in sys.stdin:
        try:
            request = json.loads(line)
        except json.JSONDecodeError as exc:
            emit({"id": None, "type": "error", "error": f"Invalid request: {exc}", "errorType": "ValueError"})
            continue
        
        # Prevent concurrent operations (simplified - could allow some concurrency)
        if not operation_lock.acquire(blocking=False):
            request_id = request.get("id") if isinstance(request, dict) else None
            emit({"id": request_id, "type": "error", "error": "Another operation is already running",
                  "errorType": "BusyError"})
            continue

        def run(current_request=request):
            """Run the request in a separate thread."""
            try:
                handler.handle(current_request, emit)
            finally:
                operation_lock.release()

        # Start processing in a separate thread
        threading.Thread(target=run, name="directory-command", daemon=True).start()


if __name__ == "__main__":
    main()