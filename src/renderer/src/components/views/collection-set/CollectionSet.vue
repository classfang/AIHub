<script setup lang="ts">
import { Modal } from '@arco-design/web-vue'
import AssistantAvatar from '@renderer/components/avatar/AssistantAvatar.vue'
import UserAvatar from '@renderer/components/avatar/UserAvatar.vue'
import { useCollectionSetStore } from '@renderer/store/collection-set'
import { formatDateTime } from '@renderer/utils/date-util'
import { nowTimestamp } from '@renderer/utils/date-util'
import { downloadFile } from '@renderer/utils/download-util'
import { exportTextFile } from '@renderer/utils/download-util'
import { renderMarkdown } from '@renderer/utils/markdown-util'
import { computed, reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

const collectionSetStore = useCollectionSetStore()
const { t } = useI18n()

const data = reactive({
  keyword: '',
  collectionItemType: 'all' as 'all' | CollectionItemType,
  currentCollectionItemId: ''
})
const { keyword, collectionItemType, currentCollectionItemId } = toRefs(data)

// 当前选中的收藏
const currentCollectionItem = computed(() => {
  return collectionSetStore.collectionItemList.find((c) => c.id === data.currentCollectionItemId)
})

// 条件过滤
const collectionItemListFilter = computed(() => {
  let filterResult = collectionSetStore.collectionItemList
  if (data.collectionItemType !== 'all') {
    filterResult = collectionSetStore.collectionItemList.filter(
      (item) => item.type === data.collectionItemType
    )
  }
  return filterResult.filter(
    (item) =>
      (item.chat &&
        item.chat.chatMessageList.findIndex((msg) => msg.content.includes(data.keyword)) >= 0) ||
      (item.image && item.image.prompt?.includes(data.keyword)) ||
      item.note?.content.includes(data.keyword)
  )
})

// 删除
const deleteConfirm = (id: string) => {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: t('common.deleteConfirmContent'),
    okText: t('common.ok'),
    cancelText: t('common.cancel'),
    onOk: () => {
      const index = collectionSetStore.collectionItemList.findIndex((c) => c.id === id)
      if (index >= 0) {
        collectionSetStore.collectionItemList.splice(index, 1)
      }
    }
  })
}

// 导出
const exportChatMessageList = (id: string) => {
  const collectionSet = collectionSetStore.collectionItemList.find((c) => c.id === id)
  if (!collectionSet) {
    return
  }
  const content = collectionSet.chat?.chatMessageList
    .map((r) => r.role + ': \n' + r.content)
    .join('\n\n')
  exportTextFile(`records-${nowTimestamp()}.md`, content)
}
</script>

