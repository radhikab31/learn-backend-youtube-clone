import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  //adds middleware to the application's request-processing pipeline
  cors({
    origin: process.env.CORS_ORIGIN,
  })
); //to fix the cors error --> where backend needed the frontend url to be known so that response is send to correct client. Security purpose

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    limit: "16kb",
    extended: true,
  })
);

app.use(express.static("public"));
app.use(cookieParser());

//router import
import userRouter from "./routes/user.routes.js"

app.use("/api/v1/users", userRouter)

export { app };
