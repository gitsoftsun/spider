#!/usr/bin/env python
# -*- coding:utf-8 -*-

__author__ = 'xiaoghu@cisco.com'


import re
import urllib
import multiprocessing as mp
import codecs
import time
import ipaddr
import datetime
import traceback
from selenium import webdriver
from selenium.webdriver.common.proxy import *
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
import time
from selenium.webdriver.common.by import By

fromDate = '2014-04-01'
toDate = '2014-04-02'


# city_map = {
#     u'北京': 'beijing_city',
#     u'上海': 'shanghai_city',
#     u'丽江': 'lijiang',
#     u'九江': 'jiujiang',
#     u'佛山': 'foshan',
#     u'包头': 'baotou',
#     u'厦门': 'xiamen',
#     u'吉林': 'jilin',
#     u'大连': 'dalian',
#     u'宁波': 'ningbo',
#     u'常州': 'changzhou',
#     u'广州': 'guangzhou',
#     u'徐州': 'xuzhou',
#     u'成都': 'chengdu',
#     u'无锡': 'wuxi',
#     u'杭州': 'guizhou',
#     u'桂林': 'guilin',
#     u'武汉': 'wuhan',
#     u'汉中': 'hanzhong',
#     u'沈阳': 'shenyang',
#     u'深圳': 'shenzhen',
#     u'温州': 'wenzhou',
#     u'烟台': 'yantai',
#     u'西安': 'xian',
#     u'青岛': 'qingdao',
#     u'秦皇岛': 'qinhuangdao',
#     u'连云港': 'lianyungang',
#     u'呼和浩特': 'huhehaote'
# }

city_map = {
    '北京': 'beijing_city',
    '上海': 'shanghai_city',
    '丽江': 'lijiang',
    '九江': 'jiujiang',
    '佛山': 'foshan',
    '包头': 'baotou',
    '厦门': 'xiamen',
    '吉林': 'jilin',
    '大连': 'dalian',
    '宁波': 'ningbo',
    '常州': 'changzhou',
    '广州': 'guangzhou',
    '徐州': 'xuzhou',
    '成都': 'chengdu',
    '无锡': 'wuxi',
    '杭州': 'guizhou',
    '桂林': 'guilin',
    '武汉': 'wuhan',
    '汉中': 'hanzhong',
    '沈阳': 'shenyang',
    '深圳': 'shenzhen',
    '温州': 'wenzhou',
    '烟台': 'yantai',
    '西安': 'xian',
    '青岛': 'qingdao',
    '秦皇岛': 'qinhuangdao',
    '连云港': 'lianyungang',
    '呼和浩特': 'huhehaote'
}

reverse_city_map = dict((v, k) for k, v in city_map.iteritems())


def get_city_hotel_tuple_list():
    city_hotel_tuple_list = []

    fp = codecs.open('hotel.sample.txt', 'r', 'utf8')
    lines = fp.readlines()
    for l in lines:
        l = l.replace('\r', '').replace('\n', '')
        # city = city_map[l.split(',')[0]]
        city = l.split(',')[0]
        hotel = l.split(',')[1]
        city_hotel_tuple_list.append((city, hotel))
        pass

    return city_hotel_tuple_list
    pass


def one_driver_all_hotel():
    driver = webdriver.Firefox()

    city_hotel_tuple_list = get_city_hotel_tuple_list()

    num = len(city_hotel_tuple_list)

    for i in range(num):
        city = city_hotel_tuple_list[i][0]
        hotel = city_hotel_tuple_list[i][1]
        # city = city.encode('utf8')
        # hotel = hotel.encode('utf8')
        print "city: %s, hotel: %s" % (city, hotel)
        one_driver_hotel(driver, city, hotel)
        pass
    driver.close()
    pass


def one_driver_hotel(driver, city, hotel):
    site = 'http://hotel.qunar.com'
    # site = site.replace('%(city)', city).replace('%(hotel)', hotel)     # urllib.quote(hotel))
    # print site
    driver.get(site)
    time.sleep(6)

    driver.find_element_by_name('toCity').clear()
    driver.find_element_by_name('toCity').send_keys(city)
    driver.find_element_by_name('fromDate').clear()
    driver.find_element_by_name('fromDate').send_keys(fromDate)
    driver.find_element_by_name('toDate').clear()
    driver.find_element_by_name('toDate').send_keys(toDate)
    driver.find_element_by_name('q').clear()
    driver.find_element_by_name('q').send_keys(hotel)
    driver.find_element_by_css_selector('button.btn').click()

    flag = True
    while flag:

        try:
            if driver.find_element_by_css_selector('div.msg'):
                print "等待输入验证码\n"
                continue
                pass
        except Exception as e:
            pass

        try:
            time.sleep(6)
            parentTR = driver.find_element_by_xpath("//span[@class='namered']//..")
            new_url = parentTR.get_attribute('href')
            print new_url
            driver.get(new_url)
            time.sleep(6)
            pass
        except Exception,e:
            print u'failed: ' + city + hotel
            print e
            continue
            pass

        try:
            if driver.find_element_by_css_selector('div.msg'):
                print "等待输入验证码\n"
                continue
                pass
        except Exception as e:
            pass

        # 展开报价
        try:
            # elems = driver.find_elements_by_xpath("//li[@class='defaultpricetype']")

            elems = driver.find_elements_by_css_selector('li.e_prcDetail_on a.btn_openPrc')
            print len(elems)
            for elem in elems:
                elem.click()

            elems = driver.find_elements_by_css_selector('a.btn_openPrc')
            print len(elems)
            for elem in elems:
                elem.click()
            elems = driver.find_elements_by_css_selector('a.icoR_open')
            time.sleep(1)
            for e in elems:
                e.click();
            time.sleep(1);
                # classes = elem.get_attribute('class')
                # print classes
                # if not 'e_prcDetail_on' in classes:
                #     elem.click()
            pass
        except Exception as e:
            print e
            print traceback.format_exc()
            pass

        elem = driver.find_element_by_xpath("//*")
        source_code = elem.get_attribute("outerHTML")
        # print type(source_code)
        f = codecs.open('./data/hotel/' + city + ',' + hotel + ',2014-04-01' + '.html',
                        'w+',
                        'utf8')
        f.write(source_code)
        f.close()
        flag = False
        pass
    pass


def main():
    one_driver_all_hotel()
    #driver = webdriver.Firefox()
    #one_driver_hotel(driver,"北京","北京金鼎弘泰大酒店")
    
    pass


if __name__ == '__main__':
    print "start"
    main()
    print "finished"
    pass