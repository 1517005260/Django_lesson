from django.contrib import admin
from game.models.player.player import Player  #引入新写的数据库（类）

# Register your models here.
admin.site.register(Player)