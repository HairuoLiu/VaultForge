#!/usr/bin/env python3
"""Serve the local project so previews can read the selected STL directly."""

import argparse
import errno
import json
import os
import subprocess
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PureWindowsPath
import webbrowser


CATEGORIES = ('01. DRAWERS', '02. SUSTAINERS', '03. MODIFICATIONS')


def find_resource_root(project, configured=None):
    candidates = [Path(configured).expanduser().resolve()] if configured else [project, project.parent]
    return next((root for root in candidates if any((root / name).is_dir() for name in CATEGORIES)), None)


class PreviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/__vault/capabilities':
            if self.headers.get('Host') != f'127.0.0.1:{self.server.server_port}':
                return self.send_json(403, {'error': 'origin'})
            return self.send_json(200, {'service': 'vault-workbench', 'revealLocal': sys.platform in ('darwin', 'win32')})
        super().do_GET()

    def send_json(self, status, data):
        content = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):
        if self.path != '/__vault/reveal':
            return self.send_json(404, {'error': 'not_found'})
        # Only this loopback page may request a native file-manager action.
        host = f'127.0.0.1:{self.server.server_port}'
        if self.headers.get('Host') != host or self.headers.get('Origin') != 'http://' + host:
            return self.send_json(403, {'error': 'origin'})
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            return self.send_json(415, {'error': 'content_type'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 8192:
                return self.send_json(413, {'error': 'request_size'})
            body = json.loads(self.rfile.read(length))
            relative = body.get('path') if isinstance(body, dict) else None
            if not isinstance(relative, str) or not relative or '\x00' in relative:
                raise ValueError('Invalid path')
            root = getattr(self.server, 'resource_root', Path(self.directory).resolve())
            if root is None:
                return self.send_json(404, {'error': 'resource_root'})
            requested = Path(relative)
            if requested.is_absolute() or '..' in requested.parts:
                return self.send_json(403, {'error': 'path'})
            target = (root / requested).resolve()
            resolved = target.relative_to(root)
            if not resolved.parts or resolved.parts[0] not in CATEGORIES or target.suffix.lower() != '.stl':
                return self.send_json(403, {'error': 'path'})
            if not target.is_file():
                return self.send_json(404, {'error': 'missing'})
            # Refuse mismatched metadata or a file changed since folder selection.
            stat = target.stat()
            if body.get('size') != stat.st_size or body.get('lastModified') != stat.st_mtime_ns // 1_000_000:
                return self.send_json(409, {'error': 'mismatch'})
        except (ValueError, TypeError, OSError):
            return self.send_json(400, {'error': 'invalid_request'})
        if sys.platform not in ('darwin', 'win32'):
            return self.send_json(501, {'error': 'platform'})
        try:
            if sys.platform == 'win32':
                explorer = str(PureWindowsPath(os.environ.get('SystemRoot', r'C:\Windows')) / 'explorer.exe')
                # Explorer may reuse an existing window; its exit code is not a selection result.
                subprocess.Popen([explorer, '/select,', str(target)])
            else:
                subprocess.run(['/usr/bin/open', '-R', str(target)], check=True, timeout=5)
        except (OSError, subprocess.SubprocessError):
            return self.send_json(500, {'error': 'file_manager'})
        self.send_json(200, {'ok': True})

    def log_message(self, format, *args):
        pass

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            # Closing a preview may cancel an in-flight model download.
            pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--port', type=int, default=8765, help='Local port (default: 8765; use 0 for a temporary test port)')
    parser.add_argument('--resource-root', default=os.environ.get('VAULT_RESOURCE_ROOT'), help='Path to the extracted Vault resource folder')
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error('--port must be between 0 and 65535.')
    root = Path(__file__).resolve().parent.parent
    resource_root = find_resource_root(root, args.resource_root)
    if args.resource_root and resource_root is None:
        parser.error('No Vault resource folders found at --resource-root / VAULT_RESOURCE_ROOT.')
    handler = partial(PreviewHandler, directory=str(root))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError as error:
        if error.errno == errno.EADDRINUSE:
            parser.exit(1, f'端口 {args.port} 已被占用。请关闭已启动的预览服务，或使用 --port 指定其他固定端口后重试。\n')
        parser.exit(1, f'无法启动本地预览服务：{error}\n')
    with server:
        server.resource_root = resource_root
        url = f'http://127.0.0.1:{server.server_port}/index.html'
        print(f'VAULT 预览已启动：{url}', flush=True)
        print('在页面中选择 Vault 文件夹，即可预览 STL、阅读说明书和保存副本。', flush=True)
        if resource_root:
            print(f'定位原文件使用的资源目录：{resource_root}', flush=True)
        else:
            print('未找到本地资源目录；如需定位原文件，请通过 --resource-root 指定 Vault 文件夹。', flush=True)
        print('也可直接双击 index.html 使用，无需运行本启动脚本。', flush=True)
        print('仅本机可访问。使用期间请保留此窗口；关闭窗口或按 Ctrl+C 结束。', flush=True)
        if not args.no_browser:
            try:
                webbrowser.open(url)
            except webbrowser.Error:
                print('浏览器未能自动打开，请复制上方网址到浏览器。', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\n预览服务已关闭。', flush=True)


if __name__ == '__main__':
    main()
