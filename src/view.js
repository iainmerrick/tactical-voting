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
                let color = party_color(name);
                let tr;
                if (name === "Other") {
                    // No tactical voting checkbox for 'Other'
                    tr = $(`<tr class='party' id='${name}'>
                        <td>
                        <td>${name}
                        <td class='vote' style='text-align: right'>
                        <td><div class='hbar' style='background-color: ${color}; width: 0%; height: 1.5em;'></div>
                        <td class='impact'>
                    </tr>`);
                } else {
                    // No tactical voting checkbox for 'Other'
                    tr = $(`<tr class='party' id='${name}'>
                        <td><label><input type='checkbox' name='${name}'></label>
                        <td>${name}
                        <td class='vote' style='text-align: right'>
                        <td><div class='hbar' style='background-color: ${color}; width: 0%; height: 1.5em;'></div>
                        <td class='impact'>
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
            view.update(false);
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

        this.update(true);
    }

    update(force) {
        let bloc = [];
        for (let party in this.checkbox_map) {
            let checkbox = this.checkbox_map[party];
            if (checkbox.checked) {
                bloc.push(party);
            }
        }

        let old_vote_map = model.normalize_votes(model.get_votes(this.json));
        let old_seat_map = model.get_seats(this.json);
        
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
                    // (This doesn't affect the actual results, just the visualization)
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
        $(this.div).find("tr.party").each(function(ix, tr) {
            let party = tr.id;
            let old_vote = old_vote_map[party];
            let new_vote = vote_map[party];
            console.log(party);
            console.log(old_vote);
            console.log(new_vote);
            if (force || !(old_vote === new_vote)) {
                $(tr).find("td.vote").each(function(ix, td) {
                    $(td).fadeOut(200, function() {
                        $(td).text((100 * new_vote).toFixed(1) + "").fadeIn(200);
                    });
                });
                $(tr).find(".hbar").animate({width: (new_vote * 175) + "%"}, 400);
            }

            let old_seats = old_seat_map[party];
            let new_seats = seat_map[party];
            let delta = new_seats - old_seats;
            let delta_text;
            delta_text = (delta > 0 ? "+" : "") + delta + " seat";
            if (Math.abs(delta) > 1) delta_text += "s";
            if (delta == 0) delta_text = "";
            $(tr).find("td.impact").each(function(ix, td) {
                let old_text = $(td).text();
                if (!(old_text === delta_text)) {
                    $(td).fadeOut(200, function() {
                        $(td).text(delta_text).fadeIn(200);
                    });
                }
            });
        });
    }
}
