class MultiPlayerSocket {
    constructor(root) {
        this.root = root;
        this.ws = new WebSocket("wss://app6534.acapp.acwing.com.cn/wss/multiplayer/");  //客户端和服务器端建立连接，名称和路由一致
        this.start();
    }
    start() { }

    send_create_player() {
        this.ws.send(JSON.stringify({   //将json转换成字符串
            'message': "created player",
        }));
    }

    receive_create_player() {

    }
}