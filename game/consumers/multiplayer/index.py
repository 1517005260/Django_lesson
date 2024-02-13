from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings  #房间人数上限存在settings.py里
from django.core.cache import cache

from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from match_system.src.match_server.match_service import Match

from game.models.player.player import Player
from channels.db import database_sync_to_async

# 异步--多函数并发  // 如果没有async声明则默认为同步函数
# 本程序的例子：在connect中的self.accept()时：connect函数会被阻塞，直到self.accept()执行完毕。但是，其他函数比如receive还在正常运作
# 如果是同步：那么整个程序都会阻塞在self.accept()这里，不会像异步一样仅connect阻塞

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):  # 创建连接后触发
        await self.accept()   #建立连接

    async def disconnect(self, close_code):   #前端刷新或者关闭后执行，但是不一定靠谱，比如用户断电后就不会向服务器发送任何信息，也就不会执行这个函数
        if self.room_name:  #将玩家从这个房间删除
            await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def create_player(self,data):
        self.room_name = None
        self.uuid = data['uuid']
        # 创建一个socket连接，这里的IP和端口对应匹配服务器的监听地址和端口
        transport = TSocket.TSocket('127.0.0.1', 9090)

        # 对socket进行包装，因为缓冲传输比原始socket快很多，这对性能有重要影响
        transport = TTransport.TBufferedTransport(transport)

        # 传输封装在一个二进制协议中，这是Thrift通信使用的协议
        protocol = TBinaryProtocol.TBinaryProtocol(transport)

        # 创建一个匹配服务的客户端实例，用于发送请求和接收响应
        client = Match.Client(protocol)

        def db_get_player():  #这个是同步函数，需要转换
            return Player.objects.get(user__username=data['username'])
        player = await database_sync_to_async(db_get_player)()

        # Connect!
        transport.open()

        ##接下来写你的代码：

        client.add_player(player.score, data['uuid'], data['username'], data['photo'], self.channel_name)  #发起匹配请求

        # 关闭Thrift连接，以释放资源
        transport.close()


    async def move_to(self,data):
        await self.channel_layer.group_send(self.room_name,{
            'type':"group_send_event",
            'event':"move_to",
            'uuid':data['uuid'],
            'tx':data['tx'],
            'ty':data['ty'],
        })
    
    async def shoot_fireball(self,data):
        await self.channel_layer.group_send(self.room_name,{
            'type':"group_send_event",
            'event':"shoot_fireball",
            'uuid':data['uuid'],
            'tx':data['tx'],
            'ty':data['ty'],
            'ball_uuid':data['ball_uuid']
        })

    async def attack(self,data):
        await self.channel_layer.group_send(self.room_name,{
            'type':"group_send_event",
            'event':"attack",
            'uuid':data['uuid'],
            'attackee_uuid':data['attackee_uuid'],
            'x':data['x'],
            'y':data['y'],
            'sita':data['sita'],
            'damage':data['damage'],
            'ball_uuid':data['ball_uuid']
        })

    async def blink(self,data):
        await self.channel_layer.group_send(self.room_name,{
            'type': "group_send_event",
            'event': "blink",
            'uuid': data['uuid'],
            'tx': data['tx'],
            'ty': data['ty'],
            })

    async def message(self, data):
        await self.channel_layer.group_send(self.room_name,{
            'type': "group_send_event",
            'event': "message",
            'uuid': data['uuid'],
            'username': data['username'],
            'text': data['text'],
            })

    async def receive(self, text_data):  #接收前端的请求
        data = json.loads(text_data)
        event = data['event']
        if event == "create_player":
            await self.create_player(data)
        elif event == "move_to":
            await self.move_to(data)
        elif event == "shoot_fireball":
            await self.shoot_fireball(data)
        elif event == "attack":
            await self.attack(data)
        elif event == "blink":
            await self.blink(data)
        elif event == "message":
            await self.message(data)
    
    async def group_send_event(self,data): #与type一致
        #新增：在首次触发群发函数（即创建玩家时）分配房间
        if not self.room_name:
            keys = cache.keys('*%s*' % (self.uuid))
            if keys:
                self.room_name = keys[0]
        await self.send(text_data=json.dumps(data))
