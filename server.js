import express from "express";
import fetch from "node-fetch";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: false,
});

const app = express();

app.use(express.json());



app.listen(3000, () => console.log("Running on port 3000"));
