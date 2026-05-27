process.on('uncaughtException', (err) => {
    console.error("🔥 FATAL ERROR ON STARTUP:", err);
});

require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/config/database");

console.log("Attempting to connect to database...");
connectToDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server is successfully running on port ${PORT}`);
});