const axios = require("axios");
const cheerio = require("cheerio");

const SPOONACULAR_API_KEY = "9b42a968ad3d4188942dc950d8783954"; // Replace this with your real API key

async function fetchRecipe(url) {
    try {
        let ingredients = [];

        if (url.includes("foodnetwork.com")) {
            console.log("Using Spoonacular API for:", url);

            const response = await axios.get(`https://api.spoonacular.com/recipes/extract`, {
                params: {
                    url: url,
                    apiKey: SPOONACULAR_API_KEY
                }
            });

            if (response.data.extendedIngredients) {
                ingredients = response.data.extendedIngredients.map(ing => ing.original);
            }

        } else {
            console.log("Using Axios for:", url);

            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Referer": "https://www.google.com/",
                    "DNT": "1",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
                }
            });

            const html = response.data;
            const $ = cheerio.load(html);

            const selectors = [
                "li.ingredient",
                ".recipe-ingredients li",
                ".wprm-recipe-ingredient",
                ".tasty-recipes-ingredients li",
                ".ingredients-item",
                '[itemprop="recipeIngredient"]',
                ".structured-ingredients__list-item"
            ];

            for (const selector of selectors) {
                $(selector).each((i, el) => {
                    ingredients.push($(el).text().trim());
                });
                if (ingredients.length > 0) break;
            }
        }

        return ingredients.length > 0
            ? { title: url, ingredients }
            : { title: url, ingredients: ["No ingredients found"] };

    } catch (error) {
        console.error(`❌ Error fetching recipe from ${url}:`, error.message);
        return { title: "Failed to fetch", ingredients: ["Error fetching recipe data"] };
    }
}





module.exports = async (req, res) => {
    const { links } = req.body;
    if (!links || !Array.isArray(links)) {
        return res.status(400).json({ error: "Invalid request format" });
    }

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
};
