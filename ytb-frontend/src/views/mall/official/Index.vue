<template>
  <div class="official-mall">
    <el-card shadow="never" class="nav-card">
      <el-menu
        mode="horizontal"
        :default-active="activePath"
        @select="handleSelect"
        class="sub-nav"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon v-if="item.icon" class="item-icon">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-card>

    <div class="sub-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataLine,
  Tickets,
  List,
  GoodsFilled,
  Van,
  User
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { path: '/mall/official/dashboard', title: '首页概览', icon: DataLine },
  { path: '/mall/official/categories', title: '商品分类', icon: Tickets },
  { path: '/mall/official/orders', title: '订单管理', icon: List },
  { path: '/mall/official/products', title: '商品列表', icon: GoodsFilled },
  { path: '/mall/official/logistics', title: '物流管理', icon: Van },
  { path: '/mall/official/users', title: '用户管理', icon: User }
]

const activePath = computed(() => {
  const current = menuItems.find(item => route.path.startsWith(item.path))
  return current ? current.path : menuItems[0].path
})

const handleSelect = (path) => {
  if (path !== route.path) {
    router.push(path)
  }
}
</script>

<style scoped lang="scss">
.official-mall {
  min-height: 100%;

  .nav-card {
    margin-bottom: 16px;
    border-radius: 8px;
  }

  .sub-nav {
    border-bottom: none;
  }

  :deep(.el-menu--horizontal > .el-menu-item) {
    height: 48px;
    line-height: 48px;
    margin-right: 8px;
    border-radius: 6px;
  }

  :deep(.el-menu-item.is-active) {
    background: #f0f5ff;
    color: #2468f2;
  }

  .item-icon {
    margin-right: 4px;
  }

  .sub-content {
    background: #fff;
    border-radius: 8px;
    padding: 0;
  }
}
</style>
