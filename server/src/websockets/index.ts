import WebSocket, { RawData } from 'ws';
import url from 'url';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessagePayload, UpdateCursorPayload, WebSocketActions, WebSocketMessage } from './interfaces';

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

          const message = JSON.stringify({
            action: WebSocketActions.UPDATE_CURSOR,
            payload: usersInRoom,
          });
          client.send(message);
        }
      });
    }
  }

  const broadcastUserMessage = (chatMessage, senderUuid, socket, roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].forEach((userUuid) => {
        const client = connections[userUuid];
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          const { username } = users[senderUuid];;

          const messageResponse = JSON.stringify({
            action: WebSocketActions.CHAT_MESSAGE,
            payload: {
              message: chatMessage,
              user_id: senderUuid,
              username,
            }
          });

          client.send(messageResponse);
        }
      });
    }
  }

  const handleUpdateCursor = ({ payload, userUuid, roomId, websocketConnection }: { payload: UpdateCursorPayload, userUuid: string, roomId: string, websocketConnection: WebSocket }) => {
    const { x, y } = payload;

    users[userUuid].state = { x, y };

    broadcastUsersState(websocketConnection, roomId);
  }

  const handleChatMessage = ({ payload, userUuid, roomId, websocketConnection }: { payload: ChatMessagePayload, userUuid: string, roomId: string, websocketConnection: WebSocket }) => {
    const { message } = payload;

    // Save chat message to history

    broadcastUserMessage(message, userUuid, websocketConnection, roomId);
  }

  const handleMessages = ({ message, userUuid, roomId, websocketConnection }: { message: RawData, userUuid: string, roomId: string, websocketConnection: WebSocket }) => {
    const { action, payload } = JSON.parse(message.toString()) as WebSocketMessage;

    switch (action) {
      case WebSocketActions.UPDATE_CURSOR:
        return handleUpdateCursor({ payload, userUuid, websocketConnection, roomId });
      case WebSocketActions.CHAT_MESSAGE:
        return handleChatMessage({ payload, userUuid, websocketConnection, roomId });
      default:
        console.warn('Unknown action:', action);
        break;
    }
  };

  const handleClose = ({ userUuid, websocketConnection, roomId }) => {
    console.log(`User ${users[userUuid].username} disconnected with UUID ${userUuid}.`);

    delete connections[userUuid];
    delete users[userUuid];

    rooms[roomId].splice(rooms[roomId].indexOf(userUuid), 1);

    if (rooms[roomId].length === 0) {
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

