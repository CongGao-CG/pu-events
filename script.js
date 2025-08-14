document.addEventListener('DOMContentLoaded', () => {
    // Keep references to our HTML elements
    const eventsContainer = document.getElementById('events-container');
    const eventsListTitle = document.getElementById('events-list-title');

    let allEvents = []; // To store all fetched events

    // Helper function to get a date in 'YYYY-MM-DD' format
    const getYYYYMMDD = (date) => {
        return date.toISOString().split('T')[0];
    };

    // --- Renders events for a specific date or a date range ---
    function renderEvents(filterDate) {
        eventsContainer.innerHTML = ''; // Clear the current list

        let eventsToShow;
        if (filterDate) {
            // Filter for a single specific day
            const filterDateStr = getYYYYMMDD(filterDate);
            eventsListTitle.innerText = `Events for ${filterDate.toLocaleDateString()}`;
            eventsToShow = allEvents.filter(event => getYYYYMMDD(new Date(event.date)) === filterDateStr);
        } else {
            // Default: show events for today and tomorrow
            eventsListTitle.innerText = 'Events for Today & Tomorrow';
            const todayStr = getYYYYMMDD(new Date());
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = getYYYYMMDD(tomorrow);
            
            eventsToShow = allEvents.filter(event => {
                const eventDateStr = getYYYYMMDD(new Date(event.date));
                return eventDateStr === todayStr || eventDateStr === tomorrowStr;
            });
        }
        
        if (eventsToShow.length === 0) {
            eventsContainer.innerHTML = '<p>No events scheduled for this day.</p>';
            return;
        }

        // Sort events by time and display them
        eventsToShow.sort((a, b) => new Date(a.date) - new Date(b.date));
        eventsToShow.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            const eventTime = new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
            
            eventCard.innerHTML = `
                <h2>${event.title}</h2>
                <p><strong>When:</strong> ${eventTime}</p>
                <p><strong>Where:</strong> ${event.location}</p>
            `;
            eventsContainer.appendChild(eventCard);
        });
    }

    // --- Fetch data and initialize everything ---
    fetch('events.json')
        .then(response => response.json())
        .then(events => {
            allEvents = events;

            // Get a unique list of dates that have events
            const eventDates = [...new Set(events.map(event => getYYYYMMDD(new Date(event.date))))];

            // Initialize the Calendar
            const options = {
                // Actions triggered by user interaction
                actions: {
                    clickDay(e, dates) {
                        if (dates[0]) {
                           renderEvents(new Date(dates[0]));
                        }
                    },
                },
                // Dates to highlight on the calendar
                dates: {
                    marked: eventDates,
                }
            };
            const calendar = new VanillaCalendar('#calendar-container', options);
            calendar.init();

            // Initially, show events for today and tomorrow
            renderEvents(null); 
        })
        .catch(error => {
            console.error('Error fetching events:', error);
            eventsContainer.innerHTML = '<p>Could not load events. Please try again later.</p>';
        });
});
