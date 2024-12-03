require("dotenv").config(); // Load environment variables
const https = require("https");
const fs = require("fs");
const axios = require("axios");

// Load environment variables
const CA_SERVER_URL =
  `http://${process.env.CA_HOSTNAME}:${process.env.PORT_CA}` ||
  "http://localhost:3000";
const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || "localhost";
const SERVER_PORT = process.env.SERVER_PORT || 4433;

// Path to the CA certificate
const CA_CERT_PATH = "./clientfiles/ca.crt";

// Download the CA certificate if not already present
async function downloadCACertificate() {
  if (!fs.existsSync(CA_CERT_PATH)) {
    try {
      console.log("Downloading CA certificate...");
      const response = await axios.get(`${CA_SERVER_URL}/ca.crt`, {
        responseType: "arraybuffer",
      });
      fs.writeFileSync(CA_CERT_PATH, response.data);
      console.log("CA certificate downloaded successfully.");
    } catch (error) {
      console.error("Failed to download CA certificate:", error.message);
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
    hostname: SERVER_HOSTNAME,
    port: SERVER_PORT,
    path: "/",
    method: "GET",
    ca: caCert, // Trust the CA certificate
    rejectUnauthorized: true, // Reject unauthorized certificates
  };

  console.log(`Connecting to https://${SERVER_HOSTNAME}:${SERVER_PORT}...`);

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