<template>
  <div class="collection-set">
    <div class="collection-set-left">
      <div class="collection-set-list-search drag-area">
        <div class="search-type-select no-drag-area">
          <a-select v-model="collectionItemType">
            <a-option value="all">{{ $t('collectionSet.type.all') }}</a-option>
            <a-option value="chat">{{ $t('collectionSet.type.chat') }}</a-option>
            <a-option value="image">{{ $t('collectionSet.type.image') }}</a-option>
          </a-select>
        </div>
        <a-input-search
          v-model="keyword"
          :placeholder="$t('collectionSet.search')"
          class="search-input no-drag-area"
        />
      </div>
      <a-scrollbar
        outer-class="collection-set-list-container arco-scrollbar-small"
        style="height: calc(100vh - 60px); overflow-y: auto"
      >
        <div class="collection-set-list">
          <div
            v-for="c in collectionItemListFilter"
            :key="c.id"
            class="collection"
            :class="{ 'collection-active': c.id === currentCollectionItemId }"
            @click="currentCollectionItemId = c.id"
          >
            <div class="collection-body">
              <template v-if="c.type === 'chat'">
                <AssistantAvatar
                  :size="35"
                  :provider="c.chat?.provider"
                  class="collection-avatar"
                />
                <div class="collection-content">
                  {{
                    c.chat?.chatMessageList[0].content
                      ? c.chat?.chatMessageList[0].content
                      : c.chat?.chatMessageList[0].image
                        ? $t('assistantItem.content.image')
                        : ''
                  }}
                </div>
              </template>
              <template v-else-if="c.type === 'image'">
                <AssistantAvatar
                  :size="35"
                  :provider="c.image?.provider"
                  class="collection-avatar"
                />
                <div class="collection-content">
                  {{ c.image?.prompt }}
                </div>
              </template>
            </div>
            <div class="collection-footer">
              <div class="collection-time">{{ formatDateTime(new Date(c.createTime)) }}</div>
              <a-popover
                position="br"
                trigger="click"
                :content-style="{ padding: '5px' }"
                @click.stop
              >
                <icon-more style="font-size: 15px; font-weight: 500; flex-shrink: 0" />
                <template #content>
                  <a-space direction="vertical" fill>
                    <a-button
                      type="text"
                      style="width: 100%"
                      status="danger"
                      size="small"
                      @click="deleteConfirm(c.id)"
                      >{{ $t('common.delete') }}</a-button
                    >
                    <a-button
                      v-if="c.type === 'chat'"
                      type="text"
                      style="width: 100%; color: var(--color-text-1)"
                      size="small"
                      @click="exportChatMessageList(c.id)"
                      >{{ $t('common.export') }}</a-button
                    >
                  </a-space>
                </template>
              </a-popover>
            </div>
          </div>
          <div v-if="collectionItemListFilter.length === 0" class="collection-set-list-empty">
            <a-empty description=" " />
          </div>
        </div>
      </a-scrollbar>
    </div>
    <div class="collection-set-right">
      <template v-if="currentCollectionItem">
        <div class="collection-set-header drag-area">
          <div class="assistant-name">
            <template v-if="currentCollectionItem.type === 'chat'">
              {{ currentCollectionItem.chat?.name }}
            </template>
            <template v-else-if="currentCollectionItem.type === 'image'">
              {{ $t('aiDrawing.name') }}
            </template>
          </div>
          <div class="assistant-desc">
            <a-space :size="10">
              <template v-if="currentCollectionItem.type === 'chat'">
                <a-tag>{{ $t(`bigModelProvider.${currentCollectionItem.chat?.provider}`) }}</a-tag>
                <a-tag>{{ currentCollectionItem.chat?.model }}</a-tag>
              </template>
              <template v-else-if="currentCollectionItem.type === 'image'">
                <a-tag>{{ $t(`bigModelProvider.${currentCollectionItem.image?.provider}`) }}</a-tag>
                <a-tag>{{ currentCollectionItem.image?.model }}</a-tag>
              </template>
            </a-space>
          </div>
        </div>
        <template v-if="currentCollectionItem.type === 'chat'">
          <a-scrollbar
            outer-class="chat-message-list-container arco-scrollbar-small"
            style="height: calc(100vh - 55px); overflow-y: auto"
          >
            <div class="chat-message-list">
              <div
                v-for="msg in currentCollectionItem.chat?.chatMessageList"
                :key="msg.id"
                class="chat-message"
              >
                <div class="chat-message-avatar">
                  <UserAvatar v-if="msg.role === 'user'" :size="30" />
                  <AssistantAvatar
                    v-else-if="msg.role === 'assistant'"
                    :provider="currentCollectionItem.chat?.provider"
                    :size="30"
                  />
                </div>
                <div class="chat-message-content select-text">
                  <div v-if="msg.role === 'user'">{{ msg.content }}</div>
                  <div
                    v-else-if="msg.role === 'assistant'"
                    class="chat-message-md"
                    v-html="renderMarkdown(msg.content, false)"
                  ></div>
                  <a-image
                    v-if="msg.image"
                    width="300"
                    height="300"
                    :src="`file://${msg.image}`"
                    show-loader
                    fit="cover"
                  >
                    <template #preview-actions>
                      <a-image-preview-action
                        :name="$t('common.download')"
                        @click="downloadFile(`file://${msg.image}`, `img-${msg.id}.png`)"
                        ><icon-download
                      /></a-image-preview-action>
                    </template>
                  </a-image>
                </div>
              </div>
            </div>
          </a-scrollbar>
        </template>
        <template v-else-if="currentCollectionItem.type === 'image'">
          <div class="collection-set-image-detail">
            <a-image
              width="500"
              height="500"
              :src="`file://${currentCollectionItem.image?.imageList[0]}`"
              show-loader
              fit="cover"
            >
              <template #preview-actions>
                <a-image-preview-action
                  :name="$t('common.download')"
                  @click="
                    downloadFile(
                      `file://${currentCollectionItem.image?.imageList[0]}`,
                      `img-${currentCollectionItem.image?.imageList[0]}`
                    )
                  "
                >
                  <icon-download />
                </a-image-preview-action>
              </template>
            </a-image>
            <div class="collection-set-image-detail-prompt">
              {{ currentCollectionItem.image?.prompt }}
            </div>
          </div>
        </template>
      </template>
      <div v-else class="collection-window-empty drag-area">
        <a-empty>
          <template #image>
            <icon-common />
          </template>
          {{ $t('collectionSet.empty') }}
        </a-empty>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '../../../assets/css/chat-window.less';

