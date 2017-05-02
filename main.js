"use strict";

import _ from "underscore";
import $ from "jquery";
import "chart.js";

import * as election from "./src/election.js";
import * as party from "./src/party.js";
import * as swingometer from "./src/swingometer.js";

function loadChart(json, bar_ctx, pie_ctx) {
    let seat_map = election.get_seats(json);
    let vote_map = election.get_votes(json);
    vote_map = swingometer.normalize_votes(vote_map);

    let vote_pairs = _.pairs(vote_map);
    // Sort by name, then by descending seat count (preserving name order in ties)
    vote_pairs = _.sortBy(vote_pairs, function(pair) { return pair[0]; });
    vote_pairs = _.sortBy(vote_pairs, function(pair) { return -pair[1]; });

    let names = _.map(vote_pairs, function(pair) { return pair[0]; });
    let votes = _.map(vote_pairs, function(pair) { return pair[1]; });
    let seats = _.map(names, function(name) { return seat_map[name]; });
    let colors = _.map(names, function(name) { return party.color(name); });

    let total_seats = json.length - 1;
    let max_percent = _.max([_.max(votes), _.max(seats) / total_seats]);

    let bar = new Chart(bar_ctx, {
        type: "bar",
        options: {
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    id: "votes",
                    position: "left",
                    ticks: {
                        beginAtZero: true,
                        suggestedMax: max_percent,
                        callback: function(value) {
                            return (value * 100).toFixed(0) + "%";
                        }
                    },
                    gridLines: {
                        drawOnChartArea: false
                    },
                    scaleLabel: {
                        labelString: "Votes"
                    }
                }, {
                    id: "seats",
                    position: "right",
                    ticks: {
                        beginAtZero: true,
                        suggestedMax: max_percent * total_seats
                    },
                    scaleLabel: {
                        labelString: "Seats"
                    }
                }]
            }
        },
        data: {
            labels: names,
            datasets: [{
                label: "Votes",
                yAxisID: "votes",
                data: votes,
                backgroundColor: colors,
                borderWidth: 1
            }, {
                label: "Seats",
                yAxisID: "seats",
                data: seats,
                backgroundColor: colors,
                borderWidth: 1
            }]
        }
    });

    let pie = new Chart(pie_ctx, {
        type: "doughnut",
        options: {
            legend: {
                display: false
            },
        },
        data: {
            labels: names,
            datasets: [{
                label: "Seats",
                data: seats,
                backgroundColor: colors,
                borderWidth: 0
            }]
        }
    });
}

$.getJSON("election_2010.json", function(json) {
    console.log("Loaded 2010 data - " + json.length + " rows");
    loadChart(json, document.getElementById("bar2010"), document.getElementById("pie2010"));
});

$.getJSON("election_2015.json", function(json) {
    console.log("Loaded 2015 data - " + json.length + " rows");
    loadChart(json, document.getElementById("bar2015"), document.getElementById("pie2015"));
});
