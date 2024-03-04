const { Client } = require("@notionhq/client");
const fs = require("fs");
const path = require("path");
const { markdownToBlocks } = require("@tryfabric/martian");
const matter = require('gray-matter');

require("dotenv").config();

// Initialize a new Notion client
const notion = new Client({
  auth: process.env.NOTION_API_TOKEN, // Ensure you have NOTION_API_TOKEN in your environment variables
  notionVersion: "2022-02-22", // v1 of the API
});

// ID of your target Notion page or database
const databaseId = "de8db5301bb44491a807a72d0775fb2e";

function stripObsidianLink(text) {
  return text.replace(/^\[\[|\]\]$/g, '');
}

function stripFileNameDate(filename) {
  let res = {}
  let regex = /(\d{4}-\d{2}-\d{2})_(.+)$/;
  let match = regex.exec(filename);
  if (match) {
    res["date"] = match[1]
    res["title"] = match[2]
  } else {
    res["date"] = null
    res["title"] = filename
  }
  return res;
}

async function pageExists(title, databaseId) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Name',
      title: {
        equals: title,
      },
    },
  });
  return response.results.length > 0;
}

async function createMarkdownPage(filename, text, frontmatter, databaseId) {
  let blocks = markdownToBlocks(text);

  const exists = await pageExists(filename, databaseId);
  if (exists) {
    console.log(`Skipping ${filename}, it already exists.`);
    return;
  }


  const { date: date, title: title } = stripFileNameDate(filename);

  const properties = {
      'Name': {
        title: [
          {
            text: { content: title },
          },
      ],
    },
  }

  if (frontmatter.hubs) {
    properties['Tags'] = { // Make sure 'Tags' matches the exact name of your multi-select property in Notion
      multi_select: frontmatter.hubs.map(hub => ({ name: stripObsidianLink(hub) })),
    };
  }

  if (date) {
    properties['Date'] = {
      date: {
        start: date,
      }
    }
  }

  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties,
      children: blocks,
    });
    console.log("Success! Entry added.");
  } catch (error) {
    console.log("Error! Printing blocks:")
    console.log(blocks);
    console.log(JSON.stringify(blocks));
    console.error(error);
  }
}

async function uploadMarkdownFileToNotion(filePath, databaseId) {
  let fileContent = fs.readFileSync(filePath, "utf8");
  const { content: markdownContent, data: frontmatter } = matter(fileContent);
  let fileMatter = matter(fileContent);
  // fileContent = stripFrontmatter(fileContent);
  const filename = path.parse(filePath).name;
  await createMarkdownPage(filename, markdownContent, frontmatter, databaseId);
}

// uploadMarkdownFileToNotion(databaseId);

module.exports = { uploadMarkdownFileToNotion };

