import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Info } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'

export default function PreguntasPorDimension({ dataset }) {
  const { activeConfig, activeData } = usePopulation()
  const { dimensiones, dimensionIcons, dimensionTooltips, dimensionShortNames, escala } = activeConfig
  const { preguntas_por_dimension } = activeData
  
  const [selectedDim, setSelectedDim] = useState('all')
  const visibleDimensions = selectedDim === 'all' ? dimensiones : [selectedDim]

  const getSemaphoreColor = (ratio) => {
    if (ratio >= 0.8) return '#22c55e'
    if (ratio >= 0.6) return '#eab308'
    if (ratio >= 0.4) return '#f97316'
    return '#ef4444'
  }

  // Check if any question has cierre
  let hasAnyCierre = false
  if (dataset) {
    for (const q in dataset.valoresPorPregunta) {
      if (dataset.valoresPorPregunta[q].cierre != null) {
        hasAnyCierre = true
        break
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Detalle por Pregunta - {dataset.nombre}</h2>
          <p className="text-sm text-slate-500 mt-1">Puntaje individual obtenido en cada pregunta, organizado por dimensiones.</p>
        </div>
        <select 
          className="w-full sm:w-96 rounded-md border-slate-300 bg-slate-50 text-slate-800 shadow-sm py-2 px-3 border focus:ring focus:ring-cyan-500 focus:border-cyan-500"
          value={selectedDim}
          onChange={e => setSelectedDim(e.target.value)}
        >
          <option value="all">Todas las dimensiones</option>
          {dimensiones.map(d => <option key={d} value={d}>{dimensionShortNames?.[d] || d}</option>)}
        </select>
      </div>

      <div className="space-y-8">
        {visibleDimensions.map(dim => {
          const Icon = dimensionIcons?.[dim] || Info
          const questions = preguntas_por_dimension[dim] || []
          
          if (questions.length === 0) return null

          const chartData = questions.map((q, i) => ({
            name: `P${i + 1}`,
            fullText: q,
            linea_base: dataset.valoresPorPregunta[q]?.linea_base || 0,
            cierre: dataset.valoresPorPregunta[q]?.cierre
          }))

          return (
            <div key={dim} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3" title={dimensionTooltips?.[dim]}>
                  <Icon className="text-cyan-600 shrink-0" size={20} />
                  <h3 className="font-bold text-slate-800">{dim}</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-600 rounded-full shrink-0">
                  {questions.length} preguntas
                </span>
              </div>
              
              <div className="p-6">
                <div className="h-[400px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[escala.min, escala.max]} tick={{ fill: '#64748b' }} stroke="#e2e8f0" />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} stroke="#e2e8f0" axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                        formatter={(value) => [Number(value).toFixed(2), '']}
                        labelFormatter={(label, payload) => payload[0]?.payload?.fullText || label}
                      />
                      {hasAnyCierre && <Legend wrapperStyle={{ paddingTop: '10px' }} />}
                      
                      {hasAnyCierre ? (
                        <>
                          <Bar name="Línea Base" dataKey="linea_base" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
                          <Bar name="Cierre" dataKey="cierre" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={12} />
                        </>
                      ) : (
                        <Bar name="Línea Base" dataKey="linea_base" radius={[0, 4, 4, 0]} barSize={20}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getSemaphoreColor(entry.linea_base / escala.max)} />
                          ))}
                        </Bar>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t border-slate-100">
                  {chartData.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="shrink-0 w-8 h-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
                        {item.name}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-600 leading-tight">{item.fullText}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase mr-1">LB:</span>
                            <span className="text-xs font-bold text-slate-900">{item.linea_base.toFixed(2)}</span>
                          </div>
                          {item.cierre != null && (
                            <div>
                              <span className="text-[10px] text-cyan-600 uppercase mr-1">Cierre:</span>
                              <span className="text-xs font-bold text-cyan-700">{item.cierre.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
