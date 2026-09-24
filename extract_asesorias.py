import openpyxl
from openpyxl.utils import column_index_from_string
import json
import datetime
import sys

def get_str(val):
    if val is None: return ""
    return str(val).strip()

def get_date(val):
    if val is None: return None
    if isinstance(val, datetime.datetime):
        return val.strftime("%Y-%m-%d")
    if isinstance(val, str):
        try:
            return datetime.datetime.strptime(val, "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d")
        except:
            return val.split(" ")[0]
    return str(val)

def extract():
    file_path = 'C:\\Users\\jeo20\\Desktop\\oleoductos.xlsx'
    try:
        wb = openpyxl.load_workbook(file_path, data_only=True)
    except Exception as e:
        print(f"Error loading Excel: {e}")
        sys.exit(1)

    sheet = wb['Base maestra']
    
    # Mapping
    col_entidad = column_index_from_string('R')
    col_nombres = column_index_from_string('B')
    
    # Rondas definitions
    rondas_cols = [
        {
            "num": 1,
            "fecha": column_index_from_string('X'),
            "hora": column_index_from_string('Y'),
            "horas": column_index_from_string('AC'),
            "profesional": column_index_from_string('BS'),
            "modalidad": column_index_from_string('BT'),
            "tema": column_index_from_string('BU')
        },
        {
            "num": 2,
            "fecha": column_index_from_string('AD'),
            "hora": column_index_from_string('AE'),
            "horas": column_index_from_string('AI'),
            "profesional": column_index_from_string('BV'),
            "modalidad": column_index_from_string('BW'),
            "tema": column_index_from_string('BX')
        },
        {
            "num": 3,
            "fecha": column_index_from_string('AJ'),
            "hora": column_index_from_string('AK'),
            "horas": column_index_from_string('AO'),
            "profesional": column_index_from_string('BY'),
            "modalidad": column_index_from_string('BZ'),
            "tema": column_index_from_string('CA')
        },
        {
            "num": 4,
            "fecha": column_index_from_string('AP'),
            "hora": column_index_from_string('AQ'),
            "horas": column_index_from_string('AU'),
            "profesional": column_index_from_string('CB'),
            "modalidad": column_index_from_string('CC'),
            "tema": column_index_from_string('CD')
        }
    ]

    data = []
    
    for r in range(2, sheet.max_row + 1):
        if r == 35: continue # Note row
        entidad = get_str(sheet.cell(row=r, column=col_entidad).value)
        if not entidad: continue
        
        nombre = get_str(sheet.cell(row=r, column=col_nombres).value)
        
        emprendimiento = f"{entidad} - {nombre}"
        
        asesorias = []
        for ronda in rondas_cols:
            fecha = get_date(sheet.cell(row=r, column=ronda['fecha']).value)
            
            hora_val = sheet.cell(row=r, column=ronda['hora']).value
            if isinstance(hora_val, datetime.time):
                hora_str = hora_val.strftime("%H:%M")
            else:
                hora_str = get_str(hora_val)
            
            horas_val = sheet.cell(row=r, column=ronda['horas']).value
            horas = float(horas_val) if horas_val is not None and str(horas_val).strip() else None
            
            prof = get_str(sheet.cell(row=r, column=ronda['profesional']).value)
            mod = get_str(sheet.cell(row=r, column=ronda['modalidad']).value)
            tema = get_str(sheet.cell(row=r, column=ronda['tema']).value)
            
            if fecha or prof or tema or (horas is not None):
                asesorias.append({
                    "ronda": ronda['num'],
                    "fecha": fecha,
                    "hora_dia": hora_str,
                    "horas": horas,
                    "profesional": prof,
                    "modalidad": mod,
                    "tema": tema
                })
                
        data.append({
            "id": r,
            "emprendimiento": entidad,
            "emprendedor": nombre,
            "nombre_completo": emprendimiento,
            "asesorias": asesorias
        })
        
    with open('src/data/control_gestion_asesorias.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    extract()
