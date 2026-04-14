<template>
  <div class="game-activity">
    <div class="page-header">
      <h1>游戏活动管理</h1>
      <el-button type="primary" @click="openCreateDialog">
        <i class="el-icon-plus"></i>
        新建活动
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="活动名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入活动名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table :data="activities" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="活动名称" min-width="180" />
        <el-table-column prop="description" label="活动描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180" />
        <el-table-column prop="end_time" label="结束时间" width="180" />
        <el-table-column label="奖励配置" min-width="220">
          <template #default="{ row }">
            <span class="reward-config">{{ formatRewardConfig(row.reward_config) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog
      title="新建活动"
      :visible.sync="showDialog"
      width="640px"
      destroy-on-close
    >
      <el-form
        ref="activityFormRef"
        :model="activityForm"
        :rules="activityRules"
        label-width="100px"
      >
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="activityForm.name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="activityForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入活动描述"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="activityForm.start_time"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开始时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker
            v-model="activityForm.end_time"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择结束时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="奖励配置" prop="reward_config">
          <el-input
            v-model="rewardConfigText"
            type="textarea"
            rows="6"
            placeholder='请输入奖励配置(JSON格式)，例如：{"points":100,"items":["coupon"]}'
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="activityForm.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitActivity">
          确 定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from "axios"

export default {
  name: "GameActivity",
  data() {
    return {
      loading: false,
      submitting: false,
      activities: [],
      showDialog: false,
      rewardConfigText: "",
      searchForm: {
        name: "",
        status: ""
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      activityForm: {
        name: "",
        description: "",
        start_time: "",
        end_time: "",
        status: 1
      },
      activityRules: {
        name: [{ required: true, message: "请输入活动名称", trigger: "blur" }],
        start_time: [{ required: true, message: "请选择开始时间", trigger: "change" }],
        end_time: [{ required: true, message: "请选择结束时间", trigger: "change" }]
      }
    }
  },
  mounted() {
    this.fetchActivities()
  },
  methods: {
    async fetchActivities() {
      this.loading = true
      try {
        const response = await axios.get("/admin/api/v1/game/activities", {
          params: {
            ...this.searchForm,
            page: this.pagination.page,
            pageSize: this.pagination.pageSize
          }
        })

        if (response.data.code === 200) {
          this.activities = (response.data.data.list || []).map(item => ({
            ...item,
            reward_config: this.normalizeRewardConfig(item.reward_config)
          }))
          this.pagination.total = response.data.data.total || 0
        } else {
          this.$message.error(response.data.message || "获取活动列表失败")
        }
      } catch (error) {
        this.$message.error("获取活动列表失败")
      } finally {
        this.loading = false
      }
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.page = 1
      this.fetchActivities()
    },
    handleCurrentChange(page) {
      this.pagination.page = page
      this.fetchActivities()
    },
    handleSearch() {
      this.pagination.page = 1
      this.fetchActivities()
    },
    resetSearch() {
      this.searchForm = {
        name: "",
        status: ""
      }
      this.pagination.page = 1
      this.fetchActivities()
    },
    openCreateDialog() {
      this.showDialog = true
      this.rewardConfigText = "{\n  \"points\": 100\n}"
      this.activityForm = {
        name: "",
        description: "",
        start_time: "",
        end_time: "",
        status: 1
      }
      this.$nextTick(() => {
        this.$refs.activityFormRef && this.$refs.activityFormRef.clearValidate()
      })
    },
    normalizeRewardConfig(rawValue) {
      if (!rawValue) {
        return {}
      }
      if (typeof rawValue === "object") {
        return rawValue
      }
      try {
        return JSON.parse(rawValue)
      } catch (error) {
        return { raw: rawValue }
      }
    },
    formatRewardConfig(rawValue) {
      if (!rawValue) {
        return "-"
      }
      const parsed = this.normalizeRewardConfig(rawValue)
      try {
        return JSON.stringify(parsed)
      } catch (error) {
        return typeof rawValue === "string" ? rawValue : "-"
      }
    },
    async submitActivity() {
      if (!this.$refs.activityFormRef) {
        return
      }

      this.$refs.activityFormRef.validate(async valid => {
        if (!valid) {
          return
        }

        let rewardConfigPayload
        try {
          rewardConfigPayload = this.rewardConfigText
            ? JSON.parse(this.rewardConfigText)
            : {}
        } catch (error) {
          this.$message.error("奖励配置需为合法的 JSON 格式")
          return
        }

        if (!rewardConfigPayload || typeof rewardConfigPayload !== "object") {
          this.$message.error("奖励配置需为非空对象")
          return
        }

        if (!this.activityForm.start_time || !this.activityForm.end_time) {
          this.$message.error("请选择活动起止时间")
          return
        }

        if (this.activityForm.end_time <= this.activityForm.start_time) {
          this.$message.error("结束时间需晚于开始时间")
          return
        }

        this.submitting = true
        try {
          const response = await axios.post("/admin/api/v1/game/activities", {
            name: this.activityForm.name,
            description: this.activityForm.description,
            start_time: this.activityForm.start_time,
            end_time: this.activityForm.end_time,
            reward_config: rewardConfigPayload,
            status: this.activityForm.status
          })

          if (response.data.code === 200) {
            this.$message.success("活动创建成功")
            this.showDialog = false
            this.fetchActivities()
          } else {
            this.$message.error(response.data.message || "创建活动失败")
          }
        } catch (error) {
          this.$message.error("创建活动失败")
        } finally {
          this.submitting = false
        }
      })
    }
  }
}
</script>

<style scoped>
.game-activity {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.search-bar {
  margin-bottom: 16px;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.table-container {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

.reward-config {
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
}
</style>

