/*
// jQuery ultraselect plugin
//
// Version 1.3.1
//
// Cory S.N. LaViska
// A Beautiful Site (http://abeautifulsite.net/)
// 09 September 2009
//
// (Amended by Andy Richmond, Letters & Science Deans' Office, University of California, Davis)
// (Additionally, amended by Rene Aavik, Ultraleet Technologies)
//
// See README.md for installation and usage instructions
//
// Licensing & Terms of Use
//
// This plugin is dual-licensed under the GNU General Public License and the MIT License and
// is copyright 2008 A Beautiful Site, LLC.
//
*/

/* JSLINT STUFF FIRST */

/*global
    jQuery
*/

if (jQuery) {

    (function ($) {
        "use strict";

        // Add polyfill for String.trim() function if not supported
        if (!String.prototype.trim) {
            (function () {
                // Make sure we trim BOM and NBSP
                var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
                String.prototype.trim = function () {
                    return this.replace(rtrim, "");
                };
            }());
        }

        // Determines if the passed element is overflowing its bounds,
        // either vertically or horizontally.
        // Will temporarily modify the "overflow" style to detect this
        // if necessary.
        function checkOverflow(el) {
            var curOverflow = el.style.overflow;

            if (!curOverflow || curOverflow === "visible") {
                el.style.overflow = "hidden";
            }

            var isOverflowing = el.clientWidth < el.scrollWidth;

            el.style.overflow = curOverflow;

            return isOverflowing;
        }

        // Adjust the viewport if necessary
        function adjustViewPort(multiSelectOptions) {
            // check for and move down
            var selectionBottom = multiSelectOptions.find("LABEL.hover").position().top + multiSelectOptions.find("LABEL.hover").outerHeight();

            if (selectionBottom > multiSelectOptions.innerHeight()) {
                multiSelectOptions.scrollTop(multiSelectOptions.scrollTop() + selectionBottom - multiSelectOptions.innerHeight());
            }

            // check for and move up
            if (multiSelectOptions.find("LABEL.hover").position().top < 0) {
                multiSelectOptions.scrollTop(multiSelectOptions.scrollTop() + multiSelectOptions.find("LABEL.hover").position().top);
            }
        }

        // Update the optgroup checked status
        function updateOptGroup(optGroup) {
            var multiSelect = $(this);
            var o = multiSelect.data("config");

            // Determine if the optgroup should be checked
            if (o.optGroupSelectable) {
                var optGroupSelected = true;
                $(optGroup).next().find("INPUT:checkbox").each(function () {
                    if (!$(this).is(":checked")) {
                        optGroupSelected = false;
                        return false;
                    }
                });

                $(optGroup).find("INPUT.optGroup")
                    .prop("checked", optGroupSelected)
                    .parent("LABEL")
                    .toggleClass("checked", optGroupSelected);
            }
        }

        // Update the textbox with the total number of selected items, and determine select all
        function updateSelected() {
            var multiSelect = $(this);
            var multiSelectOptions = multiSelect.next(".multiSelectOptions");
            var o = multiSelect.data("config");

            var i = 0;
            var selectAll = true;
            var display = "";
            multiSelectOptions.find("INPUT:checkbox").not(".selectAll, .optGroup").each(function () {
                if ($(this).is(":checked")) {
                    i += 1;
                    display = display + $(this).parent().text().trim() + ", ";
                } else {
                    selectAll = false;
                }
            });

            // trim any end comma and surounding whitespace
            display = display.replace(/\s*,\s*$/, "");

            if (i === 0) {
                multiSelect.find("span").html(o.noneSelected);
            } else {
                if (o.oneOrMoreSelected === "*" || o.autoListSelected) {
                    multiSelect.find("span").html(display);
                    multiSelect.attr("title", display);
                    if (o.autoListSelected) {
                        if (checkOverflow(multiSelect.find("span")[0])) {
                            multiSelect.find("span").html(o.oneOrMoreSelected.replace("%", i));
                        }
                    }
                } else {
                    multiSelect.find("span").html(o.oneOrMoreSelected.replace("%", i));
                }
            }

            // Determine if Select All should be checked
            if (o.selectAll) {
                multiSelectOptions.find("INPUT.selectAll")
                    .prop("checked", selectAll)
                    .parent("LABEL")
                    .toggleClass("checked", selectAll);
            }
        }

        // generate the single option element
        function createOption(id, option) {
            var $option = $("<label />");
            var input = $("<input />");

            input.attr({
                type: "checkbox",
                name: id + "[]"
            }).val(option.value);

            if (option.selected) {
                input.prop("checked", "checked");
            }

            return $option.append(input)
                .append(option.text)
                .attr("class", option.classes || null)
                .data(option.data);
        }

        // generate the options/optgroups
        function createOptions(id, options, o) {
            var i;
            var el;
            var container;
            var $options = $("<div />");

            for (i = 0; i < options.length; i += 1) {
                if (options[i].optgroup) {
                    el = $("<label class=\"optGroup\" />");

                    el.attr("class", options[i].classes || null)
                        .data(options[i].data);

                    if (o.optGroupSelectable) {
                        el.append("<input type=\"checkbox\" class=\"optGroup\" />");
                    }

                    el.append(" " + options[i].optgroup);

                    container = $("<div class=\"optGroupContainer\" />");
                    container.append(createOptions(id, options[i].options, o));

                    $options.append(el);
                    $options.append(container);
                } else {
                    $options.append(createOption(id, options[i]));
                }
            }

            return $options.children();
        }

        // Building the actual options
        function buildOptions(options) {
            var multiSelect = $(this);
            var multiSelectOptions = multiSelect.next(".multiSelectOptions");
            var o = multiSelect.data("config");
            var callback = multiSelect.data("callback");

            // clear the existing options
            multiSelectOptions.html("");

            // if we should have a select all option then add it
            if (o.selectAll) {
                multiSelectOptions.append("<label class=\"selectAll\"><input type=\"checkbox\" class=\"selectAll\" />" + o.selectAllText + "</label>");
            }

            // generate the elements for the new options
            multiSelectOptions.append(createOptions(multiSelect.attr("id"), options, o));

            // variables needed to account for width changes due to a scrollbar
            var initialWidth = multiSelectOptions.width();
            var hasScrollbar = false;

            // set the height of the dropdown options
            if (multiSelectOptions.height() > o.listHeight) {
                multiSelectOptions.css("height", o.listHeight + "px");
                hasScrollbar = true;
            } else {
                multiSelectOptions.css("height", "");
            }

            // if the there is a scrollbar and the browser did not already handle adjusting the width (i.e. Firefox) then we will need to manaually add the scrollbar width
            var scrollbarWidth = (hasScrollbar && (initialWidth === multiSelectOptions.width()))
                ? 17
                : 0;

            // set the width of the dropdown options
            if ((multiSelectOptions.width() + scrollbarWidth) < multiSelect.outerWidth()) {
                multiSelectOptions.css("width", multiSelect.outerWidth() - 2/*border*/ + "px");
            } else {
                multiSelectOptions.css("width", (multiSelectOptions.width() + scrollbarWidth) + "px");
            }

            // Apply bgiframe if available on IE6
            if ($.fn.bgiframe) {
                multiSelect.next(".multiSelectOptions").bgiframe({width: multiSelectOptions.width(), height: multiSelectOptions.height()});
            }

            // Handle selectAll oncheck
            if (o.selectAll) {
                multiSelectOptions.find("INPUT.selectAll").click(function () {
                    // update all the child checkboxes
                    multiSelectOptions.find("INPUT:checkbox")
                        .prop("checked", $(this).is(":checked"))
                        .parent("LABEL")
                        .toggleClass("checked", $(this).is(":checked"));
                });
            }

            // Handle OptGroup oncheck
            if (o.optGroupSelectable) {
                multiSelectOptions.addClass("optGroupHasCheckboxes");

                multiSelectOptions.find("INPUT.optGroup").click(function () {
                    // update all the child checkboxes
                    $(this).parent()
                        .next()
                        .find("INPUT:checkbox")
                        .prop("checked", $(this).is(":checked"))
                        .parent("LABEL")
                        .toggleClass("checked", $(this).is(":checked"));
                });
            }

            // Handle all checkboxes
            multiSelectOptions.find("INPUT:checkbox").click(function () {
                // set the label checked class
                $(this).parent("LABEL").toggleClass("checked", $(this).is(":checked"));

                updateSelected.call(multiSelect);
                multiSelect.focus();
                if ($(this).parent().parent().hasClass("optGroupContainer")) {
                    updateOptGroup.call(multiSelect, $(this).parent().parent().prev());
                }
                if (callback) {
                    callback($(this));
                }
            });

            // Initial display
            multiSelectOptions.each(function () {
                $(this).find("INPUT:checked").parent().addClass("checked");
            });

            // Initialize selected and select all
            updateSelected.call(multiSelect);

            // Initialize optgroups
            if (o.optGroupSelectable) {
                multiSelectOptions.find("LABEL > .optGroup").parent().each(function () {
                    updateOptGroup.call(multiSelect, $(this));
                });
            }

            // Handle hovers
            multiSelectOptions.find("LABEL:has(INPUT)").hover(function () {
                $(this).parent().find("LABEL").removeClass("hover");
                $(this).addClass("hover");
            }, function () {
                $(this).parent().find("LABEL").removeClass("hover");
            });

            // Keyboard
            multiSelect.keydown(function (e) {

                multiSelectOptions = $(this).next(".multiSelectOptions");

                // Is dropdown visible?
                if (multiSelectOptions.css("visibility") !== "hidden") {
                    // Dropdown is visible
                    // Tab
                    if (e.keyCode === 9) {
                        $(this).addClass("focus").trigger("click"); // esc, left, right - hide
                        $(this).focus().next(":input").focus();
                        return true;
                    }

                    // ESC, Left, Right
                    if (e.keyCode === 27 || e.keyCode === 37 || e.keyCode === 39) {
                        // Hide dropdown
                        $(this).addClass("focus").trigger("click");
                    }
                    // Down || Up
                    if (e.keyCode === 40 || e.keyCode === 38) {
                        var allOptions = multiSelectOptions.find("LABEL");
                        var oldHoverIndex = allOptions.index(allOptions.filter(".hover"));
                        var newHoverIndex = -1;

                        // if there is no current highlighted item then highlight the first item
                        if (oldHoverIndex < 0) {
                            // Default to first item
                            multiSelectOptions.find("LABEL:first").addClass("hover");
                        } else if (e.keyCode === 40 && oldHoverIndex < allOptions.length - 1) {
                            // else if we are moving down and there is a next item then move
                            newHoverIndex = oldHoverIndex + 1;
                        } else if (e.keyCode === 38 && oldHoverIndex > 0) {
                            // else if we are moving up and there is a prev item then move
                            newHoverIndex = oldHoverIndex - 1;
                        }

                        if (newHoverIndex >= 0) {
                            $(allOptions.get(oldHoverIndex)).removeClass("hover"); // remove the current highlight
                            $(allOptions.get(newHoverIndex)).addClass("hover"); // add the new highlight

                            // Adjust the viewport if necessary
                            adjustViewPort(multiSelectOptions);
                        }

                        return false;
                    }

                    // Enter, Space
                    if (e.keyCode === 13 || e.keyCode === 32) {
                        var selectedCheckbox = multiSelectOptions.find("LABEL.hover INPUT:checkbox");

                        // Set the checkbox (and label class)
                        selectedCheckbox.prop("checked", !selectedCheckbox.is(":checked"))
                            .parent("LABEL")
                            .toggleClass("checked", selectedCheckbox.is(":checked"));

                        // if the checkbox was the select all then set all the checkboxes
                        if (selectedCheckbox.hasClass("selectAll")) {
                            multiSelectOptions.find("INPUT:checkbox")
                                .prop("checked", selectedCheckbox.is(":checked"))
                                .parent("LABEL")
                                .addClass("checked")
                                .toggleClass("checked", selectedCheckbox.is(":checked"));
                        }

                        updateSelected.call(multiSelect);

                        if (callback) {
                            callback($(this));
                        }

                        return false;
                    }

                    // Any other standard keyboard character (try and match the first character of an option)
                    if (e.keyCode >= 33 && e.keyCode <= 126) {
                        // find the next matching item after the current hovered item
                        var match = multiSelectOptions.find("LABEL:startsWith(" + String.fromCharCode(e.keyCode) + ")");

                        var currentHoverIndex = match.index(match.filter("LABEL.hover"));

                        // filter the set to any items after the current hovered item
                        var afterHoverMatch = match.filter(function (index) {
                            return index > currentHoverIndex;
                        });

                        // if there were no item after the current hovered item then try using the full search results (filtered to the first one)
                        match = (afterHoverMatch.length >= 1)
                            ? afterHoverMatch
                            : match;
                        match = match.filter("LABEL:first");

                        if (match.length === 1) {
                            // if we found a match then move the hover
                            multiSelectOptions.find("LABEL.hover").removeClass("hover");
                            match.addClass("hover");

                            adjustViewPort(multiSelectOptions);
                        }
                    }
                } else {
                    // Dropdown is not visible
                    if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13 || e.keyCode === 32) { //up, down, enter, space - show
                        // Show dropdown
                        $(this).removeClass("focus").trigger("click");
                        multiSelectOptions.find("LABEL:first").addClass("hover");
                        return false;
                    }
                    //  Tab key
                    if (e.keyCode === 9) {
                        // Shift focus to next INPUT element on page
                        multiSelectOptions.next(":input").focus();
                        return true;
                    }
                }
                // Prevent enter key from submitting form
                if (e.keyCode === 13) {
                    return false;
                }
            });
        }

        $.extend($.fn, {
            ultraselect: function (o, callback) {
                // Merge defaults with options
                o = $.extend({}, {
                    selectAll: true,
                    selectAllText: "Select All",
                    noneSelected: "Select options",
                    oneOrMoreSelected: "% selected",
                    autoListSelected: false,
                    optGroupSelectable: false,
                    listHeight: 150
                }, o);

                // Initialize each multiSelect
                $(this).each(function () {
                    var select = $(this);
                    var html = "<a href=\"#\" class=\"multiSelect\"><span></span></a>";
                    html += "<div class=\"multiSelectOptions\" style=\"position: absolute; z-index: 99999; visibility: hidden;\"></div>";
                    $(select).after(html);

                    var multiSelect = $(select).next(".multiSelect");
                    // var multiSelectOptions = multiSelect.next(".multiSelectOptions"); // flagged as unused by jslint

                    // transfer classes and data attributes from the original select element
                    multiSelect.attr("class", select.attr("class"));
                    multiSelect.addClass("multiSelect").data(select.data());

                    // if the select object had a width defined then match the new multilsect to it
                    multiSelect.find("span").css("width", $(select).width() + "px");

                    // Attach the config options to the multiselect
                    multiSelect.data("config", o);

                    // Attach the callback to the multiselect
                    multiSelect.data("callback", callback);

                    // Serialize the select options into json options
                    var options = [];
                    $(select).children().each(function () {
                        if (this.tagName.toUpperCase() === "OPTGROUP") {
                            var suboptions = [];
                            options.push({
                                optgroup: $(this).attr("label"),
                                options: suboptions,
                                classes: $(this).attr("class"),
                                data: $(this).data() || {}
                            });

                            $(this).children("OPTION").each(function () {
                                if ($(this).val() !== "") {
                                    suboptions.push({
                                        text: $(this).html(),
                                        value: $(this).val(),
                                        selected: $(this).prop("selected"),
                                        classes: $(this).attr("class"),
                                        data: $(this).data() || {}
                                    });
                                }
                            });
                        } else if (this.tagName.toUpperCase() === "OPTION") {
                            if ($(this).val() !== "") {
                                options.push({
                                    text: $(this).html(),
                                    value: $(this).val(),
                                    selected: $(this).prop("selected"),
                                    classes: $(this).attr("class"),
                                    data: $(this).data() || {}
                                });
                            }
                        }
                    });

                    // Eliminate the original form element
                    $(select).remove();

                    // Add the id that was on the original select element to the new input
                    multiSelect.attr("id", $(select).attr("id"));

                    // Build the dropdown options
                    buildOptions.call(multiSelect, options);

                    // Events
                    multiSelect.hover(function () {
                        $(this).addClass("hover");
                    }, function () {
                        $(this).removeClass("hover");
                    }).click(function () {
                        // Show/hide on click
                        if ($(this).hasClass("active")) {
                            $(this).multiSelectOptionsHide();
                        } else {
                            $(this).multiSelectOptionsShow();
                        }
                        return false;
                    }).focus(function () {
                        // So it can be styled with CSS
                        $(this).addClass("focus");
                    }).blur(function () {
                        // So it can be styled with CSS
                        $(this).removeClass("focus");
                    });

                    // Add an event listener to the window to close the multiselect if the user clicks off
                    $(document).click(function (event) {
                        // If somewhere outside of the multiselect was clicked then hide the multiselect
                        if (!($(event.target).parents().addBack().is(".multiSelectOptions"))) {
                            multiSelect.multiSelectOptionsHide();
                        }
                    });
                });
            },

            // Update the dropdown options
            multiSelectOptionsUpdate: function (options) {
                buildOptions.call($(this), options);
            },

            // Hide the dropdown
            multiSelectOptionsHide: function () {
                $(this).removeClass("active").removeClass("hover").next(".multiSelectOptions").css("visibility", "hidden");
            },

            // Show the dropdown
            multiSelectOptionsShow: function () {
                var multiSelect = $(this);
                var multiSelectOptions = multiSelect.next(".multiSelectOptions");
                //var o = multiSelect.data("config"); // flagged as unused by jslint

                // Hide any open option boxes
                $(".multiSelect").multiSelectOptionsHide();
                multiSelectOptions.find("LABEL").removeClass("hover");
                multiSelect.addClass("active").next(".multiSelectOptions").css("visibility", "visible");
                multiSelect.focus();

                // reset the scroll to the top
                multiSelect.next(".multiSelectOptions").scrollTop(0);

                // Position it
                var offset = multiSelect.position();
                multiSelect.next(".multiSelectOptions").css({top: offset.top + $(this).outerHeight() + "px"});
                multiSelect.next(".multiSelectOptions").css({left: offset.left + "px"});
            },

            // get a coma-delimited list of selected values
            selectedValuesString: function () {
                var selectedValues = "";
                $(this).next(".multiSelectOptions").find("INPUT:checkbox:checked").not(".optGroup, .selectAll").each(function () {
                    selectedValues += $(this).attr("value") + ",";
                });
                // trim any end comma and surounding whitespace
                return selectedValues.replace(/\s*,\s*$/, "");
            }
        });

        // add a new ":startsWith" search filter
        $.expr[":"].startsWith = function (el, ignore, m) {
            var search = m[3];
            if (!search) {
                return false;
            }
            return new RegExp("^[/s]*" + search, "i").test($(el).text());
        };

    }(jQuery));

}