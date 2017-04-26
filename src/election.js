"use strict";

function get_seats(data) {
    var keys = data[0];
    var seats = []
    var i, j;
    for (i = 1; i < keys.length; i++) {
        seats[i] = 0;
    }
    for (i = 1; i < data.length; i++) {
        var row = data[i];
        var max_index = 0;
        var max_value = 0;
        for (j = 1; j < row.length; j++) {
            if (row[j] > max_value) {
                max_index = j;
                max_value = row[j];
            }
        }
        seats[max_index] += 1;
    }
    var seat_map = {};
    for (i = 1; i < keys.length; i++) {
        seat_map[keys[i]] = seats[i];
    }
    return seat_map;
}

function get_votes(data) {
    var keys = data[0];
    var votes = []
    var i, j;
    for (i = 1; i < keys.length; i++) {
        votes[i] = 0;
    }
    for (i = 1; i < votes.length; i++) {
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

exports.get_seats = get_seats;
exports.get_votes = get_votes;
