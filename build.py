"""Embute style.css (minificado) no <head> do index.html, eliminando a requisição que bloqueia a renderização.

Uso: python build.py   (rode sempre que editar style.css)
"""
import re, pathlib

root = pathlib.Path(__file__).parent
css = (root / "style.css").read_text(encoding="utf-8")
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
css = re.sub(r"\s+", " ", css)
css = re.sub(r"\s*([{};,])\s*", r"\1", css).strip()

html_path = root / "index.html"
html = html_path.read_text(encoding="utf-8")
new, n = re.subn(r"(<style id=\"critical-css\">).*?(</style>)", lambda m: m.group(1) + css + m.group(2), html, flags=re.S)
assert n == 1, "bloco <style id=\"critical-css\"> não encontrado em index.html"
html_path.write_text(new, encoding="utf-8")
print(f"CSS embutido: {len(css) / 1024:.1f} KiB")
