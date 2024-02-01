#引入menu,playground,settings的index.py

from django.urls import path,include  ##这是django的包
from game.views.index import index    ##从路径中（注意没有.py）引入index函数

##path:一一映射的函数，将url地址映射到我们写的文件
##注意一定要索引到index文件，否则会报错

urlpatterns=[
    path("",index,name="index"),  ##主页面，不需要加另外的path
    path("menu/",include("game.urls.menu.index")),
    path("playground/",include("game.urls.playground.index")),
    path("settings/",include("game.urls.settings.index")),
]
