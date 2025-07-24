// --- Top-level variable declarations ---
const API_URL = 'http://localhost:3000/api/admin';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
let allReservationsData = []; // Cache for live searching
let usageChart = null; // To hold the chart instance

// --- DOM Element Selectors ---
const welcomeMessage = document.getElementById('welcome-message');
const logoutBtn = document.getElementById('logout-btn');
const messageDiv = document.getElementById('message');
const seatsTableBody = document.querySelector('#seats-table tbody');
const reservationsTbody = document.getElementById('all-reservations-tbody');
const addSeatForm = document.getElementById('add-seat-form');
const searchInput = document.getElementById('reservation-search');

// --- Helper Functions ---

/**
 * Displays a message to the user using Bootstrap's alert component.
 */
function showMessage(text, type) {
    const alertType = type === 'success' ? 'alert-success' : 'alert-danger';
    messageDiv.innerHTML = `<div class="alert ${alertType} alert-dismissible fade show" role="alert">
        ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
    messageDiv.style.display = 'block';
    setTimeout(() => { messageDiv.style.display = 'none'; }, 5000);
}

/**
 * Renders the usage chart on the canvas. Destroys old chart if it exists.
 */
function renderUsageChart(chartData) {
    const ctx = document.getElementById('usageChart').getContext('2d');
    if (usageChart) {
        usageChart.destroy(); // Destroy the old chart instance before creating a new one
    }
    usageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Bookings per Day',
                data: chartData.data,
                backgroundColor: 'rgba(0, 170, 255, 0.6)',
                borderColor: 'rgba(0, 170, 255, 1)',
                borderWidth: 1,
                borderRadius: 5,
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, ticks: { color: 'var(--text-color)', stepSize: 1 } },
                x: { ticks: { color: 'var(--text-color)' } }
            },
            plugins: { legend: { labels: { color: 'var(--text-color)' } } }
        }
    });
}

/**
 * Displays an array of reservation objects in the main table.
 */
function displayReservations(reservations) {
    reservationsTbody.innerHTML = '';
    if (reservations.length === 0) {
        reservationsTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No reservations match your criteria.</td></tr>';
        return;
    }
    reservations.forEach(res => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(res.reservation_date).toLocaleDateString()}</td>
            <td>${res.intern_name}<br><small class="text-muted">${res.intern_email}</small></td>
            <td>${res.seat_number} (${res.location_area})</td>
            <td><span class="badge bg-${res.status === 'Active' ? 'success' : 'secondary'}">${res.status}</span></td>
        `;
        reservationsTbody.appendChild(row);
    });
}


// --- Data Loading Functions ---

async function loadAllData() {
    // Use Promise.all to fetch all necessary data in parallel for faster loading
    try {
        await Promise.all([
            loadDashboardStats(),
            loadAllReservations(),
            loadSeats(),
            loadChartData()
        ]);
    } catch (error) {
        showMessage('Failed to load all dashboard data. Please check the server connection.', 'danger');
    }
}

async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Stats fetch failed');
        const stats = await res.json();
        document.getElementById('total-seats-stat').textContent = stats.totalSeats;
        document.getElementById('booked-today-stat').textContent = stats.bookedToday;
        document.getElementById('utilization-stat').textContent = `${stats.utilization}%`;
    } catch (err) { console.error('Failed to load stats:', err); }
}

async function loadAllReservations() {
    try {
        const res = await fetch(`${API_URL}/reservations`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Reservations fetch failed');
        allReservationsData = await res.json();
        displayReservations(allReservationsData); // Display all reservations initially
    } catch (err) {
        showMessage('Failed to load reservations data.', 'danger');
        console.error('Failed to load reservations:', err);
    }
}

async function loadSeats() {
    try {
        const res = await fetch(`${API_URL}/seats`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Seats fetch failed');
        const seats = await res.json();
        seatsTableBody.innerHTML = '';
        seats.forEach(seat => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${seat.id}</td>
                <td>${seat.seat_number}</td>
                <td>${seat.location_area}</td>
                <td><button class="btn btn-outline-danger btn-sm" onclick="deleteSeat(${seat.id})">Delete</button></td>
            `;
            seatsTableBody.appendChild(row);
        });
    } catch (err) {
        showMessage('Failed to load seats data.', 'danger');
        console.error('Failed to load seats:', err);
    }
}

async function loadChartData() {
    try {
        const res = await fetch(`${API_URL}/reports/usage-by-day`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Chart data fetch failed');
        const chartData = await res.json();
        renderUsageChart(chartData);
    } catch (err) { console.error('Failed to load chart data:', err); }
}

async function deleteSeat(seatId) {
    if (!confirm('Are you sure you want to delete this seat? This cannot be undone.')) return;
    try {
        await fetch(`${API_URL}/seats/${seatId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        showMessage('Seat deleted successfully.', 'success');
        loadSeats(); // Refresh the list of seats
        loadDashboardStats(); // Refresh the stats
    } catch (err) {
        showMessage('Failed to delete seat.', 'danger');
    }
}

// --- Event Listeners ---

logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

addSeatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const seat_number = document.getElementById('seat-number').value;
    const location_area = document.getElementById('location-area').value;
    try {
        await fetch(`${API_URL}/seats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ seat_number, location_area })
        });
        showMessage('Seat added successfully!', 'success');
        addSeatForm.reset();
        loadSeats(); // Refresh the list of seats
        loadDashboardStats(); // Refresh the stats
    } catch (err) {
        showMessage('Failed to add seat.', 'danger');
    }
});

searchInput.addEventListener('keyup', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredData = allReservationsData.filter(res =>
        res.intern_name.toLowerCase().includes(searchTerm) ||
        res.intern_email.toLowerCase().includes(searchTerm) ||
        res.seat_number.toLowerCase().includes(searchTerm)
    );
    displayReservations(filteredData);
});

// --- Initializer ---

function initializePage() {
    // Authentication & Authorization Check
    if (!token || !user || user.role !== 'Admin') {
        localStorage.clear();
        window.location.href = 'index.html';
        return;
    }
    
    welcomeMessage.textContent = `Welcome, ${user.name}`;
    loadAllData();
}

// Run the initializer function when the page loads
initializePage();