import csv
ordinals = []
def loadontoOrdinals(file):
    global ordinals
    with open(file, 'r', encoding='utf-8') as f:
        dict_reader = csv.DictReader(f)
        for row in dict_reader:
            row.pop("Note", None)
            ordinals.append(row)

loadontoOrdinals("bhm.csv")
loadontoOrdinals("iblp.csv")
print(ordinals)