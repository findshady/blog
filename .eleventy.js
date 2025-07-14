const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginTOC = require("eleventy-plugin-toc"); // <-- Added this
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // 📦 Plugins
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  // Add the ToC plugin
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ['h2', 'h3', 'h4'], // Which headers to include in the ToC
    wrapper: 'div', 
    wrapperClass: 'toc-list',
    ul: true
  });

  // 📁 Static asset copy
  eleventyConfig.addPassthroughCopy("assets");

  // 📆 Custom date filter for the post hero (e.g., "9 July 2025")
  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("d LLLL yyyy");
  });

  // ✅ Keep your existing 'posts' collection
  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi.getFilteredByGlob("./posts/*.md")
      .sort((a, b) => b.date - a.date)
  );

  // Structure and templating settings (keeping your Nunjucks config)
  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "dist"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};