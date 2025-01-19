export function createRow(event) {
    const row = document.createElement('tr');
    row.setAttribute('data-event-id', event.id); 

    // Activity column
    const activityCell = document.createElement('td');
    activityCell.classList.add('activity-column');
    activityCell.textContent = event.activity;

    const timestamp = document.createElement('small');
    timestamp.textContent = event.timestamp;
    activityCell.appendChild(document.createElement('br'));
    activityCell.appendChild(timestamp);
    activityCell.appendChild(document.createElement('br'));

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('btn', 'btn-danger', 'delete-button', 'mt-2');
    deleteButton.textContent = 'Delete';
    activityCell.appendChild(deleteButton);

    row.appendChild(activityCell);

    // Data column
    const dataCell = document.createElement('td');
    dataCell.classList.add('data-column');
    const pre = document.createElement('pre');
    pre.textContent = event.data; 
    dataCell.appendChild(pre);
    row.appendChild(dataCell);

    // Response column
    const responseCell = document.createElement('td');
    responseCell.classList.add('response-column');
    responseCell.textContent = event.response;
    row.appendChild(responseCell);

    return row;
}



export async function fetchAndRenderTable() {
    const tableBody = document.getElementById('eventTable');

    try {
        const response = await fetch('/listener', {
            headers: {
                'Accept': 'application/json', 
            },
        });
        const events = await response.json();

      
        tableBody.innerHTML = '';

        events.forEach((event) => {
            const row = createRow(event);
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching and rendering table:', error);
    }
}


export function updateTable(events, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);

    //console.log('Events to update:', events); 

    // Flatten the array if needed
    const flattenedEvents = events.flat(); 

    flattenedEvents.forEach((event) => {
        //console.log('Processing event:', event); 
        const row = createRow(event);
        tableBody.prepend(row); 
    });
}
