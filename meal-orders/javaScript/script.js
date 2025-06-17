/**Things to fix: 
 * Error Message beef_cheese
 * When the user types a number to complete an order, the completed order list does not update.
 */




const output = document.getElementById("output");
const inputElement = document.getElementById("ingredientInput");

window.addEventListener("DOMContentLoaded", displayOrders);
window.addEventListener("DOMContentLoaded", displayCompletedOrders);
/**Initially just called displayOrders but after some research figured it would be better
 * to put the DOMContentLoaded event listener to be sure our HTML loads first. 
 */


/** This function connects to the API and fetches a list of meals based on the 
 * input from the user. It then selects a random meal from that list. 
 */
function getRandomMeal(ingredient){
  fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`)
    .then(response => response.json())
    .then(data => {
      const meals = data.meals;
      output.innerHTML = "";  //clears the previous results.

      if (!meals){
        showOutputMessage(`We could not find any meals with ${ingredient}, please try again`, "error");
        resetInput();
        return;
      }

      const randomMeal = meals[Math.floor(Math.random() * meals.length)]; 
      //selects a random meal from the list
      showOutputMessage(`Added ${randomMeal.strMeal} to incomplete orders`, "info");
      addOrder(randomMeal);
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      showOutputMessage("Something went wrong. Please try again.", "error")

    });

  }

/**This function formats the input. It removes any unneccessary spaces before or 
 * after the input, then replaces and spaces with underscores as well as makes 
 * everything lowercase. Making the input usable with our API. 
 */
function formatInput(input) {
  return input.trim().toLowerCase().replace(/\s+/g, "_");
}

/**This Function is connected to our search button in HTML. This is triggered when
 * the search button is clicked. This checks the validity of the users input before
 * calling the getRandomMeal function with the user input.
 * 
 * This function also takes a number inputted by the user, finds the order corresponding
 * to that number and completes it using the completeOrderById function. 
 */
function search() {
  const user_input = formatInput(inputElement.value);
  output.innerHTML = "";
  output.className = "";
  if (user_input === "") {
    showOutputMessage("Please enter an ingredient or order number.", "error"); 
    resetInput();
    return;
  }
/**Check if the user entered a number in order to complete an already created order */
  if (!isNaN(user_input)) {
    const orderId = parseInt(user_input);
    completeOrderById(orderId);
    resetInput();
    return;
  }
  getRandomMeal(user_input);
  resetInput();
}


/**Just a small function for when we want to clear the users input and refocus our cursor */
function resetInput(){
  inputElement.value = "";
  inputElement.focus();  
}


/**This function finds or creates an array of orders. Finds or creates the order 
 * number, then adds the newOrder object to the array and saves it in sessionStorage.
*/
function addOrder(meal) {
  let orders = JSON.parse(sessionStorage.getItem("orders")) || [];
  let orderId = parseInt(sessionStorage.getItem("lastOrderId")) || 1;

  const newOrder = {
    id: orderId,
    name: meal.strMeal,
    image: meal.strMealThumb,
    completed: false
  };


  orders.push(newOrder);
  sessionStorage.setItem("orders", JSON.stringify(orders));
  sessionStorage.setItem("lastOrderId", orderId +1);
  displayOrders();
}


/** 
 * diplayOrders filters the incomplete orders and displays them for the user. 
 * Also adds a button to complete the order when the user clicks it. 
 */
function displayOrders() {
  const container = document.getElementById("ordersContainer");
  container.innerHTML = '';  //clear all orders.

  const orders = JSON.parse(sessionStorage.getItem("orders")) || []; 
  const incompleteOrders = orders.filter(order => !order.completed);

if (incompleteOrders.length === 0) {
  container.innerHTML = `<div class="no-orders-message">No incomplete orders</div>`;
  return;
}



  incompleteOrders.forEach(order => {
    const orderDiv = document.createElement("div");
    orderDiv.className = "d-flex align-items-center border rounded p-2 mb-2 bg-white shadow-sm";
    orderDiv.style.cursor = 'pointer';

    orderDiv.innerHTML = `
    <span class="me-3 fw-bold">#${order.id}</span>
    <img src="${order.image}" alt="${order.name}" width="80" height="80" class="me-3 rounded">
    <span class="flex-grow-1">${order.name}</span>
    <button class="btn btn-success btn-sm">Complete</button>
    `
    orderDiv.className = "order-item d-flex align-items-center border rounded p-2 mb-2 bg-white shadow-sm";

    const button = orderDiv.querySelector("button");
    button.addEventListener("click", () => {
      toggleComplete(order.id);
    });

    container.appendChild(orderDiv);
  });

}


/**toggleComplete changes the completed property of the order object to true 
 * This is used when the user clicks the complete button.
*/
function toggleComplete(orderId) {
  let orders = JSON.parse(sessionStorage.getItem(`orders`)) || [];

  const updatedOrders = orders.map(order => {
    if (order.id === orderId) {
      return { ...order, completed: !order.completed};
    }
    return order;
    });
  
  sessionStorage.setItem("orders", JSON.stringify(updatedOrders));
  displayOrders();
  displayCompletedOrders();
}

function showOutputMessage(message, type = 'info') {
  output.textContent = message;

  output.className = "";

  switch (type) {
    case "error":
      output.classList.add("output-error");
      break;
    case "success":
      output.classList.add("output-success");
      break;
    case "info":
    default:
      output.classList.add("output-info");
      break;
}}

/**
 * completeOrderById finds the order inputted by the user in the search bar and 
 * changes the completed property to true. Then redisplays the list of incomplete orders 
 * after updating the sessionStorage. 
 */
function completeOrderById(orderId) {
  let orders = JSON.parse(sessionStorage.getItem("orders")) || [];

  const orderIndex = orders.findIndex(order => order.id === orderId);

  if (orderIndex === -1){
    showOutputMessage(`Cannot find order number: ${orderId}`, "error");
    return;
  }

  if (orders[orderIndex].completed === true){
    showOutputMessage(`Order ${orderId} is already complete.`, "error");
    return;
  }

  orders[orderIndex].completed = true;
  sessionStorage.setItem(`orders`, JSON.stringify(orders));
  showOutputMessage(`Order ${orderId} has been marked as complete.`, "success")

  displayOrders();
}

/**
 * This function displays all the orders that have been marked as complete so far. 
 */
function displayCompletedOrders() {
  const accordionWrapper = document.querySelector(".accordion");
  const completedHeading = document.querySelector("h2.mt-4"); // Target the h2 Completed Orders
  const completedContainer = document.getElementById("completedOrdersContainer");
  completedContainer.innerHTML = '';

  const orders = JSON.parse(sessionStorage.getItem("orders")) || [];
  const completedOrders = orders.filter(order => order.completed);

  if (completedOrders.length === 0) {
    accordionWrapper.style.display = "none";
    completedHeading.style.display = "none";
    return;
  } else {
    accordionWrapper.style.display = "";
    completedHeading.style.display = "";
  }

  completedOrders.forEach(order => {
    const orderDiv = document.createElement("div");
    orderDiv.className = "order-item d-flex align-items-center border rounded p-2 mb-2 bg-success bg-opacity-10";

    orderDiv.innerHTML = `
      <span class="me-3 fw-bold">#${order.id}</span>
      <img src="${order.image}" alt="${order.name}" width="80" height="80" class="me-3 rounded">
      <span class="flex-grow-1">${order.name}</span>
    `;

    completedContainer.appendChild(orderDiv);
  });
}

/**
 * searchMeals gets meals from the API with the users ingredient, 
 * then displays all the meals in a pop up and allows the user to select
 * which meal they wish to add as an incomplete order. 
 */
function searchMeals() {
  const ingredient = formatInput(inputElement.value);
  output.innerHTML = "";
  output.className = "";

  if (ingredient === "") {
    showOutputMessage("Please enter an ingredient first.", "error");
    resetInput();
    return;
  }

  fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`)
    .then(response => response.json())
    .then(data => {
      const meals = data.meals;
      const mealList = document.getElementById("mealList");
      mealList.innerHTML = "";

      if (!meals) {
        showOutputMessage(`No meals found for '${ingredient}'.`, "error");
        return;
      }

      meals.forEach(meal => {
        const card = document.createElement("div");
        card.className = "card mb-3 meal-card";
        card.style.cursor = "pointer";
        card.innerHTML = `
          <div class="row g-0 align-items-center">
            <div class="col-md-4">
              <img src="${meal.strMealThumb}" class="img-fluid rounded-start" alt="${meal.strMeal}">
            </div>
            <div class="col-md-8">
              <div class="card-body">
                <h5 class="card-title">${meal.strMeal}</h5>
              </div>
            </div>
          </div>
        `;
        card.addEventListener("click", () => {
          addOrder(meal);
          const modal = bootstrap.Modal.getInstance(document.getElementById("mealModal"));
          modal.hide();
          showOutputMessage(`Added ${meal.strMeal} to incomplete orders`, "info");
        });

        mealList.appendChild(card);
      });

      const mealModal = new bootstrap.Modal(document.getElementById("mealModal"));
      mealModal.show();
    })
    .catch(error => {
      console.error("Error fetching meals:", error);
      showOutputMessage("Something went wrong. Please try again.", "error");
    });

  resetInput();
}



inputElement.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    search();
  }
})
