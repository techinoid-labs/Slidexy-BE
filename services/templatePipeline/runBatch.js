const { runBatch } = require("./pipeline");

const count = Number(process.argv[2]) || 20;
runBatch(count).then((result) => {
console.log("Saved " + result.saved.length);
result.saved.forEach((deck) => console.log("  " + deck.id + "  " + deck.name));
console.log("Rejected " + result.rejected);
console.log(JSON.stringify(result.reasons));
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
