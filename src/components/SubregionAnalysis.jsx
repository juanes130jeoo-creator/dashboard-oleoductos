import { useState, useMemo } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { Map, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'
import useIsMobile from '../hooks/useIsMobile'

export default function SubregionAnalysis() {
  const { activeConfig, activeData } = usePopulation()
  const { participantes, preguntas_por_dimension } = activeData
  const { dimensiones, dimensionIcons, dimensionShortNames, escala } = activeConfig
  const isMobile = useIsMobile()
  const hasData = participantes && participantes.length > 0

  const [selectedTerritorio, setSelectedTerritorio] = useState(null)

  const getRelativeColor = (val, min, max) => {
    if (max === min) return '#f59e0b'
    const pct = (val - min) / (max - min)
    const hue = pct * 120 // 0 = red, 60 = yellow, 120 = green
    return `hsl(${hue}, 80%, 45%)`
  }

  const getSemaphoreColor = (ratio) => {
    if (ratio >= 0.8) return '#22c55e'
    if (ratio >= 0.6) return '#eab308'
    if (ratio >= 0.4) return '#f97316'
    return '#ef4444'
  }

  const stats = useMemo(() => {
    if (!hasData) return null
    const groups = {}
    participantes.forEach(emp => {
      const sub = emp.territorio || 'Sin dato'
      if (!groups[sub]) {
        groups[sub] = { 
          name: sub, 
          count: 0, 
          sum: 0, 
          empresas: [],
          dimSums: {} 
        }
        dimensiones.forEach(d => groups[sub].dimSums[d] = 0)
      }
      groups[sub].count++
      const cTotal = emp.mediciones?.linea_base?.cumplimiento_total || 0
      groups[sub].sum += cTotal
      groups[sub].empresas.push(emp)
      
      dimensiones.forEach(d => {
        groups[sub].dimSums[d] += (emp.mediciones?.linea_base?.promedios_dimensiones?.[d] || 0)
      })
    })

    const chartData = Object.values(groups).map(g => {
      const avg = g.sum / g.count
      const dimAvgs = {}
      dimensiones.forEach(d => dimAvgs[d] = g.dimSums[d] / g.count)
      return {
        ...g,
        promedio: avg,
        dimAvgs
      }
    }).sort((a, b) => b.promedio - a.promedio)

    const globalDimAvgs = {}
    dimensiones.forEach(d => {
      let sum = 0
      participantes.forEach(e => sum += (e.mediciones?.linea_base?.promedios_dimensiones?.[d] || 0))
      globalDimAvgs[d] = sum / participantes.length
    })

    return { 
      subregions: chartData, 
      globalDimAvgs,
      max: chartData[0],
      min: chartData[chartData.length - 1]
    }
  }, [participantes, dimensiones, hasData])

  const radarData = useMemo(() => {
    if (!selectedTerritorio || !stats) return []
    const sub = stats.subregions.find(s => s.name === selectedTerritorio)
    if (!sub) return []

    return dimensiones.map(d => ({
      subject: dimensionShortNames?.[d] || (d.length > 15 ? d.substring(0, 15) + '...' : d),
      fullSubject: d,
      territorio: sub.dimAvgs[d],
      promedio_general: stats.globalDimAvgs[d]
    }))
  }, [selectedTerritorio, stats, dimensiones, dimensionShortNames])

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Análisis Territorial</h2>
          <p className="text-sm md:text-base text-slate-500">Distribución geográfica del nivel de evaluación en línea base.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
           <Info className="text-slate-400 mb-3" size={32} />
           <p className="text-sm">Aquí se mostrará el análisis por territorio una vez se carguen los datos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 text-cyan-600 rounded-full flex items-center justify-center">
            <Map size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Territorios Activos</p>
            <p className="text-2xl font-bold text-slate-800">{stats.subregions.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Mejor Promedio (Línea Base)</p>
            <p className="text-xl font-bold text-slate-800 truncate" title={stats.max?.name}>{stats.max?.name}</p>
            <p className="text-sm text-green-600">{(stats.max?.promedio * 100).toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Mayor Oportunidad de Mejora</p>
            <p className="text-xl font-bold text-slate-800 truncate" title={stats.min?.name}>{stats.min?.name}</p>
            <p className="text-sm text-red-600">{(stats.min?.promedio * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-xl md:text-lg font-bold text-slate-800">Promedio de Cumplimiento (Línea Base) por Territorio</h3>
        <p className="text-sm text-slate-500 mb-6 mt-1">Porcentaje promedio de cumplimiento agrupado por territorio. Haz clic en una barra para ver el detalle.</p>
        <div className="flex-1 min-h-[400px] md:min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.subregions} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis 
                type="number"
                domain={[0, 1]}
                tick={{ fill: '#64748b', fontSize: 11 }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={val => `${(val * 100).toFixed(0)}%`}
              />
              <YAxis 
                type="category"
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                formatter={(val) => [`${(val * 100).toFixed(1)}%`, 'Promedio']}
              />
              <Bar 
                dataKey="promedio" 
                radius={[0, 4, 4, 0]} 
                onClick={(data) => setSelectedTerritorio(selectedTerritorio === data.name ? null : data.name)}
                cursor="pointer"
                barSize={20}
              >
                {stats.subregions.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={selectedTerritorio === entry.name ? '#1e293b' : getRelativeColor(entry.promedio, stats.min.promedio, stats.max.promedio)} 
                    className="transition-colors duration-300 hover:brightness-90"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {selectedTerritorio && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div>
              <h3 className="text-xl md:text-lg font-bold text-slate-800 mb-2">Detalle: {selectedTerritorio}</h3>
              <p className="text-sm text-slate-500 mb-4">Puntaje promedio (escala {escala.min} a {escala.max}) comparado contra el promedio general.</p>
            </div>
            
            {isMobile ? (
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={radarData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[escala.min, escala.max]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="subject" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => !isNaN(value) ? Number(value).toFixed(1) : value} />
                    <Legend wrapperStyle={{ color: '#334155', paddingTop: '10px' }} />
                    <Bar name={selectedTerritorio} dataKey="territorio" fill="#f97316" radius={[0, 4, 4, 0]} />
                    <Bar name="Promedio Gral" dataKey="promedio_general" fill="#64748b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[escala.min, escala.max]} tick={{ fill: '#94a3b8' }} />
                    <Radar name={selectedTerritorio} dataKey="territorio" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
                    <Radar name="Promedio Gral" dataKey="promedio_general" stroke="#64748b" fill="#64748b" fillOpacity={0.2} />
                    <Legend wrapperStyle={{ color: '#334155' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => !isNaN(value) ? Number(value).toFixed(1) : value} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Participantes en {selectedTerritorio}</h3>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-2">
              {stats.subregions.find(s => s.name === selectedTerritorio)?.empresas.map(emp => (
                <div key={emp.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100 hover:border-cyan-300 transition-colors">
                  <div className="overflow-hidden pr-4">
                    <p className="font-bold text-slate-800 text-sm truncate">{emp.nombre}</p>
                    <p className="text-xs text-slate-500">LB: {(emp.mediciones?.linea_base?.cumplimiento_total * 100).toFixed(1)}%</p>
                  </div>
                  {emp.mediciones?.cierre?.cumplimiento_total != null && (
                    <span className="font-bold text-cyan-600 shrink-0 text-sm">Ci: {(emp.mediciones.cierre.cumplimiento_total * 100).toFixed(1)}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Mapa de Calor por Territorio (Línea Base)</h3>
        <p className="text-sm text-slate-500 mb-4">Puntaje promedio en cada dimensión calculado sobre los participantes de cada territorio.</p>
        
        <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 p-3 border-b border-slate-200">
            <h4 className="font-bold text-slate-700 text-sm">Dimensiones</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white divide-y md:divide-y-0 md:gap-[1px] md:bg-slate-200">
            {dimensiones.map((d, i) => {
              const Icon = dimensionIcons?.[d] || Info
              const numPreguntas = preguntas_por_dimension[d]?.length || 0
              return (
                <div key={d} className="bg-white p-4 flex gap-3 items-start h-full">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                    D{i+1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex gap-1.5 mb-1 items-start">
                      {Icon && <Icon size={16} className="text-cyan-600 shrink-0 mt-[2px]" />}
                      <p className="font-bold text-slate-700 text-sm leading-tight break-words">{dimensionShortNames?.[d] || d}</p>
                    </div>
                    <p className="text-xs text-slate-400 pl-[22px]">{numPreguntas} {numPreguntas === 1 ? 'pregunta' : 'preguntas'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left font-bold text-slate-500 pb-4 min-w-[150px]">Territorio</th>
              {dimensiones.map((d, i) => (
                <th key={d} className="font-bold text-slate-500 pb-4 w-20 text-center" title={d}>
                  D{i+1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.subregions.map(sub => (
              <tr key={sub.name} className="border-t border-slate-100">
                <td className="py-3 font-semibold text-slate-700">{sub.name} <span className="text-xs text-slate-400 font-normal ml-1">({sub.count})</span></td>
                {dimensiones.map(d => {
                  const val = sub.dimAvgs[d]
                  const ratio = val / escala.max; 
                  return (
                    <td key={d} className="p-1">
                      <div 
                        className="h-10 w-full rounded flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: getSemaphoreColor(ratio) }}
                        title={`${d}: ${val.toFixed(2)}`}
                      >
                        {val.toFixed(1)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
