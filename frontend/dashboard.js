document.addEventListener('DOMContentLoaded', () => {
    fetchAvailableSlots();
});

function fetchAvailableSlots() {
    fetch('http://localhost:3000/api/slots')
        .then(response => response.json())
        .then(slots => {
            const availableSlots = document.getElementById('availableSlots');
            availableSlots.innerHTML = '';
            slots.forEach(slot => {
                if (slot.is_available) {
                    const slotDiv = document.createElement('div');
                    slotDiv.classList.add('slot');
                    slotDiv.innerText = `Slot ${slot.slot_number}`;
                    slotDiv.addEventListener('click', () => bookSlot(slot.id));
                    availableSlots.appendChild(slotDiv);
                }
            });
        });
}

function bookSlot(slotId) {
    const userId = localStorage.getItem('user_id');

    fetch('http://localhost:3000/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, slot_id: slotId })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchAvailableSlots();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    document.getElementById('username').textContent = username || 'User';

    // Redirect to booking page when clicking the button
    document.getElementById('bookSlotBtn').addEventListener('click', () => {
        window.location.href = 'booking.html';
    });

    // Logout functionality
    document.getElementById('logout').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
});
