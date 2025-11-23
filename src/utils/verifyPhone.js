const twilio = require("twilio");

const accountSid = "YOUR_TWILIO_ACCOUNT_SID";
const authToken = "YOUR_TWILIO_AUTH_TOKEN";
const client = twilio(accountSid, authToken);

// Step 1: Send OTP
async function sendOTP(phoneNumber) {
  const verification = await client.verify.v2.services("YOUR_SERVICE_SID")
    .verifications
    .create({ to: phoneNumber, channel: "sms" });

  console.log("OTP sent:", verification.status);
}

// Step 2: Check OTP
async function verifyOTP(phoneNumber, code) {
  const verificationCheck = await client.verify.v2.services("YOUR_SERVICE_SID")
    .verificationChecks
    .create({ to: phoneNumber, code });

  if (verificationCheck.status === "approved") {
    console.log("Phone number verified ✅");
    return true;
  } else {
    console.log("Invalid code ❌");
    return false;
  }
}

// Example usage
(async () => {
  await sendOTP("+14155552671");       // Send code
  // later, when user inputs the code:
  await verifyOTP("+14155552671", "123456");
})();
