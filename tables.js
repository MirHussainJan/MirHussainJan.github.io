document.addEventListener("DOMContentLoaded", function () {
    const cityInput = document.getElementById("city-input");
    const getWeatherButton = document.getElementById("get-weather");
    const forecastTableBody = document.querySelector(".forecast-data");
    const chatbotInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-btn");
    const chatbox = document.getElementById("chatbox");

    let forecastData = [];
    let currentPage = 1;
    const entriesPerPage = 10;

    const apiKey = "338270f497082b116cec5dbdd9baf66f"; // Replace with your OpenWeather API key

    // Fetch Weather Data
    async function fetchWeatherData(city) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`
            );
            if (!response.ok) {
                throw new Error("City not found");
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching weather data:", error.message);
            alert("Error fetching weather data. Please check the city name.");
        }
    }

    // Fetch Forecast Data
    async function fetchForecastData(lat, lon) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`
            );
            if (!response.ok) {
                throw new Error("Error fetching forecast data");
            }
            const data = await response.json();
            forecastData = data.list;
            displayForecast(currentPage);
        } catch (error) {
            console.error("Error fetching forecast data:", error.message);
        }
    }

    // Display Forecast Data
    function displayForecast(page) {
        forecastTableBody.innerHTML = "";
        const startIndex = (page - 1) * entriesPerPage;
        const endIndex = startIndex + entriesPerPage;
        const slicedData = forecastData.slice(startIndex, endIndex);

        slicedData.forEach((entry) => {
            const date = new Date(entry.dt_txt).toLocaleString();
            const tempCelsius = (entry.main.temp - 273.15).toFixed(1);
            const weather = entry.weather[0].description;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="p-2">${date}</td>
                <td class="p-2">${tempCelsius} °C</td>
                <td class="p-2">${weather}</td>
            `;
            forecastTableBody.appendChild(row);
        });
    }

    // Button Handlers
    document.querySelector(".btn.bg-secondary:nth-child(1)").addEventListener("click", () => {
        forecastData.sort((a, b) => a.main.temp - b.main.temp);
        displayForecast(currentPage);
    });

    document.querySelector(".btn.bg-secondary:nth-child(2)").addEventListener("click", () => {
        forecastData.sort((a, b) => b.main.temp - a.main.temp);
        displayForecast(currentPage);
    });

    document.querySelector(".btn.bg-secondary:nth-child(3)").addEventListener("click", () => {
        const rainyDays = forecastData.filter((entry) =>
            entry.weather[0].description.toLowerCase().includes("rain")
        );
        displayFilteredForecast(rainyDays);
    });

    document.querySelector(".btn.bg-secondary:nth-child(4)").addEventListener("click", () => {
        const highestTempDay = forecastData.reduce(
            (max, entry) => (entry.main.temp > max.main.temp ? entry : max),
            forecastData[0]
        );
        displayFilteredForecast([highestTempDay]);
    });

    function displayFilteredForecast(filteredData) {
        forecastTableBody.innerHTML = "";
        filteredData.forEach((entry) => {
            const date = new Date(entry.dt_txt).toLocaleString();
            const tempCelsius = (entry.main.temp - 273.15).toFixed(1);
            const weather = entry.weather[0].description;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${date}</td>
                <td>${tempCelsius} °C</td>
                <td>${weather}</td>
            `;
            forecastTableBody.appendChild(row);
        });
    }

    // Chatbot Logic
    sendButton.addEventListener("click", function () {
        const userInput = chatbotInput.value.trim();
        if (userInput === "") return;

        appendChatMessage("You", userInput);
        chatbotInput.value = "";

        if (isWeatherRelated(userInput)) {
            handleWeatherQuery(userInput);
        } else {
            appendChatMessage("Bot", "Sorry, I can only handle weather-related queries.");
        }
    });

    function appendChatMessage(sender, message) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add(`${sender.toLowerCase()}-message`);
        messageDiv.textContent = `${sender}: ${message}`;
        chatbox.appendChild(messageDiv);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    function isWeatherRelated(query) {
        const keywords = ["weather", "rain", "sun", "temperature", "forecast", "cloud"];
        return keywords.some((keyword) => query.toLowerCase().includes(keyword));
    }

    async function handleWeatherQuery(query) {
        appendChatMessage("Bot", "Fetching weather information...");
        const cityMatch = query.match(/in (\w+)/);
        if (!cityMatch) {
            appendChatMessage("Bot", "Please specify a city. For example: 'Weather in London'.");
            return;
        }

        const city = cityMatch[1];
        const data = await fetchWeatherData(city);

        if (data) {
            const tempCelsius = (data.main.temp - 273.15).toFixed(1);
            const weatherDescription = data.weather[0].description;
            appendChatMessage(
                "Bot",
                `The current temperature in ${city} is ${tempCelsius} °C with ${weatherDescription}.`
            );
        } else {
            appendChatMessage("Bot", "Unable to fetch weather data at the moment.");
        }
    }

    // Weather Search
    getWeatherButton.addEventListener("click", async () => {
        const city = cityInput.value.trim();
        if (!city) {
            alert("Please enter a city name.");
            return;
        }

        const data = await fetchWeatherData(city);

        if (data) {
            const { lat, lon } = data.coord;
            await fetchForecastData(lat, lon);
        }
    });
});