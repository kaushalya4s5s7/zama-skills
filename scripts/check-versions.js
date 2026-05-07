const { execSync } = require('child_process');

const REQUIRED = {
  "@zama-fhe/relayer-sdk": "^0.4.2",
  "@fhevm/solidity": "^0.11.1",
  "@fhevm/hardhat-plugin": "^0.4.2",
};

function checkVersion(pkg, pinned) {
  try {
    const latest = execSync(`npm view ${pkg} version`).toString().trim();
    console.log(`Package: ${pkg}`);
    console.log(`  Pinned: ${pinned}`);
    console.log(`  Latest: ${latest}`);
    
    // Simple check: if major/minor changed, alert
    // In a real script, use semver.satisfies
    if (!latest.startsWith(pinned.replace('^', '').split('.').slice(0, 2).join('.'))) {
      console.warn(`  ⚠️ ALERT: Potential version drift detected for ${pkg}`);
    } else {
      console.log(`  ✅ Version is within range.`);
    }
  } catch (e) {
    console.error(`  ❌ Failed to check version for ${pkg}`);
  }
}

console.log("Starting Zama Skills Version Check...\n");
for (const [pkg, pinned] of Object.entries(REQUIRED)) {
  checkVersion(pkg, pinned);
}
