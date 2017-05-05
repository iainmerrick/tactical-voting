"use strict";

import _ from "underscore";
import $ from "jquery";
import "chart.js";
import "chartjs-plugin-annotation";

import * as model from "./model";
import * as utils from "./utils";

// https://en.wikipedia.org/wiki/Wikipedia:Index_of_United_Kingdom_political_parties_meta_attributes
const PARTY_COLORS = {
    Con: "#0087DC",
    Lab: "#DC241f",
    LD: "#FAA61A",
    DUP: "#D46A4C",
    SNP: "#FFFF00",
    PC: "#008142",
    SDLP: "#99FF66",
    Green: "#6AB023",
    Alliance: "#F6CB2F",
    UUP: "#9999FF",
    UKIP: "#70147A",
    SF: "#008800",
    Speaker: "#444444"
};

const GREY = "#CCCCCC";
function party_color(party) {
    party = model.party_name(party);
    return PARTY_COLORS[party] || GREY;
}

// These are the party names we'll actually show on our charts, in order.
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
const COLORS = _.map(NAMES, function(name) { return party_color(name); });

export class View {

    constructor(div, json) {
        this.div = div;
        this.json = json;
        this.checkbox_map = {};
        this.vote_charts = [];
        this.seat_charts = [];

        let view = this;

        div.find("table").each(function(ix, table) {
            for (let name of NAMES) {
                let tr;
                if (name === "Other") {
                    // No tactical voting checkbox for 'Other'
                    tr = $(`<tr id='${name}'>
                        <td>${name}
                        <td id='vote'>
                        <td id='tactics'>
                    </tr>`);
                } else {
                    // No tactical voting checkbox for 'Other'
                    tr = $(`<tr id='${name}'>
                        <td>${name}
                        <td class='vote'>
                        <td><label><input type='checkbox' name='${name}'> <span class='info'></span></label>
                    </tr>`);
                }
                tr.click(function(event) {
                    if (event.target.tagName.toLowerCase() === "input") {
                        // Click was on a checkbox, it will already be handled correctly
                    } else {
                        // Click on another part of the row -- simulate click on checkbox
                        tr.find("input").trigger("click");
                    }
                });
                tr.appendTo(table);
            }
        });

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
                    },
                    tooltips: {
                        enabled: false
                    },
                    hover: {
                        mode: null
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
                        xAxes: [{
                            id: "party-axis",
                            gridLines: {
                                display: false,
                                color: "white",
                                lineWidth: 0
                            },
                            categoryPercentage: 1.0,
                            barPerentage: 0.9
                        }],
                        yAxes: [{
                            id: "seats-axis",
                            display: false,
                            ticks: {
                                beginAtZero: true,
                                max: 400
                            }
                        }]
                    },
                    annotation: {
                        annotations: [{
                            type: "line",
                            mode: "horizontal",
                            scaleID: "seats-axis",
                            borderColor: GREY,
                            borderWidth: 3,
                            borderDash: [3, 3],
                            value: 330,
                            label: {
                                content: "330 needed for majority",
                                enabled: true,
                                position: "right",
                                fontColor: Chart.defaults.global.defaultFontColor,
                                fontStyle: "normal",
                                backgroundColor: "white"
                            }
                        }],
                    },
                    tooltips: {
                        enabled: false
                    },
                    hover: {
                        mode: null
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
            view.seat_charts.push(chart);
        });

        div.find("canvas.pie").each(function(ix, canvas) {
            let chart = new Chart(canvas, {
                type: "doughnut",
                options: {
                    legend: {
                        display: false
                    },
                    tooltips: {
                        enabled: false
                    },
                    hover: {
                        mode: null
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
        
        let vote_map = model.normalize_votes(model.get_votes(data));
        let seat_map = model.get_seats(data);
        let used_seat_map = model.remove_unused_seats(seat_map);
        console.log(seat_map);
        console.log(used_seat_map);

        let votes = model.count_by_party(vote_map, NAMES);
        let seats = model.count_by_party(seat_map, NAMES);
        let used_seats = model.count_by_party(used_seat_map, NAMES);
        console.log(seats);
        console.log(used_seats);

        for (let chart of this.vote_charts) {
            for (let i = 0; i < NAMES.length; ++i) {
                chart.data.datasets[0].data[i] = votes[i];
            }
            chart.update();
        }
        for (let chart of this.seat_charts) {
            for (let i = 0; i < NAMES.length; ++i) {
                let n = used_seats[i];
                if (n > 0) {
                    // HACK: add 1 seat, to ensure that at least one pixel is drawn
                    // The difference between 0 seats and 1 seat is pretty significant!
                    n += 1;
                }
                chart.data.datasets[0].data[i] = n;
            }
            if (chart.options.annotation) {
                let needed = Math.ceil(utils.sum(used_seats) / 2 + 0.01);
                for (let annotation of chart.options.annotation.annotations) {
                    annotation.value = needed + 1; // See HACK above
                    annotation.label.content = needed + " needed for majority";
                }
            }
            chart.update();
        }
    }
}
