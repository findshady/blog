const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginTOC = require("eleventy-plugin-toc");
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // 📦 Plugins
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ['h2', 'h3', 'h4'],
    wrapper: 'div', 
    wrapperClass: 'toc-list',
    ul: true
  });

  // 📁 Static asset copy
  eleventyConfig.addPassthroughCopy("assets");

  // ✅ ADDING THIS GENERIC DATE FILTER BACK
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy-MM-dd") => {
    return DateTime.fromJSDate(dateObj).toFormat(format);
  });

  // 📆 Custom date filter for the post hero (e.g., "9 July 2025")
  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("d LLLL yyyy");
  });

  // Your 'posts' collection
  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi.getFilteredByGlob("./posts/*.md")
      .sort((a, b) => b.date - a.date)
  );

  // Structure and templating settings
  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data", // Make sure Eleventy knows about your data folder
      output: "dist"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};