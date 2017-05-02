"use strict";

import _ from "underscore";
import $ from "jquery";
import "chart.js";

import * as election from "./src/election.js";

function loadChart(ctx, json) {
    let seats = election.get_seats(json);
    let pairs = _.pairs(seats);
    // Sort by name, then by descending seat count (preserving name order in ties)
    pairs = _.sortBy(pairs, function(pair) { return pair[0]; });
    pairs = _.sortBy(pairs, function(pair) { return -pair[1]; });
    let keys = _.map(pairs, function(pair) { return pair[0]; });
    let values = _.map(pairs, function(pair) { return pair[1]; });
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: keys,
            datasets: [{
                label: "Seats",
                data: values
            }]
        }
    });
}

$.getJSON("election_2010.json", function(json) {
    console.log("Loaded 2010 data - " + json.length + " rows");
    let ctx = document.getElementById("chart2010");
    loadChart(ctx, json);
});

$.getJSON("election_2015.json", function(json) {
    console.log("Loaded 2015 data - " + json.length + " rows");
    let ctx = document.getElementById("chart2015");
    loadChart(ctx, json);
});
