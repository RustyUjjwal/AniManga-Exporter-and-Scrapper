# AniManga Exporter And Scrapper 🚀

AniManga Exporter is an open-source, web-based tool that lets you effortlessly extract, analyze, and export your public anime or manga lists from MyAnimeList or AniList.

Whether you're looking to back up your data, migrate between platforms, or just flex your stats, this tool provides a fast, beautifully designed interface to get the job done.

🌐 **[Try the Live App](https://animanga-exporter-and-scrapper.netlify.app)**

## ✨ Features

- **Dual-Platform Support:** Seamlessly scrape public profiles from both MyAnimeList and AniList.
- **Anime & Manga Toggle:** Easily switch between extracting your Anime or Manga databases.
- **Interactive Data Browser:** Browse your extracted lists using a visually rich Grid (Cover) view or a dense Table view. Filter by status (Completed, Watching, etc.) and sort as needed.
- **Comprehensive Analytics:** Dive into your stats with interactive charts showing Score Distribution, Status Segmentation, and Media Format Breakdown.
- **Export Your Way:**
  - 📊 **CSV & JSON:** Perfect for spreadsheet analysis, backup, or custom development.
  - 🔄 **Native XML:** Generates a standard MyAnimeList XML format. Perfect for importing your list into MyAnimeList, AniList, Kitsu, or Anime-Planet!
  - 📝 **TXT Report:** A clean, readable text summary of your tracked items.
  - 📋 **Markdown Card:** Quickly copy a summary containing your top 10 rated shows to share on Reddit, forums, or your GitHub profile.
- **Beautiful UI/UX:** Built with Tailwind CSS and Framer Motion, featuring native Dark & Light modes.

## 🛠 Tech Stack

This project is built using modern web technologies and deployed serverlessly:

- **Frontend:** React 19, TypeScript, Vite
- **Styling & UI:** Tailwind CSS, Framer Motion, Lucide React
- **Backend (Serverless):** Netlify Functions via Express.js (`netlify/functions/api.ts`) to handle API routing, bypass CORS, and manage rate limits.
- **Data Sources:** Jikan API v4 (MAL) & AniList GraphQL API.

## 🤝 Contributing

This is an open-source project, and contributions are heavily encouraged! If you have an idea for a new feature, find a bug, or want to improve the code, please:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Feel free to check the Issues page if you're looking for something to work on.

## 📄 License

Distributed under the MIT License. See the `LICENSE` file for more information.

If you find this project helpful, consider leaving a ⭐ on the repository!
