var html,
    whitelist,
    filter;
html = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'text.html').read().text;
//whitelist of attributes
whitelist = JSON.parse(Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'whitelist.json').read().text);

var view = Ti.UI.createScrollView({
    "layout" : "vertical",
    "top" : 20
});

//note the use of .call($) to allow the use of $.createStyle
require("com.stepupapps.html2native").filter.call($, html, whitelist, function(err, elements) {
    if (err) {
        console.error(err);
    } else {
        view.add(elements);
    }
});
$.index.add(view);

$.index.open();
