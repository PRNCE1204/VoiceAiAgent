export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        return res.status(400).json({
            message: "Validation Error",
            errors: error.errors.map((err) => ({
                field: err.path.slice(1).join("."), // Exclude the parent wrapper (like 'body')
                message: err.message
            }))
        });
    }
};
