let Game_Objects = [];   //全局数组存储所有的游戏对象

class GameObject {
    constructor() {
        Game_Objects.push(this);

        this.has_called_start = false;
        this.timedelta = 0;  //这一帧距离上一帧的时间
    }

    start() { }

    update() { }

    on_destroy() { }  //在这个对象被销毁前执行一次

    destroy() {
        this.on_destroy();

        for (let i = 0; i < Game_Objects.length; i++) {
            if (Game_Objects[i] === this) {
                Game_Objects.splice(i, 1);
                break;
            }
        }
    }
}

let last_timestamp = 0;
let Game_Animation = function (now_timestamp) {
    for (let i = 0; i < Game_Objects.length; i++) {
        let obj = Game_Objects[i];
        if (!obj.has_called_start) {
            obj.has_called_start = true;
            obj.start();
        } else {
            obj.timedelta = now_timestamp - last_timestamp;
            obj.update();
        }
    }
    last_timestamp = now_timestamp;

    requestAnimationFrame(Game_Animation);
}

requestAnimationFrame(Game_Animation);