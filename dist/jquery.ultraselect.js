/*
 *
 * Ultraselect jQuery plugin
 *
 * Version 2.0.0-dev
 *
 * Rene Aavik
 * Ultraleet Technologies
 * GitHub: https://github.com/ultraleettech/ultraselect
 *
 * Based off of jquery-multiselect by:
 * Cory S.N. LaViska
 * A Beautiful Site (http://abeautifulsite.net/)
 * 09 September 2009
 *
 * (Amended by Andy Richmond, Letters & Science Deans' Office, University of California, Davis)
 * (Additionally, amended by Rene Aavik, Ultraleet Technologies)
 *
 * See README.md for installation and usage instructions
 *
 * Licensing & Terms of Use
 *
 * This plugin is dual-licensed under the GNU General Public License and the MIT License and
 * is copyright 2017 Ultraleet Technologies and 2008 A Beautiful Site, LLC.
 *
 */

/* LINT NOTATIONS */
/*global
    jQuery console document navigator
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

        // Determines if the passed element is overflowing its bounds.
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
            var selectionBottom = $options.find(".selectable.hover").position().top + $options.find(".selectable.hover").outerHeight();

            if (selectionBottom > $options.innerHeight()) {
                $options.scrollTop($options.scrollTop() + selectionBottom - $options.innerHeight());
            }

            // check for and move up
            if ($options.find(".selectable.hover").position().top < 0) {
                $options.scrollTop($options.scrollTop() + $options.find(".selectable.hover").position().top);
            }
        }

        // Recalculate the max width of the select element
        function updateMaxWidth() {
            var $select = this.children(".select");
            var $options = this.children(".options");
            var o = this.data("ultraselect").options;

            if (o.maxWidth) {
                if ($options.outerWidth() > $select.width()) {
                    $select.css("maxWidth", $options.outerWidth() + "px");
                }
            }
        }

        // Update the optgroup checked status
        function updateOptGroup(optGroup) {
            var o = this.data("ultraselect").options;

            // Determine if the optgroup should be checked
            if (o.optGroupSelectable) {
                var optGroupSelected = true;

                $(optGroup).children(":not(.optGroupLabel)").find("input:checkbox").each(function () {
                    if (!$(this).is(":checked")) {
                        optGroupSelected = false;
                    }
                });

                $(optGroup).find("input.optGroup")
                    .prop("checked", optGroupSelected)
                    .parent()
                    .toggleClass("checked", optGroupSelected);
            }
        }

        // Update the textbox with the total number of selected items, and determine select all
        function updateSelected(change) {
            var $select = this.children(".select");
            var $options = this.children(".options");
            var selection = $select.find("span.selection");
            var o = this.data("ultraselect").options;

            if (o.multiple) {
                var i = 0;
                var selectAll = true;
                var display = "";
                $options.find("input:checkbox:visible").not(".selectAll, .optGroup").each(function () {
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
            } else {
                // Update selection display
                var value = this.children("input").val();

                $options.find(".option").each(function() {
                    if ($(this).data("value") === value) {
                        selection.html($("label", this).text());

                        return false;
                    }
                });
            }

            // Trigger the onChange event
            if (change) {
                this.trigger("change");
            }
        }

        // generate the single option element
        var inc = 0;
        function createOption(id, option, o) {
            inc += 1;
            var uid = id + "_" + inc;
            var $option = $("<div />", {class: "option"});
            var input = $("<input />", {
                type: "checkbox",
                name: o.name,
                id: uid,
                tabindex: -1
            });
            var label = $("<label />", {for: uid});
            var spans = $("<span><span></span></span>");

            // transfer classes & data attributes
            $option
                .addClass(option.classes || "")
                .data(option.data);

            if (o.multiple) {
                input.val(option.value);

                if (option.selected) {
                    input.prop("checked", "checked");
                }

                return $option.append(input, label.append(spans, option.text))
                    .addClass(option.classes || "")
                    .data(option.data);
            } else {
                $option.data("value", option.value);

                if (option.selected) {
                    $option.data("selected", "selected");
                }

                return $option
                    .addClass("selectable")
                    .append($("<label />")
                    .html(option.text));
            }
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

                    if (o.multiple && o.optGroupSelectable) {
                        inc += 1;
                        uid = id + "_" + inc;

                        el.append($("<input />", {
                            type: "checkbox",
                            class: "optGroup",
                            id: uid,
                            tabindex: -1
                        }));
                        label.attr("for", uid).append("<span><span></span></span>");
                    }

                    el.append(label.append(options[i].optgroup))
                        .wrapInner("<div class=\"optGroupLabel\"></div>")
                        .append(createOptions(id, options[i].options, o));

                    $options.append(el);
                } else {
                    $options.append(createOption(id, options[i], o));
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
            var US = this.data("ultraselect");
            var o = US.options;
            var callback = US.callback;

            // clear the existing options
            $options.html("");

            // if we should have a select all option then add it
            if (o.multiple && o.selectAll) {
                $options.append(
                    $("<div />", {class: "selectAll"}).append(
                        $("<input />", {
                            type: "checkbox",
                            class: "selectAll",
                            id: uid,
                            tabindex: -1
                        }),
                        $("<label />", {for: uid}).append("<span><span></span></span>", o.selectAllText)
                    )
                );
            }

            // generate the elements for the new options
            $options.append(createOptions(this.attr("id"), options, o));

            // set the height of the dropdown options
            $ultraSelect.ultraselect("setListHeight", o.listHeight);

            if (o.multiple) {
                // Handle selectAll oncheck
                if (o.multiple && o.selectAll) {
                    $options.find("input.selectAll").click(function () {
                        // update all the child checkboxes
                        $options.find("input:checkbox")
                            .prop("checked", $(this).is(":checked"))
                            .parent()
                            .toggleClass("checked", $(this).is(":checked"));
                    });
                }

                // Handle OptGroup oncheck
                if (o.multiple && o.optGroupSelectable) {
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

                    updateSelected.call($ultraSelect, true);
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
                updateSelected.call($ultraSelect, false);

                // Initialize optgroups
                if (o.optGroupSelectable) {
                    $options.find("div.optGroup").each(function () {
                        updateOptGroup.call($ultraSelect, $(this));
                    });
                }

                // Enable checkbox row styling
                $options.find("input:checkbox").parent().addClass("selectable");

            } else {
                // Initialize selection
                updateSelected.call($ultraSelect, false);

                // Single select item selection
                $(".option", $options).click(function() {
                    // update value
                    $("input", $ultraSelect).val($(this).data("value"));

                    // close options
                    $ultraSelect.ultraselect("hideOptions");

                    // update selection
                    updateSelected.call($ultraSelect, true);
                    $select.focus();

                    // fire callback
                });
            }

            // Handle hovers
            $options.find(".selectable").hover(function () {
                $(this).parent().find(".hover").removeClass("hover");
                $(this).addClass("hover");
            }, function () {
                // only remove hover class for multiple select
                if (o.multiple) {
                    $(this).removeClass("hover");
                }
            });

            // Keyboard
            $select.keydown(function (e) {
                $options = $(this).next(".options");

                var allOptions;
                var oldHoverIndex;
                var newHoverIndex;

                // Is dropdown visible?
                if ($ultraSelect.parent().css("overflow") !== "hidden") {
                    // Dropdown is visible
                    // Tab
                    if (e.keyCode === 9) {
                        // esc, left, right - hide
                        $(this).addClass("focus").trigger("click");
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
                        allOptions = $options.find(".selectable");
                        oldHoverIndex = allOptions.index(allOptions.filter(".hover"));
                        newHoverIndex = -1;

                        // if there is no current highlighted item then highlight the first item
                        if (oldHoverIndex < 0) {
                            // Default to first item
                            $options.find(".selectable:first").addClass("hover");
                        } else if (e.keyCode === 40 && oldHoverIndex < allOptions.length - 1) {
                            // else if we are moving down and there is a next item then move
                            newHoverIndex = oldHoverIndex + 1;
                        } else if (e.keyCode === 38 && oldHoverIndex > 0) {
                            // else if we are moving up and there is a prev item then move
                            newHoverIndex = oldHoverIndex - 1;
                        }

                        if (newHoverIndex >= 0) {
                            // remove the current highlight
                            $(allOptions.get(oldHoverIndex)).removeClass("hover");

                            // add the new highlight
                            $(allOptions.get(newHoverIndex)).addClass("hover");

                            // Adjust the viewport if necessary
                            adjustViewPort($options);
                        }

                        return false;
                    }

                    // Enter, Space
                    if (e.keyCode === 13 || e.keyCode === 32) {
                        // Simply trigger the click event in case of a single select
                        if (!o.multiple) {
                            $(".option.hover", $options).trigger("click");
                        }

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

                        updateSelected.call($ultraSelect, true);

                        if (callback) {
                            callback($(this));
                        }

                        return false;
                    }

                    // Any other standard keyboard character (try and match the first character of an option)
                    if (e.keyCode >= 33 && e.keyCode <= 126) {
                        // find the next matching item after the current hovered item
                        var match = $options.find(".selectable:startsWith(" + String.fromCharCode(e.keyCode) + ")");

                        var currentHoverIndex = match.index(match.filter(".selectable.hover"));

                        // filter the set to any items after the current hovered item
                        var afterHoverMatch = match.filter(function (index) {
                            return index > currentHoverIndex;
                        });

                        // if there were no item after the current hovered item then try using the full search results (filtered to the first one)
                        match = (afterHoverMatch.length >= 1)
                            ? afterHoverMatch
                            : match;
                        match = match.filter(".selectable:first");

                        if (match.length === 1) {
                            // if we found a match then move the hover
                            $options.find(".selectable.hover").removeClass("hover");
                            match.addClass("hover");

                            adjustViewPort($options);
                        }
                    }
                } else {
                    // Enable up/down navigation without showing options on single selects
                    if (!o.multiple && (e.keyCode === 40 || e.keyCode === 38)) {
                        allOptions = $options.find(".selectable");
                        oldHoverIndex = allOptions.index(allOptions.filter(".hover"));
                        newHoverIndex = oldHoverIndex;

                        // if there is no current highlighted item then highlight the first item
                        if (oldHoverIndex < 0) {
                            newHoverIndex = 0;
                        } else if (e.keyCode === 40 && oldHoverIndex < allOptions.length - 1) {
                            // else if we are moving down and there is a next item then move
                            newHoverIndex = oldHoverIndex + 1;
                        } else if (e.keyCode === 38 && oldHoverIndex > 0) {
                            // else if we are moving up and there is a prev item then move
                            newHoverIndex = oldHoverIndex - 1;
                        }

                        allOptions.removeClass("hover");
                        $(allOptions.get(newHoverIndex)).addClass("hover").trigger("click");

                        return false;

                    }

                    // Dropdown is not visible
                    if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13 || e.keyCode === 32) {
                        // Up, down, enter, space - show dropdown
                        $(this).removeClass("focus").trigger("click");
                        $options.find(".selectable:first").addClass("hover");
                        return false;
                    }
                    //  Tab key
                    if (e.keyCode === 9) {
                        // Shift focus to next input element on page
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
            // Special initialization method that should only be called from the constructor
            init: function () {
                var conf = this.options;
                var select = $(this.element);

                // extend config based on current element
                conf.maxWidth = select.css("maxWidth") !== "none"
                    ? select.css("maxWidth")
                    : conf.maxWidth;

                conf.multiple = select.attr("multiple");
                conf.name = select.attr("name");

                // build the component
                var $ultraSelect = $("<div />", {class: "ultraselect"});
                var $select = $("<div />", {
                    class: "select",
                    tabIndex: 0
                });
                var $options = $("<div />", {
                    class: "options",
                    tabIndex: -1
                });

                // for single select, add hidden input for the selected option value
                if (!conf.multiple) {
                    $ultraSelect.append(
                        $("<input />", {
                            type: "hidden",
                            name: conf.name,
                            value: select.val()
                        })
                    );
                }

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

                // Serialize the select options into json options
                var options = [];
                select.children().each(function () {
                    if (this.tagName.toLowerCase() === "optgroup") {
                        var suboptions = [];
                        options.push({
                            optgroup: $(this).attr("label"),
                            options: suboptions,
                            classes: $(this).attr("class"),
                            data: $(this).data() || {}
                        });

                        $(this).children("option").each(function () {
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
                    } else if (this.tagName.toLowerCase() === "option") {
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

                // adjust max width if needed
                updateMaxWidth.call($ultraSelect);
                $(window).resize(function() {
                    updateMaxWidth.call($ultraSelect);
                });

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

            // Get selection value
            getValue: function() {
                var selected = [];
                if (this.options.multiple) {
                    $("input:not(.selectAll, .optGroup)", this.element).each(function () {
                        if ($(this).is(":checked")) {
                            selected.push($(this).val());
                        }
                    });
                } else {
                    return $("input", this.element).val();
                }

                return selected;
            },

            // Set selection value
            setValue: function(value) {
                var element = this.element;

                // single select
                if (!this.options.multiple) {
                    $("input", element).val(value);

                    $(".option", element).removeClass("hover").each(function() {
                        if ($(this).val() === value) {
                            $(this).addClass("hover");
                            $("span.selection", element).html($("label", this).text());
                        }
                    });
                }

                // normalize value
                var normalized = value ? value : [];
                if (typeof normalized === "string") {
                    normalized = [value];
                }

                // iterate over choices
                $("input:not(.selectAll, .optGroup)", element).each(function () {
                    var checked = (normalized.indexOf($(this).val()) !== -1);
                    $(this)
                        .prop("checked", checked)
                        .parent()
                        .toggleClass("checked", checked);
                });

                // update
                updateSelected.call($(element), false);

                // enable chainability
                return this;
            },

            // Update the display
            update: function () {
                updateSelected.call(this);
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
                var o = this.data("ultraselect").options;

                // Hide any open option boxes
                $(".ultraselect").ultraselect("hideOptions");

                // Show options
                this.parent().css("overflow", "visible");
                $options.find(".option, .optGroup").removeClass("hover");
                $select.addClass("active").focus();

                if (o.multiple) {
                    // reset the scroll to the top
                    $options.scrollTop(0);
                } else {
                    var value = this.children("input").val();

                    $options.find(".option").each(function() {
                        if ($(this).data("value") === value) {
                            $(this).addClass("hover");

                            return false;
                        }
                    });
                }
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
                $options.css("height", "");
                if ($options.height() > listHeight) {
                    $options.css("height", listHeight + "px");

                    // add padding in firefox to compensate for the scrollbar issue
                    if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
                        $options.addClass("_firefox");
                    }
                } else {
                    $options.css("height", "");
                }
            },

            // Get/set option values
            option: function (key, value, update) {
                if (typeof value === "undefined") {
                    // get option value
                    return this.data("ultraselect").options[key];
                } else {
                    // set option value
                    this.data("ultraselect").options[key] = value;

                    // update the elements if requested
                    if (update) {
                        updateSelected.call(this, true);
                    }
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

        // Extend jQuery's .val() function
        var $valFn = $.fn.val;
        $.fn.val = function(value) {
            var US;
            if (arguments.length === 0) {
                // we are getting the value
                US = this.data("ultraselect");
                if (US) {
                    return US.getValue();
                } else {
                    return $valFn.call(this);
                }
            } else {
                // we are setting the value
                return this.each(function() {
                    US = $(this).data("ultraselect");
                    if (US) {
                        US.setValue(value);
                    } else {
                        $valFn.call($(this), value);
                    }
                });
            }
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
