const hre = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {
    const deployer = (await hre.ethers.getSigners())[0];
    const contractDir = path.join(__dirname, "..", "frontend", "src", "artifacts", "contracts");
    const addressPath = path.join(contractDir, "contract-address.json");

    if (!fs.existsSync(addressPath)) {
        console.error("Contract not deployed");
        return;
    }

    const { Voting: contractAddress } = JSON.parse(fs.readFileSync(addressPath));
    console.log("Contract:", contractAddress);

    const Voting = await hre.ethers.getContractAt("Voting", contractAddress);
    const count = await Voting.getElectionCount();
    console.log("Count:", count.toString());

    if (count > 0) {
        for (let i = 1; i <= count; i++) {
            const voters = await Voting.getVoters(i);
            console.log(`Election ${i} voters:`, voters);
            for (const v of voters) {
                console.log(`Removing voter ${v} from election ${i}...`);
                const tx = await Voting.removeVoter(i, v);
                await tx.wait();
                console.log("Removed.");
            }
        }
    } else {
        console.log("No elections found.");
    }
}

main().catch(console.error);
