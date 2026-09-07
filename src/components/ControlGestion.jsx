import { useState, useMemo } from 'react'
import { Info, Download, AlertTriangle } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'

export default function ControlGestion() {
  const { activeData } = usePopulation()
  const { control_gestion } = activeData
  
  const hasData = control_gestion && control_gestion.length > 0
  const [filterTerritorio, setFilterTerritorio] = useState('')
  const [filterSoportes, setFilterSoportes] = useState('')

  const territorios = useMemo(() => {
    if (!hasData) return []
    return [...new Set(control_gestion.map(e => e.territorio))].filter(Boolean).sort()
  }, [control_gestion, hasData])

  const soportes = useMemo(() => {
    if (!hasData) return []
    return [...new Set(control_gestion.map(e => e.estado_soportes))].filter(Boolean).sort()
  }, [control_gestion, hasData])

  const filteredData = useMemo(() => {
    if (!hasData) return []
    return control_gestion.filter(row => {
      const matchTerritorio = filterTerritorio ? row.territorio === filterTerritorio : true
      const matchSoportes = filterSoportes ? row.estado_soportes === filterSoportes : true
      return matchTerritorio && matchSoportes
    })
  }, [control_gestion, filterTerritorio, filterSoportes, hasData])

  const exportCSV = () => {
    if (!hasData) return
    const headers = ['Código Anónimo', 'Nombre', 'Territorio', 'Formato 1', 'Formato 2', 'Estado Soportes', 'Observación Pendiente']
    
    const rows = filteredData.map(row => [
      row.codigo,
      `"${row.nombre}"`,
      `"${row.territorio}"`,
      `"${row.formato_1}"`,
      `"${row.formato_2}"`,
      `"${row.estado_soportes}"`,
      row.tiene_observacion ? 'SÍ' : 'NO'
    ])
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "control_gestion_anonimizado.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Control de Gestión</h2>
          <p className="text-sm md:text-base text-slate-500">Vista anonimizada para seguimiento de soportes y formatos.</p>
        </div>
        <div className="flex flex-wrap items-end gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <label className="block text-xs md:text-sm font-medium text-slate-600 mb-1">Territorio</label>
            <select 
              className="block w-full md:w-48 rounded-md border-slate-300 bg-white text-slate-800 shadow-sm py-2 px-3 border focus:ring focus:ring-cyan-500 focus:border-cyan-500 min-h-[44px]"
              value={filterTerritorio}
              onChange={e => setFilterTerritorio(e.target.value)}
              disabled={!hasData}
            >
              <option value="">Todos</option>
              {territorios.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1 md:flex-none">
            <label className="block text-xs md:text-sm font-medium text-slate-600 mb-1">Estado Soportes</label>
            <select 
              className="block w-full md:w-48 rounded-md border-slate-300 bg-white text-slate-800 shadow-sm py-2 px-3 border focus:ring focus:ring-cyan-500 focus:border-cyan-500 min-h-[44px]"
              value={filterSoportes}
              onChange={e => setFilterSoportes(e.target.value)}
              disabled={!hasData}
            >
              <option value="">Todos</option>
              {soportes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={exportCSV} disabled={!hasData} className="flex items-center justify-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 transition-colors min-h-[44px] w-full md:w-auto disabled:opacity-50">
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
        <div className="flex items-start">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5 mr-3" size={20} />
          <div>
            <h3 className="text-sm font-bold text-amber-800">Privacidad y Protección de Datos</h3>
            <p className="text-sm text-amber-700 mt-1">
              Bajo autorización explícita para este tablero, se incluye el Nombre de los participantes para control de gestión. El resto de datos personales sensibles (Identificación, Teléfono, Correo, etc.) siguen estrictamente excluidos.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-slate-50">
             <Info className="text-slate-400 mb-3" size={32} />
             <p className="text-sm">Aquí se mostrará la tabla de control de gestión una vez se carguen los datos.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Territorio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Formato 1</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Formato 2</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Soportes</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">¿Observación?</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900">{row.codigo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">{row.nombre}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{row.territorio}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{row.formato_1 || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{row.formato_2 || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                    <span className={row.estado_soportes?.toUpperCase() === 'COMPLETO' ? 'text-green-600' : 'text-amber-600'}>
                      {row.estado_soportes}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {row.tiene_observacion ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        SÍ
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        NO
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">No hay registros que coincidan con los filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
