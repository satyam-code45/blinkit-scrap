import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import loginRoutes from "./api/login.js";
import cartRoutes from "./api/cart.js";

dotenv.config();

import "./db/redis.js";
import "./db/mongo.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api", loginRoutes);
app.use("/api", cartRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
