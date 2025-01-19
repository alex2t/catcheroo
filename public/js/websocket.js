import { updateTable } from './tableRenderer.js';

export default function setupWebSocket(tableBodyId) {

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.hostname}:${window.location.port}`);

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const tableBody = document.getElementById('eventTable');
        updateTable([message], 'eventTable');
    
    };
 
    socket.onclose = () => {
        console.log('WebSocket connection closed');
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    return socket;
}


