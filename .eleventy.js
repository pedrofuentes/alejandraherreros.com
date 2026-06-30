export default function (eleventyConfig) {
  // Copy static assets (css, fonts, images) straight through to the output.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Rebuild when CSS or fonts change during `npm run serve`.
  eleventyConfig.addWatchTarget("src/assets/");

  // Current year, handy for footers etc.
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
}
