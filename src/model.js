"use strict";

// ---------------------------------------------------------------------------------------
// Database of party names and colors

// Dictionary of raw party data:
// - Key is the canonical short name.
// - Value is an array of aliases.
// - The first alias is the canonical long name.
const PARTY_DATA = {
    Con: ["Conservative", "C"],
    Lab: ["Labour", "Lab Co-op", "L"],
    LD: ["Liberal Democrat"],
    DUP: ["Democratic Unionist Party"],
    SNP: ["Scottish National Party"],
    PC: ["Plaid Cymru"],
    SDLP: ["Social Democratic and Labour Party"],
    Green: ["Green Party", "GRN"],
    Alliance: ["Alliance Party of Northern Ireland", "APNI"],
    UUP: ["Ulster Unionist Party"],
    UKIP: ["UK Independence Party"],
    SF: ["Sinn Féin", "Sinn Fein"], // Abstentionist, doesn't sit in the Commons
    Speaker: ["Speaker"] // Speaker of the House, traditionally non-partisan
};

const SHORT_NAME_MAP = {}; // Map of anything -> short name
const LONG_NAME_MAP = {}; // Map of anything -> long name

for (let short_name in PARTY_DATA) {
    const aliases = PARTY_DATA[short_name];
    const long_name = aliases[0];
    SHORT_NAME_MAP[short_name.toLowerCase()] = short_name;
    LONG_NAME_MAP[short_name.toLowerCase()] = long_name;
    for (let alias of aliases) {
        SHORT_NAME_MAP[alias.toLowerCase()] = short_name;
        LONG_NAME_MAP[alias.toLowerCase()] = long_name;
    }
}

/**
 * Get the canonical short version of any party name or synonym
 */ 
export function party_name(party) {
    return SHORT_NAME_MAP[party.toLowerCase()] || "Other";
}

/**
 * Get the canonical long version of any party name or synonym
 */ 
export function party_long_name(party) {
    return LONG_NAME_MAP[party.toLowerCase()] || "Other";
}

/**
 * Returns true for parties that vote normally in the House of Commons.
 * Only returns false for some special cases (Sinn Féin and the Speaker).
 */
export function party_takes_seat(party) {
    party = party_name(party);
    return party !== "SF" && party !== "Speaker";
}

// ---------------------------------------------------------------------------------------
// Basic calculations with raw election data
//
// Raw election data is a CSV-like array of arrays.
// The first row contains column headers (e.g. party names).
// The remaining rows contain voting data, one row per constituency.
// The first column is assumed to be the constituency name.

/**
 * Count the total number of votes cast for each party
 * @param data - table of per-constituency votes
 * @return map of party name -> seat count
 */
export function get_votes(data) {
    var keys = data[0];
    var votes = []
    var i, j;
    for (i = 1; i < keys.length; i++) {
        votes[i] = 0;
    }
    for (i = 1; i < data.length; i++) {
        var row = data[i];
        for (j = 1; j < row.length; j++) {
            votes[j] += row[j];
        }
    }
    var vote_map = {};
    for (i = 1; i < keys.length; i++) {
        vote_map[keys[i]] = votes[i];
    }
    return vote_map;
}

/**
 * Count the number of seats won by each party
 * @param data - table of per-constituency votes
 * @return map of party name -> seat count
 */
export function get_seats(data) {
    var keys = data[0];
    var seats = []
    var i, j;
    for (i = 1; i < keys.length; i++) {
        seats[i] = 0;
    }
    for (i = 1; i < data.length; i++) {
        var row = data[i];
        var max_indices = [];
        var max_value = 0;
        for (j = 1; j < row.length; j++) {
            if (row[j] > max_value) {
                max_indices = [j];
                max_value = row[j];
            } else if (row[j] == max_value) {
                max_indices.push(j);
            }
        }
        // Tied seats are divided evenly (in real life it's resolved by a coin toss)
        for (let winner of max_indices) {
            seats[winner] += 1.0 / max_indices.length;
        }
    }
    var seat_map = {};
    for (i = 1; i < keys.length; i++) {
        seat_map[keys[i]] = seats[i];
    }
    return seat_map;
}

/**
 * Given a party -> seats map, remove abstentionist parties (i.e. those who don't sit)
 * @param seat_map - map of party name -> seat count
 * @return map of party name -> seat count
 */
export function remove_unused_seats(seat_map) {
    var result = {};
    for (let party in seat_map) {
        result[party] = party_takes_seat(party) ? seat_map[party] : 0;
    }
    return result;
}

/**
 * Get votes or seats for the given parties, in order.
 * Parties not listed will be counted as "Other".
 * @param votes_or_seats - map of party name -> seat count or vote count
 * @param parties - list of party names
 * @return list of votes or seats for the corresponding parties
 */
export function count_by_party(votes_or_seats, parties) {
    var count = {};
    for (let party in votes_or_seats) {
        if (parties.indexOf(party) >= 0) {
            count[party] = (count[party] || 0) + votes_or_seats[party];
        } else {
            count.Other = (count.Other || 0) +  votes_or_seats[party];
        }
    }
    var result = [];
    for (let party of parties) {
        result.push(count[party]);
    }
    return result;
}

// ---------------------------------------------------------------------------------------
// Tactical voting

/**
 * Given raw data and a voting bloc, transforms the data as if the bloc voted tactically.
 * We assume that all bloc votes go to the biggest party in each constituency.
 * @param data - table of party votes per constituency
 * @return a new table of party votes per constituency
 */
export function adjust_data_with_tactics(data, bloc) {
    const keys = data[0];
    var result = [keys];
    const party_indices = [];
    for (let party of bloc) {
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

// ---------------------------------------------------------------------------------------
// Swingometer

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
    const votes = get_votes(data);
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
