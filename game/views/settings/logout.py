from django.http import JsonResponse
from django.contrib.auth import logout

def signout(request):
    user = request.user  #与请求关联的用户
    if not user.is_authenticated:
        return JsonResponse({
            'result':"success",
        }) #成功未认证，即登出
        
    logout(request)  #清除用户的登录信息
    return JsonResponse({
        'result':"success",
    }) #之前没有退出，现在调用函数退出，最后结果也是成功