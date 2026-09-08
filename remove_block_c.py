import io
with io.open('src/components/CharacterizationView.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "const ChartCard =" in line:
        skip = True
    
    if skip and "return (" in line:
        skip = False

    if "const formatChartData =" in line:
        skip = True
    
    if skip and "const hasData =" in line:
        skip = False
        
    if "const sexoData =" in line or "const zonaData =" in line:
        continue
        
    if "{/* Block C */}" in line:
        skip = True
        
    if skip and "</div>" in line and ")\n" in "".join(lines[lines.index(line):lines.index(line)+3]):
        # We are skipping until the end of the component
        pass

    if not skip:
        new_lines.append(line)

# Handle the end correctly
final_str = "".join(new_lines)
final_str = final_str.split('{/* Block C */}')[0]
final_str = final_str.strip() + "\n    </div>\n  )\n}\n"

with io.open('src/components/CharacterizationView.jsx', 'w', encoding='utf-8') as f:
    f.write(final_str)
