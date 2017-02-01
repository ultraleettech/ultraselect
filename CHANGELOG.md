## [2.0.0]
- Upgraded development environment to use modern node.js based tools
- Migrated to using SASS (SCSS) in place of plain CSS
- Refactored generated DOM for more flexible layout and styling
- Added option for specifying maximum width of the resulting element
- Added custom checkbox styles
- Increased default listHeight value to 200
- Refactored plugin API
- Added API method setListHeight
- Extended jQuery's .val() to work with ultraselect elements
- Added single select functionality
- Added API method "option"

## [1.3.1]
- Fixed jQuery compatibility issues

## [1.3.0]
- Added option 'autoListSelected'
- Removed extra whitespaces in the comma-separated display string
- _by Rene Aavik_

## [1.2.4]
- Refactored option generation slightly to use jQuery functions instead of raw HTML in order to make manipulation of elements more painless
- Added transfer of classes and data attributes from the original `<select>` and `<option>` elements
- Fixed bug where selectable optgroup would not be initially checked when all member options were selected
- _by Rene Aavik_

## [1.2.3]
- Fixed bug where deselecting "select all" would not work as expected
- Fixed bug where deselecting options with a click would not work as expected when "select all" was checked
- _by Rene Aavik_

## [1.2.2]
- Fixed bug where the keypress stopped showing the dropdown because in jQuery ## [1.3.2]
they changed the way ":visible" works
- Fixed some other bugs in the way the keyboard interface worked
- Changed the main textbox to an `<a>` tag (with "display: inline-block") to prevent the display text from being selected/highlighted
- Added the ability to jump to an option by typing the first character of that option (simular to a normal drop down)
- _by Andy Richmond_
- Added [] to make each control submit an HTML array so $.serialize() works properly

## [1.2.1]
- Fixed bug where input text overlapped dropdown arrow in IE (i.e. when using oneOrMoreSelected = *)
- Added option "listHeight" for min-height of the dropdown
- Fixed bug where bgiframe was causing a horizontal scrollbar and on short lists extra whitespace below the options
- _by Andy Richmond_

## [1.2.0]
- Added support for optgroups
- Added the ability for selectable optgroups (i.e. select all for an optgroup)
- _by Andy Richmond_

## [1.1.0]
- Added the ability to update the options dynamically via javascript: multiSelectOptionsUpdate(JSON)
- Added a title that displays the whole comma delimited list when using oneOrMoreSelected = *
- Moved some of the functions to be closured to make them private
- Changed the way the keyboard navigation worked to more closely match how a standard dropdown works
- _by Andy Richmond_

## [1.0.3]
- Now uses the bgiframe plugin (if it exists) to fix the IE6 layering bug.
- Forces IE6 to use a min-height of 200px (this needs to be added to the options)

## [1.0.2]
- Fixed issue where dropdown doesn"t scroll up/down with keyboard shortcuts
- Changed "$" in setTimeout to use "jQuery" to support jQuery.noConflict
- Renamed from jqueryMultiSelect.* to jquery.multiSelect.* per the standard recommended at
  http://docs.jquery.com/Plugins/Authoring (does not affect API methods)

## [1.0.1]
- Updated to work with jQuery 1.2.6+ (no longer requires the dimensions plugin)
- Changed $(this).offset() to $(this).position(), per James" and Jono"s suggestions
