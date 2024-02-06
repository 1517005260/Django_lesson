from django.http import JsonResponse
from django.contrib.auth import authenticate,login

# 防止函数重名，改为sigin
def signin(request):
    data = request.GET #使用GET方法在request请求中获取，data作为字典
    username = data.get('username')
    password = data.get('password')
    user = authenticate(username = username, password = password)
    # 这里判密码相等是用的hash值
    # authenticate函数会接收明文用户名和密码，并依据用户名匹配数据库中的hash后密码
    # 如果匹配成功，返回一个USER对象，包含了USER的信息，如果未成功则返回none
    if not user:
        return JsonResponse({
            'result':"用户名或密码不正确"
        })
    else:
        login(request,user)
        return JsonResponse({
            'result':"success"
        })