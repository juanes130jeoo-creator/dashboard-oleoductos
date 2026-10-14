"""
Script de extracción de asesorías individuales
Laboratorio de Emprendimiento Juvenil - Puerto Boyacá
======================================================
Para futuras actualizaciones, únicamente modifique:
  - EXCEL_PATH (o coloque el nuevo archivo en el Escritorio)
  - FECHA_CORTE
"""

import openpyxl
import json
import datetime
import os
import sys
import re

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

# ==============================================================================
# PARÁMETROS CONFIGURABLES
# ==============================================================================
FECHA_CORTE = "2026-10-10"

# Búsqueda automática del archivo en el Escritorio o ruta específica
DESKTOP_DIR = os.path.expanduser(r"~\Desktop")
EXCEL_PATH = None

# Buscar si existe el archivo específico en el Escritorio
if os.path.exists(DESKTOP_DIR):
    for fname in os.listdir(DESKTOP_DIR):
        if "10 de Octubre" in fname and fname.endswith(".xlsx") and not fname.startswith("~$"):
            EXCEL_PATH = os.path.join(DESKTOP_DIR, fname)
            break

if not EXCEL_PATH or not os.path.exists(EXCEL_PATH):
    # Buscar en directorio local
    for fname in os.listdir("."):
        if "10 de Octubre" in fname and fname.endswith(".xlsx"):
            EXCEL_PATH = fname
            break

if not EXCEL_PATH:
    # Ruta por defecto
    EXCEL_PATH = os.path.join(DESKTOP_DIR, "ASESORÍAS INDIVIDUALES 10 de Octubre de 2026 V.2.xlsx")

# ==============================================================================
# FUNCIONES DE NORMALIZACIÓN
# ==============================================================================

def get_str(val):
    if val is None:
        return ""
    return str(val).strip()

def normalize_spaces(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text)).strip()

def parse_date(val):
    """
    Parsea fechas provenientes de Excel:
    - Objetos datetime.datetime / datetime.date
    - Cadenas de texto en formato DD/MM/YY o DD/MM/YYYY
    - Cadenas en formato YYYY-MM-DD
    """
    if val is None:
        return None
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.strftime("%Y-%m-%d")
    if isinstance(val, str):
        v = val.strip()
        if not v or v.lower() in ("none", "null", "reprogramar"):
            return None
        if '/' in v:
            parts = v.split('/')
            if len(parts) == 3:
                day, month, year = parts
                if len(year) == 2:
                    year = "20" + year
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        try:
            return datetime.datetime.strptime(v, "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d")
        except:
            pass
        try:
            return datetime.datetime.strptime(v, "%Y-%m-%d").strftime("%Y-%m-%d")
        except:
            return None
    return None

def normalize_modalidad(mod):
    if not mod:
        return "Sin dato"
    m = normalize_spaces(mod).lower()
    if "reprogram" in m:
        return "Por reprogramar"
    if "presencial" in m:
        return "Presencial"
    if "virtual" in m:
        return "Virtual"
    return "Sin dato"

def normalize_prof(prof):
    if not prof:
        return "Sin asignar"
    p = normalize_spaces(prof)
    if not p or p.lower() in ("none", "null"):
        return "Sin asignar"
    if p.lower() in ("gio", "giovanna"):
        return "Giovanna"
    if p.lower() in ("cristian", "cristián"):
        return "Cristian"
    return p

def clean_original_tema(tema):
    """Limpia el tema original conservando su nombre ya saneado."""
    if not tema:
        return "Sin dato"
    t = normalize_spaces(tema)
    if not t or t.lower() in ("none", "null"):
        return "Sin dato"
    # Corrección de errata evidente
    if t.lower() == "finazas":
        return "Finanzas"
    if t.lower() == "servicio la cliente":
        return "Servicio al cliente"
    return t

def map_tema_grafico(tema):
    """
    Agrupa temas en las 8 categorías oficiales para los gráficos del dashboard:
      1. Finanzas (incluye "Finazas")
      2. Servicio al cliente
      3. Marketing
      4. Contabilidad
      5. Modelo Canvas
      6. Comercial e innovación ("Comercial" y "Comercial/ innovación")
      7. Redes sociales, publicidad y portafolio ("Redes sociales", "Publicidad", "Portafolio" y sus combinaciones)
      8. Transformación digital
    """
    if not tema:
        return "Sin dato"
    t_clean = normalize_spaces(tema).lower()
    if "finan" in t_clean or "finaz" in t_clean:
        return "Finanzas"
    if "servicio" in t_clean:
        return "Servicio al cliente"
    if "marketing" in t_clean:
        return "Marketing"
    if "contab" in t_clean:
        return "Contabilidad"
    if "canvas" in t_clean:
        return "Modelo Canvas"
    if "comercial" in t_clean:
        return "Comercial e innovación"
    if "transformaci" in t_clean:
        return "Transformación digital"
    if any(k in t_clean for k in ["redes", "publicidad", "portafolio"]):
        return "Redes sociales, publicidad y portafolio"
    return normalize_spaces(tema)

# ==============================================================================
# EXTRACCIÓN PRINCIPAL
# ==============================================================================

