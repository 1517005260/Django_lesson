#仅用于web端渲染html的总文件

from django.shortcuts import render  ##渲染函数

def index(request):  ##传入一个request请求
    return render(request,"multi-ends/web.html")  ##django默认从templates目录下开始写路径
