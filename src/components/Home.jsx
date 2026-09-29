import { useMemo } from 'react'
import { CheckCircle2, PlayCircle, Clock, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts'
import { usePopulation } from '../context/PopulationContext'
import metasData from '../config/metas-proyecto.json'
import asesoriasData from '../data/control_gestion_asesorias.json'
import FuenteDato from './shared/FuenteDato'

const CORTE_DATE = "2026-09-29"

export default function Home() {
  const { selectedPopulationId } = usePopulation()
  
  const isEmprendedores = selectedPopulationId === 'emprendedores'
  const metas = isEmprendedores ? metasData.emprendedores : metasData.jovenes

  // Dynamic calculations for Emprendedores
  const horasEjecutadas = useMemo(() => {
    if (!isEmprendedores) return 0
    let h = 0
    asesoriasData.forEach(emp => {
      emp.asesorias.forEach(a => {
        if (a.fecha && a.fecha <= CORTE_DATE) {
          h += (a.horas || 0)
        }
      })
    })
    return h
  }, [isEmprendedores])

  const rows = useMemo(() => {
    return metas.map(m => {
      let e = m.ejecucion
      if (m.fuente === "base de asesorías" && m.unidad === "horas") {
        e = horasEjecutadas
      }
      
      const pRaw = (e / m.meta) * 100
      const p = Math.min(pRaw, 100)
      const isSupera = pRaw > 100

      let status = "por_iniciar"
      let color = "bg-rose-500"
      let chartColor = "#f43f5e"
      if (p > 0 && p < 100) {
        status = "en_curso"
        color = "bg-amber-500"
        chartColor = "#f59e0b"
      } else if (p >= 100) {
        status = "completada"
        color = "bg-emerald-500"
        chartColor = "#10b981"
      }

      return {
        ...m,
        ejecucionReal: e,
        pRaw,
        percent: p,
        isSupera,
        status,
        color,
        chartColor,
        shortName: m.componente.length > 35 ? m.componente.substring(0, 35) + '...' : m.componente
      }
    })
  }, [metas, horasEjecutadas])

  const countCompletadas = rows.filter(r => r.status === "completada").length
  const countEnCurso = rows.filter(r => r.status === "en_curso").length
  const countPorIniciar = rows.filter(r => r.status === "por_iniciar").length
  const totalActividades = rows.length

  const pieEstadoData = [
    { name: "Completadas", value: countCompletadas, color: "#10b981" },
    { name: "En curso", value: countEnCurso, color: "#f59e0b" },
    { name: "Por iniciar", value: countPorIniciar, color: "#f43f5e" }
  ].filter(d => d.value > 0)

  const hasAcomp = rows.find(r => r.fuente === "base de asesorías")
  const metaHoras = hasAcomp ? hasAcomp.meta : 0
  const pieHorasData = [
    { name: "Ejecutadas", value: horasEjecutadas, color: "#6366f1" },
    { name: "Restantes", value: Math.max(0, metaHoras - horasEjecutadas), color: "#e2e8f0" }
  ]

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Avance del Proyecto</h2>
          <p className="text-slate-500">Ejecución de actividades según las metas establecidas.</p>
        </div>
        <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 print:hidden">
          Resumen Ejecutivo (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          title="Actividades completadas (100%)" 
          val={`${countCompletadas} de ${totalActividades}`} 
          icon={CheckCircle2} color="text-emerald-600" 
        />
        <Card 
          title="Actividades en curso (1% a 99%)" 
          val={`${countEnCurso} de ${totalActividades}`} 
          icon={PlayCircle} color="text-amber-500" 
        />
        <Card 
          title="Actividades por iniciar (0%)" 
          val={`${countPorIniciar} de ${totalActividades}`} 
          icon={Clock} color="text-rose-500" 
        />
        {isEmprendedores && (
          <Card 
            title="Horas acompañamiento individual" 
            val={`${horasEjecutadas} de ${metaHoras}`} 
            icon={Info} color="text-indigo-600" 
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">% de Avance por Actividad</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="shortName" type="category" width={220} tick={{fontSize: 11, fill: '#475569'}} />
                <Tooltip 
                  formatter={(value, name, props) => [`${props.payload.pRaw.toFixed(1)}%`, 'Avance']}
                />
                <Bar dataKey="percent" radius={[0, 4, 4, 0]}>
                  {rows.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.chartColor} />
                  ))}
                  <LabelList 
                    dataKey="pRaw" 
                    position="right" 
                    formatter={val => val.toFixed(1) + '%'} 
                    style={{ fontSize: '11px', fill: '#475569', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-slate-800 mb-2 text-center">Estado de las actividades</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieEstadoData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" label>
                    {pieEstadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs text-slate-600">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Completadas</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div> En curso</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Por iniciar</div>
            </div>
          </div>

          {isEmprendedores && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
              <h3 className="font-bold text-slate-800 mb-2 text-center">Acompañamiento Técnico</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieHorasData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                      {pieHorasData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <p className="text-xl font-bold text-indigo-600">{((horasEjecutadas / metaHoras) * 100).toFixed(1)}%</p>
                <p className="text-xs text-slate-500">{horasEjecutadas} de {metaHoras} horas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">Actividad</th>
                <th className="py-3 px-4 font-semibold text-center">Meta</th>
                <th className="py-3 px-4 font-semibold text-center">Ejecución</th>
                <th className="py-3 px-4 font-semibold">Avance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-slate-700 max-w-[300px]">
                    <span className="font-medium">{row.componente}</span>
                    {row.componente.includes("Caracterización") && isEmprendedores && (
                      <p className="text-xs text-amber-600 mt-1 italic leading-tight">La base de asesorías individuales registra 36 emprendimientos; la meta de caracterización es 30.</p>
                    )}
                    {row.componente.includes("Acompañamiento técnico") && isEmprendedores && (
                      <p className="text-xs text-indigo-500 mt-1 italic leading-tight">Horas de asesoría individual registradas al {CORTE_DATE} (meta: 30 emprendimientos × 8 horas).</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">{row.meta} {row.unidad}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700">{row.ejecucionReal} {row.unidad}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${row.percent}%` }}></div>
                      </div>
                      <span className="font-semibold text-slate-600 text-xs w-12 text-right">
                        {row.pRaw.toFixed(1)}%
                      </span>
                    </div>
                    {row.isSupera && <p className="text-xs text-emerald-600 font-medium mt-1 text-right">supera la meta</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FuenteDato fuente="tabla de seguimiento del programa, septiembre de 2026" />
        {isEmprendedores && <FuenteDato fuente={`base de asesorías individuales, corte ${CORTE_DATE}`} />}
      </div>
    </div>
  )
}

function Card({ title, val, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className={color} />
        <h3 className="text-slate-500 font-medium text-xs leading-tight">{title}</h3>
      </div>
      <p className={`text-2xl font-black ${color}`}>{val}</p>
    </div>
  )
}
