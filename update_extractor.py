import io
import re

with io.open('extract_asesorias.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Update filename
content = content.replace("file_path = 'asesorias_v2.xlsx'", "file_path = 'asesorias_v3.xlsx'")

# Update date parser
new_get_date = """def get_date(val):
    if val is None: return None
    if isinstance(val, datetime.datetime):
        return val.strftime("%Y-%m-%d")
    if isinstance(val, str):
        v = val.strip()
        # Handle DD/MM/YY or DD/MM/YYYY
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
            return v.split(" ")[0]
    return str(val)
"""
content = re.sub(r'def get_date\(val\):.*?(?=\ndef )', new_get_date.strip(), content, flags=re.DOTALL)

# Update CATALOGO
old_cat = '''    "servicio la cliente": "Servicio al Cliente",
    "transformación digital": "Transformación Digital",
    "marketing o contabilidad": "Sin Definir / Pendiente",
    "": "Sin Definir / Pendiente"
}'''
new_cat = '''    "servicio la cliente": "Servicio al Cliente",
    "transformación digital": "Transformación Digital",
    "marketing o contabilidad": "Sin Definir / Pendiente",
    "finazas": "Finanzas",
    "publicidad": "Marketing",
    "portafolio": "Portafolio",
    "publicidad o redes": "Sin Definir / Pendiente",
    "contabilidad o redes": "Sin Definir / Pendiente",
    "": "Sin Definir / Pendiente"
}'''
content = content.replace(old_cat, new_cat)

# Update Modalidad
old_mod = """def normalize_modalidad(mod):
    m = normalize_spaces(mod).lower()
    if "presencial" in m: return "Presencial"
    if "virtual" in m: return "Virtual"
    return "Sin dato"
"""
new_mod = """def normalize_modalidad(mod):
    m = normalize_spaces(mod).lower()
    if "reprogram" in m: return "Por reprogramar"
    if "presencial" in m: return "Presencial"
    if "virtual" in m: return "Virtual"
    return "Sin dato"
"""
content = content.replace(old_mod.strip(), new_mod.strip())

with io.open('extract_asesorias.py', 'w', encoding='utf-8') as f:
    f.write(content)
