var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')

function Meituan() {
    this.dataDir = '../../appdata/';
    this.resultDir = '../../result/';
    this.citys = [];
    this.cityFile = 'meituan.hotel.city.txt';
    this.categorys = [];
    this.categoryFile = 'meituan.travel.category.txt';
    this.resultFile = 'meituan.travel.txt';
    this.breakpointDir = './';
    this.breakpointFile = 'meituan.travel.breakpoint';
    this.breakpoint = '';
}

Meituan.prototype.init = function(){
    this.citys = JSON.parse(fs.readFileSync(this.dataDir+this.cityFile).toString());

    var lines = fs.readFileSync(this.dataDir+this.categoryFile).toString().split('\n');
    for(var i = 0, l = lines.length; i < l; i++) {
        if(lines[i]) {
            var vals = lines[i].split(',');
            this.categorys.push({"cat1_name":'旅游',"cat2_name":vals[0],"cat_ename":vals[1]});
        }
    }

    if(fs.existsSync(this.breakpointDir+this.breakpointFile)) {
        var line = fs.readFileSync(this.breakpointDir+this.breakpointFile).toString();
        var tmp = line.split(',');
        this.breakpoint = [Number(tmp[0]), Number(tmp[1])];
    }

    this.tasks = [];
    for(var i = 0; i< this.citys.length; i++) {
        var city = this.citys[i];
        for(var j = 0; j < this.categorys.length; j++) {
            var category = this.categorys[j];
            var taskNum = i * this.categorys.length + j;
            var tmp = {"taskNum":taskNum,"cityName":city['name'],"cityUrl":city['acronym'],"cityId":city['id'],"cat1_name":category.cat1_name,"cat2_name":category.cat2_name,"cat_ename":category.cat_ename};
            this.tasks.push(tmp);
        }
    }
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]);
    var len = Number(arguments[1]);
    //前闭后开区间
    if(this.breakpoint)
        this.tasks = this.tasks.slice(this.breakpoint[0],start+len);
    else
        this.tasks = this.tasks.slice(start,start+len);

    console.log("[INFO] task count: %d",this.tasks.length);
}

Meituan.prototype.start = function(){
    this.init();
    this.wgetList();
}

Meituan.prototype.wgetList = function(t){
    if(!t) {
        if(this.tasks.length==0){
            console.log("job done.");
            return;
        }
        t = this.tasks.shift();
        if(this.breakpoint) {
            t.pn = this.breakpoint[1];
            this.breakpoint = 0;
        } else {
            t.pn = 1;
        }
        console.log('task left: %d', this.tasks.length);
    }

    var opt = new helper.basic_options(t.cityUrl+'.meituan.com', "/category/"+t.cat_ename+"/"+t.cityId+"/page"+t.pn);
    //opt.headers['User-Agent'] = "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)";
    //opt.headers['Accept'] = "text/html, application/xhtml+xml, */*";
    //opt.headers['Referer'] = t.cityUrl+'/';
    //opt.headers['Accept-Encoding'] = "gzip, deflate";
    //opt.headers['Accept-Language'] = "zh-CN";

    opt.agent = false;
    console.log("[GET ] %s, %s, %d",t.cityName,t.cat2_name,t.pn);
    fs.writeFileSync(that.breakpointDir+that.breakpointFile,t.taskNum.toString()+','+t.pn.toString()+'\n');
    helper.request_data(opt,null,function(data,args,res){
    	that.wgetDetail(data,args,res);
    },t);
}

Meituan.prototype.wgetDetail = function(data,args,res) {
    t = args[0];
    if(!data) {
        console.log("page data empty");
        t.pn++;
        if(t.pn <= 200) {
            setTimeout(function () {
                that.wgetList(t);
            }, (Math.random() * 1 + 2) * 1000);
        } else {
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 1 + 2) * 1000);
        }
    } else {
        var $ = cheerio.load(data);
        var if_empty = 0;
        //var if_empty = $("div.filter-label-list.filter-section.category-filter-wrapper").length;
        if(if_empty) {
            console.log("category empty");
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 2 + 1) * 1000);
        } else {
            var next_page = $("div.paginator-wrapper li.next").length;
            if(next_page) {
                t.exist_next_page = 1;
            } else {
                t.exist_next_page = 0;
            }
            var script = $("script:contains('M.Env[\"data-conf\"]')").text();
            var json_string = script.substring(21, script.length-1);
            var json_data = JSON.parse(json_string);
            var asyncPageviewData = json_data['asyncPageviewData'];
            if(asyncPageviewData.length == 0) {
                console.log("list empty");
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 2 + 1) * 1000);
            } else {
                var params = {};
                json_string = $("div.J-scrollloader.cf").attr('data-async-params');
                json_data = JSON.parse(json_string);
                if('data' in json_data) {
                    params = json_data['data'];
                    params['offset'] = 0;
                    params['dealids'] = asyncPageviewData['deals'];
                    post_data = require('querystring').stringify(params);

                    var opt = new helper.basic_options("www.meituan.com","/index/deallist","POST",0,1);
                    opt.agent = false;
                    helper.request_data(opt,post_data,function(data1,args,res){
                        that.processData(data1,args,res);
                    },t);
                } else {
                    console.log("params empty");
                    setTimeout(function () {
                        that.wgetList();
                    }, (Math.random() * 2 + 1) * 1000);
                }
            }
        }
    }
}

Meituan.prototype.processData = function(data,args,res) {
    t = args[0];
    if(!data) {
        console.log("ajax data empty");
        if(t.exist_next_page) {
            t.pn++;
            setTimeout(function () {
                that.wgetList(t);
            }, (Math.random() * 2 + 1) * 1000);
        } else {
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 1 + 2) * 1000);
        }
    } else {
        if('data' in data) {
            var $ = cheerio.load(data['data']);
            $("div.deal-tile").each(function() {
                var title = $("h3 span.xtitle",this).text().replace(/[\n\r,，]/g,";");
                var description = $("h3 span.short-title",this).text().replace(/[\n\r,，]/g,";");
                var url = $("h3 a",this).attr("href");
                var price = $("p.deal-tile__detail strong",this).text();
                var sale_num = $("div.deal-tile__extra p.extra-inner span.sales strong.num",this).text();
                var rate_num = $("div.deal-tile__extra p.extra-inner a.rate-info span.rate-info__count",this).text().replace("人评价",'')||0;
                var item = [t.cityName,t.cat1_name,t.cat2_name,price,sale_num,rate_num,title,description,url,"\n"].join();
                if(title)
                    fs.appendFileSync(that.resultDir+that.resultFile,item);
            });
        }
        if(t.exist_next_page) {
            t.pn++;
            setTimeout(function () {
                that.wgetList(t);
            }, (Math.random() * 2 + 1) * 1000);
        } else {
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 1 + 2) * 1000);
        }
    }
}

var instance = new Meituan();
var that = instance;
that.start();
