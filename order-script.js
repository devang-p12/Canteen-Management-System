// Retrieve cart data
const cart = JSON.parse(localStorage.getItem("cart")) || [];
const orderTableBody = document.querySelector("#order-table tbody");
const totalAmountSpan = document.getElementById("total-amount");

// Populate the order table
let totalPayment = 0;
cart.forEach((item) => {
    const row = document.createElement("tr");
    const itemTotal = item.price * item.quantity;

    row.innerHTML = `
        <td>${item.name}</td>
        <td>₹${item.price.toFixed(2)}</td>
        <td>${item.quantity}</td>
        <td>₹${itemTotal.toFixed(2)}</td>
    `;

    totalPayment += itemTotal;
    orderTableBody.appendChild(row);
});

// Display total payment
totalAmountSpan.textContent = totalPayment.toFixed(2);

// Checkout button
document.getElementById("checkout-button").addEventListener("click", () => {
    alert("Proceeding to checkout!");
    // Redirect or handle payment gateway integration here
});
