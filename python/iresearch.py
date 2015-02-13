# -*- coding: utf-8 -*-
__author__ = 'User19'

import urllib2
import random
import json

ajax_header = {}


def get_login_state(strinfo):
    """
    得到json 并解析json
    :return: login-status
    """
    ajax_url_p = r'http://ird.itracker.cn/Ajax/index.ashx?_=1423466207333&info=%s&page=index&m=%s'
    ran_f = '%.16f' % random.random()
    ran = str(ran_f)
    ajax_url = ajax_url_p % (strinfo, ran)
    print ajax_url
    ajax_request = urllib2.Request(ajax_url, headers=ajax_header)
    # http_handler = urllib2.HTTPHandler(debuglevel=1)
    # https_handler = urllib2.HTTPSHandler(debuglevel=1)
    # opener = urllib2.build_opener(http_handler, https_handler)
    # urllib2.install_opener(opener)
    json_content = urllib2.urlopen(ajax_request).read()
    print 'status code : ', urllib2.urlopen(ajax_request).getcode()
    # print json_content
    json_obj = json.loads(json_content)
    login_status = json_obj['LoginStatus'][0]['state']
    print 'login status : '+login_status
    return login_status


index_header = {}


def access_index_page(login_status):
    """
    访问艾瑞主页
    :return:
    """
    index_url_p = r'http://ird.itracker.cn/index.aspx?'
    slid = login_status
    index_url = index_url_p+'SLID='+slid
    print 'index url : ', index_url
    index_request = urllib2.Request(index_url, headers=index_header)
    index_obj = urllib2.urlopen(index_request)
    print 'index status code :', index_obj.getcode()
    index_page = index_obj.read()
    # print index_page

main_header = {'Accept': 'image/jpeg, application/x-ms-application, image/gif, application/xaml+xml, image/pjpeg, application/x-ms-xbap, application/msword, application/vnd.ms-excel, application/vnd.ms-powerpoint, */*','Accept-Language': 'zh-CN','Accept-Encoding': 'gzip, deflate','User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E)','Host': 'iutmain.itracker.cn','Connection': 'Keep-Alive','Cookie': 'thousands.-7715=thousands; _pk_id.2.a543=160de57bd06dddc5.1423465704.6.1423556042.1423546811.; _pk_ses.2.a543=*; ASP.NET_SessionId=gw4gac0qxhjljtaolwd1lbry; iut_lang=cn'}


def process_main_page():
    """
        获取数据
    :return:
    """
    main_url = r'http://iutmain.itracker.cn/Class_DetailCate.aspx?IMI=1&DateType=W&QueryDate=2015-04&doCache=0'
    main_request = urllib2.Request(main_url, headers=main_header)
    main_opener = urllib2.build_opener()
    main_opener.addheaders.append(('Cookie', 'thousands.-7715=thousands; _pk_id.2.a543=160de57bd06dddc5.1423465704.4.1423541676.1423538976.; ASP.NET'))
    main_obj = main_opener.open(main_request)
    print "main page statue code : ", main_obj.getcode()
    main_content = main_obj.read()
    print main_content


def main():
    """
    Main Method
    :return:
    """
    # strinfo = '6ELy68eiudh3y13jUab2I03ptJN8%2BOlN0ZdD%2Bh674qbezAQSZ%2FOYShAt7wVj64FtM5b%2B1hehgMWT21j2BGrmrLcDZXVAtLxvOMsH9608oV135EnqFsKgE7sNHNUm24xstgYG%2FUf7%2Fh695Dyolx2vjabzHTXDjSWooCvb9HxZkYM%3D'
    # login_status = get_login_state(strinfo)
    #
    # access_index_page(login_status)
    process_main_page()
if __name__ == '__main__':
    main()