const fs = require("fs");
const path = require("path");


// ==================================================
// CONFIG
// ==================================================

const DATA_DIR = "data";
const OUTPUT_JSON = "companies-all.json";
const OUTPUT_CSV = "companies-all.csv";



// ==================================================
// CSV escape helper
// ==================================================

function escapeCSV(value) {

    const text = String(value ?? "");

    if  ( 
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {
        return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
}



// ==================================================
// Main
// ==================================================

function main() {

    if (!fs.existsSync(DATA_DIR)) {
        console.log(`No "${DATA_DIR}" folder found. Nothing to combine.`);
        return;
    }


    // --------------------------------------------------
    // Find every .json file inside data/
    // --------------------------------------------------
    const files = fs
        .readdirSync(DATA_DIR)
        .filter(f => f.endsWith(".json"));

    console.log("Files found in data/:", files);


    if (files.length === 0) {
        console.log("No JSON files to combine yet.");
        return;
    }


    // --------------------------------------------------
    // Read and merge every file
    // --------------------------------------------------
    let allCompanies = [];

    for (const file of files) {

        const filePath = path.join(DATA_DIR, file);
        const content = fs.readFileSync(filePath, "utf8");
        const companies = JSON.parse(content);

        console.log(`${file} -> ${companies.length} companies`);

        allCompanies.push(...companies);
    }

    console.log("\nTotal raw records:", allCompanies.length);


    // --------------------------------------------------
    // Remove duplicates (same company can appear twice
    // if you accidentally scraped the same page twice)
    // --------------------------------------------------
    const uniqueMap = new Map();

    for (const company of allCompanies) {

        const key = (company.url || "").toLowerCase();

        if (key) {
            uniqueMap.set(key, company);
        }
    }

    const uniqueCompanies = Array.from(uniqueMap.values());

    console.log("Unique records:", uniqueCompanies.length);


    // --------------------------------------------------
    // Save combined JSON
    // --------------------------------------------------
    fs.writeFileSync(
        OUTPUT_JSON,
        JSON.stringify(uniqueCompanies, null, 2),
        "utf8"
    );

    console.log("\nSaved JSON:", OUTPUT_JSON);


    // --------------------------------------------------
    // Save combined CSV
    // --------------------------------------------------
    const headers = ["companyName", "size", "location", "url"];

    const rows = [headers.join(",")];

    for (const company of uniqueCompanies) {

        const row = headers.map(h => escapeCSV(company[h]));
        rows.push(row.join(","));
    }

    fs.writeFileSync(
        OUTPUT_CSV,
        rows.join("\n"),
        "utf8"
    );

    console.log("Saved CSV:", OUTPUT_CSV);
}


main();
