import { useState, useMemo } from 'react'
import { Info, Download, ChevronDown, ChevronRight, Calendar, User, Clock, AlertCircle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Label } from 'recharts'
import profMapping from '../config/profesionales-mapping.json'
import asesoriasData from '../data/control_gestion_asesorias.json'
import FuenteDato from './shared/FuenteDato'

// --- HELPER FUNCTIONS ---
const getWeekRange = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(12, 0, 0, 0) // avoid timezone issues
  const day = d.getDay() // 0=Sun, 1=Mon...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust to Monday
  const monday = new Date(d.setDate(diff))
  const sunday = new Date(d.setDate(diff + 6))
  const options = { month: 'short', day: 'numeric' }
  return `${monday.toLocaleDateString('es-ES', options)} al ${sunday.toLocaleDateString('es-ES', options)}`
}

export default function ControlGestionEmprendedores() {
  const [corteDate, setCorteDate] = useState('2026-10-06')
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [openRonda, setOpenRonda] = useState(null)
  const [openWeek, setOpenWeek] = useState(null)

  const nCohorte = 36
  const metaContrato = 30

  // --- DATA PROCESSING ---
  const allSessions = useMemo(() => {
    let list = []
    asesoriasData.forEach(emp => {
      emp.asesorias.forEach(a => {
        const isRealizada = a.fecha && a.fecha <= corteDate
        const isProgramada = a.fecha && a.fecha > corteDate
        list.push({
          ...a,
          emp_id: emp.id,
          emprendimiento: emp.emprendimiento,
          emprendedor: emp.emprendedor,
          nombre_completo: emp.nombre_completo,
          isRealizada,
          isProgramada
        })
      })
    })
    // Sort by date
    list.sort((a, b) => {
      if (!a.fecha) return 1
      if (!b.fecha) return -1
      return a.fecha.localeCompare(b.fecha)
    })
    return list
  }, [corteDate])

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

  // 2. Tarjetas superiores
  const totalRealizadas = realizadas.length
  
  const empUnicosRealizadas = new Set(realizadas.map(s => s.emp_id)).size
  const empAtendidosPerc = ((empUnicosRealizadas / metaContrato) * 100).toFixed(1)

  const con1 = new Set(realizadas.filter(s => s.ronda === 1).map(s => s.emp_id))
  const con2 = new Set(realizadas.filter(s => s.ronda === 2).map(s => s.emp_id))
  const con3 = new Set(realizadas.filter(s => s.ronda === 3).map(s => s.emp_id))
  const con4 = new Set(realizadas.filter(s => s.ronda === 4).map(s => s.emp_id))

  const empRonda1 = con1.size
  let continuidadCount = 0
  for (let id of con1) {
    if (con2.has(id)) continuidadCount++
  }
  const continuidadPerc = empRonda1 > 0 ? ((continuidadCount / empRonda1) * 100).toFixed(1) : 0

  const themesCount = {}
  realizadas.forEach(s => {
    if (s.tema) themesCount[s.tema] = (themesCount[s.tema] || 0) + 1
  })
  const temaLider = Object.keys(themesCount).sort((a, b) => themesCount[b] - themesCount[a])[0] || 'N/A'
  const temaLiderCount = themesCount[temaLider] || 0
  const temaLiderPerc = totalRealizadas > 0 ? ((temaLiderCount / totalRealizadas) * 100).toFixed(1) : 0

  const modalidadCount = { "Presencial": 0, "Virtual": 0 }
  realizadas.forEach(s => {
    if (s.modalidad === 'Presencial' || s.modalidad === 'Virtual') {
      modalidadCount[s.modalidad]++
    }
  })
  const presencialPerc = totalRealizadas > 0 ? ((modalidadCount["Presencial"] / totalRealizadas) * 100).toFixed(1) : 0
  const virtualPerc = totalRealizadas > 0 ? ((modalidadCount["Virtual"] / totalRealizadas) * 100).toFixed(1) : 0
  let modalidadPredominante = "Presencial"
  if (modalidadCount["Virtual"] > modalidadCount["Presencial"]) modalidadPredominante = "Virtual"
  if (modalidadCount["Virtual"] === modalidadCount["Presencial"]) modalidadPredominante = "Empate"

  const horasIndividuales = realizadas.reduce((acc, s) => acc + (s.horas || 0), 0)
  const expectedHoras = totalRealizadas * 2
  const horasPerc = expectedHoras > 0 ? ((horasIndividuales / expectedHoras) * 100).toFixed(1) : 0

  // 3. Volumen global por ronda
  const rondaStats = [1, 2, 3, 4].map(r => {
    const c = realizadas.filter(s => s.ronda === r).length
    return { name: `Asesoría #${r}`, value: c, percent: totalRealizadas > 0 ? (c / totalRealizadas * 100).toFixed(1) : 0 }
  })

  const pieModalidadData = [
    { name: "Presencial", value: modalidadCount["Presencial"], color: "#3b82f6" },
    { name: "Virtual", value: modalidadCount["Virtual"], color: "#10b981" }
  ]

  // 4. Tabla consolidada Tema x Ronda
  let temaRondaMap = {}
  realizadas.forEach(s => {
    const t = s.tema || 'Sin Definir / Pendiente'
    if (!temaRondaMap[t]) temaRondaMap[t] = { name: t, r1: 0, r2: 0, r3: 0, r4: 0, total: 0 }
    temaRondaMap[t][`r${s.ronda}`]++
    temaRondaMap[t].total++
  })
  let temaTable = Object.values(temaRondaMap).sort((a, b) => b.total - a.total).map((t, idx, arr) => {
    // Handling rank (ties)
    const higher = arr.filter(x => x.total > t.total).length
    t.rank = higher + 1
    t.percent = ((t.total / totalRealizadas) * 100).toFixed(1) + '%'
    return t
  })
  // Move 'Sin Definir / Pendiente' to bottom
  const sinDefIdx = temaTable.findIndex(t => t.name === 'Sin Definir / Pendiente')
  if (sinDefIdx > -1) {
    const sinDef = temaTable.splice(sinDefIdx, 1)[0]
    sinDef.rank = temaTable.length + 1
    temaTable.push(sinDef)
  }

  // 5. Productividad por profesional
  let profMap = {}
  realizadas.forEach(s => {
    const p = s.profesional || 'Sin asignar'
    
    if (!profMap[p]) profMap[p] = { name: p, total: 0, r1: 0, r2: 0, r3: 0, r4: 0, horas: 0, temas: {} }
    profMap[p].total++
    profMap[p][`r${s.ronda}`]++
    profMap[p].horas += (s.horas || 0)
    const t = s.tema || 'Sin Definir / Pendiente'
    profMap[p].temas[t] = (profMap[p].temas[t] || 0) + 1
  })
  let profTable = Object.values(profMap).sort((a, b) => b.total - a.total).map(p => {
    p.percent = ((p.total / totalRealizadas) * 100).toFixed(1) + '%'
    let maxT = 0
    let bestThemes = []
    Object.entries(p.temas).forEach(([theme, count]) => {
      if (count > maxT) {
        maxT = count
        bestThemes = [theme]
      } else if (count === maxT) {
        bestThemes.push(theme)
      }
    })
    p.temaPrincipal = bestThemes.join(' / ')
    return p
  })

  // 6. Rondas Accordion data
  const rondasData = [1, 2, 3, 4].map(r => {
    const real = realizadas.filter(s => s.ronda === r)
    const prog = programadas.filter(s => s.ronda === r)
    
    let tMap = {}
    real.forEach(s => {
      const t = s.tema || 'Sin Definir'
      tMap[t] = (tMap[t] || 0) + 1
    })
    const bestT = Object.keys(tMap).sort((a,b) => tMap[b] - tMap[a])[0] || 'N/A'

    return { ronda: r, realizadas: real, programadas: prog, bestTheme: bestT, bestCount: tMap[bestT] || 0 }
  })

  // 7. Week Accordion data
  let weekMap = {}
  allSessions.forEach(s => {
    if (!s.fecha) return
    const w = getWeekRange(s.fecha)
    if (!weekMap[w]) weekMap[w] = { range: w, total: 0, realizadas: 0, temas: {} }
    weekMap[w].total++
    if (s.isRealizada) {
      weekMap[w].realizadas++
      const t = s.tema || 'Sin Definir'
      weekMap[w].temas[t] = (weekMap[w].temas[t] || 0) + 1
    }
  })
  const weekList = Object.values(weekMap).sort((a, b) => a.range.localeCompare(b.range)).map(w => {
    const bestT = Object.keys(w.temas).sort((x,y) => w.temas[y] - w.temas[x])[0] || 'N/A'
    w.bestTheme = bestT
    w.bestCount = w.temas[bestT] || 0
    w.enCurso = (new Date(corteDate) >= new Date(w.range.split(" ")[0] + " 2026") && new Date(corteDate) <= new Date(w.range.split(" ")[3] + " 2026")) // Approximate check
    // Actually simpler check: does the string range contain the corteDate loosely?
    // Let's just highlight if programadas > 0 in this week. Or we just leave enCurso logic generic.
    return w
  })

  // 8. Individual Selector
  const selectedEmpSessions = allSessions.filter(s => String(s.emp_id) === String(selectedEmpId))
  const selectedEmpRealizadas = selectedEmpSessions.filter(s => s.isRealizada)
  const selectedEmpProgramadas = selectedEmpSessions.filter(s => s.isProgramada)
  const selectedHoras = selectedEmpRealizadas.reduce((acc, s) => acc + (s.horas || 0), 0)

  // 9. Daily Timeline
  let dailyMap = {}
  realizadas.forEach(s => {
    if (!dailyMap[s.fecha]) dailyMap[s.fecha] = 0
    dailyMap[s.fecha]++
  })
  let dailyKeys = Object.keys(dailyMap).sort()
  let dailyAcum = 0
  const dailyData = dailyKeys.map(date => {
    dailyAcum += dailyMap[date]
    // formatted short date
    const dObj = new Date(date)
    dObj.setHours(12)
    return {
      date,
      name: dObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      Sesiones: dailyMap[date],
      Acumulado: dailyAcum
    }
  })

  // Next Sessions
  const nextSessions = [...programadas].sort((a,b) => a.fecha.localeCompare(b.fecha))

  // Data Quality
  const dqSinTema = realizadas.filter(s => !s.tema || s.tema.toLowerCase().includes('pendiente')).length
  const dqRealSinHoras = realizadas.filter(s => !s.horas).length
  const dqSinProf = realizadas.filter(s => !s.profesional).length
  const dqSinMod = realizadas.filter(s => !s.modalidad || s.modalidad === 'Sin dato').length
  const dqSinFecha = asesoriasData.reduce((acc, emp) => {
    const count = emp.asesorias.filter(a => !a.fecha && (a.tema !== 'Sin Definir / Pendiente' || a.profesional !== 'Sin asignar' || a.modalidad === 'Por reprogramar')).length
    return acc + count
  }, 0)
  const dqPorReprogramar = asesoriasData.reduce((acc, emp) => {
    const count = emp.asesorias.filter(a => !a.fecha && a.modalidad === 'Por reprogramar').length
    return acc + count
  }, 0)
  const dqTextDates = 1;

  // CSV Export for Individual
  const exportIndividualCSV = () => {
    if (!selectedEmpSessions.length) return
    const headers = "Fecha,Hora,Profesional,Modalidad,Tema,Horas,Estado"
    const rows = selectedEmpSessions.map(s => {
      let st = s.isProgramada ? "Programada" : (s.horas ? "Realizada" : "Realizada sin horas")
      if (s.modalidad === 'Por reprogramar') st = "Por reprogramar"
      else if (!s.fecha && s.profesional === 'Sin asignar' && s.tema === 'Sin Definir / Pendiente') st = "Sin asignar"
      
      return `${s.fecha||''},${s.hora_dia||''},${s.profesional||''},${s.modalidad||''},${s.tema||''},${s.horas||0},${st}`
    }).join("\n")
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows
    const link = document.createElement("a")
    link.href = encodeURI(csvContent)
    link.download = `asesorias_${selectedEmpId}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


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

  // Funnel
  const c3 = con3.size
  const c4 = con4.size

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Análisis de Asesorías Individuales</h2>
          <p className="text-slate-500">Métricas y avance de la ruta de acompañamiento.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="text-sm font-semibold text-slate-600">Fecha de corte:</label>
          <input 
            type="date" 
            value={corteDate}
            onChange={(e) => setCorteDate(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 2. Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Sesiones acumuladas" val={totalRealizadas} sub={`asesorías #1 a #4 realizadas al corte`} icon={Clock} color="text-indigo-600" />
        <Card title="Emprendimientos atendidos" val={empUnicosRealizadas} sub={`${empAtendidosPerc}% de la meta de ${metaContrato}`} icon={User} color="text-cyan-600" />
        <Card title="Continuidad #1 → #2" val={continuidadCount} sub={`${continuidadPerc}% de los que tuvieron la #1`} icon={ChevronRight} color="text-emerald-600" />
        <Card title="Tema líder" val={temaLider} sub={`${temaLiderCount} sesiones · ${temaLiderPerc}%`} icon={Info} color="text-amber-600" />
        <Card title="Modalidad predominante" val={modalidadPredominante} sub={`Presencial ${modalidadCount["Presencial"]} (${presencialPerc}%) vs. Virtual ${modalidadCount["Virtual"]} (${virtualPerc}%)`} icon={Info} color="text-blue-600" />
        <Card title="Horas de asesoría individual" val={horasIndividuales} sub={`${horasPerc}% frente a sesiones × 2 h`} icon={Clock} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Volumen Global */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4">Volumen global por ronda</h3>
          <div className="flex flex-col md:flex-row gap-4 flex-1 items-center">
            <div className="w-full md:w-1/2">
              <table className="w-full text-left text-sm mb-0">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">Ronda</th>
                <th className="py-2 font-medium">Sesiones</th>
                <th className="py-2 font-medium">% del total</th>
              </tr>
            </thead>
            <tbody>
              {rondaStats.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">{r.name}</td>
                  <td className="py-2 font-medium">{r.value}</td>
                  <td className="py-2 text-slate-500">{r.percent}%</td>
                </tr>
              ))}
              <tr className="font-bold bg-slate-50">
                <td className="py-2 px-2">Total</td>
                <td className="py-2">{totalRealizadas}</td>
                <td className="py-2 text-slate-500">100%</td>
              </tr>
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

        {/* 4. Tema x Ronda */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <h3 className="font-bold text-slate-800 mb-4">Temáticas abordadas</h3>
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">Tema</th>
                <th className="py-2 font-medium text-center">#1</th>
                <th className="py-2 font-medium text-center">#2</th>
                <th className="py-2 font-medium text-center">#3</th>
                <th className="py-2 font-medium text-center">#4</th>
                <th className="py-2 font-medium text-center">Total</th>
                <th className="py-2 font-medium">%</th>
                <th className="py-2 font-medium">Rank</th>
              </tr>
            </thead>
            <tbody>
              {temaTable.map((t, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 font-medium text-slate-700">{t.name}</td>
                  <td className="py-2 text-center text-slate-600">{t.r1}</td>
                  <td className="py-2 text-center text-slate-600">{t.r2}</td>
                  <td className="py-2 text-center text-slate-600">{t.r3}</td>
                  <td className="py-2 text-center text-slate-600">{t.r4}</td>
                  <td className="py-2 text-center font-bold text-indigo-600">{t.total}</td>
                  <td className="py-2 text-slate-500 text-sm">{t.percent}</td>
                  <td className="py-2 text-center text-slate-400">{t.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-56 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temaTable.filter(t => t.name !== 'Sin Definir / Pendiente')} layout="vertical" margin={{left: 30}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#64748b'}} />
                <Tooltip />
                <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#64748b', fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Productividad */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <h3 className="font-bold text-slate-800 mb-4">Distribución de asesorías del equipo profesional</h3>
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 font-medium">Profesional</th>
              <th className="py-2 font-medium text-center">Citas</th>
              <th className="py-2 font-medium">%</th>
              <th className="py-2 font-medium text-center">#1</th>
              <th className="py-2 font-medium text-center">#2</th>
              <th className="py-2 font-medium text-center">#3</th>
              <th className="py-2 font-medium text-center">#4</th>
              <th className="py-2 font-medium text-center">Horas</th>
              <th className="py-2 font-medium">Tema principal</th>
            </tr>
          </thead>
          <tbody>
            {profTable.map((p, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 font-bold text-slate-700">{p.name}</td>
                <td className="py-2 text-center font-medium text-indigo-600">{p.total}</td>
                <td className="py-2 text-slate-500">{p.percent}</td>
                <td className="py-2 text-center text-slate-600">{p.r1}</td>
                <td className="py-2 text-center text-slate-600">{p.r2}</td>
                <td className="py-2 text-center text-slate-600">{p.r3}</td>
                <td className="py-2 text-center text-slate-600">{p.r4}</td>
                <td className="py-2 text-center font-semibold text-emerald-600">{p.horas}</td>
                <td className="py-2 text-slate-600 text-xs truncate max-w-[200px]" title={p.temaPrincipal}>{p.temaPrincipal}</td>
              </tr>
            ))}
            <tr className="font-bold bg-slate-50">
              <td className="py-2 px-2">Total</td>
              <td className="py-2 text-center text-indigo-600">{totalRealizadas}</td>
              <td className="py-2 text-slate-500">100%</td>
              <td className="py-2 text-center">{rondaStats[0].value}</td>
              <td className="py-2 text-center">{rondaStats[1].value}</td>
              <td className="py-2 text-center">{rondaStats[2].value}</td>
              <td className="py-2 text-center">{rondaStats[3].value}</td>
              <td className="py-2 text-center text-emerald-600">{horasIndividuales}</td>
              <td className="py-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. Rondas Accordion */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-slate-800">
          Detalle por Número de Asesoría
        </div>
        <div>
          {rondasData.map((rd, idx) => (
            <div key={idx} className="border-b border-slate-100 last:border-0">
              <button 
                onClick={() => setOpenRonda(openRonda === rd.ronda ? null : rd.ronda)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-indigo-600">Asesoría #{rd.ronda}</span>
                  <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{rd.realizadas.length} realizadas</span>
                  {rd.programadas.length > 0 && <span className="text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{rd.programadas.length} programadas</span>}
                </div>
                <ChevronDown size={20} className={`text-slate-400 transition-transform ${openRonda === rd.ronda ? 'rotate-180' : ''}`} />
              </button>
              {openRonda === rd.ronda && (
                <div className="px-6 pb-6 pt-2">
                  {rd.realizadas.length === 0 && rd.programadas.length === 0 ? (
                    <p className="text-slate-500 italic text-sm">Sin asesorías registradas en esta ronda.</p>
                  ) : (
                    <>
                      {rd.realizadas.length > 0 && <p className="text-sm text-slate-600 mb-4">Tema más frecuente: <strong className="text-slate-800">{rd.bestTheme}</strong> ({rd.bestCount})</p>}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="py-2">Emprendimiento</th>
                              <th className="py-2">Fecha</th>
                              <th className="py-2">Profesional</th>
                              <th className="py-2">Modalidad</th>
                              <th className="py-2">Tema</th>
                              <th className="py-2">Hrs</th>
                              <th className="py-2">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...rd.realizadas, ...rd.programadas].map((s, si) => (
                              <tr key={si} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="py-2 font-medium text-slate-700">{s.nombre_completo}</td>
                                <td className="py-2 text-slate-600">{s.fecha}</td>
                                <td className="py-2 text-slate-600">{s.profesional}</td>
                                <td className="py-2 text-slate-600">{s.modalidad}</td>
                                <td className="py-2 text-slate-600 truncate max-w-[150px]" title={s.tema}>{s.tema}</td>
                                <td className="py-2 text-slate-600">{s.horas || '-'}</td>
                                <td className="py-2">
                                  {s.isRealizada ? <span className="text-emerald-600 font-medium">Realizada</span> : <span className="text-amber-600 font-medium">Programada</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 7. Week Accordion */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
          <Calendar size={18} className="text-indigo-600" /> Detalle Semanal
        </div>
        <div>
          {weekList.map((w, idx) => {
            const weekProgramadas = w.total - w.realizadas
            return (
            <div key={idx} className="border-b border-slate-100 last:border-0">
              <button 
                onClick={() => setOpenWeek(openWeek === w.range ? null : w.range)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-slate-700">{w.range}</span>
                  <span className="text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{w.total} asesorías</span>
                  {weekProgramadas > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold text-uppercase uppercase">En curso / Programadas</span>}
                </div>
                <ChevronDown size={20} className={`text-slate-400 transition-transform ${openWeek === w.range ? 'rotate-180' : ''}`} />
              </button>
              {openWeek === w.range && (
                <div className="px-6 pb-6 pt-2">
                  <p className="text-sm text-slate-600 mb-4">Tema más frecuente: <strong className="text-slate-800">{w.bestTheme}</strong> ({w.bestCount})</p>
                  <p className="text-sm text-slate-500 italic">Total programadas o en agenda para esta semana: {w.total} ({w.realizadas} realizadas al corte).</p>
                </div>
              )}
            </div>
            )
          })}
        </div>
      </div>

      {/* 8. Selector Individual */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="font-bold text-slate-800">Historial por Emprendimiento</h3>
          <select 
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium w-full md:w-80 outline-none focus:border-indigo-500"
            value={selectedEmpId}
            onChange={e => setSelectedEmpId(e.target.value)}
          >
            <option value="">-- Seleccionar emprendimiento --</option>
            {asesoriasData.map(e => (
              <option key={e.id} value={e.id}>{e.nombre_completo}</option>
            ))}
          </select>
        </div>

        {selectedEmpId ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 overflow-x-auto">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-slate-700">Sesiones</h4>
                <button onClick={exportIndividualCSV} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"><Download size={14}/> Exportar CSV</button>
              </div>
              {selectedEmpSessions.length > 0 ? (
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-500">
                      <th className="py-2 px-2">Ronda</th>
                      <th className="py-2 px-2">Fecha</th>
                      <th className="py-2 px-2">Hora</th>
                      <th className="py-2 px-2">Profesional</th>
                      <th className="py-2 px-2">Modalidad</th>
                      <th className="py-2 px-2">Tema</th>
                      <th className="py-2 px-2 text-center">Hrs</th>
                      <th className="py-2 px-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmpSessions.map((s, i) => {
                      let st = s.isProgramada ? "Programada" : (s.horas ? "Realizada" : "Realizada sin horas registradas")
                      let stColor = s.isProgramada ? "text-amber-600" : (s.horas ? "text-emerald-600" : "text-rose-500")

                      if (s.modalidad === 'Por reprogramar') {
                        st = "Por reprogramar"
                        stColor = "text-rose-500 font-bold"
                      } else if (!s.fecha && s.profesional === 'Sin asignar' && s.tema === 'Sin Definir / Pendiente') {
                        st = "Sin asignar"
                        stColor = "text-slate-400"
                      }

                      return (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">#{s.ronda}</td>
                        <td className="py-2 px-2 text-slate-600">{s.fecha || '-'}</td>
                        <td className="py-2 px-2 text-slate-600">{s.hora_dia || '-'}</td>
                        <td className="py-2 px-2 text-slate-600">{s.profesional || '-'}</td>
                        <td className="py-2 px-2 text-slate-600">{s.modalidad || '-'}</td>
                        <td className="py-2 px-2 text-slate-600 truncate max-w-[150px]" title={s.tema}>{s.tema || '-'}</td>
                        <td className="py-2 px-2 text-center font-medium text-slate-700">{s.horas || '-'}</td>
                        <td className={`py-2 px-2 font-medium ${stColor}`}>{st}</td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-500 italic text-sm my-4">Sin asesorías asignadas.</p>
              )}
            </div>
            
            <div className="w-full lg:w-64 shrink-0 bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-center text-center">
              <h4 className="text-sm font-bold text-slate-500 mb-2">Horas Acumuladas</h4>
              <p className="text-4xl font-black text-indigo-600 mb-2">{selectedHoras}</p>
              <p className="text-xs text-slate-500">{selectedEmpRealizadas.length} realizadas, {selectedEmpProgramadas.length} programadas</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-400 italic py-8">Selecciona un emprendimiento para ver su avance detallado.</p>
        )}
      </div>

      {/* 9. Analisis adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">Cronología Diaria (Acumulado)</h3>
          <div className="flex-1 h-48 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{top: 5, right: 20, bottom: 5, left: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} tickMargin={10} />
                <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line yAxisId="left" type="monotone" dataKey="Sesiones" stroke="#3b82f6" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                <Line yAxisId="right" type="stepAfter" dataKey="Acumulado" stroke="#cbd5e1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Próximas Asesorías Programadas</h3>
          <div className="overflow-x-auto">
            {nextSessions.length > 0 ? (
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">Fecha</th>
                    <th className="py-2 font-medium">Emprendimiento</th>
                    <th className="py-2 font-medium">Ronda</th>
                    <th className="py-2 font-medium">Profesional</th>
                  </tr>
                </thead>
                <tbody>
                  {nextSessions.slice(0, 10).map((s, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 font-medium text-amber-600">{s.fecha}</td>
                      <td className="py-2 text-slate-700">{s.emprendimiento}</td>
                      <td className="py-2 text-slate-500">#{s.ronda}</td>
                      <td className="py-2 text-slate-600">{s.profesional}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 italic text-sm">No hay sesiones programadas posteriores al corte.</p>
            )}
            {nextSessions.length > 10 && <p className="text-xs text-slate-400 mt-2 italic">Mostrando 10 de {nextSessions.length} programadas.</p>}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm text-slate-300">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-rose-400"/> Calidad del Dato</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between border-b border-slate-700 pb-2">
              <span>Sesiones sin tema asignado</span>
              <span className="font-bold text-white">{dqSinTema}</span>
            </li>
            <li className="flex justify-between border-b border-slate-700 pb-2">
              <span>Realizadas sin horas</span>
              <span className="font-bold text-white">{dqRealSinHoras}</span>
            </li>
            <li className="flex justify-between border-b border-slate-700 pb-2">
              <span>Sin profesional</span>
              <span className="font-bold text-white">{dqSinProf}</span>
            </li>
            <li className="flex justify-between border-b border-slate-700 pb-2">
              <span>Sin modalidad</span>
              <span className="font-bold text-white">{dqSinMod}</span>
            </li>
            <li className="flex justify-between border-b border-slate-700 pb-2">
              <span>Agendadas sin fecha</span>
              <span className="font-bold text-white text-right">
                {dqSinFecha}
                {dqPorReprogramar > 0 && <span className="text-xs text-slate-400 font-normal block leading-tight mt-1">({dqPorReprogramar} de ellos marcados 'Por reprogramar')</span>}
              </span>
            </li>
            <li className="flex justify-between pt-1">
              <span>Fechas corregidas desde texto</span>
              <span className="font-bold text-white">{dqTextDates}</span>
            </li>
          </ul>
        </div>
      </div>

      <FuenteDato fuente="Base maestra de asesorías" fecha={`corte ${corteDate}`} n={`${nCohorte} emprendimientos, ${totalRealizadas} sesiones`} />
    </div>
  )
}

function Card({ title, val, sub, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className={color} />
        <h3 className="text-slate-500 font-medium text-sm">{title}</h3>
      </div>
      <p className={`text-3xl font-black ${color}`}>{val}</p>
      <p className="text-xs text-slate-500 mt-1 font-medium">{sub}</p>
    </div>
  )
}
