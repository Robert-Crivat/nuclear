import io
import json
import sys
import threading
import time

sys.path.insert(0, sys.argv[1])

channel = sys.stdout
channel_lock = threading.Lock()
streams = threading.local()


class ThreadStream(io.TextIOBase):
    def __init__(self, name, fallback):
        self.name = name
        self.fallback = fallback

    @property
    def encoding(self):
        return 'utf-8'

    def isatty(self):
        return False

    def write(self, text):
        target = getattr(streams, self.name, None) or self.fallback
        return target.write(text)

    def flush(self):
        pass


sys.stdout = ThreadStream('out', sys.stderr)
sys.stderr = ThreadStream('err', sys.stderr)

import yt_dlp
import yt_dlp.extractor.youtube


def exit_code(error):
    if error.code is None:
        return 0
    if isinstance(error.code, int):
        return error.code
    streams.err.write(str(error.code))
    return 1


def handle(request):
    started = time.monotonic()
    streams.out = io.StringIO()
    streams.err = io.StringIO()
    try:
        yt_dlp.main(request['args'])
        code = 0
    except SystemExit as error:
        code = exit_code(error)
    except BaseException as error:
        streams.err.write(repr(error))
        code = 1
    response = {
        'id': request['id'],
        'code': code,
        'out': streams.out.getvalue(),
        'err': streams.err.getvalue(),
    }
    streams.out = streams.err = None
    sys.__stderr__.write('%s took %.2fs (exit %s)\n' % (
        request['args'][-1], time.monotonic() - started, code))
    with channel_lock:
        channel.write(json.dumps(response) + '\n')
        channel.flush()


with channel_lock:
    channel.write(json.dumps({'ready': True}) + '\n')
    channel.flush()

for line in sys.stdin:
    if line.strip():
        threading.Thread(target=handle, args=(json.loads(line),), daemon=True).start()
