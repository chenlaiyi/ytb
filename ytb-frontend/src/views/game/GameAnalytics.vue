<template>
  <div class="game-analytics">
    <div class="page-header">
      <h1>游戏数据分析</h1>
    </div>

    <!-- 数据概览 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon players">
              <i class="el-icon-user"></i>
            </div>
            <div class="stat-content">
              <h3>{{ todayData.players }}</h3>
              <p>今日玩家</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon sessions">
              <i class="el-icon-monitor"></i>
            </div>
            <div class="stat-content">
              <h3>{{ todayData.sessions }}</h3>
              <p>今日游戏</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon completions">
              <i class="el-icon-check"></i>
            </div>
            <div class="stat-content">
              <h3>{{ todayData.completions }}</h3>
              <p>今日通关</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon score">
              <i class="el-icon-trophy"></i>
            </div>
            <div class="stat-content">
              <h3>{{ Math.round(todayData.avgScore) }}</h3>
              <p>平均分数</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 趋势图表 -->
    <div class="charts-container">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-card">
            <h3>7天游戏趋势</h3>
            <div id="trendChart" style="height: 300px;"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-card">
            <h3>关卡统计</h3>
            <div id="levelChart" style="height: 300px;"></div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 玩家列表 -->
    <div class="players-section">
      <div class="section-header">
        <h2>玩家列表</h2>
        <el-input
          v-model="searchNickname"
          placeholder="搜索玩家昵称"
          style="width: 200px;"
          @input="searchPlayers"
          clearable
        />
      </div>
      
      <el-table :data="playerList" v-loading="playersLoading" border stripe>
        <el-table-column prop="user_id" label="用户ID" width="120"></el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="150"></el-table-column>
        <el-table-column prop="total_sessions" label="游戏次数" width="100"></el-table-column>
        <el-table-column prop="best_score" label="最高分" width="100"></el-table-column>
        <el-table-column prop="max_level" label="最高关卡" width="100"></el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180"></el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          @size-change="handlePlayerSizeChange"
          @current-change="handlePlayerCurrentChange"
          :current-page="playerPagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="playerPagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="playerPagination.total">
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios"
import * as echarts from "echarts"

export default {
  name: "GameAnalytics",
  data() {
    return {
      loading: false,
      playersLoading: false,
      todayData: {
        players: 0,
        sessions: 0,
        completions: 0,
        avgScore: 0
      },
      trendData: [],
      levelStats: [],
      playerList: [],
      searchNickname: "",
      playerPagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      trendChart: null,
      levelChart: null
    }
  },
  mounted() {
    this.getDashboardData()
    this.getPlayerList()
  },
  methods: {
    async getDashboardData() {
      this.loading = true
      try {
        const response = await axios.get("/admin/api/v1/game/analytics/dashboard")
        
        if (response.data.code === 200) {
          const data = response.data.data
          this.todayData = data.today
          this.trendData = data.trend
          this.levelStats = data.levelStats
          
          this.$nextTick(() => {
            this.initTrendChart()
            this.initLevelChart()
          })
        } else {
          this.$message.error(response.data.message)
        }
      } catch (error) {
        this.$message.error("获取数据失败")
      }
      this.loading = false
    },

    async getPlayerList() {
      this.playersLoading = true
      try {
        const response = await axios.get("/admin/api/v1/game/analytics/players", {
          params: {
            nickname: this.searchNickname,
            page: this.playerPagination.page,
            pageSize: this.playerPagination.pageSize
          }
        })
        
        if (response.data.code === 200) {
          this.playerList = response.data.data.list
          this.playerPagination.total = response.data.data.total
        } else {
          this.$message.error(response.data.message)
        }
      } catch (error) {
        this.$message.error("获取玩家列表失败")
      }
      this.playersLoading = false
    },

    initTrendChart() {
      const chartDom = document.getElementById("trendChart")
      this.trendChart = echarts.init(chartDom)
      
      const option = {
        tooltip: {
          trigger: "axis"
        },
        legend: {
          data: ["玩家数", "游戏数"]
        },
        xAxis: {
          type: "category",
          data: this.trendData.map(item => item.date)
        },
        yAxis: {
          type: "value"
        },
        series: [
          {
            name: "玩家数",
            type: "line",
            data: this.trendData.map(item => item.players),
            smooth: true
          },
          {
            name: "游戏数",
            type: "line",
            data: this.trendData.map(item => item.sessions),
            smooth: true
          }
        ]
      }
      
      this.trendChart.setOption(option)
    },

    initLevelChart() {
      const chartDom = document.getElementById("levelChart")
      this.levelChart = echarts.init(chartDom)
      
      const option = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow"
          }
        },
        xAxis: {
          type: "category",
          data: this.levelStats.map(item => `关卡${item.level}`)
        },
        yAxis: {
          type: "value"
        },
        series: [
          {
            name: "尝试次数",
            type: "bar",
            data: this.levelStats.map(item => item.attempts),
            itemStyle: {
              color: "#409EFF"
            }
          }
        ]
      }
      
      this.levelChart.setOption(option)
    },

    searchPlayers() {
      this.playerPagination.page = 1
      this.getPlayerList()
    },

    handlePlayerSizeChange(val) {
      this.playerPagination.pageSize = val
      this.getPlayerList()
    },

    handlePlayerCurrentChange(val) {
      this.playerPagination.page = val
      this.getPlayerList()
    }
  },
  beforeDestroy() {
    if (this.trendChart) {
      this.trendChart.dispose()
    }
    if (this.levelChart) {
      this.levelChart.dispose()
    }
  }
}
</script>

<style scoped>
.game-analytics {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stat-icon.players {
  background: #409EFF;
}

.stat-icon.sessions {
  background: #67C23A;
}

.stat-icon.completions {
  background: #E6A23C;
}

.stat-icon.score {
  background: #F56C6C;
}

.stat-content h3 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-content p {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.charts-container {
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  margin: 0 0 15px 0;
  color: #303133;
}

.players-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
