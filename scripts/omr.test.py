"""Adapter protocol tests only; mocks do not demonstrate actual OMR accuracy."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location('piano_score', Path(__file__).with_name('score.py'))
score = importlib.util.module_from_spec(spec)
spec.loader.exec_module(score)

class AdapterTests(unittest.TestCase):
    def setup_case(self):
        root = Path(tempfile.mkdtemp(prefix='piano-omr-protocol-'))
        source = root / 'source.pdf'; source.write_bytes(b'%PDF-1.4 protocol only')
        out = root / 'out'; out.mkdir()
        return source, out

    def test_missing_engine_does_not_install(self):
        source, out = self.setup_case()
        with self.assertRaises(score.Failure) as err:
            score.audiveris_source(source, out, str(out / 'missing.exe'))
        self.assertEqual(err.exception.code, 'OMR_UNAVAILABLE')

    def test_mxl_adapter_preserves_output_and_runs_known_flags(self):
        source, out = self.setup_case()
        xml = Path(__file__).with_name('fixtures').joinpath('score.musicxml').read_bytes()
        def run(command, **options):
            self.assertEqual(command[1:4], ['-batch', '-transcribe', '-export'])
            self.assertEqual(command[-2:], ['--', str(source)])
            self.assertFalse(options['shell'])
            with zipfile.ZipFile(out / 'omr' / 'score.mxl', 'w') as package:
                package.writestr('META-INF/container.xml', '<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>')
                package.writestr('score.xml', xml)
            return type('Result', (), dict(returncode=0, stdout=b'protocol fixture', stderr=b''))()
        with patch.object(score.subprocess, 'run', side_effect=run):
            result = score.audiveris_source(source, out, sys.executable)
        self.assertEqual(result['status'], 'needs_review')
        self.assertEqual((out / 'recognized.musicxml').read_bytes(), xml)
        self.assertTrue((out / 'omr-command.json').is_file())

    def test_engine_failure_is_retained_not_reinterpreted_as_success(self):
        source, out = self.setup_case()
        with patch.object(score.subprocess, 'run', return_value=type('Result', (), dict(returncode=7, stdout=b'', stderr=b'OMR failed'))()):
            with self.assertRaises(score.Failure) as err:
                score.audiveris_source(source, out, sys.executable)
        self.assertEqual(err.exception.code, 'OMR_FAILED')
        self.assertEqual(json.loads((out / 'omr-command.json').read_text())['exitCode'], 7)

if __name__ == '__main__':
    unittest.main()
