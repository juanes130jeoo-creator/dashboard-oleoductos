import urllib.request
import urllib.parse
import json

# Fetch Boyaca
query = '''
[out:json];
relation["name"="Boyacá"]["admin_level"="4"];
out geom;
'''
url = 'https://overpass-api.de/api/interpreter?data=' + urllib.parse.quote(query)
print('Fetching Boyaca from Overpass...')
res = urllib.request.urlopen(url).read()
data = json.loads(res)
print('Got Boyaca data')

# We can also fetch Puerto Boyaca
query_pb = '''
[out:json];
relation["name"="Puerto Boyacá"]["admin_level"="6"];
out geom;
'''
url_pb = 'https://overpass-api.de/api/interpreter?data=' + urllib.parse.quote(query_pb)
print('Fetching Puerto Boyaca from Overpass...')
res_pb = urllib.request.urlopen(url_pb).read()
data_pb = json.loads(res_pb)
print('Got Puerto Boyaca data')

# Create a simplified GeoJSON
features = []

def to_polygon(elements, name):
    for el in elements:
        if el['type'] == 'relation':
            coords = []
            for mem in el['members']:
                if mem['type'] == 'way' and 'geometry' in mem:
                    way_coords = [[pt['lon'], pt['lat']] for pt in mem['geometry']]
                    coords.append(way_coords)
            
            # Very naive assembly, but for D3 it might render as a MultiLineString easily
            features.append({
                "type": "Feature",
                "properties": {"name": name},
                "geometry": {
                    "type": "MultiLineString",
                    "coordinates": coords
                }
            })

to_polygon(data.get('elements', []), 'Boyacá')
to_polygon(data_pb.get('elements', []), 'Puerto Boyacá')

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open('src/data/boyaca.geo.json', 'w', encoding='utf-8') as f:
    json.dump(geojson, f)
print('Saved to src/data/boyaca.geo.json')
