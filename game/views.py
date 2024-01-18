### view 即前端页面函数代码，传入request返回字符串

from django.http import HttpResponse

def index(request):
    line1 = '<h1 style="text-align:center">术士之战</h1>'
    line2 = '<img src="https://img0.baidu.com/it/u=2857096089,2095994689&fm=253&fmt=auto&app=138&f=JPEG?w=1070&h=500" width=500>'
    line3 = '<hr>'
    line4 = '<a href = "/play/">进入游戏界面</a>'
    return HttpResponse(line1 + line4 +line3 + line2)

def play(request):
    line1 = '<h1 style="text-align:center">游戏界面</h1>'
    line2 = '<img src="https://img1.baidu.com/it/u=2683701891,1943960238&fm=253&fmt=auto&app=138&f=PNG?w=500&h=280" width=500>'
    line3 = '<a href = "/">返回主页面</a>'
    line4 = '<hr>'
    return HttpResponse(line1 + line3 + line4 + line2)
