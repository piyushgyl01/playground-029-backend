const mongoose = require("mongoose");

require("dotenv").config();

const MONGOURI = process.env.MONGODB;

const initialiseDatabase = async () => {
  mongoose
    .connect(MONGOURI)
    .then(() => {
      console.log("Connected to the database");
    })
    .catch((e) =>
      console.log("Error occurred while connecting to the database", e)
    );
};

module.exports = { initialiseDatabase };
