const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginTOC = require("eleventy-plugin-toc");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // 📦 Plugins
  eleventyConfig.addPlugin(pluginSyntaxHighlight, {
    lineNumbers: true, // This is crucial for the line number styling
  });
  
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ['h2', 'h3', 'h4'],
    wrapper: 'div',
    ul: true
  });

  // ✅ Set up Markdown-It with the anchor plugin for ToC
  const markdownLib = markdownIt({ html: true }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: "before",
      symbol: "#",
    }),
    level: [1, 2, 3, 4],
  });
  eleventyConfig.setLibrary("md", markdownLib);

  // 📁 Static asset copy
  eleventyConfig.addPassthroughCopy("assets");

  // 📆 Date filters
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy-MM-dd") => DateTime.fromJSDate(dateObj).toFormat(format));
  eleventyConfig.addFilter("postDate", (dateObj) => DateTime.fromJSDate(dateObj).toFormat("d LLLL yyyy"));

  // Your 'posts' collection
  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi.getFilteredByGlob("./posts/*.md").sort((a, b) => b.date - a.date)
  );

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "dist"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};