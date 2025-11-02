// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    const eventsContainer = document.getElementById('events-container');
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearElement = document.getElementById('calendar-month-year');
    
    // Function to format the date and time nicely
    function formatEventDate(dateString) {
        const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', options);
    }
    
    // Create calendar
    function createCalendar(events) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const today = now.getDate();
        
        // Set month/year header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
        monthYearElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
        
        // Build per-day event info: day -> { hasBefore4: bool, hasAfter4: bool }
        const dayEventInfo = {};
        events.forEach(event => {
            const eventDate = new Date(event.date);
            if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
                const day = eventDate.getDate();
                const hour = eventDate.getHours();
                if (!dayEventInfo[day]) {
                    dayEventInfo[day] = { hasBefore4: false, hasAfter4: false };
                }
                if (hour < 16) {
                    dayEventInfo[day].hasBefore4 = true;
                } else {
                    dayEventInfo[day].hasAfter4 = true;
                }
            }
        });
        
        // Clear existing calendar days (keep headers)
        const dayHeaders = 7;
        while (calendarGrid.children.length > dayHeaders) {
            calendarGrid.removeChild(calendarGrid.lastChild);
        }
        
        // Add days from previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = daysInPrevMonth - i;
            calendarGrid.appendChild(dayDiv);
        }
        
        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;
            
            if (day === today) {
                dayDiv.classList.add('today');
            }
            
            const info = dayEventInfo[day];
            if (info) {
                // keep a general marker style
                dayDiv.classList.add('has-event');

                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'event-dots';

                if (info.hasBefore4) {
                    const dotAM = document.createElement('span');
                    dotAM.className = 'dot dot-am';   // orange
                    dotsContainer.appendChild(dotAM);
                }
                if (info.hasAfter4) {
                    const dotPM = document.createElement('span');
                    dotPM.className = 'dot dot-pm';   // blue
                    dotsContainer.appendChild(dotPM);
                }

                dayDiv.appendChild(dotsContainer);
            }
            
            calendarGrid.appendChild(dayDiv);
        }
        
        // Add days from next month to fill the grid
        const totalCells = calendarGrid.children.length - dayHeaders;
        const weeksNeeded = Math.ceil((firstDay + daysInMonth) / 7);
        const cellsNeeded = weeksNeeded * 7;
        const remainingCells = cellsNeeded - totalCells;
        
        for (let day = 1; day <= remainingCells; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = day;
            calendarGrid.appendChild(dayDiv);
        }
    }
    
    // Display today's and tomorrow's events
    function displayUpcomingEvents(events) {
        // Get today's and tomorrow's dates (ignoring time for comparison)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
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
            
            // Create title with optional link
            const titleHTML = event.link 
                ? `<h2><a href="${event.link}" target="_blank" rel="noopener noreferrer">${event.title}</a></h2>`
                : `<h2>${event.title}</h2>`;
            
            eventCard.innerHTML = `
                ${titleHTML}
                <p><strong>When:</strong> ${formatEventDate(event.date)}</p>
                <p><strong>Where:</strong> ${event.location}</p>
            `;
            
            eventsContainer.appendChild(eventCard);
        });
    }
    
    // Fetch the events data
    fetch('events.json')
        .then(response => response.json())
        .then(events => {
            createCalendar(events);
            displayUpcomingEvents(events);
        })
        .catch(error => {
            console.error('Error fetching events:', error);
            eventsContainer.innerHTML = '<p>Could not load events. Please try again later.</p>';
            // Still try to create an empty calendar
            createCalendar([]);
        });
});
