exports.createHTML = function(html, whitelist, callback) {
    var view,
        filter,
        parser,
        walker,
        handler,
        htmlparser = require("htmlparser2"),
        entities = require("entities"),
        curry = require("curry"),
        css = require('css'),
    //needed to make $.createStyle available to this function (which must be invoked with .call)
        $ = this;

    filter = curry(function(whitelist, html, callback) {
        var filterhtml = require("filterhtml"),
            result,
            textFilter;
        try {
            textFilter = function(text, stack) {
                //stack length greater than zero means text is in a whitelisted tag
                if (stack.length > 0) {
                    return text;
                }
                //disgard tag and contents if not whitelisted. Returning null or undefined will bomb out filterhtml
                return '';
            };
            //filterhtml.filter_html ti-htmlcontract is (html text, white list json, allowed url schemas, text replacement function)
            result = filterhtml.filter_html(html, whitelist, ['http', 'https'], textFilter);
            callback(null, result);
        } catch(ex) {
            callback(ex);
        }
    });
    filterWithWhitelist = filter(whitelist);
    walker = function(dom, outerFont) {
        var lbl,
            tree = [],
            tiObjects = [],
            template,
            labels = [],
            objects = [],
            getListViewItems,
            getTableRowItems,
            getLabels,
            getImages;

        /*
         * Helper functions
         */
        getImages = function(item) {
            var images = [],
                obj = {};
            item = item || {
                attribs : {
                }
            };
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
            var obj = {
                links : [],
                texts : []
            },
                txt = "",
                labels = [],
                childLabels = [],
                images = [],
                innerFont = {},
                key;
            try {
                obj.type = "label";
                obj.class = item.name;
                //shallow clone of outerFont
                for (key in outerFont) {
                    if (outerFont.hasOwnProperty(key)) {
                        innerFont[key] = outerFont[key];
                    }
                }
                if (item.children && item.children.length > 0) {
                    item.children.map(function(child) {
                        var attr;
                        if (child.type === "text" && child.data) {
                            txt = entities.decodeHTML(child.data);
                            obj.texts.push(txt);
                            //add attributed strings
                            if (item.name === 'em' || item.name === 'i') {
                                innerFont.fontStyle = 'italic';
                                innerFont.fontWeight = 'normal';
                                obj.links.push({
                                    text : item.attribs.title || txt,
                                    type : Ti.UI.ATTRIBUTE_FONT,
                                    value : innerFont
                                });
                            }
                            if (item.name === 'strong' || item.name === 'b') {
                                innerFont.fontStyle = 'normal';
                                innerFont.fontWeight = 'bold';
                                obj.links.push({
                                    text : item.attribs.title || txt,
                                    type : Ti.UI.ATTRIBUTE_FONT,
                                    value : innerFont
                                });
                            }
                            if (item.name === 'u') {
                                obj.links.push({
                                    text : item.attribs.title || txt,
                                    type : Ti.UI.iOS.ATTRIBUTE_UNDERLINES_STYLE,
                                    value : Ti.UI.iOS.ATTRIBUTE_UNDERLINE_STYLE_SINGLE
                                });
                            }
                            if (item.name === 'strike' || item.name === 's' || item.name === 'del') {
                                obj.links.push({
                                    text : item.attribs.title || txt,
                                    type : Ti.UI.iOS.ATTRIBUTE_STRIKETHROUGH_STYLE,
                                    value : Ti.UI.iOS.ATTRIBUTE_UNDERLINE_STYLE_SINGLE
                                });
                            }
                            if (item.name === 'a' && item.attribs.href) {
                                obj.links.push({
                                    value : item.attribs.href,
                                    text : item.attribs.title || txt,
                                    type : Titanium.UI.ATTRIBUTE_LINK
                                });
                            }
                        } else if (child.type === "tag") {
                            //just push paragraph embedded images straight into objects array for assembly into a ti object
                            if (child.name === "img") {
                                images = getImages(child);
                                images.map(function(image) {
                                    objects.push(image);
                                });
                            } else {
                                childLabels = getLabels(child);
                                childLabels.map(function(lbl) {
                                    lbl.texts.map(function(txt) {
                                        obj.texts.push(txt);
                                    });
                                    lbl.links.map(function(link) {
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
                data.map(function(item) {
                    var obj = {};
                    obj.type = "listViewItem";
                    obj.attribs = item.attribs;
                    //should not be anything else, but just in case
                    if (item.type === "tag" && item.name === "li" && item.children) {
                        item.children.map(function(child) {
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
                data.map(function(item) {
                    var obj = {};
                    obj.type = "tableViewRow";
                    obj.attribs = item.attribs;
                    //should not be anything else, but just in case
                    if (item.type === "tag" && item.children) {
                        var txt = '';
                        item.children.map(function(child) {
                            if (child.type === "text" && child.data) {
                                obj.text = entities.decodeHTML(child.data);
                            } else if (child.type === "tag") {
                                //if its a header we will make it a tableViewSection
                                if (child.name === "th") {
                                    obj.type = "tableViewSection";
                                }
                                if (child.children) {
                                    child.children.map(function(kid) {
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
                tree.map(function(item) {
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
                            labels.map(function(label) {
                                label.text = label.texts.join("");
                                delete label.texts;
                                objects.push(label);
                            });
                        } else if (item.name === "img") {
                            images = getImages(item);
                            images.map(function(image) {
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
            objects.map(function(obj) {
                var lbl,
                    klass,
                    style,
                    iv,
                    data = [],
                    tv,
                    tvs,
                    tvr,
                    attr,
                    attributes = [],
                    useAS = false;
                obj = obj || {};
                if (obj.type === "label" && obj.text) {

                    if (obj.links && obj.links.length > 0) {
                        useAS = true;
                        obj.links.map(function(link) {
                            attributes.push({
                                type : link.type,
                                value : link.value,
                                range : [obj.text.indexOf(link.text), (link.text).length]
                            });
                        });
                    }

                    if (useAS) {
                        attr = Ti.UI.createAttributedString({
                            text : obj.text,
                            attributes : attributes
                        });
                        lbl = Ti.UI.createLabel({
                            attributedString : attr
                        });

                        lbl.addEventListener('link', function(e) {

                            if (Ti.Platform.osname !== "android") {
                                Ti.Platform.openURL(e.url);
                            } else {
                                intent = Ti.Android.createIntent({
                                    action : Ti.Android.ACTION_VIEW,
                                    data : e.url
                                });
                                Ti.Android.currentActivity.startActivity(intent);
                            }
                        });
                    } else {
                        lbl = Ti.UI.createLabel({
                            text : obj.text
                        });

                    }

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

                }
                if ((obj.type === "tableView") || (obj.type === "listView")) {
                    //use a counter for <ol> elements
                    var counter = 1;
                    obj.children.map(function(child) {
                        var txt;
                        //console.log("type " + child.text);
                        if (child.type === "tableViewSection" && child.text) {
                            txt = child.text;
                            style = $.createStyle({
                                classes : "tableViewHeader",
                                apiName : 'Label'
                            });
                        } else if ((child.type === "tableViewRow") || (child.type === "listViewItem") && child.text) {
                            if (obj.class) {
                                klass = obj.class;
                            } else {
                                klass = child.type;
                            }
                            if (klass === "ol") {
                                txt = "" + counter + " " + child.text;
                                counter++;
                            } else if (klass === "ul") {
                                txt = "\u2022 " + child.text;
                            } else {
                                txt = child.text;
                            }

                            //note that you need to to use .call($) to bind createStyle to your page
                            style = $.createStyle({
                                classes : klass,
                                apiName : 'Label'
                            });
                        } else {
                            Ti.API.debug("no children");
                        }
                        lbl = Ti.UI.createLabel({
                            text : txt
                        });
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
        //we pass some default font attributes for use by AS styling
        var font = {
            fontSize : 12
        };
        try {
            if (error) {
                callback(error);
            } else {
                callback(null, walker(dom, font));
            }
        } catch(ex) {
            callback(ex);
        }
    });
    parser = new htmlparser.Parser(handler);
    //remove any break tags
    html = html.replace(/\<br\>|\<br \/\>|\<hr\>|\<hr \/\>/g, "");
    // jshint ignore:line
    //remove whitespace and line breaks from markup
    html = require('htmlclean')(html);

    //filter the supplied HTML and fire the callback
    filterWithWhitelist(html, function(error, data) {
        if (error) {
            callback(error);
        } else {
            //note that the handler function fires the success callback
            parser.parseComplete(data);
        }
    });
};
