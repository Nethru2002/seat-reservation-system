const API_URL = 'http://localhost:3000/api/intern';
const welcomeMessage = document.getElementById('welcome-message');
const logoutBtn = document.getElementById('logout-btn');
const dateInput = document.getElementById('reservation-date');
const seatGrid = document.getElementById('seat-grid');
const reservationsTableBody = document.querySelector('#reservations-table tbody');
const messageDiv = document.getElementById('message');

// Modal Elements
const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
const modalBody = document.getElementById('modalBody');
const confirmBookingBtn = document.getElementById('confirm-booking-btn');

let selectedSeatId = null;
let selectedSeatNumber = null;
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// This is the correct, single-line placeholder HTML
const placeholderHtml = `
    <div class="d-flex justify-content-center align-items-center w-100" style="grid-column: 1 / -1;">
        <p class="text-muted m-0">Please select a date to see available seats.</p>
    </div>`;


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
 * Initializes the page on load: checks auth, sets welcome message, and loads data.
 */
function initializePage() {
    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }
    welcomeMessage.textContent = `Welcome, ${user.name}!`;
    dateInput.min = new Date().toISOString().split("T")[0];
    seatGrid.innerHTML = placeholderHtml; // Set initial state correctly
    loadMyReservations();
}

/**
 * Displays the available seats in the grid.
 */
function displaySeats(seats) {
    seatGrid.innerHTML = '';
    if (seats.length === 0) {
        seatGrid.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1; text-align: center;">No available seats for this date.</p>';
        return;
    }
    
    seats.forEach(seat => {
        const seatDiv = document.createElement('div');
        seatDiv.className = 'seat';
        seatDiv.textContent = seat.seat_number;
        seatDiv.dataset.seatId = seat.id;

        seatDiv.addEventListener('click', () => {
            selectedSeatId = seat.id;
            selectedSeatNumber = seat.seat_number;
            
            modalBody.innerHTML = `Are you sure you want to book seat <strong>${selectedSeatNumber}</strong> for <strong>${new Date(dateInput.value).toLocaleDateString()}</strong>?`;
            confirmationModal.show();
        });
        seatGrid.appendChild(seatDiv);
    });
}

/**
 * Loads the user's current and past reservations into the table.
 */
async function loadMyReservations() {
    try {
        const res = await fetch(`${API_URL}/reservations`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Could not fetch your reservations.');
        const reservations = await res.json();
        
        reservationsTableBody.innerHTML = '';
        if (reservations.length === 0) {
            reservationsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">You have no reservations.</td></tr>';
            return;
        }

        reservations.forEach(res => {
            const row = document.createElement('tr');
            const reservationDate = new Date(res.reservation_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isFutureAndActive = reservationDate >= today && res.status === 'Active';
            
            row.innerHTML = `
                <td>${reservationDate.toLocaleDateString()}</td>
                <td>${res.seat_number} (${res.location_area})</td>
                <td><span class="badge bg-${res.status === 'Active' ? 'success' : 'secondary'}">${res.status}</span></td>
                <td>${isFutureAndActive ? `<button class="btn btn-outline-danger btn-sm" onclick="cancelReservation(${res.id})">Cancel</button>` : '—'}</td>
            `;
            reservationsTableBody.appendChild(row);
        });
    } catch (err) {
        showMessage(err.message, 'danger');
    }
}

/**
 * Cancels a reservation after user confirmation.
 */
async function cancelReservation(reservationId) {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
        const res = await fetch(`${API_URL}/reservations/${reservationId}/cancel`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        showMessage('Reservation cancelled successfully.', 'success');
        loadMyReservations();
    } catch (err) {
        showMessage(err.message, 'danger');
    }
}

// --- Event Listeners ---

logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

dateInput.addEventListener('change', async () => {
    const date = dateInput.value;
    seatGrid.innerHTML = '';
    selectedSeatId = null;

    if (!date) {
        // FIX #2: Use the correct placeholder when date is cleared
        seatGrid.innerHTML = placeholderHtml;
        return;
    }

    seatGrid.innerHTML = '<div class="spinner-border text-primary" style="grid-column: 1 / -1; margin: auto;"></div>';

    try {
        const res = await fetch(`${API_URL}/seats?date=${date}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Could not fetch seats. Please try again.');
        const seats = await res.json();
        displaySeats(seats);
    } catch (err) {
        seatGrid.innerHTML = `<p class="text-danger" style="grid-column: 1 / -1;">${err.message}</p>`;
    }
});

confirmBookingBtn.addEventListener('click', async () => {
    const reservation_date = dateInput.value;
    if (!selectedSeatId || !reservation_date) return;

    try {
        const res = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ seat_id: selectedSeatId, reservation_date })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        confirmationModal.hide();
        showMessage('Seat booked successfully! A confirmation email has been sent.', 'success');
        
        dateInput.value = '';
        seatGrid.innerHTML = placeholderHtml;
        loadMyReservations();
    } catch (err) {
        confirmationModal.hide();
        showMessage(err.message, 'danger');
    }
});


// --- Run on page load ---
initializePage();