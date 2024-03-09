# Notion Obsidian Sync

Sync local Markdown files from Obsidian into Notion.

Uses [martian](https://github.com/tryfabric/martian) to convert Markdown to Notion API block format.

- Local files are organized by tag, e.g. blog, book.
- Each tag has a separate database in Notion.
- Notion page names are extracted from Markdown file names.
- Files that have already been uploaded are skipped.
- Notion page metadata is extracted form Markdown file name and frontmatter.

e.g. local data
```
.
├── blog
│   ├── 2021-01-05_Loading-data-from-GCS-to-BigQuery-using-Workflows.md
│   └── 2024-02-11_Databricks-Big-Book-of-ML-Use-Cases-2nd-Edition.md
├── book
│   ├── 2023-05-03_Google-Cloud-Cookbook.md
│   └── 2024-01-31_Designing-Machine-Learning-Systems.md
├── cookbook
│   ├── ChatGPT-Cookbook.md
│   └── Redshift-Cookbook.md
├── course
│   ├── 2021-10-13_BigQuery-for-Big-Data-Engineers---Master-BigQuery-Internals.md
│   └── 2024-03-03_GCP-Data-Engineer---Get-Certified-2021.md
├── doc
│   └── 2022-08-30_OpenAI-GPT-Best-Practices.md
├── fact
│   └── 2024-03-03_Vim-replace-tabs-with-spaces.md
├── resource
│   └── 2024-02-27_dotfiles.md
└── video
    ├── 2023-11-21_Superwise-Unraveling-prompt-engineering.md
    └── 2024-01-09_BigQuery-Spotlight-Series.md

```
## Install

```
npm install
```

Modify script as needed, e.g. vault path, local folders and databaseIds in `config.js`

Create a `.env` file with `NOTION_API_TOKEN`. Ensure that each Notion database has the integration added as a connection.

## Run

```
node batchUpload.js --lastmod-days-window INTEGER [--update-existing --dry-run --file-filter 2024-01-09_BigQuery-Spotlight-Series.md]
```

