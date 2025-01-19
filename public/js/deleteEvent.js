
import { fetchAndRenderTable } from './tableRenderer.js';

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('eventTable');

    tableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-button')) {
            const row = event.target.closest('tr');
            const eventId = row.getAttribute('data-event-id');

            if (eventId) {
                try {
                    const response = await fetch(`/listener/${eventId}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        console.log(`Event ${eventId} deleted successfully`);
                        await fetchAndRenderTable(); 
                    } else {
                        console.error('Failed to delete event');
                    }
                } catch (err) {
                    console.error('Error while deleting event:', err);
                }
            }
        }
    });
});
