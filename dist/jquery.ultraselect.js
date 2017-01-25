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

/* JSLINT NOTATIONS */
/*global
    jQuery console
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
            listHeight: 200,
            maxWidth: false
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
        function adjustViewPort($options) {
            // check for and move down
            var selectionBottom = $options.find(".hasInput.hover").position().top + $options.find(".hasInput.hover").outerHeight();

            if (selectionBottom > $options.innerHeight()) {
                $options.scrollTop($options.scrollTop() + selectionBottom - $options.innerHeight());
            }

            // check for and move up
            if ($options.find(".hasInput.hover").position().top < 0) {
                $options.scrollTop($options.scrollTop() + $options.find(".hasInput.hover").position().top);
            }
        }

        // Update the optgroup checked status
        function updateOptGroup(optGroup) {
            var o = this.data("config");

            // Determine if the optgroup should be checked
            if (o.optGroupSelectable) {
                //var $select = this.children(".select");
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
            var $select = this.children(".select");
            var $options = this.children(".options");
            var selection = $select.find("span.selection");
            var o = this.data("config");

            var i = 0;
            var selectAll = true;
            var display = "";
            $options.find("input:checkbox").not(".selectAll, .optGroup").each(function () {
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
                $select.find("span.selection").html(o.noneSelected);
            } else {
                if (o.oneOrMoreSelected === "*" || o.autoListSelected) {
                    selection.html(display);
                    $select.attr("title", display);
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
                $options.find("input.selectAll")
                    .prop("checked", selectAll)
                    .parent()
                    .toggleClass("checked", selectAll);
            }
        }

        // generate the single option element
        var inc = 0;
        function createOption(id, option) {
            inc += 1;
            var uid = id + "_" + inc;
            var $option = $("<div />", {class: "option"});
            var input = $("<input />", {
                type: "checkbox",
                name: id + "[]",
                id: uid,
                tabindex: -1
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
            var uid;
            var i;
            var el;
            var label;
            var $options = $("<div />", {class: "options"});

            for (i = 0; i < options.length; i += 1) {
                if (options[i].optgroup) {

                    el = $("<div />");

                    el.attr("class", options[i].classes || null)
                        .addClass("optGroup")
                        .data(options[i].data);

                    label = $("<label />");

                    if (o.optGroupSelectable) {
                        inc += 1;
                        uid = id + "_" + inc;

                        el.append($("<input />", {type: "checkbox", class: "optGroup", id: uid, tabindex: -1}));
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
            inc += 1;
            var uid = "selectAll_" + inc;
            var $ultraSelect = $(this);
            var $select = $ultraSelect.children(".select");
            var $options = $ultraSelect.children(".options");
            var o = this.data("config");
            var callback = this.data("callback");

            // clear the existing options
            $options.html("");

            // if we should have a select all option then add it
            if (o.selectAll) {
                $options.append(
                    $("<div />", {class: "selectAll"}).append(
                        $("<input />", {type: "checkbox", class: "selectAll", id: uid, tabindex: -1}),
                        $("<label />", {for: uid}).append("<span><span></span></span>", o.selectAllText)
                    )
                );
            }

            // generate the elements for the new options
            $options.append(createOptions(this.attr("id"), options, o));

            // set the height of the dropdown options
            $ultraSelect.ultraselect("setListHeight", o.listHeight);

            // Handle selectAll oncheck
            if (o.selectAll) {
                $options.find("input.selectAll").click(function () {
                    // update all the child checkboxes
                    $options.find("input:checkbox")
                        .prop("checked", $(this).is(":checked"))
                        .parent()
                        .toggleClass("checked", $(this).is(":checked"));
                });
            }

            // Handle OptGroup oncheck
            if (o.optGroupSelectable) {
                $options.addClass("optGroupHasCheckboxes");

                $options.find("input.optGroup").click(function () {
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
            $options.find("input:checkbox").click(function () {
                // set the label checked class
                $(this).parent().toggleClass("checked", $(this).is(":checked"));

                updateSelected.call($ultraSelect);
                $select.focus();

                if ($(this).parent().parent().hasClass("optGroup")) {
                    updateOptGroup.call($ultraSelect, $(this).parent().parent());
                }
                if (callback) {
                    callback($(this));
                }
            });

            // Initial display
            $options.each(function () {
                $(this).find("input:checked").parent().addClass("checked");
            });

            // Initialize selected and select all
            updateSelected.call($ultraSelect);

            // Initialize optgroups
            if (o.optGroupSelectable) {
                $options.find("div.optGroup").each(function () {
                    updateOptGroup.call($ultraSelect, $(this));
                });
            }

            // Enable checkbox row styling
            $options.find("input:checkbox").parent().addClass("hasInput");

            // Handle hovers
            $options.find(".hasInput").hover(function () {
                $(this).parent().find().removeClass("hover");
                $(this).addClass("hover");
            }, function () {
                $(this).removeClass("hover");
            });

            // Keyboard
            $select.keydown(function (e) {

                $options = $(this).next(".options");

                // Is dropdown visible?
                if ($ultraSelect.parent().css("overflow") !== "hidden") {
                    // Dropdown is visible
                    // Tab
                    if (e.keyCode === 9) {
                        $(this).addClass("focus").trigger("click"); // esc, left, right - hide
                        //$(this).focus().next().focus();
                        return true;
                    }

                    // ESC, Left, Right
                    if (e.keyCode === 27 || e.keyCode === 37 || e.keyCode === 39) {
                        // Hide dropdown
                        $(this).addClass("focus").trigger("click");
                    }
                    // Down || Up
                    if (e.keyCode === 40 || e.keyCode === 38) {
                        var allOptions = $options.find(".hasInput");
                        var oldHoverIndex = allOptions.index(allOptions.filter(".hover"));
                        var newHoverIndex = -1;

                        // if there is no current highlighted item then highlight the first item
                        if (oldHoverIndex < 0) {
                            // Default to first item
                            $options.find(".hasInput:first").addClass("hover");
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
                            adjustViewPort($options);
                        }

                        return false;
                    }

                    // Enter, Space
                    if (e.keyCode === 13 || e.keyCode === 32) {
                        var selectedCheckbox = $options.find("div.hover input:checkbox");

                        // Set the checkbox (and label class)
                        selectedCheckbox.prop("checked", !selectedCheckbox.is(":checked"))
                            .parent()
                            .toggleClass("checked", selectedCheckbox.is(":checked"));

                        // if the checkbox was the select all then set all the checkboxes
                        if (selectedCheckbox.hasClass("selectAll")) {
                            $options.find("input:checkbox")
                                .prop("checked", selectedCheckbox.is(":checked"))
                                .parent()
                                .addClass("checked")
                                .toggleClass("checked", selectedCheckbox.is(":checked"));
                        }

                        updateSelected.call($ultraSelect);

                        if (callback) {
                            callback($(this));
                        }

                        return false;
                    }

                    // Any other standard keyboard character (try and match the first character of an option)
                    if (e.keyCode >= 33 && e.keyCode <= 126) {
                        // find the next matching item after the current hovered item
                        var match = $options.find(".hasInput:startsWith(" + String.fromCharCode(e.keyCode) + ")");

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
                            $options.find(".hasInput.hover").removeClass("hover");
                            match.addClass("hover");

                            adjustViewPort($options);
                        }
                    }
                } else {
                    // Dropdown is not visible
                    if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13 || e.keyCode === 32) { //up, down, enter, space - show
                        // Show dropdown
                        $(this).removeClass("focus").trigger("click");
                        $options.find(".hasInput:first").addClass("hover");
                        return false;
                    }
                    //  Tab key
                    if (e.keyCode === 9) {
                        // Shift focus to next input element on page
                        //$options.find(":input:first").focus();
                        return true;
                    }
                }
                // Prevent enter key from submitting form
                if (e.keyCode === 13) {
                    return false;
                }
            });
        }

        // Plugin constructor
        function UltraSelect(element, options, callback) {
            this.element = element;
            this.options = $.extend(true, {}, defaults, options);
            this.callback = callback;
            this.init();
        }

        // Expose API as plugin prototype methods
        $.extend(UltraSelect.prototype, {

            version: "2.0.0-dev",
            defaults: defaults,

            // Special initialization method that should only be called from the constructor
            init: function () {
                var conf = this.options;
                var select = $(this.element);

                // extend config based on current element
                conf.maxWidth = select.css("maxWidth") !== "none"
                    ? select.css("maxWidth")
                    : conf.maxWidth;

                // build the component
                var $ultraSelect = $("<div />", {class: "ultraselect"});
                var $select = $("<div />", {class: "select", tabIndex: 0});
                var $options = $("<div />", {class: "options", tabIndex: -1});

                $select.append($("<span />", {class: "selection"}), $("<span />", {class: "arrow"}).append($("<b />")));
                $ultraSelect.append($select, $options);

                // insert new element into DOM
                select.after($ultraSelect);

                // if the select object had a width defined then match the new element to it
                //$select.find("span.selection").css("width", $(select).width() + "px");

                // apply max width
                if (conf.maxWidth) {
                    $select.css("maxWidth", conf.maxWidth);
                }

                // transfer classes and data attributes from the original select element
                $ultraSelect.addClass(select.attr("class"));
                $ultraSelect.data(select.data());

                // save references between element and object
                this.element = $ultraSelect[0];
                $ultraSelect.data("ultraselect", this);

                // Attach the config options to the multiselect
                $ultraSelect.data("config", conf);

                // Attach the callback to the multiselect
                $ultraSelect.data("callback", this.callback);

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
                $ultraSelect.attr("id", select.attr("id"));

                // Build the dropdown options
                buildOptions.call($ultraSelect, options);

                // Set dimensions
                $ultraSelect.wrap("<div class=\"ultraselectWrapper\"></div>");
                $ultraSelect.parent().height($select.outerHeight());

                // Events
                $select.hover(function () {
                    $(this).addClass("hover");
                }, function () {
                    $(this).removeClass("hover");
                }).click(function () {
                    // Show/hide on click
                    if ($(this).hasClass("active")) {
                        $ultraSelect.ultraselect("hideOptions");
                    } else {
                        $ultraSelect.ultraselect("showOptions");
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
                        $ultraSelect.ultraselect("hideOptions");
                    }
                });
            },

            // Update the dropdown options
            updateOptions: function (options) {
                buildOptions.call(this, options);
            },

            // Hide the dropdown
            hideOptions: function () {
                this.children(".select").removeClass("active").removeClass("hover");
                this.parent().css("overflow", "hidden");
            },

            // Show the dropdown
            showOptions: function () {
                var $select = this.children(".select");
                var $options = this.children(".options");

                // Hide any open option boxes
                $(".ultraselect").ultraselect("hideOptions");

                // Show options
                this.parent().css("overflow", "visible");
                $options.find(".option, .optGroup").removeClass("hover");
                $select.addClass("active").focus();

                // reset the scroll to the top
                $options.scrollTop(0);
            },

            // Get a comma-delimited list of selected values
            selectedString: function () {
                var selectedValues = "";
                this.find("input:checkbox:checked").not(".optGroup, .selectAll").each(function () {
                    selectedValues += $(this).attr("value") + ",";
                });
                // trim any end comma and surounding whitespace
                return selectedValues.replace(/\s*,\s*$/, "");
            },

            // Set maximum options height
            setListHeight: function (listHeight) {
                var $options = this.children(".options");
                if ($options.height() > listHeight) {
                    $options.css("height", listHeight + "px");

                    // add padding in firefox to compensate for the scrollbar issue
                    if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
                        $options.addClass("_firefox");
                    }
                } else {
                    $options.css("height", "");
                }
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

        // Actual jQuery plugin definition
        $.fn.ultraselect = function (options, callback) {
            var args = Array.prototype.slice.call(arguments, 1);
            return this.each(function () {
                if (!$(this).data("ultraselect")) {
                    // Initialize
                    new UltraSelect(this, options, callback);
                } else if (typeof options === "string" && typeof UltraSelect.prototype[options] === "function") {
                    // Call plugin method
                    $(this).data("ultraselect")[options].apply($(this), args);
                } else {
                    // Error
                    console.log("ultraselect: invalid arguments");
                }
            });
        };

    }(jQuery));

}
