<script setup lang="ts">
definePageMeta({ ssr: false })

import { db, type Dog, type DailyLog } from '~/composables/useDb'

const dogs = ref<Dog[]>([])
const selectedDogId = ref<string>('')

const logs = ref<DailyLog[]>([])
const debug = ref<string>('')

const loadDogs = async () => {
  dogs.value = await db.dogs.toArray()
  if (!selectedDogId.value && dogs.value.length) {
    selectedDogId.value = dogs.value[0].id
  }
}

const loadLogs = async () => {
  logs.value = []
  debug.value = ''

  if (!selectedDogId.value) {
    debug.value = 'selectedDogId が空です'
    return
  }

  // まず総数を出して「DBに入ってるか」を確認
  const total = await db.daily_logs.count()

  // dogIdで絞って取得（確実）
  const dogId = selectedDogId.value
  const rows = await db.daily_logs.where('dogId').equals(dogId).toArray()

  // 日付降順に並べる（YYYY-MM-DD なので文字列ソートでOK）
  rows.sort((a, b) => (a.logDate < b.logDate ? 1 : -1))

  logs.value = rows.slice(0, 30)

  debug.value = `dogs=${dogs.value.length}, selectedDogId=${dogId}, daily_logs(total)=${total}, daily_logs(for dog)=${rows.length}`
}

const formatMemo = (m?: string) => {
  if (!m) return '—'
  const s = m.replace(/\s+/g, ' ').trim()
  return s.length > 30 ? s.slice(0, 30) + '…' : s
}

onMounted(async () => {
  await loadDogs()
  await loadLogs()
})

watch(selectedDogId, async () => {
  await loadLogs()
})
</script>

<template>
  <div style="padding:40px; max-width:720px">
    <h1>履歴一覧（直近30件）</h1>

    <div style="margin:16px 0; display:flex; gap:12px; align-items:center;">
      <label>
        犬：
        <select v-model="selectedDogId" style="padding:6px; min-width:240px;">
          <option v-for="d in dogs" :key="d.id" :value="d.id">
            {{ d.name }}
          </option>
        </select>
      </label>

      <button @click="loadLogs">再読み込み</button>
      <NuxtLink to="/" style="margin-left:auto;">← ダッシュボード</NuxtLink>
    </div>

    <p style="font-size:12px; color:#666;">{{ debug }}</p>

    <div v-if="!selectedDogId" style="padding:12px; background:#f5f5f5;">
      犬が未選択です
    </div>

    <div v-else-if="logs.length === 0" style="padding:12px; background:#f5f5f5;">
      まだ履歴がありません（まずは今日のログを作ってみてね）
    </div>

    <table v-else style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">日付</th>
          <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">体重(kg)</th>
          <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">メモ</th>
          <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">操作</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="log in logs" :key="log.id">
          <td style="padding:8px; border-bottom:1px solid #eee;">{{ log.logDate }}</td>
          <td style="padding:8px; border-bottom:1px solid #eee;">{{ log.weight ?? '—' }}</td>
          <td style="padding:8px; border-bottom:1px solid #eee;">{{ formatMemo(log.memo) }}</td>
          <td style="padding:8px; border-bottom:1px solid #eee;">
            <NuxtLink
              :to="`/logs/${log.logDate}?dogId=${selectedDogId}`"
              style="text-decoration:underline;"
            >
              編集
            </NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>