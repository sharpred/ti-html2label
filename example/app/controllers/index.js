var html,
    whitelist,
    filter;
html = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'test2.html').read().text;
//whitelist of attributes
whitelist = JSON.parse(Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'whitelist.json').read().text);

//note the use of .call($) to allow the use of $.createStyle

require("com.stepupapps.html2native").filter.call($, html, whitelist, function(err, elements) {
    var lbl;
    if (err) {
        console.error(err);
        lbl = Ti.UI.createLabel({
            text : err
        });
        $.scrollView.add(lbl);
    } else {
        elements.forEach(function(element) {
            $.scrollView.add(element);
        });
    }
    $.index.open();
});

$.index.open();