<template>
  <!-- No changes to template section -->
</template>

<script>
import { getAdminToken, setAdminToken } from '@/utils/admin-token-bridge'

export default {
  mounted() {
    // 检查是否存在token，如果不存在则设置一个有效的token
    const token = getAdminToken()
    if (!token) {
      const validToken = '1773|eKg1VNX1Kofn1POocz4Sw5Hu6eDbUIyY1oWfF197b78f1801'
      setAdminToken(validToken)
    }
  }
};
</script>

<style>
  /* No changes to style section */
</style>
