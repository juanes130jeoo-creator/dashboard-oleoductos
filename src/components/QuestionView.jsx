import { useState, useMemo } from 'react'
import { Info } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'
import PreguntasPorDimension from './PreguntasPorDimension'

export default function QuestionView() {
  const { activeConfig, activeData } = usePopulation()
  const { participantes, preguntas_por_dimension } = activeData
  const { dimensiones, escala } = activeConfig
  const hasData = participantes && participantes.length > 0

  const [selectedId, setSelectedId] = useState('consolidado')

  const consolidatedDataset = useMemo(() => {
    if (!hasData) return null
    const promediosPorPregunta = {}
    
    dimensiones.forEach(dim => {
      (preguntas_por_dimension[dim] || []).forEach(q => {
        let sumLb = 0
        let sumCi = 0
        let countCi = 0

        participantes.forEach(e => {
          sumLb += e.mediciones?.linea_base?.puntajes_preguntas?.[q]?.valor || 0
          const valCi = e.mediciones?.cierre?.puntajes_preguntas?.[q]?.valor
          if (valCi != null) {
            sumCi += valCi
            countCi++
          }
        })
        
        promediosPorPregunta[q] = {
          linea_base: sumLb / participantes.length,
          cierre: countCi > 0 ? sumCi / countCi : null
        }
      })
    })

    return {
      id: 'consolidado',
      nombre: 'Consolidado (Todos los participantes)',
      valoresPorPregunta: promediosPorPregunta
    }
  }, [participantes, dimensiones, preguntas_por_dimension, hasData])

  const currentDataset = useMemo(() => {
    if (!hasData) return null
    if (selectedId === 'consolidado') return consolidatedDataset
    
    const company = participantes.find(e => e.id === selectedId)
    if (!company) return consolidatedDataset
    
    const vals = {}
    dimensiones.forEach(dim => {
      (preguntas_por_dimension[dim] || []).forEach(q => {
        vals[q] = {
          linea_base: company.mediciones?.linea_base?.puntajes_preguntas?.[q]?.valor || 0,
          cierre: company.mediciones?.cierre?.puntajes_preguntas?.[q]?.valor
        }
      })
    })

    return {
      id: company.id,
      nombre: company.nombre,
      valoresPorPregunta: vals
    }
  }, [selectedId, participantes, consolidatedDataset, dimensiones, preguntas_por_dimension, hasData])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Análisis por Pregunta (Escala {escala.min} a {escala.max})</h2>
        <p className="text-sm md:text-base text-slate-500 mb-2">Visualización del puntaje obtenido en cada pregunta del instrumento. Incluye comparativa de cierre si está disponible.</p>
        
        <select 
          className="w-full md:w-[500px] rounded-md border-slate-300 bg-white text-slate-800 shadow-sm py-2 px-3 border focus:ring focus:ring-cyan-500 focus:border-cyan-500 min-h-[44px]"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          disabled={!hasData}
        >
          {hasData ? (
            <>
              <option value="consolidado" className="font-bold text-cyan-600">Consolidado (Todos los participantes)</option>
              <optgroup label="Participantes Individuales">
                {participantes.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </optgroup>
            </>
          ) : (
            <option value="">Sin datos cargados</option>
          )}
        </select>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
           <Info className="text-slate-400 mb-3" size={32} />
           <p className="text-sm">Aquí se mostrará el análisis detallado por pregunta una vez se cargue la línea base.</p>
        </div>
      ) : (
        <PreguntasPorDimension 
          dataset={currentDataset} 
        />
      )}
    </div>
  )
}
