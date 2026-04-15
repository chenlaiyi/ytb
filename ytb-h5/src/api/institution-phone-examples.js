/**
 * 前端调用示例 - 使用手机号获取机构数据
 * 
 * 修改说明：
 * 原来的机构识别方式：使用固定的机构代码
 * 新的机构识别方式：使用手机号在ddg_institution表中进行匹配
 */

// === 方法1：通过POST参数传递手机号 ===
const apiExample1 = {
    method: 'POST',
    url: 'https://pay.itapgo.com/api/mobile/v1/institution/workspace',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    data: {
        phone: '18888888888' // 机构注册的手机号
    }
};

// === 方法2：通过HTTP头部传递手机号 ===
const apiExample2 = {
    method: 'POST',
    url: 'https://pay.itapgo.com/api/mobile/v1/institution/workspace',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Phone': '18888888888' // 通过自定义头部传递手机号
    },
    data: {}
};

// === 方法3：通过GET参数传递手机号 ===
const apiExample3 = {
    method: 'GET',
    url: 'https://pay.itapgo.com/api/mobile/v1/institution/workspace?phone=18888888888',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// === jQuery 调用示例 ===
function getInstitutionData(phone) {
    $.ajax({
        url: 'https://pay.itapgo.com/api/mobile/v1/institution/workspace',
        method: 'POST',
        data: {
            phone: phone
        },
        success: function(response) {
            if (response.code === 0) {
                console.log('机构数据获取成功:', response.data);
                // 处理机构数据
                displayInstitutionData(response.data);
            } else {
                console.error('获取机构数据失败:', response.message);
                alert('获取数据失败: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('API调用失败:', error);
            alert('网络请求失败');
        }
    });
}

// === Axios 调用示例 ===
async function getInstitutionDataWithAxios(phone) {
    try {
        const response = await axios.post('https://pay.itapgo.com/api/mobile/v1/institution/workspace', {
            phone: phone
        });
        
        if (response.data.code === 0) {
            console.log('机构数据获取成功:', response.data.data);
            return response.data.data;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        console.error('获取机构数据失败:', error.message);
        throw error;
    }
}

// === Vue.js 组件示例 ===
const InstitutionComponent = {
    data() {
        return {
            phone: '',
            institutionData: null,
            loading: false,
            error: null
        };
    },
    methods: {
        async fetchInstitutionData() {
            if (!this.phone) {
                this.error = '请输入手机号';
                return;
            }
            
            this.loading = true;
            this.error = null;
            
            try {
                const response = await this.$http.post('/api/mobile/v1/institution/workspace', {
                    phone: this.phone
                });
                
                if (response.data.code === 0) {
                    this.institutionData = response.data.data;
                } else {
                    this.error = response.data.message;
                }
            } catch (error) {
                this.error = '网络请求失败';
                console.error(error);
            } finally {
                this.loading = false;
            }
        }
    }
};

// === 所有API端点都支持手机号匹配 ===
const allApiEndpoints = [
    'POST /api/mobile/v1/institution/workspace',      // 工作台数据
    'POST /api/mobile/v1/institution/merchants',      // 商户列表
    'POST /api/mobile/v1/institution/transactions',   // 交易记录
    'POST /api/mobile/v1/institution/commissions',    // 分润明细
    'POST /api/mobile/v1/institution/statistics',     // 统计数据
    'POST /api/mobile/v1/institution/hierarchy',      // 层级结构
    'POST /api/mobile/v1/institution/finance',        // 财务数据
    'POST /api/mobile/v1/institution/risk-control'    // 风控数据
];

// === 错误处理说明 ===
const errorHandlingGuide = {
    401: '无权限访问机构数据 - 手机号未提供或不正确',
    404: '机构不存在 - 手机号对应的机构未找到',
    500: '系统错误 - 服务器内部错误'
};

console.log('=== 机构手机号匹配API调用指南 ===');
console.log('支持的API端点:', allApiEndpoints);
console.log('错误代码说明:', errorHandlingGuide);