#!/usr/bin/env python3
"""Buduje _site/ dla GitHub Pages: index.html (sprawdza serwer i przekierowuje) + game.html (gra z banerem demo)."""
import pathlib, shutil, subprocess, sys

root = pathlib.Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(root / "build.py")], check=True, cwd=root)
site = root / "_site"
shutil.rmtree(site, ignore_errors=True)
site.mkdir()
for name in ("index.html", "config.js", "demo-banner.js"):
    shutil.copy(root / "pages" / name, site / name)
game = (root / "dist" / "astromeow.html").read_text(encoding="utf-8")
tags = '<script src="config.js"></script><script src="demo-banner.js"></script>'
assert "</body>" in game, "brak </body> w dist/astromeow.html"
(site / "game.html").write_text(game.replace("</body>", tags + "</body>", 1), encoding="utf-8")
print("OK ->", site)
