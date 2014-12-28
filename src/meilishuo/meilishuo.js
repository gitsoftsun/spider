var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')

function Meilishuo() {
    this.dataDir = 'appdata/';
    this.resultDir = 'result/';
    this.dealidFile = "";
    this.itemFile = '';
    this.shopFile = '';
}

Meilishuo.prototype.init = function(){
    var arguments = process.argv.splice(2);
    this.name = arguments[0];
    this.dealidFile = this.name + '.dealid.txt';
    this.itemFile = this.name + '.item.txt';
    this.shopFile = this.name + '.shop.txt';
    var start = Number(arguments[1]);
    var len = Number(arguments[2]);

    //load dealid file
    this.tasks = []
    var lines = fs.readFileSync(this.resultDir+this.dealidFile).toString().split('\n');
    for(var i = 0, l = lines.length; i < l; i++) {
        if(lines[i])
            this.tasks.push({"dealid":lines[i]});
    }

    //前闭后开区间
    this.tasks = this.tasks.slice(start,start+len);
    console.log("[INFO] task count: %d",this.tasks.length);
}

Meilishuo.prototype.start = function(){
    this.init();
    this.wgetItemHtml();
}

Meilishuo.prototype.wgetItemHtml = function(t){
    if(!t){
        if(this.tasks.length==0){
            console.log("job done.");
            return;
        }
        t = this.tasks.shift();
        console.log('task left: %d', this.tasks.length);
    }
    var opt = new helper.basic_options("www.meilishuo.com", "/share/item/" + t.dealid);
    opt.agent = false;
    console.log("[GET dealid:] %s", t.dealid);
    helper.request_data(opt,null,function(data,args,res){
    	that.getFirstDealPage(data,args,res);
    },t);
}

Meilishuo.prototype.getFirstDealPage = function(data,args,res) {
    t = args[0];
    if(!data) {
        console.log("item data empty");
        setTimeout(function () {
            that.wgetItemHtml();
        }, (Math.random() * 1 + 2) * 1000);
    } else {
        var opt = new helper.basic_options("www.meilishuo.com", "/aj/getComment/deal?tid="+t.dealid+"&page=0");
        opt.agent = false;
        t.data = data;
        helper.request_data(opt,null,function(data1,args,res){
            that.getFirstDealRecord(data1,args,res);
        },t);
    }
}

Meilishuo.prototype.getFirstDealRecord = function(data,args,res) {
    t = args[0];
    if(!data) {
        console.log("first deal page data empty");
        t.first_deal_time = '';
        that.processData(t);
    } else {
        var deal_info = JSON.parse(data);
        var c_info = deal_info['cInfos'];
        var deal_total_num = parseInt(deal_info['pages']['totalNum']);
        if(deal_total_num == 0) {
            t.first_deal_time = '';
            that.processData(t);
        } else {
            var page_total = Math.ceil(deal_total_num / 15) - 1;
            if(page_total == 0) {
                t.first_deal_time = c_info.pop()['time'];
                that.processData(t);
            } else {
                var opt = new helper.basic_options("www.meilishuo.com", "/aj/getComment/deal?tid="+t.dealid+"&page="+page_total.toString());
                opt.agent = false;
                helper.request_data(opt,null,function(data1,args,res){
                    that.parseFirstDealTime(data1,args,res);
                },t);
            }
        }
    }
}

Meilishuo.prototype.parseFirstDealTime = function(data,args,res) {
    t = args[0];
    if(!data) {
        console.log("first deal record data empty");
        t.first_deal_time = '';
        that.processData(t);
    } else {
        var deal_info = JSON.parse(data);
        var c_info = deal_info['cInfos'];
        t.first_deal_time = c_info.pop()['time'];
        that.processData(t);
    }
}

Meilishuo.prototype.processData = function(t){
    if(!t.data){
        console.log("data empty.");
        setTimeout(function () {
            that.wgetItemHtml();
        }, (Math.random() * 1 + 2) * 1000);
    } else {
        var $ = cheerio.load(t.data);

        var item_id = t.dealid;
        var item_title = $("div.item-sale h3.s_tle").text().replace(/[\n\r,，]/g,";");
        var item_price = $("#price-now").text();
        var item_sale_num = $("li.sku-item.merchandise-state ul li div").first().text().replace(/[件 ]/g, '');
        var item_category = this.name;
        var item_first_deal_time = t.first_deal_time;

        var shop = $("div.sidebar div.shop");
        var shop_url = $("div.shop-wrap a", shop).first().attr("href");
        var exec_res = /shop\/(\d{1,10})/.exec(shop_url);
        var shop_id = ''
        if(exec_res)
            shop_id = exec_res[1];
        var shop_name = $("div.shop-wrap a", shop).first().text();
        var shop_region = $("ul.shop-info li", shop).eq(0).text().replace('所在地区：', '');
        var shop_product_num = $("ul.shop-info li", shop).eq(1).text().replace('商品数量：', '');
        var shop_sale_num = $("ul.shop-info li", shop).eq(2).text().replace('销售数量：', '');
        var shop_create_time = $("ul.shop-info li", shop).eq(3).text().replace('创建时间：', '');

        var item = [item_id,item_price,item_sale_num,item_category,shop_id,item_first_deal_time,item_title,"\n"].join();
        var shop = [shop_id,shop_name,shop_region,shop_product_num,shop_sale_num,shop_create_time,"\n"].join();
        fs.appendFileSync(that.resultDir+that.itemFile,item);
        fs.appendFileSync(that.resultDir+that.shopFile,shop);

        setTimeout(function () {
            that.wgetItemHtml();
        }, 0);
    }
}

var instance = new Meilishuo();
var that = instance;
that.start();
