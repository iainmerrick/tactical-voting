"use strict";

export function adjust_data_with_tactics(data, parties) {
    const keys = data[0];
    var result = [keys];
    const party_indices = [];
    for (let party of parties) {
        party_indices.push(keys.indexOf(party));
    }
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let total = 0;
        let biggest_vote = -1;
        let biggest_party = -1;
        for (let j of party_indices) {
            let vote = row[j];
            if (vote > biggest_vote) {
                biggest_vote = vote;
                biggest_party = j;
            }
            total += vote;
        }
        const new_row = row.slice();
        for (let j of party_indices) {
            new_row[j] = (j == biggest_party) ? total : 0;
        }
        result.push(new_row);
    }
    return result;
}
