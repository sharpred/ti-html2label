exports.createHTML = function(html, whitelist, callback) {
    var filter,
        filterWithWhitelist,
        parser,
        walker,
        handler,
        htmlparser = require("htmlparser2"),
        entities = require("entities"),
        curry = require("curry"),
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
        var tree = [],
            tiObjects = [],
            objects = [],
            createLabel,
            getTableRowItems,
            getLabels,
            getImages,
            counter = 1;

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
                childLabels = [],
                images = [],
                key,
                innerFont = {};
            try {
                obj.type = "label";
                obj.class = item.name;
                //shallow clone of outerFont
                for (key in outerFont) {
                    if (outerFont.hasOwnProperty(key)) {
                        innerFont[key] = outerFont[key];
                    }
                }
                //record if it has come from a ul or ol
                if (item && item.parent && item.parent.name && (['ul', 'ol'].indexOf(item.parent.name) !== -1)) {
                    obj.parent = item.parent.name;
                }
                if (item.children && item.children.length > 0) {

                    //TODO refactor as cyclomatic complexity is too high (use a platform switch style function)
                    item.children.map(function(child) {
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
                                    type : Ti.UI.ATTRIBUTE_UNDERLINES_STYLE,
                                    value : Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_SINGLE
                                });
                            }
                            if (item.name === 'strike' || item.name === 's' || item.name === 'del') {
                                obj.links.push({
                                    text : item.attribs.title || txt,
                                    type : Ti.UI.ATTRIBUTE_STRIKETHROUGH_STYLE,
                                    value : Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_SINGLE
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
                                //recurse
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
                                } else {
                                    obj.type = "tableViewRow";
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
        createLabel = function(obj, style) {
            var lbl,
                attr,
                attributes = [],
                useAS = false,
                text;
            try {
                obj = obj || {};
                text = obj.text;
                //ul
                if (obj.parent === "ul") {
                    text = "\u2022 " + text;
                }
                //ol
                if (obj.parent === "ol") {
                    text = "" + counter + " " + text;
                    counter++;
                } else {
                    //reset the counter if another tag is encountered
                    counter = 1;
                }
                if (obj.links && obj.links.length > 0) {
                    useAS = true;
                    obj.links.map(function(link) {
                        attributes.push({
                            type : link.type,
                            value : link.value,
                            range : [text.indexOf(link.text), (link.text).length]
                        });
                    });
                }

                if (useAS) {
                    attr = Ti.UI.createAttributedString({
                        text : text,
                        attributes : attributes
                    });
                    lbl = Ti.UI.createLabel({
                        attributedString : attr
                    });

                    lbl.addEventListener('link', function(e) {
                        var intent;
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
                        text : text
                    });

                }
                lbl.applyProperties(style);
            } catch(ex) {
                console.error(ex);
            } finally {
                return lbl;
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
                        walker(item.children, outerFont);
                    }
                    if (item.type === "tag") {
                        if (item.name === "hr") {
                            obj.type = "hr";
                            obj.class = "hr";
                            objects.push(obj);
                        } else if (specialTags.indexOf(item.name) === -1) {
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
                                    item.children.map(function(child) {
                                        labels = getLabels(child);
                                        labels.map(function(label) {
                                            label.text = label.texts.join("");
                                            delete label.texts;
                                            objects.push(label);
                                        });
                                    });
                                } else if (item.name === 'table') {
                                    obj.type = "tableView";
                                    obj.class = "tableViewRow";
                                    obj.children = getTableRowItems(item.children);
                                    objects.push(obj);
                                }
                            }
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
                    vw;
                obj = obj || {};
                if (obj.class) {
                    klass = obj.class;
                } else {
                    klass = obj.type;
                }
                //note that you need to to use .call($) to bind createStyle to your page
                style = $.createStyle({
                    classes : klass,
                    apiName : 'Label'
                });
                if (obj.type === "label" && obj.text) {
                    obj.apiName = 'Label';

                    lbl = createLabel(obj, style);
                    if (lbl) {
                        tiObjects.push(lbl);
                    }

                }
                if (obj.type === "hr") {
                    style = $.createStyle({
                        classes : "hr",
                        apiName : 'View'
                    });

                    vw = Ti.UI.createView();
                    vw.applyProperties(style);
                    tiObjects.push(vw);

                }
                if ((obj.type === "tableView") ) {
                    //use a counter for <ol> elements
                    obj.children.map(function(child) {
                        var txt = child.text;
                        if (child.class) {
                            klass = child.class;
                        } else {
                            klass = child.type;
                        }
                        if (child.type === "tableViewSection" && child.text) {
                            style = $.createStyle({
                                classes : "tableViewHeader",
                                apiName : 'Label'
                            });
                        } else if ((child.type === "tableViewRow") && child.text) {
                            style = $.createStyle({
                                classes : klass,
                                apiName : 'Label'
                            });
                        }
                        child.text = txt;
                        lbl = createLabel(child, style);
                        if (lbl) {
                            tiObjects.push(lbl);
                        }
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
