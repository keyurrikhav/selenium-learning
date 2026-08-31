const fs = require("fs");
const path = require("path");


const dataFolder = "./data";


// Find all JSON files
const files = fs
    .readdirSync(dataFolder)
    .filter(file =>
        file.endsWith(".json") &&
        file !== "all-companies.json"
    );


console.log(
    "Files found:",
    files
);


const allCompanies = [];


for (const file of files) {

    const filePath =
        path.join(
            dataFolder,
            file
        );


    console.log(
        "Reading:",
        file
    );


    const fileData =
        JSON.parse(
            fs.readFileSync(
                filePath,
                "utf8"
            )
        );


    allCompanies.push(
        ...fileData
    );
}


console.log(
    "Total records:",
    allCompanies.length
);


// Save combined data
fs.writeFileSync(

    path.join(
        dataFolder,
        "all-companies.json"
    ),

    JSON.stringify(
        allCompanies,
        null,
        2
    ),

    "utf8"
);


console.log(
    "Combined file created:"
);

console.log(
    "data/all-companies.json"
);