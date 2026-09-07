"""Serves the built frontend from behind this backend.

TanStack Start always renders its HTML shell server-side - there's no
static `index.html` to hand to `StaticFiles` (see `NITRO_PRESET` in
`frontend/vite.config.ts`). So in production the Docker image (see
`../../Dockerfile`) builds the frontend as a small standalone Node HTTP
server instead (nitro's `node-server` preset, which also serves the
built CSS/JS/etc. from its own `public/` dir), and we spawn that as a
child process on a loopback-only port at startup, reverse-proxying every
request `main.py` doesn't otherwise handle (i.e. everything outside
`/api`) to it. The container still exposes a single port/process.

Entirely a no-op - `create_frontend_server()` returns `None` and
`main.py` skips mounting the proxy route - unless
`NEUROSPRINT_FRONTEND_DIR` points at an actual build, which is true only
inside the Docker image. Local backend-only dev and every test run are
unaffected.
"""

from __future__ import annotations

import os
import socket
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

from fastapi import Request, Response
from starlette.concurrency import run_in_threadpool

# Headers that are per-hop, not per-resource - forwarding them (in either
# direction) would misrepresent the proxy hop as the real connection.
_HOP_BY_HOP_HEADERS = frozenset(
    {
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailers",
        "transfer-encoding",
        "upgrade",
        "content-length",
        "host",
    }
)


def _free_port() -> int:
    """Picks an unused loopback port for the frontend server to bind."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class FrontendServer:
    """Manages the frontend's Node server child process and proxies to it."""

    def __init__(self, entry: Path, port: int) -> None:
        self._entry = entry
        self._port = port
        self._process: subprocess.Popen[bytes] | None = None

    def start(self, ready_timeout: float = 20.0) -> None:
        env = {**os.environ, "PORT": str(self._port), "HOST": "127.0.0.1"}
        # `bun` (not `node`) because that's what builds the frontend and is
        # guaranteed present in the image - see ../../Dockerfile.
        self._process = subprocess.Popen(
            ["bun", str(self._entry)],
            env=env,
            cwd=str(self._entry.parent),
        )
        self._wait_until_ready(ready_timeout)

    def _wait_until_ready(self, timeout: float) -> None:
        """Blocks until the child accepts connections on `self._port`.

        Runs during FastAPI's startup (before any request is served), so a
        request landing right after boot doesn't race the child process
        past `Popen()` returning but before it's actually listening.
        """
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if self._process.poll() is not None:
                raise RuntimeError(
                    f"Frontend server ({self._entry}) exited during startup "
                    f"with code {self._process.returncode}."
                )
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
                probe.settimeout(0.2)
                try:
                    probe.connect(("127.0.0.1", self._port))
                    return
                except OSError:
                    time.sleep(0.1)
        raise RuntimeError(f"Frontend server ({self._entry}) did not start listening within {timeout}s.")

    def stop(self) -> None:
        if self._process is None:
            return
        self._process.terminate()
        try:
            self._process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self._process.kill()
            self._process.wait(timeout=5)
        self._process = None

    async def proxy(self, request: Request) -> Response:
        """Forwards `request` to the frontend server and relays its response."""
        url = f"http://127.0.0.1:{self._port}{request.url.path}"
        if request.url.query:
            url = f"{url}?{request.url.query}"
        body = await request.body()
        headers = {k: v for k, v in request.headers.items() if k.lower() not in _HOP_BY_HOP_HEADERS}

        def _do_request() -> tuple[int, list[tuple[str, str]], bytes]:
            req = urllib.request.Request(url, data=body or None, headers=headers, method=request.method)
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310 - internal loopback only
                    return resp.status, resp.getheaders(), resp.read()
            except urllib.error.HTTPError as exc:
                return exc.code, list(exc.headers.items()), exc.read()

        status, resp_headers, content = await run_in_threadpool(_do_request)
        out_headers = {k: v for k, v in resp_headers if k.lower() not in _HOP_BY_HOP_HEADERS}
        return Response(content=content, status_code=status, headers=out_headers)


def create_frontend_server() -> FrontendServer | None:
    """Builds a `FrontendServer` for `NEUROSPRINT_FRONTEND_DIR`, or `None`.

    Returns `None` (rather than raising) whenever there's nothing to
    serve, so callers can unconditionally opt out of mounting the proxy.
    """
    frontend_dir = os.environ.get("NEUROSPRINT_FRONTEND_DIR")
    if not frontend_dir:
        return None
    entry = Path(frontend_dir) / "server" / "index.mjs"
    if not entry.is_file():
        return None
    return FrontendServer(entry, port=_free_port())
