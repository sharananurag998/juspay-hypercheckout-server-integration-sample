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

const baseUrl = "https://api.juspay.in";
const authorization =
  "Basic " + Buffer.from(process.env.JUSPAY_API_KEY + ":").toString("base64");

app.post("/create-juspay-order", async (req, res) => {
  const requestBody = req.body;
  const amount = Number(Number(requestBody.amount).toFixed(2));
  const orderId = "test-" + Math.floor(Math.random() * 900000);

  const requestPayload = JSON.stringify({
    order_id: orderId,
    amount,
    customer_id: "9876543210",
    customer_email: "test@customer.com",
    customer_phone: "9876543210",
    payment_page_client_id: process.env.JUSPAY_CLIENT_ID,
    action: "paymentPage",
    return_url: "https://example.com",
  });

  const result = await fetch(`${baseUrl}/session`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "x-merchantid": process.env.JUSPAY_MERCHANT_ID,
      "Content-Type": "application/json",
    },
    body: requestPayload,
  });

  const resultJson = await result.json();

  if (resultJson.status) {
    pool.query(`
      INSERT INTO order_details(order_id, amount, status) VALUES('${orderId}', '${amount}', '${resultJson.status}');
    `);
  }

  res.json(resultJson);
});

const pendingStatus = ["PENDING_VBV", "AUTHORIZING"];

const checkOrderStatus = async (orderId) => {
  const result = await fetch(`${baseUrl}/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: authorization,
      "x-merchantid": process.env.JUSPAY_MERCHANT_ID,
      version: "2023-06-30",
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const resultJson = await result.json();
  pool.query(
    `UPDATE order_details SET status = '${resultJson.status}' where order_id='${orderId}';`
  );

  return resultJson.status;
};

app.get("/order-status/:orderId", async (req, res) => {
  const orderId = req.params.orderId;
  const orderDetailsResponse = await pool.query(
    `SELECT * from order_details where order_id='${orderId}'`
  );

  if (orderDetailsResponse.rows.length === 0) {
    return res.status(404).send({ status: "NOT_FOUND" });
  }

  const orderDetails = orderDetailsResponse.rows[0];
  res.status(200).json({ status: orderDetails.status });

  if (!orderDetails.polling_triggered) {
    let pollCount = 0;
    const orderStatusPoller = setInterval(
      async (orderId) => {
        const orderStatus = await checkOrderStatus(orderId);
        console.log("Order status polled", orderStatus);
        if (pollCount >= 5 || !pendingStatus.includes(orderStatus)) {
          clearInterval(orderStatusPoller);
        }
        pollCount++;
      },
      15000,
      orderId
    );
    pool.query(
      `UPDATE order_details SET polling_triggered=TRUE where order_id='${orderId}';`
    );
  }
});

app.listen(3000, () => console.log("Running on port 3000"));
