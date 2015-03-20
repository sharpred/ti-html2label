exports.createHTML = function(html, whitelist, callback) {
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
                } else {
                    obj.height = Ti.UI.SIZE;
                    obj.width = Ti.UI.SIZE;
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
                childLabels = [],
                images = [];
            try {
                obj = {
                    links : [],
                    texts : []
                };
                obj.type = "label";
                obj.class = item.name;
                if (item.children && item.children.length > 0) {
                    item.children.forEach(function(child) {
                        if (child.type === "text" && child.data) {
                            txt = entities.decodeHTML(child.data);
                            obj.texts.push(txt);
                            if (item.name === 'a' && item.attribs.href) {
                                obj.links.push({
                                    href : item.attribs.href,
                                    title : item.attribs.title || txt
                                });
                            }
                        } else if (child.type === "tag") {
                            //just push paragraph embedded images straight into objects array for assembly into a ti object
                            if (child.name === "img") {
                                images = getImages(child);
                                images.forEach(function(image) {
                                    objects.push(image);
                                });
                            } else {
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
                        labels = [],
                        specialTags = ['img', 'table', 'td', 'th', 'tr', 'ol', 'ul', 'li'];
                    if (item.children) {
                        walker(item.children);
                    }
                    if (item.type === "tag") {
                        if (specialTags.indexOf(item.name) === -1) {
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
                            obj.type = item.name;
                            obj.attribs = item.attribs;
                            if (item.children && item.children.length > 0) {
                                if (item.name === 'ol' || item.name === 'ul') {
                                    obj.type = "listView";
                                    obj.class = item.name;
                                    obj.children = getListViewItems(item.children);
                                }
                                if (item.name === 'table') {
                                    obj.type = "tableView";
                                    obj.class = "tableViewRow";
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

                    if (obj.class) {
                        klass = obj.class;
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
                    if (obj.links && obj.links.length > 0) {
                        obj.links.forEach(function(link) {
                            var items = [],
                                url;
                            items.push(link.href);
                            //add a cancel button
                            items.push("cancel");

                            lbl = Ti.UI.createLabel({
                                text : link.title
                            });

                            //note that you need to to use .call($) to bind createStyle to your page
                            style = $.createStyle({
                                classes : 'a',
                                apiName : 'Label'
                            });

                            lbl.applyProperties(style);

                            var opts = {
                                title : 'Open Link?',
                                cancel : 1,
                                options : items
                            };

                            var dialog = Ti.UI.createOptionDialog(opts);

                            dialog.addEventListener('click', function(e) {
                                var intent,
                                    url,
                                    index;
                                index = e.index;
                                url = e.source.options[index];
                                if (url !== "cancel") {
                                    if (Ti.Platform.osname !== "android") {
                                        Ti.Platform.openURL(url);
                                    } else {
                                        intent = Ti.Android.createIntent({
                                            action : Ti.Android.ACTION_VIEW,
                                            data : url
                                        });
                                        Ti.Android.currentActivity.startActivity(intent);
                                    }
                                } else {
                                    dialog.hide();
                                }
                            });

                            lbl.addEventListener('click', function(e) {
                                dialog.show();
                            });
                            tiObjects.push(lbl);

                        });

                    }

                }
                if ((obj.type === "tableView") || (obj.type === "listView")) {

                    tv = Ti.UI.createTableView();

                    style = $.createStyle({
                        classes : "tableView",
                        apiName : 'TableView'
                    });

                    tv.applyProperties(style);
                    //use a counter for <ol> elements
                    var counter = 1;
                    obj.children.forEach(function(child) {
                        var txt;
                        if (child.type === "tableViewSection" && child.text) {
                            lbl = Ti.UI.createLabel({
                                text : child.text
                            });
                            style = $.createStyle({
                                classes : "tableViewHeader",
                                apiName : 'Label'
                            });
                        }
                        if ((child.type === "tableViewRow") || (child.type === "listViewItem") && child.text) {
                            if (obj.class) {
                                klass = obj.class;
                            } else {
                                klass = "tableViewRow";
                            }
                            if (klass === "ol") {
                                txt = "" + counter + " " + child.text;
                                counter++;
                            } else if (klass === "ul") {
                                txt = "\u2022 " + child.text;
                            } else {
                                txt = child.text;
                            }

                            lbl = Ti.UI.createLabel({
                                text : txt
                            });

                            //note that you need to to use .call($) to bind createStyle to your page
                            style = $.createStyle({
                                classes : klass,
                                apiName : 'Label'
                            });
                        }
                        lbl.applyProperties(style);
                        tiObjects.push(lbl);
                    });
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
            //note that the handler function fires the success callback
            parser.parseComplete(data);
        }
    });
};
