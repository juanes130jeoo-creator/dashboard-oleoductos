import { useState, useMemo } from 'react'
import { 
  Info, Download, ChevronDown, ChevronRight, Calendar, User, Clock, 
  AlertCircle, CheckCircle2, XCircle, Search, Filter, Check, X, ArrowRight
} from 'lucide-react'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend, Label, ReferenceLine 
} from 'recharts'
import profMapping from '../config/profesionales-mapping.json'
import asesoriasData from '../data/control_gestion_asesorias.json'
import FuenteDato from './shared/FuenteDato'

// Constante principal de fecha de corte
const FECHA_CORTE_DEFAULT = "2026-10-13"

// Función auxiliar para agrupar semanas
const getWeekRange = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(12, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  const sunday = new Date(d.setDate(diff + 6))
  const options = { month: 'short', day: 'numeric' }
  return `${monday.toLocaleDateString('es-ES', options)} al ${sunday.toLocaleDateString('es-ES', options)}`
}

export default function ControlGestionEmprendedores() {
  const [corteDate, setCorteDate] = useState(FECHA_CORTE_DEFAULT)
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [openRonda, setOpenRonda] = useState(1)
  const [openWeek, setOpenWeek] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRuta, setFilterRuta] = useState('todos')

  const nCohorte = 37
  const metaContrato = 30
  const metaHorasContrato = 240

  // Obfuscación de nombres de profesionales para mantener privacidad
  const profMapObj = { ...profMapping }
  let nextId = Object.keys(profMapObj).length + 1
  const getMappedName = (name) => {
    if (!name || name === 'Sin asignar' || name === 'Sin definir') return 'Sin asignar'
    if (!profMapObj[name]) {
      profMapObj[name] = `Asesor(a) ${nextId++}`
    }
    return profMapObj[name]
  }

  // --- PROCESAMIENTO DE SESIONES DINÁMICO SEGÚN FECHA DE CORTE ---
  const allSessions = useMemo(() => {
    let list = []
    asesoriasData.forEach(emp => {
      emp.asesorias.forEach(a => {
        const isRealizada = Boolean(a.fecha && a.fecha <= corteDate)
        const isProgramada = Boolean(a.fecha && a.fecha > corteDate)
        const isSinFecha = !a.fecha
        list.push({
          ...a,
          emp_id: emp.id,
          emprendimiento: emp.emprendimiento,
          emprendedor: emp.emprendedor,
          nombre_completo: emp.nombre_completo,
          profesional: getMappedName(a.profesional),
          isRealizada,
          isProgramada,
          isSinFecha
        })
      })
    })
    list.sort((a, b) => {
      if (!a.fecha) return 1
      if (!b.fecha) return -1
      return a.fecha.localeCompare(b.fecha)
    })
    return list
  }, [corteDate])

  const realizadas = useMemo(() => allSessions.filter(s => s.isRealizada), [allSessions])
  const programadas = useMemo(() => allSessions.filter(s => s.isProgramada), [allSessions])
  const totalRealizadas = realizadas.length

  // Métricas por Asesoría (1 a 4)
  const empConR1 = useMemo(() => new Set(realizadas.filter(s => s.ronda === 1).map(s => s.emp_id)), [realizadas])
  const empConR2 = useMemo(() => new Set(realizadas.filter(s => s.ronda === 2).map(s => s.emp_id)), [realizadas])
  const empConR3 = useMemo(() => new Set(realizadas.filter(s => s.ronda === 3).map(s => s.emp_id)), [realizadas])
  const empConR4 = useMemo(() => new Set(realizadas.filter(s => s.ronda === 4).map(s => s.emp_id)), [realizadas])

  const c1 = empConR1.size
  const c2 = empConR2.size
  const c3 = empConR3.size
  const c4 = empConR4.size

  // Porcentajes frente a meta de 30 (Regla 6: nunca mayor a 100%)
  const p1 = Math.min((c1 / metaContrato) * 100, 100).toFixed(1)
  const p2 = Math.min((c2 / metaContrato) * 100, 100).toFixed(1)
  const p3 = Math.min((c3 / metaContrato) * 100, 100).toFixed(1)
  const p4 = Math.min((c4 / metaContrato) * 100, 100).toFixed(1)

  // Continuidad #1 -> #2
  let continuidadCount = 0
  for (let id of empConR1) {
    if (empConR2.has(id)) continuidadCount++
  }
  const continuidadPerc = c1 > 0 ? ((continuidadCount / c1) * 100).toFixed(1) : "0.0"

  // Horas acumuladas individuales
  const horasAcumuladas = useMemo(() => {
    return realizadas.reduce((acc, s) => acc + (s.horas || 0), 0)
  }, [realizadas])
  const horasPerc = ((horasAcumuladas / metaHorasContrato) * 100).toFixed(1)

  // Modalidad (Virtual vs Presencial)
  const modalidadCount = useMemo(() => {
    const counts = { "Virtual": 0, "Presencial": 0 }
    realizadas.forEach(s => {
      if (s.modalidad === 'Virtual' || s.modalidad === 'Presencial') {
        counts[s.modalidad]++
      }
    })
    return counts
  }, [realizadas])

  const presencialPerc = totalRealizadas > 0 ? ((modalidadCount["Presencial"] / totalRealizadas) * 100).toFixed(1) : "0.0"
  const virtualPerc = totalRealizadas > 0 ? ((modalidadCount["Virtual"] / totalRealizadas) * 100).toFixed(1) : "0.0"

  const pieModalidadData = [
    { name: "Virtual", value: modalidadCount["Virtual"], color: "#10b981" },
    { name: "Presencial", value: modalidadCount["Presencial"], color: "#3b82f6" }
  ]

  // Estado de la ruta por emprendedor (37 emprendimientos)
  const seguimientoEmprendedores = useMemo(() => {
    return asesoriasData.map((emp, index) => {
      const eSessions = allSessions.filter(s => s.emp_id === emp.id)
      const hasR1 = eSessions.some(s => s.ronda === 1 && s.isRealizada)
      const hasR2 = eSessions.some(s => s.ronda === 2 && s.isRealizada)
      const hasR3 = eSessions.some(s => s.ronda === 3 && s.isRealizada)
      const hasR4 = eSessions.some(s => s.ronda === 4 && s.isRealizada)
      
      const realCount = (hasR1 ? 1 : 0) + (hasR2 ? 1 : 0) + (hasR3 ? 1 : 0) + (hasR4 ? 1 : 0)
      let estadoRuta = "Sin asesorías"
      let estadoColor = "bg-slate-100 text-slate-700 border-slate-300"
      if (realCount === 4) {
        estadoRuta = "Ruta completa (4/4)"
        estadoColor = "bg-emerald-100 text-emerald-800 border-emerald-300"
      } else if (realCount === 3) {
        estadoRuta = "3 de 4"
        estadoColor = "bg-cyan-100 text-cyan-800 border-cyan-300"
      } else if (realCount === 2) {
        estadoRuta = "2 de 4"
        estadoColor = "bg-indigo-100 text-indigo-800 border-indigo-300"
      } else if (realCount === 1) {
        estadoRuta = "1 de 4"
        estadoColor = "bg-amber-100 text-amber-800 border-amber-300"
      }

      const hrs = eSessions.filter(s => s.isRealizada).reduce((acc, s) => acc + (s.horas || 0), 0)

      return {
        num: index + 1,
        id: emp.id,
        emprendimiento: emp.emprendimiento,
        emprendedor: emp.emprendedor,
        nombre_completo: emp.nombre_completo,
        hasR1,
        hasR2,
        hasR3,
        hasR4,
        realCount,
        horas: hrs,
        estadoRuta,
        estadoColor,
        sesiones: eSessions
      }
    })
  }, [allSessions])

  // Conteo de estado de ruta
  const estadoRutaCounts = useMemo(() => {
    const c = { "Ruta completa (4/4)": 0, "3 de 4": 0, "2 de 4": 0, "1 de 4": 0, "Sin asesorías": 0 }
    seguimientoEmprendedores.forEach(e => {
      c[e.estadoRuta] = (c[e.estadoRuta] || 0) + 1
    })
    return c
  }, [seguimientoEmprendedores])

  const chartEstadoRutaData = [
    { name: "Ruta completa (4/4)", cantidad: estadoRutaCounts["Ruta completa (4/4)"], color: "#10b981" },
    { name: "3 de 4", cantidad: estadoRutaCounts["3 de 4"], color: "#06b6d4" },
    { name: "2 de 4", cantidad: estadoRutaCounts["2 de 4"], color: "#6366f1" },
    { name: "1 de 4", cantidad: estadoRutaCounts["1 de 4"], color: "#f59e0b" },
    { name: "Sin asesorías", cantidad: estadoRutaCounts["Sin asesorías"], color: "#94a3b8" }
  ]

  // Gráfico de avance por asesoría vs meta 30
  const chartAvanceMeta = [
    { name: "Asesoría 1", atendidos: c1, meta: metaContrato, porcentaje: p1 },
    { name: "Asesoría 2", atendidos: c2, meta: metaContrato, porcentaje: p2 },
    { name: "Asesoría 3", atendidos: c3, meta: metaContrato, porcentaje: p3 },
    { name: "Asesoría 4", atendidos: c4, meta: metaContrato, porcentaje: p4 }
  ]

  // Temáticas abordadas (las 8 categorías oficiales de los gráficos)
  const temaTable = useMemo(() => {
    const map = {}
    realizadas.forEach(s => {
      const t = s.tema_grafico || 'Sin dato'
      if (!map[t]) map[t] = { name: t, r1: 0, r2: 0, r3: 0, r4: 0, total: 0 }
      map[t][`r${s.ronda}`]++
      map[t].total++
    })
    const list = Object.values(map).sort((a, b) => b.total - a.total).map((t, idx, arr) => {
      const higher = arr.filter(x => x.total > t.total).length
      t.rank = higher + 1
      t.percent = totalRealizadas > 0 ? ((t.total / totalRealizadas) * 100).toFixed(1) + '%' : '0%'
      return t
    })
    return list
  }, [realizadas, totalRealizadas])

  const temaLider = temaTable.length > 0 ? temaTable[0].name : "N/A"
  const temaLiderCount = temaTable.length > 0 ? temaTable[0].total : 0
  const temaLiderPerc = totalRealizadas > 0 ? ((temaLiderCount / totalRealizadas) * 100).toFixed(1) : "0.0"

  // Distribución del equipo profesional (obfuscado Asesor 1..10)
  const profTable = useMemo(() => {
    const map = {}
    realizadas.forEach(s => {
      const p = s.profesional || 'Sin asignar'
      if (!map[p]) map[p] = { name: p, total: 0, r1: 0, r2: 0, r3: 0, r4: 0, horas: 0, temas: {} }
      map[p].total++
      map[p][`r${s.ronda}`]++
      map[p].horas += (s.horas || 0)
      const t = s.tema_grafico || 'Sin dato'
      map[p].temas[t] = (map[p].temas[t] || 0) + 1
    })
    return Object.values(map).sort((a, b) => b.total - a.total).map(p => {
      p.percent = totalRealizadas > 0 ? ((p.total / totalRealizadas) * 100).toFixed(1) + '%' : '0%'
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
  }, [realizadas, totalRealizadas])

  // Rondas accordion data
  const rondasData = useMemo(() => {
    return [1, 2, 3, 4].map(r => {
      const real = realizadas.filter(s => s.ronda === r)
      const prog = programadas.filter(s => s.ronda === r)
      const sinFecha = allSessions.filter(s => s.ronda === r && s.isSinFecha && (s.modalidad === 'Por reprogramar' || s.horas || s.tema !== 'Sin dato'))
      
      let tMap = {}
      real.forEach(s => {
        const t = s.tema_grafico || 'Sin dato'
        tMap[t] = (tMap[t] || 0) + 1
      })
      const bestT = Object.keys(tMap).sort((a,b) => tMap[b] - tMap[a])[0] || 'N/A'

      return {
        ronda: r,
        realizadas: real,
        programadas: prog,
        sinFecha: sinFecha,
        total: real.length,
        bestTheme: bestT,
        bestCount: tMap[bestT] || 0
      }
    })
  }, [realizadas, programadas, allSessions])

  // Cronología diaria
  const dailyData = useMemo(() => {
    let map = {}
    realizadas.forEach(s => {
      if (!map[s.fecha]) map[s.fecha] = 0
      map[s.fecha]++
    })
    let keys = Object.keys(map).sort()
    let acum = 0
    return keys.map(date => {
      acum += map[date]
      const dObj = new Date(date)
      dObj.setHours(12)
      return {
        date,
        name: dObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        Sesiones: map[date],
        Acumulado: acum
      }
    })
  }, [realizadas])

  // Detalle semanal
  const weekList = useMemo(() => {
    let weekMap = {}
    allSessions.forEach(s => {
      if (!s.fecha) return
      const w = getWeekRange(s.fecha)
      if (!weekMap[w]) weekMap[w] = { range: w, total: 0, realizadas: 0, programadas: 0, temas: {} }
      weekMap[w].total++
      if (s.isRealizada) {
        weekMap[w].realizadas++
        const t = s.tema_grafico || 'Sin dato'
        weekMap[w].temas[t] = (weekMap[w].temas[t] || 0) + 1
      } else if (s.isProgramada) {
        weekMap[w].programadas++
      }
    })
    return Object.values(weekMap).sort((a, b) => a.range.localeCompare(b.range)).map(w => {
      const bestT = Object.keys(w.temas).sort((x,y) => w.temas[y] - w.temas[x])[0] || 'N/A'
      w.bestTheme = bestT
      w.bestCount = w.temas[bestT] || 0
      return w
    })
  }, [allSessions])

  // Pendientes de calidad del dato (12 casos sin fecha y 7 posteriores)
  const casosSinFecha = useMemo(() => {
    const list = []
    asesoriasData.forEach(emp => {
      emp.asesorias.forEach(a => {
        if (!a.fecha) {
          const hasData = (
            a.modalidad === 'Por reprogramar' || 
            (a.modalidad && a.modalidad !== 'Sin dato') || 
            (a.horas && a.horas > 0) || 
            (a.tema && a.tema !== 'Sin dato') ||
            (a.profesional && a.profesional !== 'Sin asignar')
          )
          if (hasData) {
            list.push({
              id: emp.id,
              emprendimiento: emp.emprendimiento,
              emprendedor: emp.emprendedor,
              ronda: a.ronda,
              modalidad: a.modalidad,
              tema: a.tema,
              horas: a.horas || 2.0,
              observacion: a.modalidad === 'Por reprogramar' ? 'Marcado "Por reprogramar"' : 'Datos asignados sin fecha'
            })
          }
        }
      })
    })
    return list
  }, [])

  const casosPosteriores = useMemo(() => {
    return programadas.map(s => ({
      emprendimiento: s.emprendimiento,
      emprendedor: s.emprendedor,
      ronda: s.ronda,
      fecha: s.fecha,
      modalidad: s.modalidad,
      tema: s.tema,
      horas: s.horas || 2.0,
      profesional: s.profesional
    }))
  }, [programadas])

  // Selector individual
  const selectedEmpSessions = useMemo(() => {
    if (!selectedEmpId) return []
    return allSessions.filter(s => String(s.emp_id) === String(selectedEmpId))
  }, [allSessions, selectedEmpId])

  const selectedEmpRealizadas = selectedEmpSessions.filter(s => s.isRealizada)
  const selectedEmpProgramadas = selectedEmpSessions.filter(s => s.isProgramada)
  const selectedHoras = selectedEmpRealizadas.reduce((acc, s) => acc + (s.horas || 0), 0)

  // Exportar CSV de seguimiento general
  const exportSeguimientoCSV = () => {
    const headers = "Nº,Emprendimiento,Emprendedor,Asesoría 1,Asesoría 2,Asesoría 3,Asesoría 4,Horas Acumuladas,Estado de la Ruta"
    const rows = seguimientoEmprendedores.map(e => 
      `"${e.num}","${e.emprendimiento.replace(/"/g, '""')}","${e.emprendedor.replace(/"/g, '""')}","${e.hasR1 ? 'SÍ' : 'NO'}","${e.hasR2 ? 'SÍ' : 'NO'}","${e.hasR3 ? 'SÍ' : 'NO'}","${e.hasR4 ? 'SÍ' : 'NO'}","${e.horas}","${e.estadoRuta}"`
    ).join("\n")
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows
    const link = document.createElement("a")
    link.href = encodeURI(csvContent)
    link.download = `seguimiento_asesorias_corte_${corteDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exportar CSV individual
  const exportIndividualCSV = () => {
    if (!selectedEmpSessions.length) return
    const headers = "Ronda,Fecha,Hora,Modalidad,Tema,Horas,Estado"
    const rows = selectedEmpSessions.map(s => {
      let st = s.isRealizada ? "Realizada" : (s.isProgramada ? "Programada" : (s.modalidad === 'Por reprogramar' ? "Por reprogramar" : "Sin fecha"))
      return `"${s.ronda}","${s.fecha || ''}","${s.hora_dia || ''}","${s.modalidad || ''}","${(s.tema || '').replace(/"/g, '""')}","${s.horas || 0}","${st}"`
    }).join("\n")
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows
    const link = document.createElement("a")
    link.href = encodeURI(csvContent)
    link.download = `asesorias_individual_${selectedEmpId}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtrado de la tabla de seguimiento
  const filteredSeguimiento = useMemo(() => {
    return seguimientoEmprendedores.filter(item => {
      const matchSearch = 
        item.emprendimiento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.emprendedor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchRuta = 
        filterRuta === 'todos' ||
        (filterRuta === '4/4' && item.estadoRuta === 'Ruta completa (4/4)') ||
        (filterRuta === '3/4' && item.estadoRuta === '3 de 4') ||
        (filterRuta === '2/4' && item.estadoRuta === '2 de 4') ||
        (filterRuta === '1/4' && item.estadoRuta === '1 de 4') ||
        (filterRuta === 'sin' && item.estadoRuta === 'Sin asesorías')

      return matchSearch && matchRuta
    })
  }, [seguimientoEmprendedores, searchTerm, filterRuta])

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Header con corte */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Seguimiento y Control de Gestión de Asesorías</h2>
          <p className="text-slate-500 font-medium mt-1">
            Información con corte al 13 de octubre de 2026
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Parámetro de fecha de corte:</label>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={corteDate}
              onChange={(e) => setCorteDate(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-1 text-sm text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            />
            {corteDate !== FECHA_CORTE_DEFAULT && (
              <button 
                onClick={() => setCorteDate(FECHA_CORTE_DEFAULT)}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Restablecer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tarjetas KPI Principales */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-lg">Métricas Clave de la Ruta</h3>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full border border-indigo-200">
            Meta del Contrato: {metaContrato} emprendimientos (240 horas)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card 
            title="Asesoría 1" 
            val={`${c1} de ${metaContrato}`} 
            sub={`${p1}% de la meta`} 
            icon={CheckCircle2} 
            color="text-indigo-600"
            badge={`${p1}%`}
          />
          <Card 
            title="Asesoría 2" 
            val={`${c2} de ${metaContrato}`} 
            sub={`${p2}% de la meta`} 
            icon={CheckCircle2} 
            color="text-indigo-600"
            badge={`${p2}%`}
          />
          <Card 
            title="Asesoría 3" 
            val={`${c3} de ${metaContrato}`} 
            sub={`${p3}% de la meta`} 
            icon={CheckCircle2} 
            color="text-indigo-600"
            badge={`${p3}%`}
          />
          <Card 
            title="Asesoría 4" 
            val={`${c4} de ${metaContrato}`} 
            sub={`${p4}% de la meta`} 
            icon={CheckCircle2} 
            color="text-indigo-600"
            badge={`${p4}%`}
          />
          <Card 
            title="Total Realizadas" 
            val={totalRealizadas} 
            sub="asesorías ejecutadas" 
            icon={Clock} 
            color="text-emerald-600"
            badge={`${totalRealizadas} sesiones`}
          />
          <Card 
            title="Horas Acumuladas" 
            val={`${horasAcumuladas} h`} 
            sub={`${horasPerc}% de 240 h`} 
            icon={Clock} 
            color="text-purple-600"
            badge={`${horasAcumuladas} h`}
          />
        </div>

        {/* Indicadores secundarios de contexto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Modalidad Predominante</p>
              <p className="text-lg font-extrabold text-slate-800 mt-0.5">Virtual (54.2%)</p>
              <p className="text-xs text-slate-500 mt-1">Virtual: {modalidadCount["Virtual"]} · Presencial: {modalidadCount["Presencial"]}</p>
            </div>
            <span className="text-2xl font-black text-emerald-600 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
              {modalidadCount["Virtual"]}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Tema Más Solicitado</p>
              <p className="text-lg font-extrabold text-slate-800 mt-0.5">{temaLider}</p>
              <p className="text-xs text-slate-500 mt-1">{temaLiderCount} sesiones ({temaLiderPerc}% del total)</p>
            </div>
            <span className="text-2xl font-black text-amber-600 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
              {temaLiderCount}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Continuidad #1 → #2</p>
              <p className="text-lg font-extrabold text-slate-800 mt-0.5">{continuidadCount} emprendimientos</p>
              <p className="text-xs text-slate-500 mt-1">{continuidadPerc}% de quienes completaron la #1</p>
            </div>
            <span className="text-2xl font-black text-indigo-600 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
              {continuidadPerc}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Gráficos de Avance y Estado de la Ruta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avance por asesoría frente a la meta */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Avance por Asesoría frente a la Meta</h3>
              <p className="text-xs text-slate-500">Meta contractual de 30 emprendimientos por asesoría (100% límite)</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded">Meta = 30</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartAvanceMeta} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
                <YAxis domain={[0, 35]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} de 30 (${Math.min((value/30)*100, 100).toFixed(1)}%)`, 
                    'Emprendimientos'
                  ]}
                />
                <ReferenceLine y={30} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Meta (30)', position: 'insideTopRight', fill: '#f43f5e', fontSize: 11, fontWeight: 'bold' }} />
                <Bar isAnimationActive={false} dataKey="atendidos" fill="#6366f1" radius={[6, 6, 0, 0]} label={{ position: 'top', fill: '#1e293b', fontSize: 12, fontWeight: 'bold' }}>
                  {chartAvanceMeta.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : (index === 1 ? '#06b6d4' : (index === 2 ? '#6366f1' : '#8b5cf6'))} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado de la ruta por emprendedor */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Estado de la Ruta por Emprendedor</h3>
              <p className="text-xs text-slate-500">Distribución de los {nCohorte} emprendimientos según avance en la ruta</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded">N = {nCohorte}</span>
          </div>
          <div className="h-64 flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={chartEstadoRutaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="cantidad"
                  >
                    {chartEstadoRutaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <Label 
                      value={`${nCohorte}`} position="center" 
                      style={{ fontSize: '20px', fontWeight: 'bold', fill: '#1e293b' }}
                    />
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} emprendimientos (${((value/nCohorte)*100).toFixed(1)}%)`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-2 text-xs">
              {chartEstadoRutaData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </div>
                  <div className="font-bold text-slate-800">
                    {item.cantidad} <span className="text-slate-400 font-normal">({((item.cantidad/nCohorte)*100).toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Modalidad y Temáticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volumen por ronda y Modalidad */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4">Volumen Global por Ronda y Modalidad</h3>
          <div className="flex flex-col md:flex-row gap-4 flex-1 items-center">
            <div className="w-full md:w-1/2">
              <table className="w-full text-left text-sm mb-0">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">Ronda</th>
                    <th className="py-2 font-medium text-center">Sesiones</th>
                    <th className="py-2 font-medium text-right">% del total</th>
                  </tr>
                </thead>
                <tbody>
                  {rondasData.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="py-2 font-medium text-slate-700">Asesoría #{r.ronda}</td>
                      <td className="py-2 font-bold text-center text-indigo-600">{r.total}</td>
                      <td className="py-2 text-slate-500 text-right">{totalRealizadas > 0 ? ((r.total / totalRealizadas) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-50 border-t border-slate-200">
                    <td className="py-2 px-2 text-slate-800">Total</td>
                    <td className="py-2 text-center text-emerald-600">{totalRealizadas}</td>
                    <td className="py-2 text-slate-700 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-full md:w-1/2 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} data={pieModalidadData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                    {pieModalidadData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    <Label 
                      value={`${totalRealizadas} sesiones`} position="center" 
                      style={{ fontSize: '13px', fontWeight: 'bold', fill: '#334155' }}
                    />
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} sesiones (${((value/totalRealizadas)*100).toFixed(1)}%)`, name]} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" 
                    payload={[
                      { value: `Virtual: ${modalidadCount["Virtual"]} (${virtualPerc}%)`, type: 'square', color: '#10b981' },
                      { value: `Presencial: ${modalidadCount["Presencial"]} (${presencialPerc}%)`, type: 'square', color: '#3b82f6' }
                    ]}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Temáticas abordadas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Temáticas Abordadas (8 Categorías)</h3>
            <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
              {totalRealizadas} sesiones
            </span>
          </div>
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">Categoría Temática</th>
                <th className="py-2 font-medium text-center">#1</th>
                <th className="py-2 font-medium text-center">#2</th>
                <th className="py-2 font-medium text-center">#3</th>
                <th className="py-2 font-medium text-center">#4</th>
                <th className="py-2 font-medium text-center">Total</th>
                <th className="py-2 font-medium text-right">%</th>
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
                  <td className="py-2 text-slate-500 text-right">{t.percent}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-52 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temaTable} layout="vertical" margin={{ left: 130, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip formatter={(value) => [`${value} sesiones`, 'Cantidad']} />
                <Bar isAnimationActive={false} dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#475569', fontSize: 11, fontWeight: 'bold' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Tabla de Seguimiento por Emprendedor */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Tabla de Seguimiento por Emprendedor</h3>
            <p className="text-xs text-slate-500">Matriz consolidada de los {nCohorte} emprendimientos con estado de avance en cada asesoría</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar emprendedor o negocio..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filtro de ruta */}
            <select
              value={filterRuta}
              onChange={e => setFilterRuta(e.target.value)}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todos los estados ({nCohorte})</option>
              <option value="4/4">Ruta completa 4/4 ({estadoRutaCounts["Ruta completa (4/4)"]})</option>
              <option value="3/4">3 de 4 ({estadoRutaCounts["3 de 4"]})</option>
              <option value="2/4">2 de 4 ({estadoRutaCounts["2 de 4"]})</option>
              <option value="1/4">1 de 4 ({estadoRutaCounts["1 de 4"]})</option>
              <option value="sin">Sin asesorías ({estadoRutaCounts["Sin asesorías"]})</option>
            </select>

            {/* Botón CSV */}
            <button
              onClick={exportSeguimientoCSV}
              className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg text-xs border border-indigo-200 transition-colors"
            >
              <Download size={14} /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-xs font-semibold">
                <th className="py-3 px-3 text-center">Nº</th>
                <th className="py-3 px-3">Emprendimiento</th>
                <th className="py-3 px-3">Emprendedor(a)</th>
                <th className="py-3 px-3 text-center">Asesoría #1</th>
                <th className="py-3 px-3 text-center">Asesoría #2</th>
                <th className="py-3 px-3 text-center">Asesoría #3</th>
                <th className="py-3 px-3 text-center">Asesoría #4</th>
                <th className="py-3 px-3 text-center">Horas</th>
                <th className="py-3 px-3 text-center">Estado de la Ruta</th>
              </tr>
            </thead>
            <tbody>
              {filteredSeguimiento.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/75 transition-colors">
                  <td className="py-2.5 px-3 text-center text-slate-400 font-medium text-xs">{emp.num}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{emp.emprendimiento}</td>
                  <td className="py-2.5 px-3 text-slate-600">{emp.emprendedor}</td>
                  <td className="py-2.5 px-3 text-center">
                    {emp.hasR1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">✔</span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs">✘</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {emp.hasR2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">✔</span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs">✘</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {emp.hasR3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">✔</span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs">✘</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {emp.hasR4 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">✔</span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs">✘</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-indigo-600">{emp.horas} h</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${emp.estadoColor}`}>
                      {emp.estadoRuta}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredSeguimiento.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    No se encontraron emprendimientos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Detalle por Número de Asesoría (Tablas por Asesoría 1 a 4) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800">Tablas de Detalle por Asesoría (1 a 4)</h3>
            <p className="text-xs text-slate-500">Listado de sesiones realizadas, programadas y temas correspondientes</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {rondasData.map((rd) => (
            <div key={rd.ronda} className="border-b border-slate-100 last:border-0">
              <button 
                onClick={() => setOpenRonda(openRonda === rd.ronda ? null : rd.ronda)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors text-left"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base font-bold text-indigo-700">Asesoría #{rd.ronda}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    {rd.realizadas.length} realizadas al corte
                  </span>
                  {rd.programadas.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-medium">
                      {rd.programadas.length} programadas posteriores
                    </span>
                  )}
                  {rd.sinFecha.length > 0 && (
                    <span className="text-xs bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-medium">
                      {rd.sinFecha.length} sin fecha / por reprogramar
                    </span>
                  )}
                </div>
                <ChevronDown size={20} className={`text-slate-400 transition-transform ${openRonda === rd.ronda ? 'rotate-180' : ''}`} />
              </button>

              {openRonda === rd.ronda && (
                <div className="px-6 pb-6 pt-2">
                  <div className="flex flex-wrap justify-between items-center mb-3 text-xs text-slate-600 gap-2">
                    <p>
                      Tema líder en esta asesoría: <strong className="text-slate-800 font-bold">{rd.bestTheme}</strong> ({rd.bestCount} sesiones)
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50">
                          <th className="py-2 px-3">Emprendimiento</th>
                          <th className="py-2 px-3">Emprendedor</th>
                          <th className="py-2 px-3">Fecha</th>
                          <th className="py-2 px-3">Modalidad</th>
                          <th className="py-2 px-3">Tema</th>
                          <th className="py-2 px-3 text-center">Horas</th>
                          <th className="py-2 px-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...rd.realizadas, ...rd.programadas].map((s, si) => (
                          <tr key={si} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{s.emprendimiento}</td>
                            <td className="py-2 px-3 text-slate-600">{s.emprendedor}</td>
                            <td className="py-2 px-3 text-slate-700 font-medium">{s.fecha || '-'}</td>
                            <td className="py-2 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${s.modalidad === 'Virtual' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                                {s.modalidad}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 truncate max-w-[200px]" title={s.tema}>{s.tema}</td>
                            <td className="py-2 px-3 text-center font-bold text-slate-700">{s.horas || 2.0}</td>
                            <td className="py-2 px-3 text-center">
                              {s.isRealizada ? (
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">Realizada</span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">Programada</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 7. Pendientes de Calidad de Datos (Regla 4) */}
      <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-rose-700">
          <AlertCircle size={20} className="text-rose-600" />
          <h3 className="font-bold text-lg text-slate-800">Pendientes de Calidad de Datos (Casos a Completar)</h3>
        </div>
        <p className="text-xs text-slate-600 mb-4">
          Conforme a las reglas de cálculo, estos registros no se contabilizan como asesorías realizadas en el corte oficial del 10/10/2026. 
          Se relacionan aquí para que el equipo operativo complete las fechas o gestione la reprogramación correspondiente.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 12 casos sin fecha o para reprogramar */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm text-slate-800">1. Registros Sin Fecha o "Por Reprogramar" ({casosSinFecha.length} casos)</h4>
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">Pendiente fecha</span>
            </div>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-white">
                    <th className="py-2 px-2">Emprendimiento</th>
                    <th className="py-2 px-2 text-center">Ronda</th>
                    <th className="py-2 px-2">Novedad / Anotación</th>
                    <th className="py-2 px-2">Tema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {casosSinFecha.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2">
                        <span className="font-semibold text-slate-800 block">{item.emprendimiento}</span>
                        <span className="text-slate-500 text-[11px]">{item.emprendedor}</span>
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-indigo-600">#{item.ronda}</td>
                      <td className="py-2 px-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${item.modalidad === 'Por reprogramar' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
                          {item.modalidad === 'Por reprogramar' ? 'REPROGRAMAR' : (item.horas ? `${item.horas} h sin fecha` : item.modalidad)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-600 truncate max-w-[120px]" title={item.tema}>{item.tema}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Casos posteriores al corte */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm text-slate-800">2. Asesorías con Fecha Posterior al Corte ({casosPosteriores.length} casos)</h4>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">14/10 al 19/10</span>
            </div>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-white">
                    <th className="py-2 px-2">Emprendimiento</th>
                    <th className="py-2 px-2 text-center">Ronda</th>
                    <th className="py-2 px-2">Fecha Programada</th>
                    <th className="py-2 px-2">Tema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {casosPosteriores.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2">
                        <span className="font-semibold text-slate-800 block">{item.emprendimiento}</span>
                        <span className="text-slate-500 text-[11px]">{item.emprendedor}</span>
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-amber-600">#{item.ronda}</td>
                      <td className="py-2 px-2 font-bold text-amber-700">{item.fecha}</td>
                      <td className="py-2 px-2 text-slate-600 truncate max-w-[120px]" title={item.tema}>{item.tema}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Selector Individual por Emprendimiento */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-800">Historial Individual por Emprendimiento</h3>
            <p className="text-xs text-slate-500">Seleccione cualquiera de los {nCohorte} emprendimientos para auditar sus sesiones individuales</p>
          </div>
          <select 
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium w-full md:w-96 outline-none focus:border-indigo-500"
            value={selectedEmpId}
            onChange={e => setSelectedEmpId(e.target.value)}
          >
            <option value="">-- Seleccionar emprendimiento ({nCohorte}) --</option>
            {asesoriasData.map(e => (
              <option key={e.id} value={e.id}>{e.nombre_completo}</option>
            ))}
          </select>
        </div>

        {selectedEmpId ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 overflow-x-auto">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-slate-700">Sesiones Registradas en el Archivo</h4>
                <button onClick={exportIndividualCSV} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
                  <Download size={14}/> Exportar CSV
                </button>
              </div>
              {selectedEmpSessions.length > 0 ? (
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 text-xs">
                      <th className="py-2 px-2 text-center">Ronda</th>
                      <th className="py-2 px-2">Fecha</th>
                      <th className="py-2 px-2">Hora</th>
                      <th className="py-2 px-2">Modalidad</th>
                      <th className="py-2 px-2">Tema</th>
                      <th className="py-2 px-2 text-center">Horas</th>
                      <th className="py-2 px-2 text-center">Estado al corte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmpSessions.map((s, i) => {
                      let st = s.isRealizada ? "Realizada" : (s.isProgramada ? "Programada" : (s.modalidad === 'Por reprogramar' ? "Por reprogramar" : "Sin fecha"))
                      let stColor = s.isRealizada ? "text-emerald-700 bg-emerald-50" : (s.isProgramada ? "text-amber-700 bg-amber-50" : "text-rose-700 bg-rose-50")

                      return (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2 font-bold text-center text-indigo-600">#{s.ronda}</td>
                          <td className="py-2 px-2 text-slate-700 font-medium">{s.fecha || '-'}</td>
                          <td className="py-2 px-2 text-slate-600">{s.hora_dia || '-'}</td>
                          <td className="py-2 px-2 text-slate-600">{s.modalidad || '-'}</td>
                          <td className="py-2 px-2 text-slate-600 truncate max-w-[200px]" title={s.tema}>{s.tema || '-'}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700">{s.horas || '-'}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${stColor}`}>
                              {st}
                            </span>
                          </td>
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
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Horas Realizadas</h4>
              <p className="text-4xl font-black text-indigo-600 mb-2">{selectedHoras} h</p>
              <p className="text-xs text-slate-500">
                {selectedEmpRealizadas.length} realizadas al corte<br/>
                {selectedEmpProgramadas.length} programadas posteriores
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-400 italic py-8">Selecciona un emprendimiento de la lista para ver el desglose individual de sus asesorías.</p>
        )}
      </div>

      {/* 9. Cronología Diaria y Ritmo Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-2">Ritmo Diario de Asesorías (Acumulado)</h3>
          <p className="text-xs text-slate-500 mb-4">Evolución de sesiones realizadas del 17 de septiembre al 10 de octubre de 2026</p>
          <div className="flex-1 h-52 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Line isAnimationActive={false} yAxisId="left" type="monotone" dataKey="Sesiones" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Sesiones del día" />
                <Line isAnimationActive={false} yAxisId="right" type="stepAfter" dataKey="Acumulado" stroke="#10b981" strokeWidth={2} dot={false} name="Total acumulado" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detalle Semanal */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" /> Detalle por Semana
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-72">
            {weekList.map((w, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{w.range}</p>
                  <p className="text-slate-500 mt-0.5">Tema líder: <strong className="text-slate-700">{w.bestTheme}</strong> ({w.bestCount})</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-indigo-700 text-sm">{w.realizadas} realizadas</p>
                  {w.programadas > 0 && <p className="text-amber-600 font-semibold">{w.programadas} programadas</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 10. Distribución de asesorías del equipo profesional */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <h3 className="font-bold text-slate-800 mb-1">Distribución de Asesorías del Equipo Profesional</h3>
        <p className="text-xs text-slate-500 mb-4">Citas asignadas y realizadas por asesor (nombres anonimizados según protocolo de privacidad)</p>
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50">
              <th className="py-2.5 px-3 font-semibold">Código Asesor</th>
              <th className="py-2.5 px-3 font-semibold text-center">Citas Realizadas</th>
              <th className="py-2.5 px-3 font-semibold text-center">% del total</th>
              <th className="py-2.5 px-3 font-semibold text-center">#1</th>
              <th className="py-2.5 px-3 font-semibold text-center">#2</th>
              <th className="py-2.5 px-3 font-semibold text-center">#3</th>
              <th className="py-2.5 px-3 font-semibold text-center">#4</th>
              <th className="py-2.5 px-3 font-semibold text-center">Horas</th>
              <th className="py-2.5 px-3 font-semibold">Tema principal</th>
            </tr>
          </thead>
          <tbody>
            {profTable.map((p, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-slate-700">{p.name}</td>
                <td className="py-2.5 px-3 text-center font-bold text-indigo-600">{p.total}</td>
                <td className="py-2.5 px-3 text-center text-slate-500 text-xs">{p.percent}</td>
                <td className="py-2.5 px-3 text-center text-slate-600">{p.r1}</td>
                <td className="py-2.5 px-3 text-center text-slate-600">{p.r2}</td>
                <td className="py-2.5 px-3 text-center text-slate-600">{p.r3}</td>
                <td className="py-2.5 px-3 text-center text-slate-600">{p.r4}</td>
                <td className="py-2.5 px-3 text-center font-semibold text-emerald-600">{p.horas} h</td>
                <td className="py-2.5 px-3 text-slate-600 text-xs truncate max-w-[200px]" title={p.temaPrincipal}>{p.temaPrincipal}</td>
              </tr>
            ))}
            <tr className="font-bold bg-slate-50 border-t border-slate-200">
              <td className="py-2.5 px-3 text-slate-800">Total</td>
              <td className="py-2.5 px-3 text-center text-indigo-600">{totalRealizadas}</td>
              <td className="py-2.5 px-3 text-center text-slate-500 text-xs">100%</td>
              <td className="py-2.5 px-3 text-center">{c1}</td>
              <td className="py-2.5 px-3 text-center">{c2}</td>
              <td className="py-2.5 px-3 text-center">{c3}</td>
              <td className="py-2.5 px-3 text-center">{c4}</td>
              <td className="py-2.5 px-3 text-center text-emerald-600">{horasAcumuladas} h</td>
              <td className="py-2.5 px-3"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <FuenteDato 
        fuente="Base maestra de asesorías individuales (hoja Asesorías individuales 8 hora)" 
        fecha={`Información con corte al 13 de octubre de 2026`} 
        n={`${nCohorte} emprendimientos, ${totalRealizadas} sesiones realizadas (${horasAcumuladas} horas)`} 
      />
    </div>
  )
}

function Card({ title, val, sub, icon: Icon, color, badge }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={18} className={color} />
          <h4 className="text-slate-500 font-semibold text-xs uppercase tracking-wider">{title}</h4>
        </div>
        {badge && (
          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className={`text-2xl font-black ${color}`}>{val}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{sub}</p>
      </div>
    </div>
  )
}
