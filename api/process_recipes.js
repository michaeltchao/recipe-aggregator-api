module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { links } = req.body;
        if (!links || !Array.isArray(links)) {
            return res.status(400).json({ error: "Invalid request format" });
        }

        // Simulating fetching recipe data
        const results = links.map(url => ({
            title: "Sample Recipe",
            ingredients: [
                "2 onions",
                "3 cloves garlic",
                "1 cup flour",
                "1/2 tsp salt",
                "1/4 tsp black pepper",
                "1 tbsp olive oil"
            ]
        }));

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
