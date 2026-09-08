# coding: utf-8
import io
with io.open('src/components/PerfilesView.jsx', 'r', encoding='utf-8') as f:
    c = f.read()
    
# 1. Update first FuenteDato
c = c.replace(
    '<FuenteDato fuente="Informe de caracterización" fecha="agosto 2026" n={n} />',
    '<FuenteDato fuente="Base consolidada final, Excel del proyecto" fecha="Septiembre 2026" n={n} />',
    1 # Only the first one (horizontal bar)
)

# 2. Add Sin dato colors to renderVerticalBar and renderStackedGroupedBar
# Find renderVerticalBar
c = c.replace(
    '<Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>\n              {data.map((entry, index) => (\n                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? \'#10b981\' : \'#34d399\'} />\n              ))}\n            </Bar>',
    '<Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>\n              {data.map((entry, index) => (\n                <Cell key={`cell-${index}`} fill={entry.name === "Sin dato" ? "#94a3b8" : (index % 2 === 0 ? "#10b981" : "#34d399")} />\n              ))}\n            </Bar>'
)

# In renderVerticalBar add subtitle
c = c.replace(
    '<h3 className="text-sm font-bold text-slate-800 mb-6">{title}</h3>',
    '<h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>\n      <p className="text-xs text-slate-500 mb-6 italic">10 participantes no diligenciaron el formulario de confirmación.</p>'
)

# For renderStackedGroupedBar add Sin Dato bar
c = c.replace(
    '<Bar dataKey="si" name="Sí" fill="#8b5cf6" radius={[4, 4, 0, 0]} />\n            <Bar dataKey="no" name="No" fill="#cbd5e1" radius={[4, 4, 0, 0]} />',
    '<Bar dataKey="si" name="Sí" fill="#8b5cf6" radius={[4, 4, 0, 0]} />\n            <Bar dataKey="no" name="No" fill="#cbd5e1" radius={[4, 4, 0, 0]} />\n            <Bar dataKey="sinDato" name="Sin dato" fill="#94a3b8" radius={[4, 4, 0, 0]} />'
)

# Also fix subtitle for renderStackedGroupedBar (already handled by the generic title replace since both use title)

with io.open('src/components/PerfilesView.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
