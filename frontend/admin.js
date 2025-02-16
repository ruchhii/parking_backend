document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://parking-system-production.up.railway.app"; // ✅ Updated Backend URL

    fetchSlots();

    document.getElementById("addSlotForm").addEventListener("submit", async (event) => {
        event.preventDefault(); // ✅ Prevent Page Reload

        const slotNumber = document.getElementById("slotNumber").value.trim();
        if (!slotNumber) {
            alert("⚠️ Please enter a slot number.");
            return;
        }

        const token = localStorage.getItem('admin_token');
        if (!token) {
            alert('⚠️ Unauthorized! Please log in as admin.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/slots`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ slot_number: slotNumber })
            });

            const data = await response.json();

            if (data.success) {
                alert("✅ Slot added successfully!");
                document.getElementById("slotNumber").value = ''; // ✅ Clear Input
                fetchSlots(); // ✅ Refresh Slot Table
            } else {
                alert("❌ Error: " + data.message);
            }
        } catch (error) {
            console.error("❌ Error adding slot:", error);
            alert("⚠️ An error occurred while adding the slot. Please try again.");
        }
    });
});

async function fetchSlots() {
    try {
        const response = await fetch("http://parking-system-production.up.railway.app/api/slots");
        const slots = await response.json();

        const tableBody = document.getElementById("slotsTable");
        tableBody.innerHTML = "";

        slots.forEach(slot => {
            const row = `
                <tr>
                    <td>${slot.slot_number}</td>
                    <td>${slot.is_available ? "🟢 Available" : "🔴 Booked"}</td>
                    <td>${slot.booked_by ? slot.booked_by : "N/A"}</td>
                </tr>`;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("❌ Error fetching slots:", error);
        alert("⚠️ An error occurred while fetching the parking slots.");
    }
}
