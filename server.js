const https = require("https");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Paths to server's key and certificate
const SERVER_KEY_PATH = "./server.key";
const SERVER_CSR_PATH = "./server.csr";
const SERVER_CERT_PATH = "./server.crt";

// Path to the CA certificate
const CA_CERT_PATH = "./ca.crt";

// CA server URL
const CA_SERVER_URL = "http://localhost:3000";

// Generate server's private key and CSR
function generateServerKeyAndCSR() {
  // Generate server private key (encrypted)
  execSync(
    `openssl genpkey -algorithm RSA -out ${SERVER_KEY_PATH} -aes256 -pass pass:mysecurepassword`
  );

  // Generate server CSR
  execSync(
    `openssl req -new -key ${SERVER_KEY_PATH} -out ${SERVER_CSR_PATH} -passin pass:mysecurepassword -subj "/C=US/ST=State/L=City/O=MyOrg/OU=MyUnit/CN=MyServer"`
  );
  console.log("Server private key and CSR generated.");
}

// Request the CA to sign the server's CSR and obtain the signed certificate
async function signCSR() {
  const csr = fs.readFileSync(SERVER_CSR_PATH, "utf8");

  try {
    const response = await axios.post(`${CA_SERVER_URL}/sign-csr`, { csr });
    fs.writeFileSync(SERVER_CERT_PATH, response.data);
    console.log("Server certificate signed by CA.");
  } catch (error) {
    console.error("Error signing server CSR:", error);
    process.exit(1);
  }
}

// Start HTTPS server once the certificate is signed
async function startServer() {
  // Generate the server's private key and CSR
  generateServerKeyAndCSR();

  // Request the CA to sign the CSR
  await signCSR();

  // Create HTTPS server options with server's key and signed certificate
  const options = {
    key: fs.readFileSync(SERVER_KEY_PATH),
    cert: fs.readFileSync(SERVER_CERT_PATH),
    ca: fs.readFileSync(CA_CERT_PATH), // Include the CA certificate to verify the client
    rejectUnauthorized: true, // Reject unauthorized certificates
  };

  // Create the HTTPS server
  const server = https.createServer(options, (req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello, client! You have connected to the HTTPS server.\n");
  });

  // Start the HTTPS server
  server.listen(4433, () => {
    console.log("HTTPS server running at https://localhost:4433");
  });
}

// Start the server
startServer();
