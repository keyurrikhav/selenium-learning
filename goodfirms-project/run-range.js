const { execSync } = require("child_process");

const start = parseInt(process.argv[2] || "21", 10);
const end = parseInt(process.argv[3] || "50", 10);

console.log(`Starting sequential run: scraper-${start}.js to scraper-${end}.js...\n`);

for (let i = start; i <= end; i++) {
    const filename = `scraper-${i}.js`;
    console.log(`========================================`);
    console.log(`Running ${filename} [${i}/${end}]`);
    console.log(`========================================`);
    try {
        execSync(`node ${filename}`, { stdio: "inherit" });
        console.log(`Finished ${filename} successfully.\n`);
    } catch (err) {
        console.error(`Failed running ${filename}:`, err.message);
    }
}

console.log("All scrapers finished execution!");
