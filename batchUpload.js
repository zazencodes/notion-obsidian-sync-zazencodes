const fs = require("fs");
const path = require("path");
const { uploadMarkdownFileToNotion } = require("./uploadToNotion");

// Your Notion database ID and the directory containing Markdown files
const databaseId = "de8db5301bb44491a807a72d0775fb2e"; // Replace with your actual database ID
const markdownDirectory = "/Users/alex/library/Mobile Documents/iCloud~md~obsidian/Documents/ZazenCodes/notes/resource";

fs.readdir(markdownDirectory, (err, files) => {
  if (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }

  files.forEach((file) => {
    if (path.extname(file) === ".md") {
      const filePath = path.join(markdownDirectory, file);
      uploadMarkdownFileToNotion(filePath, databaseId)
        .then(() => console.log(`${file} processed successfully.`))
        .catch((error) => console.error(`Failed to upload ${file}:`, error));
    }
  });
});

