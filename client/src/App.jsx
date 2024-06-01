import { Login } from './components/login';
import { Home } from './Home';
import { useState } from 'react';

function App() {
  const [loginData, setLoginData] = useState({ username: '', roomId: '' });

  return loginData.username && loginData.roomId ? (
    <>
      <Home username={loginData.username} roomId={loginData.roomId} />
    </>
  ) : (
    <>
      <Login onSubmit={setLoginData} />
    </>
  );
}

export default App;
