"use strict";

import _ from "underscore";
import $ from "jquery";
import "chart.js";

import * as model from "./model";

const NAMES = [
    "Con",
    "Lab",
    "LD",
    "UKIP",
    "SNP",
    "Green",
    "Other"
];

const ZEROES = _.map(NAMES, function(name) { return 0; });
const COLORS = _.map(NAMES, function(name) { return model.party_color(name); });

export class View {

    constructor(div, json) {
        this.div = div;
        this.json = json;
        this.checkbox_map = {};
        this.vote_charts = [];
        this.seat_charts = [];

        let view = this;

        div.find("input:checkbox").each(function(ix, checkbox) {
            view.checkbox_map[checkbox.name] = checkbox;
        });
        div.find("input:checkbox").change(function(element) {
            view.update();
        });

        div.find("canvas.votes").each(function(ix, canvas) {
            let chart = new Chart(canvas, {
                type: "bar",
                options: {
                    legend: {
                        display: false
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                max: 0.5,
                                callback: function(value) {
                                    return (value * 100).toFixed(0) + "%";
                                }
                            }
                        }]
                    }
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
            view.vote_charts.push(chart);
        });

        div.find("canvas.seats").each(function(ix, canvas) {
            let chart = new Chart(canvas, {
                type: "bar",
                options: {
                    legend: {
                        display: false
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                max: 400
                            }
                        }]
                    }
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
            view.seat_charts.push(chart);
        });

        div.find("canvas.pie").each(function(ix, canvas) {
            let chart = new Chart(canvas, {
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
            view.seat_charts.push(chart);
        });

        this.update();
    }

    update() {
        let bloc = [];
        for (let party in this.checkbox_map) {
            let checkbox = this.checkbox_map[party];
            if (checkbox.checked) {
                bloc.push(party);
            }
        }

        let data = model.adjust_data_with_tactics(this.json, bloc);
        
        let seat_map = model.get_seats(data);
        let vote_map = model.get_votes(data);
        vote_map = model.normalize_votes(vote_map);

        for (let votes of this.vote_charts) {
            for (let i = 0; i < NAMES.length; ++i) {
                votes.data.datasets[0].data[i] = vote_map[NAMES[i]];
            }
            votes.update();
        }
        for (let seats of this.seat_charts) {
            for (let i = 0; i < NAMES.length; ++i) {
                seats.data.datasets[0].data[i] = seat_map[NAMES[i]];
            }
            seats.update();
        }
    }
}