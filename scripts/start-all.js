const { spawn } = require("child_process");

function startService(cmd, args, name) {
  const proc = spawn(cmd, args, { stdio: "inherit", shell: true });
  proc.on("close", code => {
    if (code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });
  return proc;
}

console.log("\n🚀 Starting all local GameDin L3 services...");

console.log("\n1️⃣  Starting local blockchain (Hardhat node)...");
startService("npm", ["run", "start:node"], "Hardhat Node");

console.log("\n2️⃣  Starting Gaming Engine...");
startService("npm", ["run", "start:gaming"], "Gaming Engine");

console.log("\n3️⃣  Starting AI Service...");
startService("npm", ["run", "start:ai"], "AI Service");

console.log("\n4️⃣  To start the frontend, open a new terminal and run:");
console.log("   cd gdi-dapp && npm start\n");

console.log("All core backend services are starting. Monitor logs above for readiness."); 