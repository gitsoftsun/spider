var fs = require('fs')
var crypto = require("crypto")
var ud = require('underscore')
var Crawler = require("crawler")
var qs = require("querystring")

function didi(){
    this.prefix=["__x_","android_id","pixels","cpu","networkType","uuid"];
    this.token = "didiwuxiankejiyouxian2013";
}

didi.prototype.init = function(){
    this.sha = crypto.createHash('sha1');
    this.crawler = new Crawler({
	maxConnections:1,
	callback:function(error,result,body){
	    if(error){
		console.log(error);
	    }
	    console.log(body);
	},
	userAgent:""
    });
}

didi.prototype.start = function(){
    this.init();
    this.nearbydrivers();
}

didi.prototype.nearbydrivers = function(){
    var params = {};
    params["datatype"]= "1";
    params["vcode"]="80";
    params["android_id"]= "99ab3f322d636e6d";
    params["userlat"]= "39.52415";
    params["lng"]= "116.690001";
    params["pixels"]= "480*800";
    params["cpu"]= "Processor%09%3A+ARMv7+Processor+rev+0+%28v7l%29";
    params["networkType"]= "3G";
    params["imei"]="000000000000000";
    params["os"]="4.2.2";
    params["accuracy"]= "20.0";
    params["uuid"]= "C6B120291FE6FC50721DE1A4E1DD0A44";
    params["dviceid"]= "8848f3d6217005eba6fafed1637c34b7";
    params["model"]= "sdk";
    params["appversion"]= "3.5.2";
    params["channel"]= "211";
    params["lat"]="39.52415";
    params["userlng"]= "116.695924";
    
    params["sig"]= this.generatesignature(params);
    console.log(params.sig);
    console.log(qs.stringify(params));
    //this.crawler.queue("http://api.diditaxi.com.cn/api/v2/p_nearbydrivers?"+qs.stringify(params));
    var helper = require('../../helpers/webhelper.js');
    var opt = new helper.basic_options("api.diditaxi.com.cn","/api/v2/p_nearbydrivers","GET",false,false,params);
    helper.request_data(opt,null,function(data,args,res){
	console.log(data);
    });
}

didi.prototype.generatesignature = function(params){
    params['maptype']="soso";
    var content = Object.keys(params)
	.sort()
	.filter(function(key){
	    return ud.indexOf(this.prefix,key)===-1;
	},this)
	.map(function(key){
	    return key+params[key];
	})
	.reduce(function(pre,cur){
	    return pre+cur;
	},this.token);
    //didiwuxiankejiyouxian2013accuracy20.0appversion3.5.2channel211datatype1dviceid8848f3d6217005eba6fafed1637c34b7imei000000000000000lat39.42415lng116.695924maptypesosomodelsdkos4.2.2userlat39.42415userlng116.695924vcode80
    //didiwuxiankejiyouxian2013accuracy20.0appversion3.5.2channel211datatype1dviceid8848f3d6217005eba6fafed1637c34b7imei000000000000000lat39.52415lng116.690001maptypesosomodelsdkos4.2.2userlat39.52415userlng116.695924vcode80
    console.log(content);
    var sig = this.sha.update(content);
    delete params["maptype"];
    return sig.digest('hex');
}
var that = new didi();
that.start();