deliverance
===========

deliverance a game made by html5,just a small test project for myself

### Server ###
use node.js for windows node-v0.6.18.msi

使用npm安装一些包失败了的看过来（npm国内镜像介绍）
这个也是网上搜的，亲自试过，非常好用！

镜像使用方法（三种办法任意一种都能解决问题，建议使用第三种，将配置写死，下次用的时候配置还在）:

1.通过config命令

npm config set registry http://registry.npmjs.vitecho.com 
npm info underscore （如果上面配置正确这个命令会有字符串response）
2.命令行指定

npm --registry http://registry.npmjs.vitecho.com info underscore 
3.编辑 ~/.npmrc 加入下面内容

registry = http://registry.npmjs.vitecho.com 
搜索镜像: http://search.npmjs.vitecho.com

建立或使用镜像,参考: https://github.com/isaacs/npmjs.org

windows 下安装全局nodejs扩展
npm instal xxx -g
但是要设置下 环境变量 set NODE_PATH=C:\Documents and Settings\DevUser\Application Data\npm\node_modules
才起效

Eclipse v8 调试器 http://chromedevtools.googlecode.com/svn/update/dev/

### Client ###
use Three.js

### How To Build ###



### Contact ###

If you have any question about this project ,contact me flufy(flufy3d@gmail.com)
