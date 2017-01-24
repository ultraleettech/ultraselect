/*
// jQuery ultraselect plugin
//
// Version 2.0.0-dev
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

        // Defaults options for the plugin
        var defaults = {
            selectAll: true,
            selectAllText: "Select All",
            noneSelected: "Select options",
            oneOrMoreSelected: "% selected",
            autoListSelected: false,
            optGroupSelectable: false,
            listHeight: 150
        };

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
            var selectionBottom = multiSelectOptions.find(".hasInput.hover").position().top + multiSelectOptions.find(".hasInput.hover").outerHeight();

            if (selectionBottom > multiSelectOptions.innerHeight()) {
                multiSelectOptions.scrollTop(multiSelectOptions.scrollTop() + selectionBottom - multiSelectOptions.innerHeight());
            }

            // check for and move up
            if (multiSelectOptions.find(".hasInput.hover").position().top < 0) {
                multiSelectOptions.scrollTop(multiSelectOptions.scrollTop() + multiSelectOptions.find(".hasInput.hover").position().top);
            }
        }

        // Update the optgroup checked status
        function updateOptGroup(optGroup) {
            var o = this.data("config");

            // Determine if the optgroup should be checked
            if (o.optGroupSelectable) {
                //var multiSelect = this.children(".select");
                var optGroupSelected = true;

                $(optGroup).children(":not(.optGroupLabel)").find("input:checkbox").each(function () {
                    if (!$(this).is(":checked")) {
                        optGroupSelected = false;
                        //return false;
                    }
                });

                $(optGroup).find("input.optGroup")
                    .prop("checked", optGroupSelected)
                    .parent()
                    .toggleClass("checked", optGroupSelected);
            }
        }

        // Update the textbox with the total number of selected items, and determine select all
        function updateSelected() {
            var multiSelect = this.children(".select");
            var multiSelectOptions = this.children(".options");
            var selection = multiSelect.find("span.selection");
            var o = this.data("config");

            var i = 0;
            var selectAll = true;
            var display = "";
            multiSelectOptions.find("input:checkbox").not(".selectAll, .optGroup").each(function () {
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
                multiSelect.find("span.selection").html(o.noneSelected);
            } else {
                if (o.oneOrMoreSelected === "*" || o.autoListSelected) {
                    selection.html(display);
                    multiSelect.attr("title", display);
                    if (o.autoListSelected) {
                        if (checkOverflow(selection[0])) {
                            selection.html(o.oneOrMoreSelected.replace("%", i));
                        }
                    }
                } else {
                    selection.html(o.oneOrMoreSelected.replace("%", i));
                }
            }

            // Determine if Select All should be checked
            if (o.selectAll) {
                multiSelectOptions.find("input.selectAll")
                    .prop("checked", selectAll)
                    .parent()
                    .toggleClass("checked", selectAll);
            }
        }

        // generate the single option element
        var inc = 0;
        function createOption(id, option) {
            var uid = id + "_" + (inc += 1);
            var $option = $("<div />", {class: "option"});
            var input = $("<input />", {
                type: "checkbox",
                name: id + "[]",
                id: uid,
            });
            var label = $("<label />", {for: uid});
            var spans = $("<span><span></span></span>");

            input.val(option.value);

            if (option.selected) {
                input.prop("checked", "checked");
            }

            return $option.append(input, label.append(spans, option.text))
                .addClass(option.classes || "")
                .data(option.data);
        }

        // generate the options/optgroups
        function createOptions(id, options, o) {
            var i;
            var el;
            var label;
            var container;
            var $options = $("<div />", {class: "options"});

            for (i = 0; i < options.length; i += 1) {
                if (options[i].optgroup) {

                    el = $("<div />");

                    el.attr("class", options[i].classes || null)
                        .addClass("optGroup")
                        .data(options[i].data);

                    label = $("<label />");

                    if (o.optGroupSelectable) {
                        var uid = id + "_" + (inc += 1);

                        el.append($("<input />", {type: "checkbox", class: "optGroup", id: uid}));
                        label.attr("for", uid).append("<span><span></span></span>");
                    }

                    el.append(label.append(options[i].optgroup))
                        .wrapInner("<div class=\"optGroupLabel\"></div>")
                        .append(createOptions(id, options[i].options, o));

                    $options.append(el);
                } else {
                    $options.append(createOption(id, options[i]));
                }
            }

            return $options.children();
        }

        // Building the actual options
        function buildOptions(options) {
            var uid = "selectAll_" + (inc += 1);
            var ultraSelect = $(this);
            var multiSelect = ultraSelect.children(".select");
            var multiSelectOptions = ultraSelect.children(".options");
            var o = this.data("config");
            var callback = this.data("callback");

            // clear the existing options
            multiSelectOptions.html("");

            // if we should have a select all option then add it
            if (o.selectAll) {
                multiSelectOptions.append(
                    $("<div />", {class: "selectAll"}).append(
                        $("<input />", {type: "checkbox", class: "selectAll", id: uid}),
                        "<span><span></span></span>",
                        $("<label />", {for: uid, text: o.selectAllText})
                    )
                );
            }

            // generate the elements for the new options
            multiSelectOptions.append(createOptions(this.attr("id"), options, o));

            // set the height of the dropdown options
            if (multiSelectOptions.height() > o.listHeight) {
                multiSelectOptions.css("height", o.listHeight + "px");
            } else {
                multiSelectOptions.css("height", "");
            }

            // Handle selectAll oncheck
            if (o.selectAll) {
                multiSelectOptions.find("input.selectAll").click(function () {
                    // update all the child checkboxes
                    multiSelectOptions.find("input:checkbox")
                        .prop("checked", $(this).is(":checked"))
                        .parent()
                        .toggleClass("checked", $(this).is(":checked"));
                });
            }

            // Handle OptGroup oncheck
            if (o.optGroupSelectable) {
                multiSelectOptions.addClass("optGroupHasCheckboxes");

                multiSelectOptions.find("input.optGroup").click(function () {
                    // update all the child checkboxes
                    $(this).parent()
                        .parent()
                        .find("input:not(.optGroup, .selectAll):checkbox")
                        .prop("checked", $(this).is(":checked"))
                        .parent()
                        .toggleClass("checked", $(this).is(":checked"));
                });
            }

            // Handle all checkboxes
            multiSelectOptions.find("input:checkbox").click(function () {
                // set the label checked class
                $(this).parent().toggleClass("checked", $(this).is(":checked"));

                updateSelected.call(ultraSelect);
                multiSelect.focus();

                if ($(this).parent().parent().hasClass("optGroup")) {
                    updateOptGroup.call(ultraSelect, $(this).parent().parent());
                }
                if (callback) {
                    callback($(this));
                }
            });

            // Initial display
            multiSelectOptions.each(function () {
                $(this).find("input:checked").parent().addClass("checked");
            });

            // Initialize selected and select all
            updateSelected.call(ultraSelect);

            // Initialize optgroups
            if (o.optGroupSelectable) {
                multiSelectOptions.find("div.optGroup").each(function () {
                    updateOptGroup.call(ultraSelect, $(this));
                });
            }

            // Enable checkbox row styling
            multiSelectOptions.find("input:checkbox").parent().addClass("hasInput");

            // Handle hovers
            multiSelectOptions.find(".hasInput").hover(function () {
                $(this).parent().find().removeClass("hover");
                $(this).addClass("hover");
            }, function () {
                $(this).removeClass("hover");
            });

            // Keyboard
            multiSelect.keydown(function (e) {

                multiSelectOptions = $(this).next(".options");

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
                        var allOptions = multiSelectOptions.find(".hasInput");
                        var oldHoverIndex = allOptions.index(allOptions.filter(".hover"));
                        var newHoverIndex = -1;

                        // if there is no current highlighted item then highlight the first item
                        if (oldHoverIndex < 0) {
                            // Default to first item
                            multiSelectOptions.find(".hasInput:first").addClass("hover");
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
                        var selectedCheckbox = multiSelectOptions.find("div.hover input:checkbox");

                        // Set the checkbox (and label class)
                        selectedCheckbox.prop("checked", !selectedCheckbox.is(":checked"))
                            .parent()
                            .toggleClass("checked", selectedCheckbox.is(":checked"));

                        // if the checkbox was the select all then set all the checkboxes
                        if (selectedCheckbox.hasClass("selectAll")) {
                            multiSelectOptions.find("input:checkbox")
                                .prop("checked", selectedCheckbox.is(":checked"))
                                .parent()
                                .addClass("checked")
                                .toggleClass("checked", selectedCheckbox.is(":checked"));
                        }

                        updateSelected.call(ultraSelect);

                        if (callback) {
                            callback($(this));
                        }

                        return false;
                    }

                    // Any other standard keyboard character (try and match the first character of an option)
                    if (e.keyCode >= 33 && e.keyCode <= 126) {
                        // find the next matching item after the current hovered item
                        var match = multiSelectOptions.find(".hasInput:startsWith(" + String.fromCharCode(e.keyCode) + ")");

                        var currentHoverIndex = match.index(match.filter(".hasInput.hover"));

                        // filter the set to any items after the current hovered item
                        var afterHoverMatch = match.filter(function (index) {
                            return index > currentHoverIndex;
                        });

                        // if there were no item after the current hovered item then try using the full search results (filtered to the first one)
                        match = (afterHoverMatch.length >= 1)
                            ? afterHoverMatch
                            : match;
                        match = match.filter(".hasInput:first");

                        if (match.length === 1) {
                            // if we found a match then move the hover
                            multiSelectOptions.find(".hasInput.hover").removeClass("hover");
                            match.addClass("hover");

                            adjustViewPort(multiSelectOptions);
                        }
                    }
                } else {
                    // Dropdown is not visible
                    if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13 || e.keyCode === 32) { //up, down, enter, space - show
                        // Show dropdown
                        $(this).removeClass("focus").trigger("click");
                        multiSelectOptions.find(".hasInput:first").addClass("hover");
                        return false;
                    }
                    //  Tab key
                    if (e.keyCode === 9) {
                        // Shift focus to next input element on page
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

        $.ultraselect = {

            version: "2.0.0-dev",
            defaults: defaults,

            init: function (src, o, callback) {
                // Merge defaults with options
                o = $.extend(true, {}, defaults, o || {});

                // Initialize each select
                src.each(function () {
                    var select = $(this);
                    var ultraSelect = $("<div />", {class: "ultraselect"});
                    var multiSelect = $("<div />", {class: "select", tabIndex: 0});
                    var multiSelectOptions = $("<div />", {class: "options"})
                        .css({
                            position: "absolute",
                            zIndex: 999,
                            visibility: "hidden"
                        });

                    multiSelect.append($("<span />", {class: "selection"}), $("<span />", {class: "arrow"}).append($("<b />")));
                    ultraSelect.append(multiSelect, multiSelectOptions);

                    select.after(ultraSelect);

                    // transfer classes and data attributes from the original select element
                    ultraSelect.addClass("class", select.attr("class"));
                    ultraSelect.data(select.data());

                    // if the select object had a width defined then match the new element to it
                    //multiSelect.find("span.selection").css("width", $(select).width() + "px");

                    // Attach the config options to the multiselect
                    ultraSelect.data("config", o);

                    // Attach the callback to the multiselect
                    ultraSelect.data("callback", callback);

                    // Serialize the select options into json options
                    var options = [];
                    select.children().each(function () {
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
                    select.remove();

                    // Add the id that was on the original select element to the new input
                    ultraSelect.attr("id", select.attr("id"));

                    // Build the dropdown options
                    buildOptions.call(ultraSelect, options);

                    // Events
                    multiSelect.hover(function () {
                        $(this).addClass("hover");
                    }, function () {
                        $(this).removeClass("hover");
                    }).click(function () {
                        // Show/hide on click
                        if ($(this).hasClass("active")) {
                            $.ultraselect.hideOptions(ultraSelect);
                        } else {
                            $.ultraselect.showOptions(ultraSelect);
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
                        if (!($(event.target).parents().addBack().is(".ultraselect > .options"))) {
                            $.ultraselect.hideOptions(ultraSelect);
                        }
                    });
                });
            },

            // Update the dropdown options
            updateOptions: function (src, options) {
                buildOptions.call(src, options);
            },

            // Hide the dropdown
            hideOptions: function (src) {
                src.children(".select").removeClass("active").removeClass("hover").next(".options").css("visibility", "hidden");
            },

            // Show the dropdown
            showOptions: function (src) {
                var select = src.children(".select");
                var options = src.children(".options");
                //var o = select.data("config"); // flagged as unused by jslint

                // Hide any open option boxes
                $.ultraselect.hideOptions($(".ultraselect"));

                // Show options
                options.css("visibility", "visible")
                    .find(".option, .optGroup").removeClass("hover");
                select.addClass("active").focus();

                // reset the scroll to the top
                options.scrollTop(0);

                // Position it
                var offset = select.position();
                options.css({
                    top: offset.top + src.outerHeight() + "px",
                    left: offset.left + "px"
                });
            },

            // get a comma-delimited list of selected values
            selectedString: function (src) {
                var selectedValues = "";
                src.find("input:checkbox:checked").not(".optGroup, .selectAll").each(function () {
                    selectedValues += $(this).attr("value") + ",";
                });
                // trim any end comma and surounding whitespace
                return selectedValues.replace(/\s*,\s*$/, "");
            }
        };

        // add a new ":startsWith" search filter
        $.expr[":"].startsWith = function (el, ignore, m) {
            var search = m[3];
            if (!search) {
                return false;
            }
            return new RegExp("^[/s]*" + search, "i").test($(el).text());
        };

        // Actual jQuery plugin definition
        $.fn.ultraselect = function (options, callback) {
            $.ultraselect.init(this, options, callback);

            return this;
        };

    }(jQuery));

}
