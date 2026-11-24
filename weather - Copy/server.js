
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

app.use(express.static(path.join(__dirname, "public")));

// ตรวจสอบ API Key
function checkApiKey(res) {
    if (!API_KEY) {
        res.status(500).json({
            error: "ไม่พบ OpenWeather API Key"
        });
        return false;
    }

    return true;
}

// ตรวจสอบภาษา
function getLanguage(lang) {
    return lang === "en" ? "en" : "th";
}

// สร้าง URL สำหรับ OpenWeather
function createWeatherUrl(endpoint, params) {
    const url = new URL(
        `https://api.openweathermap.org/data/2.5/${endpoint}`
    );

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });

    url.searchParams.set("appid", API_KEY);

    return url;
}

// =====================================
// 1. ค้นหาเมือง
// =====================================

app.get("/api/search", async (req, res) => {
    try {
        if (!checkApiKey(res)) return;

        const city = req.query.q;

        if (!city || !city.trim()) {
            return res.status(400).json({
                error: "กรุณาระบุชื่อเมือง"
            });
        }

        const url = new URL(
            "https://api.openweathermap.org/geo/1.0/direct"
        );

        url.searchParams.set("q", city.trim());
        url.searchParams.set("limit", "5");
        url.searchParams.set("appid", API_KEY);

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.error("Search Error:", error);

        res.status(500).json({
            error: "ค้นหาเมืองไม่สำเร็จ"
        });
    }
});

// =====================================
// 2. สภาพอากาศปัจจุบัน
// =====================================

app.get("/api/weather", async (req, res) => {
    try {
        if (!checkApiKey(res)) return;

        const { lat, lon, lang } = req.query;

        if (!validCoordinates(lat, lon)) {
            return res.status(400).json({
                error: "พิกัดไม่ถูกต้อง"
            });
        }

        const url = createWeatherUrl("weather", {
            lat,
            lon,
            units: "metric",
            lang: getLanguage(lang)
        });

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.error("Weather Error:", error);

        res.status(500).json({
            error: "ไม่สามารถดึงข้อมูลสภาพอากาศได้"
        });
    }
});

// =====================================
// 3. พยากรณ์อากาศ 5 วัน
// =====================================

app.get("/api/forecast", async (req, res) => {
    try {
        if (!checkApiKey(res)) return;

        const { lat, lon, lang } = req.query;

        if (!validCoordinates(lat, lon)) {
            return res.status(400).json({
                error: "พิกัดไม่ถูกต้อง"
            });
        }

        const url = createWeatherUrl("forecast", {
            lat,
            lon,
            units: "metric",
            lang: getLanguage(lang)
        });

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.error("Forecast Error:", error);

        res.status(500).json({
            error: "ไม่สามารถดึงข้อมูลพยากรณ์ได้"
        });
    }
});

// =====================================
// ตรวจสอบพิกัด
// =====================================

function validCoordinates(lat, lon) {
    if (lat === undefined || lon === undefined) {
        return false;
    }

    const latitude = Number(lat);
    const longitude = Number(lon);

    return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
}

// =====================================
// เปิด Server
// =====================================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
