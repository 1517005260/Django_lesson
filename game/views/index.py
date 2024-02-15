#仅用于web端渲染html的总文件

from django.shortcuts import render  ##渲染函数

def index(request):  ##传入一个request请求
    data = request.GET
    context = {
        'access': data.get('access',""),  #有就填access，没有就空
        'refresh': data.get('refresh',"")
    }
    return render(request, "multi-ends/web.html", context)