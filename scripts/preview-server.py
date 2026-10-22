#!/usr/bin/env python3
"""Serve the local project so previews can read the selected STL directly."""

import argparse
import json
import os
import subprocess
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PureWindowsPath
import webbrowser


class PreviewHandler(SimpleHTTPRequestHandler):
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
            root = Path(self.directory).resolve()
            requested = Path(relative)
            if requested.is_absolute() or '..' in requested.parts:
                return self.send_json(403, {'error': 'path'})
            target = (root / requested).resolve()
            resolved = target.relative_to(root)
            if resolved.parts[0] not in ('01. DRAWERS', '02. SUSTAINERS', '03. MODIFICATIONS') or target.suffix.lower() != '.stl':
                return self.send_json(403, {'error': 'path'})
            if not target.is_file():
                return self.send_json(404, {'error': 'missing'})
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
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    handler = partial(PreviewHandler, directory=str(root))
    with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
        url = f'http://127.0.0.1:{server.server_port}/index.html'
        print(f'VAULT 预览已启动：{url}', flush=True)
        print('在页面中选择 Vault 文件夹，即可预览 STL、阅读说明书和保存副本。', flush=True)
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
