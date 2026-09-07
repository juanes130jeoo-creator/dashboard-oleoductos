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
        
    if edad <= 17: return "15-17"
    elif edad <= 21: return "18-21"
    elif edad <= 25: return "22-25"
    elif edad <= 28: return "26-28"
    else: return "29+"

def get_sexo_label(s):
    s = clean_str(s).upper()
    if s == 'F': return "Femenino"
    if s == 'M': return "Masculino"
    return "Sin dato"

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
    
    COL_TERRITORIO = 1
    COL_NOMBRES = 2
    COL_APELLIDOS = 3
    COL_EDAD = 11
    COL_SEXO = 12
    COL_JEFE_HOGAR = 15
    COL_ZONA = 18
    COL_ENTIDAD = 19
    COL_F1 = 26
    COL_F2 = 27
    COL_SOPORTES = 28
    COL_OBS = 29
    
    participantes_list = []
    control_gestion = []
    
    piramide_counts = {"Todos": {}}
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
        
        # Detección dinámica de exclusión por color rojo en la columna de Nombres (2)
        fill_color = sheet.cell(row=row_idx, column=COL_NOMBRES).fill.start_color.index
        if fill_color == 'FFFF0000':
            excluidos_rojo += 1
            continue
            
        codigo_anonimo = f"P-{len(participantes_list) + 1:02d}"
        territorio = clean_str(terr_val)
        
        if territorio not in piramide_counts:
            piramide_counts[territorio] = {}
            sexo_counts[territorio] = {}
            zona_counts[territorio] = {}
            jefe_counts[territorio] = {}
            soportes_counts[territorio] = {}
            
        def add_count(dic, terr, val):
            dic["Todos"][val] = dic["Todos"].get(val, 0) + 1
            dic[terr][val] = dic[terr].get(val, 0) + 1
            
        def add_piramide(terr, r_edad, val_sexo):
            if r_edad not in piramide_counts["Todos"]:
                piramide_counts["Todos"][r_edad] = {"Femenino": 0, "Masculino": 0, "Sin dato": 0}
            if r_edad not in piramide_counts[terr]:
                piramide_counts[terr][r_edad] = {"Femenino": 0, "Masculino": 0, "Sin dato": 0}
            piramide_counts["Todos"][r_edad][val_sexo] = piramide_counts["Todos"][r_edad].get(val_sexo, 0) + 1
            piramide_counts[terr][r_edad][val_sexo] = piramide_counts[terr][r_edad].get(val_sexo, 0) + 1
        
        edad_val = sheet.cell(row=row_idx, column=COL_EDAD).value
        rango_edad = get_edad_rango(edad_val)
        sexo_val = get_sexo_label(sheet.cell(row=row_idx, column=COL_SEXO).value)
        
        add_piramide(territorio, rango_edad, sexo_val)
        add_count(sexo_counts, territorio, sexo_val)
        
        zona_val = clean_str(sheet.cell(row=row_idx, column=COL_ZONA).value) or "Sin dato"
        add_count(zona_counts, territorio, zona_val)
        
        jefe_val = clean_str(sheet.cell(row=row_idx, column=COL_JEFE_HOGAR).value) or "Sin dato"
        if jefe_val.lower() == 'si' or jefe_val.lower() == 'sí':
            jefe_val = 'Si'
        elif jefe_val.lower() == 'no':
            jefe_val = 'No'
        add_count(jefe_counts, territorio, jefe_val)
        
        estado_sop_val = clean_str(sheet.cell(row=row_idx, column=COL_SOPORTES).value) or "Sin dato"
        add_count(soportes_counts, territorio, estado_sop_val)
        
        obs_val = sheet.cell(row=row_idx, column=COL_OBS).value
        
        nombres = clean_str(sheet.cell(row=row_idx, column=COL_NOMBRES).value)
        apellidos = clean_str(sheet.cell(row=row_idx, column=COL_APELLIDOS).value)
        nombre_completo = f"{nombres} {apellidos}".strip()
        
        entidad_val = clean_str(sheet.cell(row=row_idx, column=COL_ENTIDAD).value)
        entidad_org = entidad_val if entidad_val else "Sin registrar"
        
        participantes_list.append({
            "id": codigo_anonimo,
            "entidad": entidad_org,
            "territorio": territorio,
            "mediciones": {
                "linea_base": None,
                "cierre": None
            }
        })
        
        control_gestion.append({
            "codigo": codigo_anonimo,
            "nombre": nombre_completo,
            "entidad": entidad_org,
            "territorio": territorio,
            "formato_1": clean_str(sheet.cell(row=row_idx, column=COL_F1).value),
            "formato_2": clean_str(sheet.cell(row=row_idx, column=COL_F2).value),
            "estado_soportes": estado_sop_val,
            "tiene_observacion": has_observation(obs_val)
        })

    final_data = {
        "metadata": {
            "excluidos_criterio": "filas_rojas_dinamico",
            "excluidos_cantidad": excluidos_rojo,
            "total_registros_brutos": total_filas
        },
        "poblaciones": {
            "emprendedores": {
                "sociodemografico": {
                    "piramide": piramide_counts,
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
