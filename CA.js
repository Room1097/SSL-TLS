const express = require("express");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Initialize express app
const app = express();
const port = 3000;

// Paths to the CA key and certificate
const CA_KEY_PATH = "./cafiles/ca.key";
const CA_CERT_PATH = "./cafiles/ca.crt";
const CA_PASS = "mysecurepassword";

// Create the CA private key and certificate if they don't exist
function generateCA() {
  // Generate CA private key (encrypted)
  if (!fs.existsSync(CA_KEY_PATH)) {
    execSync(
      `openssl genpkey -algorithm RSA -out ${CA_KEY_PATH} -aes256 -pass pass:${CA_PASS}`
    );
    console.log("CA private key generated.");
  }

  // Generate the CA self-signed certificate
  if (!fs.existsSync(CA_CERT_PATH)) {
    execSync(
      `openssl req -key ${CA_KEY_PATH} -new -x509 -out ${CA_CERT_PATH} -days 3650 -passin pass:${CA_PASS} -subj "/C=US/ST=State/L=City/O=MyOrg/OU=MyUnit/CN=MyCA"`
    );
    console.log("CA certificate generated.");
  }
}

// Generate the CA if it doesn't exist
generateCA();

// Route to sign a CSR and return the signed certificate
app.post("/sign-csr", express.json(), (req, res) => {
  const { csr } = req.body;

  if (!csr) {
    return res.status(400).send("CSR is required.");
  }

  // Write the CSR to a file
  fs.writeFileSync("./server.csr", csr);

  try {
    // Sign the CSR with the CA key and certificate
    execSync(
      `openssl x509 -req -in server.csr -CA ${CA_CERT_PATH} -CAkey ${CA_KEY_PATH} -CAcreateserial -out server.crt -days 365 -passin pass:${CA_PASS}`
    );
    console.log("Certificate signed by CA.");

    // Read the signed certificate and send it back
    const signedCert = fs.readFileSync("./server.crt");
    res.type("txt").send(signedCert);
  } catch (error) {
    console.error("Error signing CSR:", error);
    res.status(500).send("Error signing CSR.");
  }
});

// Route to serve the CA certificate to clients
app.get("/ca.crt", (req, res) => {
  const caCert = fs.readFileSync(CA_CERT_PATH);
  res.type("crt").send(caCert);
});

// Start the CA server
app.listen(port, () => {
  console.log(`CA server is running at http://localhost:${port}`);
});
