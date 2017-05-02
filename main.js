"use strict";

import _ from "underscore";
import $ from "jquery";
import "chart.js";

import * as election from "./src/election.js";
import * as party from "./src/party.js";
import * as swingometer from "./src/swingometer.js";

let NAMES = [
    "Con",
    "Lab",
    "LD",
    "UKIP",
    "SNP",
    "Green",
    "Other"
];

let ZEROES = _.map(NAMES, function(name) { return 0; });
let COLORS = _.map(NAMES, function(name) { return party.color(name); });

function createCharts(div) {
    var charts = {
        votes: [],
        seats: []
    };

    div.find(".votes").each(function(ix, element) {
        let chart = new Chart(element, {
            type: "bar",
            options: {
                legend: {
                    display: false
                },
            },
            data: {
                labels: NAMES,
                datasets: [{
                    label: "Votes",
                    data: ZEROES.slice(),
                    backgroundColor: COLORS
                }]
            }
        });
        charts.votes.push(chart);
    });

    div.find(".seats").each(function(ix, element) {
        let chart = new Chart(element, {
            type: "bar",
            options: {
                legend: {
                    display: false
                },
            },
            data: {
                labels: NAMES,
                datasets: [{
                    label: "Seats",
                    data: ZEROES.slice(),
                    backgroundColor: COLORS
                }]
            }
        });
        charts.seats.push(chart);
    });

    div.find(".pie").each(function(ix, element) {
        let chart = new Chart(element, {
            type: "doughnut",
            options: {
                legend: {
                    display: false
                },
            },
            data: {
                labels: NAMES,
                datasets: [{
                    label: "Seats",
                    borderWidth: 0,
                    data: ZEROES.slice(),
                    backgroundColor: COLORS
                }]
            }
        });
        charts.seats.push(chart);
    });
    
    return charts;
}

function refreshCharts(charts, json) {
    let seat_map = election.get_seats(json);
    let vote_map = election.get_votes(json);
    vote_map = swingometer.normalize_votes(vote_map);

    for (let votes of charts.votes) {
        for (let i = 0; i < NAMES.length; ++i) {
            votes.data.datasets[0].data[i] = vote_map[NAMES[i]];
        }
        votes.update();
    }
    for (let seats of charts.seats) {
        for (let i = 0; i < NAMES.length; ++i) {
            seats.data.datasets[0].data[i] = seat_map[NAMES[i]];
        }
        seats.update();
    }
}

let election2010 = createCharts($("#election2010"));
let election2015 = createCharts($("#election2015"));

$.getJSON("election_2010.json", function(json) {
    console.log("Loaded 2010 data - " + json.length + " rows");
    refreshCharts(election2010, json);
});

$.getJSON("election_2015.json", function(json) {
    console.log("Loaded 2015 data - " + json.length + " rows");
    refreshCharts(election2015, json);
});
