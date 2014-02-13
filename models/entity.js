exports.hotel=function(){
    this.city="";
    this.id = 0;
    this.name = "";
    this.shortName = "";
    this.star=0;
    this.currency = "";
    this.lowPrice="";
    this.points="";
    this.zoneName="";
    this.picCount=0;
    this.commentCount=0;

    this.isGift=false;
    this.isNew=false;
    this.isFan=false;
    this.fanPrice=0;
    this.fanType="";
    this.isQuan=false;
    this.quanPrice=0;
    this.quanType="";
    this.isCu = false;
    this.isMp=false;
    this.isMorning=false;
    this.isStar=false;
    this.isRoomFull=false;

    
    this.faclPoints= "0";//设施
    this.raAtPoints = "0";//环境
    this.ratPoints = "0";//卫生
    this.servPoints = "0";//服务
    this.rooms = [];
};
exports.hotel.prototype.toString=function(){
    var sb="";
    for(var i=0;i<this.rooms.length;i++){
        sb+=this.city+",";
        
        sb+=this.name+",";
        
        sb+=(this.zoneName==null?"":this.zoneName)+",";
        
        sb+=this.star+',';
        
        sb+=this.rooms[i].name+',';
        
        sb+=this.rooms[i].price+',';
        
        sb+=this.commentCount+',';
        
        sb+=this.picCount+',';
        
        sb+=this.points+',';
        
        sb+=this.faclPoints+',';
        
        sb+=this.raAtPoints+',';
        
        sb+=this.servPoints+',';
        
        sb+=this.ratPoints+',';
        
        var b;
        if(this.rooms[i].breakfast=="单早")
            b=1;
        else if(this.rooms[i].breakfast=="双早")
            b=2;
        else b=0;
        sb+=b+',';
        
        if(this.rooms[i].gift)
            sb+=this.rooms[i].gift+',';
        else sb+=',';
        
        sb+=(this.isCu==0?"N":"Y")+',';
        
        if(this.rooms[i].fanPrice)
            sb+=this.rooms[i].fanPrice+',';
        else sb+=",";
        
        sb+=(this.rooms[i].payType==0?"Y":"N");
        sb+='\r\n';
    }
    return sb;
}

exports.room = function(){
    this.id=0;
    this.name="";
    this.breakfast="";
    this.fan="";
    this.gift="";
    this.isCu=0;
    this.payType=1;
    this.price="";
};