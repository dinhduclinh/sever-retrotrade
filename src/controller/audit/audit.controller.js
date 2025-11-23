const AuditLog = require("../../models/AuditLog.model");
const User = require("../../models/User.model");

/**
 * Get all audit logs (admin only)
 */
module.exports.getAllAuditLogs = async (req, res) => {
    try {
        const { skip = 0, limit = 10, page = 1 } = req.pagination || {};
        const { tableName, operation, startDate, endDate } = req.query || {};

        // Build filter object
        const filter = {};

        // Filter by table name
        if (tableName && tableName !== 'all') {
            filter.TableName = tableName;
        }

        // Filter by operation
        if (operation && operation !== 'all' && ['INSERT', 'UPDATE', 'DELETE'].includes(operation)) {
            filter.Operation = operation;
        }

        // Filter by date range
        if (startDate || endDate) {
            filter.ChangedAt = {};
            if (startDate) {
                filter.ChangedAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.ChangedAt.$lte = new Date(endDate);
            }
        }

        // Build query with pagination
        const query = AuditLog.find(filter)
            .populate('ChangedByUserId', 'fullName email role')
            .sort({ ChangedAt: -1 }) // Most recent first
            .skip(skip)
            .limit(limit)
            .lean();

        const [auditLogs, totalItems] = await Promise.all([
            query,
            AuditLog.countDocuments(filter)
        ]);

        return res.json({
            code: 200,
            message: "Lấy lịch sử thay đổi thành công",
            data: {
                items: auditLogs,
                page,
                limit,
                totalItems,
                totalPages: Math.max(Math.ceil(totalItems / (limit || 1)), 1)
            }
        });
    } catch (error) {
        console.error("Error getting audit logs:", error);
        return res.json({
            code: 500,
            message: "Lấy lịch sử thay đổi thất bại",
            error: error.message
        });
    }
};

/**
 * Get audit logs for a specific table and primary key
 */
module.exports.getAuditLogsByEntity = async (req, res) => {
    try {
        const { tableName, primaryKeyValue } = req.params;

        if (!tableName || !primaryKeyValue) {
            return res.json({
                code: 400,
                message: "Thiếu thông tin tableName hoặc primaryKeyValue"
            });
        }

        const auditLogs = await AuditLog.find({
            TableName: tableName,
            PrimaryKeyValue: primaryKeyValue
        })
            .populate('ChangedByUserId', 'fullName email role')
            .sort({ ChangedAt: -1 })
            .lean();

        return res.json({
            code: 200,
            message: "Lấy lịch sử thay đổi thành công",
            data: auditLogs
        });
    } catch (error) {
        console.error("Error getting audit logs by entity:", error);
        return res.json({
            code: 500,
            message: "Lấy lịch sử thay đổi thất bại",
            error: error.message
        });
    }
};

