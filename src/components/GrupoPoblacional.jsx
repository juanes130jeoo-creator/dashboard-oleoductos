import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users } from 'lucide-react'
import FuenteDato from './shared/FuenteDato'
import { config as configEmprendedores } from '../config/emprendedores'
import { config as configJovenes } from '../config/jovenes'

export default function GrupoPoblacional() {
  const [territorio, setTerritorio] = useState('Puerto Boyacá')

  const empData = configEmprendedores.perfiles?.grupoPoblacional
  const jovData = configJovenes.perfiles?.grupoPoblacional

  const isPB = territorio === 'Puerto Boyacá'
  const activeData = isPB ? (empData?.datos || []) : (jovData?.datos || [])
  const activeN = isPB ? empData?.n : jovData?.n

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Users className="text-cyan-600" size={20} /> Distribución por grupo poblacional
          </h3>
          <p className="text-sm text-slate-500">Características reportadas.</p>
        </div>
        <select 
          className="rounded-md border-slate-300 bg-white text-slate-800 shadow-sm py-1 px-2 border focus:ring focus:ring-cyan-500 text-sm"
          value={territorio}
          onChange={e => setTerritorio(e.target.value)}
        >
          <option value="Puerto Boyacá">Puerto Boyacá</option>
          <option value="Puerto Serviez">Puerto Serviez</option>
        </select>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={160} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
              formatter={(value, name, props) => [`${value} participantes (${props.payload.percent}%)`, 'Cantidad']}
            />
            <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
              {activeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0ea5e9' : '#38bdf8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-[10.5px] text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-100">
        Estas condiciones no son excluyentes entre sí; una misma persona puede reportar más de una característica. Los porcentajes son prevalencias dentro del grupo y no suman 100%.
      </div>
      
      <FuenteDato fuente="Base consolidada final, Excel del proyecto" fecha="Septiembre 2026" n={activeN} />
    </div>
  )
}
