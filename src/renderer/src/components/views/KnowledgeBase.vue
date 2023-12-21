<!-- https://js.langchain.com/docs/use_cases/question_answering/ -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingStore } from '@renderer/store/setting'
import { useI18n } from 'vue-i18n'

const settingStore = useSettingStore()
const { t } = useI18n()

onMounted(() => {})
</script>

<template>
  <div class="knowledge-base"></div>
</template>

<style scoped lang="less">
.knowledge-base {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
</style>
