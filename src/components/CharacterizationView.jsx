import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Info, Users, GraduationCap, Home, MapPin, User, FileCheck, Layers } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'
import indicadoresContexto from '../config/indicadores-contexto.json'
import useIsMobile from '../hooks/useIsMobile'

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
              <div className="text-[10px] text-slate-400 mt-auto border-t border-slate-100 pt-2 flex flex-col xl:flex-row justify-between gap-1">
                <span>Fte: {ind.fuente}</span>
                <span>Año: {ind.fecha}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Helper to format simple charts
  const formatChartData = (dataObj, orderArray) => {
    if (!dataObj) return []
    const keys = orderArray || Object.keys(dataObj).filter(k => k !== 'promedio')
    return keys.map(k => ({
      name: k,
      value: dataObj[k] || 0
    }))
  }

  const hasData = participantes && participantes.length > 0
  const hasSocio = sociodemografico && Object.keys(sociodemografico).length > 0

  const territoriosDisp = useMemo(() => {
    if (!hasSocio || !sociodemografico.edad) return ['Todos']
    return Object.keys(sociodemografico.edad)
  }, [hasSocio, sociodemografico])

  // Derived Data
  const edadData = useMemo(() => formatChartData(sociodemografico?.edad?.[piramideTerritorio], sociodemograficoConfig?.edadRangos), [sociodemografico, sociodemograficoConfig, piramideTerritorio])
  const sexoData = useMemo(() => formatChartData(sociodemografico?.sexo?.[piramideTerritorio], sociodemograficoConfig?.sexoCategorias), [sociodemografico, sociodemograficoConfig, piramideTerritorio])
  const zonaData = useMemo(() => formatChartData(sociodemografico?.zona?.[piramideTerritorio], sociodemograficoConfig?.zonaCategorias), [sociodemografico, sociodemograficoConfig, piramideTerritorio])
  const jefeData = useMemo(() => formatChartData(sociodemografico?.jefe_hogar?.[piramideTerritorio], sociodemograficoConfig?.jefeHogarCategorias), [sociodemografico, sociodemograficoConfig, piramideTerritorio])
  const soportesData = useMemo(() => formatChartData(sociodemografico?.estado_soportes?.[piramideTerritorio], sociodemograficoConfig?.soportesCategorias), [sociodemografico, sociodemograficoConfig, piramideTerritorio])

  const totalParticipantes = (participantes && piramideTerritorio === 'Todos') ? participantes.length : (participantes?.filter(p => p.territorio === piramideTerritorio)?.length || 0)

  const ChartCard = ({ title, icon: Icon, desc, data, dataKey = "value", color = "#06b6d4" }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
        <Icon className="text-cyan-600" size={20} /> {title}
      </h3>
      {desc && <p className="text-sm text-slate-500 mb-6">{desc}</p>}
      
      <div className="flex-1 min-h-[250px]">
        {!hasSocio ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
             <p className="text-sm">Datos pendientes</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                formatter={(value) => [value, 'Cantidad']}
              />
              <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Block A */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Contexto Territorial</h2>
        <p className="text-slate-500 mb-6">Indicadores oficiales de referencia nacional y departamental.</p>
        {renderContextIndicators()}
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
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Layers className="text-cyan-600" /> Perfil Demográfico y Gestión
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Distribución por Sexo" icon={User} data={sexoData} color="#8b5cf6" />
          <ChartCard title="Ubicación" icon={MapPin} data={zonaData} color="#10b981" />
          <ChartCard title="Jefatura de Hogar" icon={Home} data={jefeData} color="#f59e0b" />
          <ChartCard title="Estado de Soportes" icon={FileCheck} data={soportesData} color="#3b82f6" />
        </div>
      </section>
    </div>
  )
}
