const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginTOC = require("eleventy-plugin-toc");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginSyntaxHighlight, { lineNumbers: true });
  eleventyConfig.addPlugin(pluginTOC, { tags: ['h2', 'h3', 'h4'], wrapper: 'div', ul: true });
  const markdownLib = markdownIt({ html: true }).use(markdownItAnchor, { permalink: markdownItAnchor.permalink.ariaHidden({ placement: "before", symbol: "" }), level: [1, 2, 3, 4] });
  eleventyConfig.setLibrary("md", markdownLib);
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy-MM-dd") => DateTime.fromJSDate(dateObj).toFormat(format));
  eleventyConfig.addFilter("postDate", (dateObj) => DateTime.fromJSDate(dateObj).toFormat("d LLLL yyyy"));
  eleventyConfig.addCollection("posts", (collectionApi) => collectionApi.getFilteredByGlob("./posts/*.md").sort((a, b) => b.date - a.date));
  return { dir: { input: ".", includes: "_includes", data: "_data", output: "dist" }, markdownTemplateEngine: "njk", htmlTemplateEngine: "njk" };
};