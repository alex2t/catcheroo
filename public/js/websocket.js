// public/js/websocket.js
export default function setupWebSocket(tableBodyId) {
    const socket = new WebSocket(`ws://${window.location.hostname}:3001`);

    socket.onopen = () => {
        console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
        const newEvents = JSON.parse(event.data);
        updateTable(newEvents, tableBodyId);
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed');
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    return socket;
}

function updateTable(events, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);

    events.forEach((event) => {
        const row = document.createElement('tr');

        const activityCell = document.createElement('td');
        activityCell.textContent = event.activity;
        row.appendChild(activityCell);

        const dataCell = document.createElement('td');
        const pre = document.createElement('pre');
        pre.textContent = event.data;
        dataCell.appendChild(pre);
        row.appendChild(dataCell);

        const responseCell = document.createElement('td');
        responseCell.textContent = event.response;
        row.appendChild(responseCell);

        tableBody.prepend(row);
    });
}
