<template>
  <div class="statistics-container">
    <div class="page-header">
      <h1>订单统计分析</h1>
      <div class="date-picker">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          align="right"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :picker-options="pickerOptions"
          value-format="yyyy-MM-dd"
          @change="handleDateRangeChange"
        />
      </div>
    </div>

    <!-- 数据卡片概览 -->
    <el-row :gutter="20" class="panel-group">
      <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper">
            <i class="el-icon-s-order card-panel-icon"></i>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">总订单数</div>
            <div class="card-panel-num">{{ stats.totalOrders || 0 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper" style="background: #36a3f7;">
            <i class="el-icon-money card-panel-icon"></i>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">总销售额</div>
            <div class="card-panel-num">¥{{ stats.totalAmount || 0 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper" style="background: #f4516c;">
            <i class="el-icon-shopping-cart-full card-panel-icon"></i>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">已付款订单</div>
            <div class="card-panel-num">{{ stats.paidOrders || 0 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper" style="background: #34bfa3;">
            <i class="el-icon-user card-panel-icon"></i>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">下单用户数</div>
            <div class="card-panel-num">{{ stats.totalUsers || 0 }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表展示 -->
    <el-row :gutter="20" class="chart-group">
      <el-col :lg="12">
        <el-card class="box-card" v-loading="loading">
          <div slot="header" class="card-header">
            <span>订单趋势</span>
            <el-radio-group v-model="chartPeriod" size="mini">
              <el-radio-button label="week">近7天</el-radio-button>
              <el-radio-button label="month">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container">
            <div ref="orderTrendChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :lg="12">
        <el-card class="box-card" v-loading="loading">
          <div slot="header" class="card-header">
            <span>订单状态分布</span>
          </div>
          <div class="chart-container">
            <div ref="orderStatusChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-group">
      <el-col :lg="12">
        <el-card class="box-card" v-loading="loading">
          <div slot="header" class="card-header">
            <span>支付方式分布</span>
          </div>
          <div class="chart-container">
            <div ref="paymentMethodChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :lg="12">
        <el-card class="box-card" v-loading="loading">
          <div slot="header" class="card-header">
            <span>热销商品TOP5</span>
          </div>
          <div class="chart-container">
            <div ref="topProductsChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 订单数据表格 -->
    <el-card class="box-card">
      <div slot="header" class="card-header">
        <span>订单统计明细</span>
      </div>
      <el-table :data="tableData" border style="width: 100%">
        <el-table-column prop="date" label="日期" width="180" />
        <el-table-column prop="total_orders" label="订单数" width="120" />
        <el-table-column prop="total_amount" label="销售额" width="150">
          <template slot-scope="{row}">
            <span>¥{{ row.total_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paid_orders" label="已付款订单" width="120" />
        <el-table-column prop="paid_amount" label="已付款金额" width="150">
          <template slot-scope="{row}">
            <span>¥{{ row.paid_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unpaid_orders" label="未付款订单" width="120" />
        <el-table-column prop="canceled_orders" label="已取消订单" width="120" />
        <el-table-column prop="completed_orders" label="已完成订单" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'OrderStatistics',
  data() {
    return {
      loading: true,
      dateRange: [],
      chartPeriod: 'week',
      stats: {
        totalOrders: 0,
        totalAmount: 0,
        paidOrders: 0,
        totalUsers: 0
      },
      tableData: [],
      pickerOptions: {
        shortcuts: [
          {
            text: '最近一周',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近三个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      },
      charts: {
        orderTrend: null,
        orderStatus: null,
        paymentMethod: null,
        topProducts: null
      }
    }
  },
  mounted() {
    // 设置默认为最近7天
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
    this.dateRange = [this.formatDate(start), this.formatDate(end)]
    
    this.fetchData()
    
    // 窗口大小变化时重绘图表
    window.addEventListener('resize', this.resizeCharts)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeCharts)
    this.disposeCharts()
  },
  watch: {
    chartPeriod() {
      this.fetchData()
    }
  },
  methods: {
    formatDate(date) {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`
    },
    resizeCharts() {
      Object.values(this.charts).forEach(chart => {
        chart && chart.resize()
      })
    },
    disposeCharts() {
      Object.keys(this.charts).forEach(key => {
        if (this.charts[key]) {
          this.charts[key].dispose()
          this.charts[key] = null
        }
      })
    },
    handleDateRangeChange(dates) {
      if (dates) {
        this.fetchData()
      }
    },
    fetchData() {
      this.loading = true
      
      // 获取统计数据
      this.$http.get('/api/admin/payment/orders/statistics', {
        params: {
          start_date: this.dateRange[0],
          end_date: this.dateRange[1],
          period: this.chartPeriod
        }
      })
        .then(response => {
          const data = response.data.data
          this.stats = data.stats
          this.tableData = data.daily
          
          // 初始化图表
          this.$nextTick(() => {
            this.initCharts(data)
            this.loading = false
          })
        })
        .catch(error => {
          console.error('获取统计数据失败', error)
          this.loading = false
          this.$message.error('获取统计数据失败')
        })
    },
    initCharts(data) {
      this.disposeCharts()
      this.initOrderTrendChart(data.trend)
      this.initOrderStatusChart(data.status)
      this.initPaymentMethodChart(data.payment)
      this.initTopProductsChart(data.products)
    },
    initOrderTrendChart(trend) {
      const chartDom = this.$refs.orderTrendChart
      this.charts.orderTrend = echarts.init(chartDom)
      
      const dates = trend.map(item => item.date)
      const orders = trend.map(item => item.orders)
      const amounts = trend.map(item => item.amount)
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            crossStyle: {
              color: '#999'
            }
          }
        },
        legend: {
          data: ['订单数', '销售额']
        },
        xAxis: [
          {
            type: 'category',
            data: dates,
            axisPointer: {
              type: 'shadow'
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '订单数',
            minInterval: 1,
            axisLabel: {
              formatter: '{value}'
            }
          },
          {
            type: 'value',
            name: '销售额',
            axisLabel: {
              formatter: '¥{value}'
            }
          }
        ],
        series: [
          {
            name: '订单数',
            type: 'bar',
            data: orders
          },
          {
            name: '销售额',
            type: 'line',
            yAxisIndex: 1,
            data: amounts
          }
        ]
      }
      
      this.charts.orderTrend.setOption(option)
    },
    initOrderStatusChart(statusData) {
      const chartDom = this.$refs.orderStatusChart
      this.charts.orderStatus = echarts.init(chartDom)
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: statusData.map(item => item.name)
        },
        series: [
          {
            name: '订单状态',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: statusData.map(item => ({
              value: item.value,
              name: item.name
            }))
          }
        ]
      }
      
      this.charts.orderStatus.setOption(option)
    },
    initPaymentMethodChart(paymentData) {
      const chartDom = this.$refs.paymentMethodChart
      this.charts.paymentMethod = echarts.init(chartDom)
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: paymentData.map(item => item.name)
        },
        series: [
          {
            name: '支付方式',
            type: 'pie',
            radius: '55%',
            center: ['50%', '50%'],
            data: paymentData.map(item => ({
              value: item.value,
              name: item.name
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      
      this.charts.paymentMethod.setOption(option)
    },
    initTopProductsChart(productsData) {
      const chartDom = this.$refs.topProductsChart
      this.charts.topProducts = echarts.init(chartDom)
      
      const products = productsData.map(item => item.name)
      const sales = productsData.map(item => item.sales)
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          boundaryGap: [0, 0.01]
        },
        yAxis: {
          type: 'category',
          data: products
        },
        series: [
          {
            name: '销量',
            type: 'bar',
            data: sales
          }
        ]
      }
      
      this.charts.topProducts.setOption(option)
    }
  }
}
</script>

<style lang="scss" scoped>
.statistics-container {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .panel-group {
    margin-bottom: 20px;
  }
  
  .card-panel {
    height: 108px;
    cursor: pointer;
    font-size: 12px;
    position: relative;
    overflow: hidden;
    color: #666;
    background: #fff;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
    border-radius: 4px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    
    &:hover {
      .card-panel-icon-wrapper {
        color: #fff;
        transform: translateX(-10px);
      }
    }
    
    .card-panel-icon-wrapper {
      float: left;
      margin: 14px 0 0 14px;
      padding: 16px;
      transition: all 0.38s ease-out;
      border-radius: 4px;
      background: #409EFF;
    }
    
    .card-panel-icon {
      float: left;
      font-size: 48px;
      color: #fff;
    }
    
    .card-panel-description {
      float: right;
      font-weight: bold;
      margin: 26px 15px 0 0;
      
      .card-panel-text {
        line-height: 18px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 16px;
        margin-bottom: 12px;
      }
      
      .card-panel-num {
        font-size: 20px;
        color: #333;
      }
    }
  }
  
  .chart-group {
    margin-bottom: 20px;
  }
  
  .box-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chart-container {
      .chart {
        width: 100%;
        height: 300px;
      }
    }
  }
}
</style> 