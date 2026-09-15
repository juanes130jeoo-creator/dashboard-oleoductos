import { useState, useMemo } from 'react'
import { Info, Download, ArrowUpDown } from 'lucide-react'
import { usePopulation } from '../context/PopulationContext'
import matrices from '../data/control_gestion_matrices.json'
import FuenteDato from './shared/FuenteDato'

export default function ControlGestion() {
  const { selectedPopulationId } = usePopulation()
  
  const isEmprendedores = selectedPopulationId === 'emprendedores'
  const data = isEmprendedores ? matrices.emprendedores : matrices.jovenes
  const n = isEmprendedores ? 30 : 20
  const fuente = `Matriz de seguimiento del programa`

  const hasData = data && data.length > 0

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedData = useMemo(() => {
    if (!hasData) return []
    let sortableItems = [...data]
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key]
        let valB = b[sortConfig.key]
        
        // Handling Nº parsing
        if (sortConfig.key === 'Nº') {
          valA = parseInt(valA, 10) || 0
          valB = parseInt(valB, 10) || 0
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortableItems
  }, [data, sortConfig, hasData])

  const exportCSV = () => {
    if (!hasData) return
    const columns = isEmprendedores 
      ? ["Nº", "Nombre del emprendedor", "Emprendimiento", "Diagnóstico inicial", "Taller 1", "Taller 2", "Taller 3", "Taller 4", "Taller 5", "Taller 6", "% asistencia talleres", "Horas acompañamiento realizadas"]
      : ["Nº", "Nombre del joven", "Idea / modelo de negocio", "Taller 1: Mentalidad emprendedora", "Taller 2: Identificación de oportunidades", "Taller 3: Modelo de negocio Canvas", "% asistencia talleres", "Horas acompañamiento realizadas"]

    const headers = columns.join(",")
    const rows = sortedData.map(row => 
      columns.map(col => `"${(row[col] ?? '').toString().replace(/"/g, '""')}"`).join(",")
    ).join("\n")

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `seguimiento_${selectedPopulationId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatPercent = (val) => {
    if (val == null) return "0.0%"
    return (val * 100).toFixed(1) + "%"
  }

  const renderCellStatus = (val) => {
    if (val === "Pendiente") return <span className="text-slate-400 italic">Pendiente</span>
    if (val === "Sí") return <span className="text-emerald-600 font-medium">Sí</span>
    if (val === "No") return <span className="text-rose-500 font-medium">No</span>
    return val || <span className="text-slate-400 italic">Pendiente</span>
  }
  
  // Asistencia Taller 1 calculation
  const t1Key = isEmprendedores ? "Taller 1" : "Taller 1: Mentalidad emprendedora"
  const t1Asistencias = data.filter(d => d[t1Key] === "Sí").length
  const t1Perc = n > 0 ? (t1Asistencias / n * 100).toFixed(1) : "0.0"

  // Horas acumuladas calculation (max of all non-empty hours)
  const maxHoras = data.reduce((acc, curr) => {
    const hrs = parseFloat(curr["Horas acompañamiento realizadas"]) || 0
    return Math.max(acc, hrs)
  }, 0)

  const empCols = [
    { key: "Nº", label: "Nº", sortable: true },
    { key: "Nombre del emprendedor", label: "Nombre del emprendedor", sortable: false },
    { key: "Emprendimiento", label: "Emprendimiento", sortable: false },
    { key: "Diagnóstico inicial", label: "Diagnóstico inicial", sortable: false },
    { key: "Taller 1", label: "Taller 1", sortable: false },
    { key: "Taller 2", label: "Taller 2", sortable: false },
    { key: "Taller 3", label: "Taller 3", sortable: false },
    { key: "Taller 4", label: "Taller 4", sortable: false },
    { key: "Taller 5", label: "Taller 5", sortable: false },
    { key: "Taller 6", label: "Taller 6", sortable: false },
    { key: "% asistencia talleres", label: "% asistencia", sortable: true },
    { key: "Horas acompañamiento realizadas", label: "Horas acum.", sortable: true }
  ]

  const jovCols = [
    { key: "Nº", label: "Nº", sortable: true },
    { key: "Nombre del joven", label: "Nombre del joven", sortable: false },
    { key: "Idea / modelo de negocio", label: "Idea / modelo de negocio", sortable: false },
    { key: "Taller 1: Mentalidad emprendedora", label: "Taller 1", sortable: false },
    { key: "Taller 2: Identificación de oportunidades", label: "Taller 2", sortable: false },
    { key: "Taller 3: Modelo de negocio Canvas", label: "Taller 3", sortable: false },
    { key: "% asistencia talleres", label: "% asistencia", sortable: true },
    { key: "Horas acompañamiento realizadas", label: "Horas acum.", sortable: true }
  ]

  const columns = isEmprendedores ? empCols : jovCols

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
         <Info className="text-slate-400 mb-3" size={32} />
         <p className="text-sm">No hay datos de matriz cargados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Control de Gestión (Ruta)</h2>
          <p className="text-slate-500">
            Seguimiento a las actividades y talleres de los participantes seleccionados.
          </p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <h3 className="text-slate-500 font-medium mb-1">Asistencia Taller 1</h3>
          <p className="text-3xl font-bold text-cyan-600">{t1Perc}%</p>
          <p className="text-sm text-slate-500 mt-1">{t1Asistencias} de {n} participantes</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <h3 className="text-slate-500 font-medium mb-1">Horas Acumuladas</h3>
          <p className="text-3xl font-bold text-emerald-600">{maxHoras}</p>
          <p className="text-sm text-slate-500 mt-1">horas de acompañamiento por sesión completada</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-max">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                {columns.map(col => (
                  <th 
                    key={col.key} 
                    className={`py-3 px-4 font-semibold ${col.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                    onClick={() => col.sortable ? requestSort(col.key) : null}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <ArrowUpDown size={14} className="text-slate-400" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  {columns.map(col => {
                    const val = row[col.key]
                    let content = val
                    if (col.key === "% asistencia talleres") {
                      content = formatPercent(val)
                    } else if (col.key.startsWith("Taller") || col.key.startsWith("Diagn")) {
                      content = renderCellStatus(val)
                    }
                    return (
                      <td key={col.key} className="py-3 px-4 text-slate-700">
                        {content}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-slate-500 italic mt-2">Los talleres sin registro aún no se han realizado.</p>
      
      <FuenteDato fuente={fuente} n={n} />
    </div>
  )
}
