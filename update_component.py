import io

with io.open('src/components/ControlGestionEmprendedores.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Label to imports and profMapping
content = content.replace(
    "import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'",
    "import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Label } from 'recharts'\nimport profMapping from '../config/profesionales-mapping.json'"
)

# 2. Add metaContrato
content = content.replace(
    "const nCohorte = 36",
    "const nCohorte = 36\n  const metaContrato = 30"
)

# 3. Update empAtendidosPerc
content = content.replace(
    "const empAtendidosPerc = ((empUnicosRealizadas / nCohorte) * 100).toFixed(1)",
    "const empAtendidosPerc = ((empUnicosRealizadas / metaContrato) * 100).toFixed(1)"
)

# 4. Update the card sub-label for "Emprendimientos atendidos"
content = content.replace(
    "sub={`${empAtendidosPerc}% de la cohorte de ${nCohorte}`}",
    "sub={`${empAtendidosPerc}% de la meta de ${metaContrato}`}"
)

# 5. Fix "Volumen global por ronda" PieChart and Layout
old_volumen = """
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Volumen Global */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Volumen global por ronda</h3>
          <table className="w-full text-left text-sm mb-6">
"""
new_volumen = """
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Volumen Global */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4">Volumen global por ronda</h3>
          <div className="flex flex-col md:flex-row gap-4 flex-1 items-center">
            <div className="w-full md:w-1/2">
              <table className="w-full text-left text-sm mb-0">
"""
content = content.replace(old_volumen.strip(), new_volumen.strip())

old_pie = """
            </tbody>
          </table>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieModalidadData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({name, value}) => `${name} ${value}`}>
                  {pieModalidadData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
"""
new_pie = """
            </tbody>
          </table>
            </div>

            <div className="w-full md:w-1/2 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieModalidadData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                    {pieModalidadData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    <Label 
                      value={`${totalRealizadas} sesiones`} position="center" 
                      style={{ fontSize: '14px', fontWeight: 'bold', fill: '#334155' }}
                    />
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" 
                    payload={[
                      { value: `Presencial ${modalidadCount["Presencial"]} (${presencialPerc}%)`, type: 'square', color: '#3b82f6' },
                      { value: `Virtual ${modalidadCount["Virtual"]} (${virtualPerc}%)`, type: 'square', color: '#10b981' }
                    ]}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
"""
content = content.replace(old_pie.strip(), new_pie.strip())


# 6. Productividad table title and obfuscation
old_prof_title = '<h3 className="font-bold text-slate-800 mb-4">Productividad por Profesional</h3>'
new_prof_title = '<h3 className="font-bold text-slate-800 mb-4">Distribución de asesorías del equipo profesional</h3>'
content = content.replace(old_prof_title, new_prof_title)

# Update logic for prof table
old_prof_logic = """
  // 5. Productividad por profesional
  let profMap = {}
  realizadas.forEach(s => {
    const p = s.profesional || 'Sin definir'
    if (!profMap[p]) profMap[p] = { name: p, total: 0, r1: 0, r2: 0, r3: 0, r4: 0, horas: 0, temas: {} }
"""
new_prof_logic = """
  // 5. Productividad por profesional
  const profMapObj = { ...profMapping }
  let nextId = Object.keys(profMapObj).length + 1
  const getMappedName = (name) => {
    if (!name || name === 'Sin asignar' || name === 'Sin definir') return 'Sin asignar'
    if (!profMapObj[name]) {
      profMapObj[name] = `Asesor(a) ${nextId++}`
    }
    return profMapObj[name]
  }

  let profMap = {}
  realizadas.forEach(s => {
    const rawP = s.profesional || 'Sin definir'
    const p = getMappedName(rawP)
    
    // Obfuscate in the session object as well for the dropdown and CSV
    s.profesional = p;
    
    if (!profMap[p]) profMap[p] = { name: p, total: 0, r1: 0, r2: 0, r3: 0, r4: 0, horas: 0, temas: {} }
"""
content = content.replace(old_prof_logic.strip(), new_prof_logic.strip())

# Need to obfuscate programadas too
old_prog = "const programadas = allSessions.filter(s => s.isProgramada)"
new_prog = """
  const programadas = allSessions.filter(s => s.isProgramada)
  programadas.forEach(s => {
    s.profesional = getMappedName(s.profesional);
  })
"""
# We must insert getMappedName definition earlier or just run another loop. Let's do a loop before `realizadas`.
old_filtering = """
  const realizadas = allSessions.filter(s => s.isRealizada)
  const programadas = allSessions.filter(s => s.isProgramada)
"""
new_filtering = """
  const profMapObj = { ...profMapping }
  let nextId = Object.keys(profMapObj).length + 1
  const getMappedName = (name) => {
    if (!name || name === 'Sin asignar' || name === 'Sin definir') return 'Sin asignar'
    if (!profMapObj[name]) {
      profMapObj[name] = `Asesor(a) ${nextId++}`
    }
    return profMapObj[name]
  }

  const realizadas = allSessions.filter(s => s.isRealizada)
  const programadas = allSessions.filter(s => s.isProgramada)
  
  allSessions.forEach(s => {
    s.profesional = getMappedName(s.profesional);
  })
"""
content = content.replace(old_filtering.strip(), new_filtering.strip())

# Then remove the duplicate getMappedName from prof logic
old_prof_logic_2 = """
  // 5. Productividad por profesional
  let profMap = {}
  realizadas.forEach(s => {
    const p = s.profesional || 'Sin definir'
"""
new_prof_logic_2 = """
  // 5. Productividad por profesional
  let profMap = {}
  realizadas.forEach(s => {
    const p = s.profesional || 'Sin asignar'
"""
content = content.replace(old_prof_logic.strip(), new_prof_logic_2.strip())

# Update Funnel logic
old_funnel = """
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Embudo de Continuidad</h3>
          <div className="space-y-4 relative">
             <div className="flex justify-between text-sm font-medium">
               <span className="text-slate-600">Cohorte original</span>
               <span className="text-slate-800">{nCohorte}</span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-300 w-full"></div></div>

             <div className="flex justify-between text-sm font-medium">
               <span className="text-slate-600">Con #1</span>
               <span className="text-slate-800">{empRonda1} <span className="text-slate-400 font-normal">({((empRonda1/nCohorte)*100).toFixed(1)}%)</span></span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-400" style={{width: `${(empRonda1/nCohorte)*100}%`}}></div></div>

             <div className="flex justify-between text-sm font-medium">
               <span className="text-slate-600">Con #1 y #2</span>
               <span className="text-slate-800">{continuidadCount} <span className="text-slate-400 font-normal">({((continuidadCount/nCohorte)*100).toFixed(1)}%)</span></span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{width: `${(continuidadCount/nCohorte)*100}%`}}></div></div>

             <div className="flex justify-between text-sm font-medium">
               <span className="text-slate-600">Con #1, #2 y #3</span>
               <span className="text-slate-800">{c3} <span className="text-slate-400 font-normal">({((c3/nCohorte)*100).toFixed(1)}%)</span></span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600" style={{width: `${(c3/nCohorte)*100}%`}}></div></div>

             <div className="flex justify-between text-sm font-medium">
               <span className="text-slate-600">Con #1 a #4</span>
               <span className="text-slate-800">{c4}</span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-700" style={{width: `${(c4/nCohorte)*100}%`}}></div></div>
          </div>
        </div>
"""

new_funnel = """
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Embudo de Continuidad</h3>
          <div className="space-y-4 relative">
             <div className="flex justify-between text-sm font-medium">
               <span className="text-slate-600">Meta del contrato: {metaContrato} emprendimientos</span>
               <span className="text-slate-800">100%</span>
             </div>
             
             <div className="flex justify-between text-sm font-medium mt-2">
               <span className="text-slate-600">Registrados en la base</span>
               <span className="text-slate-800 flex items-center gap-2">
                 {nCohorte} <span className="text-emerald-600 font-bold">({((nCohorte/metaContrato)*100).toFixed(0)}%)</span>
                 {nCohorte > metaContrato && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-bold">supera la meta en {nCohorte - metaContrato}</span>}
               </span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-400" style={{width: '100%'}}></div></div>

             <div className="flex justify-between text-sm font-medium">
               <span className="text-slate-600">Con #1</span>
               <span className="text-slate-800">{empRonda1} <span className="text-slate-500 font-normal">({((empRonda1/metaContrato)*100).toFixed(1)}%)</span></span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-400" style={{width: `${Math.min((empRonda1/metaContrato)*100, 100)}%`}}></div></div>

             <div className="flex justify-between text-sm font-medium">
               <span className="text-slate-600">Con #1 y #2</span>
               <span className="text-slate-800">{continuidadCount} <span className="text-slate-500 font-normal">({((continuidadCount/metaContrato)*100).toFixed(1)}%)</span></span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{width: `${Math.min((continuidadCount/metaContrato)*100, 100)}%`}}></div></div>

             <div className="flex justify-between text-sm font-medium">
               <span className="text-slate-600">Con #1, #2 y #3</span>
               <span className="text-slate-800">{c3} <span className="text-slate-500 font-normal">({((c3/metaContrato)*100).toFixed(1)}%)</span></span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600" style={{width: `${Math.min((c3/metaContrato)*100, 100)}%`}}></div></div>

             <div className="flex justify-between text-sm font-medium">
               <span className="text-slate-600">Con #1 a #4</span>
               <span className="text-slate-800">{c4} <span className="text-slate-500 font-normal">(0%)</span></span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-700" style={{width: `${Math.min((c4/metaContrato)*100, 100)}%`}}></div></div>
          </div>
        </div>
"""
content = content.replace(old_funnel.strip(), new_funnel.strip())


with io.open('src/components/ControlGestionEmprendedores.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
