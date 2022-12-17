import { IncomingMessage } from 'http';
import url from 'url';
import { WebSocketServer } from 'ws';
import type { Logger, Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import vite from 'vite';
import path from 'path';
import { yellow } from 'kolorist';

interface Options {
    /**
     * websocket请求前缀, 监听所有upgrade(ws)协议请求, 处理websocketRequestPrefix开头的websocket请求
     * ws://127.0.0.1:3699/wstest
     * @type string
     * @default 'wstest'
     */
    websocketRequestPrefix?: string;

    /**
     * websocket服务实例定义文件(相对于config.root)
     * @type string
     * @default './server/ws/ws.test.ts'
     */
    websocketRootFile?: string;
}

let defaultOption: Options = { websocketRequestPrefix: '/wstest', websocketRootFile: './server/ws/ws.test.ts' };

let viteDevServerInstance: vite.ViteDevServer; // 开发服务器对象
let logger: Logger; // 开发服务器日志对象

/**
 * 用于支持本地客户端的websocket开发, 大致工作流如下
 * 1. 在vite启动时创建一个新的server实例;
 * 2. 实例监听所有upgrade(ws)协议请求, 处理websocketRequestPrefix开头的websocket请求
 * 3. 重新建立连接请求 => 请求被自己创建的server拦截 => 动态编译websocketRootFile中的ts文件
 * 该插件在更新websocket代码后必须重新建立连接才能编译新代码, 属于懒更新
 * @returns Plugin
 */
export default function ViteWsPlugin(option: Options = {}): Plugin {

    return {

        name: 'vite-plugin-ws',

        configResolved(config: ResolvedConfig) { // 合并, 解析配置文件
            defaultOption.websocketRootFile = path.resolve(config.root, './', defaultOption.websocketRootFile); // 更新文件路径
            defaultOption = Object.assign(defaultOption, option);
        },

        configureServer(viteDevServer: ViteDevServer) { // 是用于配置开发服务器的钩子 最常见的用例是在内部 connect 应用程序中添加自定义中间件
            viteDevServerInstance = viteDevServer;
            logger = viteDevServer.config.logger;
            try {
                viteDevServerInstance.httpServer.on('upgrade', async function upgrade(request: IncomingMessage, socket: any, head: any) { // 当收到 websocket 建立连接的请求时
                    const { pathname } = url.parse(request.url); // 获取请求的路径
                    if (pathname === defaultOption.websocketRequestPrefix) { // 拦截
                        let { wss } = await viteDevServerInstance.ssrLoadModule(defaultOption.websocketRootFile); // 通过ssrLoadModule(API)编译ESModule
                        <WebSocketServer>wss.handleUpgrade(request, socket, head, async function done(ws: WebSocket) { wss.emit('connection', ws, request); });
                    }
                });
                viteDevServerInstance.httpServer?.once("listening", () => {
                    // > Websocket Listening: ws://localhost:3000/wstest \n
                    setTimeout(() => { console.log(`  > Websocket Listening: ${yellow(`ws://localhost:${viteDevServerInstance.config.server.port}${defaultOption.websocketRequestPrefix}`)} \n`); }, 0);
                });
            } catch (e) {
                viteDevServerInstance.ssrFixStacktrace(e); // 修复堆栈来跟踪问题
                console.log(e);
            }
        }

    }

}