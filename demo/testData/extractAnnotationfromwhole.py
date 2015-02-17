import json

with open('entireJson.json') as dataFile:
  data = json.load(dataFile)

print data.keys()

antData = data['annotations']
with open('example-annotation.json', 'w') as outfile:
  json.dump(antData, outfile)