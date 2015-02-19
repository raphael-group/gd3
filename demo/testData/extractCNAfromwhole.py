import json

with open('entireJson.json') as dataFile:
  data = json.load(dataFile)

cnaData = data['cna_browser_data']
with open('example-cna.json', 'w') as outfile:
  json.dump(cnaData, outfile)