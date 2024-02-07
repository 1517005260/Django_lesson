## 前端请求，后端返回用户名和头像，并根据平台不同作不同处理

from django.http import JsonResponse
from game.models.player.player import Player

def getinfo_acapp(request):
    player = Player.objects.all()[0]  #Player.objects.all()是一个数组，表示Player数据表中的所有元素
    #这里为了方便调试，先给所有登录的玩家默认返回第0名玩家的信息
    return JsonResponse({
        'result':"success",
        'username':player.user.username, #类似js中的this.root.info
        'photo':player.photo,
    })

def getinfo_web(request):
    user = request.user  # django中的request.user.is_authenticated是一个属性，用于判断用户是否认证（登录）
    if not user.is_authenticated:
        return JsonResponse({
            'result':"未登录"
        })
    else :
        player = Player.objects.get(user=user) #查找当前登录的用户
        return JsonResponse({
            'result':"success",
            'username':player.user.username,
            'photo':player.photo,
        })


def getinfo(request):  #处理请求的主函数
    platform = request.GET.get('platform')
    if platform == "ACAPP":
        return getinfo_acapp(request)
    elif platform == "WEB":
        #这里注意在js的settings里定义了WEB参数才不会运行报错
        return getinfo_web(request)