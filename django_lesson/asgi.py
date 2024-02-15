"""
ASGI config for django_lesson project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

#Asynchronous Server Gateway Interface，即如何处理异步Web请求的配置文件

import os
import django

# 在调用下面那些包之前一定要先配好环境变量，否则会报错
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_lesson.settings')   #设置的文件地址作为环境变量
django.setup()   #加载Django项目的设置

from game.channelsmiddleware import JwtAuthMiddlewareStack   #导入jwt配置的中间件
from channels.routing import ProtocolTypeRouter, URLRouter   #导入路由的相关模块，用于定义不同协议（如HTTP和WebSocket）的路由行为
from django.core.asgi import get_asgi_application
from game.routing import websocket_urlpatterns

from channels.layers import get_channel_layer
channel_layer = get_channel_layer()   #获取Channel层实例，用于在不同的Consumer间通信
 
application = ProtocolTypeRouter({   #定义ASGI应用
    "http": get_asgi_application(),   #对于HTTP协议的请求，使用Django的ASGI应用来处理
    "websocket": JwtAuthMiddlewareStack(URLRouter(websocket_urlpatterns))   #对于WebSocket协议的请求，首先通过AuthMiddlewareStack进行用户认证，然后根据websocket_urlpatterns中定义的URL模式进行路由分发
})
