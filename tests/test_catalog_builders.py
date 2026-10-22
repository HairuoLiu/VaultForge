import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest


class CatalogBuilderTests(unittest.TestCase):
    def run_case(self, category, script, output, mode):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            project = root / 'workbench'
            (project / 'scripts').mkdir(parents=True)
            (project / 'assets').mkdir()
            source = Path(__file__).resolve().parents[1] / 'scripts' / script
            shutil.copyfile(source, project / 'scripts' / script)
            destination = project / 'assets' / output
            destination.write_text('existing catalog', encoding='utf-8')
            env = dict(os.environ)
            env.pop('VAULT_RESOURCE_ROOT', None)
            resource_root = root if mode == 'parent' else root / 'external'
            if mode == 'explicit':
                env['VAULT_RESOURCE_ROOT'] = str(resource_root)
            if mode != 'missing':
                folder = resource_root / category
                folder.mkdir(parents=True)
                (folder / 'Example.STL').write_bytes(b'fixture')
            result = subprocess.run([sys.executable, str(project / 'scripts' / script)], env=env, capture_output=True, text=True)
            if mode == 'missing':
                self.assertNotEqual(result.returncode, 0, result.stdout)
                self.assertEqual(destination.read_text(encoding='utf-8'), 'existing catalog')
            else:
                self.assertEqual(result.returncode, 0, result.stderr)
                text = destination.read_text(encoding='utf-8')
                paths = json.loads(text[text.index('['):text.rindex(']') + 1])
                self.assertEqual(paths, [category + '/Example.STL'])

    def test_parent_folder_and_uppercase_stl(self):
        for args in self.builders:
            with self.subTest(script=args[1]):
                self.run_case(*args, 'parent')

    def test_explicit_resource_root(self):
        for args in self.builders:
            with self.subTest(script=args[1]):
                self.run_case(*args, 'explicit')

    def test_missing_resources_do_not_erase_catalog(self):
        for args in self.builders:
            with self.subTest(script=args[1]):
                self.run_case(*args, 'missing')

    builders = [
        ('01. DRAWERS', 'build-drawer-catalog.py', 'drawer-files.js'),
        ('03. MODIFICATIONS', 'build-modification-catalog.py', 'modification-files.js'),
    ]


if __name__ == '__main__':
    unittest.main()
