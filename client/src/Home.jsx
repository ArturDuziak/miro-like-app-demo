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

  const THROTTLE = 10;
  const throttledSendJsonMessage = useRef(throttle(sendJsonMessage, THROTTLE));

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
      const users = JSON.parse(lastMessage.data);

      console.log('users', users);

      const dataArray = Object.entries(users).map(([id, value]) => ({ id, ...value }));

      setUsers(dataArray);
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
    </>
  );
}
