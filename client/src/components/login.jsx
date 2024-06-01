import { useState } from 'react'

// eslint-disable-next-line react/prop-types
export function Login({ onSubmit }) {
    const [username, setUsername] = useState('')
    const [roomId, setRoomId] = useState('')

    return (
        <>
            <h1>Welcome</h1>
            <p>What should people call you?</p>
            <form onSubmit={e => {
                e.preventDefault()
                onSubmit({ username, roomId })
            }}>
                <input 
                    type="text" 
                    value={username} 
                    placeholder="username"
                    onChange={e => setUsername(e.target.value)} />
                <input 
                    type="text" 
                    value={roomId} 
                    placeholder="room id"
                    onChange={e => setRoomId(e.target.value)} />
                <input type="submit" />
            </form>
        </>
    )
}
