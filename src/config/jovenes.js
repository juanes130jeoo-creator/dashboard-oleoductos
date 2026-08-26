import { Target, Users, DollarSign, Briefcase, Zap, Star, Shield, Cpu } from 'lucide-react'

export const config = {
  id: 'jovenes',
  nombre: 'Jóvenes estudiantes (Puerto Serviez)',
  instrumento: 'Evaluación de Jóvenes Estudiantes (Por definir)',
  hasMap: false,
  escala: {
    min: 0,
    max: 5
  },
  niveles: [
    { max: 0.39, label: 'Nivel Inicial', color: 'bg-red-100 text-red-700 border-red-200', hex: '#ef4444' },
    { max: 0.59, label: 'Nivel Básico', color: 'bg-orange-100 text-orange-700 border-orange-200', hex: '#f97316' },
    { max: 0.79, label: 'Nivel Intermedio', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', hex: '#eab308' },
    { max: 0.89, label: 'Nivel Avanzado', color: 'bg-green-100 text-green-700 border-green-200', hex: '#22c55e' },
    { max: 1.00, label: 'Nivel Sobresaliente', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', hex: '#10b981' }
  ],
  dimensiones: [
    "Dimensión A — por definir",
    "Dimensión B — por definir",
    "Dimensión C — por definir"
  ],
  dimensionTooltips: {
    "Dimensión A — por definir": "Descripción pendiente",
    "Dimensión B — por definir": "Descripción pendiente",
    "Dimensión C — por definir": "Descripción pendiente"
  },
  dimensionIcons: {
    "Dimensión A — por definir": Target,
    "Dimensión B — por definir": Zap,
    "Dimensión C — por definir": Star
  },
  dimensionShortNames: {
    "Dimensión A — por definir": "Dim A",
    "Dimensión B — por definir": "Dim B",
    "Dimensión C — por definir": "Dim C"
  },
  sociodemograficoConfig: {
    edadRangos: ["Menor de 14 años", "14-15 años", "16-17 años", "18-19 años", "20 o más años"],
    nivelesEducativos: ["Básica Primaria", "Básica Secundaria", "Media", "Técnica", "Tecnológica"],
    tamanosHogar: ["1 a 2 personas", "3 a 4 personas", "5 o más personas"]
  }
}