def extract(excel_file=None, fecha_corte=None):
    file_path = excel_file or EXCEL_PATH
    corte = fecha_corte or FECHA_CORTE
    
    print(f"Cargando archivo: {file_path}")
    print(f"Fecha de corte: {corte}")
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"No se encontró el archivo: {file_path}")
        
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet_name = "Asesorías individuales (8 hora)"
    if sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
    else:
        sheet = wb.active
        
    # Definición de columnas de rondas 1 a 4
    # Cada asesoría ocupa 6 columnas: FECHA, HORA, PROFESIONAL, MODALIDAD, TEMA, TOTAL HORAS.
    rondas_cols = [
        {"num": 1, "fecha": 24, "hora": 25, "prof": 26, "mod": 27, "tema": 28, "horas": 29},
        {"num": 2, "fecha": 30, "hora": 31, "prof": 32, "mod": 33, "tema": 34, "horas": 35},
        {"num": 3, "fecha": 36, "hora": 37, "prof": 38, "mod": 39, "tema": 40, "horas": 41},
        {"num": 4, "fecha": 42, "hora": 43, "prof": 44, "mod": 45, "tema": 46, "horas": 47}
    ]
    
    col_nombres = 2
    col_apellidos = 3
    col_id = 5
    col_entidad = 18
    
    data = []
    pendientes_calidad = []
    
    for r in range(2, sheet.max_row + 1):
        id_val = sheet.cell(row=r, column=col_id).value
        nom_val = sheet.cell(row=r, column=col_nombres).value
        ape_val = sheet.cell(row=r, column=col_apellidos).value
        ent_val = sheet.cell(row=r, column=col_entidad).value
        
        # Validar si fila tiene información
        if id_val is None and nom_val is None:
            continue
            
        # Formatear ID numérico como string limpio para llave única
        if isinstance(id_val, float):
            id_str = str(int(id_val))
        else:
            id_str = str(id_val).strip() if id_val else f"fila_{r}"
            
        nombre_persona = normalize_spaces(f"{nom_val or ''} {ape_val or ''}")
        entidad = normalize_spaces(ent_val) or "Sin nombre de emprendimiento"
        nombre_completo = f"{entidad} - {nombre_persona}"
        
        asesorias = []
        for ronda in rondas_cols:
            r_num = ronda["num"]
            raw_fecha = sheet.cell(row=r, column=ronda["fecha"]).value
            parsed_fecha = parse_date(raw_fecha)
            
            raw_hora = sheet.cell(row=r, column=ronda["hora"]).value
            if isinstance(raw_hora, datetime.time):
                hora_str = raw_hora.strftime("%H:%M")
            else:
                hora_str = normalize_spaces(raw_hora)
                
            raw_prof = sheet.cell(row=r, column=ronda["prof"]).value
            prof = normalize_prof(raw_prof)
            
            raw_mod = sheet.cell(row=r, column=ronda["mod"]).value
            mod = normalize_modalidad(raw_mod)
            
            raw_tema = sheet.cell(row=r, column=ronda["tema"]).value
            tema_limpio = clean_original_tema(raw_tema)
            tema_grafico = map_tema_grafico(raw_tema)
            
            raw_horas = sheet.cell(row=r, column=ronda["horas"]).value
            horas = None
            if raw_horas is not None and str(raw_horas).strip() != "":
                try:
                    horas = float(raw_horas)
                except:
                    horas = 2.0
            
            # Regla 2: REALIZADA solo si tiene fecha válida y fecha <= corte
            is_realizada = (parsed_fecha is not None and parsed_fecha <= corte)
            is_programada = (parsed_fecha is not None and parsed_fecha > corte)
            
            # Regla 5: Si está realizada y horas vacía, asignar 2 horas
            if is_realizada and horas is None:
                horas = 2.0
                
            # Regla 4: Registros sin fecha pero con algún dato (reprogramar, mod, horas, tema, prof)
            if parsed_fecha is None:
                has_any_data = (
                    (raw_mod and str(raw_mod).strip() != "") or
                    (raw_tema and str(raw_tema).strip() != "") or
                    (raw_horas is not None and str(raw_horas).strip() != "") or
                    (raw_prof and str(raw_prof).strip() != "")
                )
                if has_any_data:
                    pendientes_calidad.append({
                        "emprendimiento": entidad,
                        "emprendedor": nombre_persona,
                        "ronda": r_num,
                        "motivo": "Sin fecha / Por reprogramar",
                        "modalidad": mod,
                        "tema": tema_limpio,
                        "horas": horas or (2.0 if raw_horas else None)
                    })
            
            # Incluir asesoría si tiene fecha o datos asignados
            if parsed_fecha or mod != "Sin dato" or tema_limpio != "Sin dato" or prof != "Sin asignar" or horas is not None:
                asesorias.append({
                    "ronda": r_num,
                    "fecha": parsed_fecha,
                    "hora_dia": hora_str,
                    "horas": horas,
                    "profesional": prof,
                    "modalidad": mod,
                    "tema": tema_limpio,
                    "tema_grafico": tema_grafico,
                    "isRealizada": is_realizada,
                    "isProgramada": is_programada
                })
                
        # Estado de la ruta (Regla 7)
        num_realizadas = sum(1 for a in asesorias if a["isRealizada"])
        if num_realizadas == 4:
            estado_ruta = "Ruta completa (4/4)"
        elif num_realizadas == 3:
            estado_ruta = "3 de 4"
        elif num_realizadas == 2:
            estado_ruta = "2 de 4"
        elif num_realizadas == 1:
            estado_ruta = "1 de 4"
        else:
            estado_ruta = "Sin asesorías"
            
        horas_acumuladas = sum(a["horas"] or 0 for a in asesorias if a["isRealizada"])
        
        data.append({
            "id": id_str,
            "emprendimiento": entidad,
            "emprendedor": nombre_persona,
            "nombre_completo": nombre_completo,
            "estado_ruta": estado_ruta,
            "horas_acumuladas": horas_acumuladas,
            "asesorias": asesorias
        })
        
    # Guardar JSON para el dashboard
    output_path = os.path.join("src", "data", "control_gestion_asesorias.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"JSON generado exitosamente en {output_path}: {len(data)} emprendimientos.")
    return data, pendientes_calidad

if __name__ == "__main__":
    extract()
