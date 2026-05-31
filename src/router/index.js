import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/cpu-schedule',
    name: 'CpuSchedule',
    component: () => import('../views/CpuSchedule.vue'),
  },
  {
    path: '/producer-consumer',
    name: 'ProducerConsumer',
    component: () => import('../views/ProducerConsumer.vue'),
  },
  {
    path: '/banker',
    name: 'Banker',
    component: () => import('../views/Banker.vue'),
  },
  {
    path: '/page-replace',
    name: 'PageReplace',
    component: () => import('../views/PageReplace.vue'),
  },
  {
    path: '/disk-schedule',
    name: 'DiskSchedule',
    component: () => import('../views/DiskSchedule.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
