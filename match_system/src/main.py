#! /usr/bin/env python3

# 实现python-match-server

import glob
import sys
sys.path.insert(0, glob.glob('../../')[0])  #django的家目录地址，只有这样我们才能import django原项目里的包

from match_server.match_service import Match
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer

from queue import Queue   #消息队列的包【线程安全的队列，不会出现读写冲突（保证了数据一致、完整）】
from time import sleep
from threading import Thread  #开线程

from django_lesson.asgi import channel_layer
from asgiref.sync import async_to_sync  #异步->同步转换
from django.core.cache import cache

queue = Queue()   #全局消息队列

class Player:
    #相当于linux基础课里thrift配置中的user类
    def __init__(self,score, uuid, username, photo, channel_name):  #初始化
        self.score = score
        self.uuid = uuid
        self.username = username
        self.photo = photo
        self.channel_name = channel_name
        self.waiting_time = 0   #等待时间，玩家的等待时间越长匹配条件越低

class Pool:
    #匹配池
    def __init__(self):
        self.players = []   #在匹配池里的玩家
    
    def add_player(self,player):
        self.players.append(player)
        print("hello player:%s %s" % (player.username , player.score))

    def check_match(self,a,b):
        # if a.username == b.username:     #同一个玩家不能匹配到一起
        #     return False
        dt = abs(a.score - b.score)
        a_max_dif = a.waiting_time * 50  #匹配阈值
        b_max_dif = b.waiting_time * 50
        return a_max_dif >= dt and b_max_dif >= dt
    
    def match_success(self,ps):  #3名玩家匹配成功  ps=players[]
        print("Match Success: %s %s %s" % (ps[0].username, ps[1].username, ps[2].username))
        room_name = "room-%s-%s-%s" % (ps[0].uuid, ps[1].uuid, ps[2].uuid)
        players = []  #在这个房间里的玩家
        for p in ps:
            async_to_sync(channel_layer.group_add)(room_name, p.channel_name)  #【关键】加入群组
            players.append({
                'uuid':p.uuid,
                'username':p.username,
                'photo':p.photo,
                'hp':100,   #用于后续判定胜负，由于被击中4次会死，所以可以设置一次hp-25
            })
        cache.set(room_name,players,3600)
        #记得要把全部的人拉近群组后再群发
        for p in ps:
            async_to_sync(channel_layer.group_send)(room_name,{
                'type':"group_send_event",   # 进程间通信，调用了index.py
                'event':"create_player",
                'uuid': p.uuid,
                'username': p.username,
                'photo': p.photo,
            })

    
    def increase_waiting_time(self):
        for player in self.players:
            player.waiting_time +=1

    def match(self):   #为了避免多重循环，我们采用贪心（原则：匹配分数相近的玩家）
        while len(self.players) >=3:
            self.players = sorted(self.players,key=lambda player:player.score)  #将玩家列表按照分数进行排序,让分数相近的玩家在列表中的位置更接近
            flag = False
            for i in range(len(self.players)-2):   #分三段，枚举每段起点即可
                a,b,c,=self.players[i],self.players[i+1],self.players[i+2]
                if self.check_match(a,b) and self.check_match(a,c) and self.check_match(b,c):
                    flag = True
                    self.match_success([a,b,c])
                    self.players = self.players[:i] + self.players[i+3:]     # 将这3名玩家移出匹配队列
                    break
            if not flag:
                break

        self.increase_waiting_time()

class MatchHandler:
    #我们只要实现add_player即可，需要用到消息队列缓存
    def add_player(self, score, uuid, username, photo, channel_name):
        player = Player(score, uuid, username, photo, channel_name)
        queue.put(player)   #直接将新玩家放进消费队列
        return 0    # !!! 一定要有返回0，否则会报错

def get_player_form_queue():    #get即从队列中pop元素
    try:
        return queue.get_nowait()   #_nowait（不阻塞）下，如果get空会报异常
    except:
        return None

def worker():
    #这是个死循环线程，不断吸收消息队列信息，然后扔给匹配池
    #【消费者】从队列中取出一个玩家时，这个动作可以视为一个“消费”的动作，因为它处理了之前放入队列的匹配任务
    pool = Pool()
    while True:  #逻辑：每1s，通过死循环将消息队列里的所有元素无阻塞地取出，然后匹配，匹配时新的玩家将会堆积到消息队列里
        player = get_player_form_queue()
        if player:
            pool.add_player(player)
        else:
            pool.match()    
            #每次匹配休息1s，否则cpu会被占满
            sleep(1)


if __name__ == '__main__':    #如果不作为包导入进其他程序   程序的入口
    handler = MatchHandler()   #处理器实例，实现服务定义文件中指定的接口方法，这里仅有add_player
    processor = Match.Processor(handler)  #创建的处理器与自动生成的Processor类绑定,processor负责解析请求和调用相应的处理器方法
    transport = TSocket.TServerSocket(host='127.0.0.1', port=9090)  #客户端需要连接到这个地址和端口来发送请求
    tfactory = TTransport.TBufferedTransportFactory()  #建了一个传输工厂，用于创建缓冲传输实例。缓冲传输可以提高通信效率。
    pfactory = TBinaryProtocol.TBinaryProtocolFactory()  #创建了一个协议工厂，用于创建二进制协议实例。二进制协议是Thrift支持的一种高效的通信协议。

    #server = TServer.TSimpleServer(processor, transport, tfactory, pfactory)  单线程server
    # 这两种server处理方式也可选，当simpleserver的请求超过每秒几十次/几百次时：
    server = TServer.TThreadedServer(
        processor, transport, tfactory, pfactory)        #这个server是每来一个请求就多开一个线程（并行度、效率最高，但是费资源）
    # server = TServer.TThreadPoolServer(
    #     processor, transport, tfactory, pfactory)      #这个server是预开n个线程，然后开始处理，如果并发量超过n个线程，则阻塞（上个sever的限制版）

    Thread(target=worker,daemon=True).start()     #daemon=false则 ./main.py后<ctrl>+c能杀死main.py但是杀不死worker，需要再次<ctrl>+c
    #启动了一个后台线程，这个线程负责不断地从消息队列中取出玩家并尝试进行匹配

    print('Starting the server...')
    server.serve()  #开始监听配置的地址和端口，处理接收到的请求
    print('done.')