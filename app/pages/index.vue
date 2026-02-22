<script setup lang="ts">
definePageMeta({ ssr: false })
import { db, type Dog, type DailyLog } from '~/composables/useDb'
import { v4 as uuidv4 } from 'uuid'

const dogs = ref<Dog[]>([])
const selectedDogId = ref<string>('')

const weight = ref<string>('') // 入力は文字で受けて後で数値化
const memo = ref<string>('')

const status = ref<string>('')

// JSTの「今日」を YYYY-MM-DD で作る（Phase0はJST固定）
const todayJst = () => {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

const loadDogs = async () => {
  dogs.value = await db.dogs.toArray()
  if (!selectedDogId.value && dogs.value.length) {
    selectedDogId.value = dogs.value[0].id
  }
}

const addDog = async () => {
  await db.dogs.add({
    id: uuidv4(),
    name: `しーたん${dogs.value.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  await loadDogs()
}

const clearDogs = async () => {
  await db.dogs.clear()
  await db.daily_logs.clear()
  selectedDogId.value = ''
  status.value = 'dogs/daily_logs を全削除しました'
  await loadDogs()
}

const validateWeight = (v: string) => {
  if (v.trim() === '') return { ok: true, value: undefined as number | undefined } // 未入力OK
  const num = Number(v)
  if (Number.isNaN(num)) return { ok: false, message: '体重は数値で入力してください' }
  if (num <= 0) return { ok: false, message: '体重は0より大きい値にしてください' }
  if (num < 0.1 || num > 30) return { ok: false, message: '体重は0.1〜30kgの範囲にしてください' }
  // 0.01kg単位まで（10g）に丸め
  const rounded = Math.round(num * 100) / 100
  return { ok: true, value: rounded }
}

const upsertTodayLog = async () => {
  status.value = ''
  if (!selectedDogId.value) {
    status.value = '犬を選択してください'
    return
  }

  const vd = validateWeight(weight.value)
  if (!vd.ok) {
    status.value = vd.message!
    return
  }

  const logDate = todayJst()
  const nowIso = new Date().toISOString()

  // 同一犬・同一日があれば更新（編集へ誘導の簡易版）
  const existing = await db.daily_logs
    .where('[dogId+logDate]')
    .equals([selectedDogId.value, logDate])
    .first()

  if (existing) {
    await db.daily_logs.update(existing.id, {
      weight: vd.value,
      memo: memo.value || undefined,
      updatedAt: nowIso
    })
    status.value = `✅ 既存ログを更新しました（${logDate}）`
    return
  }

  const newLog: DailyLog = {
    id: uuidv4(),
    dogId: selectedDogId.value,
    logDate,
    weight: vd.value,
    memo: memo.value || undefined,
    createdAt: nowIso,
    updatedAt: nowIso
  }

  await db.daily_logs.add(newLog)
  status.value = `✅ 新規ログを作成しました（${logDate}）`
}

const todayLog = ref<DailyLog | null>(null)

const loadTodayLog = async () => {
  if (!selectedDogId.value) {
    todayLog.value = null
    return
  }
  const logDate = todayJst()
  todayLog.value =
    (await db.daily_logs
      .where('[dogId+logDate]')
      .equals([selectedDogId.value, logDate])
      .first()) ?? null
}

watch(selectedDogId, () => {
  loadTodayLog()
})
await loadTodayLog()

onMounted(async () => {
  await loadDogs()
  await loadTodayLog()
})
</script>

<template>
  <div style="padding:40px; max-width:720px">
    <h1>いのちだいじ MVP</h1>

    <div style="display:flex; gap:8px; margin:16px 0;">
      <button @click="addDog">犬を追加</button>
      <button @click="clearDogs">全削除</button>
      <button @click="loadDogs">再読み込み</button>
    </div>

    <h2>犬選択</h2>
    <select v-model="selectedDogId" style="padding:6px; min-width:240px">
      <option v-for="d in dogs" :key="d.id" :value="d.id">
        {{ d.name }}
      </option>
    </select>

    <hr style="margin:20px 0;" />

    <h2>今日のログ（{{ todayJst() }}）</h2>

    <p v-if="todayLog">
      <b>保存済み：</b>
      体重={{ todayLog.weight ?? '未入力' }} / メモ={{ todayLog.memo ?? '未入力' }}
    </p>
    <p v-else>未作成です</p>

    <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px">
      <label>
        体重(kg)
        <input v-model="weight" inputmode="decimal" placeholder="例: 3.25" style="margin-left:8px; padding:6px;" />
      </label>

      <label>
        メモ
        <textarea v-model="memo" rows="3" placeholder="任意" style="display:block; width:100%; padding:8px; margin-top:6px;"></textarea>
      </label>

      <button @click="upsertTodayLog" style="padding:10px 14px;">保存（新規/更新）</button>

      <p v-if="status" style="margin:0; padding:10px; background:#f5f5f5;">{{ status }}</p>
    </div>
    <NuxtLink to="/history">履歴一覧へ</NuxtLink>
    <hr style="margin:20px 0;" />

    <h2>犬一覧</h2>
    <ul v-if="dogs.length">
      <li v-for="d in dogs" :key="d.id">{{ d.name }} ({{ d.id }})</li>
    </ul>
    <p v-else>まだ犬がいません</p>
  </div>
</template>