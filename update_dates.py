import io

with io.open('src/components/Home.jsx', 'r', encoding='utf-8') as f:
    d = f.read()
d = d.replace('"2026-09-29"', '"2026-10-06"')
with io.open('src/components/Home.jsx', 'w', encoding='utf-8') as f:
    f.write(d)

with io.open('src/components/ControlGestionEmprendedores.jsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace("'2026-09-29'", "'2026-10-06'")
with io.open('src/components/ControlGestionEmprendedores.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
