# Produces docs/case-study/multihop-figma-vs-code.png from multihop-figma-2x.png (Figma export) and multihop-code-2x.png: python3 demo/scripts/case-study/compose-shot4.py
"""Case-study shot 4: the Figma multi-hop card (left) and the running card (right), side by side.

Inputs, both 2x:
  docs/case-study/multihop-figma-2x.png  exported from Figma by hand
  docs/case-study/multihop-code-2x.png   the running card, deviceScaleFactor 2
Output:
  docs/case-study/multihop-figma-vs-code.png

Top-aligned on the page field; margin and gap are space.xl. Colors and spacing come from tokens.json.
Run from the repo root: python3 demo/scripts/case-study/compose-shot4.py
OUT=<dir> writes the output there instead (the inputs still come from docs/case-study).
"""
import json
import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SHOTS = ROOT / 'docs' / 'case-study'
OUT = Path(os.environ.get('OUT', SHOTS))
CODE = Path(os.environ.get('CODE_SHOT', SHOTS / 'multihop-code-2x.png'))
SCALE = 2

tokens = json.loads((ROOT / 'docs' / 'design' / 'tokens.json').read_text())
field = tokens['color']['neutral']['field']['$value']
space = tokens['space']['xl']['$value']['value'] * SCALE

figma = Image.open(SHOTS / 'multihop-figma-2x.png').convert('RGB')
code = Image.open(CODE).convert('RGB')

width = space + figma.width + space + code.width + space
height = space + max(figma.height, code.height) + space
canvas = Image.new('RGB', (width, height), field)
canvas.paste(figma, (space, space))
canvas.paste(code, (space + figma.width + space, space))

out = OUT / 'multihop-figma-vs-code.png'
canvas.save(out)
print(f'{out}: {width} x {height} (figma {figma.size}, code {code.size})')
