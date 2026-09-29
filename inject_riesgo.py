import io

with io.open('src/components/ControlGestionEmprendedores.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

calc_injection = """
  // Riesgo de Desercion
  let r1SinR2Prog = 0
  let r1SinR2NoFecha = []
  let sinR1Prog = 0
  let sinR1NoAsignada = []

  asesoriasData.forEach(emp => {
    const eAll = allSessions.filter(s => s.emp_id === emp.id)
    const hasR1Real = eAll.some(s => s.ronda === 1 && s.isRealizada)
    const hasR2Real = eAll.some(s => s.ronda === 2 && s.isRealizada)
    
    if (hasR1Real && !hasR2Real) {
      const hasR2Prog = eAll.some(s => s.ronda === 2 && s.isProgramada)
      if (hasR2Prog) {
        r1SinR2Prog++
      } else {
        r1SinR2NoFecha.push(emp.nombre_completo.split(' - ')[0]) // Using just the business name for brevity
      }
    } else if (!hasR1Real) {
      const hasR1Prog = eAll.some(s => s.ronda === 1 && s.isProgramada)
      if (hasR1Prog) {
        sinR1Prog++
      } else {
        sinR1NoAsignada.push(emp.nombre_completo.split(' - ')[0])
      }
    }
  })
  
  const r1SinR2Total = r1SinR2Prog + r1SinR2NoFecha.length
  const sinR1Total = sinR1Prog + sinR1NoAsignada.length
"""

content = content.replace(
    "  // Funnel",
    calc_injection + "\n  // Funnel"
)

ui_injection = """
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-amber-500" /> Riesgo de Deserción / Novedades</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
              <h4 className="font-bold text-amber-800 mb-2">{r1SinR2Total} emprendimientos tuvieron la #1 sin la #2</h4>
              <p className="text-sm text-amber-700 mb-2">De ellos, <strong className="font-bold">{r1SinR2Prog}</strong> tienen la #2 programada y <strong className="font-bold">{r1SinR2NoFecha.length}</strong> no tienen fecha:</p>
              <ul className="text-xs text-amber-700 list-disc list-inside space-y-1 ml-1">
                {r1SinR2NoFecha.map((name, i) => <li key={i}>{name}</li>)}
              </ul>
            </div>
            
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg">
              <h4 className="font-bold text-rose-800 mb-2">{sinR1Total} emprendimientos no han tenido la #1</h4>
              <p className="text-sm text-rose-700 mb-2">De ellos, <strong className="font-bold">{sinR1Prog}</strong> la tienen programada y <strong className="font-bold">{sinR1NoAsignada.length}</strong> no tienen ninguna asesoría asignada:</p>
              <ul className="text-xs text-rose-700 list-disc list-inside space-y-1 ml-1">
                {sinR1NoAsignada.map((name, i) => <li key={i}>{name}</li>)}
              </ul>
            </div>
          </div>
        </div>
"""

# Let's find where to inject it in the UI. 
# Right after Embudo and Cronologia.
content = content.replace(
    "      <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">",
    ui_injection + "\n      <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">"
)

with io.open('src/components/ControlGestionEmprendedores.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
