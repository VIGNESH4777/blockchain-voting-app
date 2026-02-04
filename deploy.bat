@echo off
cd Voting_dApp-main
npx hardhat run scripts/deploy.js --network localhost
pause
