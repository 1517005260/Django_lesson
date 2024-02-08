from django.http import JsonResponse
from urllib.parse import quote
from random import randint
from django.core.cache import cache

def get_state():
    res = ""
    for i in range(8):
        res += str(randint(0,9))
    return res


def apply_code(request):
    state = get_state()
    cache.set(state,True,7200)

    #acapp的api只要返回4个参数
    return JsonResponse({
        'result': "success",
        'appid':"6534",
        'redirect_uri':quote("https://app6534.acapp.acwing.com.cn/settings/acwing/acapp/receive_code/"),
        'scope':"userinfo",
        'state':state
    })