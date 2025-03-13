document.addEventListener("DOMContentLoaded", function () {
    const servicesList = document.querySelector("#servicesList");

    // Fetch services from the backend
    async function fetchServices() {
        try {
            const response = await fetch("http://localhost:3000/api/services");
            if (!response.ok) {
                throw new Error(`Failed to fetch services: ${response.statusText}`);
            }
            const services = await response.json();

            // Group services by category
            const groupedServices = services.reduce((groups, service) => {
                if (!groups[service.category]) {
                    groups[service.category] = [];
                }
                groups[service.category].push(service);
                return groups;
            }, {});

            // Clear existing services
            servicesList.innerHTML = "";

            // Loop through categories and display services
            for (const category in groupedServices) {
                const categoryContainer = document.createElement("div");
                categoryContainer.classList.add("category");

                const categoryHeader = document.createElement("h2");
                categoryHeader.textContent = category;
                categoryContainer.appendChild(categoryHeader);

                const servicesContainer = document.createElement("div");
                servicesContainer.classList.add("services-container");

                groupedServices[category].forEach(service => {
                    const serviceItem = document.createElement("div");
                    serviceItem.classList.add("service");

                    serviceItem.innerHTML = `
                        <img src="${service.imageurl || '/path/to/default-image.jpg'}" alt="${service.name}">
                        <h3>${service.name}</h3>
                        <p><strong>Category:</strong> ${service.category}</p>
                        <p><strong>Price:</strong> $${service.price}</p>
                        <p><strong>Description:</strong> ${service.description}</p>
                        <label for="quantity-${service.id}">Quantity:</label>
                        <input type="number" id="quantity-${service.id}" class="quantity-input" min="1" value="1">
                        <button class="request-button" data-id="${service.id}" data-name="${service.name}">Request</button>
                    `;

                    servicesContainer.appendChild(serviceItem);
                });

                categoryContainer.appendChild(servicesContainer);
                servicesList.appendChild(categoryContainer);
            }
        } catch (error) {
            console.error("Error fetching services:", error);
            servicesList.innerHTML = "<p style='color: red;'>Failed to load services. Please try again later.</p>";
        }
    }

    // Add event listener for request buttons using delegation
    servicesList.addEventListener("click", async (event) => {
        if (event.target.classList.contains("request-button")) {
            const serviceId = event.target.getAttribute("data-id");
            const serviceName = event.target.getAttribute("data-name");
            const quantityInput = document.querySelector(`#quantity-${serviceId}`);
            const quantity = parseInt(quantityInput.value, 10);

            // Retrieve the logged-in username from localStorage
            const username = localStorage.getItem("username");

            // Debugging: Log the username being sent
            console.log("Username being sent:", username);

            // Validate username and quantity
            if (!username) {
                alert("You must be logged in to make a request.");
                return;
            }
            if (isNaN(quantity) || quantity < 1) {
                alert("Please enter a valid quantity.");
                return;
            }

            // Send request to the backend
            try {
                const response = await fetch("http://localhost:3000/api/requests", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, product_name: serviceName, quantity }),
                });

                if (response.ok) {
                    alert("Request submitted successfully!");
                } else {
                    const errorData = await response.json();
                    alert(`Failed to submit request: ${errorData.error || "Please try again."}`);
                }
            } catch (error) {
                console.error("Error submitting request:", error);
                alert("An error occurred while submitting the request.");
            }
        }
    });

    // Fetch and display services
    fetchServices();
});
