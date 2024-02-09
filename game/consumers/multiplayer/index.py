# 以下为官网示例：
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):  # 创建连接后触发
        await self.accept()   
        print('accept')

        self.room_name = "room"
        await self.channel_layer.group_add(self.room_name, self.channel_name)  # group即组，可以将许多连接加到一个组里，有群发广播功能

    async def disconnect(self, close_code):   #前端刷新或者关闭后执行，但是不一定靠谱，比如用户断电后就不会向服务器发送任何信息，也就不会执行这个函数
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name)


    async def receive(self, text_data):  #接收前端的请求
        data = json.loads(text_data)
        print(data)