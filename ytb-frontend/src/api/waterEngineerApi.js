/**
 * 净水器工程师/工单管理 API
 */
import request from '@/utils/request';

export const waterEngineerApi = {
    /**
     * 获取工单统计数据
     */
    getWorkOrderStats() {
        return request.get('/api/admin/water-engineer/stats');
    },

    /**
     * 获取工单列表
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.limit - 每页数量
     * @param {string} params.search - 搜索关键词
     * @param {string} params.status - 状态筛选
     * @param {string} params.start_date - 开始日期
     * @param {string} params.end_date - 结束日期
     * @param {boolean} params.unassigned - 是否只显示未派单
     */
    getWorkOrders(params) {
        return request.get('/api/admin/water-engineer/orders', { params });
    },

    /**
     * 获取工单详情
     * @param {string} orderNo - 订单号
     */
    getWorkOrderDetail(orderNo) {
        return request.get(`/api/admin/water-engineer/orders/${orderNo}`);
    },

    /**
     * 派单给工程师
     * @param {string} orderNo - 订单号
     * @param {number} engineerId - 工程师ID
     */
    assignOrder(orderNo, engineerId) {
        return request.post(`/api/admin/water-engineer/orders/${orderNo}/assign`, {
            engineer_id: engineerId
        });
    },

    /**
     * 取消工单
     * @param {string} orderNo - 订单号
     * @param {string} reason - 取消原因
     */
    cancelOrder(orderNo, reason) {
        return request.post(`/api/admin/water-engineer/orders/${orderNo}/cancel`, {
            cancel_reason: reason
        });
    },

    /**
     * 获取待接单订单（公共池）
     */
    getPendingOrders() {
        return request.get('/api/admin/water-engineer/pending-orders');
    },

    /**
     * 获取工程师列表
     */
    getEngineers() {
        return request.get('/api/admin/water-engineer/engineers');
    }
};

export default waterEngineerApi;
