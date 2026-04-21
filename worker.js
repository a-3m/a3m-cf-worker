/* file: worker.js */
/*
# vim: set ts=4 sw=4 sts=4 noet :
*/

import { DurableObject } from 'cloudflare:workers';

export class Room extends DurableObject {
	constructor(ctx, env){
		super(ctx, env);
		this.ctx = ctx;
	}

	async fetch(req){
		if (req.headers.get('Upgrade') !== 'websocket')
			return new Response('websocket required', { status: 426 });

		var pair = new WebSocketPair();
		var client = pair[0];
		var server = pair[1];

		this.ctx.acceptWebSocket(server);

		return new Response(null, {
			status: 101,
			webSocket: client
		});
	}

	webSocketMessage(ws, msg){
		var list = this.ctx.getWebSockets();
		var i = 0;

		for (i = 0; i < list.length; i++){
			if (list[i] !== ws){
				try { list[i].send(msg); } catch (e) {}
			}
		}
	}

	webSocketClose(ws){
		try { ws.close(); } catch (e) {}
	}
}

export default {
	async fetch(req, env){
		var url = new URL(req.url);

		if (url.pathname.slice(0, 4) !== '/ws/')
			return new Response('ok');

		var room = decodeURIComponent(url.pathname.slice(4) || 'demo');
		var id = env.ROOM.idFromName(room);
		var stub = env.ROOM.get(id);

		return stub.fetch(req);
	}
};