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
    Speaker: "#444444",
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
    "Green",
    "SNP",
    "PC",
    "Other",
];

const ZEROES = _.map(NAMES, function(name) { return 0; });
const COLORS = _.map(NAMES, function(name) { return party_color(name); });

export class View {

    constructor(div, json, options) {
        this.div = div;
        this.json = json;
        this.options = options;
        this.poll_data = options.poll;
        this.checkbox1_map = {};
        this.checkbox2_map = {};
        this.vote_charts = [];
        this.seat_charts = [];
        this.votes = ZEROES;
        this.seats = ZEROES;

        let view = this;

        this.reset_poll();

        div.find("table.poll").each(function(ix, table) {
            for (let name of NAMES) {
                let color = party_color(name);
                let tr = $(`<tr class="party" id="${name}">
                    <td>${name}</td>
                    <td><form class="form-inline"><div class="form-group"><div class="input-group"><div class="input-group-addon decrement">-</div><input type="text" class="form-control percent" style="text-align: right;"><div class="increment input-group-addon">+</div></div></div></form></td>
                    <td><div class='hbar' style='background-color: ${color}; width: 0%; height: 1.5em;'></div></td>
                </tr>`);
                if (name === "Other") {
                    // No controls for 'other'
                    tr.find(".input-group-addon").css("visibility", "hidden");
                    tr.find(".input-group-addon").attr("disabled", true);
                }
                tr.find(".increment").click(function(event) {
                    let percent = tr.find(".percent");
                    let current = parseFloat(percent.val());
                    if (!isNaN(current) && current < 100) {
                        current = Math.floor(current) + 1;
                        percent.val(current.toFixed(1));
                        percent.trigger("change");
                    }
                });
                tr.find(".decrement").click(function(event) {
                    let percent = tr.find(".percent");
                    let current = parseFloat(percent.val());
                    if (!isNaN(current) && current > 0) {
                        current = Math.ceil(current) - 1;
                        percent.val(current.toFixed(1));
                        percent.trigger("change");
                    }
                });
                tr.find(".percent").change(function(event) {
                    view.update_poll(event);
                });
                tr.css("user-select", "none");
                tr.appendTo(table);
            }
        });

        div.find("form").submit(function(e){
            e.preventDefault();
        });

        div.find("table.results").each(function(ix, table) {
            for (let name of NAMES) {
                let color = party_color(name);
                let checkbox = `<label><input type='checkbox' name='${name}' class='checkbox1'></label>&nbsp;&nbsp;`;
                if (view.options.double_checkbox) {
                    checkbox += `<label><input type='checkbox' name='${name}' class='checkbox2'></label>&nbsp;&nbsp;`;
                }
                let tr = $(`<tr class='party' id='${name}'>
                    <td>${name}
                    <td class='vote' style='text-align: right'>
                    <td><div class='hbar' style='background-color: ${color}; width: 0%; height: 1.5em;'></div>
                    <td>${checkbox}<span class='impact'>
                </tr>`);
                if (name === "Other") {
                    // No tactical voting checkbox for 'Other'
                    tr.find("label").css("visibility", "hidden");
                } else {
                    tr.click(function(event) {
                        if (event.target.tagName.toLowerCase() === "input") {
                            // Click was on a checkbox, it will already be handled correctly
                        } else {
                            // Click on another part of the row -- simulate click on first checkbox
                            tr.find("input.checkbox1").trigger("click");
                        }
                    });
                }
                tr.css("user-select", "none");
                tr.appendTo(table);
            }
        });

        div.find(".checkbox1").each(function(ix, checkbox) {
            view.checkbox1_map[checkbox.name] = checkbox;
            $(checkbox).change(function(element) {
                let other = view.checkbox2_map[checkbox.name];
                if (other && checkbox.checked) {
                    other.checked = false;
                }
                view.update(false);
            });
        });
        div.find(".checkbox2").each(function(ix, checkbox) {
            view.checkbox2_map[checkbox.name] = checkbox;
            $(checkbox).change(function(element) {
                let other = view.checkbox1_map[checkbox.name];
                if (other && checkbox.checked) {
                    other.checked = false;
                }
                view.update(false);
            });
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
                            categoryPercentage: 1.0,
                            barPercentage: 0.9,
                            gridLines: {
                                display: false,
                                color: "white",
                                lineWidth: 0,
                            },
                            ticks: {
                                callback(label, index, labels) {
                                    let value = view.seats[index];
                                    return [label, value.toFixed(0)];
                                },
                            },
                        }],
                        yAxes: [{
                            id: "seats-axis",
                            display: false,
                            ticks: {
                                beginAtZero: true,
                                max: 400,
                            },
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
                                content: "330 seats needed for majority",
                                enabled: true,
                                position: "right",
                                fontColor: Chart.defaults.global.defaultFontColor,
                                fontStyle: "normal",
                                backgroundColor: "white",
                            },
                        }],
                    },
                    tooltips: {
                        enabled: false,
                    },
                    hover: {
                        mode: null,
                    },
                },
                data: {
                    labels: NAMES,
                    datasets: [{
                        label: "Seats",
                        data: ZEROES.slice(),
                        backgroundColor: COLORS,
                    }],
                },
            });
            view.seat_charts.push(chart);
        });

        this.update(false);
    }

    reset_poll() {
        if (!this.poll_data) {
            return;
        }

        // Fill in gaps in the poll
        this.poll_map = {}
        let vote_data = model.normalize_votes(model.get_votes(this.json));
        let total = 0;
        for (let name of NAMES) {
            if (!(name === "Other")) {
                // Assume vote share is unchanged if it's not listed in the poll
                let p = this.poll_data[name] || (vote_data[name] * 100);
                p = Math.round(p * 10); // Use fixed point, 0.1% granularity
                this.poll_map[name] = p;
                total += p;
            }
        }
        this.poll_map.Other = 1000 - total;
    }
    
    update_poll(event) {
        let input = $(event.currentTarget);
        let party = input.closest("tr").attr("id");
        let new_value = parseFloat(input.val());
        if (!isNaN(new_value)) {
            new_value = Math.round(new_value * 10);
            if (new_value < 0) new_value = 0;
            if (new_value > 1000) new_value = 1000;
            let old_value = this.poll_map[party];
            // Adjust 'Other" to compensate
            let delta = new_value - old_value;
            this.poll_map[party] = new_value;
            this.poll_map.Other -= delta;
            // If necessary, shift all the other parties to keep Other in bounds
            let slop = 0;
            if (this.poll_map.Other < 0) {
                slop = this.poll_map.Other;
                this.poll_map.Other = 0;
            }
            if (this.poll_map.Other > 1000) {
                slop = this.poll_map.Other - 1000;
                this.poll_map.Other = 1000;
            }
            let movable = _.without(NAMES, party, "Other");
            for (let loop = 0; slop && movable.length && loop < 10; ++loop) {
                let fixed = [];
                for (let i = 0; i < movable.length; ++i) {
                    let name = movable[i];
                    delta = Math.round(slop / (movable.length - i));
                    slop -= delta;
                    this.poll_map[name] += delta;
                    if (this.poll_map[name] < 0) {
                        slop += this.poll_map[name];
                        this.poll_map[name] = 0;
                        fixed.push(name)
                    }
                    if (this.poll_map[name] > 1000) {
                        slop += this.poll_map[name] - 1000;
                        this.poll_map[name] = 1000;
                        fixed.push(name);
                    }
                }
                movable = _.difference(movable, fixed);
            }
        }
        this.update(true);
    }

    update(fast) {
        let animTime = fast ? 100 : 400;
        let view = this;

        let data = this.json;

        // Adjust election data for polling, if relevant
        if (this.poll_map) {
            data = model.adjust_data_with_poll(data, this.poll_map);
        }

        let old_vote_map = model.normalize_votes(model.get_votes(data));
        let old_seat_map = model.get_seats(data);
        
        // Adjust election data for tactical voting, if relevant
        // Note: strictly speaking tactics should be based on
        // the raw election data, not poll-adjusted data. But it's
        // tricky to combine that with the polling swing -- e.g. tactical
        // voting assumes some LD voters will shift to Labour, but the
        // poll puts Labour several points down. Does that apply to all
        // Labour voters, or just "true" Labour voters?
        // TODO: split tactics into two phases, "decide" and "apply".
        // Decide based on election data, apply based on polling data.
        let bloc1 = [];
        for (let party in this.checkbox1_map) {
            let checkbox = this.checkbox1_map[party];
            if (checkbox.checked) {
                bloc1.push(party);
            }
        }

        let bloc2 = [];
        for (let party in this.checkbox2_map) {
            let checkbox = this.checkbox2_map[party];
            if (checkbox.checked) {
                bloc2.push(party);
            }
        }

        data = model.adjust_data_with_tactics(data, bloc1);
        data = model.adjust_data_with_tactics(data, bloc2);
        
        let vote_map = model.normalize_votes(model.get_votes(data));
        let seat_map = model.get_seats(data);
        let used_seat_map = model.remove_unused_seats(seat_map);

        this.votes = model.count_by_party(vote_map, NAMES);
        this.seats = model.count_by_party(seat_map, NAMES);
        this.used_seats = model.count_by_party(used_seat_map, NAMES);

        for (let chart of this.vote_charts) {
            for (let i = 0; i < NAMES.length; ++i) {
                chart.data.datasets[0].data[i] = this.votes[i];
            }
            chart.update();
        }
        for (let chart of this.seat_charts) {
            for (let i = 0; i < NAMES.length; ++i) {
                let n = this.used_seats[i];
                if (n > 0) {
                    // HACK: add 2 seats, to ensure that at least one pixel is drawn
                    // The difference between 0 seats and 1 seat is pretty significant!
                    // (This doesn't affect the actual results, just the visualization)
                    n += 2;
                }
                chart.data.datasets[0].data[i] = n;
            }
            if (chart.options.annotation) {
                let needed = Math.ceil(utils.sum(this.used_seats) / 2 + 0.01);
                for (let annotation of chart.options.annotation.annotations) {
                    annotation.value = needed + 2; // See HACK above
                    annotation.label.content = needed + " seats needed for majority";
                }
            }
            chart.update();
        }
        $(this.div).find("table.poll tr.party").each(function(ix, tr) {
            let party = tr.id;
            let poll = view.poll_map[party];
            $(tr).find(".percent").val((poll * 0.1).toFixed(1));
            let w = _.min([100, poll * 0.2]) + "%";
            $(tr).find(".hbar").animate({width: w}, animTime);
        });
        $(this.div).find("table.results tr.party").each(function(ix, tr) {
            let party = tr.id;
            let new_vote = view.votes[NAMES.indexOf(party)];
            let new_text = (100 * new_vote).toFixed(1) + "";
            $(tr).find(".vote").each(function(ix, td) {
                let old_text = $(td).text();
                if (!(old_text === new_text)) {
                    $(td).fadeOut(animTime / 2, function() {
                        $(td).text(new_text).fadeIn(animTime / 2);
                    });
                }
            });

            let w = _.min([100, new_vote * 200]) + "%";
            $(tr).find(".hbar").animate({width: w}, animTime);

            let old_seats = old_seat_map[party];
            let new_seats = seat_map[party];
            let delta = new_seats - old_seats;
            let delta_text;
            delta_text = (delta > 0 ? "+" : "") + delta + " seat";
            if (Math.abs(delta) > 1) delta_text += "s";
            if (delta == 0) delta_text = "";
            $(tr).find(".impact").each(function(ix, td) {
                let old_text = $(td).text();
                if (!(old_text === delta_text)) {
                    $(td).fadeOut(200, function() {
                        $(td).removeClass("text-success");
                        $(td).removeClass("text-danger");
                        if (delta > 0) $(td).addClass("text-success");
                        if (delta < 0) $(td).addClass("text-danger");
                        $(td).text(delta_text).fadeIn(200);
                    });
                }
            });
        });
    }
}
