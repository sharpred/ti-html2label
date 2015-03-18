exports.filter = function(html, whitelist, callback) {
    var view,
        filter,
        parser,
        walker,
        handler,
        htmlparser = require("htmlparser2"),
        entities = require("entities"),
        css = require('css'),
    //needed to make $.createStyle available to this function (which must be invoked with .call)
        $ = this;

    filter = function(html, whitelist, callback) {
        var Filter = require("filterhtml"),
            filteredHTML,
            textFilter;
        try {
            textFilter = function(text, stack) {
                //stack length greater than zero means it is in a whitelisted tag
                if (stack.length > 0) {
                    return text;
                }
                //disgard tag and contents if not whitelisted. Returning null or undefined will bomb out filterhtml
                return '';
            };
            filteredHTML = Filter.filter_html(html, whitelist, ['http', 'https'], textFilter, ['script']);
            callback(null, filteredHTML);
        } catch(ex) {
            callback(ex);
        }
    };
    walker = function(dom) {
        var lbl,
            tree = [],
            objects = [],
            tiObjects = [],
            getListViewItems,
            getTableRowItems,
            template;
        //a listView template

        getListViewItems = function(data) {
            var kids = [];
            try {
                data.forEach(function(item) {
                    var obj = {};
                    obj.type = "listViewItem";
                    obj.attribs = item.attribs;
                    //should not be anything else, but just in case
                    if (item.type === "tag" && item.name === "li" && item.children) {
                        item.children.forEach(function(child) {
                            if (child.type === "text" && child.data) {
                                obj.text = child.data;
                            }
                        });
                    }
                    kids.push(obj);
                });
            } catch(ex) {
                console.error(ex);
            } finally {
                return kids;
            }

        };
        getTableRowItems = function(data) {
            var kids = [];
            try {
                data.forEach(function(item) {
                    var obj = {};
                    obj.type = "tableViewRow";
                    obj.attribs = item.attribs;
                    //should not be anything else, but just in case
                    if (item.type === "tag" && item.children) {
                        var txt = '';
                        item.children.forEach(function(child) {
                            if (child.type === "text" && child.data) {
                                obj.text = child.data;
                            } else if (child.type === "tag") {
                                //if its a header we will make it a tableViewSection
                                if (child.name === "th") {
                                    obj.type = "tableViewSection";
                                }
                                if (child.children) {
                                    child.children.forEach(function(kid) {
                                        if (kid.type === "text" && kid.data) {
                                            txt = txt + " " + kid.data;
                                        }
                                    });
                                    obj.text = txt;
                                }
                            }
                        });
                    }
                    kids.push(obj);
                });
            } catch(ex) {
                console.error(ex);
            } finally {
                return kids;
            }
        };
        try {
            if (dom) {
                if (dom.slice) {
                    tree = dom.slice();
                }
                tree.forEach(function(item) {
                    var obj = {};
                    if (item.children) {
                        walker(item.children);
                    }
                    if (item.type === "tag") {
                        //non specials will be converted to simple labels
                        obj.type = item.name;
                        obj.attribs = item.attribs;
                        if (item.name === 'p' || item.name === 'a') {
                            obj.type = "label";
                            if (item.name === 'a') {
                                item.attribs.class = "a";
                            }
                            if (item.children && item.children.length > 0) {
                                item.children.forEach(function(child) {
                                    if (child.type === "text" && child.data) {
                                        obj.text = child.data;
                                    } else if (child.type === "tag") {
                                        console.error("***** will be missed");
                                        console.error(child.data);
                                    }
                                });
                            }
                        } else {
                            if (item.children && item.children.length > 0) {
                                if (item.name === 'ol' || item.name === 'ul') {
                                    obj.type = "listView";
                                    obj.children = getListViewItems(item.children);
                                }
                                if (item.name === 'table') {
                                    obj.type = "tableView";
                                    obj.children = getTableRowItems(item.children);
                                }
                            }
                        }
                        objects.push(obj);
                    }
                });
            }
        } catch(ex) {
            console.error(ex);
        } finally {
            objects.forEach(function(obj) {
                var lbl,
                    klass,
                    style,
                    lv,
                    lvs,
                    data = [],
                    tv,
                    tvs,
                    tvr;
                obj || ( obj = {});
                if (obj.type === "label") {

                    lbl = Ti.UI.createLabel({
                        text : obj.text
                    });

                    if (obj.attribs && obj.attribs.class) {
                        klass = obj.attribs.class;
                    } else {
                        klass = "label";
                    }

                    //note that you need to to use .call($) to bind createStyle to your page
                    style = $.createStyle({
                        classes : klass,
                        apiName : 'Label'
                    });

                    lbl.applyProperties(style);
                    tiObjects.push(lbl);
                }
                if ((obj.type === "tableView") || (obj.type === "listView")) {
                    tv = Ti.UI.createTableView();
                    style = $.createStyle({
                        classes : "tableView",
                        apiName : 'TableView'
                    });
                    tv.applyProperties(style);
                    obj.children.forEach(function(child) {
                        if (child.type === "tableViewSection" && child.text) {
                            tvs = Ti.UI.createTableViewSection({
                                "headerTitle" : child.text
                            });
                            style = $.createStyle({
                                classes : "tableViewSection",
                                apiName : 'TableViewSection'
                            });
                            tvs.applyProperties(style);
                        }
                        if ((child.type === "tableViewRow") || (child.type === "listViewItem") && child.text) {
                            tvr = Ti.UI.createTableViewRow();
                            lbl = Ti.UI.createLabel({
                                text : child.text
                            });
                            style = $.createStyle({
                                classes : 'label',
                                apiName : 'Label'
                            });
                            lbl.applyProperties(style);
                            style = $.createStyle({
                                classes : 'tableViewRow',
                                apiName : 'TableViewRow'
                            });
                            tvr.applyProperties(style);
                            tvr.add(lbl);
                            if (tvs) {
                                tvs.add(tvr);
                            } else {
                                tv.appendRow(tvr);
                            }
                        }
                    });
                    if (tvs) {
                        tv.appendSection(tvs);
                    }
                    tiObjects.push(tv);
                }
            });
            objects = null;
            return tiObjects;
        }
    };
    handler = new htmlparser.DomHandler(function(error, dom) {
        try {
            if (error) {
                callback(error);
            } else {
                callback(null, walker(dom));
            }
        } catch(ex) {
            callback(ex);
        }
    });
    parser = new htmlparser.Parser(handler);
    //replace any break tags with new lines
    html = html.replace(/\<br\>|\<br \/\>|\<hr\>|\<hr \/\>/g, "\n");
    //filter the supplied HTML and fire the callback
    filter(html, whitelist, function(error, data) {
        if (error) {
            callback(error);
        } else {
            parser.parseComplete(data);
        }
    });
};
