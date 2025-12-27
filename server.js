import app from "../express-ecommerce/app.js";
import connectDB from "../express-ecommerce/config/dbConnect.js";
import http from "http";

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URL);
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log("(----------------------------------------)");
  console.log("|          Server Started at...          |");
  console.log("|          http://localhost:" + PORT + "         |");
  console.log("(----------------------------------------)");
});
