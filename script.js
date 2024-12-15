document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      if (username === "user" && password === "password") {
        alert("Login successful!");
        window.location.href = "index.html";
      } else {
        alert("Invalid username or passcode.");
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", function (event) {
      event.preventDefault();
      alert("Signup successful!");
      window.location.href = "login.html";
    });
  }
});

var selectedRow = null;

function onFormSubmit(e) {
  event.preventDefault();
  var formData = readFormData();
  if (selectedRow == null) {
    insertNewRecord(formData);
  } else {
    updateRecord(formData);
  }
  resetForm();
}

function readFormData() {
  var formData = {};
  formData["productCode"] = document.getElementById("productCode").value;
  formData["product"] = document.getElementById("product").value;
  formData["qty"] = document.getElementById("qty").value;
  formData["perPrice"] = document.getElementById("perPrice").value;
  return formData;
}

function insertNewRecord(data) {
  var table = document
    .getElementById("storeList")
    .getElementsByTagName("tbody")[0];
  var newRow = table.insertRow(table.length);
  cell1 = newRow.insertCell(0);
  cell1.innerHTML = data.productCode;
  cell2 = newRow.insertCell(1);
  cell2.innerHTML = data.product;
  cell3 = newRow.insertCell(2);
  cell3.innerHTML = data.qty;
  cell4 = newRow.insertCell(3);
  cell4.innerHTML = data.perPrice;
  cell4 = newRow.insertCell(4);
  cell4.innerHTML = `<button onClick="onEdit(this)">Edit</button> <button onClick="onDelete(this)">Delete</button>`;
}

function insertNewRecords(data) {
  var table = document
    .getElementById("storesList")
    .getElementsByTagName("tbody")[0];
  var newRow = table.insertRow(table.length);
  cell1 = newRow.insertCell(0);
  cell1.innerHTML = data.productCode;
  cell2 = newRow.insertCell(1);
  cell2.innerHTML = data.product;
  cell3 = newRow.insertCell(2);
  cell3.innerHTML = data.qty;
  cell4 = newRow.insertCell(3);
  cell4.innerHTML = data.perPrice;
}

//Edit the data
function onEdit(td) {
  selectedRow = td.parentElement.parentElement;
  document.getElementById("productCode").value = selectedRow.cells[0].innerHTML;
  document.getElementById("product").value = selectedRow.cells[1].innerHTML;
  document.getElementById("qty").value = selectedRow.cells[2].innerHTML;
  document.getElementById("perPrice").value = selectedRow.cells[3].innerHTML;
}
function updateRecord(formData) {
  selectedRow.cells[0].innerHTML = formData.productCode;
  selectedRow.cells[1].innerHTML = formData.product;
  selectedRow.cells[2].innerHTML = formData.qty;
  selectedRow.cells[3].innerHTML = formData.perPrice;
}


function onDelete(td) {
  if (confirm("Do you want to delete this record?")) {
    row = td.parentElement.parentElement;
    document.getElementById("storeList").deleteRow(row.rowIndex);
    resetForm();
  }
}


function resetForm() {
  document.getElementById("productCode").value = "";
  document.getElementById("product").value = "";
  document.getElementById("qty").value = "";
  document.getElementById("perPrice").value = "";
  selectedRow = null;
}

// Fetch products function
async function fetchProducts() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Unauthorized! Please log in.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/products", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const products = await response.json();
      console.log(products);
      // Update UI with product data
    } else {
      alert("Failed to fetch products. Please try again.");
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}
