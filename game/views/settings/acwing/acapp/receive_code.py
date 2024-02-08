from django.http import JsonResponse
from django.core.cache import cache
import requests
from django.contrib.auth.models import User
from game.models.player.player import Player
from random import randint

#acapp不需要重定向到index，只要返回json信息即可，也不用login

def receive_code(request):
    #e
    data = request.GET

    #acapp多了errorcode
    if "errorcode" in data:
        return JsonResponse({
            'result':"apply failed",
            'errcode':data['errcode'],
            'errmsg':data['errmsg'],
        })

    code = data.get('code')
    state = data.get('state')

    if not cache.has_key(state):
        return JsonResponse({
            'result':"state not exist",
        })
    cache.delete(state)

    #f
    access_token_url = "https://www.acwing.com/third_party/api/oauth2/access_token/"
    params ={
        'appid':"6534",
        'secret':"8fa7725f131f498fa12adeedb506c619",
        'code':code
    }

    #g
    access_token_res = requests.get(access_token_url,params=params).json()
    access_token = access_token_res['access_token']
    openid = access_token_res['openid']

    #判断用户是否验证过，如果是，则直接获取用户名和头像
    players = Player.objects.filter(openid=openid)
    if players.exists():
        player = players[0]
        return JsonResponse({
            'result':"success",
            'username':player.user.username,
            'photo':player.photo,
        })
    
    #h,i
    get_userinfo_url = "https://www.acwing.com/third_party/api/meta/identity/getinfo/"
    params ={
        'access_token':access_token,
        'openid':openid
    }
    userinfo_res = requests.get(get_userinfo_url,params=params).json()
    username = userinfo_res['username']
    photo = userinfo_res['photo']

    #给新的用户注册并登录
    while User.objects.filter(username = username).exists():
        username += str(randint(0,9))
    
    user = User.objects.create(username=username)
    player = Player.objects.create(user = user ,photo = photo,openid = openid)
    
    return JsonResponse({
       'result':"success",
        'username':player.user.username,
        'photo':player.photo,
   })