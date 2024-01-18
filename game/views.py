### view 即前端页面函数代码，传入request返回字符串

from django.http import HttpResponse

def index(request):
    line1 = '<h1 style="text-align:center">术士之战</h1>'
    line2 = '<img src="https://img0.baidu.com/it/u=2857096089,2095994689&fm=253&fmt=auto&app=138&f=JPEG?w=1070&h=500" width=500>'
    return HttpResponse(line1 + line2)
