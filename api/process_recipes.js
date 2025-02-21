const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { links } = req.body;
        if (!links || !Array.isArray(links)) {
            return res.status(400).json({ error: "Invalid request format" });
        }

        // Function to scrape recipe ingredients from a URL
        async function fetchRecipe(url) {
            try {
                const response = await axios.get(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Referer": "https://www.google.com/",
                        "DNT": "1", // Do Not Track request
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
                    }
                });
                const html = response.data;
                const $ = cheerio.load(html);

                let ingredients = [];

                // Common ingredient selectors for various websites
                const selectors = [
                    'li.ingredient',                  // General
                    '.recipe-ingredients li',        // Some recipe sites
                    '.wprm-recipe-ingredient',       // WordPress recipe plugin
                    '.tasty-recipes-ingredients li', // Tasty plugin
                    '.ingredients-item',             // Food Network
                    '[itemprop="recipeIngredient"]', // Schema.org format
                    '.structured-ingredients__list-item' // Some custom formats
                ];

                for (const selector of selectors) {
                    $(selector).each((i, el) => {
                        ingredients.push($(el).text().trim());
                    });
                    if (ingredients.length > 0) break; // Stop if we found ingredients
                }

                if (ingredients.length === 0) {
                    return { title: $("title").text(), ingredients: ["No ingredients found"] };
                }

                return { title: $("title").text(), ingredients };
            } catch (error) {
                console.error(`Error fetching recipe from ${url}:`, error.message);
                return { title: "Failed to fetch", ingredients: ["Error fetching recipe data"] };
            }
        }

        // Fetch all recipes in parallel
        const results = await Promise.all(links.map(url => fetchRecipe(url)));

        let consolidatedIngredients = {};
        results.forEach(recipe => {
            recipe.ingredients.forEach(ingredient => {
                consolidatedIngredients[ingredient] = (consolidatedIngredients[ingredient] || 0) + 1;
            });
        });

        let output = "Consolidated Ingredients:\n";
        for (const [ingredient, count] of Object.entries(consolidatedIngredients)) {
            output += `- ${ingredient} (x${count})\n`;
        }

        return res.status(200).json({ ingredients: output });

    } catch (error) {
        console.error("Server Error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
