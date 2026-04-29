#!/usr/bin/env python3
"""Convert a Windows animated cursor (.ani) to an animated GIF."""
import io
import struct
import sys
from PIL import Image


def parse_ani(data: bytes):
    if data[:4] != b'RIFF' or data[8:12] != b'ACON':
        raise ValueError('not a RIFF/ACON file')

    frames: list[bytes] = []
    rates: list[int] | None = None
    seq: list[int] | None = None
    anih: bytes | None = None

    i = 12
    while i < len(data):
        chunk_id = data[i:i + 4]
        chunk_size = struct.unpack('<I', data[i + 4:i + 8])[0]
        body = data[i + 8:i + 8 + chunk_size]

        if chunk_id == b'LIST':
            list_type = body[:4]
            if list_type == b'fram':
                j = 4
                while j < len(body):
                    sub_id = body[j:j + 4]
                    sub_size = struct.unpack('<I', body[j + 4:j + 8])[0]
                    sub_body = body[j + 8:j + 8 + sub_size]
                    if sub_id == b'icon':
                        frames.append(sub_body)
                    j += 8 + sub_size + (sub_size & 1)
        elif chunk_id == b'anih':
            anih = body
        elif chunk_id == b'rate':
            rates = list(struct.unpack(f'<{chunk_size // 4}I', body))
        elif chunk_id == b'seq ':
            seq = list(struct.unpack(f'<{chunk_size // 4}I', body))

        i += 8 + chunk_size + (chunk_size & 1)

    default_rate = 10
    if anih and len(anih) >= 32:
        default_rate = struct.unpack('<I', anih[28:32])[0]

    return frames, rates, seq, default_rate


def main():
    if len(sys.argv) != 3:
        print('usage: ani2gif.py <input.ani> <output.gif>', file=sys.stderr)
        sys.exit(1)
    src, dst = sys.argv[1], sys.argv[2]

    with open(src, 'rb') as f:
        data = f.read()

    frames, rates, seq, default_rate = parse_ani(data)
    if not frames:
        raise SystemExit('no icon frames found')

    order = seq if seq else list(range(len(frames)))
    images: list[Image.Image] = []
    durations: list[int] = []
    for idx, frame_idx in enumerate(order):
        cur = frames[frame_idx]
        im = Image.open(io.BytesIO(cur)).convert('RGBA')
        images.append(im)
        rate = rates[idx] if rates and idx < len(rates) else default_rate
        durations.append(max(20, int(rate * 1000 / 60)))

    images[0].save(
        dst,
        save_all=True,
        append_images=images[1:],
        duration=durations,
        loop=0,
        disposal=2,
        transparency=0,
        optimize=False,
    )
    print(f'wrote {len(images)} frames to {dst}')


if __name__ == '__main__':
    main()
