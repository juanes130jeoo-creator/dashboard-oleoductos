const MUNICIPIO_A_SUBREGION = {
    "ANDES": "Suroeste",
    "ANGOSTURA": "Norte",
    "APARTADÓ": "Urabá",
    "BELLO": "Valle de Aburrá",
    "CAUCASIA": "Bajo Cauca",
    "CIUDAD BOLÍVAR": "Suroeste",
    "COPACABANA": "Valle de Aburrá",
    "EL BAGRE": "Bajo Cauca",
    "EL PEÑOL": "Oriente",
    "ENVIGADO": "Valle de Aburrá",
    "GIRARDOTA": "Valle de Aburrá",
    "ITAGÜÍ": "Valle de Aburrá",
    "MEDELLÍN": "Valle de Aburrá",
    "MUTATÁ": "Urabá",
    "PUERTO NARE": "Magdalena Medio",
    "RIONEGRO": "Oriente",
    "SABANETA": "Valle de Aburrá",
    "SAN PEDRO DE LOS MILAGROS": "Norte",
    "SANTA BÁRBARA": "Suroeste",
    "SANTA ROSA DE OSOS": "Norte",
    "TURBO": "Urabá",
}

const normalMap = {}
for (const [m, s] of Object.entries(MUNICIPIO_A_SUBREGION)) {
    // Clave sin tildes (útil por si el GeoJSON no tiene tildes)
    const normKey = m.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    normalMap[normKey] = s
    // Clave original en mayúsculas (por si acaso)
    normalMap[m.toUpperCase()] = s
}

export const getSubregion = (municipio) => {
  if (!municipio) return 'Sin dato'
  const query = municipio.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return normalMap[query] || 'Sin dato'
}
