import {
  computed,
  defineComponent,
  h,
  inject,
  reactive,
  type App,
  type Component,
  type InjectionKey,
  type PropType,
} from 'vue'

export interface RouteLocationNormalizedLoaded {
  fullPath: string
  path: string
  name?: string
}

export interface RouteRecordRaw {
  path: string
  name?: string
  component?: Component
  redirect?: string
}

interface RouterOptions {
  history: ReturnType<typeof createWebHistory>
  routes: RouteRecordRaw[]
}

interface Router {
  currentRoute: RouteLocationNormalizedLoaded
  routes: RouteRecordRaw[]
  install(app: App): void
  push(path: string): void
  replace(path: string): void
}

const routerKey: InjectionKey<Router> = Symbol('router')
const routeKey: InjectionKey<RouteLocationNormalizedLoaded> = Symbol('route')

function getCurrentPath(): string {
  if (typeof window === 'undefined') {
    return '/'
  }

  return window.location.pathname || '/'
}

function normalizeLocation(path: string, routes: RouteRecordRaw[]): RouteLocationNormalizedLoaded {
  const matchedRoute = resolveRouteRecord(path, routes)

  return {
    fullPath: path,
    path,
    name: matchedRoute?.name,
  }
}

function resolveRouteRecord(path: string, routes: RouteRecordRaw[]): RouteRecordRaw | undefined {
  return (
    routes.find((route) => route.path === path) ??
    routes.find((route) => route.path === '/:pathMatch(.*)*')
  )
}

function resolveTargetPath(path: string, routes: RouteRecordRaw[], seen = new Set<string>()): string {
  const matchedRoute = resolveRouteRecord(path, routes)

  if (!matchedRoute?.redirect) {
    return path
  }

  if (seen.has(path)) {
    return path
  }

  seen.add(path)
  return resolveTargetPath(matchedRoute.redirect, routes, seen)
}

function updateBrowserLocation(path: string, replace: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  const method = replace ? 'replaceState' : 'pushState'
  window.history[method](null, '', path)
}

export function createWebHistory() {
  return {
    location: getCurrentPath(),
  }
}

export function createRouter({ history, routes }: RouterOptions): Router {
  const initialPath = resolveTargetPath(getCurrentPath(), routes)
  const currentRoute = reactive(normalizeLocation(initialPath, routes))

  function applyNavigation(rawPath: string, replace = false): void {
    const nextPath = resolveTargetPath(rawPath, routes)

    if (currentRoute.path === nextPath && !replace) {
      return
    }

    currentRoute.fullPath = nextPath
    currentRoute.path = nextPath
    currentRoute.name = resolveRouteRecord(nextPath, routes)?.name
    history.location = nextPath
    updateBrowserLocation(nextPath, replace)
  }

  if (initialPath !== getCurrentPath()) {
    updateBrowserLocation(initialPath, true)
  }

  return {
    currentRoute,
    routes,
    install(app) {
      if (typeof window !== 'undefined') {
        window.addEventListener('popstate', () => {
          applyNavigation(getCurrentPath(), true)
        })
      }

      history.location = currentRoute.path
      app.provide(routerKey, this)
      app.provide(routeKey, currentRoute)
      app.config.globalProperties.$router = this
      app.config.globalProperties.$route = currentRoute
    },
    push(path) {
      applyNavigation(path)
    },
    replace(path) {
      applyNavigation(path, true)
    },
  }
}

export const RouterLink = defineComponent({
  name: 'RouterLink',
  props: {
    to: {
      type: String as PropType<string>,
      required: true,
    },
  },
  setup(props, { slots, attrs }) {
    const router = inject(routerKey)
    const route = inject(routeKey)

    if (!router || !route) {
      throw new Error('RouterLink requires a router instance.')
    }

    const isActive = computed(() => route.path === props.to)

    function navigate(event: MouseEvent): void {
      if (event.defaultPrevented || event.button !== 0) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      event.preventDefault()
      router.push(props.to)
    }

    return () =>
      h(
        'a',
        {
          ...attrs,
          href: props.to,
          'aria-current': isActive.value ? 'page' : undefined,
          onClick: navigate,
        },
        slots.default?.(),
      )
  },
})

export const RouterView = defineComponent({
  name: 'RouterView',
  setup() {
    const router = inject(routerKey)
    const route = inject(routeKey)

    if (!router || !route) {
      throw new Error('RouterView requires a router instance.')
    }

    return () => {
      const matchedRoute = resolveRouteRecord(route.path, router.routes)
      return matchedRoute?.component ? h(matchedRoute.component) : null
    }
  },
})

export function useRoute(): RouteLocationNormalizedLoaded {
  const route = inject(routeKey)

  if (!route) {
    throw new Error('useRoute must be used after installing the router.')
  }

  return route
}

export function useRouter(): Router {
  const router = inject(routerKey)

  if (!router) {
    throw new Error('useRouter must be used after installing the router.')
  }

  return router
}
