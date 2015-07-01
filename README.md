# ti-html2native
convert html to titanium object

##Note
This project is a work in progress, so use advisedly.  Raise an issue for any problems or suggestions you have.

Note this project now uses attributed strings on ios and android, so must be built using Ti SDK 4.0.0 or above.

##Installation
1. Open a terminal prompt
2. Type `npm install`
3. Then type `grunt`
This will build the module and run the example project

##How it works
###Components
The module is built using [titaniumifier](https://www.npmjs.com/package/grunt-titaniumifier) and uses the following npm components;

* [filterhtml](https://www.npmjs.com/package/filterhtml)
* [html2parser](https://www.npmjs.com/package/htmlparser2)
* [htmlclean](https://www.npmjs.com/package/htmlclean)

###Process

1. Create a whitelist of html tags and attributes that you wish to support in your app.    See [here](http://dcollien.github.io/FilterHTML/) for information on how to create a whitelist or look at the example project for details.
4. Note that embedded tags are currently styled as the parent.  Embedded tag styling will be added when attributed strings is supported for Android in Titanium 4.x
4. Save the whitelist as a JSON document or JSON object in your app.
5. Create a .tss file that defines the tags you have whitelisted, plus the following;
  * label
  * tableView
  * tableViewSection
  * tableViewRow
  * imageView
6. Look at the example app for details of how to use the module.  Note the module uses $.createStyle extensively, so you need to use `.call($)` when invoking the createHTML function.