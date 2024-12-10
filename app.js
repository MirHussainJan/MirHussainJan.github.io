$(document).ready(function () {
    const apiKey = 'a07eee30868f005559c98783ec5378b7'; // Your OpenWeather API key
    let unit = 'metric'; // Use 'imperial' for Fahrenheit

    // Initialize Charts
    let pieChart, lineChart;

    // Initial weather fetch for a default city (e.g., Islamabad)
    getWeather('Islamabad');
    getForecast('Islamabad');
    getWeeklyForecast('Islamabad');
    getChartData('Islamabad');

    // Event listener for fetching weather on city input
    $('#get-weather').click(function () {
        const city = $('#city-input').val();
        if (city) {
            getWeather(city);
            getForecast(city);
            getWeeklyForecast(city);
            getChartData(city);
        } else {
            alert('Please enter a city name');
        }
    });

    // Fetch and display current weather
    function getWeather(city) {
        $.ajax({
            url: `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                const weatherIcon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
                $('#city-name').text(data.name);
                $('#weather-icon').attr('src', weatherIcon);
                $('#temperature').text(`${data.main.temp}°`);
                $('#rain-chance').text(`Chance of rain: ${data.clouds.all}%`);
            },
            error: function (xhr) {
                if (xhr.status === 404) {
                    alert('City not found. Please check the name and try again.');
                } else {
                    alert('An error occurred while fetching the weather data.');
                }
            }
        });
    }

    // Fetch and display forecast for specific times
    function getForecast(city) {
        $.ajax({
            url: `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                $('#today-forecast-details').html(''); // Clear previous 3-hourly forecast

                const targetTimes = [6, 9, 12, 15, 18, 21];
                let count = 0;

                for (let i = 0; i < data.list.length; i++) {
                    const forecast = data.list[i];
                    const dateTime = new Date(forecast.dt_txt);
                    const hour = dateTime.getHours();

                    if (targetTimes.includes(hour)) {
                        const time = dateTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            hour12: true
                        });
                        const weatherIcon = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`;
                        const temperature = `${forecast.main.temp}°`;

                        const isLast = count === 5;
                        const borderClass = isLast ? '' : 'border-end';

                        const hourlyWeatherHTML = `
                            <div class="3hr-weather col-lg-2 col-md-3 col-sm-4 d-flex flex-column align-items-center ${borderClass} px-2">
                                <p class="text-secondary fw-bold mb-1">${time}</p>
                                <img src="${weatherIcon}" width="60" alt="Weather icon">
                                <h4 class="fw-bold mt-2">${temperature}</h4>
                            </div>
                        `;

                        $('#today-forecast-details').append(hourlyWeatherHTML);
                        count++;

                        if (count === 6) break;
                    }
                }
            },
            error: function () {
                alert('Error fetching forecast data. Please try again.');
            }
        });
    }

    // Fetch weekly forecast
    function getWeeklyForecast(city) {
        $.ajax({
            url: `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                $('#weekly-forecast').html(''); // Clear previous weekly forecast
                const dailyForecasts = {};

                data.list.forEach(function (forecast) {
                    const date = new Date(forecast.dt * 1000);
                    const day = date.toLocaleDateString();

                    if (!dailyForecasts[day]) {
                        dailyForecasts[day] = forecast;
                    }
                });

                const dailyForecastArray = Object.values(dailyForecasts);
                dailyForecastArray.slice(0, 7).forEach((forecast, index) => {
                    const date = new Date(forecast.dt * 1000);
                    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' });
                    const weatherIcon = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`;
                    const tempHigh = Math.round(forecast.main.temp_max);
                    const tempLow = Math.round(forecast.main.temp_min);
                    const description = forecast.weather[0].description;

                    const borderClass = index === 6 ? '' : 'border-bottom';

                    const dailyForecastHTML = `
                        <div class="perday-weather d-flex align-items-center justify-content-between px-4 ${borderClass} py-3">
                            <p class="text-secondary fw-bold fs-6 m-0">${dayOfWeek}</p>
                            <div class="mid d-flex align-items-center gap-2">
                                <img src="${weatherIcon}" width="35" alt="${description}">
                                <p class="m-0 fs-7 fw-bold">${description.charAt(0).toUpperCase() + description.slice(1)}</p>
                            </div>
                            <p class="fw-bold text-secondary m-0"><span class="text-white">${tempHigh}°</span> / ${tempLow}°</p>
                        </div>
                    `;

                    $('#weekly-forecast').append(dailyForecastHTML);
                });
            },
            error: function () {
                alert('Error fetching weekly forecast data. Please try again.');
            }
        });
    }

    // Fetch and display chart data
    function getChartData(city) {
        $.ajax({
            url: `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                const weatherCounts = {};
                const temps = [];
                const labels = [];

                data.list.forEach((forecast) => {
                    const weatherType = forecast.weather[0].main;
                    weatherCounts[weatherType] = (weatherCounts[weatherType] || 0) + 1;

                    const date = new Date(forecast.dt_txt);
                    labels.push(date.toLocaleDateString());
                    temps.push(forecast.main.temp);
                });

                renderPieChart(weatherCounts);
                renderLineChart(labels.slice(0, 10), temps.slice(0, 10));
            }
        });
    }

    function renderPieChart(weatherCounts) {
        const ctx = $('#pieChart')[0].getContext('2d');
        if (pieChart) pieChart.destroy();
        pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(weatherCounts),
                datasets: [{
                    data: Object.values(weatherCounts),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }]
            }
        });
    }

    function renderLineChart(labels, temps) {
        const ctx = $('#lineChart')[0].getContext('2d');
        if (lineChart) lineChart.destroy();
        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temps,
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)'
                }]
            }
        });
    }
});