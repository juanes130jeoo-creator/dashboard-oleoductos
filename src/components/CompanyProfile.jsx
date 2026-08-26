import { useState, useRef, useMemo, useEffect } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Download, Info } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'
import useIsMobile from '../hooks/useIsMobile'

export default function CompanyProfile() {
  const { activeConfig, activeData } = usePopulation()
  const { participantes, preguntas_por_dimension } = activeData
  const { dimensiones, dimensionShortNames, dimensionIcons, dimensionTooltips, niveles, escala } = activeConfig
  
  const hasData = participantes && participantes.length > 0
  const [selectedId, setSelectedId] = useState('')
  const reportRef = useRef(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (hasData && !selectedId) {
      setSelectedId(participantes[0].id)
    } else if (!hasData) {
      setSelectedId('')
    }
  }, [participantes, hasData, selectedId])

  const company = useMemo(() => participantes.find(e => e.id === selectedId), [participantes, selectedId])
  const hasCierre = Boolean(company?.mediciones?.cierre?.cumplimiento_total != null)

  const stats = useMemo(() => {
    if (!company) return null
    
    const radarData = dimensiones.map(d => {
      let sum = 0
      participantes.forEach(e => sum += e.mediciones?.linea_base?.promedios_dimensiones?.[d] || 0)
      const avg = sum / (participantes.length || 1)
      return {
        subject: dimensionShortNames?.[d] || (d.length > 15 ? d.substring(0, 15) + '...' : d),
        fullSubject: d,
        linea_base: company.mediciones?.linea_base?.promedios_dimensiones?.[d] || 0,
        cierre: company.mediciones?.cierre?.promedios_dimensiones?.[d],
        promedio_general: avg
      }
    })

    const allQs = []
    dimensiones.forEach(dim => {
      const qs = preguntas_por_dimension[dim] || []
      qs.forEach(q => {
        const lbVal = company.mediciones?.linea_base?.puntajes_preguntas?.[q]?.valor || 0
        const ciVal = company.mediciones?.cierre?.puntajes_preguntas?.[q]?.valor
        const currentVal = ciVal != null ? ciVal : lbVal
        allQs.push({ q, val: currentVal })
      })
    })

    const strengths = allQs.filter(x => x.val >= (escala.max * 0.8)).sort((a,b) => b.val - a.val)
    const weaknesses = allQs.filter(x => x.val <= (escala.max * 0.4)).sort((a,b) => a.val - b.val)

    return { radarData, strengths, weaknesses }
  }, [company, participantes, dimensiones, preguntas_por_dimension, dimensionShortNames, escala.max])

  const exportPDF = () => {
    window.print()
  }

  const getMaturityLevel = (score) => {
    return niveles.find(l => score <= l.max) || niveles[niveles.length - 1]
  }

  const getSemaphoreColor = (ratio) => {
    if (ratio >= 0.8) return '#22c55e'
    if (ratio >= 0.6) return '#eab308'
    if (ratio >= 0.4) return '#f97316'
    return '#ef4444'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Reporte Individual</h2>
        <select 
          className="w-full md:w-96 rounded-md border-slate-300 bg-white text-slate-800 shadow-sm py-2 px-3 border focus:ring focus:ring-cyan-500 focus:border-cyan-500 min-h-[44px]"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          disabled={!hasData}
        >
          {hasData ? (
            participantes.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)
          ) : (
            <option value="">Sin participantes cargados</option>
          )}
        </select>
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={exportPDF} disabled={!hasData} className="flex items-center justify-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 transition-colors min-h-[44px] w-full md:w-auto disabled:opacity-50">
          <Download size={16} /> Exportar PDF
        </button>
      </div>

      <div ref={reportRef} className="bg-white rounded-xl border border-slate-200 p-4 md:p-8 shadow-sm space-y-6 md:space-y-10">
        
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
             <Info className="text-slate-400 mb-3" size={32} />
             <p className="text-sm">Aquí se mostrará el reporte individual una vez se carguen los participantes.</p>
          </div>
        ) : !company ? null : (() => {
          const lbCump = company.mediciones?.linea_base?.cumplimiento_total || 0
          const ciCump = company.mediciones?.cierre?.cumplimiento_total
          const currentCump = hasCierre ? ciCump : lbCump
          const maturityLevel = getMaturityLevel(currentCump)

          return (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between border-b border-slate-100 pb-6 gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{company.nombre}</h1>
                    <span className={`px-3 py-1 text-xs md:text-sm font-bold rounded-full border`} style={{backgroundColor: maturityLevel.hex + '20', color: maturityLevel.hex, borderColor: maturityLevel.hex}}>
                      {maturityLevel.label}
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-slate-500 mt-2">Territorio: {company.territorio || '—'}</p>
                </div>
                <div className="md:text-right flex items-end gap-6 md:flex-col md:gap-0">
                  <div>
                    <p className="text-xs md:text-sm text-slate-500 uppercase font-semibold">Cumplimiento (Línea Base)</p>
                    <p className="text-2xl font-bold text-slate-700">{(lbCump * 100).toFixed(1)}%</p>
                  </div>
                  {hasCierre && (
                    <div className="mt-2">
                      <p className="text-xs md:text-sm text-slate-500 uppercase font-semibold">Cumplimiento (Cierre)</p>
                      <p className="text-3xl font-bold text-cyan-700">{(ciCump * 100).toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Radar / Bar Chart */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Comparativa Multidimensional</h3>
                <p className="text-sm text-slate-500 mb-4">Puntaje promedio de {company.nombre} (escala {escala.min} a {escala.max}) en cada dimensión.</p>
                
                {isMobile ? (
                  <div className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.radarData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" domain={[escala.min, escala.max]} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis dataKey="subject" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => !isNaN(value) ? Number(value).toFixed(1) : value} />
                        <Legend wrapperStyle={{ color: '#334155', paddingTop: '10px' }} />
                        <Bar name="Línea Base" dataKey="linea_base" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                        {hasCierre && <Bar name="Cierre" dataKey="cierre" fill="#06b6d4" radius={[0, 4, 4, 0]} />}
                        {!hasCierre && <Bar name="Promedio Gral" dataKey="promedio_general" fill="#cbd5e1" radius={[0, 4, 4, 0]} />}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.radarData}>
                        <PolarGrid stroke="#cbd5e1" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[escala.min, escala.max]} tick={{ fill: '#94a3b8' }} />
                        <Radar name="Línea Base" dataKey="linea_base" stroke="#94a3b8" fill="#94a3b8" fillOpacity={hasCierre ? 0.3 : 0.6} />
                        {hasCierre && <Radar name="Cierre" dataKey="cierre" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />}
                        {!hasCierre && <Radar name="Promedio Gral" dataKey="promedio_general" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.2} />}
                        <Legend wrapperStyle={{ color: '#334155' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => !isNaN(value) ? Number(value).toFixed(1) : value} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Semáforo */}
              <div className="break-inside-avoid">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">Detalle por Pregunta (Medición Actual)</h3>
                  <p className="text-sm text-slate-500 mt-1">El color indica el nivel alcanzado en esa práctica. El valor numérico entre paréntesis es su puntaje promedio. {hasCierre ? 'Mostrando datos de CIERRE.' : 'Mostrando datos de LÍNEA BASE.'}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 w-fit">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded"></div> Inicial</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded"></div> Básico</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded"></div> Medio</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded"></div> Alto</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {dimensiones.map(dim => {
                    const Icon = dimensionIcons?.[dim] || Info
                    const dimAvg = company.mediciones?.[hasCierre ? 'cierre' : 'linea_base']?.promedios_dimensiones?.[dim] || 0
                    
                    return (
                      <div key={dim} className="break-inside-avoid">
                        <div className="flex items-start md:items-center gap-2 mb-2 border-b border-slate-100 pb-1" title={dimensionTooltips?.[dim]}>
                          <Icon size={16} className="text-cyan-600 shrink-0 mt-[2px] md:mt-0" />
                          <h4 className="text-sm font-bold text-slate-700 flex-1 leading-tight">
                            <span className="md:hidden">{dimensionShortNames?.[dim] || dim}</span>
                            <span className="hidden md:inline">{dim}</span>
                          </h4>
                          <span className="text-sm font-bold text-slate-400 shrink-0">({dimAvg.toFixed(1)}/{escala.max})</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(preguntas_por_dimension[dim] || []).map((q, idx) => {
                            const val = company.mediciones?.[hasCierre ? 'cierre' : 'linea_base']?.puntajes_preguntas?.[q]?.valor || 0
                            return (
                              <div 
                                key={idx} 
                                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] text-white font-bold cursor-help border border-black/10`}
                                style={{ backgroundColor: getSemaphoreColor(val / escala.max) }}
                                title={`Pregunta: ${q}\nPuntaje: ${val}`}
                                aria-label={`Pregunta: ${q}, Puntaje: ${val}`}
                              >
                                {val}
                              </div>
                            )
                          })}
                          {(preguntas_por_dimension[dim] || []).length === 0 && (
                            <span className="text-xs text-slate-400">Sin preguntas configuradas</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Fortalezas y Debilidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-4">Principales Fortalezas ({'>='} {(escala.max * 0.8).toFixed(1)})</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {stats.strengths.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="font-bold text-green-600 shrink-0 mt-[2px]">{item.val.toFixed(1)}</span>
                        <span className="line-clamp-2 md:line-clamp-1 break-words" title={item.q}>{item.q}</span>
                      </li>
                    ))}
                    {stats.strengths.length === 0 && <p className="text-slate-500">No se registraron puntajes altos.</p>}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600 mb-4">Áreas de Mejora ({'<='} {(escala.max * 0.4).toFixed(1)})</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {stats.weaknesses.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="font-bold text-red-600 shrink-0 mt-[2px]">{item.val.toFixed(1)}</span>
                        <span className="line-clamp-2 md:line-clamp-1 break-words" title={item.q}>{item.q}</span>
                      </li>
                    ))}
                    {stats.weaknesses.length === 0 && <p className="text-slate-500">No se registraron puntajes críticos.</p>}
                  </ul>
                </div>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}
