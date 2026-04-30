// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    const eventsContainer = document.getElementById('events-container');
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearElement = document.getElementById('calendar-month-year');
    const previousMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const currentMonthButton = document.getElementById('current-month');
    const todayDate = new Date();
    let visibleMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    let allEvents = [];
    let selectedDateKey = null;
    
    // Function to format the date and time nicely
    function formatEventDate(dateString) {
        const date = new Date(dateString);
        const numericDate = date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        const time = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `${numericDate} ${weekday} ${time}`;
    }

    function getDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    function getDateKeyFromParts(year, month, day) {
        return getDateKey(new Date(year, month, day));
    }

    function formatDateLabel(date) {
        const numericDate = date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });

        return `${numericDate} ${weekday}`;
    }
    
    // Create calendar
    function createCalendar(events, monthDate = visibleMonth) {
        const currentMonth = monthDate.getMonth();
        const currentYear = monthDate.getFullYear();
        const today = todayDate.getDate();
        const isCurrentMonth = currentMonth === todayDate.getMonth() && currentYear === todayDate.getFullYear();
        
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
            const dateKey = getDateKeyFromParts(currentYear, currentMonth, day);
            const dayDiv = document.createElement('button');
            dayDiv.type = 'button';
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;
            dayDiv.setAttribute('aria-label', `Show events on ${formatDateLabel(new Date(currentYear, currentMonth, day))}`);
            dayDiv.setAttribute('aria-pressed', selectedDateKey === dateKey ? 'true' : 'false');
            
            if (isCurrentMonth && day === today) {
                dayDiv.classList.add('today');
            }

            if (selectedDateKey === dateKey) {
                dayDiv.classList.add('selected');
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

            dayDiv.addEventListener('click', () => {
                if (selectedDateKey === dateKey) {
                    selectedDateKey = null;
                    displayUpcomingEvents(allEvents);
                } else {
                    selectedDateKey = dateKey;
                    displayEventsForDate(allEvents, dateKey);
                }

                createCalendar(allEvents);
            });
            
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

    function moveVisibleMonth(monthOffset) {
        visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + monthOffset, 1);
        selectedDateKey = null;
        displayUpcomingEvents(allEvents);
        createCalendar(allEvents);
    }

    previousMonthButton.addEventListener('click', () => {
        moveVisibleMonth(-1);
    });

    nextMonthButton.addEventListener('click', () => {
        moveVisibleMonth(1);
    });

    currentMonthButton.addEventListener('click', () => {
        visibleMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
        selectedDateKey = null;
        displayUpcomingEvents(allEvents);
        createCalendar(allEvents);
    });

    function renderEvents(events, emptyMessage) {
        eventsContainer.innerHTML = '';

        if (events.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.textContent = emptyMessage;
            eventsContainer.appendChild(emptyState);
            return;
        }

        const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedEvents.forEach(event => {
            const eventCard = document.createElement('div');
            const title = document.createElement('h2');
            const when = document.createElement('p');
            const where = document.createElement('p');

            eventCard.className = 'event-card';

            if (event.link) {
                const link = document.createElement('a');
                link.href = event.link;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = event.title;
                title.appendChild(link);
            } else {
                title.textContent = event.title;
            }

            when.innerHTML = `<strong>When:</strong> ${formatEventDate(event.date)}`;
            where.innerHTML = `<strong>Where:</strong> ${event.location}`;

            eventCard.appendChild(title);
            eventCard.appendChild(when);
            eventCard.appendChild(where);
            eventsContainer.appendChild(eventCard);
        });
    }
    
    // Display today's and tomorrow's events
    function displayUpcomingEvents(events) {
        const today = new Date(todayDate);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayKey = getDateKey(today);
        const tomorrowKey = getDateKey(tomorrow);
        
        const upcomingEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            const eventDateKey = getDateKey(eventDate);
            
            // Check if the event is today or tomorrow
            return eventDateKey === todayKey || eventDateKey === tomorrowKey;
        });

        renderEvents(upcomingEvents, 'No events scheduled for today or tomorrow.');
    }

    function displayEventsForDate(events, dateKey) {
        const selectedDate = new Date(`${dateKey}T00:00:00`);
        const selectedEvents = events.filter(event => getDateKey(new Date(event.date)) === dateKey);

        renderEvents(selectedEvents, `No events scheduled for ${formatDateLabel(selectedDate)}.`);
    }
    
    // Fetch the events data
    fetch('events.json')
        .then(response => response.json())
        .then(events => {
            allEvents = events;
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
