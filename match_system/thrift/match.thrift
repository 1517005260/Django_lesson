namespace py match_service  # 指定了python语言的命名空间，这就是生成thrift项目后的一个包的名字

# 函数集成处
service Match{
    i32 add_player(1: i32 score, 2: string uuid, 3: string username, 4:string photo, 5:string channel_name),
    # 返回一个32位整数（int），参数5是django_channel的api参数，提供匹配系统->server（正在运行daphne的）的有向边通信
}