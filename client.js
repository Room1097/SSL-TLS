const https = require("https");
const fs = require("fs");
const axios = require("axios");

// Path to the CA certificate
const CA_CERT_PATH = "./ca.crt";

// Download the CA certificate if not already present
async function downloadCACertificate() {
  if (!fs.existsSync(CA_CERT_PATH)) {
    try {
      const response = await axios.get("http://localhost:3000/ca.crt", {
        responseType: "arraybuffer",
      });
      fs.writeFileSync(CA_CERT_PATH, response.data);
      console.log("CA certificate downloaded.");
    } catch (error) {
      console.error("Failed to download CA certificate:", error);
      process.exit(1);
    }
  } else {
    console.log("CA certificate already exists.");
  }
}

// Make a secure HTTPS request to the server
async function makeSecureRequest() {
  // Ensure the CA certificate is downloaded
  await downloadCACertificate();

  // Create a secure request using the CA certificate to trust the server
  const caCert = fs.readFileSync(CA_CERT_PATH);
  const options = {
    hostname: "localhost",
    port: 4433,
    path: "/",
    method: "GET",
    ca: caCert, // Trust the CA certificate
    rejectUnauthorized: true, // Reject unauthorized certificates
  };

  const req = https.request(options, (res) => {
    console.log(`Server response status: ${res.statusCode}`);
    res.on("data", (data) => {
      console.log(`Server response: ${data.toString()}`);
    });
  });

  req.on("error", (error) => {
    console.error("Error connecting to server:", error.message);
  });

  req.end();
}

// Make the secure request
makeSecureRequest();
