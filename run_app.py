#!/usr/bin/env python3
"""Build the frontend, start the Node backend, then serve the app via Python.

Usage:
  python3 run_app.py

Environment variables:
  PUBLIC_PORT   Port for the Python web server (default: 8000)
  BACKEND_PORT  Port for the Express backend (default: 5001)
  HOST          Bind host for the Python web server (default: 0.0.0.0)
"""

from __future__ import annotations

import atexit
import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
BACKEND_PORT = os.getenv("BACKEND_PORT", "5001")
PUBLIC_PORT = os.getenv("PUBLIC_PORT", "8000")
HOST = os.getenv("HOST", "0.0.0.0")


def require_command(name: str) -> None:
    if shutil.which(name) is None:
        print(f"Missing required command: {name}", file=sys.stderr)
        sys.exit(1)


def run_checked(command: list[str], cwd: Path) -> None:
    print(f"\n>> {' '.join(command)}")
    subprocess.run(command, cwd=cwd, check=True)


def start_backend() -> subprocess.Popen:
    env = os.environ.copy()
    env.setdefault("PORT", BACKEND_PORT)
    print("\n>> Starting backend")
    process = subprocess.Popen(["npm", "start"], cwd=BACKEND_DIR, env=env)
    return process


def stop_process(process: subprocess.Popen | None) -> None:
    if process is None or process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()


if __name__ == "__main__":
    require_command("npm")
    require_command("node")
    require_command("python3")

    backend_process: subprocess.Popen | None = None

    def cleanup(*_args) -> None:
        stop_process(backend_process)
        raise SystemExit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    atexit.register(lambda: stop_process(backend_process))

    run_checked(["npm", "install"], PROJECT_ROOT)
    run_checked(["npm", "install"], BACKEND_DIR)
    run_checked(["npm", "run", "build"], PROJECT_ROOT)

    backend_process = start_backend()
    time.sleep(2)
    if backend_process.poll() is not None:
        print("Backend exited immediately. Check backend logs/output.", file=sys.stderr)
        sys.exit(1)

    env = os.environ.copy()
    env["PORT"] = PUBLIC_PORT
    env["HOST"] = HOST
    env["BACKEND_URL"] = f"http://127.0.0.1:{BACKEND_PORT}"

    print(f"\n>> Serving app on http://{HOST}:{PUBLIC_PORT}")
    subprocess.run([sys.executable, "serve_app.py"], cwd=PROJECT_ROOT, env=env, check=True)
