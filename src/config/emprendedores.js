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
    edadRangos: ["15-17", "18-21", "22-25", "26-28", "29+", "Sin dato"],
    sexoCategorias: ["Femenino", "Masculino", "Sin dato"],
    zonaCategorias: ["Urbana", "Rural", "Sin dato"],
    jefeHogarCategorias: ["Si", "No", "Sin dato"],
    soportesCategorias: ["COMPLETO", "INCOMPLETO", "Sin dato"],
    nivelesEducativos: ["Primaria", "Secundaria", "Media", "Técnica", "Tecnológica", "Profesional", "Posgrado", "Sin dato"],
    tamanosHogar: ["1 a 2 personas", "3 a 4 personas", "5 o más personas", "Sin dato"]
  },
  perfiles: {
    grupoPoblacional: {
      n: 40,
      datos: [
        { name: "Ninguna condición", value: 24, percent: 60.0 },
        { name: "Jefatura de hogar", value: 7, percent: 17.5 },
        { name: "Pertenencia étnica", value: 5, percent: 12.5 },
        { name: "Reconocimiento como víctima", value: 3, percent: 7.5 },
        { name: "LGBTIQ+", value: 1, percent: 2.5 }
      ]
    },
    actividadEconomica: {
      n: 40,
      datos: [
        { name: "Belleza y cuidado personal", value: 13, percent: 32.5 },
        { name: "Alimentos y bebidas", value: 7, percent: 17.5 },
        { name: "Otra / por precisar", value: 7, percent: 17.5 },
        { name: "Comercio", value: 6, percent: 15.0 },
        { name: "Tecnología / digital", value: 4, percent: 10.0 },
        { name: "Confecciones / artesanías", value: 2, percent: 5.0 },
        { name: "Cultura / industrias creativas", value: 1, percent: 2.5 }
      ]
    },
    antiguedad: {
      n: 40,
      datos: [
        { name: "Menos de 6 meses", value: 13, percent: 43.3 },
        { name: "6 meses a 1 año", value: 8, percent: 26.7 },
        { name: "1 a 3 años", value: 5, percent: 16.7 },
        { name: "3 a 5 años", value: 1, percent: 3.3 },
        { name: "Más de 5 años", value: 3, percent: 10.0 },
        { name: "Sin dato", value: 10, percent: 0 }
      ]
    },
    ingresos: {
      n: 40,
      datos: [
        { name: "Genera ingresos", si: 24, siPercent: 80.0, no: 6, noPercent: 20.0, sinDato: 10 },
        { name: "Puede demostrar ingresos", si: 22, siPercent: 73.3, no: 8, noPercent: 26.7, sinDato: 10 }
      ]
    }
  }
}
