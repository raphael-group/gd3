import json

with open('entireJson.json') as dataFile:
  data = json.load(dataFile)

tData = data['transcript_data']
with open('example2-transcript.json', 'w') as outfile:
  json.dump(tData, outfile)