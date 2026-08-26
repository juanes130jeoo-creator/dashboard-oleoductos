import { Target, Users, DollarSign, Briefcase, Zap, Star, Shield, Cpu } from 'lucide-react'

export const MATURITY_LEVELS = [
  { max: 0.39, label: 'Nivel Inicial', color: 'bg-red-100 text-red-700 border-red-200' },
  { max: 0.59, label: 'Nivel Básico', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { max: 0.79, label: 'Nivel Intermedio', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { max: 0.89, label: 'Nivel Avanzado', color: 'bg-green-100 text-green-700 border-green-200' },
  { max: 1.00, label: 'Nivel Sobresaliente', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
]

export const getMaturityLevel = (score) => {
  return MATURITY_LEVELS.find(l => score <= l.max) || MATURITY_LEVELS[MATURITY_LEVELS.length - 1]
}

export const DIMENSION_TOOLTIPS = {
  "BASE ASOCIATIVA CONSOLIDADA": "Mide el nivel de organización, formalización y alineación del equipo emprendedor.",
  "LA EMPRESA ESTA GENERANDO INGRESOS": "Evalúa el modelo de negocio, tracción en ventas y diversificación de ingresos.",
  "LA EMPRESA ESTA GENERANDO EMPLEO FORMALES": "Revisa la calidad, formalidad y proyección del equipo de trabajo.",
  "LA EMPRESA ESTA IMPACTANDO DE MANERA POSITIVA": "Impacto ambiental, social y económico sostenible.",
  "NIVEL DE DIFERENCIACIÓN E INNOVACION": "Grado de novedad del producto/servicio y ventajas competitivas.",
  "ATRIBUTOS O CARACTERISTICAS DEL PRODUCTO": "Calidad, empaque, escalabilidad y madurez tecnológica del producto.",
  "NIVEL DE CUMPLIMIENTO CONNORMATIVA Y REGULACION": "Cumplimiento legal, tributario, registros y certificaciones.",
  "INCORPORACION DE TECNOLOGIA EN LOS PROCESOS": "Uso de herramientas digitales, software y automatización."
}

export const DIMENSION_ICONS = {
  "BASE ASOCIATIVA CONSOLIDADA": Users,
  "LA EMPRESA ESTA GENERANDO INGRESOS": DollarSign,
  "LA EMPRESA ESTA GENERANDO EMPLEO FORMALES": Briefcase,
  "LA EMPRESA CUENTA CON UNA ESTRUCTURA EMPRESARIAL ADECUADA": Shield,
  "LA EMPRESA TIENE IDENTIFICADO UN MERCADO PARA LOS PRODUCTOS": Target,
  "LA EMPRESA TIENE VOLUMEN MENSUAL DE NEGOCIOS": Zap,
  "LA EMPRESA TIENE SOSTENIMIENTO SIN APORTES DE LOS SOCIOS": Cpu,
  "DISEÑO SOSTENIBLE": Star
}

export function getSemaphoreColor(ratio) {
  if (ratio >= 0.8) return '#22c55e' // verde
  if (ratio >= 0.6) return '#eab308' // amarillo
  if (ratio >= 0.4) return '#f97316' // naranja
  return '#ef4444' // rojo
}
