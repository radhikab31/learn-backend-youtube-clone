import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("Sever is listening at port", process.env.PORT);
      app.on("error", () => {
        console.log("Server has not started properly");
      });
    });
  })
  .catch((err) => {
    console.error("DB not connected", err);
  });
