#这里receive后重定向
#这个视图函数就是 apply_code.py 中的 redirect_uri
#这里也是code的接收处

from django.shortcuts import redirect
from django.core.cache import cache  #redis存储state
import requests  #函数功能：向一个网站传参+请求，返回字典
from django.contrib.auth.models import User
from game.models.player.player import Player
from django.contrib.auth import login
from random import randint


def receive_code(request):
    #e
    data = request.GET
    code = data.get('code')  #接收网站给的code
    state = data.get('state')

    if not cache.has_key(state):
        #内存中没有state，暗号没对上，可能是其他网站的攻击，遂pass
        return redirect("index")
        #重定向到name = "index" 的页面，即/game/urls/index.py中的index
    cache.delete(state)  #对上暗号了，暗号可以扔了

    #f
    access_token_url = "https://www.acwing.com/third_party/api/oauth2/access_token/"
    params ={
        'appid':"6534",
        'secret':"986af46a00124e6d94b1c2f1dfa2b79d",
        'code':code
    }

    #g
    access_token_res = requests.get(access_token_url,params=params).json()
    access_token = access_token_res['access_token']
    openid = access_token_res['openid']

    #判断用户30天内是否验证过
    players = Player.objects.filter(openid=openid)
    if players.exists():
        login(request,players[0].user)
        return redirect("index")
    
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
        #此时，第三方平台的用户名和数据库里已有的用户名重复了，需要重新起名字
        #方法：在原名字后加随机位的数字
        #机制：每位均随机，如果一共k位数字，那么重名概率就是1/10^k,基本不可能
        #而如果我们采用每多一个重名的就让数字++，那么效率太低了
        #如果有100个重名的（ex.glk glk1 glk2 ... glk99）那么起名glk100要慢慢检索100个人
        #而我们的方法只要三次循环即可
        username += str(randint(0,9))
    
    user = User.objects.create(username=username)
    player = Player.objects.create(user = user ,photo = photo,openid = openid)

    login(request,user)
    return redirect("index")