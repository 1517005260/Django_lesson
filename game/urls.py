### urls 定义输入的url和视图（view）的关联
### 此处是game的url，我们还要写入总项目的url
from django.urls import path
from game.views import index

urlpatterns = [
        path("",index,name="index"),  ##path是解析url的过程。""不解析。index看view的。
]
