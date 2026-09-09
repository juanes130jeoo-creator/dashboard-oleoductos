import React, { useMemo } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { MapPin } from 'lucide-react'
import boyacaGeo from '../data/boyaca.geo.json'
import FuenteDato from './shared/FuenteDato'

export default function MapBoyaca() {
  // Puerto Boyacá coordinates
  const pbCoords = [-74.5878, 5.9754]
  // Puerto Serviez coordinates (approx)
  const psCoords = [-74.4533, 6.0463]

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
        <MapPin className="text-cyan-600" size={20} /> Presencia Territorial
      </h3>
      <p className="text-sm text-slate-500 mb-4">Distribución geográfica en Boyacá.</p>
      
      <div className="flex-1 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center relative min-h-[300px]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 7000,
            center: [-73.5, 5.8] // Center of Boyaca
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={boyacaGeo}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e2e8f0"
                  stroke="#cbd5e1"
                  strokeWidth={1}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Puerto Boyacá Marker (representing the municipality) */}
          <Marker coordinates={pbCoords}>
            <circle r={8} fill="#06b6d4" stroke="#fff" strokeWidth={2} />
            <text
              textAnchor="end"
              x="-12"
              y="4"
              style={{ fontFamily: "system-ui", fill: "#334155", fontSize: "16px", fontWeight: "bold" }}
            >
              Puerto Boyacá
            </text>
            <text
              textAnchor="end"
              x="-12"
              y="22"
              style={{ fontFamily: "system-ui", fill: "#64748b", fontSize: "14px" }}
            >
              40 participantes
            </text>
          </Marker>

          {/* Puerto Serviez Marker (inside PB) */}
          <Marker coordinates={psCoords}>
            <circle r={6} fill="#f43f5e" stroke="#fff" strokeWidth={2} />
            <text
              textAnchor="start"
              x="10"
              y="4"
              style={{ fontFamily: "system-ui", fill: "#334155", fontSize: "15px", fontWeight: "bold" }}
            >
              Puerto Serviez
            </text>
            <text
              textAnchor="start"
              x="10"
              y="20"
              style={{ fontFamily: "system-ui", fill: "#64748b", fontSize: "13px" }}
            >
              13 participantes
            </text>
          </Marker>
        </ComposableMap>
      </div>
      <FuenteDato fuente="Base consolidada final, Excel del proyecto" fecha="Septiembre 2026" n={53} />
    </div>
  )
}
