import { useMemo } from 'react'
import { Info } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'

export default function DimensionAnalysis() {
  const { activeConfig, activeData } = usePopulation()
  const { participantes, preguntas_por_dimension } = activeData
  const { dimensiones, dimensionShortNames, escala } = activeConfig
  const hasData = participantes && participantes.length > 0

  const analysis = useMemo(() => {
    const res = []
    
    dimensiones.forEach(dim => {
      if (!hasData) {
        res.push({
          dimension: dim,
          lowest: []
        })
        return
      }

      const qs = preguntas_por_dimension[dim] || []
      const qAverages = qs.map(q => {
        let sum = 0
        participantes.forEach(emp => {
          sum += emp.mediciones?.linea_base?.puntajes_preguntas?.[q]?.valor || 0
        })
        return {
          question: q,
          average: sum / participantes.length
        }
      })
      
      qAverages.sort((a, b) => a.average - b.average)
      
      res.push({
        dimension: dim,
        lowest: qAverages.slice(0, 3) // Top 3 lowest
      })
    })
    
    return res
  }, [participantes, dimensiones, preguntas_por_dimension, hasData])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Análisis de Dimensiones</h2>
        <p className="text-sm md:text-base text-slate-500">
          Las 3 preguntas con menor puntaje promedio en línea base (escala {escala.min} a {escala.max}) por cada dimensión.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analysis.map(item => (
          <div key={item.dimension} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[250px]">
            <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0">
              <h3 className="font-bold text-slate-700 text-sm" title={item.dimension}>
                {dimensionShortNames?.[item.dimension] || item.dimension}
              </h3>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              {!hasData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                  <Info className="text-slate-400 mb-2" size={24} />
                  <p className="text-xs text-slate-500">Los datos de las preguntas se cargarán con la línea base.</p>
                </div>
              ) : item.lowest.length === 0 ? (
                <p className="text-sm text-slate-500 text-center mt-8">No hay preguntas definidas para esta dimensión.</p>
              ) : (
                <ul className="space-y-4">
                  {item.lowest.map((q, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 font-bold text-xs rounded border border-red-100">
                        {q.average.toFixed(1)}
                      </span>
                      <p className="text-sm text-slate-600 leading-snug pt-1">{q.question}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
