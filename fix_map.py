import io
with io.open('src/components/MapBoyaca.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix Puerto Boyaca label and size
c = c.replace(
    'style={{ fontFamily: "system-ui", fill: "#334155", fontSize: "12px", fontWeight: "bold" }}',
    'style={{ fontFamily: "system-ui", fill: "#334155", fontSize: "16px", fontWeight: "bold" }}'
)
c = c.replace(
    'style={{ fontFamily: "system-ui", fill: "#64748b", fontSize: "10px" }}\n            >\n              43 participantes',
    'style={{ fontFamily: "system-ui", fill: "#64748b", fontSize: "14px" }}\n            >\n              40 participantes'
)

# Fix Puerto Serviez label and size
c = c.replace(
    'style={{ fontFamily: "system-ui", fill: "#334155", fontSize: "11px", fontWeight: "bold" }}',
    'style={{ fontFamily: "system-ui", fill: "#334155", fontSize: "15px", fontWeight: "bold" }}'
)
c = c.replace(
    'style={{ fontFamily: "system-ui", fill: "#64748b", fontSize: "9px" }}\n            >\n              15 participantes',
    'style={{ fontFamily: "system-ui", fill: "#64748b", fontSize: "13px" }}\n            >\n              23 participantes'
)

# Adjust y coordinates so they don't overlap with larger text
c = c.replace('y="18"', 'y="22"')
c = c.replace('y="16"', 'y="20"')

# Update FuenteDato
c = c.replace(
    '<FuenteDato fuente="Informe de caracterización" fecha="agosto 2026" n={58} />',
    '<FuenteDato fuente="Base consolidada final, Excel del proyecto" fecha="Septiembre 2026" n={63} />'
)

with io.open('src/components/MapBoyaca.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
