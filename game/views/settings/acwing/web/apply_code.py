# 用于实现步骤b、e,即网站向acwing发送appid，acwing返回code
# 给前端返回链接：
# https://www.acwing.com/third_party/api/oauth2/web/authorize/?appid=APPID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
# 前端再重定向到acwing

from django.http import JsonResponse
from urllib.parse import quote  #quote用于url里的'='等特殊字符转换成普通字符，防止bug
from random import randint
from django.core.cache import cache

def get_state():
    # 用于给state一个随机值，这个随机值在整个流程中固定，且每个流程结束后就被删除
    #用于和第三方网站对暗号防止其他人攻击
    #返回随机8位数
    res = ""
    for i in range(8):
        res += str(randint(0,9))
    return res


def apply_code(request):
    appid = "6534"
    redirect_uri = quote("https://app6534.acapp.acwing.com.cn/settings/acwing/web/receive_code/")
    scope = "userinfo"   #申请授权的范围
    state = get_state()

    cache.set(state,True,7200)  #将state存下来，有效期2h（和access_token一致）

    apply_code_url = "https://www.acwing.com/third_party/api/oauth2/web/authorize/"

    return JsonResponse({
        'result': "success",
        'apply_code_url': apply_code_url + "?appid=%s&redirect_uri=%s&scope=%s&state=%s" % (appid, redirect_uri, scope, state),
    })