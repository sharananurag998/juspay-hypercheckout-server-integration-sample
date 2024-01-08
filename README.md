# Juspay Hypercheckout Server Integration Sample Code

This is a sample Hypercheckout server integration which was used to explain the backend integration in [Hypercheckout Android Integration Masterclass Video](https://www.youtube.com/watch?v=4zpRYsQNclQ&t=635)

**This is NOT production ready code**, please use this code as reference to integrate Hypercheckout S2S APIs into your own backend server.

## Setup Instructions

1. Create a Local PostgreSQL DB ([Guide](https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database))
2. Create a `order_details` table using the following SQL command: -
   ```
   CREATE TABLE order_details (
    order_id character varying,
    amount character varying,
    status character varying,
    polling_triggered boolean DEFAULT false
   );
   ```
3. Duplicate `.env.sample` file and rename it to `.env`. Inside this file, add your Database and Juspay credentials.
4. In the root directory of the project, run `npm install` to install the required dependencies
5. Run `npm start` command to start the server
