# Dashboard Oleoductos

Dashboard interactivo para visualizar los resultados de evaluación del programa "Oleoductos". Soporta múltiples poblaciones y mediciones en el tiempo (Línea Base y Cierre).

## Arquitectura y Configuración

El proyecto está diseñado para funcionar **sin necesidad de tocar el código fuente de los componentes** cuando se defina el instrumento final. 

### Archivos de Configuración
Existen dos archivos de configuración, uno por cada población:
- `src/config/emprendedores.js`
- `src/config/jovenes.js`

En estos archivos se definen:
- Nombre del instrumento y escalas (`escala.min`, `escala.max`).
- Los niveles de cumplimiento y sus colores.
- Los nombres de las **Dimensiones** (`dimensiones`).
- Si la vista territorial debe mostrar un mapa geográfico (`hasMap`).

### Contrato de Datos (JSON)

Toda la aplicación se alimenta de un único archivo `src/data/data.json`. La estructura debe ser exactamente la siguiente:

```json
{
  "poblaciones": {
    "emprendedores": {
      "sociodemografico": {
        "edad": { "18-25 años": 12, "26-35 años": 30 },
        "nivel_educativo": { "Media completa": 22 },
        "personas_hogar": { "1-2 personas": 5, "promedio": 3.4 }
      },
      "preguntas_por_dimension": {
        "Dimensión 1": ["Pregunta 1.1", "Pregunta 1.2"]
      },
      "participantes": [
        {
          "id": "emp_1",
          "nombre": "Empresa Ejemplo SAS",
          "territorio": "Puerto Berrío",
          "mediciones": {
            "linea_base": {
              "cumplimiento_total": 0.45,
              "promedios_dimensiones": {
                "Dimensión 1": 2.5
              },
              "puntajes_preguntas": {
                "Pregunta 1.1": { "valor": 3 }
              }
            },
            "cierre": null
          }
        }
      ]
    },
    "jovenes": {
      "sociodemografico": {},
      "preguntas_por_dimension": {},
      "participantes": []
    }
  }
}
```

> **Nota de Privacidad:** Los datos sociodemográficos de edad, nivel educativo, y composición familiar de los participantes **nunca** se almacenan a nivel individual. Solo llegan a este archivo como métricas agregadas dentro del objeto `sociodemografico`.


> **Nota:** Si `participantes` está vacío (`[]`), la interfaz renderizará automáticamente los "Empty States" (Estados Vacíos) estructurados, sin mostrar errores.

---

## Script de Carga de Datos (`excel_to_json.py`)

Para transformar los datos crudos en el JSON requerido y garantizar la **exclusión de datos sensibles (PII)**, se utiliza el script de Python.

### Formato esperado del Excel

El script espera un archivo Excel (`.xlsx`) con al menos dos hojas obligatorias: **"Datos"** y **"Puntaje por Pregunta"**.

#### 1. Hoja "Datos"
Debe contener las siguientes columnas (el orden exacto no importa, se buscan por nombre):
- `ID` o `Documento` (usado internamente para cruce, **NO** se exporta al JSON).
- `Nombre` o `Razon Social`
- `Territorio` o `Municipio`
- `Cumplimiento Total` (valor de 0 a 1).
- Otras columnas como `Edad`, `Teléfono`, `Correo`, `Dirección` **serán ignoradas y eliminadas automáticamente** por seguridad.

#### 2. Hoja "Puntaje por Pregunta"
- **Fila 1:** Nombres de las Dimensiones (combinadas sobre las columnas de sus respectivas preguntas).
- **Fila 2:** Textos de las preguntas.
- **Fila 3 en adelante:** Datos. La columna A debe ser el `Nombre` (para validar el cruce exacto con la hoja "Datos"), y el resto de columnas los puntajes numéricos.

### Uso del script

```bash
# Instalar dependencias si no se tienen
pip install pandas openpyxl

# Generar datos para línea base de Emprendedores
python excel_to_json.py --poblacion emprendedores --medicion linea_base --input linea_base_emprendedores.xlsx

# Añadir datos de cierre a la misma población
python excel_to_json.py --poblacion emprendedores --medicion cierre --input cierre_emprendedores.xlsx
```

El script actualiza progresivamente el archivo `src/data/data.json`, permitiendo cargar la línea base primero y el cierre meses después.

## Despliegue (Netlify)

El proyecto incluye `.npmrc` con `legacy-peer-deps=true` para solucionar conflictos de dependencias con React 19.

1. Instalar: `npm install`
2. Desarrollo: `npm run dev`
3. Producción: `npm run build`
