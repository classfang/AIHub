<script setup lang="ts">
import { reactive, toRefs } from 'vue'
import { useSettingStore } from '@renderer/store/setting'
import { useCalendarStore } from '@renderer/store/calendar'

// Store
const settingStore = useSettingStore()
const calendarStore = useCalendarStore()

// 数据绑定
const data = reactive({
  dayModalVisible: false,
  currentDate: new Date(),
  currentDayReport: undefined as CalendarDayReport | undefined
})
const { dayModalVisible, currentDate, currentDayReport } = toRefs(data)

// 日期切换
const calendarChange = (date: Date) => {
  data.currentDate = date
  data.currentDayReport = getReport(date.getFullYear(), date.getMonth() + 1, date.getDay())
  data.dayModalVisible = true
}

// 获取报告内容
const getReport = (year: number, month?: number, day?: number) => {
  const yearReport = calendarStore.calendarYearReportList.find((r) => r.dateSub === year)
  if (!month) {
    return yearReport
  }
  const monthReport = yearReport?.monthReportList.find((r) => r.dateSub === month)
  if (!day) {
    return monthReport
  }
  return monthReport?.dayReportList.find((r) => r.dateSub === day)
}
</script>

<template>
  <div class="ai-calendar">
    <!-- 头部 -->
    <div class="ai-calendar-header drag-area">
      <div class="ai-calendar-header-title">{{ $t('aiCalendar.name') }}</div>
    </div>
    <!-- 主体 -->
    <div class="ai-calendar-body">
      <div class="calendar">
        <a-calendar :key="'calendar-' + settingStore.app.locale" @change="calendarChange" />
      </div>
    </div>
    <!-- 日报Modal -->
    <a-modal
      v-model:visible="dayModalVisible"
      :ok-text="$t('common.ok')"
      :cancel-text="$t('common.cancel')"
      unmount-on-close
      title-align="start"
      width="80vw"
    >
      <template #title> {{ $t('aiCalendar.dayReport.name') }} </template>
      <div style="height: 60vh; overflow-y: auto">
        {{ currentDate }}
        {{ currentDayReport }}
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.ai-calendar {
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  .ai-calendar-header {
    flex-shrink: 0;
    height: 40px;
    border-bottom: 1px solid var(--color-border-1);
    box-sizing: border-box;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .ai-calendar-header-title {
      flex-grow: 1;
      font-size: 15px;
      font-weight: 500;
    }
  }

  .ai-calendar-body {
    flex-grow: 1;
    min-height: 0;
    display: flex;

    .calendar {
      width: 100%;
      flex: 1;
      min-height: 0;

      :deep(.arco-calendar) {
        height: 100%;
        display: flex;
        flex-direction: column;
        border: none;

        .arco-calendar-header {
          flex-shrink: 0;
          padding: 15px;
        }

        .arco-calendar-body {
          flex: 1;
          min-height: 0;

          .arco-calendar-month {
            height: 100%;
            display: flex;
            flex-direction: column;

            .arco-calendar-week-list {
              flex-shrink: 0;
            }

            .arco-calendar-month-cell-body {
              flex: 1;
              min-height: 0;
              display: flex;
              flex-direction: column;

              .arco-calendar-month-row {
                flex: 1;
              }
            }
          }

          .arco-calendar-year {
            height: 100%;
            overflow-y: auto;
          }
        }
      }
    }
  }
}
</style>
