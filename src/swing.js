"use strict";

import * as election from "./election";

/**
 * Scale the given votes so that the total vote counts is 1
 * @param votes - map of party name -> vote count
 * @return new map with normalized counts
 */
export function normalize_votes(votes) {
    let total = 0;
    for (let party in votes) {
        total += votes[party];
    }
    let result = {};
    for (let party in votes) {
        result[party] = votes[party] / total;
    }
    return result;
}

/**
 * Calculate the vote swing percentage for each party
 * @param prev - map of party name -> vote count
 * @param next - map of party name -> vote count
 * @return map of party name -> swing (in range 0 to 1)
 */
export function get_swing(prev, next) {
    prev = normalize_votes(prev);
    next = normalize_votes(next);
    let swing = {};
    for (let party in next) {
        swing[party] = next[party] - prev[party];
    }
    return swing;
}

/**
 * Given old election data and a new poll, return a forecast for the new election.
 * We use a simple uniform national swing model.
 * @param data - table of party votes per constituency
 * @param poll - map of party name -> vote count
 * @return a new table of party votes per constituency
 */
export function adjust_data_with_poll(data, poll) {
    const votes = election.get_votes(data);
    const swing_map = get_swing(votes, poll);
    const keys = data[0];
    let swing = [];
    for (let i = 1; i < keys.length; i++) {
        swing[i] = swing_map[keys[i]];
    }
    var result = [keys];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let row_total = 0;
        for (let j = 1; j < row.length; j++) {
            row_total += row[j];
        }
        const new_row = row.slice();
        for (let j = 1; j < row.length; j++) {
            new_row[j] += swing[j] * row_total;
        }
        result.push(new_row);
    }
    return result;
}
