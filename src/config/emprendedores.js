import { Target, Users, DollarSign, Briefcase, Zap, Star, Shield, Cpu } from 'lucide-react'

export const config = {
  id: 'emprendedores',
  nombre: 'Emprendedores / empresarios en acompañamiento',
  instrumento: 'Evaluación de Emprendedores (Por definir)',
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
    "Dimensión 1 — por definir",
    "Dimensión 2 — por definir",
    "Dimensión 3 — por definir",
    "Dimensión 4 — por definir"
  ],
  dimensionTooltips: {
    "Dimensión 1 — por definir": "Descripción pendiente",
    "Dimensión 2 — por definir": "Descripción pendiente",
    "Dimensión 3 — por definir": "Descripción pendiente",
    "Dimensión 4 — por definir": "Descripción pendiente"
  },
  dimensionIcons: {
    "Dimensión 1 — por definir": Users,
    "Dimensión 2 — por definir": DollarSign,
    "Dimensión 3 — por definir": Briefcase,
    "Dimensión 4 — por definir": Shield
  },
  dimensionShortNames: {
    "Dimensión 1 — por definir": "Dim 1",
    "Dimensión 2 — por definir": "Dim 2",
    "Dimensión 3 — por definir": "Dim 3",
    "Dimensión 4 — por definir": "Dim 4"
  },
  sociodemograficoConfig: {
    edadRangos: ["18-25 años", "26-35 años", "36-45 años", "46-55 años", "56+ años"],
    nivelesEducativos: ["Primaria", "Secundaria", "Media", "Técnica", "Tecnológica", "Profesional", "Posgrado"],
    tamanosHogar: ["1 a 2 personas", "3 a 4 personas", "5 o más personas"]
  }
}
