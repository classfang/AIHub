<script setup lang="ts">
import { reactive, toRefs } from 'vue'
import { useSettingStore } from '@renderer/store/setting'
import { useCalendarStore } from '@renderer/store/calendar'
import { randomUUID } from '@renderer/utils/id-util'
import { nowTimestamp } from '@renderer/utils/date-util'
import { copyObj } from '@renderer/utils/object-util'

// Store
const settingStore = useSettingStore()
const calendarStore = useCalendarStore()

// 数据绑定
const data = reactive({
  dayModalVisible: false,
  currentDate: new Date(),
  currentDayReport: {} as CalendarReport
})
const { dayModalVisible, currentDayReport } = toRefs(data)

// 日期切换
const calendarChange = (date: Date) => {
  data.currentDate = date
  let dayReport = getReport(date.getFullYear(), date.getMonth() + 1, date.getDay())
  if (!dayReport) {
    dayReport = {
      id: randomUUID(),
      content: '',
      createTime: nowTimestamp(),
      updateTime: nowTimestamp(),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDay()
    }
  }
  data.currentDayReport = dayReport
  data.dayModalVisible = true
}

// 获取报告内容
const getReport = (year: number, month?: number, day?: number) => {
  if (day && month) {
    return copyObj(
      calendarStore.dayReportList.find((r) => r.year === year && r.month === month && r.day === day)
    )
  } else if (month) {
    return copyObj(calendarStore.monthReportList.find((r) => r.year === year && r.month === month))
  } else {
    return copyObj(calendarStore.yearReportList.find((r) => r.year === year))
  }
}

// 保存报告
const setReport = (report: CalendarReport) => {
  if (report.day && report.month) {
    const index = calendarStore.dayReportList.findIndex(
      (r) => r.year === report.year && r.month === report.month && r.day === report.day
    )
    if (index > -1) {
      calendarStore.dayReportList[index] = report
    } else {
      calendarStore.dayReportList.push(report)
    }
  } else if (report.month) {
    const index = calendarStore.monthReportList.findIndex(
      (r) => r.year === report.year && r.month === report.month
    )
    if (index > -1) {
      calendarStore.monthReportList[index] = report
    } else {
      calendarStore.monthReportList.push(report)
    }
  } else {
    const index = calendarStore.yearReportList.findIndex((r) => r.year === report.year)
    if (index > -1) {
      calendarStore.yearReportList[index] = report
    } else {
      calendarStore.yearReportList.push(report)
    }
  }
}

// 日报保存
const handleDayModalBeforeOk = async () => {
  setReport(data.currentDayReport)
  return true
}
</script>

<template>
  <div class="ai-calendar">
    <!-- 头部 -->
    <div class="ai-calendar-header drag-area">
      <div class="ai-calendar-header-title">{{ $t('aiCalendar.name') }}</div>
      <div class="ai-calendar-header-btn-group no-drag-area">
        <a-space :size="10">
          <a-button size="mini">{{ $t('aiCalendar.weekReport') }}</a-button>
          <a-button size="mini">{{ $t('aiCalendar.monthReport') }}</a-button>
          <a-button size="mini">{{ $t('aiCalendar.yearReport') }}</a-button>
        </a-space>
      </div>
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
      :on-before-ok="handleDayModalBeforeOk"
      unmount-on-close
      title-align="start"
      width="80vw"
    >
      <template #title> {{ $t('aiCalendar.dayReport.name') }} </template>
      <div class="day-report-modal">
        <a-textarea
          v-model="currentDayReport.content"
          class="day-report-modal-textarea"
          allow-clear
          :placeholder="$t('common.pleaseEnter') + ' ' + $t('aiCalendar.dayReport.content')"
        />
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

    .ai-calendar-header-btn-group {
      flex-shrink: 0;
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

.day-report-modal {
  height: 60vh;
  overflow-y: auto;

  .day-report-modal-textarea {
    border: none;
    background-color: var(--color-fill-2);
    height: 100%;
    display: flex;

    :deep(.arco-textarea) {
      resize: none;
      flex-grow: 1;
    }
  }
}
</style>
