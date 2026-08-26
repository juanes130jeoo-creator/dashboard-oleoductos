import pandas as pd
import json
import argparse
import sys
import os
import math

def clean_name(name):
    if pd.isna(name): return ""
    return str(name).strip().upper()

def get_edad_rango(edad, poblacion):
    try:
        edad = float(edad)
        if math.isnan(edad): return "Sin dato"
    except:
        return "Sin dato"
        
    if poblacion == "emprendedores":
        if edad <= 25: return "18-25 años"
        elif edad <= 35: return "26-35 años"
        elif edad <= 45: return "36-45 años"
        elif edad <= 55: return "46-55 años"
        else: return "56+ años"
    else: # jovenes
        if edad < 14: return "Menor de 14 años"
        elif edad <= 15: return "14-15 años"
        elif edad <= 17: return "16-17 años"
        elif edad <= 19: return "18-19 años"
        else: return "20 o más años"

def get_hogar_rango(personas):
    try:
        p = int(float(personas))
        if p <= 2: return "1 a 2 personas"
        elif p <= 4: return "3 a 4 personas"
        else: return "5 o más personas"
    except:
        return "Sin dato"

def main():
    parser = argparse.ArgumentParser(description="Procesar Excel de Oleoductos a JSON.")
    parser.add_argument('--input', type=str, required=True, help='Ruta al archivo Excel (.xlsx)')
    parser.add_argument('--poblacion', type=str, required=True, choices=['emprendedores', 'jovenes'], help='Población destino')
    parser.add_argument('--medicion', type=str, required=True, choices=['linea_base', 'cierre'], help='Tipo de medición')
    parser.add_argument('--output', type=str, default='src/data/data.json', help='Ruta al archivo JSON de salida')
    args = parser.parse_args()

    excel_path = args.input
    out_json_path = args.output
    poblacion_key = args.poblacion
    medicion_key = args.medicion

    print(f"Leyendo {excel_path} para la población '{poblacion_key}', medición '{medicion_key}'...")

    try:
        df_datos = pd.read_excel(excel_path, sheet_name='Datos')
    except Exception as e:
        print(f"Error cargando hoja 'Datos': {e}")
        sys.exit(1)

    col_nombre = None
    col_territorio = None
    col_cumplimiento = None
    col_edad = None
    col_edu = None
    col_hogar = None

    for col in df_datos.columns:
        c_upper = str(col).upper()
        if 'NOMBRE' in c_upper or 'RAZON SOCIAL' in c_upper: col_nombre = col
        elif 'MUNICIPIO' in c_upper or 'TERRITORIO' in c_upper: col_territorio = col
        elif 'CUMPLIMIENTO TOTAL' in c_upper or 'TOTAL' in c_upper: col_cumplimiento = col
        elif 'EDAD' in c_upper: col_edad = col
        elif 'EDUCATI' in c_upper or 'NIVEL EDU' in c_upper or 'ESCOLARIDAD' in c_upper: col_edu = col
        elif 'HOGAR' in c_upper or 'PERSONAS' in c_upper or 'CONVIV' in c_upper: col_hogar = col

    if not col_nombre:
        print("Error: No se encontró columna de Nombre en hoja 'Datos'.")
        sys.exit(1)

    try:
        df_puntajes = pd.read_excel(excel_path, sheet_name='Puntaje por Pregunta', header=[0, 1])
    except Exception as e:
        print(f"Error cargando hoja 'Puntaje por Pregunta': {e}")
        sys.exit(1)

    col_nombre_puntaje = df_puntajes.columns[0]
    
    if len(df_datos) != len(df_puntajes):
        print(f"Error: La hoja 'Datos' tiene {len(df_datos)} filas pero 'Puntaje por Pregunta' tiene {len(df_puntajes)} filas.")
        sys.exit(1)

    preguntas_cols = [c for c in df_puntajes.columns if c != col_nombre_puntaje and 'TOTAL' not in str(c[0]).upper()]
    dimensiones_encontradas = []
    preguntas_por_dimension = {}
    
    for dim_raw, preg_raw in preguntas_cols:
        dim = str(dim_raw).strip()
        preg = str(preg_raw).strip()
        if 'UNNAMED' in dim.upper() and 'UNNAMED' in preg.upper(): continue
        if dim not in dimensiones_encontradas:
            dimensiones_encontradas.append(dim)
            preguntas_por_dimension[dim] = []
        preguntas_por_dimension[dim].append(preg)

    if os.path.exists(out_json_path):
        with open(out_json_path, 'r', encoding='utf-8') as f:
            try:
                final_data = json.load(f)
            except:
                final_data = {"poblaciones": {"emprendedores": {"sociodemografico": {}, "preguntas_por_dimension": {}, "participantes": []}, "jovenes": {"sociodemografico": {}, "preguntas_por_dimension": {}, "participantes": []}}}
    else:
        final_data = {"poblaciones": {"emprendedores": {"sociodemografico": {}, "preguntas_por_dimension": {}, "participantes": []}, "jovenes": {"sociodemografico": {}, "preguntas_por_dimension": {}, "participantes": []}}}

    poblacion_data = final_data["poblaciones"][poblacion_key]
    
    if medicion_key == 'linea_base' or not poblacion_data.get("preguntas_por_dimension"):
        poblacion_data["preguntas_por_dimension"] = preguntas_por_dimension

    if "sociodemografico" not in poblacion_data:
        poblacion_data["sociodemografico"] = {}

    participantes_list = poblacion_data["participantes"]
    participantes_dict = {p["id"]: p for p in participantes_list}

    # Contadores para datos sociodemográficos
    edad_counts = {}
    edu_counts = {}
    hogar_counts = {}
    suma_personas_hogar = 0
    conteo_hogares = 0

    for idx in range(len(df_datos)):
        row_datos = df_datos.iloc[idx]
        row_puntajes = df_puntajes.iloc[idx]
        
        nombre_datos = clean_name(row_datos[col_nombre])
        nombre_puntajes = clean_name(row_puntajes[col_nombre_puntaje])
        
        if nombre_datos != nombre_puntajes:
            print(f"Error crítico de cruce en fila {idx}: '{nombre_datos}' NO coincide con '{nombre_puntajes}'.")
            sys.exit(1)
            
        part_id = f"{poblacion_key}_{nombre_datos.replace(' ', '_')}"
        
        # Procesar Sociodemográficos (Solo en línea base, o se pueden actualizar, pero es agregado global)
        # Los datos se agregan, NO se guardan en el participante.
        if medicion_key == 'linea_base':
            if col_edad:
                rango = get_edad_rango(row_datos[col_edad], poblacion_key)
                edad_counts[rango] = edad_counts.get(rango, 0) + 1
            if col_edu:
                edu = str(row_datos[col_edu]).strip() if not pd.isna(row_datos[col_edu]) else "Sin dato"
                edu_counts[edu] = edu_counts.get(edu, 0) + 1
            if col_hogar:
                rango_h = get_hogar_rango(row_datos[col_hogar])
                hogar_counts[rango_h] = hogar_counts.get(rango_h, 0) + 1
                try:
                    suma_personas_hogar += int(float(row_datos[col_hogar]))
                    conteo_hogares += 1
                except:
                    pass
        
        puntajes_preg = {}
        dim_sums = {dim: [] for dim in dimensiones_encontradas}
        
        for dim, preg in preguntas_cols:
            if 'UNNAMED' in str(dim).upper() and 'UNNAMED' in str(preg).upper(): continue
            val = row_puntajes[(dim, preg)]
            val = float(val) if not pd.isna(val) else 0.0
            puntajes_preg[preg] = {"valor": val}
            dim_sums[dim].append(val)
            
        promedios_dim = {}
        for dim, vals in dim_sums.items():
            promedios_dim[dim] = sum(vals) / len(vals) if len(vals) > 0 else 0.0
            
        cump = float(row_datos[col_cumplimiento]) if col_cumplimiento and not pd.isna(row_datos[col_cumplimiento]) else 0.0
        
        medicion_obj = {
            "cumplimiento_total": cump,
            "promedios_dimensiones": promedios_dim,
            "puntajes_preguntas": puntajes_preg
        }
        
        territorio = str(row_datos[col_territorio]).strip() if col_territorio and not pd.isna(row_datos[col_territorio]) else "Sin dato"
        
        if part_id in participantes_dict:
            p = participantes_dict[part_id]
            if "mediciones" not in p: p["mediciones"] = {}
            p["mediciones"][medicion_key] = medicion_obj
            p["territorio"] = territorio
        else:
            p = {
                "id": part_id,
                "nombre": nombre_datos,
                "territorio": territorio,
                "mediciones": { "linea_base": None, "cierre": None }
            }
            p["mediciones"][medicion_key] = medicion_obj
            participantes_list.append(p)
            participantes_dict[part_id] = p

    # Actualizar nodo sociodemográfico global
    if medicion_key == 'linea_base':
        socio = poblacion_data.get("sociodemografico", {})
        if col_edad: socio["edad"] = edad_counts
        if col_edu: socio["nivel_educativo"] = edu_counts
        if col_hogar: 
            hogar_counts["promedio"] = round(suma_personas_hogar / conteo_hogares, 1) if conteo_hogares > 0 else 0
            socio["personas_hogar"] = hogar_counts
        poblacion_data["sociodemografico"] = socio

    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print(f"Exito. Datos procesados y guardados en {out_json_path}.")
    print(f"Total participantes en '{poblacion_key}': {len(participantes_list)}")

if __name__ == "__main__":
    main()
