# -*- coding: utf8 -*-
'''
Created on 2014年2月28日

@author: lipore
'''
#城市,酒店,星级,房型,价格,返现,评论数,好评数,差评数,评分,图片数,是否可团购,预付

import os,sys
if __name__ == '__main__':
    from pyquery import PyQuery as pq
    folder="./hotel/"
    filelist = os.listdir(folder)
    for files in filelist:
        if files[-5:]== '.html' or files[-4:]=='.htm':
            filename=folder+files
            f = file(filename,'r')
#             print filename
            HTMLQuery = pq(f.read())
            f.close()
            tmp = files.split(',')
            #城市
            city=tmp[0]
            #酒店
            hotal=tmp[1]
            #星级
            stars=None
            #评论数
            ztcomments = HTMLQuery("div.js-page-count span")[0].text
            #好评
            ztpositiveCount = HTMLQuery("span.js-positiveCount").text()[1:-1]
            #差评
            ztnegativeCount = HTMLQuery("span.js-negativeCount").text()[1:-1]
            #整体评分
            ztscore= HTMLQuery("div.score").text()
            #图片数
            piccount = HTMLQuery("#imgTotal").text()
            #团购
            zttg = False
            #预订
            ztyd=False
            #反现
            ztcashback=False
            tmphtml = HTMLQuery("ul.e_prcDetail_ulist li")
            for li in tmphtml:
                item = pq(li)
                #房型
                fx = item("span.enc2").text()
                #价格
                price = item("span.h1_pirce b.pr").text()
                result = "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s" %(city,hotal,stars,fx,price,ztcashback,
                                                                    ztcomments,ztpositiveCount,ztnegativeCount,
                                                                    ztscore.encode("utf8"),piccount.encode("utf8"),zttg,ztyd)
                print result
                children = item(".e_prcDetail_item")
                for child in children:
                    childnode = pq(child)
                    #评分
                    score= childnode(".td2 div span b").text()
                    #预订
                    yd = childnode(".td5 div.ht_btn a.btn")
                    if yd:
                        yd=True
                    else:
                        yd =False
                    #反现
                    cashback= childnode(".td4 div a span.fan em.pr")
                    if cashback:
                        cashback=cashback.text()
                    else:
                        cashback=False
                    #价格
                    price= childnode(".td4 div p.h2_pirce b.pr").text()
                    result = "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s" %(city,hotal,stars,fx,price,cashback,
                                                                    ztcomments,ztpositiveCount,ztnegativeCount,
                                                                    score,piccount,zttg,yd)
                    print result
    pass