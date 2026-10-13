#!/usr/bin/env python3
"""Gộp index.html + css/ + js/ thành MỘT file HTML duy nhất (tiện mở trên điện thoại hoặc gửi đi).
Dùng:  python3 tools/build-single.py   ->  dist/phong-thuy-tong-hop.html"""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')

def inline_css(m):
    return '<style>\n' + (root / m.group(1)).read_text(encoding='utf-8').rstrip() + '\n</style>'

def inline_js(m):
    text = (root / m.group(1)).read_text(encoding='utf-8').rstrip()
    assert '</script' not in text.lower(), m.group(1) + ' chứa chuỗi </script'
    return '<script>\n' + text + '\n</script>'

html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)

out = root / 'dist' / 'phong-thuy-tong-hop.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8')
print('Đã tạo', out, '(%d KB)' % (len(html.encode('utf-8')) // 1024))
