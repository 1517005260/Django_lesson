from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings  #房间人数上限存在settings.py里
from django.core.cache import cache

# 异步--多函数并发  // 如果没有async声明则默认为同步函数
# 本程序的例子：在connect中的self.accept()时：connect函数会被阻塞，直到self.accept()执行完毕。但是，其他函数比如receive还在正常运作
# 如果是同步：那么整个程序都会阻塞在self.accept()这里，不会像异步一样仅connect阻塞

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):  # 创建连接后触发
        await self.accept()   #建立连接

    async def disconnect(self, close_code):   #前端刷新或者关闭后执行，但是不一定靠谱，比如用户断电后就不会向服务器发送任何信息，也就不会执行这个函数
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def create_player(self,data):
        self.room_name = None #一开始没有进入房间

        for i in range(1000):
            #上限1000个房间
            name = "room-%d" % (i)
            if not cache.has_key(name) or len(cache.get(name))<settings.ROOM_CAPACITY:
                self.room_name = name #如果房间未被创建或者房间人数不满，就把当前实例放到room_name房间里
                break

        if not self.room_name:  #房间全满，所以未进入房间
            return
        
        if not cache.has_key(self.room_name):
            cache.set(self.room_name,[],3600) #建立空房间，有效期1h
        
        for player in cache.get(self.room_name): #向建立连接的web端发送房间内其他玩家信息
            await self.send(text_data=json.dumps({  #给自己发
                'event':"create_player",
                'uuid':player['uuid'],
                'username':player['username'],
                'photo':player['photo']
            }))
        await self.channel_layer.group_add(self.room_name, self.channel_name)  # group即组，可以将许多连接加到一个组里，有群发广播功能

        players = cache.get(self.room_name)  #现在房间里有的玩家
        players.append({
            'uuid':data['uuid'],
            'username':data['username'],
            'photo':data['photo']
        })
        cache.set(self.room_name,players,3600)  #重置房间内的玩家信息
        #广播
        await self.channel_layer.group_send(self.room_name,{  #群发给别人
            'type':"group_send_event",  #群发接收的函数
            'event':"create_player",
            'uuid':data['uuid'],
            'username':data['username'],
            'photo':data['photo'],
        })

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
    
    async def group_send_event(self,data): #与type一致
        await self.send(text_data=json.dumps(data))
