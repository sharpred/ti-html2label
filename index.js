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
            getLabels,
            getListViewItems,
            getTableRowItems,
            getLabels,
            getImages,
            template,
            labels = [];

        getImages = function(item) {
            var images = [],
                obj = {};
            item || ( item = {
                attribs : {
                }
            });
            try {
                obj.src = item.attribs.src;
                if (item.attribs.height && item.attribs.width) {
                    obj.height = item.attribs.height;
                    obj.width = item.attribs.width;
                }
                obj.type = "imageView";
                images.push(obj);
            } catch(ex) {
                console.error(ex);
            } finally {
                return images;
            }
        };
        getLabels = function(item) {
            var obj = {},
                txt = "",
                labels = [],
                childLabels = [];
            try {
                obj = {
                    links : [],
                    texts : []
                };
                obj.type = "label";
                if (item.name === 'a' && item.attribs.href) {
                    obj.links.push(item.attribs.href);
                }
                if (item.children && item.children.length > 0) {
                    item.children.forEach(function(child) {
                        if (child.type === "text" && child.data) {
                            txt = entities.decodeHTML(child.data);
                            obj.texts.push(txt);
                        } else if (child.type === "tag") {
                            childLabels = getLabels(child);
                            childLabels.forEach(function(lbl) {
                                lbl.texts.forEach(function(txt) {
                                    obj.texts.push(txt);
                                });
                                lbl.links.forEach(function(link) {
                                    obj.links.push(link);
                                });
                            });
                        }
                    });
                }
            } catch(ex) {
                console.error(ex);
            } finally {
                return [obj];
            }
        };
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
                                obj.text = entities.decodeHTML(child.data);
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
                                obj.text = entities.decodeHTML(child.data);
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
                    var obj = {},
                        images = [],
                        labels = [];
                    if (item.children) {
                        walker(item.children);
                    }
                    if (item.type === "tag") {
                        if (item.name === 'p' || item.name === 'a') {
                            //reinitialise labels array as getLabels is recursive
                            labels = getLabels(item);
                            labels.forEach(function(label) {
                                label.text = label.texts.join("");
                                objects.push(label);
                            });
                        } else if (item.name === "img") {
                            images = getImages(item);
                            images.forEach(function(image) {
                                objects.push(image);
                            });
                        } else {
                            //non specials will be converted to simple labels
                            obj.type = item.name;
                            obj.attribs = item.attribs;

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
                            objects.push(obj);
                        }
                    }
                });
            }
            //create the titanium objects
            objects.forEach(function(obj) {
                var lbl,
                    klass,
                    style,
                    iv,
                    data = [],
                    tv,
                    tvs,
                    tvr;
                obj || ( obj = {});
                if (obj.type === "label" && obj.text) {

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
                                classes : 'tableViewRow',
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

                if (obj.type === "imageView" && obj.src && obj.height && obj.width) {
                    iv = Ti.UI.createImageView({
                        "image" : obj.src,
                        "height" : obj.height,
                        "width" : obj.width
                    });
                    style = $.createStyle({
                        classes : 'imageView',
                        apiName : 'ImageView'
                    });
                    iv.applyProperties(style);
                    tiObjects.push(iv);
                }
            });
        } catch(ex) {
            console.error(ex);
        } finally {
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
    //remove any break tags
    html = html.replace(/\<br\>|\<br \/\>|\<hr\>|\<hr \/\>/g, "");
    //remove whitespace and line breaks from markup
    html = require('htmlclean')(html);
    //filter the supplied HTML and fire the callback
    filter(html, whitelist, function(error, data) {
        if (error) {
            callback(error);
        } else {
            console.log(data);
            parser.parseComplete(data);
        }
    });
};
