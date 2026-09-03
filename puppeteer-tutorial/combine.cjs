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

    if (
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
    // Find every page-*.json file inside data/
    // (sorted by page number, not alphabetically —
    // page-2 should come before page-10)
    // --------------------------------------------------

    const files = fs
        .readdirSync(DATA_DIR)
        .filter(f => /^page-\d+\.json$/.test(f))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0], 10);
            const numB = parseInt(b.match(/\d+/)[0], 10);
            return numA - numB;
        });

    console.log(`Found ${files.length} page files in ${DATA_DIR}/`);


    if (files.length === 0) {
        console.log("No page files to combine yet.");
        return;
    }


    // --------------------------------------------------
    // Read and merge every file
    // --------------------------------------------------

    let allCompanies = [];
    let brokenFiles = [];

    for (const file of files) {

        const filePath = path.join(DATA_DIR, file);

        try {

            const content = fs.readFileSync(filePath, "utf8");
            const companies = JSON.parse(content);

            allCompanies.push(...companies);

        } catch (error) {

            console.log(`Could not read ${file}: ${error.message}`);
            brokenFiles.push(file);
        }
    }

    console.log("\nTotal raw records:", allCompanies.length);

    if (brokenFiles.length > 0) {
        console.log("Broken/unreadable files skipped:", brokenFiles);
    }


    // --------------------------------------------------
    // Remove duplicates (same company can appear twice
    // if a page was scraped more than once)
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
    // Check for missing page numbers (gaps in the
    // sequence — pages that never got scraped)
    // --------------------------------------------------

    const pageNumbers = files.map(f => parseInt(f.match(/\d+/)[0], 10));
    const minPage = Math.min(...pageNumbers);
    const maxPage = Math.max(...pageNumbers);

    const missingPages = [];

    for (let i = minPage; i <= maxPage; i++) {
        if (!pageNumbers.includes(i)) {
            missingPages.push(i);
        }
    }

    if (missingPages.length > 0) {
        console.log(
            `\nHeads up — missing pages between ${minPage} and ${maxPage}:`,
            missingPages
        );
    } else {
        console.log(`\nNo gaps — every page from ${minPage} to ${maxPage} is present.`);
    }


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

    fs.writeFileSync (
        OUTPUT_CSV,
        rows.join("\n"),
        "utf8"
    ) ;

    console.log("Saved CSV:", OUTPUT_CSV);

    
}


main();
