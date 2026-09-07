import { useState, useMemo } from 'react'
import { ArrowUpDown, Download, Info } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'

export default function Ranking() {
  const { activeConfig, activeData } = usePopulation()
  const { participantes } = activeData
  const { dimensiones, dimensionShortNames, niveles } = activeConfig
  const hasData = participantes && participantes.length > 0

  const [sortConfig, setSortConfig] = useState({ key: 'ranking', direction: 'asc' })
  const [filterTerritorio, setFilterTerritorio] = useState('')

  const territorios = useMemo(() => {
    if (!hasData) return []
    return [...new Set(participantes.map(e => e.territorio))].filter(Boolean).sort()
  }, [participantes, hasData])

  const hasCierre = useMemo(() => {
    if (!hasData) return false
    return participantes.some(p => p.mediciones?.cierre?.cumplimiento_total != null)
  }, [participantes, hasData])

  const getMaturityLevel = (score) => {
    return niveles.find(l => score <= l.max) || niveles[niveles.length - 1]
  }

  const sortedData = useMemo(() => {
    if (!hasData) return []
    let sortableItems = [...participantes]
    if (filterTerritorio) {
      sortableItems = sortableItems.filter(e => e.territorio === filterTerritorio)
    }

    sortableItems.sort((a, b) => {
      let aValue = 0
      let bValue = 0

      if (sortConfig.key === 'ranking') {
         aValue = a.mediciones?.linea_base?.cumplimiento_total || 0
         bValue = b.mediciones?.linea_base?.cumplimiento_total || 0
      } else if (sortConfig.key === 'nombre' || sortConfig.key === 'territorio' || sortConfig.key === 'entidad') {
         aValue = a[sortConfig.key] || ''
         bValue = b[sortConfig.key] || ''
      } else if (sortConfig.key === 'cierre_total') {
         aValue = a.mediciones?.cierre?.cumplimiento_total || 0
         bValue = b.mediciones?.cierre?.cumplimiento_total || 0
      } else if (sortConfig.key === 'delta') {
         const aLb = a.mediciones?.linea_base?.cumplimiento_total || 0
         const aCi = a.mediciones?.cierre?.cumplimiento_total || aLb
         aValue = aCi - aLb
         const bLb = b.mediciones?.linea_base?.cumplimiento_total || 0
         const bCi = b.mediciones?.cierre?.cumplimiento_total || bLb
         bValue = bCi - bLb
      } else if (dimensiones.includes(sortConfig.key)) {
        aValue = a.mediciones?.linea_base?.promedios_dimensiones?.[sortConfig.key] || 0
        bValue = b.mediciones?.linea_base?.promedios_dimensiones?.[sortConfig.key] || 0
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sortableItems
  }, [participantes, sortConfig, filterTerritorio, dimensiones, hasData])

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const exportCSV = () => {
    if (!hasData) return
    const headers = ['Posición (LB)', 'Código', 'Territorio', 'Entidad / Org.', 'Nivel (Actual)', 'Cumplimiento LB']
    if (hasCierre) {
      headers.push('Cumplimiento Cierre', 'Variación')
    }
    dimensiones.forEach(d => headers.push(d + ' (LB)'))

    const rows = sortedData.map((emp, idx) => {
      const lb = emp.mediciones?.linea_base?.cumplimiento_total || 0
      const cierre = emp.mediciones?.cierre?.cumplimiento_total
      const currentScore = cierre != null ? cierre : lb
      const level = getMaturityLevel(currentScore)
      
      const row = [
        idx + 1,
        `"${emp.id}"`,
        `"${emp.territorio || ''}"`,
        `"${emp.entidad || ''}"`,
        `"${level.label}"`,
        (lb * 100).toFixed(1) + '%'
      ]
      
      if (hasCierre) {
        row.push(
          cierre != null ? (cierre * 100).toFixed(1) + '%' : 'N/A',
          cierre != null ? ((cierre - lb) * 100).toFixed(1) + '%' : 'N/A'
        )
      }

      dimensiones.forEach(d => {
        const dScore = emp.mediciones?.linea_base?.promedios_dimensiones?.[d] || 0
        row.push(dScore.toFixed(2))
      })

      return row
    })
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "ranking_participantes.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const Th = ({ label, sortKey, title, className = "" }) => (
    <th 
      title={title}
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors ${className}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className={sortConfig.key === sortKey ? "text-cyan-600" : "text-slate-300"} />
      </div>
    </th>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Ranking Global</h2>
          <p className="text-sm md:text-base text-slate-500">Listado completo de participantes. Incluye línea base y medición de cierre si está disponible.</p>
        </div>
        <div className="flex flex-wrap items-end gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <label className="block text-xs md:text-sm font-medium text-slate-600 mb-1">Filtrar por Territorio</label>
            <select 
              className="block w-full md:w-64 rounded-md border-slate-300 bg-white text-slate-800 shadow-sm py-2 px-3 border focus:ring focus:ring-cyan-500 focus:border-cyan-500 min-h-[44px]"
              value={filterTerritorio}
              onChange={e => setFilterTerritorio(e.target.value)}
              disabled={!hasData}
            >
              <option value="">Todos los territorios</option>
              {territorios.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button onClick={exportCSV} disabled={!hasData} className="flex items-center justify-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 transition-colors min-h-[44px] w-full md:w-auto disabled:opacity-50">
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-slate-50">
             <Info className="text-slate-400 mb-3" size={32} />
             <p className="text-sm">Aquí se mostrará el ranking de participantes una vez se cargue la línea base.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th label="Posición" sortKey="ranking" />
                <Th label="Código" sortKey="nombre" />
                <Th label="Territorio" sortKey="territorio" />
                <Th label="Entidad / Org." sortKey="entidad" />
                <Th label="Nivel" sortKey="ranking" />
                <Th label="Línea Base" sortKey="ranking" />
                {hasCierre && <Th label="Cierre" sortKey="cierre_total" />}
                {hasCierre && <Th label="Variación" sortKey="delta" />}
                {dimensiones.map((dim, i) => (
                  <Th key={dim} label={dimensionShortNames?.[dim] || `Dim ${i+1}`} sortKey={dim} title={activeConfig.dimensionTooltips?.[dim]} className="whitespace-nowrap" />
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {sortedData.map((emp, idx) => {
                const lb = emp.mediciones?.linea_base?.cumplimiento_total || 0
                const cierre = emp.mediciones?.cierre?.cumplimiento_total
                const hasEmpCierre = cierre != null
                const currentScore = hasEmpCierre ? cierre : lb
                const delta = hasEmpCierre ? cierre - lb : 0
                const level = getMaturityLevel(currentScore)
                
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900">
                      #{idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-[200px] truncate" title={emp.id}>
                      {emp.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {emp.territorio || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {emp.entidad || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full border border-opacity-50`} style={{backgroundColor: level.hex + '20', color: level.hex, borderColor: level.hex}}>
                        {level.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-600">
                      {(lb * 100).toFixed(1)}%
                    </td>
                    {hasCierre && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-cyan-700">
                        {hasEmpCierre ? (cierre * 100).toFixed(1) + '%' : '—'}
                      </td>
                    )}
                    {hasCierre && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold">
                        {hasEmpCierre ? (
                          <span className={delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-slate-500'}>
                            {delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                    )}
                    {dimensiones.map(dim => {
                      const val = emp.mediciones?.linea_base?.promedios_dimensiones?.[dim] || 0
                      return (
                        <td key={dim} className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-500">
                          {val.toFixed(2)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
