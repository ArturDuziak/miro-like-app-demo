import useWebSocket from 'react-use-websocket';
import { useEffect, useState, useRef } from 'react';
import { Cursor } from './components/Cursor';
import useMousePosition from './hooks/useMousePosition';
import throttle from 'lodash.throttle';

// eslint-disable-next-line react/prop-types
export function Home({ username, roomId }) {
  const socketUrl = 'ws://localhost:5005/websockets';

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    queryParams: { username, room_id: roomId },
  });
  const mousePosition = useMousePosition();

  const [users, setUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');

  const THROTTLE = 10;
  const throttledSendJsonMessage = useRef(throttle(sendJsonMessage, THROTTLE));

  const handleMessageSend = () => {
    sendJsonMessage({
      action: 'chat_message',
      payload: { message: chatMessage },
    });

    setChatMessages((prev) => [...prev, { username, message: chatMessage }]);
    setChatMessage('');
  };

  useEffect(() => {
    if (mousePosition.x && mousePosition.y) {
      throttledSendJsonMessage.current({
        action: 'update_cursor',
        payload: { x: mousePosition.x, y: mousePosition.y },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mousePosition]);

  useEffect(() => {
    if (lastMessage) {
      const { action, payload } = JSON.parse(lastMessage.data);
      console.log('action', action, 'payload', payload);

      if (action === 'update_cursor') {
        const dataArray = Object.entries(payload).map(([id, value]) => ({ id, ...value }));

        setUsers(dataArray);
      } else if (action === 'chat_message') {
        setChatMessages((prev) => [...prev, payload]);
      } else {
        console.log('Unknown action', action);
      }
    }
  }, [lastMessage, username]);

  return (
    <>
      <h1>Welcome {username}</h1>

      <p>Websocket status: {readyState}</p>

      {users.map((user) => {
        return (
          <Cursor key={user.id} point={[user.state.x, user.state.y]} username={user.username} />
        );
      })}
      <div style={
        {
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: '10px',
          background: 'white',
          borderTop: '1px solid black',
        }

      }>
        <div>
          {chatMessages.map((message, index) => {
            return (
              <p key={index} data-testid="chat-message">
                <b>{message.username}</b>: {message.message}
              </p>
            );
          })}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleMessageSend({ username, roomId });
          }}
        >
          <input
            type="text"
            value={chatMessage}
            placeholder="chatMessage"
            onChange={(e) => setChatMessage(e.target.value)}
          />
        </form>
      </div>
    </>
  );
}
