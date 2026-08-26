import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Info, Users, GraduationCap, Home } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'
import indicadoresContexto from '../config/indicadores-contexto.json'
import useIsMobile from '../hooks/useIsMobile'

export default function CharacterizationView() {
  const { activeConfig, activeData } = usePopulation()
  const { sociodemografico, participantes } = activeData
  const { sociodemograficoConfig } = activeConfig
  const isMobile = useIsMobile()

  // Block A: Context Indicators
  const renderContextIndicators = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicadoresContexto.map(ind => {
          const isEmpty = ind.valor === null || ind.valor === undefined || ind.valor === ""
          return (
            <div key={ind.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{ind.territorio}</p>
                <h3 className="text-lg font-bold text-slate-800 leading-tight mt-1">{ind.nombre}</h3>
              </div>
              <div className="mt-4 mb-2">
                {isEmpty ? (
                  <div className="flex items-center gap-2 text-slate-400 bg-slate-50 p-2 rounded border border-dashed border-slate-200">
                    <Info size={16} />
                    <span className="text-sm italic">Pendiente de cargar</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-cyan-600">{ind.valor}</span>
                    <span className="text-lg font-semibold text-cyan-700">{ind.unidad}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-2 border-t border-slate-100 pt-2 flex justify-between">
                <span>Fuente: {ind.fuente}</span>
                <span>Año: {ind.fecha}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Helper to format chart data
  const formatChartData = (dataObj, orderArray) => {
    if (!dataObj) return []
    // If order is provided, use it, otherwise use existing keys except 'promedio'
    const keys = orderArray || Object.keys(dataObj).filter(k => k !== 'promedio')
    return keys.map(k => ({
      name: k,
      value: dataObj[k] || 0
    }))
  }

  const hasData = participantes && participantes.length > 0
  const hasSocio = sociodemografico && Object.keys(sociodemografico).length > 0

  const edadData = useMemo(() => formatChartData(sociodemografico?.edad, sociodemograficoConfig?.edadRangos), [sociodemografico, sociodemograficoConfig])
  const eduData = useMemo(() => formatChartData(sociodemografico?.nivel_educativo, sociodemograficoConfig?.nivelesEducativos), [sociodemografico, sociodemograficoConfig])
  const hogarData = useMemo(() => formatChartData(sociodemografico?.personas_hogar, sociodemograficoConfig?.tamanosHogar), [sociodemografico, sociodemograficoConfig])

  const totalParticipantes = participantes?.length || 0

  return (
    <div className="space-y-8">
      {/* Block A */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Contexto Territorial</h2>
        <p className="text-slate-500 mb-6">Indicadores oficiales de referencia para el análisis de los resultados. Cifras externas extraídas de fuentes oficiales.</p>
        {renderContextIndicators()}
      </section>

      <hr className="border-slate-200" />

      {/* Block B */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Users className="text-cyan-600" /> Distribución por Edad
        </h2>
        <p className="text-slate-500 mb-6">Agrupación etaria de los participantes. Datos agregados para protección de privacidad.</p>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          {!hasSocio ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
               <Info className="text-slate-400 mb-3" size={32} />
               <p className="text-sm">Gráfico pendiente. Se generará automáticamente al cargar los datos demográficos en la línea base.</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={edadData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                    formatter={(value) => [`${value} participantes (${((value / totalParticipantes) * 100).toFixed(1)}%)`, 'Cantidad']}
                  />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                    {edadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#06b6d4' : '#0891b2'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Block C */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Variables Socioeconómicas</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Educación */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <GraduationCap className="text-cyan-600" size={20} /> Nivel Educativo
            </h3>
            <p className="text-sm text-slate-500 mb-6">Máximo nivel educativo alcanzado por los participantes.</p>
            
            <div className="flex-1 min-h-[300px]">
              {!hasSocio ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                   <p className="text-sm">Datos pendientes</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eduData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                      formatter={(value) => [value, 'Cantidad']}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Hogar */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Home className="text-cyan-600" size={20} /> Composición del Hogar
              </h3>
              {hasSocio && sociodemografico?.personas_hogar?.promedio && (
                <span className="bg-cyan-50 text-cyan-700 font-bold px-3 py-1 rounded-full text-sm">
                  Promedio: {sociodemografico.personas_hogar.promedio}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-6">Cantidad de personas que conviven en el hogar del participante.</p>
            
            <div className="flex-1 min-h-[300px]">
              {!hasSocio ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                   <p className="text-sm">Datos pendientes</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hogarData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                      formatter={(value) => [value, 'Cantidad']}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
