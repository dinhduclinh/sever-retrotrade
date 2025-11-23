"use strict";

/**
 * Pagination middleware for Express.
 *
 * Parses `page` and `limit` from the query string, clamps values to sensible
 * bounds, and exposes `req.pagination = { page, limit, skip }` for database queries.
 *
 * Also attaches `res.paginationMeta(totalItems)` helper to compute standard
 * pagination metadata for API responses.
 *
 * Example usage in a route/controller:
 *   router.get("/items", pagination(), async (req, res) => {
 *     const { skip, limit } = req.pagination;
 *     const [items, total] = await Promise.all([
 *       Item.find().skip(skip).limit(limit),
 *       Item.countDocuments(),
 *     ]);
 *     res.json({ items, ...res.paginationMeta(total) });
 *   });
 *
 * @param {number} [defaultLimit=10] - Fallback items per page when not provided.
 * @param {number} [maxLimit=100] - Maximum allowed items per page.
 * @returns {import('express').RequestHandler}
 */
function pagination(defaultLimit = 10, maxLimit = 100) {
  return function paginationMiddleware(req, res, next) {
    const rawPage = Array.isArray(req.query.page)
      ? req.query.page[0]
      : req.query.page;
    const rawLimit = Array.isArray(req.query.limit)
      ? req.query.limit[0]
      : req.query.limit;

    const parsedPage = Number.parseInt(rawPage, 10);
    const parsedLimit = Number.parseInt(rawLimit, 10);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    let limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : defaultLimit;
    if (maxLimit > 0 && limit > maxLimit) {
      limit = maxLimit;
    }

    const skip = (page - 1) * limit;

    req.pagination = { page, limit, skip };

    res.paginationMeta = function paginationMeta(totalItems) {
      const total = Number.isFinite(totalItems) && totalItems >= 0 ? totalItems : 0;
      const totalPages = Math.max(Math.ceil(total / (limit || 1)), 1);
      return { page, limit, totalItems: total, totalPages };
    };

    next();
  };
}

module.exports = pagination;


