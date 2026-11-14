#!/usr/bin/env python3
"""Skleja cały projekt w jeden plik dist/astromeow.html (do hostowania / wysłania komuś).
Uruchom:  python3 build.py"""
import re, os
here = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(here, 'index.html'), encoding='utf-8').read()
def css(m): return '<style>\n' + open(os.path.join(here, m.group(1)), encoding='utf-8').read() + '</style>'
def js(m):  return '<script>\n' + open(os.path.join(here, m.group(1)), encoding='utf-8').read() + '</script>'
html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', css, html)
html = re.sub(r'<script src="(js/[^"]+)"></script>', js, html)
os.makedirs(os.path.join(here, 'dist'), exist_ok=True)
out = os.path.join(here, 'dist', 'astromeow.html')
open(out, 'w', encoding='utf-8').write(html)
print('OK ->', out, len(html) // 1024, 'KB')
