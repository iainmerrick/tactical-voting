"use strict";

function get_seats(votes) {
    var keys = votes[0];
    var seats = []
    var i, j;
    for (i = 1; i < keys.length; i++) {
        seats[i] = 0;
    }
    for (i = 1; i < votes.length; i++) {
        var row = votes[i];
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

exports.get_seats = get_seats;
