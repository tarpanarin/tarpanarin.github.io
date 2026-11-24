
// =====================================
// 1. เลือก HTML Elements
// =====================================

const languageSelect = document.getElementById("language-select");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");

const searchResults = document.getElementById("search-results");
const searchMessage = document.getElementById("search-message");

const cityName = document.getElementById("city-name");
const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feels-like");
const weatherDescription = document.getElementById("weather-description");
const weatherIcon = document.querySelector(".weather-icon");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const pressure = document.getElementById("pressure");
const uvIndex = document.getElementById("uv-index");

const hourlyContainer = document.getElementById("hourly-container");
const weeklyContainer = document.getElementById("weekly-container");


// =====================================
// 2. ตัวแปรหลัก
// =====================================

let currentLanguage = "th";
let selectedCity = null;


// =====================================
// 3. คำแปลภาษา
// =====================================

const translations = {

    th: {
        search: "ค้นหา",
        placeholder: "ค้นหาจังหวัดหรือเมือง...",
        location: "ตำแหน่งที่เลือก",
        today: "สภาพอากาศปัจจุบัน",
        feels: "รู้สึกเหมือน",
        details: "รายละเอียดสภาพอากาศ",
        humidity: "ความชื้น",
        initialCity: "กรุณาค้นหาเมือง",
        initialWeather: "รอข้อมูลสภาพอากาศ",
        wind: "ความเร็วลม",
        pressure: "ความกดอากาศ",
        uv: "ดัชนี UV",
        hourly: "พยากรณ์ล่วงหน้า",
        weekly: "พยากรณ์ 5 วัน",
        powered: "ขับเคลื่อนด้วย OpenWeather API",
        searchFirst: "กรุณาค้นหาเมืองก่อน",
        selectCity: "เลือกเมืองที่ต้องการ",
        enterCity: "กรุณาพิมพ์ชื่อเมืองที่ต้องการค้นหา",
        notFound: "ไม่พบเมืองที่ค้นหา กรุณาตรวจสอบชื่อเมืองอีกครั้ง",
        error: "เกิดข้อผิดพลาด กรุณาลองใหม่",
        apiKeyError: "API Key ไม่ถูกต้องหรือยังไม่เปิดใช้งาน",
        loading: "กำลังโหลดข้อมูล...",
        loadingWeather: "กำลังโหลดสภาพอากาศ...",
        forecastError: "ไม่สามารถโหลดข้อมูลพยากรณ์ได้",
        days: [
            "อาทิตย์",
            "จันทร์",
            "อังคาร",
            "พุธ",
            "พฤหัสบดี",
            "ศุกร์",
            "เสาร์"
        ]
    },

    en: {
        search: "Search",
        placeholder: "Search for a city...",
        location: "Selected Location",
        today: "Current Weather",
        feels: "Feels like",
        details: "Weather Details",
        humidity: "Humidity",
        wind: "Wind Speed",
        initialCity: "Please search for a city",
        initialWeather: "Waiting for weather data",
        pressure: "Pressure",
        uv: "UV Index",
        hourly: "Upcoming Forecast",
        weekly: "5-Day Forecast",
        powered: "Powered by OpenWeather API",
        searchFirst: "Please search for a city first.",
        selectCity: "Select a city",
        enterCity: "Please enter a city name.",
        notFound: "City not found. Please check the city name.",
        error: "An error occurred. Please try again.",
        apiKeyError: "Invalid API Key or the API is not activated yet.",
        loading: "Loading...",
        loadingWeather: "Loading weather...",
        forecastError: "Unable to load forecast data.",
        days: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ]
    }

};


// =====================================
// 4. เปลี่ยนภาษาเว็บไซต์
// =====================================

function changeLanguage(lang) {

    currentLanguage = lang === "en" ? "en" : "th";

    document.documentElement.lang = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach(element => {

        const key = element.dataset.i18n;

        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }

    });

    searchBtn.textContent = translations[currentLanguage].search;

    cityInput.placeholder = translations[currentLanguage].placeholder;

    searchResults.replaceChildren();
    searchMessage.textContent = "";

    if (selectedCity) {

        displayCity(selectedCity);

        loadWeather(selectedCity.lat, selectedCity.lon);

    }

}


// =====================================
// 5. แปลงชื่อประเทศตามภาษา
// =====================================

function getCountryName(countryCode) {

    const regionNames = new Intl.DisplayNames(
        [currentLanguage],
        { type: "region" }
    );

    return regionNames.of(countryCode) || countryCode;

}


// =====================================
// 6. เลือกชื่อเมืองตามภาษา
// =====================================

function getCityName(city) {

    const localNames = city.local_names || {};

    return localNames[currentLanguage] || city.name;

}


// =====================================
// 7. แสดงชื่อเมือง
// =====================================

