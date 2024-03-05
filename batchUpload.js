const fsp = require('fs').promises;
const fs = require('fs');
const path = require("path");
require("dotenv").config();
const { uploadMarkdownFileToNotion } = require("./src/uploadToNotion");
const { config } = require("./config")


/**
 * Upload folder with Markdown files to Notion.
 *
 * Args:
 *
 *  --lastmod-days-window INTEGER
 *    Filter on given number of days since last mod of file.
 *
 *  --update-existing
 *    Flag to overwrite existing pages in Notion (delete and re-create).
 *    Otherwise the file will be skipped.
 *
 */
async function main() {
  args = parseArgs();
  for (const { folder, databaseId } of config.noteTagIds) {
    await uploadFolder(folder, databaseId, args.lmodDays, args.updateExisting);
  }
}


function parseArgs() {
  const args = process.argv.slice(2);

  const lmodDaysIdx = args.indexOf('--lastmod-days-window');
  if (lmodDaysIdx === -1 || args.length <= lmodDaysIdx + 1) {
      console.error('Please provide --last-mod-days-window argument to set maximum upload window.');
      process.exit(1);
  }
  const lmodDays = parseInt(args[lmodDaysIdx + 1]);

  const updateExisting = process.argv.indexOf('--update-existing') > -1;

  return {
    lmodDays,
    updateExisting,
  }

}

async function uploadFolder(folder, databaseId, lmodDays, updateExisting) {
  console.log(`Processing files in ${path.join(config.obsidianVault, folder)}`)
  console.log(`Uploading to notion database ${databaseId}`)
  try {
    // Get files in reverse sort and filter using lmodDays
    const files = (
        await fsp.readdir(path.join(config.obsidianVault, folder))
      ).map(function (fileName) {
        return {
          name: fileName,
          time: fs.statSync(path.join(config.obsidianVault, folder, fileName)).mtime.getTime()
        };
      })
      .filter(function(a) {
        return a.time > ((new Date().getTime()) - (lmodDays*24*3600*1000))
      })
      .sort(function (a, b) {
        return b.time - a.time; })
      .map(function (v) {
        return v.name; });

    console.log(files);

    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.md') {
        const filePath = path.join(config.obsidianVault, folder, file);
        try {
          await uploadMarkdownFileToNotion(filePath, databaseId, updateExisting);
        } catch(error) {
          console.error(`Failed to upload ${file}:`, error));
        }
        console.log(`${file} processed.`)
        console.log("Sleeping for 1 second")
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error(`Failed to process folder ${folder}:`, error);
  }
}

main();

