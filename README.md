# ti-html2native
convert html to titanium object

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
2. The module currently works with the following tags;
  * p
  * img
  * table
  * tr
  * th
  * td
  * ul
  * ol
  * li
3. Other tags can be supported by remapping them in your whitelist to a p tag with a class, e.g. `"p class=\"h1\""` 
4. Save the whitelist as a JSON document or JSON object in your app.
5. Create a .tss file that defines the classes you have used in step 3, plus the following;
  * label
  * tableView
  * tableViewSection
  * tableViewRow
  * imageView
6. 
