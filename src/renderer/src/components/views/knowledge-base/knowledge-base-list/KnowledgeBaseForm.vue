<script setup lang="ts">
import { openInBrowser } from '@renderer/utils/window-util'

const knowledgeBase = defineModel<KnowledgeBase>('knowledgeBase', { default: () => ({}) })
</script>

<template>
  <a-form :model="knowledgeBase" layout="vertical">
    <a-form-item field="name" :label="$t('knowledgeBase.list.name')">
      <a-input
        v-model="knowledgeBase.name"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.name')"
        :max-length="20"
      />
    </a-form-item>
    <a-form-item field="description" :label="$t('knowledgeBase.list.description')">
      <a-textarea
        v-model="knowledgeBase.description"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.description')"
        :max-length="200"
        allow-clear
      />
    </a-form-item>
    <a-form-item field="indexName" :label="$t('knowledgeBase.list.indexName')">
      <a-input
        v-model="knowledgeBase.indexName"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.indexName')"
        :max-length="20"
      />
    </a-form-item>
    <a-form-item field="url" :label="$t('knowledgeBase.list.redisConfig.url')">
      <a-input
        v-model="knowledgeBase.redisConfig.url"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.redisConfig.url')"
      />
    </a-form-item>
    <a-form-item field="username" :label="$t('knowledgeBase.list.redisConfig.username')">
      <a-input
        v-model="knowledgeBase.redisConfig.username"
        :placeholder="
          $t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.redisConfig.username')
        "
      />
    </a-form-item>
    <a-form-item field="password" :label="$t('knowledgeBase.list.redisConfig.password')">
      <a-input-password
        v-model="knowledgeBase.redisConfig.password"
        :placeholder="
          $t('common.pleaseEnter') + ' ' + $t('knowledgeBase.list.redisConfig.password')
        "
      />
    </a-form-item>
    <a-form-item>
      <a-link @click="openInBrowser('https://redis.io/docs/install/install-stack/')">{{
        $t('knowledgeBase.list.redisDoc')
      }}</a-link>
    </a-form-item>
  </a-form>
</template>

<style scoped lang="less"></style>
