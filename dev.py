from __future__ import annotations

import signal
import subprocess
import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parent
    procs: list[subprocess.Popen] = []

    def shutdown(*_):
        for p in procs:
            p.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    procs.append(subprocess.Popen(
        ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"],
        cwd=root / "backend",
    ))
    procs.append(subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=root / "frontend",
    ))

    print("▶ Backend  → http://localhost:5000")
    print("▶ Frontend → http://localhost:5173")
    print("  Ctrl+C untuk berhenti\n")

    for p in procs:
        p.wait()
