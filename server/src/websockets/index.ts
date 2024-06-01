import WebSocket from 'ws';
import url from 'url';
import { v4 as uuidv4 } from 'uuid';

export default async (expressServer) => {
  const websocketServer = new WebSocket.Server({
    noServer: true,
    path: '/websockets',
  });

  const connections: Record<string, WebSocket> = {};
  const rooms: Record<string, string[]> = {};
  const users = {};

  const broadcastUsersState = (socket, roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].forEach((userUuid) => {
        const client = connections[userUuid];
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          const usersInRoom = Object.keys(users).reduce((acc, key) => {
            if (rooms[roomId].includes(key)) {
              acc[key] = users[key];
            }
            return acc;
          }, {});

          const message = JSON.stringify(usersInRoom);
          client.send(message);
        }
      });
    }
  }

  const broadcastUserMessage = (chatMessage, socket, roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].forEach((userUuid) => {
        const client = connections[userUuid];
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          const username = users[userUuid].username;

          const messageResponse = JSON.stringify({
            action: 'chat_message',
            payload: {
              message: chatMessage,
              user_id: userUuid,
              username,
            }
          });

          client.send(messageResponse);
        }
      });
    }
  }

  const handleUpdateCursor = ({ payload, userUuid, roomId, websocketConnection }) => {
    const { x, y } = payload;

    users[userUuid].state = { x, y };

    broadcastUsersState(websocketConnection, roomId);
  }

  const handleChatMessage = ({ payload, userUuid, roomId, websocketConnection }) => {
    const { message } = payload;

    // Save chat message to history

    broadcastUserMessage(message, websocketConnection, roomId);
  }

  const handleMessages = ({ message, userUuid, roomId, websocketConnection }) => {
    const { action, payload } = JSON.parse(message);

    switch (action) {
      case 'update_cursor':
        return handleUpdateCursor({ payload, userUuid, websocketConnection, roomId });
      case 'chat_message':
        return handleChatMessage({ payload, userUuid, websocketConnection, roomId });
      default:
        console.warn('Unknown action:', action);
        break;
    }
  };

  const handleClose = ({ userUuid, websocketConnection, roomId }) => {
    delete connections[userUuid];
    delete users[userUuid];

    rooms[roomId].splice(rooms[roomId].indexOf(userUuid), 1);

    if(rooms[roomId].length === 0) {
      delete rooms[roomId];
    }

    broadcastUsersState(websocketConnection, roomId);
  }

  expressServer.on('upgrade', (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit('connection', websocket, request);
    });
  });

  websocketServer.on('connection', function connection(websocketConnection, connectionRequest) {
    const { username, room_id } = url.parse(connectionRequest.url, true).query;

    const roomId = room_id as string;

    if (!username || !roomId) {
      websocketConnection.send(JSON.stringify({ message: 'You must provide username and room_id.' }));
      websocketConnection.close();
      return;
    }

    const userUuid = uuidv4();
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(userUuid);

    console.log(`User ${username} connected with UUID ${userUuid}, joining room ${roomId}.`);

    // Add the new client to the set of clients
    connections[userUuid] = websocketConnection;
    users[userUuid] = {
      username,
      roomId,
      state: {
        x: 0,
        y: 0,
      }
    };

    websocketConnection.on('message', message => handleMessages({ message, userUuid, websocketConnection, roomId }));

    websocketConnection.on('close', () => handleClose({ userUuid, websocketConnection, roomId }));
  });

  console.log('Websockets server created.');

  return {
    websocketServer,
  };
};

