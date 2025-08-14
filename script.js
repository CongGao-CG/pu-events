// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    const eventsContainer = document.getElementById('events-container');

    // Function to format the date and time nicely
    function formatEventDate(dateString) {
        const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', options);
    }

    // Get today's and tomorrow's dates (ignoring time for comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch the events data
    fetch('events.json')
        .then(response => response.json())
        .then(events => {
            const upcomingEvents = events.filter(event => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0); // Normalize event date
                
                // Check if the event is today or tomorrow
                return eventDate.getTime() === today.getTime() || eventDate.getTime() === tomorrow.getTime();
            });
            
            if (upcomingEvents.length === 0) {
                eventsContainer.innerHTML = '<p>No events scheduled for today or tomorrow.</p>';
                return;
            }

            // Sort events by time
            upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Create and display a card for each upcoming event
            upcomingEvents.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';

                eventCard.innerHTML = `
                    <h2>${event.title}</h2>
                    <p><strong>When:</strong> ${formatEventDate(event.date)}</p>
                    <p><strong>Where:</strong> ${event.location}</p>
                `;
                
                eventsContainer.appendChild(eventCard);
            });
        })
        .catch(error => {
            console.error('Error fetching events:', error);
            eventsContainer.innerHTML = '<p>Could not load events. Please try again later.</p>';
        });
});
