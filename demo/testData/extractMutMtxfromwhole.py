import json

with open('entireJson.json') as dataFile:
  data = json.load(dataFile)

print data.keys()

mtxData = data['mutation_matrix']
with open('example2-mutation-matrix.json', 'w') as outfile:
  json.dump(mtxData, outfile)