<template>
  <div class="game-config">
    <div class="page-header">
      <h1>游戏配置管理</h1>
      <el-button type="primary" @click="showCreateDialog = true">
        <i class="el-icon-plus"></i> 新增配置
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="配置名称">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入配置名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="1"></el-option>
            <el-option label="禁用" value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getConfigList">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 配置列表 -->
    <div class="table-container">
      <el-table :data="configList" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="name" label="配置名称" min-width="150"></el-table-column>
        <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status == 1 ? 'success' : 'danger'">
              {{ scope.row.status == 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" @click="editConfig(scope.row)">编辑</el-button>
            <el-button type="text" @click="viewConfig(scope.row)">查看</el-button>
            <el-button type="text" style="color: #f56c6c" @click="deleteConfig(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total">
        </el-pagination>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog :title="isEdit ? '编辑配置' : '新增配置'" :visible.sync="showCreateDialog" width="600px">
      <el-form :model="configForm" :rules="configRules" ref="configForm" label-width="100px">
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="configForm.name" placeholder="请输入配置名称"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            type="textarea" 
            v-model="configForm.description" 
            placeholder="请输入配置描述"
            :rows="3">
          </el-input>
        </el-form-item>
        <el-form-item label="配置数据" prop="config_data">
          <el-input 
            type="textarea" 
            v-model="configDataStr" 
            placeholder="请输入JSON格式的配置数据"
            :rows="8">
          </el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="configForm.status" :active-value="1" :inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from "axios"

export default {
  name: "GameConfig",
  data() {
    return {
      loading: false,
      showCreateDialog: false,
      isEdit: false,
      configList: [],
      searchForm: {
        name: "",
        status: ""
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      configForm: {
        id: null,
        name: "",
        description: "",
        config_data: {},
        status: 1
      },
      configDataStr: "",
      configRules: {
        name: [
          { required: true, message: "请输入配置名称", trigger: "blur" }
        ]
      }
    }
  },
  mounted() {
    this.getConfigList()
  },
  methods: {
    async getConfigList() {
      this.loading = true
      try {
        const response = await axios.get("/admin/api/v1/game/configs", {
          params: {
            ...this.searchForm,
            page: this.pagination.page,
            pageSize: this.pagination.pageSize
          }
        })
        
        if (response.data.code === 200) {
          this.configList = response.data.data.list
          this.pagination.total = response.data.data.total
        } else {
          this.$message.error(response.data.message)
        }
      } catch (error) {
        this.$message.error("获取配置列表失败")
      }
      this.loading = false
    },

    resetSearch() {
      this.searchForm = {
        name: "",
        status: ""
      }
      this.pagination.page = 1
      this.getConfigList()
    },

    editConfig(row) {
      this.isEdit = true
      this.configForm = { ...row }
      this.configDataStr = JSON.stringify(row.config_data, null, 2)
      this.showCreateDialog = true
    },

    viewConfig(row) {
      this.$alert(JSON.stringify(row.config_data, null, 2), "配置数据", {
        confirmButtonText: "确定"
      })
    },

    async deleteConfig(id) {
      try {
        await this.$confirm("此操作将永久删除该配置, 是否继续?", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        })
        
        const response = await axios.delete(`/admin/api/v1/game/configs/${id}`)
        if (response.data.code === 200) {
          this.$message.success("删除成功")
          this.getConfigList()
        } else {
          this.$message.error(response.data.message)
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("删除失败")
        }
      }
    },

    async saveConfig() {
      try {
        await this.$refs.configForm.validate()
        
        // 验证JSON格式
        try {
          this.configForm.config_data = JSON.parse(this.configDataStr)
        } catch (error) {
          this.$message.error("配置数据格式错误，请输入有效的JSON")
          return
        }

        const url = this.isEdit 
          ? `/admin/api/v1/game/configs/${this.configForm.id}`
          : "/admin/api/v1/game/configs"
        
        const method = this.isEdit ? "put" : "post"
        const response = await axios[method](url, this.configForm)
        
        if (response.data.code === 200) {
          this.$message.success(this.isEdit ? "更新成功" : "创建成功")
          this.showCreateDialog = false
          this.resetForm()
          this.getConfigList()
        } else {
          this.$message.error(response.data.message)
        }
      } catch (error) {
        // 表单验证失败
      }
    },

    resetForm() {
      this.configForm = {
        id: null,
        name: "",
        description: "",
        config_data: {},
        status: 1
      }
      this.configDataStr = ""
      this.isEdit = false
      this.$refs.configForm?.resetFields()
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.getConfigList()
    },

    handleCurrentChange(val) {
      this.pagination.page = val
      this.getConfigList()
    }
  }
}
</script>

<style scoped>
.game-config {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-container {
  background: white;
  border-radius: 4px;
  padding: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
</style>
