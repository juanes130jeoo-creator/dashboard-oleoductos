import { useMemo } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Download, Info } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'
import useIsMobile from '../hooks/useIsMobile'

export default function Home() {
  const { activeConfig, activeData } = usePopulation()
  const { participantes } = activeData
  const { dimensiones, niveles, nombre: popName } = activeConfig
  const isMobile = useIsMobile()
  const hasData = participantes && participantes.length > 0

  const stats = useMemo(() => {
    if (!hasData) return null

    let totalScore = 0
    let maxCompany = participantes[0]
    let minCompany = participantes[0]
    
    const dimTotals = {}
    dimensiones.forEach(d => dimTotals[d] = 0)

    participantes.forEach(emp => {
      const cumplimiento = emp.mediciones?.linea_base?.cumplimiento_total || 0
      totalScore += cumplimiento
      
      const maxCump = maxCompany.mediciones?.linea_base?.cumplimiento_total || 0
      if (cumplimiento > maxCump) maxCompany = emp
      
      const minCump = minCompany.mediciones?.linea_base?.cumplimiento_total || 0
      if (cumplimiento < minCump) minCompany = emp
      
      dimensiones.forEach(d => {
        dimTotals[d] += (emp.mediciones?.linea_base?.promedios_dimensiones?.[d] || 0)
      })
    })

    const radarData = dimensiones.map(d => ({
      subject: activeConfig.dimensionShortNames?.[d] || (d.length > 20 ? d.substring(0, 20) + '...' : d),
      fullSubject: d,
      promedio: Number((dimTotals[d] / participantes.length).toFixed(2))
    }))

    const ranges = [
      { name: '0-20%', count: 0 }, { name: '21-40%', count: 0 },
      { name: '41-60%', count: 0 }, { name: '61-80%', count: 0 },
      { name: '81-100%', count: 0 }
    ]
    participantes.forEach(emp => {
      const p = (emp.mediciones?.linea_base?.cumplimiento_total || 0) * 100
      if (p <= 20) ranges[0].count++
      else if (p <= 40) ranges[1].count++
      else if (p <= 60) ranges[2].count++
      else if (p <= 80) ranges[3].count++
      else ranges[4].count++
    })

    return {
      promedioGeneral: totalScore / participantes.length,
      maxCompany, minCompany, radarData, ranges
    }
  }, [participantes, dimensiones, hasData, activeConfig])

  const getMaturityLevel = (score) => {
    return niveles.find(l => score <= l.max) || niveles[niveles.length - 1]
  }

  const generalLevel = stats ? getMaturityLevel(stats.promedioGeneral) : null

  const exportPDF = () => {
    window.print()
  }

  const CustomTick = ({ payload, x, y, textAnchor, stroke, radius }) => {
    if (!stats) return null;
    return (
      <g className="recharts-layer recharts-polar-angle-axis-tick">
        <text 
          radius={radius} stroke={stroke} x={x} y={y} className="recharts-text recharts-polar-angle-axis-tick-value" 
          textAnchor={textAnchor} fill="#64748b" fontSize="11"
        >
          <tspan x={x} dy="0em">{payload.value}</tspan>
          <title>{activeConfig.dimensionTooltips?.[stats.radarData[payload.index].fullSubject]}</title>
        </text>
      </g>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard General</h2>
          <p className="text-sm md:text-base text-slate-500">Resumen del nivel de evaluación - {popName}</p>
        </div>
        <button onClick={exportPDF} className="flex items-center justify-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 transition-colors min-h-[44px] w-full md:w-auto">
          <Download size={16} /> Resumen Ejecutivo (PDF)
        </button>
      </div>

      {/* Explicación de niveles (siempre visible, adaptado a los niveles configurados) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
        <h3 className="font-bold text-slate-800 mb-2">Acerca de los Niveles de Evaluación</h3>
        <p className="mb-2">El nivel se asigna con base en el porcentaje de cumplimiento:</p>
        <ul className="flex flex-wrap gap-4 mt-2">
          {niveles.map((n, i) => (
             <li key={i} className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full" style={{backgroundColor: n.hex}}></span>
               <strong>{n.label}:</strong> {i === 0 ? '0' : (niveles[i-1].max * 100 + 1).toFixed(0)}% - {(n.max * 100).toFixed(0)}%
             </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-4 md:p-6 -mx-4 md:-mx-6 -mt-2 rounded-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard 
            title="Participantes Evaluados" 
            value={hasData ? participantes.length : "—"} 
          />
          <KpiCard 
            title="Promedio General" 
            value={hasData ? `${(stats.promedioGeneral * 100).toFixed(1)}%` : "—"} 
            subtitle={hasData ? `Cumplimiento de los ${participantes.length} participantes` : "Pendiente carga de datos"}
            badge={hasData ? { label: generalLevel.label, color: generalLevel.color } : null}
          />
          <KpiCard 
            title="Mayor Cumplimiento" 
            value={hasData ? stats.maxCompany.nombre : "—"} 
            subtitle={hasData ? `${(stats.maxCompany.mediciones?.linea_base?.cumplimiento_total * 100).toFixed(1)}%` : null} 
          />
          <KpiCard 
            title="Oportunidad de Mejora" 
            value={hasData ? stats.minCompany.nombre : "—"} 
            subtitle={hasData ? `${(stats.minCompany.mediciones?.linea_base?.cumplimiento_total * 100).toFixed(1)}%` : null} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div>
              <h3 className="text-lg font-semibold text-slate-700">Promedio por Dimensión (Línea Base)</h3>
              <p className="text-sm text-slate-500 mb-4">Puntaje promedio en cada dimensión calculado sobre todos los participantes.</p>
            </div>
            
            {!hasData ? (
              <EmptyState message="Aquí se mostrará el promedio de cumplimiento por dimensión una vez se cargue la línea base." />
            ) : isMobile ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.radarData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[activeConfig.escala.min, activeConfig.escala.max]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="subject" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => !isNaN(value) ? Number(value).toFixed(1) : value} />
                    <Bar name="Línea Base" dataKey="promedio" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={<CustomTick />} />
                    <PolarRadiusAxis angle={30} domain={[activeConfig.escala.min, activeConfig.escala.max]} tick={{fill: '#94a3b8'}} />
                    <Radar name="Línea Base" dataKey="promedio" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => !isNaN(value) ? Number(value).toFixed(1) : value} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700">Distribución de Cumplimiento</h3>
            <p className="text-sm text-slate-500 mb-4">Cantidad de participantes ubicados en cada rango porcentual.</p>
            {!hasData ? (
              <EmptyState message="Aquí se mostrará el histograma de distribución una vez se carguen los datos." />
            ) : (
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.ranges} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => !isNaN(value) ? Number(value).toFixed(1) : value} />
                    <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Participantes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, subtitle, badge }) {
  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[140px]">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="text-2xl font-bold text-slate-800 mt-2 truncate" title={String(value)}>{value}</p>
      {subtitle && <p className="text-sm text-cyan-600 mt-1">{subtitle}</p>}
      {badge && (
        <div className="mt-2">
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      )}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-slate-300 rounded-lg h-64 md:h-80">
      <Info className="text-slate-400 mb-3" size={32} />
      <p className="text-slate-500 text-sm max-w-sm">{message}</p>
    </div>
  )
}
