import { useState, useMemo, useEffect } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { X, Info } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'
import useIsMobile from '../hooks/useIsMobile'

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

export default function Comparator() {
  const { activeConfig, activeData } = usePopulation()
  const { participantes } = activeData
  const { dimensiones, dimensionShortNames, escala } = activeConfig
  const isMobile = useIsMobile()
  const hasData = participantes && participantes.length > 0

  const [selectedIds, setSelectedIds] = useState([])

  // Auto-select first two if available and none selected (and reset on population change)
  useEffect(() => {
    if (hasData && participantes.length >= 2) {
      setSelectedIds([participantes[0].id, participantes[1].id])
    } else if (hasData && participantes.length === 1) {
      setSelectedIds([participantes[0].id])
    } else {
      setSelectedIds([])
    }
  }, [participantes, hasData])

  const selectedCompanies = selectedIds.map(id => participantes.find(e => e.id === id)).filter(Boolean)

  const radarData = useMemo(() => {
    return dimensiones.map(d => {
      const row = {
        subject: dimensionShortNames?.[d] || (d.length > 15 ? d.substring(0, 15) + '...' : d),
        fullSubject: d
      }
      selectedCompanies.forEach(c => {
        row[c.nombre] = c.mediciones?.linea_base?.promedios_dimensiones?.[d] || 0
      })
      return row
    })
  }, [dimensiones, selectedCompanies, dimensionShortNames])

  const addCompanyId = (id) => {
    if (id && !selectedIds.includes(id) && selectedIds.length < 5) {
      setSelectedIds([...selectedIds, id])
    }
  }

  const removeCompany = (id) => {
    setSelectedIds(selectedIds.filter(x => x !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Comparativa Multidimensional</h2>
        <p className="text-sm md:text-base text-slate-500">Compara el nivel en cada dimensión para hasta 5 participantes simultáneamente (datos de línea base).</p>
        
        <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-2">
          <select 
            className="rounded-md border-slate-300 bg-slate-50 text-slate-800 shadow-sm py-2 px-3 border focus:ring focus:ring-cyan-500 focus:border-cyan-500 w-full md:w-64 min-h-[44px]"
            value=""
            onChange={e => e.target.value && addCompanyId(e.target.value)}
            disabled={!hasData}
          >
            <option value="">+ Añadir participante...</option>
            {hasData && participantes.map(e => (
              <option key={e.id} value={e.id} disabled={selectedIds.includes(e.id)}>{e.nombre}</option>
            ))}
          </select>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {selectedIds.map((id, index) => {
              const comp = participantes.find(e => e.id === id)
              if (!comp) return null
              return (
                <div key={id} className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 min-h-[44px] rounded-full text-sm">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  <span className="text-slate-800 font-medium truncate max-w-[200px]">{comp.nombre}</span>
                  <button onClick={() => removeCompany(id)} className="text-slate-400 hover:text-red-500 p-2 -mr-2 flex items-center justify-center min-h-[44px] min-w-[44px]">
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
             <Info className="text-slate-400 mb-3" size={32} />
             <p className="text-sm">Aquí se mostrará el gráfico comparativo una vez se carguen los participantes.</p>
          </div>
        ) : selectedIds.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            Selecciona al menos un participante para comparar.
          </div>
        ) : (
          <div>
            {isMobile ? (
              <div className="h-[600px] pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={radarData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[escala.min, escala.max]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="subject" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => !isNaN(value) ? Number(value).toFixed(1) : value} />
                    <Legend wrapperStyle={{ color: '#334155', paddingTop: '10px' }} />
                    {selectedIds.map((id, index) => {
                      const comp = participantes.find(e => e.id === id)
                      if (!comp) return null
                      return (
                        <Bar 
                          key={id} 
                          name={comp.nombre} 
                          dataKey={comp.nombre} 
                          fill={COLORS[index % COLORS.length]} 
                          radius={[0, 4, 4, 0]} 
                        />
                      )
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[escala.min, escala.max]} tick={{ fill: '#94a3b8' }} />
                    {selectedIds.map((id, index) => {
                      const comp = participantes.find(e => e.id === id)
                      if (!comp) return null
                      return (
                        <Radar 
                          key={id} 
                          name={comp.nombre} 
                          dataKey={comp.nombre} 
                          stroke={COLORS[index % COLORS.length]} 
                          fill={COLORS[index % COLORS.length]} 
                          fillOpacity={0.2} 
                        />
                      )
                    })}
                    <Legend wrapperStyle={{ color: '#334155' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => !isNaN(value) ? Number(value).toFixed(1) : value} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
