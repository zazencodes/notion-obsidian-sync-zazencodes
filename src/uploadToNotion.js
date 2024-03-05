const { Client } = require("@notionhq/client");
const fs = require("fs");
const path = require("path");
const { markdownToBlocks } = require("@tryfabric/martian");
const matter = require('gray-matter');

if (!(process.env.NOTION_API_TOKEN)) throw Error("Set env variable NOTION_API_TOKEN")

const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
  notionVersion: "2022-02-22", // v1 of the API
});

async function uploadMarkdownFileToNotion(filePath, databaseId, updateExisting) {
  let fileContent = fs.readFileSync(filePath, "utf8");
  const { content: markdownContent, data: frontmatter } = matter(fileContent);
  const filename = path.parse(filePath).name;
  const { date: date, title: title } = parseFileNameDate(filename);

  if (updateExisting) {
    await deletePage(title, databaseId);
  } else {
    const exists = await pageExists(title, databaseId);
    if (exists) {
      console.log(`Skipping ${filename}, it already exists.`);
      return;
    }
  }
  await createMarkdownPage(title, date, markdownContent, frontmatter, databaseId);
}

/**
 * Create new markdown page in database with markdown text.
 *
 * - Name the page using the filename
 *    e.g. 2024-02-27_Dotfiles-stuff is given the name "Dotfiles stuff"
 *
 * - Add date property
 *    e.g. 2024-02-27_Dotfiles-stuff is given the date "2024-02-27"
 *
 * - Add hubs frontmatter as tags
 *    e.g. 2024-02-27_Dotfiles-stuff has hubs frontmatter: "macos"
 *    and "linux"
 *
 * - Remove the first heading, since it's usually a duplicate
 *   of the title.
 */
async function createMarkdownPage(title, date, text, frontmatter, databaseId) {
  let blocks = markdownToBlocks(removeFirstHeading(text));

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
    properties['Tags'] = {
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
    throw Error(error);
  }
}

/**
 * Strip link brackets from text.
 *  e.g. "[[vim]]" becomes "vim"
 */
function stripObsidianLink(text) {
  return text.replace(/^\[\[|\]\]$/g, '');
}


/**
 * Split date and name from front of file name.
 *  e.g. "2024-02-27_dotfiles" becomes
 *  { date: "2024-02-27", title: "dotfiles" }
 */
function parseFileNameDate(filename) {
  let res = {}
  let regex = /(\d{4}-\d{2}-\d{2})_(.+)$/;
  let match = regex.exec(filename);
  if (match) {
    res["date"] = match[1]
    res["title"] = match[2].replaceAll("-", " ")
  } else {
    res["date"] = null
    res["title"] = filename.replaceAll("-", " ")
  }
  return res;
}

/**
 * Strip out the first heading row of the Markdown text
 */
function removeFirstHeading(text) {
  let lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("# ")) {
          lines.splice(i, 1);
          break;
      }
  }
  return lines.join('\n');
}

/**
 * Check if page with title exists in notion database.
 */
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

/**
 * Delete a page with title from the notion database.
 */
async function deletePage(title, databaseId) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Name',
      text: {
        equals: title,
      },
    },
  });

  // If pages are found, delete them
  if (response.results.length > 0) {
    for (const page of response.results) {
      await notion.pages.update({
        page_id: page.id,
        archived: true, // This marks the page as deleted (archived)
      });
      console.log(`Page with ID ${page.id} and title "${title}" has been deleted.`);
    }
  } else {
    console.log(`No pages found with the title "${title}".`);
  }
}

module.exports = { uploadMarkdownFileToNotion };

