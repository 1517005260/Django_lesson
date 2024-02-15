from rest_framework.views import APIView  #视图类的基类
from rest_framework.response import Response  #HTTP响应
from rest_framework.permissions import IsAuthenticated
from game.models.player.player import Player

class InfoView(APIView):  #继承自APIView
    permission_classes = ([IsAuthenticated])
    #设置了这个视图的权限类，只有已认证的用户（即已经登录的用户）才能访问这个视图

    def get(self, request):
        user = request.user
        player = Player.objects.get(user=user)
        return Response({
            'result': "success",
            'username': user.username,
            'photo': player.photo
        })