.collection-set {
  width: 100%;
  flex-grow: 1;
  display: flex;
  overflow: hidden;

  .collection-set-left {
    flex-shrink: 0;
    width: 270px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 15px;
    border-right: 1px solid var(--color-border-1);
    box-sizing: border-box;

    .collection-set-list-search {
      box-sizing: border-box;
      padding: 15px 15px 0 15px;
      display: flex;

      .search-type-select {
        flex-shrink: 0;
        width: 80px;

        :deep(.arco-select-view-single) {
          border: none;
          background-color: var(--color-fill-2);
        }
      }

      .search-input {
        flex-grow: 1;
        border: none;
        background-color: var(--color-fill-2);
      }
    }

    .collection-set-list-container {
      .collection-set-list {
        min-height: 100%;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-sizing: border-box;
        padding: 0 15px 15px 15px;

        .collection-set-list-empty {
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .collection {
          box-sizing: border-box;
          padding: 15px;
          background-color: var(--color-fill-1);
          border-radius: var(--border-radius-small);
          display: flex;
          flex-direction: column;
          gap: 15px;

          .collection-body {
            flex-grow: 1;
            display: flex;
            gap: 10px;
            .collection-avatar {
              flex-shrink: 0;
              margin-top: 3px;
            }

            .collection-content {
              flex-grow: 1;
              line-height: 1.3rem;
              overflow: hidden;
              display: -webkit-box;
              text-overflow: ellipsis;
              word-break: break-all;
              line-break: anywhere;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 2;
            }
          }

          .collection-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            .collection-time {
              flex-shrink: 0;
              font-size: 13px;
            }
          }
        }

        .collection-active {
          background-color: var(--color-fill-3);
        }
      }
    }
  }

  .collection-set-right {
    flex-grow: 1;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .collection-set-header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      border-bottom: 1px solid var(--color-border-1);
      box-sizing: border-box;
      padding: 15px;

      .assistant-name {
        font-size: 16px;
        font-weight: 500;
      }

      .assistant-desc {
        margin-left: auto;
      }
    }

    .collection-set-image-detail {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      box-sizing: border-box;
      padding: 15px;

      .collection-set-image-detail-prompt {
        line-height: 1.3rem;
        white-space: pre-wrap;
        line-break: anywhere;
        text-align: center;
        width: 100%;
        max-height: 100px;
        overflow-y: auto;
      }
    }

    .collection-window-empty {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
