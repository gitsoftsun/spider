# -*- coding: UTF-8 -*-
__author__ = 'User19'


import urllib2
from pyquery import PyQuery as pq

DP_CITY_LIST_URL = 'http://t.dianping.com/citylist'


def get_city_list(url):
    """返回点评团购酒店业务所有的城市, 放在一个文件中， 中间用制表符分割"""
    print "get city list start..."
    citylist_html = urllib2.urlopen(url).read()
    py_cl_html = pq(citylist_html)(".cityes-list a")
    fw = open('../result/dp_city_code.txt', 'w+')
    for i in range(0, len(py_cl_html)):
        city_pinyin = py_cl_html.eq(i).attr['href'].strip('/')
        city_name = py_cl_html.eq(i).text()
        print city_name.decode("utf8")
        entity = city_pinyin+"\t"+city_name.encode('utf-8')+"\n"
        fw.write(entity)
    fw.close()
    print "end city list end"


def get_area_list():
    """根据城市来获取城市的地区的url"""
    pass


def get_deal_list():
    """根据url获取单子信息"""


def main():
    get_city_list(DP_CITY_LIST_URL)

if __name__ == '__main__':
    main()