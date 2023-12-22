<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const props = defineProps({
  knowledgeBase: {
    type: Object as () => KnowledgeBase,
    default: () => {}
  }
})

const knowledgeBaseForm = ref(props.knowledgeBase)

const emit = defineEmits(['update:knowledge-base'])

watchEffect(() => {
  emit('update:knowledge-base', knowledgeBaseForm.value)
})
</script>

<template>
  <a-form :model="knowledgeBaseForm" layout="vertical">
    <a-form-item field="name" :label="$t('knowledgeBase.list.name')">
      <a-input
        v-model="knowledgeBaseForm.name"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.name')"
        :max-length="20"
      />
    </a-form-item>
    <a-form-item field="description" :label="$t('knowledgeBase.list.description')">
      <a-textarea
        v-model="knowledgeBaseForm.description"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.description')"
        :max-length="200"
      />
    </a-form-item>
    <a-form-item field="indexName" :label="$t('knowledgeBase.list.indexName')">
      <a-input
        v-model="knowledgeBaseForm.indexName"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.indexName')"
        :max-length="20"
      />
    </a-form-item>
    <a-form-item field="url" :label="$t('knowledgeBase.list.redisConfig.url')">
      <a-input
        v-model="knowledgeBaseForm.redisConfig.url"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.redisConfig.url')"
      />
    </a-form-item>
    <a-form-item field="username" :label="$t('knowledgeBase.list.redisConfig.username')">
      <a-input
        v-model="knowledgeBaseForm.redisConfig.username"
        :placeholder="
          $t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.redisConfig.username')
        "
      />
    </a-form-item>
    <a-form-item field="password" :label="$t('knowledgeBase.list.redisConfig.password')">
      <a-input
        v-model="knowledgeBaseForm.redisConfig.password"
        :placeholder="
          $t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.redisConfig.password')
        "
      />
    </a-form-item>
    <a-form-item field="database" :label="$t('knowledgeBase.list.redisConfig.database')">
      <a-input-number
        v-model="knowledgeBaseForm.redisConfig.database"
        :placeholder="
          $t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.redisConfig.database')
        "
        :min="0"
      />
    </a-form-item>
  </a-form>
</template>

<style scoped lang="less"></style>
