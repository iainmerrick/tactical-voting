"use strict";

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
