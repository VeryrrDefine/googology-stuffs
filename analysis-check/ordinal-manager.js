class AnalysisManager {
    records = []
    insert(rec) {
        this.records.push(rec);
    }
    sortThrough(notationname) {
        let res = {};
        for (const rec of this.records) {
            if (rec[notationname]) {
                if (res[rec[notationname]] === undefined) {
                    res[rec[notationname]] = {}
                }
                for (const othernotationname in rec) {
                    if (othernotationname == notationname) continue;
                    res[rec[notationname]][othernotationname] = rec[othernotationname]
                }
            }
        }
        return res;
    }
}

module.exports = {
    AnalysisManager: AnalysisManager
}