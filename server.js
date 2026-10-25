import app from "./app.js";
import { PORT } from "./config/env.js";
import connectDatabase from "./database/mongodb.js";

const port = Number(PORT) || 3000;

const startServer = async () => {
  const isDatabaseConnected = await connectDatabase();

  if (!isDatabaseConnected) {
    console.warn(
      "Starting the server without a database connection. Database-backed routes will not work until MongoDB is reachable.",
    );
  }

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();