function displayCity(city) {

    const name = getCityName(city);
    const country = getCountryName(city.country);

    cityName.textContent = `${name}, ${country}`;

}


// =====================================
// 8. จัดการ Error จาก Backend
// =====================================

function showApiError(error) {

    console.error(error);

    if (error.message === "401") {
        searchMessage.textContent =
            translations[currentLanguage].apiKeyError;
    } else {
        searchMessage.textContent =
            translations[currentLanguage].error;
    }

}


// =====================================
// 9. ค้นหาเมือง
// =====================================

async function searchCity() {

    const query = cityInput.value.trim();

    searchMessage.textContent = "";
    searchResults.replaceChildren();

    if (!query) {

        searchMessage.textContent =
            translations[currentLanguage].enterCity;

        return;

    }

    searchBtn.disabled = true;

    searchMessage.textContent =
        translations[currentLanguage].loading;

    try {

        // เรียก Backend แทน OpenWeather โดยตรง
        const response = await fetch(
            `/api/search?q=${encodeURIComponent(query)}`
        );

        const data = await response.json();

        if (!response.ok) {

            if (response.status === 401) {
                throw new Error("401");
            }

            throw new Error(data.message || "Search failed");

        }

        if (!Array.isArray(data) || data.length === 0) {

            searchMessage.textContent =
                translations[currentLanguage].notFound;

            return;

        }

        searchMessage.textContent = "";

        displaySearchResults(data);

    } catch (error) {

        showApiError(error);

    } finally {

        searchBtn.disabled = false;

    }

}


// =====================================
// 10. แสดงรายการเมืองที่ค้นหาได้
// =====================================

function displaySearchResults(cities) {

    searchResults.replaceChildren();

    const heading = document.createElement("p");

    heading.textContent =
        translations[currentLanguage].selectCity;

    searchResults.appendChild(heading);

    cities.forEach(city => {

        const button = document.createElement("button");

        const name = getCityName(city);
        const country = getCountryName(city.country);

        button.type = "button";
        button.className = "city-result";
        button.textContent = `${name}, ${country}`;

        button.addEventListener("click", async () => {

            selectedCity = city;

            displayCity(city);

            searchResults.replaceChildren();

            searchMessage.textContent = "";

            await loadWeather(city.lat, city.lon);

        });

        searchResults.appendChild(button);

    });

}


// =====================================
// 11. ดึงข้อมูลสภาพอากาศทั้งหมด
// =====================================

async function loadWeather(lat, lon) {

    weatherDescription.textContent =
        translations[currentLanguage].loadingWeather;

    temperature.textContent = "--°C";
    feelsLike.textContent = "--°C";
    humidity.textContent = "--%";
    windSpeed.textContent = "-- km/h";
    pressure.textContent = "-- hPa";
    uvIndex.textContent = "--";

    weatherIcon.textContent = "🌤️";

    hourlyContainer.replaceChildren();
    weeklyContainer.replaceChildren();

    try {

        const params = new URLSearchParams({
            lat,
            lon,
            lang: currentLanguage
        });

        // เรียก Backend ทั้งสองเส้นทาง
        const [currentResponse, forecastResponse] = await Promise.all([

            fetch(`/api/weather?${params}`),

            fetch(`/api/forecast?${params}`)

        ]);

        const currentData = await currentResponse.json();

        if (!currentResponse.ok) {

            if (currentResponse.status === 401) {
                throw new Error("401");
            }

            throw new Error(currentData.message || "Weather failed");

        }

        displayCurrentWeather(currentData);

        if (forecastResponse.ok) {

            const forecastData = await forecastResponse.json();

            displayHourlyForecast(forecastData);
            displayWeeklyForecast(forecastData);

        } else {

            console.error(
                "Forecast API Error:",
                forecastResponse.status
            );

            showForecastError();

        }

    } catch (error) {

        showApiError(error);

        weatherDescription.textContent = "--";

    }

}


// =====================================
// 12. แสดงสภาพอากาศปัจจุบัน
// =====================================

function displayCurrentWeather(data) {

    temperature.textContent =
        `${Math.round(data.main.temp)}°C`;

    feelsLike.textContent =
        `${Math.round(data.main.feels_like)}°C`;

    humidity.textContent =
        `${data.main.humidity}%`;

    windSpeed.textContent =
        `${(data.wind.speed * 3.6).toFixed(1)} km/h`;

    pressure.textContent =
        `${data.main.pressure} hPa`;

    weatherDescription.textContent =
        data.weather[0].description;

    weatherIcon.textContent =
        getWeatherIcon(data.weather[0].icon);

    // Current Weather API ไม่มีข้อมูล UV
    uvIndex.textContent = "--";

}


// =====================================
// 13. แปลงรหัสสภาพอากาศเป็น Emoji
// =====================================

