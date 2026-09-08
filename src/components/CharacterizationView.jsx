import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Info, Users, GraduationCap } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'
import indicadoresContexto from '../config/indicadores-contexto.json'
import useIsMobile from '../hooks/useIsMobile'
import FuenteDato from './shared/FuenteDato'
import MapBoyaca from './MapBoyaca'
import GrupoPoblacional from './GrupoPoblacional'

export default function CharacterizationView() {
  const { activeConfig, activeData } = usePopulation()
  const { sociodemografico, participantes } = activeData
  const { sociodemograficoConfig } = activeConfig
  const isMobile = useIsMobile()
  const [piramideTerritorio, setPiramideTerritorio] = useState('Todos')

  // Block A: Context Indicators
  const renderContextIndicators = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {indicadoresContexto.map(ind => {
          const isEmpty = ind.valor === null || ind.valor === undefined || ind.valor === ""
          return (
            <div key={ind.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{ind.territorio}</p>
                <h3 className="text-sm font-bold text-slate-800 leading-tight mt-1 mb-2">{ind.nombre}</h3>
              </div>
              <div className="mt-2 mb-2">
                {isEmpty ? (
                  <div className="flex items-center gap-2 text-slate-400 bg-slate-50 p-2 rounded border border-dashed border-slate-200">
                    <Info size={16} />
                    <span className="text-xs italic">Pendiente de cargar</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-cyan-600">{ind.valor}</span>
                    <span className="text-sm font-semibold text-cyan-700">{ind.unidad}</span>
                  </div>
                )}
              </div>
              <FuenteDato fuente={ind.fuente} fecha={ind.fecha} />
            </div>
          )
        })}
      </div>
    )
  }

  // Helper to format simple charts
  const hasData = participantes && participantes.length > 0
  const hasSocio = sociodemografico && Object.keys(sociodemografico).length > 0

  const territoriosDisp = useMemo(() => {
    if (!hasSocio || !sociodemografico.piramide) return ['Todos']
    return Object.keys(sociodemografico.piramide)
  }, [hasSocio, sociodemografico])

  // Derived Data
  const piramideData = useMemo(() => {
    if (!sociodemografico?.piramide || !sociodemograficoConfig?.edadRangos) return []
    const territoryData = sociodemografico.piramide[piramideTerritorio] || {}
    
    return sociodemograficoConfig.edadRangos.map(rango => {
      const counts = territoryData[rango] || { "Femenino": 0, "Masculino": 0 }
      // In a pyramid, one side is negative, one is positive.
      return {
        name: rango,
        Femenino: counts["Femenino"] || 0,
        Masculino: -(counts["Masculino"] || 0)
      }
    })
  }, [sociodemografico, sociodemograficoConfig, piramideTerritorio])


  const totalParticipantes = (participantes && piramideTerritorio === 'Todos') ? participantes.length : (participantes?.filter(p => p.territorio === piramideTerritorio)?.length || 0)

  return (
    <div className="space-y-8">
      {/* Block A */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Contexto Territorial</h2>
        <p className="text-slate-500 mb-6">Indicadores oficiales de referencia nacional y departamental.</p>
        {renderContextIndicators()}
      </section>

      <hr className="border-slate-200" />

      {/* Block - Territorial and Population */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MapBoyaca />
        <GrupoPoblacional />
      </section>

      <hr className="border-slate-200" />

      {/* Block B */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Users className="text-cyan-600" /> Distribución por Edad
            </h2>
            <p className="text-slate-500">Pirámide poblacional agrupada.</p>
          </div>
          {hasSocio && (
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-slate-600 mb-1">Segmentar por Territorio:</label>
              <select 
                className="block w-full md:w-48 rounded-md border-slate-300 bg-white text-slate-800 shadow-sm py-2 px-3 border focus:ring focus:ring-cyan-500 focus:border-cyan-500"
                value={piramideTerritorio}
                onChange={e => setPiramideTerritorio(e.target.value)}
              >
                {territoriosDisp.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          {!hasSocio ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
               <Info className="text-slate-400 mb-3" size={32} />
               <p className="text-sm">Gráfico pendiente.</p>
            </div>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={piramideData} layout="vertical" stackOffset="sign" margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => Math.abs(value)}
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                    formatter={(value, name) => [Math.abs(value), name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Masculino" stackId="stack" fill="#3b82f6" radius={[4, 0, 0, 4]} />
                  <Bar dataKey="Femenino" stackId="stack" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <FuenteDato fuente="Listado Excel consolidado" fecha="Septiembre 2026" n={totalParticipantes} />
        </div>
      </section>
    </div>
  )
}
