const dayjs = require("dayjs");
const { generateJazzCashHash } = require("../../utils/jazzcash/jazzcashHash");

function initiateJazzCashPayment(amount, orderId) {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID;
  const password = process.env.JAZZCASH_PASSWORD;
  const salt = process.env.JAZZCASH_SALT;
  const returnUrl = process.env.JAZZCASH_RETURN_URL;
  const ipnUrl = process.env.JAZZCASH_IPN_URL;

  // Unique transaction reference per request
  const dateTime = dayjs().format("YYYYMMDDHHmmss");
  const txnRefNo = `${merchantId}${dateTime}`;
  const txnAmount = amount * 100; // amount in paisa

  const data = {
    pp_Version: "1.1",
    pp_TxnType: "", // leave empty for sandbox
    pp_Language: "EN",
    pp_MerchantID: merchantId,
    pp_Password: password,
    pp_TxnRefNo: txnRefNo,
    pp_Amount: txnAmount,
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: dateTime,
    pp_BillReference: orderId || "ORDER123",
    pp_Description: "Test Transaction",
    pp_ReturnURL: returnUrl,
    pp_IpnURL: ipnUrl,
  };

  // Generate secure hash
  data.pp_SecureHash = generateJazzCashHash(data, salt);

  // Sandbox redirect URL
  const redirectUrl =
    process.env.JAZZCASH_BASE_URL +
    "/CustomerPortal/transactionmanagement/merchantform";

  return { paymentData: data, redirectUrl };
}

function verifyJazzCashResponse(response) {
  const salt = process.env.JAZZCASH_SALT;
  const { pp_SecureHash, ...rest } = response;
  const recalculatedHash = generateJazzCashHash(rest, salt);

  if (pp_SecureHash !== recalculatedHash) {
    return { verified: false, reason: "Hash mismatch" };
  }

  if (response.pp_ResponseCode === "000") {
    return { verified: true, status: "success" };
  } else {
    return { verified: true, status: "failed" };
  }
}

module.exports = {
  initiateJazzCashPayment,
  verifyJazzCashResponse,
};
