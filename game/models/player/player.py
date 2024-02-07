# 存储player数据表的信息
# 建立新类继承自django自带类,并加点扩充

from django.db import models
from django.contrib.auth.models import User

class Player(models.Model):  
    #()类似extends,python还支持多重继承，括号里可以写多个父类
    user = models.OneToOneField(User,on_delete = models.CASCADE)  
    # 指定user对象和player对象的一对一关系，当user被删除时，player也会被删除
    photo = models.URLField(max_length=256,blank=True) 
    #增加的用户的头像，指定了最大长度并允许用户不上传头像
    openid = models.CharField(default="",max_length=50,blank=True,null=True)
    # openid 是一个32位的字符串，为了保险可以多开几位。默认为空且可以为空

    def __str__(self):  
        #在管理系统中显示用户的用户名
        return str(self.user)