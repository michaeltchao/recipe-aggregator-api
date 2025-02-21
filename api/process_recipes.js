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
                const response = await axios.get(url);
                const html = response.data;
                const $ = cheerio.load(html);

                let ingredients = [];

                // Look for common ingredient selectors
                $('li.ingredient, .recipe-ingredients li, .wprm-recipe-ingredient').each((i, el) => {
                    ingredients.push($(el).text().trim());
                });

                if (ingredients.length === 0) {
                    return { title: "Unknown Recipe", ingredients: ["No ingredients found"] };
                }

                return { title: $("title").text(), ingredients };
            } catch (error) {
                console.error(`Error fetching recipe from ${url}:`, error);
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
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
