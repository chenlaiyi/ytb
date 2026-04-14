<template>
  <div class="app-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>商品管理</h2>
      <p>管理商城商品信息，包括商品上架、下架、库存管理等</p>
    </div>

    <!-- 统计信息 -->
    <div class="stats-container" v-if="statistics">
      <el-row :gutter="20">
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ statistics.total_products }}</div>
            <div class="stat-label">总商品数</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ statistics.on_sale_products }}</div>
            <div class="stat-label">在售商品</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ statistics.off_sale_products }}</div>
            <div class="stat-label">下架商品</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ statistics.low_stock_products }}</div>
            <div class="stat-label">库存不足</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ statistics.total_categories }}</div>
            <div class="stat-label">商品分类</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ statistics.total_sales }}</div>
            <div class="stat-label">总销量</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="商品名称/SKU"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
        clearable
      />
      <el-select
        v-model="listQuery.category_id"
        placeholder="商品分类"
        style="width: 150px;"
        class="filter-item"
        clearable
      >
        <el-option
          v-for="category in categories"
          :key="category.id"
          :label="category.name"
          :value="category.id"
        />
      </el-select>
      <el-select
        v-model="listQuery.status"
        placeholder="状态"
        style="width: 120px;"
        class="filter-item"
        clearable
      >
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-select
        v-model="listQuery.is_on_sale"
        placeholder="上架状态"
        style="width: 120px;"
        class="filter-item"
        clearable
      >
        <el-option label="已上架" :value="1" />
        <el-option label="已下架" :value="0" />
      </el-select>
      <el-select
        v-model="listQuery.tag_filter"
        placeholder="标签筛选"
        style="width: 120px;"
        class="filter-item"
        clearable
      >
        <el-option label="精选" value="is_featured" />
        <el-option label="热卖" value="is_hot" />
        <el-option label="推荐" value="is_recommend" />
        <el-option label="新品" value="is_new" />
        <el-option label="优惠" value="is_discount" />
        <el-option label="畅销" value="is_bestseller" />
        <el-option label="限量" value="is_limited" />
        <el-option label="独家" value="is_exclusive" />
      </el-select>
      <el-input-number
        v-model="listQuery.min_price"
        placeholder="最低价格"
        :min="0"
        :precision="2"
        style="width: 120px;"
        class="filter-item"
      />
      <el-input-number
        v-model="listQuery.max_price"
        placeholder="最高价格"
        :min="0"
        :precision="2"
        style="width: 120px;"
        class="filter-item"
      />
      <el-button class="filter-item" type="primary" icon="Search" @click="handleFilter">
        搜索
      </el-button>
      <el-button class="filter-item" type="primary" icon="Plus" @click="handleCreate">
        添加商品
      </el-button>
      <el-button 
        class="filter-item" 
        type="success" 
        icon="Refresh" 
        @click="fetchData"
        :loading="listLoading"
      >
        刷新
      </el-button>
      <el-button 
        class="filter-item" 
        type="warning" 
        icon="Download" 
        @click="handleExport"
        :loading="exportLoading"
      >
        导出
      </el-button>
    </div>

    <!-- 批量操作 -->
    <div class="batch-container" v-if="multipleSelection.length > 0">
      <el-alert
        :title="`已选择 ${multipleSelection.length} 个商品`"
        type="info"
        show-icon
        :closable="false"
      />
      <div class="batch-actions">
        <el-button type="success" size="small" @click="handleBatchOperation('on_sale')">
          批量上架
        </el-button>
        <el-button type="warning" size="small" @click="handleBatchOperation('off_sale')">
          批量下架
        </el-button>
        <el-button type="info" size="small" @click="handleBatchOperation('enable')">
          批量启用
        </el-button>
        <el-button type="info" size="small" @click="handleBatchOperation('disable')">
          批量禁用
        </el-button>
        <el-button type="danger" size="small" @click="handleBatchDelete">
          批量删除
        </el-button>
        <el-button type="primary" size="small" @click="handleBatchSetTags">
          批量设置标签
        </el-button>
      </div>
    </div>

    <!-- 商品表格 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="加载中..."
      border
      highlight-current-row
      style="width: 100%;"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      
      <el-table-column prop="id" label="ID" width="80" />
      
      <el-table-column label="商品信息" min-width="300">
        <template #default="scope">
          <div class="product-info">
            <el-image
              v-if="scope.row.thumbnail"
              style="width: 60px; height: 60px; border-radius: 4px; margin-right: 12px;"
              :src="getFullImageUrl(scope.row.thumbnail)"
              :preview-src-list="getProductImages(scope.row)"
              fit="cover"
            />
            <div class="product-details">
              <div class="product-name">{{ scope.row.name }}</div>
              <div class="product-sku">SKU: {{ scope.row.sku || '无' }}</div>
              <div class="product-category">
                <el-tag size="small" type="info">{{ scope.row.category?.name || '无分类' }}</el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="价格" width="120">
        <template #default="scope">
          <div class="price-info">
            <div class="current-price">¥{{ scope.row.price }}</div>
            <div v-if="scope.row.original_price && scope.row.original_price > scope.row.price" class="original-price">
              ¥{{ scope.row.original_price }}
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="stock" label="库存" width="100">
        <template #default="scope">
          <el-tag 
            :type="scope.row.stock <= scope.row.min_stock ? 'danger' : 'success'" 
            size="small"
          >
            {{ scope.row.stock }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="sales" label="销量" width="100">
        <template #default="scope">
          <el-tag type="warning" size="small">{{ scope.row.sales || 0 }}</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="标签" width="200">
        <template #default="scope">
          <div class="product-tags">
            <el-tag v-if="scope.row.is_featured" type="danger" size="small" style="margin: 2px;">精选</el-tag>
            <el-tag v-if="scope.row.is_hot" type="danger" size="small" style="margin: 2px;">热卖</el-tag>
            <el-tag v-if="scope.row.is_recommend" type="primary" size="small" style="margin: 2px;">推荐</el-tag>
            <el-tag v-if="scope.row.is_new" type="success" size="small" style="margin: 2px;">新品</el-tag>
            <el-tag v-if="scope.row.is_discount" type="warning" size="small" style="margin: 2px;">优惠</el-tag>
            <el-tag v-if="scope.row.is_bestseller" type="info" size="small" style="margin: 2px;">畅销</el-tag>
            <el-tag v-if="scope.row.is_limited" type="danger" size="small" style="margin: 2px;">限量</el-tag>
            <el-tag v-if="scope.row.is_exclusive" type="primary" size="small" style="margin: 2px;">独家</el-tag>
            <el-tag 
              v-for="tag in (scope.row.tags || [])" 
              :key="tag" 
              size="small" 
              style="margin: 2px;"
            >
              {{ tag }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="sort" label="排序" width="100">
        <template #default="scope">
          <el-input-number
            v-model="scope.row.sort"
            :min="0"
            :max="999"
            size="small"
            @change="handleSortChange(scope.row)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <div class="status-info">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
              @change="handleStatusChange(scope.row)"
            />
            <br>
            <el-switch
              v-model="scope.row.is_on_sale"
              :active-value="1"
              :inactive-value="0"
              active-text="上架"
              inactive-text="下架"
              @change="handleOnSaleChange(scope.row)"
              style="margin-top: 8px;"
            />
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="created_at" label="创建时间" width="180" />
      
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">
            编辑
          </el-button>
          <el-button type="info" size="small" @click="handleView(scope.row)">
            查看
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-show="total > 0"
      :total="total"
      v-model:current-page="listQuery.page"
      v-model:page-size="listQuery.limit"
      @current-change="fetchData"
      @size-change="fetchData"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      background
    />

    <!-- 商品表单弹窗 -->
    <el-dialog 
      :title="dialogStatus === 'create' ? '添加商品' : '编辑商品'" 
      v-model="dialogFormVisible"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="productFormRef" 
        :rules="rules" 
        :model="productForm" 
        label-position="left" 
        label-width="100px"
      >
        <el-tabs v-model="activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="productForm.name" placeholder="请输入商品名称" />
            </el-form-item>
            
            <el-form-item label="商品分类" prop="category_id">
              <el-select v-model="productForm.category_id" placeholder="请选择商品分类" style="width: 100%;">
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="商品SKU">
              <el-input v-model="productForm.sku" placeholder="请输入商品SKU" />
            </el-form-item>
            
            <el-form-item label="商品描述">
              <el-input 
                v-model="productForm.description" 
                type="textarea" 
                :rows="4"
                placeholder="请输入商品描述"
              />
            </el-form-item>
            
            <el-form-item label="商品详情">
              <el-input 
                v-model="productForm.content" 
                type="textarea" 
                :rows="6"
                placeholder="请输入商品详情"
              />
            </el-form-item>
          </el-tab-pane>
          
          <!-- 价格库存 -->
          <el-tab-pane label="价格库存" name="price">
            <el-form-item label="商品价格" prop="price">
              <el-input-number 
                v-model="productForm.price" 
                :min="0" 
                :precision="2"
                placeholder="请输入商品价格"
                style="width: 100%;"
              />
            </el-form-item>
            
            <el-form-item label="原价">
              <el-input-number 
                v-model="productForm.original_price" 
                :min="0" 
                :precision="2"
                placeholder="请输入商品原价"
                style="width: 100%;"
              />
            </el-form-item>
            
            <el-form-item label="成本价">
              <el-input-number 
                v-model="productForm.cost_price" 
                :min="0" 
                :precision="2"
                placeholder="请输入商品成本价"
                style="width: 100%;"
              />
            </el-form-item>
            
            <el-form-item label="库存数量" prop="stock">
              <el-input-number 
                v-model="productForm.stock" 
                :min="0"
                placeholder="请输入库存数量"
                style="width: 100%;"
              />
            </el-form-item>
            
            <el-form-item label="最低库存">
              <el-input-number 
                v-model="productForm.min_stock" 
                :min="0"
                placeholder="请输入最低库存"
                style="width: 100%;"
              />
            </el-form-item>
            
            <el-form-item label="重量(kg)">
              <el-input-number 
                v-model="productForm.weight" 
                :min="0" 
                :precision="2"
                placeholder="请输入商品重量"
                style="width: 100%;"
              />
            </el-form-item>
          </el-tab-pane>
          
          <!-- 图片设置 -->
          <el-tab-pane label="图片设置" name="images">
            <el-form-item label="商品主图">
              <el-upload
                class="avatar-uploader"
                action="#"
                :http-request="uploadThumbnail"
                :show-file-list="false"
                :before-upload="beforeImageUpload"
              >
                <img v-if="productForm.thumbnail" :src="getFullImageUrl(productForm.thumbnail)" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div class="el-upload__tip">建议尺寸：800x800px，支持jpg/png文件，不超过2MB</div>
            </el-form-item>
            
            <el-form-item label="商品图片">
              <el-upload
                class="upload-demo"
                action="#"
                :http-request="uploadImage"
                :file-list="imageList"
                :before-upload="beforeImageUpload"
                list-type="picture-card"
                :on-remove="handleRemoveImage"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="el-upload__tip">建议尺寸：800x800px，支持jpg/png文件，不超过2MB，最多上传9张</div>
            </el-form-item>
          </el-tab-pane>
          
          <!-- 标签设置 -->
          <el-tab-pane label="标签设置" name="tags">
            <el-form-item label="系统标签">
              <el-checkbox-group v-model="systemTags">
                <el-checkbox label="is_featured">精选</el-checkbox>
                <el-checkbox label="is_hot">热卖</el-checkbox>
                <el-checkbox label="is_recommend">推荐</el-checkbox>
                <el-checkbox label="is_new">新品</el-checkbox>
                <el-checkbox label="is_discount">优惠</el-checkbox>
                <el-checkbox label="is_bestseller">畅销</el-checkbox>
                <el-checkbox label="is_limited">限量</el-checkbox>
                <el-checkbox label="is_exclusive">独家</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="优惠设置" v-if="systemTags.includes('is_discount')">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-input-number 
                    v-model="productForm.discount_percentage" 
                    :min="0" 
                    :max="100"
                    :precision="2"
                    placeholder="折扣百分比"
                    style="width: 100%;"
                  />
                  <div class="el-form-item__tip">折扣百分比（0-100）</div>
                </el-col>
                <el-col :span="8">
                  <el-date-picker
                    v-model="productForm.discount_start_time"
                    type="datetime"
                    placeholder="优惠开始时间"
                    style="width: 100%;"
                  />
                </el-col>
                <el-col :span="8">
                  <el-date-picker
                    v-model="productForm.discount_end_time"
                    type="datetime"
                    placeholder="优惠结束时间"
                    style="width: 100%;"
                  />
                </el-col>
              </el-row>
            </el-form-item>
            
            <el-form-item label="限量设置" v-if="systemTags.includes('is_limited')">
              <el-input-number 
                v-model="productForm.limited_quantity" 
                :min="1"
                placeholder="限量数量"
                style="width: 200px;"
              />
              <div class="el-form-item__tip">设置商品限量销售数量</div>
            </el-form-item>
            
            <el-form-item label="自定义标签">
              <el-tag
                v-for="tag in productForm.tags"
                :key="tag"
                closable
                @close="removeCustomTag(tag)"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="inputVisible"
                ref="inputRef"
                v-model="inputValue"
                size="small"
                style="width: 120px;"
                @keyup.enter="handleInputConfirm"
                @blur="handleInputConfirm"
              />
              <el-button v-else size="small" @click="showInput">+ 添加标签</el-button>
            </el-form-item>
          </el-tab-pane>
          
          <!-- 其他设置 -->
          <el-tab-pane label="其他设置" name="other">
            <el-form-item label="排序">
              <el-input-number 
                v-model="productForm.sort" 
                :min="0" 
                :max="999"
                placeholder="数值越小排序越靠前"
                style="width: 100%;"
              />
            </el-form-item>
            
            <el-form-item label="是否上架">
              <el-switch
                v-model="productForm.is_on_sale"
                active-text="上架"
                inactive-text="下架"
              />
            </el-form-item>
            
            <el-form-item label="状态">
              <el-radio-group v-model="productForm.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="dialogStatus === 'create' ? createProduct() : updateProduct()"
            :loading="submitLoading"
          >
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 商品详情弹窗 -->
    <el-dialog 
      title="商品详情" 
      v-model="detailDialogVisible"
      width="800px"
    >
      <div v-if="currentProduct" class="product-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品ID">{{ currentProduct.id }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ currentProduct.name }}</el-descriptions-item>
          <el-descriptions-item label="商品分类">{{ currentProduct.category?.name || '无分类' }}</el-descriptions-item>
          <el-descriptions-item label="商品SKU">{{ currentProduct.sku || '无' }}</el-descriptions-item>
          <el-descriptions-item label="商品价格">¥{{ currentProduct.price }}</el-descriptions-item>
          <el-descriptions-item label="原价">¥{{ currentProduct.original_price || '无' }}</el-descriptions-item>
          <el-descriptions-item label="库存数量">{{ currentProduct.stock }}</el-descriptions-item>
          <el-descriptions-item label="销量">{{ currentProduct.sales || 0 }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentProduct.status === 1 ? 'success' : 'danger'">
              {{ currentProduct.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="上架状态">
            <el-tag :type="currentProduct.is_on_sale === 1 ? 'success' : 'warning'">
              {{ currentProduct.is_on_sale === 1 ? '已上架' : '已下架' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentProduct.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentProduct.updated_at }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="currentProduct.description" style="margin-top: 20px;">
          <h4>商品描述</h4>
          <p>{{ currentProduct.description }}</p>
        </div>
        
        <div v-if="currentProduct.content" style="margin-top: 20px;">
          <h4>商品详情</h4>
          <div v-html="currentProduct.content"></div>
        </div>
        
        <div v-if="getProductImages(currentProduct).length > 0" style="margin-top: 20px;">
          <h4>商品图片</h4>
          <el-image
            v-for="(image, index) in getProductImages(currentProduct)"
            :key="index"
            style="width: 100px; height: 100px; margin-right: 10px; border-radius: 4px;"
            :src="image"
            :preview-src-list="getProductImages(currentProduct)"
            fit="cover"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 批量设置标签弹窗 -->
    <el-dialog 
      title="批量设置标签" 
      v-model="batchTagsDialogVisible"
      width="600px"
    >
      <el-form :model="batchTagsForm" label-width="100px">
        <el-form-item label="操作类型">
          <el-radio-group v-model="batchTagsForm.action">
            <el-radio label="add">添加标签</el-radio>
            <el-radio label="remove">移除标签</el-radio>
            <el-radio label="replace">替换标签</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="系统标签">
          <el-checkbox-group v-model="batchTagsForm.system_tags">
            <el-checkbox label="is_featured">精选</el-checkbox>
            <el-checkbox label="is_hot">热卖</el-checkbox>
            <el-checkbox label="is_recommend">推荐</el-checkbox>
            <el-checkbox label="is_new">新品</el-checkbox>
            <el-checkbox label="is_discount">优惠</el-checkbox>
            <el-checkbox label="is_bestseller">畅销</el-checkbox>
            <el-checkbox label="is_limited">限量</el-checkbox>
            <el-checkbox label="is_exclusive">独家</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="自定义标签">
          <el-tag
            v-for="tag in batchTagsForm.custom_tags"
            :key="tag"
            closable
            @close="removeBatchCustomTag(tag)"
            style="margin-right: 8px; margin-bottom: 8px;"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="batchInputVisible"
            ref="batchInputRef"
            v-model="batchInputValue"
            size="small"
            style="width: 120px;"
            @keyup.enter="handleBatchInputConfirm"
            @blur="handleBatchInputConfirm"
          />
          <el-button v-else size="small" @click="showBatchInput">+ 添加标签</el-button>
        </el-form-item>
        
        <el-form-item>
          <div class="batch-info">
            <el-alert
              :title="`将对 ${multipleSelection.length} 个商品执行${batchTagsForm.action === 'add' ? '添加' : batchTagsForm.action === 'remove' ? '移除' : '替换'}标签操作`"
              type="info"
              show-icon
              :closable="false"
            />
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchTagsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmBatchSetTags" :loading="submitLoading">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as mallApi from '@/api/v1/mall'
export default {
  name: 'MallProductList',
  components: {
    Plus
  },
  setup() {
    const listLoading = ref(true)
    const submitLoading = ref(false)
    const exportLoading = ref(false)
    const list = ref([])
    const total = ref(0)
    const statistics = ref(null)
    const categories = ref([])
    const multipleSelection = ref([])
    
    const listQuery = reactive({
      keyword: '',
      category_id: '',
      status: '',
      is_on_sale: '',
      tag_filter: '',
      min_price: null,
      max_price: null,
      page: 1,
      limit: 20
    })
    
    const dialogFormVisible = ref(false)
    const detailDialogVisible = ref(false)
    const dialogStatus = ref('')
    const activeTab = ref('basic')
    const productFormRef = ref(null)
    const currentProduct = ref(null)
    const imageList = ref([])
    
    // 标签相关
    const systemTags = ref([])
    const inputVisible = ref(false)
    const inputValue = ref('')
    const inputRef = ref(null)
    
    // 批量设置标签弹窗
    const batchTagsDialogVisible = ref(false)
    const batchTagsForm = reactive({
      system_tags: [],
      custom_tags: [],
      action: 'add'
    })
    const batchInputVisible = ref(false)
    const batchInputValue = ref('')
    const batchInputRef = ref(null)
    
    const productForm = reactive({
      id: undefined,
      name: '',
      category_id: '',
      sku: '',
      description: '',
      content: '',
      price: 0,
      original_price: 0,
      cost_price: 0,
      stock: 0,
      min_stock: 0,
      weight: 0,
      thumbnail: '',
      images: [],
      tags: [],
      sort: 0,
      is_featured: false,
      is_hot: false,
      is_recommend: false,
      is_new: false,
      is_discount: false,
      is_bestseller: false,
      is_limited: false,
      is_exclusive: false,
      discount_percentage: 0,
      discount_start_time: null,
      discount_end_time: null,
      limited_quantity: 0,
      is_on_sale: true,
      status: 1
    })
    
    const rules = {
      name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
      category_id: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
      price: [{ required: true, message: '请输入商品价格', trigger: 'blur' }],
      stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
    }
    
    // 获取商品列表
    const fetchData = async () => {
      listLoading.value = true
      
      try {
        const response = await mallApi.getProductList(listQuery)
        
        if (response.code === 0) {
          list.value = response.data.data || response.data.list || []
          total.value = response.data.total || 0
        } else {
          ElMessage.error(response.message || '获取商品列表失败')
        }
      } catch (error) {
        console.error('获取商品列表失败:', error)
        ElMessage.error('获取商品列表失败：' + (error.response?.data?.message || error.message))
      } finally {
        listLoading.value = false
      }
    }
    
    // 获取统计信息
    const fetchStatistics = async () => {
      try {
        const response = await mallApi.getProductStatistics()
        
        if (response.code === 0) {
          statistics.value = response.data
        }
      } catch (error) {
        console.error('获取统计信息失败:', error)
      }
    }
    
    // 获取分类列表
    const fetchCategories = async () => {
      try {
        const response = await mallApi.getProductCategories()
        
        if (response.code === 0) {
          categories.value = response.data || []
        }
      } catch (error) {
        console.error('获取分类列表失败:', error)
      }
    }
    
    // 搜索
    const handleFilter = () => {
      listQuery.page = 1
      fetchData()
    }
    
    // 重置表单
    const resetForm = () => {
      Object.assign(productForm, {
        id: undefined,
        name: '',
        category_id: '',
        sku: '',
        description: '',
        content: '',
        price: 0,
        original_price: 0,
        cost_price: 0,
        stock: 0,
        min_stock: 0,
        weight: 0,
        thumbnail: '',
        images: [],
        tags: [],
        sort: 0,
        is_featured: false,
        is_hot: false,
        is_recommend: false,
        is_new: false,
        is_discount: false,
        is_bestseller: false,
        is_limited: false,
        is_exclusive: false,
        discount_percentage: 0,
        discount_start_time: null,
        discount_end_time: null,
        limited_quantity: 0,
        is_on_sale: true,
        status: 1
      })
      imageList.value = []
      systemTags.value = []
    }
    
    // 添加商品
    const handleCreate = () => {
      resetForm()
      dialogStatus.value = 'create'
      activeTab.value = 'basic'
      dialogFormVisible.value = true
      nextTick(() => {
        productFormRef.value?.clearValidate()
      })
    }
    
    // 编辑商品
    const handleUpdate = (row) => {
      // 处理images字段 - 可能是字符串或数组
      let processedImages = []
      if (row.images) {
        if (typeof row.images === 'string') {
          try {
            processedImages = JSON.parse(row.images)
          } catch (e) {
            console.warn('解析images字符串失败:', e)
            processedImages = []
          }
        } else if (Array.isArray(row.images)) {
          processedImages = row.images
        }
      }
      
      Object.assign(productForm, {
        id: row.id,
        name: row.name,
        category_id: row.category_id,
        sku: row.sku || '',
        description: row.description || '',
        content: row.content || '',
        price: row.price,
        original_price: row.original_price || 0,
        cost_price: row.cost_price || 0,
        stock: row.stock,
        min_stock: row.min_stock || 0,
        weight: row.weight || 0,
        thumbnail: row.thumbnail || '',
        images: processedImages,
        tags: row.tags || [],
        sort: row.sort,
        is_featured: row.is_featured || false,
        is_hot: row.is_hot || false,
        is_recommend: row.is_recommend || false,
        is_new: row.is_new || false,
        is_discount: row.is_discount || false,
        is_bestseller: row.is_bestseller || false,
        is_limited: row.is_limited || false,
        is_exclusive: row.is_exclusive || false,
        discount_percentage: row.discount_percentage || 0,
        discount_start_time: row.discount_start_time || null,
        discount_end_time: row.discount_end_time || null,
        limited_quantity: row.limited_quantity || 0,
        is_on_sale: row.is_on_sale,
        status: row.status
      })
      
      // 设置系统标签复选框状态
      systemTags.value = []
      if (row.is_featured) systemTags.value.push('is_featured')
      if (row.is_hot) systemTags.value.push('is_hot')
      if (row.is_recommend) systemTags.value.push('is_recommend')
      if (row.is_new) systemTags.value.push('is_new')
      if (row.is_discount) systemTags.value.push('is_discount')
      if (row.is_bestseller) systemTags.value.push('is_bestseller')
      if (row.is_limited) systemTags.value.push('is_limited')
      if (row.is_exclusive) systemTags.value.push('is_exclusive')
      
      // 设置图片列表
      imageList.value = processedImages.map((url, index) => ({
        name: `image_${index}`,
        url: getFullImageUrl(url)
      }))
      
      dialogStatus.value = 'update'
      activeTab.value = 'basic'
      dialogFormVisible.value = true
      nextTick(() => {
        productFormRef.value?.clearValidate()
      })
    }
    
    // 查看商品详情
    const handleView = async (row) => {
      try {
        const response = await mallApi.getProductDetail(row.id)
        
        if (response.code === 0) {
          currentProduct.value = response.data
          detailDialogVisible.value = true
        } else {
          ElMessage.error(response.message || '获取商品详情失败')
        }
      } catch (error) {
        console.error('获取商品详情失败:', error)
        ElMessage.error('获取商品详情失败：' + (error.response?.data?.message || error.message))
      }
    }
    
    // 创建商品
    const createProduct = async () => {
      try {
        const valid = await productFormRef.value.validate()
        if (!valid) return
        
        submitLoading.value = true
        
        // 处理图片数据
        const formData = { ...productForm }
        formData.images = imageList.value.map(item => {
          // 如果是完整URL，提取相对路径
          if (item.url.startsWith('https://pay.itapgo.com')) {
            return item.url.replace('https://pay.itapgo.com', '')
          }
          return item.url
        })
        
        // 确保标签数据正确
        updateSystemTags()
        
        // 确保必填字段不为空
        if (!formData.name || !formData.name.trim()) {
          ElMessage.error('请输入商品名称')
          return
        }
        if (!formData.category_id || formData.category_id === '') {
          ElMessage.error('请选择商品分类')
          return
        }
        if (formData.price === undefined || formData.price === null || formData.price === '') {
          ElMessage.error('请输入商品价格')
          return
        }
        if (formData.stock === undefined || formData.stock === null || formData.stock === '') {
          ElMessage.error('请输入库存数量')
          return
        }
        if (formData.status === undefined || formData.status === null || formData.status === '') {
          ElMessage.error('请选择商品状态')
          return
        }
        if (formData.is_on_sale === undefined || formData.is_on_sale === null) {
          ElMessage.error('请设置上架状态')
          return
        }
        
        // 处理布尔值类型转换 - 后端期望布尔值
        formData.is_on_sale = Boolean(formData.is_on_sale)
        formData.is_featured = Boolean(formData.is_featured)
        formData.is_hot = Boolean(formData.is_hot)
        formData.is_recommend = Boolean(formData.is_recommend)
        formData.is_new = Boolean(formData.is_new)
        formData.is_discount = Boolean(formData.is_discount)
        formData.is_bestseller = Boolean(formData.is_bestseller)
        formData.is_limited = Boolean(formData.is_limited)
        formData.is_exclusive = Boolean(formData.is_exclusive)
        
        // 确保必填字段存在且类型正确
        formData.status = Number(formData.status)
        formData.category_id = Number(formData.category_id)
        formData.price = Number(formData.price)
        formData.stock = Number(formData.stock)
        
        // 确保其他可能缺失的字段有默认值
        formData.sub_title = formData.sub_title || ''
        formData.sku = formData.sku || ''
        formData.barcode = formData.barcode || ''
        formData.unit = formData.unit || ''
        formData.virtual_sales = Number(formData.virtual_sales) || 0
        formData.min_stock = Number(formData.min_stock) || 0
        formData.weight = Number(formData.weight) || 0
        formData.sort = Number(formData.sort) || 0
        formData.description = formData.description || ''
        formData.content = formData.content || ''
        formData.thumbnail = formData.thumbnail || ''
        formData.original_price = Number(formData.original_price) || formData.price
        formData.cost_price = Number(formData.cost_price) || 0
        
        // 确保数组字段正确处理
        if (!Array.isArray(formData.images)) {
          formData.images = []
        }
        if (!Array.isArray(formData.tags)) {
          formData.tags = []
        }
        if (!Array.isArray(formData.attributes)) {
          formData.attributes = []
        }
        if (!Array.isArray(formData.specs)) {
          formData.specs = []
        }
        if (!Array.isArray(formData.tag_colors)) {
          formData.tag_colors = []
        }
        
        // 处理日期时间格式
        if (formData.discount_start_time) {
          formData.discount_start_time = new Date(formData.discount_start_time).toISOString().slice(0, 19).replace('T', ' ')
        }
        if (formData.discount_end_time) {
          formData.discount_end_time = new Date(formData.discount_end_time).toISOString().slice(0, 19).replace('T', ' ')
        }
        
        console.log('发送的数据:', formData) // 添加调试日志
        
        const response = await mallApi.createProduct(formData)
        
        if (response.code === 0) {
          ElMessage.success('创建商品成功')
          dialogFormVisible.value = false
          fetchData()
          fetchStatistics()
        } else {
          // 显示详细的验证错误信息
          if (response.data && typeof response.data === 'object') {
            const errors = []
            for (const field in response.data) {
              if (Array.isArray(response.data[field])) {
                errors.push(...response.data[field])
              } else {
                errors.push(response.data[field])
              }
            }
            ElMessage.error('验证失败：' + errors.join('; '))
          } else {
            ElMessage.error(response.message || '创建商品失败')
          }
        }
      } catch (error) {
        console.error('创建商品失败:', error)
        // 显示详细的错误信息
        if (error.response?.data?.data && typeof error.response.data.data === 'object') {
          const errors = []
          for (const field in error.response.data.data) {
            if (Array.isArray(error.response.data.data[field])) {
              errors.push(...error.response.data.data[field])
            } else {
              errors.push(error.response.data.data[field])
            }
          }
          ElMessage.error('验证失败：' + errors.join('; '))
        } else {
          ElMessage.error('创建商品失败：' + (error.response?.data?.message || error.message))
        }
      } finally {
        submitLoading.value = false
      }
    }
    
    // 更新商品
    const updateProduct = async () => {
      try {
        const valid = await productFormRef.value.validate()
        if (!valid) return
        
        submitLoading.value = true
        
        // 处理图片数据
        const formData = { ...productForm }
        formData.images = imageList.value.map(item => {
          // 如果是完整URL，提取相对路径
          if (item.url.startsWith('https://pay.itapgo.com')) {
            return item.url.replace('https://pay.itapgo.com', '')
          }
          return item.url
        })
        
        // 确保标签数据正确
        updateSystemTags()
        
        // 确保必填字段不为空
        if (!formData.name || !formData.name.trim()) {
          ElMessage.error('请输入商品名称')
          submitLoading.value = false
          return
        }
        if (!formData.category_id || formData.category_id === '') {
          ElMessage.error('请选择商品分类')
          submitLoading.value = false
          return
        }
        if (formData.price === undefined || formData.price === null || formData.price === '') {
          ElMessage.error('请输入商品价格')
          submitLoading.value = false
          return
        }
        if (formData.stock === undefined || formData.stock === null || formData.stock === '') {
          ElMessage.error('请输入库存数量')
          submitLoading.value = false
          return
        }
        if (formData.status === undefined || formData.status === null || formData.status === '') {
          ElMessage.error('请选择商品状态')
          submitLoading.value = false
          return
        }
        if (formData.is_on_sale === undefined || formData.is_on_sale === null) {
          ElMessage.error('请设置上架状态')
          submitLoading.value = false
          return
        }
        
        // 处理布尔值类型转换 - 后端期望布尔值
        formData.is_on_sale = Boolean(formData.is_on_sale)
        formData.is_featured = Boolean(formData.is_featured)
        formData.is_hot = Boolean(formData.is_hot)
        formData.is_recommend = Boolean(formData.is_recommend)
        formData.is_new = Boolean(formData.is_new)
        formData.is_discount = Boolean(formData.is_discount)
        formData.is_bestseller = Boolean(formData.is_bestseller)
        formData.is_limited = Boolean(formData.is_limited)
        formData.is_exclusive = Boolean(formData.is_exclusive)
        
        // 确保必填字段存在且类型正确
        formData.status = Number(formData.status)
        formData.category_id = Number(formData.category_id)
        formData.price = Number(formData.price)
        formData.stock = Number(formData.stock)
        
        // 确保其他可能缺失的字段有默认值
        formData.sub_title = formData.sub_title || ''
        formData.sku = formData.sku || ''
        formData.barcode = formData.barcode || ''
        formData.unit = formData.unit || ''
        formData.virtual_sales = Number(formData.virtual_sales) || 0
        formData.min_stock = Number(formData.min_stock) || 0
        formData.weight = Number(formData.weight) || 0
        formData.sort = Number(formData.sort) || 0
        formData.description = formData.description || ''
        formData.content = formData.content || ''
        formData.thumbnail = formData.thumbnail || ''
        formData.original_price = Number(formData.original_price) || formData.price
        formData.cost_price = Number(formData.cost_price) || 0
        
        // 确保数组字段正确处理
        if (!Array.isArray(formData.images)) {
          formData.images = []
        }
        if (!Array.isArray(formData.tags)) {
          formData.tags = []
        }
        if (!Array.isArray(formData.attributes)) {
          formData.attributes = []
        }
        if (!Array.isArray(formData.specs)) {
          formData.specs = []
        }
        if (!Array.isArray(formData.tag_colors)) {
          formData.tag_colors = []
        }
        
        // 处理日期时间格式
        if (formData.discount_start_time) {
          formData.discount_start_time = new Date(formData.discount_start_time).toISOString().slice(0, 19).replace('T', ' ')
        }
        if (formData.discount_end_time) {
          formData.discount_end_time = new Date(formData.discount_end_time).toISOString().slice(0, 19).replace('T', ' ')
        }
        
        console.log('发送的数据:', formData) // 添加调试日志
        
        const response = await mallApi.updateProduct(productForm.id, formData)
        
        if (response.code === 0) {
          ElMessage.success('更新商品成功')
          dialogFormVisible.value = false
          fetchData()
          fetchStatistics()
        } else {
          // 显示详细的验证错误信息
          if (response.data && typeof response.data === 'object') {
            const errors = []
            for (const field in response.data) {
              if (Array.isArray(response.data[field])) {
                errors.push(...response.data[field])
              } else {
                errors.push(response.data[field])
              }
            }
            ElMessage.error('验证失败：' + errors.join('; '))
          } else {
            ElMessage.error(response.message || '更新商品失败')
          }
        }
      } catch (error) {
        console.error('更新商品失败:', error)
        // 显示详细的错误信息
        if (error.response?.data?.data && typeof error.response.data.data === 'object') {
          const errors = []
          for (const field in error.response.data.data) {
            if (Array.isArray(error.response.data.data[field])) {
              errors.push(...error.response.data.data[field])
            } else {
              errors.push(error.response.data.data[field])
            }
          }
          ElMessage.error('验证失败：' + errors.join('; '))
        } else {
          ElMessage.error('更新商品失败：' + (error.response?.data?.message || error.message))
        }
      } finally {
        submitLoading.value = false
      }
    }
    
    // 删除商品
    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除商品"${row.name}"吗？此操作不可恢复！`,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const response = await mallApi.deleteProduct(row.id)
        
        if (response.code === 0) {
          ElMessage.success('删除商品成功')
          fetchData()
          fetchStatistics()
        } else {
          ElMessage.error(response.message || '删除商品失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除商品失败:', error)
          ElMessage.error('删除商品失败：' + (error.response?.data?.message || error.message))
        }
      }
    }
    
    // 状态变更
    const handleStatusChange = async (row) => {
      try {
        const response = await mallApi.updateProductStatus(row.id, row.status)
        
        if (response.code !== 0) {
          ElMessage.error(response.message || '状态更新失败')
          row.status = row.status === 1 ? 0 : 1
        }
        // 成功时不显示提示，避免过多干扰
      } catch (error) {
        console.error('状态更新失败:', error)
        ElMessage.error('状态更新失败：' + (error.response?.data?.message || error.message))
        row.status = row.status === 1 ? 0 : 1
      }
    }
    
    // 上架状态变更
    const handleOnSaleChange = async (row) => {
      try {
        const response = await mallApi.updateProductOnSale(row.id, row.is_on_sale)
        
        if (response.code !== 0) {
          ElMessage.error(response.message || '上架状态更新失败')
          row.is_on_sale = row.is_on_sale === 1 ? 0 : 1
        }
        // 成功时不显示提示，避免过多干扰
      } catch (error) {
        console.error('上架状态更新失败:', error)
        ElMessage.error('上架状态更新失败：' + (error.response?.data?.message || error.message))
        row.is_on_sale = row.is_on_sale === 1 ? 0 : 1
      }
    }
    
    // 排序变更
    const handleSortChange = async (row) => {
      try {
        const response = await mallApi.updateProduct(row.id, { sort: row.sort })
        
        if (response.code !== 0) {
          ElMessage.error(response.message || '排序更新失败')
        }
        // 成功时不显示提示，避免过多干扰
      } catch (error) {
        console.error('排序更新失败:', error)
        ElMessage.error('排序更新失败：' + (error.response?.data?.message || error.message))
      }
    }
    
    // 多选变更
    const handleSelectionChange = (selection) => {
      multipleSelection.value = selection
    }
    
    // 批量操作
    const handleBatchOperation = async (operation) => {
      if (multipleSelection.value.length === 0) {
        ElMessage.warning('请选择要操作的商品')
        return
      }
      
      try {
        const ids = multipleSelection.value.map(item => item.id)
        const response = await mallApi.batchOperateProducts(ids, operation)
        
        if (response.code === 0) {
          ElMessage.success('批量操作成功')
          fetchData()
          fetchStatistics()
        } else {
          ElMessage.error(response.message || '批量操作失败')
        }
      } catch (error) {
        console.error('批量操作失败:', error)
        ElMessage.error('批量操作失败：' + (error.response?.data?.message || error.message))
      }
    }
    
    // 批量删除
    const handleBatchDelete = async () => {
      if (multipleSelection.value.length === 0) {
        ElMessage.warning('请选择要删除的商品')
        return
      }
      
      try {
        await ElMessageBox.confirm(
          `确定要删除选中的 ${multipleSelection.value.length} 个商品吗？此操作不可恢复！`,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const ids = multipleSelection.value.map(item => item.id)
        const response = await mallApi.batchDeleteProducts(ids)
        
        if (response.code === 0) {
          ElMessage.success('批量删除成功')
          fetchData()
          fetchStatistics()
        } else {
          ElMessage.error(response.message || '批量删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量删除失败:', error)
          ElMessage.error('批量删除失败：' + (error.response?.data?.message || error.message))
        }
      }
    }
    
    // 导出
    const handleExport = async () => {
      exportLoading.value = true
      try {
        // 这里可以实现导出功能
        ElMessage.info('导出功能开发中...')
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败：' + (error.response?.data?.message || error.message))
      } finally {
        exportLoading.value = false
      }
    }
    
    // 上传图片前验证
    const beforeImageUpload = (file) => {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2
      
      if (!isJPG) {
        ElMessage.error('图片只能是 JPG/PNG 格式!')
        return false
      }
      if (!isLt2M) {
        ElMessage.error('图片大小不能超过 2MB!')
        return false
      }
      return true
    }
    
    // 上传主图
    const uploadThumbnail = async (options) => {
      try {
        const response = await mallApi.uploadProductImage(options.file)
        
        if (response.code === 0) {
          productForm.thumbnail = response.data.url
          ElMessage.success('主图上传成功')
        } else {
          ElMessage.error(response.message || '主图上传失败')
        }
      } catch (error) {
        console.error('主图上传失败:', error)
        ElMessage.error('主图上传失败：' + (error.response?.data?.message || error.message))
      }
    }
    
    // 上传商品图片
    const uploadImage = async (options) => {
      try {
        const response = await mallApi.uploadProductImage(options.file)
        
        if (response.code === 0) {
          imageList.value.push({
            name: options.file.name,
            url: response.data.url
          })
          ElMessage.success('图片上传成功')
        } else {
          ElMessage.error(response.message || '图片上传失败')
        }
      } catch (error) {
        console.error('图片上传失败:', error)
        ElMessage.error('图片上传失败：' + (error.response?.data?.message || error.message))
      }
    }
    
    // 移除图片
    const handleRemoveImage = (file) => {
      const index = imageList.value.findIndex(item => item.name === file.name)
      if (index > -1) {
        imageList.value.splice(index, 1)
      }
    }
    
    // 获取完整图片URL
    const getFullImageUrl = (url) => {
      if (!url) return ''
      if (url.startsWith('http')) return url
      // 如果是相对路径，添加完整域名
      if (url.startsWith('/')) {
        return `https://pay.itapgo.com${url}`
      }
      return `https://pay.itapgo.com/${url}`
    }
    
    // 获取商品图片列表
    const getProductImages = (product) => {
      const images = []
      if (product.thumbnail) {
        images.push(getFullImageUrl(product.thumbnail))
      }
      
      // 处理images字段 - 可能是字符串或数组
      let productImages = []
      if (product.images) {
        if (typeof product.images === 'string') {
          try {
            productImages = JSON.parse(product.images)
          } catch (e) {
            console.warn('解析images字符串失败:', e)
            productImages = []
          }
        } else if (Array.isArray(product.images)) {
          productImages = product.images
        }
      }
      
      productImages.forEach(img => {
        images.push(getFullImageUrl(img))
      })
      
      return images
    }
    
    // 标签相关方法
    const showInput = () => {
      inputVisible.value = true
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
    
    const handleInputConfirm = () => {
      if (inputValue.value && !productForm.tags.includes(inputValue.value)) {
        productForm.tags.push(inputValue.value)
      }
      inputVisible.value = false
      inputValue.value = ''
    }
    
    const removeCustomTag = (tag) => {
      const index = productForm.tags.indexOf(tag)
      if (index > -1) {
        productForm.tags.splice(index, 1)
      }
    }
    
    // 批量设置标签
    const handleBatchSetTags = () => {
      if (multipleSelection.value.length === 0) {
        ElMessage.warning('请先选择商品')
        return
      }
      // 重置批量标签表单
      batchTagsForm.system_tags = []
      batchTagsForm.custom_tags = []
      batchTagsForm.action = 'add'
      batchTagsDialogVisible.value = true
    }
    
    // 批量标签相关方法
    const showBatchInput = () => {
      batchInputVisible.value = true
      nextTick(() => {
        batchInputRef.value?.focus()
      })
    }
    
    const handleBatchInputConfirm = () => {
      if (batchInputValue.value && !batchTagsForm.custom_tags.includes(batchInputValue.value)) {
        batchTagsForm.custom_tags.push(batchInputValue.value)
      }
      batchInputVisible.value = false
      batchInputValue.value = ''
    }
    
    const removeBatchCustomTag = (tag) => {
      const index = batchTagsForm.custom_tags.indexOf(tag)
      if (index > -1) {
        batchTagsForm.custom_tags.splice(index, 1)
      }
    }
    
    // 确认批量设置标签
    const confirmBatchSetTags = async () => {
      try {
        submitLoading.value = true
        
        const productIds = multipleSelection.value.map(item => item.id)
        
        // 构建标签数据
        const tags = {}
        
        // 系统标签
        batchTagsForm.system_tags.forEach(tag => {
          tags[tag] = true
        })
        
        // 自定义标签
        if (batchTagsForm.custom_tags.length > 0) {
          tags.custom_tags = batchTagsForm.custom_tags
        }
        
        const response = await mallApi.batchSetProductTags({
          product_ids: productIds,
          tags: tags,
          action: batchTagsForm.action
        })
        
        if (response.code === 0) {
          ElMessage.success(`成功${batchTagsForm.action === 'add' ? '添加' : batchTagsForm.action === 'remove' ? '移除' : '替换'}标签`)
          batchTagsDialogVisible.value = false
          fetchData()
          fetchStatistics()
        } else {
          ElMessage.error(response.message || '批量设置标签失败')
        }
      } catch (error) {
        console.error('批量设置标签失败:', error)
        ElMessage.error('批量设置标签失败：' + (error.response?.data?.message || error.message))
      } finally {
        submitLoading.value = false
      }
    }
    
    // 监听系统标签变化，同步到表单
    const updateSystemTags = () => {
      productForm.is_featured = systemTags.value.includes('is_featured')
      productForm.is_hot = systemTags.value.includes('is_hot')
      productForm.is_recommend = systemTags.value.includes('is_recommend')
      productForm.is_new = systemTags.value.includes('is_new')
      productForm.is_discount = systemTags.value.includes('is_discount')
      productForm.is_bestseller = systemTags.value.includes('is_bestseller')
      productForm.is_limited = systemTags.value.includes('is_limited')
      productForm.is_exclusive = systemTags.value.includes('is_exclusive')
    }
    
    // 监听systemTags变化
    watch(systemTags, updateSystemTags, { deep: true })

    onMounted(() => {
      fetchData()
      fetchStatistics()
      fetchCategories()
    })
    
    return {
      listLoading,
      submitLoading,
      exportLoading,
      list,
      total,
      statistics,
      categories,
      multipleSelection,
      listQuery,
      dialogFormVisible,
      detailDialogVisible,
      dialogStatus,
      activeTab,
      productFormRef,
      currentProduct,
      imageList,
      productForm,
      rules,
      fetchData,
      handleFilter,
      handleCreate,
      handleUpdate,
      handleView,
      createProduct,
      updateProduct,
      handleDelete,
      handleStatusChange,
      handleOnSaleChange,
      handleSortChange,
      handleSelectionChange,
      handleBatchOperation,
      handleBatchDelete,
      handleExport,
      beforeImageUpload,
      uploadThumbnail,
      uploadImage,
      handleRemoveImage,
      getFullImageUrl,
      getProductImages,
      // 标签相关
      systemTags,
      inputVisible,
      inputValue,
      inputRef,
      batchTagsDialogVisible,
      batchTagsForm,
      batchInputVisible,
      batchInputValue,
      batchInputRef,
      showInput,
      handleInputConfirm,
      removeCustomTag,
      handleBatchSetTags,
      showBatchInput,
      handleBatchInputConfirm,
      removeBatchCustomTag,
      confirmBatchSetTags
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  
  h2 {
    margin: 0 0 8px 0;
    color: #ffffff;
  }
  
  p {
    margin: 0;
    color: #ffffff;
    font-size: 14px;
  }
}

.stats-container {
  margin-bottom: 20px;
  
  .stat-card {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 20px;
    text-align: center;
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }
}

.filter-container {
  margin-bottom: 20px;
  
  .filter-item {
    margin-right: 10px;
    margin-bottom: 10px;
  }
}

.batch-container {
  margin-bottom: 20px;
  
  .batch-actions {
    margin-top: 10px;
    
    .el-button {
      margin-right: 10px;
    }
  }
}

.product-info {
  display: flex;
  align-items: center;
  
  .product-details {
    flex: 1;
    
    .product-name {
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .product-sku {
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }
    
    .product-category {
      font-size: 12px;
    }
  }
}

.price-info {
  .current-price {
    font-weight: bold;
    color: #f56c6c;
  }
  
  .original-price {
    font-size: 12px;
    color: #909399;
    text-decoration: line-through;
  }
}

.status-info {
  text-align: center;
}

.avatar-uploader {
  .avatar {
    width: 120px;
    height: 120px;
    display: block;
    border-radius: 4px;
  }
  
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 120px;
    height: 120px;
    line-height: 120px;
    text-align: center;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      border-color: #409eff;
    }
  }
}

.upload-demo {
  :deep(.el-upload--picture-card) {
    width: 120px;
    height: 120px;
  }
  
  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 120px;
    height: 120px;
  }
}

.el-upload__tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.product-detail {
  .el-descriptions {
    margin-bottom: 20px;
  }
  
  h4 {
    margin: 20px 0 10px 0;
    color: #303133;
  }
}
</style> 
