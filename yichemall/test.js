var cheerio = require("cheerio");

var $ = cheerio.load('<dl class="fn-clear ssy-filter-item ssy-filter-pp"></dl>');
//var x = $('h2').attr("title").split(/\s+/);
console.log($('dl.ssy-filter-pp').length);
