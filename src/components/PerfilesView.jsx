import { usePopulation } from '../context/PopulationContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Info, AlertCircle } from 'lucide-react'
import FuenteDato from './shared/FuenteDato'

export default function PerfilesView() {
  const { selectedPopulationId, activeConfig } = usePopulation()
  const perfiles = activeConfig?.perfiles

  if (!perfiles) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
         <Info className="text-slate-400 mb-3" size={32} />
         <p className="text-sm">Datos de perfil pendientes para esta población.</p>
      </div>
    )
  }

  const isEmprendedores = selectedPopulationId === 'emprendedores'

  const renderHorizontalBar = (dataKey, data, n) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 mb-6">{dataKey === 'actividadEconomica' ? 'Líneas de Actividad Económica' : 'Líneas Temáticas de Iniciativas'}</h3>
      <div className="flex-grow h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={150} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px' }}
              formatter={(value, name, props) => [`${value} participantes (${props.payload.percent}%)`, 'Cantidad']}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <FuenteDato fuente="Informe de caracterización" fecha="agosto 2026" n={n} />
    </div>
  )

  const renderVerticalBar = (title, data, n) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 mb-6">{title}</h3>
      <div className="flex-grow h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" />
            <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px' }}
              formatter={(value, name, props) => [`${value} (${props.payload.percent}%)`, 'Cantidad']}
            />
            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#34d399'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <FuenteDato fuente="Informe de caracterización" fecha="agosto 2026" n={n} />
    </div>
  )

  const renderStackedGroupedBar = (title, data, n) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 mb-6">{title}</h3>
      <div className="flex-grow h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px' }}
              formatter={(value, name, props) => [`${value} (${name === 'Sí' ? props.payload.siPercent : props.payload.noPercent}%)`, name]}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="si" name="Sí" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="no" name="No" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <FuenteDato fuente="Informe de caracterización" fecha="agosto 2026" n={n} />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800">
          {isEmprendedores ? 'Perfil de los Emprendimientos (Puerto Boyacá)' : 'Perfil de las Iniciativas Emprendedoras (Puerto Serviez)'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Análisis detallado según el levantamiento de información territorial.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LÍNEAS TEMÁTICAS / ACTIVIDAD ECONÓMICA */}
        {isEmprendedores ? 
          renderHorizontalBar('actividadEconomica', perfiles.actividadEconomica.datos, perfiles.actividadEconomica.n) 
          : 
          renderHorizontalBar('lineasTematicas', perfiles.lineasTematicas.datos, perfiles.lineasTematicas.n)
        }

        {/* ANTIGÜEDAD */}
        {isEmprendedores ? (
          renderVerticalBar('Antigüedad de los Emprendimientos', perfiles.antiguedad.datos, perfiles.antiguedad.n)
        ) : (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-16 text-slate-500">
            <AlertCircle className="text-slate-300 mb-3" size={32} />
            <p className="text-sm font-medium text-slate-600">No aplica para esta población</p>
            <p className="text-xs text-center text-slate-400 mt-2 max-w-sm">Al ser un componente formativo y estar en fase de ideación, estas iniciativas no reportan antigüedad operativa ni ingresos consolidados.</p>
          </div>
        )}

        {/* INGRESOS */}
        {isEmprendedores ? (
          renderStackedGroupedBar('Generación y Soporte de Ingresos', perfiles.ingresos.datos, perfiles.ingresos.n)
        ) : (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-16 text-slate-500">
            <AlertCircle className="text-slate-300 mb-3" size={32} />
            <p className="text-sm font-medium text-slate-600">No aplica para esta población</p>
            <p className="text-xs text-center text-slate-400 mt-2 max-w-sm">Al ser un componente formativo y estar en fase de ideación, estas iniciativas no reportan antigüedad operativa ni ingresos consolidados.</p>
          </div>
        )}
      </div>
    </div>
  )
}