function getWeatherIcon(iconCode) {

    const iconMap = {

        "01d": "☀️",
        "01n": "🌙",

        "02d": "🌤️",
        "02n": "☁️",

        "03d": "⛅",
        "03n": "☁️",

        "04d": "☁️",
        "04n": "☁️",

        "09d": "🌧️",
        "09n": "🌧️",

        "10d": "🌦️",
        "10n": "🌧️",

        "11d": "⛈️",
        "11n": "⛈️",

        "13d": "❄️",
        "13n": "❄️",

        "50d": "🌫️",
        "50n": "🌫️"

    };

    return iconMap[iconCode] || "🌤️";

}


// =====================================
// 14. แสดงพยากรณ์รายชั่วโมง
// =====================================

function displayHourlyForecast(data) {

    hourlyContainer.replaceChildren();

    const forecasts = data.list.slice(0, 6);

    forecasts.forEach((forecast, index) => {

        const item = document.createElement("div");

        item.className = "hourly-item";

        const time = new Date(forecast.dt * 1000);

        const timeText = time.toLocaleTimeString(
            currentLanguage === "th" ? "th-TH" : "en-US",
            {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC"
            }
        );

        const timeLabel = index === 0
            ? (currentLanguage === "th" ? "ช่วงถัดไป" : "Next")
            : timeText;

        const timeElement = document.createElement("p");
        timeElement.textContent = timeLabel;

        const iconElement = document.createElement("span");
        iconElement.textContent =
            getWeatherIcon(forecast.weather[0].icon);

        const tempElement = document.createElement("h3");
        tempElement.textContent =
            `${Math.round(forecast.main.temp)}°C`;

        item.appendChild(timeElement);
        item.appendChild(iconElement);
        item.appendChild(tempElement);

        hourlyContainer.appendChild(item);

    });

}


// =====================================
// 15. แสดงพยากรณ์ 5 วัน
// =====================================

function displayWeeklyForecast(data) {

    weeklyContainer.replaceChildren();

    const dailyForecasts = {};

    data.list.forEach(forecast => {

        // ปรับเวลาเป็นเวลาท้องถิ่นของเมือง
        const localTime = new Date(
            (forecast.dt + data.city.timezone) * 1000
        );

        const dateKey = localTime.toISOString().slice(0, 10);

        if (!dailyForecasts[dateKey]) {

            dailyForecasts[dateKey] = {
                temps: [],
                weather: forecast.weather[0],
                timeDistance: Infinity
            };

        }

        dailyForecasts[dateKey].temps.push(
            forecast.main.temp
        );

        const hour = localTime.getUTCHours();

        const distance = Math.abs(hour - 12);

        if (distance < dailyForecasts[dateKey].timeDistance) {

            dailyForecasts[dateKey].timeDistance = distance;

            dailyForecasts[dateKey].weather =
                forecast.weather[0];

        }

    });

    const days = Object.entries(dailyForecasts).slice(0, 5);

    days.forEach(([dateKey, dayData]) => {

        const date = new Date(`${dateKey}T12:00:00Z`);

        const dayName = translations[currentLanguage].days[
            date.getUTCDay()
        ];

        const maxTemp = Math.round(
            Math.max(...dayData.temps)
        );

        const minTemp = Math.round(
            Math.min(...dayData.temps)
        );

        const item = document.createElement("div");

        item.className = "weekly-item";

        const dayElement = document.createElement("p");
        dayElement.textContent = dayName;

        const iconElement = document.createElement("span");
        iconElement.textContent =
            getWeatherIcon(dayData.weather.icon);

        const tempElement = document.createElement("h3");
        tempElement.textContent =
            `${maxTemp}°C / ${minTemp}°C`;

        item.appendChild(dayElement);
        item.appendChild(iconElement);
        item.appendChild(tempElement);

        weeklyContainer.appendChild(item);

    });

}


// =====================================
// 16. แจ้งเตือนเมื่อโหลดพยากรณ์ไม่ได้
// =====================================

function showForecastError() {

    hourlyContainer.replaceChildren();
    weeklyContainer.replaceChildren();

    const message =
        translations[currentLanguage].forecastError;

    const hourlyMessage = document.createElement("p");
    hourlyMessage.className = "empty-message";
    hourlyMessage.textContent = message;

    const weeklyMessage = document.createElement("p");
    weeklyMessage.className = "empty-message";
    weeklyMessage.textContent = message;

    hourlyContainer.appendChild(hourlyMessage);
    weeklyContainer.appendChild(weeklyMessage);

}


// =====================================
// 17. กำหนด Event ต่าง ๆ
// =====================================

searchBtn.addEventListener("click", searchCity);

cityInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        searchCity();
    }

});

languageSelect.addEventListener("change", function () {

    changeLanguage(this.value);

});


// =====================================
// 18. เริ่มต้นเว็บไซต์
// =====================================

languageSelect.value = "th";

changeLanguage("th");

