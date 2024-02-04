#! /bin/bash

### 本脚本用于将/game/static/js/里的src中的源文件合并到dist中

JS_PATH=/home/acs/django_lesson/game/static/js/
JS_PATH_DIST=/home/acs/django_lesson/game/static/js/dist/
JS_PATH_SRC=/home/acs/django_lesson/game/static/js/src/

find ${JS_PATH_SRC} -type f -name '*.js' | sort | xargs cat > ${JS_PATH_DIST}game.js ##寻找.js文件，-type f指定找的对象是普通文件。并将找到的文件按字典序排序，重定向输出到dist下的game.js
echo yes | python3 manage.py collectstatic 