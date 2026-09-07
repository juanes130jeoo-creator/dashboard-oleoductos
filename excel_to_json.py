import json
import argparse
import sys
import os
import math
import openpyxl

def clean_str(val):
    if val is None: return ""
    return str(val).strip()

def get_edad_rango(edad):
    try:
        edad = float(edad)
        if math.isnan(edad): return "Sin dato"
    except:
        return "Sin dato"
        
    if edad <= 25: return "18-25 años"
    elif edad <= 35: return "26-35 años"
    elif edad <= 45: return "36-45 años"
    elif edad <= 55: return "46-55 años"
    else: return "56+ años"

def has_observation(obs_val):
    val = clean_str(obs_val).lower().strip()
    if not val:
        return False
    if val == 'ok' or val == 'puerto boyaca' or val == 'puerto boyacá' or val == 'puerto serviez':
        return False
    return True

def main():
    parser = argparse.ArgumentParser(description="Procesar Excel de Oleoductos a JSON (solo datos autorizados y agregados).")
    parser.add_argument('--input', type=str, required=True, help='Ruta al archivo Excel (.xlsx)')
    parser.add_argument('--output', type=str, default='src/data/data.json', help='Ruta al archivo JSON de salida')
    args = parser.parse_args()

    excel_path = args.input
    out_json_path = args.output
    
    print(f"Leyendo {excel_path}...")

    try:
        wb = openpyxl.load_workbook(excel_path, data_only=True)
    except Exception as e:
        print(f"Error cargando Excel: {e}")
        sys.exit(1)

    # 1. Indicadores de contexto
    indicadores = []
    if 'datos' in wb.sheetnames:
        sheet_datos = wb['datos']
        # Mapeo manual basado en las filas conocidas del excel y territorios
        # 2: Desempleo juvenil en Colombia
        # 3: Jóvenes que no estudian ni trabajan
        # 4: Informalidad laboral nacional
        # 5: Informalidad laboral juvenil
        # 6: Actividad empresarial temprana en Colombia
        # 7: Informalidad zonas rurales en Boyacá
        # 8: Población juvenil en Boyacá
        # 9: Informalidad laboral en el departamento de Boyacá
        
        map_indicadores = [
            {"row": 2, "id": "desempleo_juv_col", "nombre": "Desempleo juvenil (15-28 años)", "territorio": "Colombia"},
            {"row": 3, "id": "ninis", "nombre": "Jóvenes que no estudian ni trabajan", "territorio": "Colombia"},
            {"row": 4, "id": "informalidad_nal", "nombre": "Informalidad laboral", "territorio": "Colombia"},
            {"row": 5, "id": "informalidad_juv", "nombre": "Informalidad laboral juvenil", "territorio": "Colombia"},
            {"row": 6, "id": "actividad_emp_temp", "nombre": "Actividad empresarial temprana", "territorio": "Colombia"},
            {"row": 7, "id": "informalidad_rural_boy", "nombre": "Informalidad zonas rurales", "territorio": "Boyacá"},
            {"row": 8, "id": "pob_juv_boy", "nombre": "Población juvenil (aprox)", "territorio": "Boyacá"},
            {"row": 9, "id": "informalidad_boy", "nombre": "Informalidad laboral", "territorio": "Boyacá"},
        ]
        
        for item in map_indicadores:
            val = sheet_datos.cell(row=item["row"], column=5).value
            try:
                val_pct = float(val) * 100
                val_str = f"{val_pct:.1f}"
            except:
                val_str = None
                
            indicadores.append({
                "id": item["id"],
                "nombre": item["nombre"],
                "territorio": item["territorio"],
                "valor": val_str,
                "unidad": "%",
                "fuente": "Por confirmar",
                "fecha": "Por confirmar"
            })
            
        with open('src/config/indicadores-contexto.json', 'w', encoding='utf-8') as f:
            json.dump(indicadores, f, ensure_ascii=False, indent=2)
            
    # 2. Base consolidada
    sheet_name = ' Base consolidada edades '
    if sheet_name not in wb.sheetnames:
        print(f"Hoja '{sheet_name}' no encontrada.")
        sys.exit(1)
        
    sheet = wb[sheet_name]
    
    # Índices de columnas (1-based en openpyxl)
    COL_TERRITORIO = 1
    COL_NOMBRES = 2
    COL_EDAD = 11
    COL_SEXO = 12
    COL_JEFE_HOGAR = 15
    COL_ZONA = 18
    COL_F1 = 26
    COL_F2 = 27
    COL_SOPORTES = 28
    COL_OBS = 29
    
    participantes_list = []
    control_gestion = []
    
    # Contenedores anidados por territorio (y "Todos")
    # Estructura: { "Todos": {rango: val}, "Puerto Boyacá": {rango: val} }
    edad_counts = {"Todos": {}}
    sexo_counts = {"Todos": {}}
    zona_counts = {"Todos": {}}
    jefe_counts = {"Todos": {}}
    soportes_counts = {"Todos": {}}
    
    excluidos_rojo = 0
    total_filas = 0
    
    for row_idx in range(8, sheet.max_row + 1):
        terr_val = sheet.cell(row=row_idx, column=COL_TERRITORIO).value
        if not terr_val:
            continue
            
        total_filas += 1
        
        # Detección dinámica de exclusión: revisamos que la celda de la columna 'Nombres' (2) esté en rojo
        fill_color = sheet.cell(row=row_idx, column=COL_NOMBRES).fill.start_color.index
        if fill_color == 'FFFF0000':
            excluidos_rojo += 1
            continue
            
        codigo_anonimo = f"P-{len(participantes_list) + 1:02d}"
        territorio = clean_str(terr_val)
        
        if territorio not in edad_counts:
            edad_counts[territorio] = {}
            sexo_counts[territorio] = {}
            zona_counts[territorio] = {}
            jefe_counts[territorio] = {}
            soportes_counts[territorio] = {}
            
        def add_count(dic, terr, val):
            dic["Todos"][val] = dic["Todos"].get(val, 0) + 1
            dic[terr][val] = dic[terr].get(val, 0) + 1
        
        edad_val = sheet.cell(row=row_idx, column=COL_EDAD).value
        rango_edad = get_edad_rango(edad_val)
        add_count(edad_counts, territorio, rango_edad)
        
        sexo_val = clean_str(sheet.cell(row=row_idx, column=COL_SEXO).value) or "Sin dato"
        add_count(sexo_counts, territorio, sexo_val)
        
        zona_val = clean_str(sheet.cell(row=row_idx, column=COL_ZONA).value) or "Sin dato"
        add_count(zona_counts, territorio, zona_val)
        
        jefe_val = clean_str(sheet.cell(row=row_idx, column=COL_JEFE_HOGAR).value) or "Sin dato"
        add_count(jefe_counts, territorio, jefe_val)
        
        estado_sop_val = clean_str(sheet.cell(row=row_idx, column=COL_SOPORTES).value) or "Sin dato"
        add_count(soportes_counts, territorio, estado_sop_val)
        
        obs_val = sheet.cell(row=row_idx, column=COL_OBS).value
        
        # 1. Participante anónimo para gráficas y métricas
        participantes_list.append({
            "id": codigo_anonimo,
            "territorio": territorio,
            "mediciones": {
                "linea_base": None,
                "cierre": None
            }
        })
        
        # 2. Registro para Control de Gestión (solo PII anónima)
        control_gestion.append({
            "codigo": codigo_anonimo,
            "territorio": territorio,
            "formato_1": clean_str(sheet.cell(row=row_idx, column=COL_F1).value),
            "formato_2": clean_str(sheet.cell(row=row_idx, column=COL_F2).value),
            "estado_soportes": estado_sop_val,
            "tiene_observacion": has_observation(obs_val)
        })

    # Cargar JSON o crear base
    final_data = {
        "metadata": {
            "excluidos_criterio": "filas_rojas",
            "excluidos_cantidad": excluidos_rojo,
            "total_registros_brutos": total_filas
        },
        "poblaciones": {
            "emprendedores": {
                "sociodemografico": {
                    "edad": edad_counts,
                    "sexo": sexo_counts,
                    "zona": zona_counts,
                    "jefe_hogar": jefe_counts,
                    "estado_soportes": soportes_counts
                },
                "control_gestion": control_gestion,
                "preguntas_por_dimension": {},
                "participantes": participantes_list
            },
            "jovenes": {
                "sociodemografico": {},
                "control_gestion": [],
                "preguntas_por_dimension": {},
                "participantes": []
            }
        }
    }

    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print(f"Exito. Datos procesados y guardados en {out_json_path}.")
    print(f"Total participantes autorizados: {len(participantes_list)}")
    print(f"Total excluidos (rojo): {excluidos_rojo}")

if __name__ == "__main__":
    main()
