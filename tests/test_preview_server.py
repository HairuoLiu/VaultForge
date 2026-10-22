import importlib.util
import json
from functools import partial
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('preview_server', Path(__file__).resolve().parents[1] / 'scripts/preview-server.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RevealTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.relative = "02. SUSTAINERS/L4F' Facade.stl"
        target = self.root / self.relative
        target.parent.mkdir()
        target.write_bytes(b'STL test fixture')
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(module.PreviewHandler, directory=str(self.root)))
        self.thread = Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def request(self, path, origin=None, host=None, endpoint='/__vault/reveal', **metadata):
        address = f'127.0.0.1:{self.server.server_port}'
        conn = HTTPConnection('127.0.0.1', self.server.server_port)
        stat = (self.root / self.relative).stat()
        payload = {'path': path, 'size': stat.st_size, 'lastModified': stat.st_mtime_ns // 1_000_000, **metadata}
        conn.request('POST', endpoint, json.dumps(payload), {'Content-Type': 'application/json', 'Origin': origin or 'http://' + address, 'Host': host or address})
        response = conn.getresponse()
        status = response.status
        data = json.loads(response.read())
        conn.close()
        return status, data

    @patch.object(module.sys, 'platform', 'darwin')
    @patch.object(module.subprocess, 'run')
    def test_reveals_original_from_separate_resource_root(self, run):
        project = self.root / 'workbench'
        project.mkdir()
        self.server.resource_root = module.find_resource_root(project)
        self.assertEqual(self.server.resource_root, self.root)
        self.assertEqual(self.request(self.relative), (200, {'ok': True}))
        run.assert_called_once_with(['/usr/bin/open', '-R', str(self.root / self.relative)], check=True, timeout=5)

    @patch.object(module.subprocess, 'run')
    def test_refuses_unmatched_or_unconfigured_resources(self, run):
        self.assertEqual(self.request(self.relative, size=None, lastModified=None), (409, {'error': 'mismatch'}))
        self.assertEqual(self.request(self.relative, size=1, lastModified=0)[0], 409)
        self.server.resource_root = None
        self.assertEqual(self.request(self.relative), (404, {'error': 'resource_root'}))
        run.assert_not_called()

    def test_resource_root_configuration_does_not_fall_back(self):
        self.assertEqual(module.find_resource_root(self.root / 'workbench', str(self.root)), self.root)
        self.assertIsNone(module.find_resource_root(self.root, str(self.root / 'missing')))

    @patch.object(module.sys, 'platform', 'darwin')
    def test_script_capabilities_are_detectable(self):
        conn = HTTPConnection('127.0.0.1', self.server.server_port)
        conn.request('GET', '/__vault/capabilities')
        response = conn.getresponse()
        self.assertEqual(response.status, 200)
        self.assertEqual(json.loads(response.read()), {'service': 'vault-workbench', 'revealLocal': True})
        conn.close()

    @patch.object(module.sys, 'platform', 'darwin')
    @patch.object(module.subprocess, 'run')
    def test_reveals_exact_original_without_shell(self, run):
        self.assertEqual(self.request(self.relative), (200, {'ok': True}))
        run.assert_called_once_with(['/usr/bin/open', '-R', str(self.root / self.relative)], check=True, timeout=5)

    @patch.object(module.sys, 'platform', 'win32')
    @patch.dict(module.os.environ, {'SystemRoot': r'C:\Windows'})
    @patch.object(module.subprocess, 'Popen')
    def test_windows_selects_exact_path_as_one_argument(self, popen):
        self.relative = "02. SUSTAINERS/中文 L4F' Facade.stl"
        (self.root / self.relative).write_bytes(b'STL test fixture')
        self.assertEqual(self.request(self.relative), (200, {'ok': True}))
        popen.assert_called_once_with([r'C:\Windows\explorer.exe', '/select,', str(self.root / self.relative)])

    @patch.object(module.sys, 'platform', 'win32')
    @patch.object(module.subprocess, 'Popen', side_effect=OSError('Explorer unavailable'))
    def test_windows_launch_failure_is_reported(self, popen):
        self.assertEqual(self.request(self.relative), (500, {'error': 'file_manager'}))

    @patch.object(module.sys, 'platform', 'linux')
    @patch.object(module.subprocess, 'Popen')
    @patch.object(module.subprocess, 'run')
    def test_unsupported_platform_does_not_launch_file_manager(self, run, popen):
        self.assertEqual(self.request(self.relative), (501, {'error': 'platform'}))
        run.assert_not_called()
        popen.assert_not_called()

    @patch.object(module.subprocess, 'run')
    def test_rejects_external_origins_and_hosts(self, run):
        self.assertEqual(self.request(self.relative, origin='https://external.example')[0], 403)
        self.assertEqual(self.request(self.relative, host='external.example')[0], 403)
        run.assert_not_called()

    @patch.object(module.subprocess, 'run')
    def test_rejects_outside_project_and_non_stl(self, run):
        for path in ['../outside.stl', str(self.root / self.relative), '.', 'index.html', 'scripts/example.stl']:
            self.assertEqual(self.request(path)[0], 403)
        (self.root / '02. SUSTAINERS/escape.stl').symlink_to(self.root.parent / 'outside.stl')
        self.assertEqual(self.request('02. SUSTAINERS/escape.stl')[0], 400)
        run.assert_not_called()

    @patch.object(module.subprocess, 'run')
    def test_missing_component_is_not_opened(self, run):
        self.assertEqual(self.request('02. SUSTAINERS/missing.stl'), (404, {'error': 'missing'}))
        run.assert_not_called()


if __name__ == '__main__':
    unittest.main()
