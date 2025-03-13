document.addEventListener("DOMContentLoaded", function () {
    // Select form and input elements
    const productForm = document.querySelector("#addProductForm");
    const categoryInput = document.querySelector("#category");
    const productNameInput = document.querySelector("#productName");
    const priceInput = document.querySelector("#productPrice");
    const fileInput = document.querySelector("#productImage");
    const productList = document.querySelector("#productList");
    const successMessage = document.querySelector("#successMessage");

    // Fetch and display products from backend
    async function fetchProducts() {
        try {
            const response = await fetch("http://localhost:3000/api/services");
            const products = await response.json();

            // Clear the product list
            productList.innerHTML = "";

            // Display each product
            products.forEach(product => {
                const productItem = document.createElement("li");
                productItem.innerHTML = `
                    <strong>Category:</strong> ${product.category} <br>
                    <strong>Product Name:</strong> ${product.name} <br>
                    <strong>Price:</strong> $${product.price} <br>
                    <strong>Image:</strong> <img src="${product.imageurl}" alt="${product.name}" width="100"> <br>
                    <strong>Description:</strong> ${product.description}
                `;
                productList.appendChild(productItem);
            });
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }

    // Handle form submission
    productForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent form from reloading the page

        // Get input values
        const category = categoryInput.value;
        const productName = productNameInput.value;
        const price = priceInput.value;
        const file = fileInput.files[0]; // For now, we use placeholder URLs for images

        if (!category || !productName || !price || !file) {
            alert("Please fill out all fields!");
            return;
        }

        try {
            // Send data to backend
            const response = await fetch("http://localhost:3000/api/services", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    category,
                    name: productName,
                    price,
                    imageUrl: "https://example.com/image.jpg", // Replace with actual file handling logic
                    description: "No description provided" // Placeholder description
                })
            });

            if (response.ok) {
                successMessage.textContent = "Product added successfully!";
                successMessage.style.display = "block";
                productForm.reset(); // Clear the form
                fetchProducts(); // Refresh product list
            } else {
                const errorData = await response.json();
                alert("Error: " + errorData.error);
            }
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Failed to add product. Check the console for details.");
        }
    });

    // Initial fetch of products
    fetchProducts();
});
