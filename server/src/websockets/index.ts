import WebSocket from 'ws';
import url from 'url';
import { v4 as uuidv4 } from 'uuid';

export default async (expressServer) => {
  const websocketServer = new WebSocket.Server({
    noServer: true,
    path: '/websockets',
  });

  const connections: Record<string, WebSocket> = {};
  const users = {};

  const broadcastUsersState = (socket) => {
    websocketServer.clients.forEach(function each(client) {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        const message = JSON.stringify(users);

        client.send(message);
      }
    });
  }

  const handleUpdateCursor = (payload, userUuid, socket) => {
    const { x, y } = payload;

    users[userUuid].state = { x, y };

    broadcastUsersState(socket);
  }

  const handleMessages = (message, userUuid, websocketConnection) => {
    const { action, payload } = JSON.parse(message);

    switch (action) {
      case 'update_cursor':
        return handleUpdateCursor(payload, userUuid, websocketConnection);
      default:
        console.warn('Unknown action:', action);
        break;
    }
  };

  const handleClose = (userUuid, websocketConnection) => {
    delete connections[userUuid];
    delete users[userUuid];

    broadcastUsersState(websocketConnection);
  }

  expressServer.on('upgrade', (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit('connection', websocket, request);
    });
  });

  websocketServer.on('connection', function connection(websocketConnection, connectionRequest) {
    const { username } = url.parse(connectionRequest.url, true).query;

    if (!username) {
      websocketConnection.send(JSON.stringify({ message: 'You must provide a username.' }));
      websocketConnection.close();
      return;
    }

    const userUuid = uuidv4();
    console.log(`User ${username} connected with UUID ${userUuid}`);

    // Add the new client to the set of clients
    connections[userUuid] = websocketConnection;
    users[userUuid] = {
      username,
      state: {
        x: 0,
        y: 0,
      }
    };

    websocketConnection.on('message', message => handleMessages(message, userUuid, websocketConnection));

    websocketConnection.on('close', () => handleClose(userUuid, websocketConnection));
  });

  console.log('Websockets server created.');

  return {
    websocketServer,
  };
};

