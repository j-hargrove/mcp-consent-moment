"""Case-study shot 4: the Figma multi-hop card (left) and the running card (right), side by side.

Inputs, both 2x:
  docs/case-study/multihop-figma-2x.png  exported from Figma by hand
  docs/case-study/multihop-code-2x.png   the running card, deviceScaleFactor 2
Output:
  docs/case-study/multihop-figma-vs-code.png

Top-aligned on the page field; margin and gap are space.xl. Colors and spacing come from tokens.json.
Run from the repo root: python3 demo/scripts/compose-shot4.py
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SHOTS = ROOT / 'docs' / 'case-study'
SCALE = 2

tokens = json.loads((ROOT / 'docs' / 'design' / 'tokens.json').read_text())
field = tokens['color']['neutral']['field']['$value']
space = tokens['space']['xl']['$value']['value'] * SCALE

figma = Image.open(SHOTS / 'multihop-figma-2x.png').convert('RGB')
code = Image.open(SHOTS / 'multihop-code-2x.png').convert('RGB')

width = space + figma.width + space + code.width + space
height = space + max(figma.height, code.height) + space
canvas = Image.new('RGB', (width, height), field)
canvas.paste(figma, (space, space))
canvas.paste(code, (space + figma.width + space, space))

out = SHOTS / 'multihop-figma-vs-code.png'
canvas.save(out)
print(f'{out.relative_to(ROOT)}: {width} x {height} (figma {figma.size}, code {code.size})')
