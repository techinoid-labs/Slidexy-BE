const {
  initiateJazzCashPayment,
  verifyJazzCashResponse,
} = require("../../services/jazzcash/jazzcashService");

// Initiate payment endpoint
async function initiatePayment(req, res) {
  try {
    const { amount, orderId } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const { paymentData, redirectUrl } = initiateJazzCashPayment(
      amount,
      orderId
    );
    return res.json({ redirectUrl, paymentData });
  } catch (err) {
    console.error("JazzCash initiate error:", err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
}

// Handle Return URL
async function handleResponse(req, res) {
  try {
    const response = req.body;
    const result = verifyJazzCashResponse(response);

    if (result.status === "success") {
      console.log("✅ Payment successful:", response.pp_TxnRefNo);
      // TODO: update order/payment in DB
      return res.send("Payment Successful!");
    } else {
      console.log("❌ Payment failed:", response);
      return res.send("Payment Failed or Cancelled.");
    }
  } catch (err) {
    console.error("JazzCash response error:", err);
    res.status(500).send("Error processing payment response.");
  }
}

// Handle IPN
async function handleIPN(req, res) {
  try {
    const response = req.body;
    const result = verifyJazzCashResponse(response);

    if (result.status === "success") {
      console.log("📩 IPN Payment successful:", response.pp_TxnRefNo);
      // TODO: update order/payment in DB
    } else {
      console.log("📩 IPN Payment failed:", response);
    }

    // Must return 200 OK to acknowledge IPN
    res.status(200).send("OK");
  } catch (err) {
    console.error("IPN error:", err);
    res.status(500).send("Error processing IPN");
  }
}

module.exports = {
  initiatePayment,
  handleResponse,
  handleIPN,
};
