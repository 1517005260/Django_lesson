from django.urls import path
from game.consumers.multiplayer.index import MultiPlayer

#格式和url完全一致，只是中间的多了.as_asgi()用于于处理异步请求，将类变成函数
websocket_urlpatterns = [
    path("wss/multiplayer/",MultiPlayer.as_asgi(),name="wss_multiplayer"),
]