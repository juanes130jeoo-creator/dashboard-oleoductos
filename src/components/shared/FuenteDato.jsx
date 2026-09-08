import { Info } from 'lucide-react'

export default function FuenteDato({ fuente, fecha, n }) {
  return (
    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
      <Info size={12} className="text-slate-300 shrink-0" />
      <span>
        <strong className="font-medium text-slate-500">Fuente:</strong> {fuente}, {fecha} {n ? `(n=${n})` : ''}
      </span>
    </div>
  )
}
