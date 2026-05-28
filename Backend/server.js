require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/config/database");

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

connectToDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
