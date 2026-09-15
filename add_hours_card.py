import io

with io.open('src/components/ControlGestion.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace variables calculation
old_calc = """
  // Asistencia Taller 1 calculation
  const t1Key = isEmprendedores ? "Taller 1" : "Taller 1: Mentalidad emprendedora"
  const t1Asistencias = data.filter(d => d[t1Key] === "Sí").length
  const t1Perc = n > 0 ? (t1Asistencias / n * 100).toFixed(1) : "0.0"
"""

new_calc = """
  // Asistencia Taller 1 calculation
  const t1Key = isEmprendedores ? "Taller 1" : "Taller 1: Mentalidad emprendedora"
  const t1Asistencias = data.filter(d => d[t1Key] === "Sí").length
  const t1Perc = n > 0 ? (t1Asistencias / n * 100).toFixed(1) : "0.0"

  // Horas acumuladas calculation (max of all non-empty hours)
  const maxHoras = data.reduce((acc, curr) => {
    const hrs = parseFloat(curr["Horas acompañamiento realizadas"]) || 0
    return Math.max(acc, hrs)
  }, 0)
"""

content = content.replace(old_calc.strip(), new_calc.strip())

# Replace UI
old_ui = """
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-slate-500 font-medium mb-1">Asistencia Taller 1</h3>
          <p className="text-3xl font-bold text-cyan-600">{t1Perc}%</p>
          <p className="text-sm text-slate-500 mt-1">{t1Asistencias} de {n} participantes</p>
        </div>
      </div>
"""

new_ui = """
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <h3 className="text-slate-500 font-medium mb-1">Asistencia Taller 1</h3>
          <p className="text-3xl font-bold text-cyan-600">{t1Perc}%</p>
          <p className="text-sm text-slate-500 mt-1">{t1Asistencias} de {n} participantes</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <h3 className="text-slate-500 font-medium mb-1">Horas Acumuladas</h3>
          <p className="text-3xl font-bold text-emerald-600">{maxHoras}</p>
          <p className="text-sm text-slate-500 mt-1">horas de acompañamiento por sesión completada</p>
        </div>
      </div>
"""

content = content.replace(old_ui.strip(), new_ui.strip())

with io.open('src/components/ControlGestion.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
