# jQuery ultraselect

This component was born as a fork of a jQuery plugin called **jQuery multiSelect** by Cory S.N. LaViska ([A Beautiful Site](http://abeautifulsite.net/)).

## Demo

Either download and extract, or clone the repository. Then open the `demo/index.html` file in your web browser.


## Installation

### Download

Go to the [releases page](https://github.com/ultraleettech/ultraselect/releases) and download the latest 1.x release of the project.

### Setup

1. Extract the downloaded archive in a local directory.
2. Upload the contents of the `dist` directory to a publicly accessible directory of your site.


## Usage

### Setup

Add the following to the `<head>` section of any page you want to use the plugin on:

```html
<script src="http://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js" type="text/javascript"></script>
<script src="path/to/ultraselect/jquery.ultraselect.js" type="text/javascript"></script>
<link href="path/to/ultraselect/jquery.ultraselect.css" rel="stylesheet" type="text/css" />
```

Note, that loading the jQuery library before the plugin is required. Ultraselect requires jQuery 1.8.0+ and is compatible with up to at least jQuery 3.1.1.

### Markup

The component needs to be created as a regular `<select>` element as follows:

```html
<select class="ultraSelect" id="mySelect1" name="myOptions1[]" multiple="multiple" size="5">
    <option value="option_1">Option 1</option>
    <option value="option_2">Option 2</option>
    <option value="option_3">Option 3</option>
    <option value="option_4">Option 4</option>
    <option value="option_5">Option 5</option>
</select>
```

You can also group options, like so:

```html
<select class="ultraSelect" id="mySelect2" name="myOptions2[]" multiple="multiple" size="5">
    <optgroup label="Optgroup 1">
        <option value="option_1">Option 1</option>
        <option value="option_2">Option 2</option>
    </optgroup>
    <optgroup label="Optgroup 2">
        <option value="option_3">Option 3</option>
        <option value="option_4">Option 4</option>
        <option value="option_5">Option 5</option>
    </optgroup>
</select>
```

Pre-select any number of options you need:

```html
<select class="ultraSelect" id="mySelect3" name="myOptions3[]" multiple="multiple" size="5">
    <optgroup label="Optgroup 1">
        <option value="option_1" selected>Option 1</option>
        <option value="option_2" selected>Option 2</option>
    </optgroup>
    <optgroup label="Optgroup 2">
        <option value="option_3">Option 3</option>
        <option value="option_4">Option 4</option>
        <option value="option_5" selected>Option 5</option>
    </optgroup>
</select>
```

### Initialize components

Add the following to your page's JavaScript code to initialize the ultraselect components with default options:

```javascript
$(document).ready(function () {
    $(".ultraSelect").ultraselect();
});
```

To initialize different components with different options, select them individually and pass the options as an object:

```javascript
$(document).ready(function () {
    // Options displayed in a comma-separated list and "select all" text changed
    $("#mySelect1").ultraselect({oneOrMoreSelected: "*", selectAllText: "Pick &lsquo;em all!"});

    // Options displayed in a comma-separated list as long as they fit
    $("#mySelect2").ultraselect({autoListSelected: true});

    // Selectable option groups instead of 'select all'
    $("#mySelect3").ultraselect({selectAll: false, optGroupSelectable: true});
});
```

You can also pass an optional callback function as the second argument to the initialization function. Callback will be triggered whenever selection changes, similarly to the `change` event on a `<select>` element:

```javascript
$(document).ready(function () {
    $(".ultraSelect").ultraselect({}, function (el) {
        console.log("#" + el.attr("id") + " selection changed");
    });
});
```

#### Available options:

```javascript
// selectAll          - whether or not to display the Select All option; true/false, default = true
// selectAllText      - text to display for selecting/unselecting all options simultaneously
// noneSelected       - text to display when there are no selected items in the list
// oneOrMoreSelected  - text to display when there are one or more selected items in the list
//                      (note: you can use % as a placeholder for the number of items selected).
//                      Use * to show a comma separated list of all selected; default = "% selected"
// autoListSelected   - show comma selected list if it fits the element, oneOrMoreSelected value otherwise
// optGroupSelectable - whether or not optgroups are selectable if you use them; true/false, default = false
// listHeight         - the max height of the droptdown options
// maxWidth           - the max width of the select (use any supported units, e.g. 150px or 100%)
```


## Legacy

The original plugin has been archived [here](http://labs.abeautifulsite.net/archived/jquery-multiSelect/). If you are already using it, but want to upgrade without updating any of your code, there is a forked version at [this GitHub page](https://github.com/ultraleettech/jquery-multiselect). It contains all the fixes made to the original 1.x version of the plugin without breaking any backwards compatibility (_i.e._ the directory structure and name of the original plugin have been fully preserved). By contrast, the latest 1.x release of this repository contains a renamed and slightly restructured edition of the same thing.
