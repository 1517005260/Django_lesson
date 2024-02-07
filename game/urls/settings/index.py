from django.urls import path,include
from game.views.settings.getinfo import getinfo
from game.views.settings.login import signin
from game.views.settings.logout import signout
from game.views.settings.register import register

urlpatterns = [  
    #url地址，view函数，名称(习惯为路径名)
    path("getinfo/",getinfo,name="settings_getinfo"),
    path("login/",signin,name="settings_login"),
    path("logout/",signout,name="settings_logout"),
    path("register/",register,name="settings_register"),
    path("acwing/",include("game.urls.settings.acwing.index")),
]
