import { Login } from './components/login';
import { Home } from './Home';
import { useState } from 'react';

function App() {
  const [username, setUsername] = useState('');

  return username ? (
    <>
      <Home username={username} />
    </>
  ) : (
    <>
      <Login onSubmit={setUsername} />
    </>
  );
}

export default App;
