const { MongoClient } = require("mongodb");

let db = null;

async function connectMongo() {
  if (db) return db;

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  db = client.db("test"); // your db name
  return db;
}

module.exports = connectMongo;
