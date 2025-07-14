const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // 📦 Plugins
  eleventyConfig.addPlugin(syntaxHighlight);

  // 📁 Static asset copy
  eleventyConfig.addPassthroughCopy("assets");

  // 📆 Custom date filter
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy") =>
    DateTime.fromJSDate(dateObj).toFormat(format)
  );

  // ✅ Define "posts" collection ONCE
  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi.getFilteredByGlob("./posts/*.md")
      .sort((a, b) => b.date - a.date)
  );

  // Structure and templating settings
  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "dist"
    },
    markdownTemplateEngine: "njk"
  };
};
